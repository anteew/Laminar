# Laminar MCP Integration Guide

Complete guide for using Laminar with Claude Code and the Model Context Protocol (MCP).

---

## What is MCP?

**Model Context Protocol** is a standard for exposing tools to AI agents. Laminar provides 11 MCP tools that let Claude Code (and other MCP-compatible agents) interact with test observability features directly.

---

## Setup (One-Time)

### Prerequisites
- Node.js ≥18.0.0
- Claude Code CLI installed
- Laminar installed globally or in a project

### 1. Install Laminar
```bash
# Globally (recommended for MCP)
npm install -g @agent_vega/laminar

# Or per-project
npm install -D @agent_vega/laminar
```

### 2. Register MCP Server
```bash
claude mcp add --scope user laminar npx laminar-mcp
```

This tells Claude Code: "When I need Laminar tools, run `npx laminar-mcp`"

### 3. Verify Registration
```bash
claude mcp list
```

Should show:
```
laminar: npx laminar-mcp (user scope)
```

### 4. Restart Claude Code
**Important**: Fully exit and restart, don't just start a new conversation.

---

## MCP Tools Reference

### 1. `readme.get`
**Purpose**: Learn Laminar workflow and available tools

**Usage**:
```typescript
claude mcp: readme.get
```

**Returns**:
```typescript
{
  title: "Laminar Test Observability",
  why: "Transforms test failures into structured, AI-friendly artifacts...",
  whyLLMsCare: "Save 70-85% of context window...",
  caseStudy: { /* before/after token counts */ },
  quickstart: ["1. Register...", "2. Run...", ...],
  concepts: { digests: "...", rules: "...", budget: "..." },
  commands: [/* All tool signatures */],
  progressivePath: { /* Level 1, 2, 3 guidance */ },
  feedback: "🙏 AI agents encouraged to submit issues..."
}
```

**When to use**: First time using Laminar, or as a refresher

---

### 2. `workspace.root.register`
**Purpose**: Register a project for easy reference

**Usage**:
```typescript
// Auto-generate ID from path
claude mcp: workspace.root.register {
  root: "/srv/repos/myproject"
}

// Specify custom ID
claude mcp: workspace.root.register {
  root: "/srv/repos/myproject",
  id: "myproject"
}

// With custom paths
claude mcp: workspace.root.register {
  root: "/srv/repos/myproject",
  id: "myproject",
  configPath: "/srv/repos/myproject/config/laminar.json",
  reportsDir: "test-reports",
  historyPath: "test-reports/history.jsonl"
}
```

**Returns**:
```typescript
{
  id: "myproject",
  root: "/srv/repos/myproject"
}
```

**When to use**:
- First time working with a project
- Once per project (persists in `~/.laminar/registry.json`)

---

### 3. `workspace.roots.list`
**Purpose**: See all registered projects

**Usage**:
```typescript
claude mcp: workspace.roots.list
```

**Returns**:
```typescript
{
  projects: [
    {
      id: "myproject",
      root: "/srv/repos/myproject",
      configPath: null,
      reportsDir: "reports",
      historyPath: "reports/history.jsonl"
    },
    // ... more projects
  ]
}
```

**When to use**:
- Forgot project ID
- Working with multiple projects
- Verifying registration

---

### 4. `workspace.root.show`
**Purpose**: Get details for a specific project

**Usage**:
```typescript
claude mcp: workspace.root.show { id: "myproject" }
```

**Returns**:
```typescript
{
  id: "myproject",
  root: "/srv/repos/myproject",
  configPath: "/srv/repos/myproject/laminar.config.json",
  reportsDir: "reports",
  historyPath: "reports/history.jsonl"
}
```

**When to use**: Checking project configuration

---

### 5. `workspace.root.remove`
**Purpose**: Unregister a project

**Usage**:
```typescript
claude mcp: workspace.root.remove { id: "myproject" }
```

**Returns**:
```typescript
{
  removed: true
}
```

**When to use**: Project no longer exists, or you want to re-register with different settings

---

### 6. `run`
**Purpose**: Execute tests with Laminar instrumentation

**Usage**:
```typescript
// Use registered project
claude mcp: run { project: "myproject", lane: "auto" }

// Use direct path
claude mcp: run { root: "/srv/repos/myproject", lane: "ci" }

// Filter specific tests
claude mcp: run {
  project: "myproject",
  lane: "auto",
  filter: "auth"
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `root` (optional): Direct path to project
- `lane` (optional): Execution mode
  - `"auto"` (default): Smart detection, reruns failures with debug
  - `"ci"`: Fast CI mode, no debug
  - `"pty"`: PTY mode for terminal tests
- `filter` (optional): Test name pattern (uses vitest `-t` flag)

**Returns**:
```typescript
{
  status: "ok",
  lane: "auto",
  warnings: []
}
```

**When to use**:
- Running tests for the first time
- After making code changes
- Before generating digests

---

### 7. `summary`
**Purpose**: Get pass/fail counts and test list

**Usage**:
```typescript
claude mcp: summary { project: "myproject" }
```

**Returns**:
```typescript
{
  entries: [
    {
      status: "PASS",
      duration: 24,
      location: "tests/auth.spec.ts:10",
      testName: "should authenticate user",
      artifactURI: "reports/auth.spec/should_authenticate_user.jsonl"
    },
    {
      status: "FAIL",
      duration: 102,
      location: "tests/auth.spec.ts:25",
      testName: "should reject expired token",
      artifactURI: "reports/auth.spec/should_reject_expired_token.jsonl",
      artifacts: {
        caseFile: "reports/auth.spec/should_reject_expired_token.jsonl",
        digestFile: "reports/auth.spec/should_reject_expired_token.digest.json"
      }
    }
  ],
  warnings: []
}
```

**Token cost**: ~500 tokens (very efficient)

**When to use**:
- After running tests
- Quick triage: "What failed?"
- Before deciding which failures to investigate

---

### 8. `digest.generate`
**Purpose**: Create failure analysis with suspects & code frames

**Usage**:
```typescript
// Generate digests for all failures
claude mcp: digest.generate { project: "myproject" }

// Generate for specific tests
claude mcp: digest.generate {
  project: "myproject",
  cases: ["auth.spec/should_reject_expired_token", "db.spec/should_timeout"]
}
```

**Returns**:
```typescript
{
  generated: [
    "reports/auth.spec/should_reject_expired_token.digest.json",
    "reports/db.spec/should_timeout.digest.json"
  ]
}
```

**Files created**:
- `.digest.json` - Machine-readable (2-3K tokens)
- `.digest.md` - Human-readable markdown

**When to use**:
- After seeing failures in summary
- Before reading detailed logs
- To get token-efficient failure analysis

---

### 9. `show`
**Purpose**: View detailed JSONL logs for a specific test

**Usage**:
```typescript
// Default: slice around "assert.fail", window: 50
claude mcp: show {
  project: "myproject",
  case: "auth.spec/should_reject_expired_token"
}

// Custom pattern and window
claude mcp: show {
  project: "myproject",
  case: "auth.spec/should_reject_expired_token",
  around: "jwt.error",
  window: 20
}

// See everything
claude mcp: show {
  project: "myproject",
  case: "auth.spec/should_reject_expired_token",
  window: 999
}
```

**Parameters**:
- `project` (optional): Registered project ID
- `case` (required): Test case in format `suite/test_name`
- `around` (optional): Pattern to center on (default: "assert.fail")
- `window` (optional): Lines before/after pattern (default: 50)

**Returns**:
```typescript
{
  slice: [
    '{"ts":1234567890,"lvl":"info","evt":"test.start","case":"should_reject_expired_token"}',
    '{"ts":1234567891,"lvl":"info","evt":"jwt.verify","payload":{"token":"eyJ..."}}',
    '{"ts":1234567892,"lvl":"error","evt":"jwt.expired","payload":{"exp":1234567880}}',
    // ... 47 more lines
  ],
  start: 15,
  end: 65
}
```

**Token cost**: Varies (50-line window ≈ 1,000-2,000 tokens)

**When to use**:
- Digest didn't have enough context
- Need to see test setup/teardown
- Investigating complex failures

---

### 10. `diff.get`
**Purpose**: Compare two digest files

**Usage**:
```typescript
// JSON diff
claude mcp: diff.get {
  left: "reports/auth.spec/test.digest.json",
  right: "reports/auth.spec/test.digest.json.previous",
  format: "json"
}

// Markdown diff (human-readable)
claude mcp: diff.get {
  left: "reports/auth.spec/test.digest.json",
  right: "reports/auth.spec/test.digest.json.previous",
  format: "markdown"
}
```

**Returns**:
```typescript
{
  output: "..." // JSON or markdown diff
}
```

**When to use**:
- Comparing test runs before/after code change
- Seeing if failure changed over time
- Validating fix attempts

---

### 11. `trends.query`
**Purpose**: Find flaky tests and failure patterns over time

**Usage**:
```typescript
// Top 10 failures, all time
claude mcp: trends.query {
  project: "myproject",
  top: 10
}

// Failures in date range
claude mcp: trends.query {
  project: "myproject",
  since: "2025-10-01",
  until: "2025-10-14",
  top: 20
}
```

**Returns**:
```typescript
{
  total: 150,      // Total test runs
  failures: 23,    // Number of failures
  top: 10          // Requested top count
}
```

**Note**: This is a lightweight aggregation. For full trend data, use CLI: `lam trends --top 10`

**When to use**:
- Finding flaky tests
- Identifying recurring failures
- Prioritizing which failures to fix

---

### 12. `rules.get`
**Purpose**: View current Laminar configuration

**Usage**:
```typescript
claude mcp: rules.get { project: "myproject" }
```

**Returns**:
```typescript
{
  config: {
    enabled: true,
    budget: { kb: 10, lines: 200 },
    rules: [
      {
        match: { lvl: "error" },
        actions: [
          { type: "include" },
          { type: "codeframe", contextLines: 2 }
        ],
        priority: 10,
        _comment: "2025-10-14: Errors need code frames for debugging"
      }
    ],
    redaction: { enabled: true, secrets: true }
  }
}
```

**When to use**:
- Checking current rules
- Before modifying configuration
- Understanding why digests look a certain way

---

### 13. `rules.set`
**Purpose**: Update Laminar configuration

**Usage**:
```typescript
// Set inline
claude mcp: rules.set {
  project: "myproject",
  inline: {
    budget: { kb: 12, lines: 250 },
    rules: [
      {
        match: { evt: "assert.fail" },
        actions: [
          { type: "include" },
          { type: "slice", window: 12 }
        ],
        _comment: "Assertions need ±12 events to see test setup"
      }
    ]
  }
}

// Set from file
claude mcp: rules.set {
  project: "myproject",
  file: "/path/to/laminar.config.json"
}
```

**Returns**:
```typescript
{
  updated: "/srv/repos/myproject/laminar.config.json"
}
```

**When to use**:
- Adjusting budget
- Adding custom rules
- Optimizing for specific failure types

---

## Typical Workflows

### Workflow 1: First Time Debugging
```typescript
// 1. Learn the system
readme.get

// 2. Register project
workspace.root.register { root: "/srv/repos/myproject", id: "myproject" }

// 3. Run tests
run { project: "myproject", lane: "auto" }

// 4. See what failed (500 tokens)
summary { project: "myproject" }

// 5. Get digest (2,000 tokens)
digest.generate { project: "myproject" }

// 6. Read digest JSON
// (Use file system or other tools to read the .digest.json file)

// 7. If need more context
show { project: "myproject", case: "auth/test_jwt", window: 30 }
```

**Total tokens**: ~3,000-4,000 (vs 11,000+ for raw logs)

---

### Workflow 2: Iterative Debugging
```typescript
// 1. Check current failures
summary { project: "myproject" }

// 2. Read existing digest
// (Digest already generated from previous run)

// 3. Make code changes
// ... edit files ...

// 4. Re-run tests
run { project: "myproject", lane: "auto" }

// 5. Compare results
diff.get {
  left: "reports/auth/test.digest.json",
  right: "reports/auth/test.digest.json.previous"
}

// 6. Adjust rules if needed
rules.set {
  project: "myproject",
  inline: {
    rules: [{
      match: { evt: "jwt.error" },
      actions: [
        { type: "include" },
        { type: "slice", window: 15 }
      ],
      _comment: "Need more JWT context - was too sparse at window: 10"
    }]
  }
}

// 7. Regenerate digest with new rules
digest.generate { project: "myproject" }
```

---

### Workflow 3: Flake Investigation
```typescript
// 1. Run tests multiple times
run { project: "myproject", lane: "auto" }
// ... wait ...
run { project: "myproject", lane: "auto" }
// ... wait ...
run { project: "myproject", lane: "auto" }

// 2. Check for flaky patterns
trends.query { project: "myproject", top: 10 }

// 3. Investigate specific flaky test
show {
  project: "myproject",
  case: "race/flaky_test",
  window: 50
}

// 4. Add specific rule for this pattern
rules.set {
  project: "myproject",
  inline: {
    rules: [{
      match: { evt: "race.condition" },
      actions: [
        { type: "include" },
        { type: "slice", window: 25 }
      ],
      _comment: "Race conditions need large window - async timing issues"
    }]
  }
}
```

---

## Token Efficiency Tips

### 1. Always Start with Summary
```typescript
// ✅ Good: Summary first (500 tokens)
summary { project: "myproject" }
// Decide which failures to investigate

// ❌ Bad: Generate all digests blindly
digest.generate { project: "myproject" }
// Might create 10 digests you don't need (20,000 tokens)
```

### 2. Use Targeted Digest Generation
```typescript
// ✅ Good: Generate only what you need
digest.generate {
  project: "myproject",
  cases: ["auth/critical_test"]
}

// ❌ Bad: Generate everything then read one
digest.generate { project: "myproject" }
show { project: "myproject", case: "auth/critical_test" }
```

### 3. Adjust Window Sizes
```typescript
// ✅ Good: Small window for quick scan
show { project: "myproject", case: "auth/test", window: 10 }

// If need more context, expand:
show { project: "myproject", case: "auth/test", window: 30 }

// ❌ Bad: Always use large window
show { project: "myproject", case: "auth/test", window: 999 }
```

### 4. Use Rules to Persist Learnings
```typescript
// ✅ Good: Save your filtering work
rules.set {
  project: "myproject",
  inline: {
    rules: [{
      match: { evt: "database.timeout" },
      actions: [{ type: "include" }, { type: "slice", window: 15 }],
      _comment: "DB timeouts: need query history + connection state"
    }]
  }
}

// Future sessions automatically get this filtering
// No need to re-discover the right window size

// ❌ Bad: Manually adjust window every session
show { project: "myproject", case: "db/test", window: 5 }
// Too small
show { project: "myproject", case: "db/test", window: 15 }
// Perfect! But you'll forget next session
```

---

## Troubleshooting MCP

### Tools Not Showing Up

**Check registration**:
```bash
claude mcp list
```

**Re-register**:
```bash
claude mcp add --scope user laminar npx laminar-mcp
```

**Restart Claude Code** (fully exit)

---

### "Project not found" Error

**Solution**: Register project first
```typescript
workspace.root.register { root: "/path/to/project", id: "myproject" }
```

Or use direct path:
```typescript
run { root: "/path/to/project", lane: "auto" }
```

---

### "No summary found" Error

**Solution**: Run tests first
```typescript
run { project: "myproject", lane: "auto" }
```

---

### Tools Timing Out

**Cause**: Long-running operations (test execution, digest generation)

**Solution**: These are expected to take time. Wait for completion.

---

## Advanced: Programmatic Usage

MCP tools can be chained for complex workflows:

```typescript
// 1. Register multiple projects
workspace.root.register { root: "/srv/repos/project1", id: "p1" }
workspace.root.register { root: "/srv/repos/project2", id: "p2" }

// 2. Run tests on both
run { project: "p1", lane: "auto" }
run { project: "p2", lane: "auto" }

// 3. Compare summaries
summary { project: "p1" }  // Store result
summary { project: "p2" }  // Store result
// Analyze differences programmatically

// 4. Generate digests only for failures
digest.generate { project: "p1" }
digest.generate { project: "p2" }

// 5. Check trends across both
trends.query { project: "p1", top: 5 }
trends.query { project: "p2", top: 5 }
```

---

## Best Practices

### 1. Register Projects Early
```typescript
// Do once per project
workspace.root.register { root: "/path/to/project", id: "myproject" }

// Then use ID everywhere
run { project: "myproject", lane: "auto" }
summary { project: "myproject" }
digest.generate { project: "myproject" }
```

### 2. Document Your Rules
```json
{
  "rules": [{
    "_comment": "2025-10-14: JWT errors need token lifecycle + stack trace. Tried window: 10 (insufficient), 12 (close), 15 (perfect).",
    "match": { "evt": "jwt.error" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 15 },
      { "type": "codeframe", "contextLines": 3 }
    ]
  }]
}
```

### 3. Iterate on Rules
```typescript
// Start with defaults
run { project: "myproject", lane: "auto" }
digest.generate { project: "myproject" }

// After 2-3 sessions, add rules
rules.set { /* custom rules */ }

// After 5+ sessions, optimize
rules.set { /* highly optimized rules */ }
```

### 4. Use Summary for Triage
```typescript
// Always start here (cheap: 500 tokens)
summary { project: "myproject" }

// Only deep dive on important failures
digest.generate {
  project: "myproject",
  cases: ["critical/test1", "critical/test2"]
}
```

---

## Next Steps

- **Read**: [why-llms-care.md](why-llms-care.md) - Understand token savings
- **Read**: [rules-budget-filters.md](rules-budget-filters.md) - Learn rule syntax
- **Try**: Register a project and run your first digest
- **Optimize**: Add custom rules after 2-3 debugging sessions

---

**Questions?** Call `readme.get` for a refresher, or check [troubleshooting.md](troubleshooting.md) for common issues.
