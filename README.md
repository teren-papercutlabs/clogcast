# Clogcast

Zero-config log sharing for Claude Code - makes any application's logs visible to Claude.

## What is Clogcast?

Clogcast is a transparent command-line wrapper that captures and shares application logs with Claude Code. Simply prefix any command with `clogcast` to make its output available to Claude for debugging and analysis.

```bash
# Before (Claude can't see logs)
npm run dev

# After (Claude can see everything)
clogcast npm run dev
```

## Features

- **Zero Configuration**: Just prefix your command with `clogcast`
- **Universal**: Works with any command or application
- **Transparent**: Your terminal experience remains unchanged
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Fire-and-Forget**: Never blocks or slows down your application
- **Shared Buffer**: All Claude instances can access the same logs

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

### Basic Usage

Simply prefix any command with `clogcast`:

```bash
# Node.js applications
clogcast npm run dev
clogcast npm test
clogcast node server.js

# Python applications
clogcast python app.py
clogcast pytest
clogcast flask run

# Any other command
clogcast docker-compose up
clogcast cargo run
clogcast make build
```

### Using with Claude Code

Once your application is running with clogcast, Claude can access the logs using MCP tools:

```javascript
// Get recent logs
const logs = await mcp.call('get_logs', { limit: 100 });

// Filter by output type
const errors = await mcp.call('get_logs', { level: 'stderr' });

// Search for specific content
const dbLogs = await mcp.call('get_logs', { search: 'database' });

// Get logs from last 5 minutes
const recentLogs = await mcp.call('get_logs', { since_minutes: 5 });

// Get log statistics
const stats = await mcp.call('get_log_stats');

// Clear log buffer
await mcp.call('clear_logs');
```

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

## Examples

### Debugging a Node.js app

```bash
clogcast npm run dev
```

Then in Claude:
```javascript
// Find all error logs
const errors = await mcp.call('get_logs', { search: 'error' });

// Get database connection logs
const dbLogs = await mcp.call('get_logs', { search: 'database' });
```

### Testing with pytest

```bash
clogcast pytest -v
```

In Claude:
```javascript
// Get test failures
const failures = await mcp.call('get_logs', { level: 'stderr' });
```

### Docker compose logs

```bash
clogcast docker-compose up
```

In Claude:
```javascript
// Get logs from specific container
const webLogs = await mcp.call('get_logs', { search: 'web_1' });
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT © Papercut Labs