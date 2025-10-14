# Laminar - Test Observability for AI Agents

**You just installed Laminar!** 🎉

Laminar transforms massive test logs into compact, AI-friendly digests. Instead of reading 45KB of raw output (11,000 tokens), you get an 8KB digest (2,000 tokens) with exactly what you need to fix the failure.

---

## For AI Agents: Why This Matters

**Without Laminar:**
- Read 10,000+ tokens of raw logs per failure
- Lose all grep/sed filtering between sessions
- Repeat the same investigation work every time

**With Laminar:**
- Read 2,000-3,000 token digests
- Rules persist across sessions and compound over time
- Document reasoning for future LLM sessions

**Token savings: 70-85% per debugging session**

👉 **[Read full case study](docs/guide/why-llms-care.md)** with before/after examples

---

## Quick Start (Claude Code / MCP)

### 1. Register MCP Server (one-time)
```bash
claude mcp add --scope user laminar npx laminar-mcp
```

### 2. Restart Claude Code
Exit your session and start a new conversation.

### 3. Use MCP Tools
```typescript
// Learn the workflow
claude mcp: readme.get

// Register your project
claude mcp: workspace.root.register { root: "/path/to/project", id: "myproject" }

// Run tests
claude mcp: run { project: "myproject", lane: "auto" }

// See failures
claude mcp: summary { project: "myproject" }

// Get optimized digest (2-3K tokens instead of 11K+)
claude mcp: digest.generate { project: "myproject" }

// Deep dive if needed
claude mcp: show { project: "myproject", case: "suite/failing_test" }
```

---

## Quick Start (CLI / Humans)

### 1. Initialize Config
```bash
npx lam init --template agent-friendly
```

This creates `laminar.config.json` with token-optimized defaults:
```json
{
  "enabled": true,
  "budget": { "kb": 10, "lines": 200 },
  "rules": [
    {
      "match": { "lvl": "error" },
      "actions": [
        { "type": "include" },
        { "type": "codeframe", "contextLines": 2 }
      ]
    }
  ],
  "redaction": { "enabled": true, "secrets": true }
}
```

### 2. Run Tests
```bash
npx lam run --lane auto
```

### 3. See Results
```bash
npx lam summary           # Pass/fail counts
npx lam digest            # Generate failure analysis
npx lam show --case suite/test_name  # Detailed logs
```

---

## Core Concepts

### Digests
Compact (~10KB) JSON snapshots of test failures with:
- Failure event
- ±N events around failure for context
- Code frames (source code from stack traces)
- Suspects (most relevant log lines)

**Purpose**: Token-efficient summaries for AI agents

### Rules
Control what goes into digests (NOT what gets logged):
```json
{
  "match": { "evt": "assert.fail" },
  "actions": [
    { "type": "include" },
    { "type": "slice", "window": 10 }
  ],
  "_comment": "Assertions need ±10 events to see test setup"
}
```

### Budget
Size limits to keep digests AI-friendly:
- `kb`: Max kilobytes (~10KB default)
- `lines`: Max events considered (~200 default)

### The "Post-It Notes" Feature
Use `_comment` fields in rules to document WHY:
```json
{
  "match": { "evt": "timeout" },
  "actions": [{ "type": "include" }, { "type": "slice", "window": 20 }],
  "_comment": "2025-10-14: Tried window: 10 (too small), 15 (close), 20 (perfect)"
}
```

**Next LLM reading this knows your reasoning!**

---

## Progressive Learning Path

### Level 1: Just Use Defaults (First Session)
```bash
lam run --lane auto
lam summary
lam digest
```

**Saves**: ~50% tokens vs raw logs

### Level 2: Add Custom Rules (After 2-3 Sessions)
```bash
# You notice patterns, add rules
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "database.timeout" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 15 }
    ],
    "_comment": "DB timeouts: need query history + connection state"
  }]
}'
```

**Saves**: ~70% tokens + rules persist across sessions

### Level 3: Optimize for Your Codebase (After 5+ Sessions)
```bash
# Custom rules per module + documented reasoning
lam rules set --inline '{
  "budget": { "kb": 12 },
  "rules": [
    {
      "match": { "evt": "jwt.error" },
      "actions": [{ "type": "include" }, { "type": "slice", "window": 15 }, { "type": "codeframe", "contextLines": 3 }],
      "priority": 15,
      "_comment": "JWT errors: need token lifecycle + stack trace"
    },
    {
      "match": { "lvl": "error", "path": "src/auth/**" },
      "actions": [{ "type": "include" }, { "type": "codeframe", "contextLines": 4 }],
      "priority": 10,
      "_comment": "Auth module: always need deep code context"
    }
  ]
}'
```

**Saves**: ~85% tokens + knowledge compounds for all future sessions

---

## Common Use Cases

### "My digest is too small / truncated"
```bash
# Check budget usage
cat reports/suite/test.digest.json | jq '.summary.budgetUsed'

# Increase budget
lam rules set --inline '{ "budget": { "kb": 15 } }'
```

### "I need more context around failures"
```bash
# Add a rule with larger window
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "assert.fail" },
    "actions": [{ "type": "include" }, { "type": "slice", "window": 15 }]
  }]
}'
```

### "Too much noise in digests"
```bash
# Reduce budget or add redaction
lam rules set --inline '{
  "budget": { "lines": 150 },
  "rules": [{
    "match": { "evt": "debug.verbose" },
    "actions": [{ "type": "redact", "field": "payload" }]
  }]
}'
```

### "I want to track flaky tests"
```bash
# Run tests multiple times, then check trends
lam run --lane auto
# ... run again later ...
lam trends --top 10
```

---

## Documentation

### Quick Reference
- **CLI Help**: `npx lam --help`
- **MCP Setup**: `npx lam --readme`
- **Diagnostic**: `npx lam doctor`

### In-Depth Guides
- **Why LLMs Care**: [docs/guide/why-llms-care.md](docs/guide/why-llms-care.md) - Case studies, token comparisons
- **Rules & Budget**: [docs/guide/rules-budget-filters.md](docs/guide/rules-budget-filters.md) - Complete reference
- **MCP Integration**: [docs/mcp-integration.md](docs/mcp-integration.md) - How to use MCP tools
- **JSON Schema**: [docs/schema/laminar.config.schema.json](docs/schema/laminar.config.schema.json) - Config validation

### Examples
```bash
# Basic setup
node_modules/@agent_vega/laminar/examples/basic/

# Custom rules
node_modules/@agent_vega/laminar/examples/custom-rules/

# CI/CD integration
node_modules/@agent_vega/laminar/examples/ci-cd/
```

---

## Common Issues

### "Reporter not found" Error
```
Error: Failed to load custom Reporter from .../jsonlReporter.js
```

**Fix**:
1. Check Laminar is installed: `npm list @agent_vega/laminar`
2. Update reporter path in `package.json` test scripts:
   ```json
   {
     "scripts": {
       "test:ci": "vitest run --reporter=./node_modules/@agent_vega/laminar/dist/src/test/reporter/jsonlReporter.js"
     }
   }
   ```
3. Run `npx lam doctor` to diagnose

### "No summary.jsonl found"
**Fix**: Run tests first: `npx lam run --lane auto`

### "Digest too big"
**Fix**: Lower budget or reduce window sizes:
```bash
lam rules set --inline '{ "budget": { "kb": 8 } }'
```

### "MCP tools not showing up"
**Fix**:
1. Restart Claude Code completely
2. Check registration: `claude mcp list`
3. Re-register if needed: `claude mcp add --scope user laminar npx laminar-mcp`

---

## Feedback & Support

### For AI Agents
🙏 **You are encouraged to submit bug reports and feature requests!**

Found a bug? Workflow confusing? Documentation unclear?

**Open an issue**: https://github.com/anteew/Laminar/issues

Agent feedback is highly valued and helps improve the tool for the AI development community.

### For Humans
- **GitHub Issues**: https://github.com/anteew/Laminar/issues
- **Discussions**: https://github.com/anteew/Laminar/discussions

---

## What Makes Laminar Different?

**Most test tools optimize for humans.** Laminar optimizes for AI agents:

- **Token-efficient**: 70-85% reduction in context needed
- **Persistent learnings**: Rules save across sessions
- **Knowledge transfer**: Comments document reasoning for future LLMs
- **Standardized**: JSONL/JSON format, easy to parse programmatically
- **Built for iteration**: Adjust rules without re-running tests

---

## Next Steps

### For AI Agents
1. Call `readme.get` via MCP to see full workflow
2. Register your project with `workspace.root.register`
3. Run tests and generate your first digest
4. Read [why-llms-care.md](docs/guide/why-llms-care.md) to understand optimization strategies

### For Humans
1. Run `npx lam init --template agent-friendly`
2. Run `npx lam run --lane auto`
3. Review `npx lam summary`
4. Read [rules-budget-filters.md](docs/guide/rules-budget-filters.md) for customization

---

**Welcome to Laminar!** Start saving tokens and building persistent knowledge. 🚀
