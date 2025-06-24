#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { SharedLogBuffer } from './core/shared-log-buffer';

const LOG_SERVER_PORT = 24281;
const sharedBuffer = new SharedLogBuffer(10000, LOG_SERVER_PORT);

// Start HTTP server for log ingestion
const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/logs', (req, res) => {
  const { content, level, source } = req.body;
  
  if (content && level) {
    sharedBuffer.add(content, level, source);
  }
  
  res.status(200).send('OK');
});

// API endpoints for querying logs
app.get('/api/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const level = req.query.level as 'stdout' | 'stderr' | undefined;
  const search = req.query.search as string | undefined;
  const sinceMinutes = req.query.since_minutes ? parseFloat(req.query.since_minutes as string) : undefined;
  
  const since = sinceMinutes 
    ? new Date(Date.now() - sinceMinutes * 60 * 1000)
    : undefined;

  const logs = sharedBuffer.getLocalBuffer().get({ limit, level, search, since });
  res.json(logs);
});

app.get('/api/stats', (req, res) => {
  const stats = sharedBuffer.getLocalBuffer().getStats();
  res.json(stats);
});

app.delete('/api/logs', (req, res) => {
  sharedBuffer.getLocalBuffer().clear();
  res.status(200).send('OK');
});

// Only start HTTP server if not already running
const httpServer = app.listen(LOG_SERVER_PORT, () => {
  // Use stderr to avoid interfering with MCP protocol on stdout
  process.stderr.write(`Clogcast HTTP server listening on port ${LOG_SERVER_PORT}\n`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    // Port already in use, this is fine - another instance is handling HTTP
    process.stderr.write(`Clogcast HTTP server already running on port ${LOG_SERVER_PORT}\n`);
  } else {
    process.stderr.write(`HTTP server error: ${err.message}\n`);
  }
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'get_logs',
    description: 'Retrieve logs from clogcast buffer',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of log entries to return (most recent)'
        },
        level: {
          type: 'string',
          enum: ['stdout', 'stderr'],
          description: 'Filter by log level'
        },
        search: {
          type: 'string',
          description: 'Search for logs containing this text (case-insensitive)'
        },
        since_minutes: {
          type: 'number',
          description: 'Only return logs from the last N minutes'
        }
      }
    }
  },
  {
    name: 'clear_logs',
    description: 'Clear all logs from the buffer',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_log_stats',
    description: 'Get statistics about the current log buffer',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'clogcast',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_logs': {
      const limit = args?.limit as number | undefined;
      const level = args?.level as 'stdout' | 'stderr' | undefined;
      const search = args?.search as string | undefined;
      const sinceMinutes = args?.since_minutes as number | undefined;

      const since = sinceMinutes 
        ? new Date(Date.now() - sinceMinutes * 60 * 1000)
        : undefined;

      const logs = await sharedBuffer.get({ limit, level, search, since });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(logs, null, 2),
          },
        ],
      };
    }

    case 'clear_logs': {
      await sharedBuffer.clear();
      return {
        content: [
          {
            type: 'text',
            text: 'Log buffer cleared successfully',
          },
        ],
      };
    }

    case 'get_log_stats': {
      const stats = await sharedBuffer.getStats();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start MCP server
const transport = new StdioServerTransport();
server.connect(transport);

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});