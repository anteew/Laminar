#!/usr/bin/env node
/**
 * MCP Server for Laminar
 *
 * This script provides a stdio-based MCP server that exposes Laminar's
 * test observability tools to AI agents like Claude Desktop.
 *
 * Usage:
 *   node dist/scripts/mcp-server.js
 *
 * For Claude Desktop, add to ~/Library/Application Support/Claude/claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "laminar": {
 *       "command": "node",
 *       "args": ["/path/to/Laminar/dist/scripts/mcp-server.js"]
 *     }
 *   }
 * }
 */
export {};
//# sourceMappingURL=mcp-server.d.ts.map