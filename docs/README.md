# Laminar Documentation

Laminar is an agent-first test observability framework that produces compact human summaries and deep JSONL artifacts. It enables precise querying of test results without overwhelming token budgets, making it ideal for AI-assisted development workflows.

## What is Laminar?

Laminar transforms your test suite into a structured, queryable knowledge base. Instead of verbose console output that overwhelms both humans and AI agents, Laminar generates token-efficient summaries paired with detailed JSONL artifacts that can be precisely queried for debugging.

### Key Features

**Token-Cheap Artifacts**: Laminar produces short summaries for quick scanning while maintaining deep JSONL logs on disk. This dual approach ensures AI agents can quickly understand test status without consuming excessive context tokens, then drill into specific failures only when needed.

**Deterministic Testing**: Built-in support for seeded random number generation ensures tests produce identical results across runs. No more flaky tests that pass/fail randomly, making debugging and reproduction reliable.

**Composable Architecture**: Test at any level from unit to integration to end-to-end with consistent instrumentation. The same reporter and CLI work across all test types, enabling unified observability.

**Inspectable Events**: Every test generates JSONL events with a stable envelope schema. Events are structured with consistent fields (timestamp, level, case, phase, event type, payload) making them easy to query with standard tools.

**Cross-Language Support**: While Laminar's core is TypeScript, it ingests test results from Go, pytest, JUnit XML, and other frameworks, normalizing them into the same JSONL format for consistent analysis.

## Core Concepts

### Event Envelope

Every event follows a standard schema:

```json
{
  "ts": 1760290661027,
  "lvl": "info",
  "case": "connect moves data 1:1",
  "phase": "execution",
  "evt": "test.run",
  "id": "abc123",
  "corr": "xyz789",
  "path": "tests/kernel.spec.ts:45",
  "payload": {}
}
```

Fields:
- `ts`: Unix timestamp (milliseconds)
- `lvl`: Log level (`info`, `warn`, `error`)
- `case`: Test case identifier
- `phase`: Test lifecycle phase (`setup`, `execution`, `teardown`)
- `evt`: Domain-specific event type (e.g., `test.run`, `assert.fail`, `case.end`)
- `id`: Unique event identifier
- `corr`: Correlation ID for grouping related events
- `path`: Source location (`file:line`)
- `payload`: Domain-specific data

### Artifact Structure

```
reports/
├── index.json                   # Manifest of all test artifacts
├── summary.jsonl                # One-line summaries per test
└── <suite>/
    ├── <case>.jsonl             # Event stream for each test
    ├── <case>.digest.json       # Failure analysis (on failure)
    ├── <case>.digest.md         # Human-readable digest (on failure)
    └── <case>.snap/             # Snapshots (optional)
```

**index.json**: Cross-references all test artifacts with metadata (status, duration, location, timestamps)

**summary.jsonl**: Stream with one entry per test, ideal for quick scanning

**case.jsonl**: Complete event log for a specific test case

**digest files**: Intelligent failure analysis with suspect event identification, code frames, and triage hints

### Test Lifecycle

Every test follows a predictable event sequence:

1. `case.begin` - Test initialization with environment and seed
2. `test.run` - Test execution begins
3. `test.error` - Error events (if test fails)
4. `case.end` - Test completion with status and duration

This structure enables reliable parsing and correlation of test events.

## Getting Started

### Installation

Install modes:
- GitHub (recommended): `npm install -D github:anteew/Laminar`
- Private scope (when available): `npm install -D @agent_vega/laminar`

```bash
# Configure npm auth (add to ~/.npmrc)
@agent_vega:registry=https://registry.npmjs.org
always-auth=true
//registry.npmjs.org/:_authToken=${NPM_TOKEN}

# Install as dev dependency
npm install -D @agent_vega/laminar
```

### Quick Start

```bash
# 1. Initialize configuration
npx lam init

# 2. Run tests
npx lam run --lane auto

# 3. View results
npx lam summary

# 4. Analyze failures
npx lam digest
```

### Vitest Integration

Configure Laminar as a Vitest reporter:

```json
{
  "scripts": {
    "test:ci": "PKG='laminar' node -e \"console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))\" | xargs -I{} vitest run --reporter=\"{}\""
  }
}
```

## Documentation Structure

### For Users

- **[CLI Guide](./cli-guide.md)**: Complete command reference and usage examples
- **[Testing Guide](./testing/laminar.md)**: Comprehensive testing workflow documentation
- **[MCP Setup Guide](./mcp-setup.md)**: Setting up Laminar with Claude Desktop (start here!)
- **[MCP Integration](./mcp-integration.md)**: Using Laminar with Model Context Protocol

### For Developers

- **[Architecture](./architecture.md)**: System design and internal structure
- **[API Reference](./api-reference.md)**: TypeScript API documentation
- **[Development Guide](./development-guide.md)**: Contributing and local development

## Use Cases

### AI-Assisted Debugging

When an AI agent needs to debug failing tests, it can:
1. Read `summary.jsonl` to identify failures (minimal tokens)
2. Query specific `case.jsonl` files for failure details
3. Read digest files with suspect events and code frames
4. Get actionable hints for common failure patterns

### Continuous Integration

Laminar integrates seamlessly with CI pipelines:
- Deterministic tests eliminate flaky failures
- Structured artifacts enable automated triage
- Digest files provide failure context without log diving
- History tracking identifies regression patterns

### Multi-Language Projects

Projects mixing JavaScript, Go, Python, and other languages can use Laminar to normalize test results:
- Ingest Go test output with `lam ingest --go`
- Ingest pytest JSON with `lam ingest --pytest`
- Ingest JUnit XML with `lam ingest --junit`
- Query all results using the same JSONL format

### Test Trends Analysis

Track test health over time:
- Fingerprint failures for deduplication
- Identify flaky tests with unstable fingerprints
- Find frequently failing tests
- Detect regression patterns

## Next Steps

- Read the [CLI Guide](./cli-guide.md) to learn all available commands
- Explore [Architecture](./architecture.md) to understand how Laminar works internally
- Check the [API Reference](./api-reference.md) for programmatic usage
- Review the [Testing Guide](./testing/laminar.md) for detailed workflow examples

## Support

For questions, feature requests, or bug reports, please visit the [GitHub repository](https://github.com/anteew/Laminar).
