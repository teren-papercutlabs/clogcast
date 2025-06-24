# Changelog

All notable changes to clogcast will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-06-24

### Added
- Shared log buffer across multiple MCP server instances
- HTTP API endpoints for querying logs programmatically
  - `GET /api/logs` - Query logs with filters (limit, level, search, since_minutes)
  - `GET /api/stats` - Get log buffer statistics
  - `DELETE /api/logs` - Clear the log buffer
- Automatic fallback to local buffer when HTTP server is unavailable
- Terminal color preservation with `FORCE_COLOR=1` environment variable

### Fixed
- MCP connection errors caused by stdout interference
- Multiple MCP server instances now share the same log data
- Terminal colors are now preserved when running commands through clogcast

### Changed
- MCP server now uses stderr for status messages to avoid protocol interference
- Log buffer is now accessible via HTTP API for better multi-instance support

## [1.0.0] - 2025-06-23

### Added
- Initial release of clogcast
- Zero-config log capture for any command
- MCP server integration for Claude Code and Cursor
- Ring buffer storage (10,000 entries)
- Cross-platform support via cross-spawn
- Signal forwarding (SIGTERM, SIGINT, SIGQUIT, SIGHUP)
- Fire-and-forget HTTP log ingestion on port 24281
- MCP tools:
  - `get_logs` - Retrieve logs with filtering options
  - `get_log_stats` - Get buffer statistics
  - `clear_logs` - Clear the log buffer