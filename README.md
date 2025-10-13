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
# 1. Install
npm install -D @agent_vega/laminar

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

Laminar is currently published as a private scoped package: `@agent_vega/laminar`.

Configure npm authentication:

```ini
# ~/.npmrc
@agent_vega:registry=https://registry.npmjs.org
always-auth=true
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Install as a dev dependency:

```bash
npm install -D @agent_vega/laminar
```

## CLI Usage

If installed locally:

```bash
npm exec lam -- --help
```

Without installing:

```bash
npx -p @agent_vega/laminar lam --help
```

## Vitest Integration

Configure Laminar as a Vitest reporter:

```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=./node_modules/@agent_vega/laminar/dist/src/test/reporter/jsonlReporter.js"
  }
}
```

## Documentation

📚 **[Complete Documentation](./docs/README.md)**

### User Guides
- **[CLI Guide](./docs/cli-guide.md)** - Complete command reference
- **[Testing Guide](./docs/testing/laminar.md)** - Comprehensive testing workflows
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
