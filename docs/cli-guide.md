# Laminar CLI Guide

Complete reference for the `lam` command-line interface.

## Installation

The `lam` CLI is included when you install Laminar.

### Recommended: GitHub Install

```bash runnable
# Install as dev dependency
npm install -D github:anteew/Laminar

# Use with npx
npx lam --help
```

### Alternative: npm Scoped Package

```bash
# Install from npm (when available)
npm install -D @agent_vega/laminar

# Use with npx
npx lam --help
```

### Global Install

```bash
# Install globally (optional)
npm install -g github:anteew/Laminar
lam --help
```

### Available Binaries

After installation, you have access to:
- **`lam`** - Main CLI for test execution and analysis
- **`laminar-mcp`** - MCP (Model Context Protocol) server for AI agent integration

## Command Overview

```
lam <command> [options]
```

### Command Categories

**Project Setup**
- `init` - Initialize Laminar configuration
- `project` - Manage project registry

**Test Execution**
- `run` - Execute tests with Laminar instrumentation

**Analysis**
- `summary` - View test results summary
- `show` - Inspect detailed test artifacts
- `digest` - Generate failure analysis
- `trends` - Analyze failure history
- `repro` - Get reproduction commands

**Debugging**
- `doctor` - Run installation health checks

**Configuration**
- `rules` - Manage digest rules

**Integration**
- `ingest` - Import test results from other frameworks

## Commands

### lam init

Initialize Laminar configuration in your project.

```bash
lam init [options]
```

**Options**:
- `--template <name>` - Config template (default: `node-defaults`)
  - `node-defaults`: Comprehensive rules for Node.js/TypeScript
  - `go-defaults`: Optimized for Go projects
  - `minimal`: Minimal error-only capture
- `--dry-run` - Preview config without writing files
- `--force` - Overwrite existing config

**What it does**:
1. Creates `laminar.config.json` with chosen template
2. Adds `reports/` to `.gitignore` if not present
3. Won't overwrite existing config unless `--force` is used

**Examples**:

```bash
# Quick start with defaults
lam init

# Preview config without writing
lam init --dry-run

# Use minimal template
lam init --template minimal

# Overwrite existing config
lam init --force
```

**Generated Config** (node-defaults):

```json
{
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
    },
    {
      "match": { "evt": "assert.fail" },
      "actions": [
        { "type": "include" },
        { "type": "slice", "window": 10 },
        { "type": "codeframe", "contextLines": 2 }
      ],
      "priority": 9
    }
  ]
}
```

### lam project

Manage project registry for convenient aliases.

```bash
lam project <subcommand> [options]
```

#### Subcommands

##### list

List all registered projects.

```bash
lam project list
```

**Output**:
```
Projects in registry (~/.laminar/registry.json):

  backend-api
    Root: /home/user/projects/api
    Config: /home/user/projects/api/laminar.config.json
    Reports: reports
    Tags: backend, api

  frontend-app
    Root: /home/user/projects/web
    Reports: build/test-results
```

##### show

Display details for a specific project.

```bash
lam project show <id>
```

**Example**:
```bash
lam project show backend-api
```

##### register

Register a new project or update an existing one.

```bash
lam project register --root <path> [options]
```

**Options**:
- `--root <path>` (required) - Project root directory
- `--id <id>` - Project identifier (default: derived from directory name)
- `--config <path>` - Config file path
- `--reports <dir>` - Reports directory
- `--history <path>` - History file path
- `--tags <tag1,tag2>` - Comma-separated tags

**Examples**:

```bash
# Basic registration
lam project register --root /home/user/projects/api

# With custom ID and config
lam project register \
  --root /home/user/projects/api \
  --id backend-api \
  --config /home/user/projects/api/.laminar/config.json

# With custom reports location
lam project register \
  --root /home/user/projects/web \
  --id frontend-app \
  --reports build/test-results

# With tags
lam project register \
  --root /home/user/projects/mobile \
  --tags mobile,ios,android
```

##### remove

Remove a project from the registry.

```bash
lam project remove <id>
```

**Example**:
```bash
lam project remove old-project
```

### lam run

Execute tests with Laminar instrumentation.

```bash
lam run [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--root <path>` - Project root (overrides registry)
- `--lane <name>` - Test lane (default: `auto`)
  - `auto`: Automatic lane selection
  - `ci`: CI environment (headless)
  - `pty`: PTY mode (interactive)
- `--filter <pattern>` - Filter tests by name pattern

**Lanes**:

The `--lane` option controls how tests are executed:

**auto**: Smart lane selection based on environment
- If filter provided: Runs Vitest directly with filter
- Otherwise: Runs npm script `laminar:run`

**ci**: Continuous Integration mode
- Runs `npm run test:ci`
- Headless, non-interactive
- Optimized for automation
- **Requires**: A `test:ci` script in your `package.json` (see Vitest Integration section)

**pty**: PTY (pseudo-terminal) mode
- Runs `npm run test:pty`
- Interactive mode with terminal control
- Useful for TUI test frameworks

**Examples**:

```bash
# Run tests using registered project
lam run --project backend-api

# Run tests with explicit root
lam run --root /home/user/projects/api

# Run with filter
lam run --lane auto --filter "auth.*"

# Run in CI mode
lam run --lane ci

# Run specific project in CI mode
lam run --project backend-api --lane ci --filter "unit tests"
```

### lam summary

View summary of test results from the latest run.

```bash
lam summary [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--root <path>` - Project root
- `--reports <dir>` - Reports directory
- `--hints` - Show triage hints inline (can also use `LAMINAR_HINTS=1`)

**Output**:

Without `--hints`:
```
Test Summary (151 tests)

✓ connect moves data 1:1                           6ms
✓ split forwards to all outputs                   12ms
✗ topology rewire                                 89ms
  Error: Expected value to be 42, got 40
  Location: tests/topology.spec.ts:61

✓ merge combines inputs                            7ms
```

With `--hints`:
```
Test Summary (151 tests)

✗ topology rewire                                 89ms
  Error: Expected value to be 42, got 40
  Location: tests/topology.spec.ts:61
  
  [HINT] Assertion Failure
  Severity: high
  The test failed on an assertion check. Review the expected vs actual values.
  Consider: Check if test setup is creating correct initial state.
```

**Examples**:

```bash
# View summary for registered project
lam summary --project backend-api

# View summary with hints
lam summary --hints

# Custom reports location
lam summary --reports build/test-results
```

### lam show

Inspect detailed test artifacts and events.

```bash
lam show --case <suite/case> [options]
```

**Options**:
- `--case <suite/case>` (required) - Test case identifier
- `--project <id>` - Use registered project
- `--around <pattern>` - Center output around matching pattern (default: `assert.fail`)
- `--window <n>` - Number of events before/after match (default: 50)

**Case Identifier Format**:
- `<suite>/<case>` where:
  - `suite` is the test file name without extension
  - `case` is the test name with spaces replaced by underscores

**Examples**:

```bash
# Show events around assertion failure
lam show --case kernel.spec/connect_moves_data_1_1

# Show events around specific pattern
lam show \
  --case auth.spec/login_with_invalid_credentials \
  --around "401" \
  --window 20

# Show events for registered project
lam show --project backend-api --case db.spec/connection_timeout
```

**Output**:
```json
Event 45:
{
  "ts": 1760290661027,
  "lvl": "info",
  "case": "connect moves data 1:1",
  "phase": "execution",
  "evt": "test.run"
}

Event 46:
{
  "ts": 1760290661029,
  "lvl": "error",
  "case": "connect moves data 1:1",
  "phase": "execution",
  "evt": "test.error",
  "payload": {
    "message": "Expected value to be 42, got 40",
    "stack": "Error: ...\n  at tests/topology.spec.ts:61:5"
  }
}
```

### lam digest

Generate failure analysis digests.

```bash
lam digest [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--root <path>` - Project root
- `--reports <dir>` - Reports directory
- `--cases <case1,case2,...>` - Generate for specific cases (default: all failures)

**What it does**:
1. Loads test results from `summary.jsonl`
2. Identifies failed tests (or uses specified cases)
3. Applies digest rules to filter events
4. Identifies suspect events
5. Extracts code frames from stack traces
6. Generates hints for common patterns
7. Writes JSON and Markdown digests

**Generated Files**:
- `reports/<suite>/<case>.digest.json` - Structured digest
- `reports/<suite>/<case>.digest.md` - Human-readable digest

**Examples**:

```bash
# Generate digests for all failures
lam digest

# Generate for specific cases
lam digest --cases auth.spec/login_test,db.spec/timeout_test

# Generate for registered project
lam digest --project backend-api
```

**Sample Digest Output** (JSON):

```json
{
  "case": "auth.spec/login_with_invalid_credentials",
  "status": "fail",
  "duration": 142,
  "location": "tests/auth.spec.ts:45",
  "error": "Expected status 200, got 401",
  "summary": {
    "totalEvents": 87,
    "includedEvents": 12,
    "redactedFields": 0,
    "budgetUsed": 3421,
    "budgetLimit": 10240
  },
  "suspects": [
    {
      "ts": 1760290661029,
      "lvl": "error",
      "evt": "test.error",
      "score": 100,
      "reasons": [
        "error level",
        "failure event",
        "close proximity to failure"
      ]
    }
  ],
  "codeframes": [
    {
      "file": "tests/auth.spec.ts",
      "line": 45,
      "column": 5,
      "snippet": [
        "  const response = await login('user', 'wrong');",
        "> expect(response.status).toBe(200);",
        "  expect(response.user).toBeDefined();"
      ]
    }
  ],
  "hints": [
    {
      "severity": "high",
      "category": "assertion",
      "message": "Assertion failure detected",
      "suggestion": "Review expected vs actual values"
    }
  ],
  "events": [...]
}
```

### lam trends

Analyze failure history and trends.

```bash
lam trends [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--history <path>` - History file path
- `--since <timestamp>` - Start time (ISO 8601 or Unix timestamp)
- `--until <timestamp>` - End time (ISO 8601 or Unix timestamp)
- `--top <n>` - Show top N offenders (default: 10)

**Examples**:

```bash
# Show trends for last 7 days
lam trends --since "2025-10-06T00:00:00Z"

# Show top 20 failures
lam trends --top 20

# Specific time range
lam trends \
  --since "2025-10-01T00:00:00Z" \
  --until "2025-10-13T23:59:59Z"

# For registered project
lam trends --project backend-api
```

**Output**:
```
Failure Trends

Time Range: 2025-10-06 to 2025-10-13
Total Runs: 248
Total Failures: 42

Top 10 Failures:
  1. auth.spec/login_timeout (15 occurrences)
  2. db.spec/connection_pool_exhausted (8 occurrences)
  3. api.spec/rate_limit_exceeded (6 occurrences)
  ...
```

### lam doctor

Run diagnostic checks on Laminar installation and configuration.

```bash
lam doctor
```

**What it does**:

Runs a comprehensive health check on your Laminar installation, verifying:
1. **Node Version** - Checks Node >= 24 is installed
2. **PATH Configuration** - Verifies `node_modules/.bin` is accessible
3. **Bin Symlinks** - Confirms `lam` and `laminar-mcp` binaries are linked
4. **Dist Directory** - Validates all required distribution files are present
5. **Reporter File** - Ensures the Vitest reporter is available
6. **Laminar Config** - Checks for valid `laminar.config.json`

**Exit Codes**:
- `0` - All checks passed or only non-critical issues found
- `1` - Critical issues detected that prevent Laminar from functioning

**Examples**:

```bash
# Run health check
lam doctor
```

**Sample Output**:

```
=== Laminar Doctor: Installation Health Check ===

✓ Node Version: PASS
  Node v24.0.0 detected (>= 24 required)

✓ PATH Configuration: PASS
  node_modules/.bin is in PATH

✓ Bin Symlinks: PASS
  All bin symlinks present (lam, laminar-mcp)

✓ Dist Directory: PASS
  All required dist files present

✓ Reporter File: PASS
  Reporter found at node_modules/@agent_vega/laminar/dist/src/test/reporter/jsonlReporter.js

✗ Laminar Config: FAIL
  laminar.config.json not found
  Fix: Initialize Laminar: npx lam init

Summary: 5 passed, 1 failed

⚠️  Some non-critical issues detected. Laminar may work but some features might be limited.
```

**When to use**:
- After installing Laminar for the first time
- When encountering unexpected errors
- Before reporting issues
- To verify installation in CI/CD environments

### lam repro

Get reproduction commands for failures.

```bash
lam repro [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--reports <dir>` - Reports directory
- `--bundle` - Generate repro bundle with artifacts

**Examples**:

```bash
# Get repro commands
lam repro

# Generate bundle with artifacts
lam repro --bundle
```

**Output**:

```bash
Reproduction Commands:

# auth.spec/login_with_invalid_credentials
TEST_SEED=42 npx vitest run -t "login with invalid credentials"

# db.spec/connection_timeout
TEST_SEED=42 npx vitest run -t "connection timeout"
```

With `--bundle`:
```
Generated repro bundle: repro-2025-10-13.tar.gz

Contains:
  - Reproduction commands (repro.sh)
  - Test artifacts
  - Environment info
  - Config files
```

### lam rules

Manage digest rules configuration.

```bash
lam rules <subcommand> [options]
```

#### Subcommands

##### get

Display current digest rules.

```bash
lam rules get [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--config <path>` - Config file path

**Example**:
```bash
lam rules get --project backend-api
```

**Output**:
```json
{
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
```

##### set

Update digest rules.

```bash
lam rules set [options]
```

**Options**:
- `--project <id>` - Use registered project
- `--config <path>` - Config file path
- `--file <path>` - Load rules from file
- `--inline '<json>'` - Inline JSON rules

**Examples**:

```bash
# Set from file
lam rules set --file custom-rules.json

# Set inline
lam rules set --inline '{
  "enabled": true,
  "rules": [
    {
      "match": { "evt": "db.query.slow" },
      "actions": [{ "type": "include" }],
      "priority": 9
    }
  ]
}'

# Update registered project
lam rules set --project backend-api --file rules.json
```

### lam ingest

Import test results from other frameworks.

```bash
lam ingest --<framework> [options]
```

#### Frameworks

##### Go Tests

Import Go test output.

```bash
lam ingest --go [options]
```

**Options**:
- `--from-file <path>` - Read from file
- `--cmd "<command>"` - Execute command and ingest output

**Examples**:

```bash
# From file
lam ingest --go --from-file go-test-output.json

# From command
lam ingest --go --cmd "go test -json ./..."
```

**Go Test Setup**:

```bash
# Generate JSON output
go test -json ./... > test-output.json

# Ingest into Laminar
lam ingest --go --from-file test-output.json
```

##### pytest

Import pytest JSON reports.

```bash
lam ingest --pytest [options]
```

**Options**:
- `--from-file <path>` - Read from file
- `--cmd "<command>"` - Execute command and ingest output

**pytest Setup**:

```bash
# Install pytest-json-report
pip install pytest-json-report

# Generate report
pytest --json-report --json-report-file=report.json

# Ingest into Laminar
lam ingest --pytest --from-file report.json
```

**Examples**:

```bash
# From file
lam ingest --pytest --from-file pytest-report.json

# From command
lam ingest --pytest --cmd "pytest --json-report --json-report-file=/dev/stdout"
```

##### JUnit XML

Import JUnit XML test results.

```bash
lam ingest --junit <file>
```

**Example**:

```bash
lam ingest --junit test-results.xml
```

## Vitest Integration

To use Laminar with Vitest, you need to configure the JSONL reporter in your test scripts.

### GitHub Install

When installed from GitHub (`npm install -D github:anteew/Laminar`), the reporter path is:
```
node_modules/laminar/dist/src/test/reporter/jsonlReporter.js
```

Add a `test:ci` script to your `package.json`:
```json
{
  "scripts": {
    "test:ci": "PKG='laminar' node -e \"console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))\" | xargs -I{} vitest run --reporter=\"{}\""
  }
}
```

### Scoped npm Install

If using the scoped package (`@agent_vega/laminar`):
```json
{
  "scripts": {
    "test:ci": "PKG='@agent_vega/laminar' node -e \"console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))\" | xargs -I{} vitest run --reporter=\"{}\""
  }
}
```

### vitest.config.ts

Alternatively, configure in `vitest.config.ts`:
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

Advanced: override with `LAMINAR_REPORTER_PATH=/abs/path/to/jsonlReporter.js`

## Environment Variables

Laminar respects these environment variables:

```bash
# Project configuration
export LAMINAR_PROJECT=backend-api
export LAMINAR_ROOT=/home/user/projects/api
export LAMINAR_CONFIG=/home/user/projects/api/laminar.config.json
export LAMINAR_REPORTS_DIR=build/test-results
export LAMINAR_HISTORY=build/test-results/history.jsonl

# Test execution
export LAMINAR_LANE=ci
export TEST_SEED=42

# Output control
export LAMINAR_DEBUG=1    # Enable debug output
export LAMINAR_HINTS=1    # Show hints in summary
```

**Precedence** (highest to lowest):
1. CLI flags (`--root`, `--project`, etc.)
2. Environment variables
3. Project registry
4. Config file
5. Defaults

## Configuration Files

### laminar.config.json

Main configuration file, typically at project root.

**Full Schema**:

```json
{
  "enabled": true,
  "budget": {
    "kb": 10,
    "lines": 200
  },
  "rules": [
    {
      "match": {
        "evt": "string | string[]",
        "lvl": "string | string[]",
        "phase": "string | string[]",
        "case": "string | string[]",
        "path": "string | string[]"
      },
      "actions": [
        {
          "type": "include | slice | redact | codeframe",
          "window": "number (for slice)",
          "field": "string | string[] (for redact)",
          "contextLines": "number (for codeframe)"
        }
      ],
      "priority": "number (higher = first)"
    }
  ],
  "redaction": {
    "enabled": true,
    "secrets": true,
    "optOut": false
  },
  "reportsDir": "reports",
  "historyFile": "reports/history.jsonl"
}
```

## Common Workflows

### Daily Development

```bash
# Morning: Run tests
lam run --lane auto

# Check results
lam summary

# Investigate failures
lam digest
lam show --case problematic.spec/failing_test
```

### CI Pipeline

```bash
#!/bin/bash

# Run tests in CI mode
lam run --lane ci

# Generate digests for failures
lam digest

# Check if any tests failed
if grep -q '"status":"fail"' reports/summary.jsonl; then
  echo "Tests failed, see reports/"
  exit 1
fi
```

### Multi-Language Project

```bash
# Run TypeScript tests
lam run --lane auto

# Run Go tests and ingest
lam ingest --go --cmd "go test -json ./..."

# Run Python tests and ingest
lam ingest --pytest --cmd "pytest --json-report --json-report-file=/dev/stdout"

# View combined summary
lam summary --hints

# Analyze all failures
lam digest
```

### Debugging Flaky Tests

```bash
# Run tests multiple times with different seeds
for seed in {1..10}; do
  TEST_SEED=$seed lam run --filter "flaky test"
done

# Analyze trends
lam trends --since "1 hour ago"

# Check if fingerprints vary (indicates flakiness)
grep "flaky test" reports/history.jsonl | \
  jq -r '.fingerprint' | \
  sort -u
```

## Troubleshooting

### Tests Not Found

```bash
# Verify project root
lam project show myproject

# Check reports directory exists
ls -la reports/

# Try explicit root
lam run --root /absolute/path/to/project
```

### Config Not Loaded

```bash
# Check config path
lam rules get

# Verify file exists
ls -la laminar.config.json

# Use explicit config
lam run --config ./path/to/laminar.config.json
```

### Digests Not Generated

```bash
# Check if enabled in config
lam rules get | jq '.enabled'

# Verify failures exist
lam summary | grep "✗"

# Force digest generation
lam digest --cases suite.spec/test_name
```

### Registry Issues

```bash
# Check registry location
echo ~/.laminar/registry.json

# View registry contents
cat ~/.laminar/registry.json | jq

# Re-register project
lam project remove old-id
lam project register --root /path/to/project
```

## Tips & Best Practices

**Use Project Registry**: Register frequently used projects to avoid typing full paths.

**Set Environment Variables**: Configure `LAMINAR_PROJECT` in your shell profile for default project.

**Version Control Config**: Commit `laminar.config.json` to share rules across team.

**Ignore Reports**: Add `reports/` to `.gitignore` (done automatically by `lam init`).

**Use Filters in Development**: Speed up iterations with `--filter` to run specific tests.

**Review Hints**: Always use `--hints` when debugging to get actionable suggestions.

**Track History**: Commit `reports/history.jsonl` to track test health over time (optional).

**Customize Rules**: Tailor digest rules to your project's specific events and patterns.
