# Laminar

**Test Observability for AI Agents**

Transform massive test logs into compact, AI-friendly digests. Save 70-85% of your context window while debugging failures.

```bash
# Without Laminar: 45KB raw logs (11,000 tokens)
npm test 2>&1 | tee output.txt

# With Laminar: 8KB digest (2,000 tokens)
npx lam run && npx lam digest
```

---

## Why Laminar?

### The Problem
AI agents debugging tests face two challenges:
1. **Token explosion**: Raw logs consume 10,000+ tokens per failure
2. **Lost learnings**: Grep/sed filters don't persist between sessions

### The Solution
Laminar creates compact digests with:
- **Token efficiency**: 2-3K tokens instead of 11K+ per failure
- **Persistent rules**: Filtering improves over time
- **Knowledge transfer**: Document reasoning for future LLM sessions

**Result**: Debug 5x more issues in the same context window, with compounding knowledge.

---

## Quick Start

### For AI Agents (Claude Code)
```bash
# 1. Install MCP server
claude mcp add --scope user laminar npx laminar-mcp

# 2. Restart Claude Code

# 3. Use MCP tools
claude mcp: readme.get
claude mcp: workspace.root.register { root: "/path/to/project", id: "myproject" }
claude mcp: run { project: "myproject", lane: "auto" }
claude mcp: summary { project: "myproject" }
claude mcp: digest.generate { project: "myproject" }
```

### For Humans (CLI)
```bash
# Install
npm install -D @agent_vega/laminar

# Initialize with AI-optimized defaults
npx lam init --template agent-friendly

# Run tests
npx lam run --lane auto

# Analyze failures
npx lam summary
npx lam digest
```

---

## Features

### 🎯 Token-Efficient Digests
- **~2,000 tokens** per failure instead of 11,000+
- Automatic suspects identification
- Code frames from stack traces
- Budget-controlled output size

### 💾 Persistent Learnings
```json
{
  "rules": [{
    "match": { "evt": "jwt.error" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 15 },
      { "type": "codeframe", "contextLines": 3 }
    ],
    "_comment": "2025-10-14: JWT errors need token lifecycle + stack trace"
  }]
}
```

Rules evolve with your understanding. Future sessions benefit automatically.

### 🔍 Progressive Learning
- **Level 1**: Use defaults → Save ~50% tokens
- **Level 2**: Add custom rules → Save ~70% tokens + persist
- **Level 3**: Optimize per-codebase → Save ~85% + knowledge compounds

### 🔐 Built-In Security
- Automatic secret redaction (JWTs, API keys, credentials)
- Configurable redaction rules
- No secrets in digests by default

### 📊 Historical Tracking
- Flake detection over multiple runs
- Failure fingerprinting
- Trend analysis
- Compare test runs with diff

### 🔌 MCP Integration
- Native Claude Code support
- 11 MCP tools for workflow automation
- Standardized JSONL/JSON output

---

## How It Works

### 1. Tests Run → Raw Logs
```typescript
// Full test output logged to per-case JSONL
// Nothing is filtered at this stage
reports/auth.spec/test_jwt_expiry.jsonl (120KB, 30,000 tokens)
```

### 2. Rules + Budget → Digest
```typescript
// Laminar applies rules to create compact digest
{
  "match": { "lvl": "error" },
  "actions": [
    { "type": "include" },
    { "type": "codeframe", "contextLines": 2 }
  ]
}

// Result: digest with just what you need
reports/auth.spec/test_jwt_expiry.digest.json (8KB, 2,000 tokens)
```

### 3. AI Agent Reads Digest
```typescript
// Instead of 30K tokens of raw logs
// Agent reads 2K token digest with:
{
  "summary": { "status": "fail", "budgetUsed": 7.2, "budgetLimit": 10 },
  "suspects": [/* Most relevant events */],
  "events": [/* Filtered timeline */],
  "codeFrames": [/* Source context */]
}
```

---

## Documentation

### Getting Started
- **[Why LLMs Care](docs/guide/why-llms-care.md)** - Case studies, token comparisons, learning path
- **[Quick Start Guide](README.npm.md)** - Install, setup, first digest

### Core Concepts
- **[Rules & Budget](docs/guide/rules-budget-filters.md)** - Complete reference with examples
- **[MCP Integration](docs/mcp-integration.md)** - Using Claude Code tools
- **[Config Schema](docs/schema/laminar.config.schema.json)** - Full validation schema

### Advanced
- **[Troubleshooting](docs/guide/troubleshooting.md)** - Common issues + fixes
- **[CI/CD Integration](docs/guide/ci-cd.md)** - GitHub Actions, etc.
- **[Ingestion Adapters](docs/guide/ingest.md)** - Go tests, pytest, JUnit

---

## Examples

### Basic Setup
```bash
npm install -D @agent_vega/laminar
npx lam init --template agent-friendly
npx lam run --lane auto
npx lam summary
```

### Custom Rules (After 2-3 Sessions)
```json
{
  "budget": { "kb": 10, "lines": 200 },
  "rules": [
    {
      "match": { "evt": "assert.fail" },
      "actions": [
        { "type": "include" },
        { "type": "slice", "window": 12 }
      ],
      "_comment": "Assertions need ±12 events to see test setup"
    }
  ]
}
```

### Advanced Optimization (After 5+ Sessions)
```json
{
  "budget": { "kb": 12, "lines": 250 },
  "rules": [
    {
      "match": { "evt": "jwt.error" },
      "actions": [
        { "type": "include" },
        { "type": "slice", "window": 15 },
        { "type": "codeframe", "contextLines": 3 }
      ],
      "priority": 15,
      "_comment": "JWT errors: need token lifecycle + stack trace. Tried window: 10 (insufficient), 12 (close), 15 (perfect)."
    },
    {
      "match": { "lvl": "error", "path": "src/auth/**" },
      "actions": [
        { "type": "include" },
        { "type": "codeframe", "contextLines": 4 }
      ],
      "priority": 10,
      "_comment": "Auth module: complex flows need deep code context"
    },
    {
      "match": { "evt": "database.query" },
      "actions": [
        { "type": "include" },
        { "type": "redact", "field": "payload" }
      ],
      "priority": 8,
      "_comment": "Include DB queries but redact connection strings"
    }
  ]
}
```

---

## Use Cases

### AI Agent Debugging
```typescript
// Efficient workflow
1. run { project: "myproject" }
2. summary { project: "myproject" }  // See failures
3. digest.generate { project: "myproject" }  // Analyze
4. show { case: "suite/test" }  // Deep dive if needed
```

### Flake Detection
```bash
# Run tests multiple times
lam run --lane auto
# ... run again later ...
lam run --lane auto

# Analyze stability
lam trends --top 10
```

### Comparing Test Runs
```bash
# Run tests, make changes, run again
lam run --lane auto
git commit -m "fix: attempt 1"
lam run --lane auto

# Compare digests
lam diff reports/suite/test.digest.json reports/suite/test.digest.json.previous
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run tests with Laminar
  run: npm exec lam run --lane ci

- name: Generate failure analysis
  if: failure()
  run: npm exec lam digest

- name: Upload digests
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-digests
    path: reports/**/*.digest.json
```

---

## Token Efficiency Comparison

| Scenario | Without Laminar | With Laminar | Savings |
|----------|----------------|--------------|---------|
| Single failure | 11,000 tokens | 2,000 tokens | 82% |
| 5 failures | 55,000 tokens | 10,000 tokens | 82% |
| 10 failures over 5 sessions | 275,000 tokens | 40,000 tokens | 85% |

**Real project example (mkolbol)**:
- 18 test failures
- Without Laminar: ~200,000 tokens to triage all
- With Laminar: ~35,000 tokens
- **Saved: 165,000 tokens (82%)**

---

## Architecture

```
┌─────────────┐
│  Test Run   │
└──────┬──────┘
       │
       ├─→ Raw JSONL logs (complete, unfiltered)
       │   └─→ reports/suite/case.jsonl
       │
       ├─→ Summary (pass/fail counts)
       │   └─→ reports/summary.jsonl
       │
       └─→ Index (artifact registry)
           └─→ reports/index.json

┌────────────────┐
│  lam digest    │
└───────┬────────┘
        │
        ├─→ Apply rules (match → actions)
        ├─→ Enforce budget (kb + lines)
        ├─→ Redact secrets
        ├─→ Extract code frames
        │
        └─→ Compact digest
            ├─→ reports/suite/case.digest.json (2-3K tokens)
            └─→ reports/suite/case.digest.md (human-readable)
```

---

## MCP Tools

| Tool | Purpose | Returns |
|------|---------|---------|
| `readme.get` | Learn workflow | Full guide |
| `workspace.root.register` | Register project | Project ID |
| `run` | Execute tests | Status + warnings |
| `summary` | View results | Pass/fail counts + digest paths |
| `show` | Detailed logs | Sliced JSONL |
| `digest.generate` | Analyze failures | Digest file paths |
| `diff.get` | Compare runs | Diff output |
| `trends.query` | Historical analysis | Flaky tests + patterns |
| `rules.get` | View config | Current rules + budget |
| `rules.set` | Update config | Updated path |
| `workspace.roots.list` | List projects | All registered projects |

---

## Requirements

- **Node.js**: ≥18.0.0
- **Test Framework**: Vitest (or adapt reporter for your framework)
- **Optional**: Claude Code for MCP integration

---

## Installation

```bash
# As a dev dependency
npm install -D @agent_vega/laminar

# Or from GitHub (latest)
npm install -D github:anteew/Laminar

# Or globally
npm install -g @agent_vega/laminar
```

---

## Contributing

We welcome contributions! Especially from AI agents who use Laminar.

**Areas for improvement**:
- Documentation clarity
- MCP tool enhancements
- New ingest adapters
- Template configurations
- Example projects

**How to contribute**:
1. Open an issue describing your idea
2. Fork the repo
3. Create a feature branch
4. Submit a PR with tests + docs

---

## Feedback

### For AI Agents
🙏 **You are strongly encouraged to submit bug reports and feature requests!**

- Found a bug? [Open an issue](https://github.com/anteew/Laminar/issues)
- Workflow confusing? Tell us how to improve
- Missing a feature? Describe your use case

Agent feedback is highly valued and helps improve the tool for the AI development community.

### For Humans
- **Issues**: https://github.com/anteew/Laminar/issues
- **Discussions**: https://github.com/anteew/Laminar/discussions

---

## License

MIT

---

## Acknowledgments

Built for the AI-assisted development workflow. Optimized for Claude Code, but works with any LLM that can read JSON.

---

**Ready to save tokens and build persistent knowledge?** → [Get Started](README.npm.md)
