# Laminar

Agent-first test observability: JSONL artifacts, digests, hints, trends, diff/repro, cross-language ingest.

Laminar transforms your test suite into a structured, queryable knowledge base with token-efficient summaries paired with detailed JSONL artifacts. Perfect for AI-assisted development workflows.

## Features

- **Token-Cheap**: Short summaries for quick scanning, deep JSONL logs on disk
- **Deterministic**: Seeded testing, reproducible results, no flaky tests
- **Composable**: Works across unit, integration, and end-to-end tests
- **Inspectable**: JSONL events with stable schema for precise querying
- **Cross-Language**: Ingest results from Go, pytest, JUnit, and more

## Quick Start

```bash
# 1. Install from GitHub
npm install -D github:anteew/Laminar

# 2. Initialize configuration
npx lam init

# 3. Run tests
npx lam run --lane auto

# 4. View results
npx lam summary

# 5. Analyze failures
npx lam digest
```

## Installation

### Install from GitHub (Recommended)

Installing directly from GitHub:

```bash
# Install as dev dependency
npm install -D github:anteew/Laminar

# Or install specific release/tag
npm install -D github:anteew/Laminar#v0.1.7

# Or install specific commit
npm install -D github:anteew/Laminar#299aed8
```

This downloads the repo, runs `npm install && npm run build` automatically, and installs the built package.

## CLI Usage

If installed locally (from GitHub):

```bash
npx lam --help
```

## Vitest Integration

Configure Laminar as a Vitest reporter:

```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=./node_modules/laminar/dist/src/test/reporter/jsonlReporter.js"
  }
}
```

Note: The path is `laminar` (not `@agent_vega/laminar`) when installed from GitHub.

## Documentation

📚 **[Complete Documentation](./docs/README.md)**

### User Guides
- **[CLI Guide](./docs/cli-guide.md)** - Complete command reference
- **[Testing Guide](./docs/testing/laminar.md)** - Comprehensive testing workflows
- **[MCP Setup Guide](./docs/mcp-setup.md)** - Setting up with Claude Desktop (quick start!)
- **[MCP Integration](./docs/mcp-integration.md)** - Using Laminar with AI agents

### Developer Resources
- **[Architecture](./docs/architecture.md)** - System design and internals
- **[API Reference](./docs/api-reference.md)** - TypeScript API documentation
- **[Development Guide](./docs/development-guide.md)** - Contributing and local development

## Key Concepts

### Event Envelope

Every test event follows a standard schema:

```json
{
  "ts": 1760290661027,
  "lvl": "info",
  "case": "connect moves data 1:1",
  "phase": "execution",
  "evt": "test.run",
  "path": "tests/kernel.spec.ts:45",
  "payload": {}
}
```

### Artifact Structure

```
reports/
├── index.json           # Manifest of all test artifacts
├── summary.jsonl        # One-line summaries per test
└── <suite>/
    ├── <case>.jsonl     # Event stream for each test
    ├── <case>.digest.json   # Failure analysis (on failure)
    └── <case>.digest.md     # Human-readable digest
```

## Use Cases

**AI-Assisted Debugging**: Minimal token consumption for failure identification, detailed digests for analysis

**Continuous Integration**: Deterministic tests, automated triage, structured failure reports

**Multi-Language Projects**: Normalize results from TypeScript, Go, Python into unified JSONL format

**Trend Analysis**: Track test health, identify flaky tests, detect regressions

## Contributing

See the [Development Guide](./docs/development-guide.md) for:
- Setting up your development environment
- Code style and standards
- Testing guidelines
- Contribution workflow

## License

MIT
