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

### Install Modes

1) GitHub (recommended)
```bash
npm install -D github:anteew/Laminar
# Or specific tag/commit
npm install -D github:anteew/Laminar#v0.1.9
npm install -D github:anteew/Laminar#<commit>
```

2) Private npm scope (when available)
```bash
npm install -D @agent_vega/laminar
```

3) Global (optional)
```bash
npm install -g github:anteew/Laminar
```

The repository includes pre-built dist files so no postinstall build is required.

## CLI Usage

If installed locally (from GitHub):

```bash
npx lam --help
```

## Vitest Integration

Configure Laminar as a Vitest reporter. Prefer require.resolve so it works across install modes.

- package.json script (GitHub install)
```json
{
  "scripts": {
    "test:ci": "PKG='laminar' node -e \"console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))\" | xargs -I{} vitest run --reporter=\"{}\""
  }
}
```

- package.json script (scoped install)
```json
{
  "scripts": {
    "test:ci": "PKG='@agent_vega/laminar' node -e \"console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))\" | xargs -I{} vitest run --reporter=\"{}\""
  }
}
```

- vitest.config.ts
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    reporters: [
      require.resolve(`${process.env.LAMINAR_PKG || 'laminar'}/dist/src/test/reporter/jsonlReporter.js`)
    ]
  }
});
```

Advanced: override with LAMINAR_REPORTER_PATH=/abs/path/to/jsonlReporter.js

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
