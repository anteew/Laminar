# Laminar Architecture

This document describes the internal architecture of Laminar, explaining how components interact and how test observability is achieved.

## System Overview

Laminar is built around a pipeline architecture that transforms test execution into structured, queryable artifacts:

```
Test Execution → Reporter → JSONL Events → Digest Generator → Analysis Artifacts
                    ↓
                Summary & Index
```

## Core Components

### 1. Test Reporter (`src/test/reporter/jsonlReporter.ts`)

The reporter integrates with Vitest as a custom reporter, capturing test execution and transforming it into JSONL events.

#### Responsibilities

**Event Generation**: Converts Vitest test lifecycle into structured events:
- `case.begin` when test starts
- `test.run` when execution begins
- `test.error` for failures with stack traces
- `case.end` with final status and duration

**Environment Capture**: Records execution context for reproducibility:
- Node version
- Platform and architecture
- Test seed for deterministic randomness
- Relevant environment variables (CI, NODE_ENV, etc.)

**Stream Management**: Maintains write streams for artifacts:
- Single summary stream (`reports/summary.jsonl`)
- Per-case streams (`reports/<suite>/<case>.jsonl`)
- Index manifest (`reports/index.json`)

**Atomicity**: Uses atomic writes (write to temp, then rename) to prevent partial artifact corruption if tests are interrupted.

#### Implementation Details

The reporter processes tests in a specific order:
1. Initialize streams on `onInit()`
2. Capture test events during `onCollected()` and `onFinished()`
3. Wait for all pending writes before closing streams
4. Generate index only after all streams are flushed (ensures deterministic ordering)

Timestamps are deterministic relative to test start, enabling reproducible event streams even across different machines.

### 2. Digest Generator (`src/digest/generator.ts`)

Transforms raw JSONL events into focused failure analysis reports.

#### Rule Engine

The digest generator uses a priority-based rule system to filter events:

```typescript
{
  match: { lvl: 'error' },
  actions: [
    { type: 'include' },
    { type: 'codeframe', contextLines: 2 }
  ],
  priority: 10
}
```

**Match Criteria**: Rules can match on `evt`, `lvl`, `phase`, `case`, or `path` with support for wildcards and arrays.

**Actions**:
- `include`: Add matched event to digest
- `slice`: Include window of N events around match
- `redact`: Remove sensitive fields
- `codeframe`: Extract source code context from stack traces

**Priority**: Higher priority rules are evaluated first, allowing fine-grained control over digest content.

#### Suspect Identification

The generator identifies suspect events using a scoring algorithm:

**Error Events**: +50 points (direct evidence of failure)

**Proximity to Failure**: +30 points (decreases with time distance)

**Correlation**: +40 points (shares correlation ID with failure)

**Event Clustering**: +20 points (similar events occurring together)

The top 5 suspects are included in digests with explanations for why they were flagged.

#### Secret Redaction

Built-in patterns redact sensitive data:
- JWT tokens
- AWS keys and secrets
- API keys
- Private keys
- URL credentials

Redaction can be disabled via config:
```json
{
  "redaction": {
    "enabled": false
  }
}
```

#### Budget Management

Digests enforce size limits to keep them token-efficient:
- Default: 10KB and 200 lines
- Budget includes events + code frames
- Events are trimmed from the end if budget is exceeded
- Budget ensures digests remain useful for AI agents without overwhelming context

### 3. Code Frame Extractor (`src/digest/codeframe.ts`)

Extracts source code context from stack traces.

#### Stack Trace Parsing

Parses Node.js stack traces to extract:
- File path
- Line number
- Column number
- Function name

Supports multiple stack trace formats:
- `at functionName (file.ts:10:5)`
- `at file.ts:10:5`
- Webpack module paths
- Source-mapped locations

#### Source Extraction

Reads source files and extracts context lines:
- Configurable context (default: 2 lines before/after)
- Handles missing files gracefully
- Caches file contents for performance
- Limits to 5 frames per digest to control size

#### Output Format

```json
{
  "file": "tests/kernel.spec.ts",
  "line": 45,
  "column": 5,
  "function": "testConnect",
  "snippet": [
    "  const source = createPipe();",
    "  const sink = createPipe();",
    "> const result = connect(source, sink);",
    "  expect(result).toBe(true);",
    "  source.send('data');"
  ]
}
```

### 4. Hint Engine (`src/digest/hints.ts`)

Generates actionable triage hints for common failure patterns.

#### Pattern Detection

Analyzes digests to identify:
- Timeout failures
- Assertion failures
- Resource leaks
- Unhandled rejections
- Network errors

#### Hint Generation

Produces structured hints:
```json
{
  "severity": "high",
  "category": "timeout",
  "message": "Test exceeded timeout threshold",
  "suggestion": "Check for unresolved promises or infinite loops",
  "references": ["event_id_123", "event_id_456"]
}
```

Hints reference specific events by ID for precise correlation.

### 5. Configuration Resolver (`src/config/resolve.ts`)

Resolves configuration from multiple sources with precedence rules.

#### Resolution Order

Configuration is resolved with the following precedence (highest to lowest):
1. CLI parameters (`--root`, `--config`, etc.)
2. Environment variables (`LAMINAR_ROOT`, `LAMINAR_CONFIG`, etc.)
3. Project registry entry
4. Config file values (`laminar.config.json`)
5. Default values

#### Context Resolution

The resolver produces a `ResolvedContext` containing:
- `root`: Absolute project root path
- `configPath`: Absolute path to config file (if found)
- `reportsDir`: Reports directory (absolute or relative to root)
- `historyPath`: History file path
- `lane`: Test execution lane (ci/pty/auto)
- `warnings`: Conflict warnings if parameters override registry

This ensures consistent behavior across different invocation contexts.

### 6. Project Registry (`src/project/registry.ts`)

Manages project aliases for convenience.

#### Registry Location

Stored at `~/.laminar/registry.json` (or `$XDG_CONFIG_HOME/laminar/registry.json` on Linux).

#### Project Records

```json
{
  "projects": [
    {
      "id": "myapp",
      "root": "/home/user/projects/myapp",
      "configPath": "/home/user/projects/myapp/laminar.config.json",
      "reportsDir": "reports",
      "historyPath": "reports/history.jsonl",
      "tags": ["backend", "api"],
      "createdAt": "2025-10-12T10:30:00Z"
    }
  ]
}
```

Projects can be referenced by ID instead of full paths:
```bash
# Instead of: lam run --root /home/user/projects/myapp
lam run --project myapp
```

### 7. MCP Server (`src/mcp/server.ts`)

Provides Model Context Protocol integration for AI agents.

#### Tool Interface

The MCP server exposes Laminar functionality as callable tools:
- `workspace.roots.list`: List registered projects
- `run`: Execute tests
- `summary`: Get test results
- `show`: Inspect test events
- `digest.generate`: Create failure analysis
- `diff.get`: Compare digests
- `trends.query`: Analyze history

#### Design Philosophy

The MCP server is designed for AI agent consumption:
- Compact responses minimize token usage
- Tools accept project aliases for convenience
- Warnings are returned (not thrown) for agent visibility
- Structured outputs are easily parseable

### 8. Fingerprint System (`src/digest/fingerprint.ts`)

Generates stable identifiers for failures to track them over time.

#### Fingerprint Generation

Combines:
- Test name
- Error type (e.g., `AssertionError`, `TypeError`)
- Stack location (file:line of first test file frame)

Hash: SHA256 truncated to 16 characters for compactness.

#### Use Cases

**Deduplication**: Group identical failures across runs

**Trend Detection**: Track how often specific failures occur

**Flake Detection**: Identify tests with unstable fingerprints

**Regression Analysis**: Detect when old failures reappear

### 9. Diff Engine (`src/digest/diff.ts`)

Compares digest files to identify changes between test runs.

#### Comparison Dimensions

**Event Changes**:
- Events added/removed
- Event sequence changes
- Payload differences

**Suspect Changes**:
- Different suspects identified
- Score changes
- Reason changes

**Code Frame Changes**:
- Different source locations
- Line changes

#### Output Formats

**JSON**: Structured diff for programmatic processing

**Markdown**: Human-readable side-by-side comparison

## Data Flow

### Test Execution Flow

```
1. Developer runs: npx lam run --lane auto
   ↓
2. Vitest executes with JSONLReporter
   ↓
3. Reporter captures test lifecycle events
   ↓
4. Events written to:
   - reports/summary.jsonl (one line per test)
   - reports/<suite>/<case>.jsonl (full event stream)
   ↓
5. Reporter generates index.json (artifact manifest)
   ↓
6. Developer runs: npx lam digest
   ↓
7. DigestGenerator loads failed test events
   ↓
8. Rules applied to filter events
   ↓
9. Suspects identified via scoring
   ↓
10. Code frames extracted from stacks
   ↓
11. Hints generated from patterns
   ↓
12. Digest written to:
   - reports/<suite>/<case>.digest.json
   - reports/<suite>/<case>.digest.md
```

### Cross-Language Ingestion Flow

```
1. External test framework runs (e.g., go test)
   ↓
2. Output captured (JSON, XML, or plain text)
   ↓
3. Ingest adapter parses external format
   ↓
4. Adapter transforms to Laminar JSONL events
   ↓
5. Events written to standard Laminar structure
   ↓
6. All downstream tools work identically
   (digest, trends, diff, MCP, etc.)
```

Ingest adapters maintain semantic fidelity while normalizing structure.

## Configuration

### Config File Structure

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
  ],
  "redaction": {
    "enabled": true,
    "secrets": true
  },
  "reportsDir": "reports",
  "historyFile": "reports/history.jsonl"
}
```

### Templates

**node-defaults**: Comprehensive rules for Node.js/TypeScript testing
- Error capture with code frames
- Assert.fail with context window
- Worker events

**go-defaults**: Optimized for Go test.fail events
- test.fail event capture
- Code frames from Go stack traces

**minimal**: Basic error-only capture
- Minimal disk usage
- Fast digest generation

## Extensibility

### Custom Rules

Add custom rules to match domain-specific events:

```json
{
  "match": { "evt": "db.query.slow" },
  "actions": [
    { "type": "include" },
    { "type": "slice", "window": 5 }
  ],
  "priority": 8
}
```

### Custom Ingest Adapters

Implement adapters for additional test frameworks:

1. Parse external format
2. Map to JSONL event schema
3. Write to standard artifact structure
4. Reuse all Laminar analysis tools

### Custom Hints

Extend the hint engine with domain-specific patterns:

```typescript
if (digest.events.some(e => e.evt === 'rate.limit.exceeded')) {
  hints.push({
    severity: 'medium',
    category: 'rate-limit',
    message: 'API rate limit exceeded',
    suggestion: 'Add retry logic or increase rate limit'
  });
}
```

## Performance Considerations

### Stream-Based Writing

The reporter uses write streams instead of buffering all data in memory. This enables testing large suites without memory issues.

### Atomic Writes

Temp file + rename pattern ensures artifacts are never partially written, preventing corruption if tests are interrupted.

### Lazy Digest Generation

Digests are only generated for failed tests and only on demand (via `lam digest`). This keeps test runs fast.

### Event Budgets

Budget limits prevent digests from growing unbounded, ensuring consistent memory usage and token costs.

## Testing Philosophy

Laminar embodies several testing principles:

**Determinism**: Fixed seeds, monotonic timestamps, and ordered artifact generation ensure reproducible results.

**Composability**: The JSONL event format works at any test granularity (unit → integration → e2e).

**Inspectability**: Structured events enable precise querying without parsing unstructured logs.

**Portability**: Language-agnostic event schema allows cross-language test analysis.

These principles make Laminar particularly well-suited for AI-assisted development workflows.

## Future Directions

Potential enhancements:

**Real-time Streaming**: Stream events during test execution for live monitoring

**Distributed Testing**: Aggregate events from multiple test runners

**Visual Diff**: Graphical digest comparison UI

**ML-Based Hints**: Use machine learning to identify failure patterns

**Browser Testing**: Adapter for Playwright/Puppeteer events

**Snapshot Diffing**: Integrated visual regression testing
