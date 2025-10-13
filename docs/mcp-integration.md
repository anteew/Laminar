# Laminar MCP Integration

This guide explains how to use Laminar with the Model Context Protocol (MCP), enabling AI agents to interact with test observability data.

## What is MCP?

The Model Context Protocol provides a standardized way for AI systems to access tools and resources. Laminar's MCP server exposes test observability functionality as callable tools that AI agents can use to understand, debug, and analyze test failures.

## Benefits for AI Agents

**Token Efficiency**: AI agents can query specific test data without reading entire log files, minimizing token consumption while maximizing information value.

**Structured Responses**: All tool outputs follow consistent schemas, making them easy for agents to parse and reason about.

**Project Aliases**: Agents can reference projects by short IDs instead of full filesystem paths, simplifying commands.

**Failure Analysis**: Built-in digest generation and suspect identification help agents quickly understand why tests failed.

**Cross-Language Support**: Agents can analyze tests from different languages (TypeScript, Go, Python) using the same tools.

## Available Tools

### Workspace Management

#### workspace.roots.list

Lists all registered projects.

**Input**: None

**Output**:
```json
{
  "projects": [
    {
      "id": "backend-api",
      "root": "/home/user/projects/api",
      "configPath": "/home/user/projects/api/laminar.config.json",
      "reportsDir": "reports",
      "historyPath": "reports/history.jsonl"
    }
  ]
}
```

**Use Case**: Agent wants to discover available projects to analyze.

#### workspace.root.register

Registers a project for easy reference.

**Input**:
```json
{
  "id": "myapp",
  "root": "/home/user/projects/myapp",
  "configPath": "/home/user/projects/myapp/laminar.config.json",
  "reportsDir": "test-results",
  "historyPath": "test-results/history.jsonl"
}
```

**Output**:
```json
{
  "id": "myapp",
  "root": "/home/user/projects/myapp"
}
```

**Use Case**: Agent sets up a new project for monitoring.

#### workspace.root.remove

Removes a project from the registry.

**Input**:
```json
{
  "id": "old-project"
}
```

**Output**:
```json
{
  "removed": true
}
```

**Use Case**: Agent cleans up unused projects.

#### workspace.root.show

Shows details for a specific project.

**Input**:
```json
{
  "id": "myapp"
}
```

**Output**:
```json
{
  "id": "myapp",
  "root": "/home/user/projects/myapp",
  "configPath": "/home/user/projects/myapp/laminar.config.json",
  "reportsDir": "reports",
  "historyPath": "reports/history.jsonl",
  "tags": ["backend"],
  "createdAt": "2025-10-12T10:30:00Z"
}
```

**Use Case**: Agent retrieves project metadata.

### Test Execution

#### run

Executes tests with Laminar instrumentation.

**Input**:
```json
{
  "project": "backend-api",
  "lane": "ci",
  "filter": "auth.*"
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `root` (optional): Explicit project root path
- `lane` (optional): Test lane (`ci`, `pty`, `auto`)
- `filter` (optional): Test name filter pattern

**Output**:
```json
{
  "status": "ok",
  "lane": "ci",
  "warnings": []
}
```

**Use Case**: Agent triggers test execution after code changes.

### Test Analysis

#### summary

Returns test results from the latest run.

**Input**:
```json
{
  "project": "backend-api"
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `root` (optional): Explicit project root path
- `reports` (optional): Custom reports directory

**Output**:
```json
{
  "entries": [
    {
      "testName": "login with valid credentials",
      "status": "pass",
      "duration": 142,
      "location": "tests/auth.spec.ts:23",
      "timestamp": "2025-10-13T10:30:00Z",
      "artifacts": {
        "summary": "reports/summary.jsonl",
        "caseFile": "reports/auth.spec/login_with_valid_credentials.jsonl"
      }
    },
    {
      "testName": "login with invalid credentials",
      "status": "fail",
      "duration": 89,
      "location": "tests/auth.spec.ts:45",
      "timestamp": "2025-10-13T10:30:01Z",
      "artifacts": {
        "summary": "reports/summary.jsonl",
        "caseFile": "reports/auth.spec/login_with_invalid_credentials.jsonl",
        "digestFile": "reports/auth.spec/login_with_invalid_credentials.digest.json"
      }
    }
  ],
  "warnings": []
}
```

**Use Case**: Agent scans for test failures after a run.

**Token Optimization**: Agent can count failures with minimal data transfer:
```
entries.filter(e => e.status === 'fail').length
```

#### show

Returns a sliced view of test events around a specific pattern.

**Input**:
```json
{
  "project": "backend-api",
  "case": "auth.spec/login_with_invalid_credentials",
  "around": "401",
  "window": 20
}
```

**Parameters**:
- `case` (required): Test case identifier (`suite/case`)
- `project` (optional): Registered project ID
- `around` (optional): Pattern to center on (default: `assert.fail`)
- `window` (optional): Events before/after match (default: 50)

**Output**:
```json
{
  "slice": [
    "{\"ts\":1760290661027,\"lvl\":\"info\",\"case\":\"login with invalid credentials\",\"phase\":\"execution\",\"evt\":\"test.run\"}",
    "{\"ts\":1760290661029,\"lvl\":\"error\",\"case\":\"login with invalid credentials\",\"phase\":\"execution\",\"evt\":\"test.error\",\"payload\":{\"message\":\"Expected 200, got 401\"}}",
    "{\"ts\":1760290661030,\"lvl\":\"error\",\"case\":\"login with invalid credentials\",\"phase\":\"teardown\",\"evt\":\"case.end\",\"payload\":{\"status\":\"failed\",\"duration\":89}}"
  ],
  "start": 0,
  "end": 3
}
```

**Use Case**: Agent drills into specific failure details.

**Token Optimization**: Window size controls how much data is returned. Start with small windows and expand if needed.

#### digest.generate

Generates failure analysis digests for failed tests.

**Input**:
```json
{
  "project": "backend-api",
  "cases": ["auth.spec/login_test", "db.spec/timeout_test"]
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `cases` (optional): Specific test cases (default: all failures)

**Output**:
```json
{
  "generated": [
    "reports/auth.spec/login_test.digest.json",
    "reports/db.spec/timeout_test.digest.json"
  ]
}
```

**Use Case**: Agent requests focused failure analysis.

**Follow-up**: After digest generation, agent can read digest files directly or use other tools to query them.

#### diff.get

Compares two digest files to identify changes.

**Input**:
```json
{
  "left": "reports/auth.spec/login_test.digest.json",
  "right": "reports/auth.spec/login_test_v2.digest.json",
  "format": "markdown"
}
```

**Parameters**:
- `left` (required): Path to first digest
- `right` (required): Path to second digest
- `format` (optional): Output format (`json` or `markdown`, default: `json`)

**Output** (markdown format):
```json
{
  "output": "# Digest Comparison\n\n## Events\n\n### Left\n- Event 1\n- Event 2\n\n### Right\n- Event 1\n- Event 3\n\n## Differences\n- Event 2 removed\n- Event 3 added\n"
}
```

**Use Case**: Agent compares test behavior across runs or code changes.

#### trends.query

Analyzes failure history to identify patterns.

**Input**:
```json
{
  "project": "backend-api",
  "since": "2025-10-06T00:00:00Z",
  "until": "2025-10-13T23:59:59Z",
  "top": 10
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `history` (optional): Custom history file path
- `since` (optional): Start timestamp (ISO 8601)
- `until` (optional): End timestamp (ISO 8601)
- `top` (optional): Number of top failures to return (default: 10)

**Output**:
```json
{
  "total": 248,
  "failures": 42,
  "top": 10
}
```

**Use Case**: Agent identifies frequently failing tests.

### Configuration

#### rules.get

Returns current digest rules configuration.

**Input**:
```json
{
  "project": "backend-api"
}
```

**Parameters**:
- `project` (optional): Registered project ID

**Output**:
```json
{
  "config": {
    "enabled": true,
    "budget": {
      "kb": 10,
      "lines": 200
    },
    "rules": [
      {
        "match": { "lvl": "error" },
        "actions": [
          { "type": "include" },
          { "type": "codeframe", "contextLines": 2 }
        ],
        "priority": 10
      }
    ]
  }
}
```

**Use Case**: Agent checks current digest configuration.

#### rules.set

Updates digest rules configuration.

**Input (from file)**:
```json
{
  "project": "backend-api",
  "file": "/path/to/rules.json"
}
```

**Input (inline)**:
```json
{
  "project": "backend-api",
  "inline": {
    "enabled": true,
    "rules": [
      {
        "match": { "evt": "db.query.slow" },
        "actions": [{ "type": "include" }],
        "priority": 9
      }
    ]
  }
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `file` (optional): Path to rules file
- `inline` (optional): Inline rules object

**Output**:
```json
{
  "updated": "/home/user/projects/api/laminar.config.json"
}
```

**Use Case**: Agent customizes digest rules based on observed patterns.

### Utility

#### readme.get

Returns a compact overview of Laminar MCP capabilities.

**Input**: None

**Output**:
```json
{
  "title": "Laminar MCP",
  "overview": "Laminar: agent-first test observability. Use project aliases instead of full paths; registry lives at ~/.laminar/registry.json. Core flow: run → summary → show/digest/trends. All tools accept {project}|{root,config,reports,history}.",
  "registryPath": "/home/user/.laminar/registry.json",
  "commands": [
    "workspace.roots.list",
    "workspace.root.register { id, root, configPath?, reportsDir?, historyPath? }",
    "run { project?, lane?, filter? }",
    "summary { project? }",
    "show { project?, case, around?, window? }",
    "digest.generate { project?, cases? }",
    "diff.get { project?, left, right, format? }",
    "trends.query { project?, since?, until?, top? }",
    "rules.get { project? }",
    "rules.set { project?, inline? | file? }"
  ]
}
```

**Use Case**: Agent discovers available MCP tools and their usage.

## Common Agent Workflows

### Initial Project Discovery

```javascript
// 1. Get overview
const readme = await mcp.call('readme.get', {});
console.log(readme.overview);

// 2. List registered projects
const { projects } = await mcp.call('workspace.roots.list', {});
if (projects.length === 0) {
  // 3. Register current project
  await mcp.call('workspace.root.register', {
    id: 'myapp',
    root: process.cwd()
  });
}
```

### Failure Investigation

```javascript
// 1. Get test summary
const { entries } = await mcp.call('summary', { project: 'myapp' });

// 2. Identify failures
const failures = entries.filter(e => e.status === 'fail');
console.log(`Found ${failures.length} failures`);

// 3. Generate digests
await mcp.call('digest.generate', {
  project: 'myapp',
  cases: failures.map(f => `${f.suite}/${f.case}`)
});

// 4. Read digest for detailed analysis
// (Agent reads digest.json file directly)
```

### Continuous Monitoring

```javascript
// 1. Run tests
await mcp.call('run', {
  project: 'backend-api',
  lane: 'ci'
});

// 2. Check summary
const { entries } = await mcp.call('summary', {
  project: 'backend-api'
});

// 3. If failures exist, analyze trends
const failures = entries.filter(e => e.status === 'fail');
if (failures.length > 0) {
  const trends = await mcp.call('trends.query', {
    project: 'backend-api',
    top: 5
  });
  
  // Agent reports frequently failing tests
}
```

### Regression Detection

```javascript
// 1. Compare current digest with baseline
const diff = await mcp.call('diff.get', {
  left: 'baseline/auth.spec/login_test.digest.json',
  right: 'current/auth.spec/login_test.digest.json',
  format: 'json'
});

// 2. Parse diff to identify new issues
// Agent analyzes structural changes in events, suspects, or codeframes
```

### Adaptive Rule Configuration

```javascript
// 1. Get current rules
const { config } = await mcp.call('rules.get', {
  project: 'myapp'
});

// 2. Analyze test patterns
const { entries } = await mcp.call('summary', { project: 'myapp' });
// Agent identifies common event types in failures

// 3. Update rules to capture relevant events
const newRules = [
  ...config.rules,
  {
    match: { evt: 'db.connection.timeout' },
    actions: [
      { type: 'include' },
      { type: 'slice', window: 15 }
    ],
    priority: 8
  }
];

await mcp.call('rules.set', {
  project: 'myapp',
  inline: { ...config, rules: newRules }
});
```

## Integration Examples

### Node.js Agent

```typescript
import { createLaminarServer } from '@agent_vega/laminar';

const server = createLaminarServer();

// List available tools
const tools = server.listTools();
console.log('Available tools:', tools);

// Execute a tool
const result = await server.call('summary', {
  project: 'backend-api'
});

console.log(`Test results: ${result.entries.length} tests`);
const failures = result.entries.filter(e => e.status === 'fail');
console.log(`Failures: ${failures.length}`);
```

### Custom MCP Server

```typescript
import { createLaminarServer, LaminarMcpServer } from '@agent_vega/laminar';

const laminar = createLaminarServer();

// Add custom tool that uses Laminar
laminar.addTool({
  name: 'analyze.failures',
  description: 'Analyze all failures and provide recommendations',
  handler: async (input: { project: string }) => {
    // Get summary
    const { entries } = await laminar.call('summary', input);
    
    // Filter failures
    const failures = entries.filter(e => e.status === 'fail');
    
    // Generate digests
    await laminar.call('digest.generate', {
      project: input.project,
      cases: failures.map(f => `${extractSuite(f)}/${extractCase(f)}`)
    });
    
    // Return analysis
    return {
      totalFailures: failures.length,
      digestsGenerated: failures.length,
      recommendation: 'Review digest files for detailed analysis'
    };
  }
});

// Use the custom tool
const analysis = await laminar.call('analyze.failures', {
  project: 'backend-api'
});
```

### Multi-Project Monitoring

```typescript
import { createLaminarServer } from '@agent_vega/laminar';

const server = createLaminarServer();

async function monitorAllProjects() {
  const { projects } = await server.call('workspace.roots.list', {});
  
  for (const project of projects) {
    console.log(`\nMonitoring: ${project.id}`);
    
    // Get summary
    const { entries } = await server.call('summary', {
      project: project.id
    });
    
    const failures = entries.filter(e => e.status === 'fail');
    console.log(`  Tests: ${entries.length}, Failures: ${failures.length}`);
    
    // Generate digests for failures
    if (failures.length > 0) {
      await server.call('digest.generate', {
        project: project.id
      });
    }
  }
}

// Run monitoring
await monitorAllProjects();
```

## Best Practices for Agents

### Token Efficiency

**Start Narrow**: Use `summary` to identify failures before requesting detailed data.

**Window Sizing**: Start with small windows in `show` calls (e.g., 10 events) and expand only if needed.

**Digest First**: Generate digests instead of reading raw JSONL files, as digests are filtered and smaller.

**Project Aliases**: Use registered project IDs instead of full paths to reduce input token count.

### Error Handling

**Check Warnings**: Always inspect the `warnings` field in responses to catch configuration conflicts.

**Graceful Degradation**: If a tool fails, try alternative approaches (e.g., if `project` doesn't exist, use `root` instead).

**Validate Inputs**: Ensure case identifiers follow the `suite/case` format.

### Progressive Disclosure

**Overview First**: Use `readme.get` to understand available tools.

**Summary Before Details**: Always check `summary` before diving into specific tests.

**Trends for Context**: Use `trends.query` to understand if a failure is new or recurring.

### Configuration Management

**Read Before Write**: Always call `rules.get` before `rules.set` to preserve existing rules.

**Incremental Updates**: Add new rules rather than replacing entire config.

**Validate JSON**: Ensure inline JSON is valid before calling `rules.set`.

## Troubleshooting

### Project Not Found

**Error**: `Unknown project: myapp`

**Solution**: Register the project first:
```javascript
await server.call('workspace.root.register', {
  id: 'myapp',
  root: '/path/to/project'
});
```

### No Test Results

**Error**: Summary returns empty `entries` array

**Solution**: Run tests first:
```javascript
await server.call('run', { project: 'myapp' });
```

### Case Not Found

**Error**: `case file not found`

**Solution**: Verify case identifier format:
```javascript
// Correct: suite/case with underscores
await server.call('show', {
  case: 'auth.spec/login_with_invalid_credentials'
});

// Wrong: spaces in case name
// case: 'auth.spec/login with invalid credentials'
```

### Digest Not Generated

**Error**: Digest file doesn't exist after `digest.generate`

**Solution**: Check if test actually failed and digests are enabled:
```javascript
const { config } = await server.call('rules.get', {
  project: 'myapp'
});
console.log('Digests enabled:', config.enabled);
```

## Advanced Topics

### Custom Event Patterns

If your tests emit custom events, configure rules to capture them:

```javascript
await server.call('rules.set', {
  project: 'myapp',
  inline: {
    rules: [
      {
        match: { evt: 'custom.metric.exceeded' },
        actions: [
          { type: 'include' },
          { type: 'slice', window: 20 }
        ],
        priority: 8
      }
    ]
  }
});
```

### Cross-Language Testing

Monitor tests from multiple languages:

```javascript
// Register language-specific projects
await server.call('workspace.root.register', {
  id: 'backend-go',
  root: '/projects/backend',
  tags: ['go']
});

await server.call('workspace.root.register', {
  id: 'frontend-ts',
  root: '/projects/frontend',
  tags: ['typescript']
});

// Query both
const goResults = await server.call('summary', { project: 'backend-go' });
const tsResults = await server.call('summary', { project: 'frontend-ts' });
```

### Historical Analysis

Track test health over time:

```javascript
// Query last 30 days
const trends = await server.call('trends.query', {
  project: 'myapp',
  since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  top: 20
});

// Identify chronic failures
// (tests that fail frequently over time)
```

## Security Considerations

**Registry Access**: The project registry at `~/.laminar/registry.json` contains filesystem paths. Ensure agents have appropriate permissions.

**File Paths**: Agents can access any file paths specified in digest/diff operations. Validate paths to prevent unauthorized access.

**Secret Redaction**: Laminar automatically redacts common secrets (API keys, tokens, etc.) in digests. Verify redaction is enabled:
```javascript
const { config } = await server.call('rules.get', { project: 'myapp' });
console.log('Redaction enabled:', config.redaction?.enabled !== false);
```

## Future Enhancements

Potential MCP tool additions:

**Real-time Streaming**: Subscribe to test events as they occur

**Visual Diffing**: Compare screenshots/snapshots between runs

**ML-Based Hints**: AI-generated triage suggestions based on patterns

**Test Generation**: Create new tests based on failure patterns

**Performance Analysis**: Query test duration trends and detect slowdowns
