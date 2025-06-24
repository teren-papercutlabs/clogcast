# Clogcast

Zero-config log sharing for AI coding assistants - makes any application's logs visible to Claude Code and Cursor.

## What is Clogcast?

When using AI coding tools like Claude Code or Cursor, developers have traditionally needed to copy and paste terminal output to share error messages and logs with the AI assistant. This manual process interrupts the development flow and prevents the AI from autonomously detecting and fixing issues.

Clogcast solves this by transparently capturing your application's output and making it available to AI assistants through the Model Context Protocol (MCP). Simply prefix any command with `clogcast` and your AI assistant can read the logs directly, enabling it to understand what's happening and self-correct errors without manual intervention.

```bash
# Before (manually copy/paste logs to AI)
npm run dev

# After (AI reads logs directly)
clogcast npm run dev
```

## Features

- **Zero Configuration**: Just prefix your command with `clogcast`
- **Universal**: Works with any command or application
- **Transparent**: Your terminal experience remains unchanged
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Shared Buffer**: All AI assistant instances can access the same logs

## Installation

### Global Installation (Recommended)

```bash
npm install -g clogcast
```

### Add to Claude Code

Add the following to your `.mcp.json` file:

```json
{
  "mcpServers": {
    "clogcast": {
      "command": "node",
      "args": ["/path/to/global/node_modules/clogcast/dist/mcp-server.js"]
    }
  }
}
```

To find the path to your global installation:
```bash
npm list -g clogcast
```

## Usage

### Important Note

**Claude Code users**: You must start Claude Code first before running any `clogcast` commands. Claude Code loads MCP servers on startup.

**Cursor users**: MCP servers load automatically when the IDE starts, so you can use `clogcast` immediately.

### Basic Usage

Simply prefix any command with `clogcast`:

```bash
# Node.js applications
clogcast npm run dev
clogcast npm test

# Python applications
clogcast python app.py
clogcast pytest
```

### Using with Claude Code

Once your application is running with clogcast, you can ask Claude Code to examine the logs. For example:

- "Can you check the logs for any errors?"
- "What's causing the database connection to fail?"
- "Show me the recent API requests in the logs"

Claude Code can automatically filter logs by:
- Error output (stderr)
- Time range (e.g., last 5 minutes)
- Search terms (e.g., "error", "warning", "failed")
- Number of recent entries

## How It Works

1. **Process Wrapping**: Clogcast spawns your command as a child process
2. **Output Capture**: Stdout and stderr are captured in real-time
3. **Terminal Pass-through**: All output is displayed in your terminal as normal
4. **HTTP Ingestion**: Logs are sent to a local HTTP server (port 24281)
5. **MCP Integration**: Claude Code accesses logs via MCP tools
6. **Ring Buffer**: Last 10,000 log entries are kept in memory

## Architecture

```
Terminal → clogcast → Your App
            ↓
         HTTP POST
            ↓
      MCP Server ← Claude Code
```

## MCP Tools

### get_logs

Retrieve logs from the buffer with optional filtering:

- `limit`: Maximum number of entries to return
- `level`: Filter by 'stdout' or 'stderr'
- `search`: Case-insensitive text search
- `since_minutes`: Only logs from the last N minutes

### get_log_stats

Get statistics about the current log buffer:

- Total number of entries
- Count of stdout vs stderr entries
- Buffer capacity
- Timestamp of oldest and newest entries

### clear_logs

Clear all logs from the buffer.

## Advanced Features

### Signal Handling

Clogcast properly forwards all signals to the wrapped application:
- SIGTERM, SIGINT, SIGQUIT, SIGHUP are forwarded
- Exit codes are preserved

### Error Resilience

- Network errors are silently ignored
- MCP server crashes don't affect your application
- Fire-and-forget design ensures zero performance impact

### Cross-Platform Support

- Uses `cross-spawn` for reliable process spawning
- Handles platform-specific shell differences
- Works with spaces and special characters in commands

## Troubleshooting

### Logs not appearing in Claude

1. Ensure clogcast is in your `.mcp.json`
2. Restart Claude Code after configuration changes
3. Check that the wrapped command is actually producing output

### Port 24281 already in use

This usually means another clogcast instance is running, which is fine! All instances share the same log buffer.

### Command not found

Make sure to install clogcast globally with `-g` flag, or add the local installation to your PATH.

## License

MIT © Papercut Labs