#!/usr/bin/env node

// Post-installation instructions for Laminar MCP server setup

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.log(`
${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
${GREEN}${BOLD}✓ Laminar installed successfully!${RESET}
${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}

${BLUE}${BOLD}Next Steps: Set up as MCP Server${RESET}

${YELLOW}${BOLD}For Claude Code CLI:${RESET}

  1. Add Laminar as a user-scoped MCP server:
     ${BOLD}claude mcp add --scope user laminar npx laminar-mcp${RESET}

  2. Verify it's registered:
     ${BOLD}claude mcp list${RESET}

  3. Start a new conversation - Laminar tools will be available!

${YELLOW}${BOLD}For Claude Desktop:${RESET}

  1. Edit your Claude Desktop config:
     • macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
     • Windows: %APPDATA%\\Claude\\claude_desktop_config.json
     • Linux: ~/.config/Claude/claude_desktop_config.json

  2. Add this configuration:
     ${BOLD}{
       "mcpServers": {
         "laminar": {
           "command": "npx",
           "args": ["laminar-mcp"]
         }
       }
     }${RESET}

  3. Restart Claude Desktop completely

${BLUE}${BOLD}Available Tools:${RESET}
  • workspace.roots.list    - List registered test projects
  • run                     - Execute tests
  • summary                 - View test results
  • digest.generate         - Analyze failures
  • trends.query            - Track test history
  • And more!

${BLUE}${BOLD}Documentation:${RESET}
  • MCP Setup Guide: ${BOLD}docs/mcp-setup.md${RESET}
  • CLI Guide: ${BOLD}docs/cli-guide.md${RESET}
  • GitHub: ${BOLD}https://github.com/anteew/Laminar${RESET}

${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
`);
