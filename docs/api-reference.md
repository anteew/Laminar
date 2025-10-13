# Laminar API Reference

This document provides complete TypeScript API documentation for programmatic use of Laminar components.

## Installation & Imports

```typescript
// Main exports
import {
  DigestGenerator,
  DigestConfig,
  DigestOutput,
  DigestRule,
  DigestAction,
  generateAllDigests,
  generateDigestsForCases,
} from '@agent_vega/laminar';

// Configuration resolution
import {
  resolveContext,
  resolveReportsAbsolute,
  ResolveParams,
  ResolvedContext,
} from '@agent_vega/laminar';

// Project registry
import {
  listProjects,
  getProject,
  registerProject,
  removeProject,
  ProjectRecord,
} from '@agent_vega/laminar';

// MCP server
import {
  createLaminarServer,
  LaminarMcpServer,
} from '@agent_vega/laminar';

// Vitest reporter
import JSONLReporter from '@agent_vega/laminar';
```

## Digest Generation

### DigestGenerator

The main class for generating failure analysis digests.

#### Constructor

```typescript
class DigestGenerator {
  constructor(config?: DigestConfig)
}
```

**Parameters**:
- `config` (optional): Digest configuration. If omitted, uses default config.

**Example**:
```typescript
const generator = new DigestGenerator({
  budget: { kb: 15, lines: 300 },
  enabled: true,
  rules: [
    {
      match: { lvl: 'error' },
      actions: [{ type: 'include' }],
      priority: 10
    }
  ]
});
```

#### Methods

##### generateDigest()

```typescript
async generateDigest(
  caseName: string,
  status: 'pass' | 'fail' | 'skip',
  duration: number,
  location: string,
  artifactURI: string,
  error?: string
): Promise<DigestOutput | null>
```

Generates a digest for a single test case.

**Parameters**:
- `caseName`: Test case identifier (e.g., "kernel.spec/connect_test")
- `status`: Test result status
- `duration`: Test duration in milliseconds
- `location`: Source location (e.g., "tests/kernel.spec.ts:45")
- `artifactURI`: Path to JSONL artifact file
- `error`: Error message (for failed tests)

**Returns**: `DigestOutput` for failed tests, `null` for passing/skipped tests or if digests are disabled.

**Example**:
```typescript
const digest = await generator.generateDigest(
  'auth.spec/login_with_valid_credentials',
  'fail',
  142,
  'tests/auth.spec.ts:23',
  'reports/auth.spec/login_with_valid_credentials.jsonl',
  'Expected response status 200, got 401'
);

if (digest) {
  console.log(`Generated digest with ${digest.events.length} events`);
  console.log(`Identified ${digest.suspects?.length || 0} suspects`);
}
```

##### writeDigest()

```typescript
async writeDigest(
  digest: DigestOutput,
  outputDir?: string
): Promise<void>
```

Writes digest to JSON and Markdown files.

**Parameters**:
- `digest`: Digest output from `generateDigest()`
- `outputDir`: Output directory (default: "reports")

**Writes**:
- `{outputDir}/{case}.digest.json`: Structured JSON digest
- `{outputDir}/{case}.digest.md`: Human-readable Markdown digest

**Example**:
```typescript
await generator.writeDigest(digest, 'reports/auth.spec');
```

##### loadConfig()

```typescript
static loadConfig(configPath?: string): DigestConfig
```

Loads digest configuration from a file.

**Parameters**:
- `configPath`: Path to config file (default: "laminar.config.json")

**Returns**: Parsed config or default config if file doesn't exist.

**Example**:
```typescript
const config = DigestGenerator.loadConfig('./custom-config.json');
const generator = new DigestGenerator(config);
```

##### setOverlayRules()

```typescript
setOverlayRules(rules: DigestRule[]): void
```

Sets temporary overlay rules that augment config rules.

**Parameters**:
- `rules`: Array of digest rules to overlay

**Example**:
```typescript
generator.setOverlayRules([
  {
    match: { evt: 'db.query.slow' },
    actions: [{ type: 'include' }],
    priority: 9
  }
]);
```

##### clearOverlayRules()

```typescript
clearOverlayRules(): void
```

Removes all overlay rules.

##### getOverlayRules()

```typescript
getOverlayRules(): DigestRule[]
```

Returns current overlay rules.

### Convenience Functions

#### generateAllDigests()

```typescript
async function generateAllDigests(
  summaryPath?: string,
  reportsDir?: string,
  config?: DigestConfig
): Promise<void>
```

Generates digests for all failed tests in a summary file.

**Parameters**:
- `summaryPath`: Path to summary.jsonl (default: "reports/summary.jsonl")
- `reportsDir`: Reports directory (default: "reports")
- `config`: Digest config (default: loaded from laminar.config.json)

**Example**:
```typescript
import { generateAllDigests } from '@agent_vega/laminar';

await generateAllDigests(
  'build/test-results/summary.jsonl',
  'build/test-results'
);
```

#### generateDigestsForCases()

```typescript
async function generateDigestsForCases(
  caseNames: string[],
  summaryPath?: string,
  reportsDir?: string,
  config?: DigestConfig
): Promise<void>
```

Generates digests for specific test cases.

**Parameters**:
- `caseNames`: Array of case identifiers (e.g., ["kernel.spec/test1", "auth.spec/test2"])
- `summaryPath`: Path to summary.jsonl (default: "reports/summary.jsonl")
- `reportsDir`: Reports directory (default: "reports")
- `config`: Digest config

**Example**:
```typescript
import { generateDigestsForCases } from '@agent_vega/laminar';

await generateDigestsForCases(
  ['auth.spec/login_test', 'auth.spec/logout_test']
);
```

## Type Definitions

### DigestConfig

```typescript
interface DigestConfig {
  budget?: {
    kb?: number;      // Max digest size in KB (default: 10)
    lines?: number;   // Max event lines (default: 200)
  };
  rules?: DigestRule[];
  enabled?: boolean;  // Master switch (default: true)
  redaction?: {
    enabled?: boolean;  // Enable redaction (default: true)
    secrets?: boolean;  // Redact secret patterns (default: true)
    optOut?: boolean;   // Force disable all redaction
  };
}
```

### DigestRule

```typescript
interface DigestRule {
  match: {
    evt?: string | string[];     // Event type(s) to match
    lvl?: string | string[];     // Log level(s) to match
    phase?: string | string[];   // Phase(s) to match
    case?: string | string[];    // Case name(s) to match
    path?: string | string[];    // Path pattern(s) to match
  };
  actions: DigestAction[];
  priority?: number;  // Higher = evaluated first (default: 0)
}
```

### DigestAction

```typescript
interface DigestAction {
  type: 'include' | 'slice' | 'redact' | 'codeframe';
  window?: number;        // For 'slice': N events before/after
  field?: string | string[];  // For 'redact': field(s) to redact
  contextLines?: number;  // For 'codeframe': context lines (default: 2)
}
```

### DigestEvent

```typescript
interface DigestEvent {
  ts: number;        // Unix timestamp (ms)
  lvl: string;       // Log level: 'info' | 'warn' | 'error'
  case: string;      // Test case name
  phase?: string;    // Test phase: 'setup' | 'execution' | 'teardown'
  evt: string;       // Event type
  id?: string;       // Event ID
  corr?: string;     // Correlation ID
  path?: string;     // Source location (file:line)
  payload?: unknown; // Event-specific data
}
```

### DigestOutput

```typescript
interface DigestOutput {
  case: string;
  status: 'fail';
  duration: number;
  location: string;
  error?: string;
  summary: {
    totalEvents: number;
    includedEvents: number;
    redactedFields: number;
    budgetUsed: number;
    budgetLimit: number;
  };
  suspects?: SuspectEvent[];
  codeframes?: CodeFrame[];
  hints?: Hint[];
  events: DigestEvent[];
}
```

### SuspectEvent

```typescript
interface SuspectEvent extends DigestEvent {
  score: number;    // Suspicion score (higher = more suspicious)
  reasons: string[]; // Why this event is suspicious
}
```

### CodeFrame

```typescript
interface CodeFrame {
  file: string;
  line: number;
  column: number;
  function?: string;
  snippet: string[];  // Lines with '>' marking the target line
}
```

### Hint

```typescript
interface Hint {
  severity: 'low' | 'medium' | 'high';
  category: string;
  message: string;
  suggestion: string;
  references?: string[];  // Event IDs
}
```

## Configuration Resolution

### resolveContext()

```typescript
function resolveContext(params: ResolveParams): ResolvedContext
```

Resolves Laminar configuration from multiple sources.

**Parameters**:
```typescript
interface ResolveParams {
  project?: string;  // Project ID from registry
  root?: string;     // Project root path
  config?: string;   // Config file path
  reports?: string;  // Reports directory
  history?: string;  // History file path
  lane?: string;     // Test lane (ci/pty/auto)
}
```

**Returns**:
```typescript
interface ResolvedContext {
  project?: string;
  root: string;           // Absolute path
  configPath?: string;    // Absolute path
  reportsDir: string;     // Relative or absolute
  historyPath: string;    // Absolute or relative
  lane?: string;
  warnings: string[];     // Conflict warnings
}
```

**Resolution Order** (highest to lowest precedence):
1. Explicit parameters
2. Environment variables (`LAMINAR_*`)
3. Project registry entry
4. Config file values
5. Defaults

**Example**:
```typescript
import { resolveContext } from '@agent_vega/laminar';

const ctx = resolveContext({ project: 'myapp' });
console.log(`Root: ${ctx.root}`);
console.log(`Reports: ${ctx.reportsDir}`);
if (ctx.warnings.length) {
  console.warn('Warnings:', ctx.warnings);
}
```

### resolveReportsAbsolute()

```typescript
function resolveReportsAbsolute(
  root: string,
  reportsDir: string
): string
```

Converts reports directory to absolute path.

**Parameters**:
- `root`: Absolute project root
- `reportsDir`: Reports directory (absolute or relative)

**Returns**: Absolute path to reports directory

**Example**:
```typescript
import { resolveReportsAbsolute } from '@agent_vega/laminar';

const reportsPath = resolveReportsAbsolute(
  '/home/user/project',
  'build/reports'
);
// Returns: /home/user/project/build/reports
```

## Project Registry

### listProjects()

```typescript
function listProjects(): ProjectRecord[]
```

Lists all registered projects.

**Returns**: Array of project records

**Example**:
```typescript
import { listProjects } from '@agent_vega/laminar';

const projects = listProjects();
projects.forEach(p => {
  console.log(`${p.id}: ${p.root}`);
});
```

### getProject()

```typescript
function getProject(id: string): ProjectRecord | undefined
```

Gets a specific project by ID.

**Parameters**:
- `id`: Project identifier

**Returns**: Project record or `undefined` if not found

**Example**:
```typescript
import { getProject } from '@agent_vega/laminar';

const project = getProject('myapp');
if (project) {
  console.log(`Root: ${project.root}`);
}
```

### registerProject()

```typescript
function registerProject(input: ProjectRecord): ProjectRecord
```

Registers or updates a project.

**Parameters**:
```typescript
interface ProjectRecord {
  id: string;
  root: string;
  configPath?: string;
  reportsDir?: string;
  historyPath?: string;
  repoUrl?: string;
  tags?: string[];
  createdAt?: string;  // Auto-generated if omitted
}
```

**Returns**: Registered project record

**Example**:
```typescript
import { registerProject } from '@agent_vega/laminar';

const project = registerProject({
  id: 'backend-api',
  root: '/home/user/projects/api',
  configPath: '/home/user/projects/api/laminar.config.json',
  reportsDir: 'test-results',
  tags: ['backend', 'api']
});
```

### removeProject()

```typescript
function removeProject(id: string): boolean
```

Removes a project from the registry.

**Parameters**:
- `id`: Project identifier

**Returns**: `true` if removed, `false` if not found

**Example**:
```typescript
import { removeProject } from '@agent_vega/laminar';

if (removeProject('old-project')) {
  console.log('Project removed');
}
```

## MCP Server

### createLaminarServer()

```typescript
function createLaminarServer(): LaminarMcpServer
```

Creates an MCP server instance with all Laminar tools registered.

**Returns**: Configured MCP server

**Example**:
```typescript
import { createLaminarServer } from '@agent_vega/laminar';

const server = createLaminarServer();
const tools = server.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await server.call('summary', { project: 'myapp' });
console.log(`Found ${result.entries.length} test results`);
```

### LaminarMcpServer

```typescript
class LaminarMcpServer {
  addTool<I, O>(def: ToolDef<I, O>): void
  listTools(): { name: string; description: string }[]
  async call<I, O>(name: string, input: I): Promise<O>
}
```

#### Methods

##### addTool()

```typescript
addTool<I, O>(def: ToolDef<I, O>): void
```

Registers a custom tool.

**Parameters**:
```typescript
interface ToolDef<I = any, O = any> {
  name: string;
  description: string;
  handler: (input: I) => Promise<O>;
}
```

**Example**:
```typescript
server.addTool({
  name: 'custom.analyze',
  description: 'Custom analysis tool',
  handler: async (input: { case: string }) => {
    // Custom logic
    return { analysis: 'result' };
  }
});
```

##### listTools()

```typescript
listTools(): { name: string; description: string }[]
```

Lists all registered tools.

##### call()

```typescript
async call<I, O>(name: string, input: I): Promise<O>
```

Invokes a tool by name.

**Parameters**:
- `name`: Tool name
- `input`: Tool-specific input

**Returns**: Tool-specific output

**Throws**: Error if tool doesn't exist

## Vitest Reporter

### JSONLReporter

Custom Vitest reporter for JSONL artifact generation.

#### Usage in vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      require.resolve(`${process.env.LAMINAR_PKG || 'laminar'}/dist/src/test/reporter/jsonlReporter.js`)
    ]
  }
});
```

#### Usage via CLI

```bash
PKG='laminar' node -e "console.log(require.resolve(`${process.env.PKG}/dist/src/test/reporter/jsonlReporter.js`))" | xargs -I{} vitest run --reporter="{}"
```

## Fingerprinting

### generateFingerprint()

```typescript
function generateFingerprint(failure: FailureInfo): string
```

Generates a stable fingerprint for a failure.

**Parameters**:
```typescript
interface FailureInfo {
  testName: string;
  errorType?: string;
  stackLocation?: string;
  errorMessage?: string;
}
```

**Returns**: 16-character hex string (SHA256 hash truncated)

**Example**:
```typescript
import { generateFingerprint } from '@agent_vega/laminar';

const fingerprint = generateFingerprint({
  testName: 'auth.spec/login_test',
  errorType: 'AssertionError',
  stackLocation: 'tests/auth.spec.ts:45'
});
console.log(fingerprint); // e.g., "a3f9c8b2d1e4f6a8"
```

### extractFailureInfo()

```typescript
function extractFailureInfo(
  testName: string,
  error?: string,
  payload?: any
): FailureInfo
```

Extracts failure information from error data.

**Parameters**:
- `testName`: Test case name
- `error`: Error message
- `payload`: Event payload with stack trace

**Returns**: Parsed failure info

**Example**:
```typescript
import { extractFailureInfo } from '@agent_vega/laminar';

const info = extractFailureInfo(
  'auth.spec/login_test',
  'AssertionError: Expected 200, got 401',
  {
    stack: 'Error: ...\n  at tests/auth.spec.ts:45:10',
    name: 'AssertionError'
  }
);
console.log(info.stackLocation); // "tests/auth.spec.ts:45"
```

## Diff Engine

### DigestDiffEngine

```typescript
class DigestDiffEngine {
  compareFiles(leftPath: string, rightPath: string): DigestDiff
  formatAsJson(diff: DigestDiff, pretty?: boolean): string
  formatAsMarkdown(diff: DigestDiff): string
}
```

#### Methods

##### compareFiles()

```typescript
compareFiles(leftPath: string, rightPath: string): DigestDiff
```

Compares two digest JSON files.

**Parameters**:
- `leftPath`: Path to first digest file
- `rightPath`: Path to second digest file

**Returns**: Structured diff object

**Example**:
```typescript
import { DigestDiffEngine } from '@agent_vega/laminar';

const engine = new DigestDiffEngine();
const diff = engine.compareFiles(
  'reports/auth.spec/login_test.digest.json',
  'reports/auth.spec/login_test_v2.digest.json'
);
```

##### formatAsJson()

```typescript
formatAsJson(diff: DigestDiff, pretty?: boolean): string
```

Formats diff as JSON.

**Parameters**:
- `diff`: Diff object from `compareFiles()`
- `pretty`: Pretty-print (default: false)

**Returns**: JSON string

##### formatAsMarkdown()

```typescript
formatAsMarkdown(diff: DigestDiff): string
```

Formats diff as Markdown.

**Parameters**:
- `diff`: Diff object

**Returns**: Markdown-formatted comparison

**Example**:
```typescript
const md = engine.formatAsMarkdown(diff);
console.log(md);
// Outputs side-by-side comparison in Markdown
```

## Environment Variables

Laminar respects the following environment variables:

- `LAMINAR_PROJECT`: Default project ID
- `LAMINAR_ROOT`: Default project root
- `LAMINAR_CONFIG`: Default config file path
- `LAMINAR_REPORTS_DIR`: Default reports directory
- `LAMINAR_HISTORY`: Default history file path
- `LAMINAR_LANE`: Default test lane (ci/pty/auto)
- `LAMINAR_DEBUG`: Enable debug output (1 = enabled)
- `TEST_SEED`: Random seed for deterministic tests

## Complete Example

```typescript
import {
  DigestGenerator,
  resolveContext,
  resolveReportsAbsolute,
  generateAllDigests,
} from '@agent_vega/laminar';

// Resolve project configuration
const ctx = resolveContext({ project: 'myapp' });
const reportsPath = resolveReportsAbsolute(ctx.root, ctx.reportsDir);

// Generate digests for all failures
await generateAllDigests(
  `${reportsPath}/summary.jsonl`,
  reportsPath
);

// Or generate specific digests with custom config
const generator = new DigestGenerator({
  budget: { kb: 20, lines: 500 },
  rules: [
    {
      match: { evt: 'db.query.slow' },
      actions: [
        { type: 'include' },
        { type: 'slice', window: 10 }
      ],
      priority: 9
    }
  ]
});

const digest = await generator.generateDigest(
  'db.spec/slow_query_test',
  'fail',
  5432,
  'tests/db.spec.ts:89',
  `${reportsPath}/db.spec/slow_query_test.jsonl`,
  'Query exceeded 5000ms threshold'
);

if (digest) {
  await generator.writeDigest(digest, `${reportsPath}/db.spec`);
  console.log(`Generated digest: ${digest.summary.includedEvents} events`);
}
```
