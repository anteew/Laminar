# Setting Up Laminar as an MCP Server

This guide explains how to set up Laminar as an MCP (Model Context Protocol) server for use with Claude Desktop, Cline, and other MCP clients.

## What You Get

Once configured, AI assistants can:
- List all your test projects
- Run tests
- View test results and summaries
- Generate failure analysis digests
- Query test trends and history
- Compare test runs
- All without leaving the chat interface!

## Quick Setup (Using the Repo)

Since Laminar isn't published to npm yet, you'll run it directly from the repository.

### 1. Clone and Build Laminar

```bash
# Clone the repository
git clone https://github.com/anteew/Laminar.git
cd Laminar

# Install dependencies and build
npm install
npm run build

# Verify the MCP server exists
ls dist/scripts/mcp-server.js
```

### 2. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add Laminar to the `mcpServers` section:

```json
{
  "mcpServers": {
    "laminar": {
      "command": "node",
      "args": [
        "/absolute/path/to/Laminar/dist/scripts/mcp-server.js"
      ]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/Laminar` with the actual path where you cloned Laminar.

For example:
- macOS/Linux: `"/Users/dan/projects/Laminar/dist/scripts/mcp-server.js"`
- Windows: `"C:\\Users\\dan\\projects\\Laminar\\dist\\scripts\\mcp-server.js"`

### 3. Restart Claude Desktop

Completely quit and restart Claude Desktop for the changes to take effect.

### 4. Verify It's Working

Start a new chat in Claude Desktop and ask:

> "What MCP tools do you have available?"

You should see Laminar tools listed, including:
- `workspace.roots.list`
- `run`
- `summary`
- `show`
- `digest.generate`
- `diff.get`
- `trends.query`
- `rules.get`
- `rules.set`

## Using Laminar with Claude

### Register Your Test Projects

First, register your projects so Claude can reference them easily:

> "Use the workspace.root.register tool to register my project at /Users/dan/projects/myapp with id 'myapp'"

### Run Tests

> "Run tests for the myapp project"

> "Run tests with filter 'auth.*' in CI lane"

### View Results

> "Show me the test summary for myapp"

> "What tests failed in the last run?"

### Analyze Failures

> "Generate digests for all failed tests"

> "Show me details for the test case auth.spec/login_with_invalid_credentials"

### Track Trends

> "What are the top 10 failing tests in the last week?"

> "Show me test trends for myapp since October 1st"

## Advanced Configuration

### Using npx (Future)

Once Laminar is published to npm, you'll be able to use:

```json
{
  "mcpServers": {
    "laminar": {
      "command": "npx",
      "args": [
        "-y",
        "@agent_vega/laminar",
        "laminar-mcp"
      ]
    }
  }
}
```

This will automatically download and run the latest version.

### Using Global Install (Future)

Or install globally:

```bash
npm install -g @agent_vega/laminar
```

Then configure:

```json
{
  "mcpServers": {
    "laminar": {
      "command": "laminar-mcp"
    }
  }
}
```

### Environment Variables

You can pass environment variables to configure default behavior:

```json
{
  "mcpServers": {
    "laminar": {
      "command": "node",
      "args": ["/path/to/Laminar/dist/scripts/mcp-server.js"],
      "env": {
        "LAMINAR_PROJECT": "myapp",
        "LAMINAR_DEBUG": "1"
      }
    }
  }
}
```

## Troubleshooting

### Server Not Appearing

**Check the logs**: Claude Desktop logs MCP server output. On macOS, check:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Common issues**:
- Path to `mcp-server.js` is wrong (must be absolute)
- Laminar wasn't built (`npm run build`)
- JSON syntax error in config file

### Tools Not Working

**Project not registered**: Most tools require a project. Register it first:

> "Register my project at /path/to/project with id 'myproject'"

**Reports directory doesn't exist**: Run tests at least once to generate artifacts:

> "Run tests for myproject"

### Permission Errors

The MCP server runs with your user permissions. Ensure:
- You can read/write to project directories
- Test reports directory is accessible
- Registry at `~/.laminar/registry.json` is writable

## Using with Other MCP Clients

### Cline (VS Code Extension)

Add to Cline's MCP settings:

```json
{
  "laminar": {
    "command": "node",
    "args": ["/path/to/Laminar/dist/scripts/mcp-server.js"]
  }
}
```

### Custom MCP Client

The server implements the MCP stdio protocol. To integrate:

```javascript
import { spawn } from 'child_process';

const server = spawn('node', [
  '/path/to/Laminar/dist/scripts/mcp-server.js'
]);

// Send JSON-RPC messages via stdin
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {}
}) + '\n');

// Read responses from stdout
server.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  console.log(response);
});
```

## Complete Example Workflow

Here's a typical workflow with Claude Desktop:

### 1. Initial Setup

**You**: "Register my backend project at /Users/dan/projects/api with id 'backend-api'"

**Claude**: Uses `workspace.root.register` tool  
✅ Registered project: backend-api

### 2. Run Tests

**You**: "Run the tests"

**Claude**: Uses `run` tool with project: 'backend-api'  
✅ Tests completed

### 3. Check Results

**You**: "How many tests passed and failed?"

**Claude**: Uses `summary` tool  
Found 248 tests: 245 passed, 3 failed

### 4. Investigate Failures

**You**: "What failed?"

**Claude**: Parses summary results  
Failed tests:
- auth.spec/login_with_expired_token
- db.spec/connection_timeout
- api.spec/rate_limit_handling

### 5. Deep Dive

**You**: "Generate a digest for the auth login failure"

**Claude**: Uses `digest.generate` tool  
✅ Generated digest

**You**: "Show me the details"

**Claude**: Uses `show` tool with case: 'auth.spec/login_with_expired_token'  
Shows events, suspects, code frames, and hints

### 6. Historical Context

**You**: "Is this a new failure or has it been happening?"

**Claude**: Uses `trends.query` tool  
This test has failed 5 times in the last week (started appearing 3 days ago)

## Tips for AI Assistants

**Start with Project Registration**: Before running tests or viewing results, register the project so subsequent commands are simpler.

**Use Project IDs**: Once registered, use the short ID instead of full paths:
```
# Good
{ "project": "myapp" }

# Verbose
{ "root": "/Users/dan/projects/myapp" }
```

**Progressive Disclosure**: Start with `summary` to get an overview, then use `show` and `digest.generate` only for failures.

**Token Efficiency**: The `summary` tool returns minimal data. Only request digests when you need detailed analysis.

**Batch Operations**: Use `digest.generate` without the `cases` parameter to analyze all failures at once.

## What's Next?

Once you've set up Laminar as an MCP server:

1. **Read the [MCP Integration Guide](./mcp-integration.md)** for detailed tool documentation
2. **Check the [CLI Guide](./cli-guide.md)** to understand what each tool does
3. **Review [Architecture](./architecture.md)** to understand the artifact structure

## Getting Help

**Issue**: MCP server won't start  
**Solution**: Check that Node.js is in your PATH and the build completed successfully

**Issue**: Tools return "project not found"  
**Solution**: Register the project first using `workspace.root.register`

**Issue**: Empty test results  
**Solution**: Run tests at least once to generate artifacts

**Issue**: Want to add custom tools  
**Solution**: See [Development Guide](./development-guide.md) for extending the MCP server

For more help, open an issue on [GitHub](https://github.com/anteew/Laminar/issues).
