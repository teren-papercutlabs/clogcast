# CLAUDE.md - Clogcast Development Notes

## Publishing Checklist

Before publishing a new version of clogcast to npm:

1. **Update Version Number**
   - Update version in `package.json`
   - Follow semantic versioning (major.minor.patch)

2. **Update Documentation**
   - [ ] Update `CHANGELOG.md` with all changes for the new version
   - [ ] Update `README.md` if there are new features or API changes
   - [ ] Ensure all examples in README are tested and working

3. **Test Everything**
   - [ ] Run `npm test` (when tests are added)
   - [ ] Test CLI functionality: `node dist/cli.js echo "test"`
   - [ ] Test MCP server integration with Claude Code
   - [ ] Test shared buffer functionality with multiple instances
   - [ ] Verify cross-platform compatibility

4. **Build and Verify**
   - [ ] Run `npm run build`
   - [ ] Check that `dist/` folder contains all compiled files
   - [ ] Ensure shebang is present in `dist/cli.js`

5. **Git Operations**
   - [ ] Commit all changes
   - [ ] Tag the release: `git tag v1.1.0`
   - [ ] Push tags: `git push --tags`

6. **Publish to npm**
   - [ ] Run `npm publish`
   - [ ] Verify package appears on npmjs.com

## Architecture Notes

### Shared Log Buffer Design
- HTTP server runs on port 24281 and holds the primary log buffer
- Multiple MCP server instances query the HTTP API
- Fallback to local buffer if HTTP server is unavailable
- This enables all Claude Code instances to see the same logs

### MCP Server Communication
- Uses stderr for status messages to avoid stdout interference
- MCP protocol requires clean stdout/stdin communication
- HTTP server handles EADDRINUSE gracefully for multiple instances

## Known Issues

- None currently

## Future Enhancements

- Add authentication for HTTP API endpoints
- Support custom port configuration
- Add log persistence to disk
- Support for structured logging formats
- WebSocket support for real-time log streaming