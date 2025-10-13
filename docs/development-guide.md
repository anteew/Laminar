# Laminar Development Guide

This guide covers setting up a development environment, contributing to Laminar, and understanding the codebase.

## Getting Started

### Prerequisites

- Node.js 20+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- Git
- TypeScript knowledge

### Clone & Setup

```bash
# Clone the repository
git clone https://github.com/anteew/Laminar.git
cd Laminar

# Install dependencies
npm install

# Build the project
npm run build

# Verify installation
node dist/scripts/lam.js --help
```

### Development Workflow

```bash
# Make changes to TypeScript files in src/

# Rebuild
npm run build

# Test changes
node dist/scripts/lam.js <command>

# Run tests
npm test
```

### Project Structure

```
Laminar/
├── src/                      # TypeScript source code
│   ├── digest/              # Digest generation & analysis
│   │   ├── generator.ts     # Main digest generator
│   │   ├── codeframe.ts     # Code frame extraction
│   │   ├── fingerprint.ts   # Failure fingerprinting
│   │   ├── diff.ts          # Digest comparison
│   │   └── hints.ts         # Hint engine
│   ├── test/                # Test instrumentation
│   │   └── reporter/        # Vitest reporter
│   │       └── jsonlReporter.ts
│   ├── config/              # Configuration resolution
│   │   └── resolve.ts       # Context resolver
│   ├── project/             # Project registry
│   │   └── registry.ts      # Registry management
│   ├── mcp/                 # MCP server
│   │   └── server.ts        # MCP tool definitions
│   ├── init/                # Project initialization
│   │   └── scaffold.ts      # Config scaffolding
│   └── index.ts             # Main exports
├── scripts/                 # CLI scripts
│   ├── lam.ts              # Main CLI entry point
│   ├── digest.ts           # Digest generation script
│   ├── repro.ts            # Repro command generation
│   ├── repro-bundle.ts     # Repro bundle creation
│   ├── logq.ts             # JSONL query tool
│   ├── ingest-go.ts        # Go test ingest
│   ├── ingest-pytest.ts    # Pytest ingest
│   └── ingest-junit.ts     # JUnit XML ingest
├── docs/                    # Documentation
│   ├── README.md           # Documentation overview
│   ├── architecture.md     # System architecture
│   ├── api-reference.md    # API documentation
│   ├── cli-guide.md        # CLI reference
│   ├── mcp-integration.md  # MCP guide
│   ├── development-guide.md # This file
│   └── testing/            # Test-specific docs
├── dist/                    # Compiled JavaScript (generated)
├── package.json            # Package manifest
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project README
```

## Building & Testing

### Build Commands

```bash
# Full build
npm run build

# Watch mode (rebuild on changes)
npm run build -- --watch

# Clean build
rm -rf dist/
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run tests/digest.spec.ts

# Watch mode
npx vitest watch

# Coverage
npx vitest run --coverage
```

### Manual Testing

```bash
# Test CLI commands
node dist/scripts/lam.js init --dry-run
node dist/scripts/lam.js project list
node dist/scripts/lam.js summary

# Test programmatic API
node -e "
  const { DigestGenerator } = require('./dist/src/digest/generator.js');
  const gen = new DigestGenerator();
  console.log('Generator created:', gen);
"
```

## Code Style & Standards

### TypeScript Guidelines

**Use Explicit Types**: Always declare types for function parameters and return values.

```typescript
// Good
function generateDigest(caseName: string, status: 'pass' | 'fail'): DigestOutput | null {
  // ...
}

// Avoid
function generateDigest(caseName, status) {
  // ...
}
```

**Prefer Interfaces for Data Structures**:

```typescript
// Good
interface DigestConfig {
  budget?: {
    kb?: number;
    lines?: number;
  };
  rules?: DigestRule[];
}

// Avoid
type DigestConfig = {
  budget?: any;
  rules?: any[];
};
```

**Use Readonly for Immutable Data**:

```typescript
interface DigestEvent {
  readonly ts: number;
  readonly lvl: string;
  readonly case: string;
}
```

**Avoid Any**: Use specific types or `unknown` instead of `any`.

```typescript
// Good
function parsePayload(payload: unknown): ParsedPayload {
  if (typeof payload === 'object' && payload !== null) {
    // Type guard
  }
}

// Avoid
function parsePayload(payload: any) {
  // ...
}
```

### Coding Conventions

**File Organization**:
1. Imports
2. Type definitions (interfaces, types)
3. Constants
4. Classes/functions
5. Exports

**Naming**:
- Classes: PascalCase (`DigestGenerator`)
- Functions: camelCase (`generateDigest`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)
- Files: kebab-case (`digest-generator.ts`)
- Interfaces: PascalCase with `I` prefix optional (`DigestConfig`)

**Error Handling**:

```typescript
// Throw descriptive errors
if (!config.enabled) {
  throw new Error('Digest generation is disabled in configuration');
}

// Use try-catch for file operations
try {
  const content = fs.readFileSync(path, 'utf-8');
} catch (error) {
  console.warn(`Failed to read ${path}:`, error);
  return defaultValue;
}
```

**Logging**:

```typescript
// Use console methods appropriately
console.log('Info message');     // Normal output
console.warn('Warning message'); // Warnings
console.error('Error message');  // Errors

// Respect debug flag
if (process.env.LAMINAR_DEBUG) {
  console.log('Debug info:', details);
}
```

### Documentation

**TSDoc Comments**: Document public APIs with TSDoc.

```typescript
/**
 * Generates a failure digest for a test case.
 * 
 * @param caseName - Test case identifier (e.g., "suite/test")
 * @param status - Test result status
 * @param duration - Test duration in milliseconds
 * @param location - Source location (file:line)
 * @param artifactURI - Path to JSONL artifact file
 * @param error - Optional error message
 * @returns Digest output or null if generation skipped
 * 
 * @example
 * ```typescript
 * const digest = await generator.generateDigest(
 *   'auth.spec/login_test',
 *   'fail',
 *   142,
 *   'tests/auth.spec.ts:23',
 *   'reports/auth.spec/login_test.jsonl',
 *   'Expected 200, got 401'
 * );
 * ```
 */
async generateDigest(
  caseName: string,
  status: 'pass' | 'fail' | 'skip',
  duration: number,
  location: string,
  artifactURI: string,
  error?: string
): Promise<DigestOutput | null>
```

**Inline Comments**: Explain complex logic, not obvious code.

```typescript
// Good: Explains why
// Use atomic write to prevent partial file corruption if process is killed
const tempPath = `${artifactPath}.tmp`;
fs.writeFileSync(tempPath, content);
fs.renameSync(tempPath, artifactPath);

// Avoid: States what (obvious)
// Write to temp file
const tempPath = `${artifactPath}.tmp`;
```

## Architecture Patterns

### Dependency Injection

Classes should accept configuration via constructor rather than accessing globals.

```typescript
// Good
class DigestGenerator {
  private config: DigestConfig;
  
  constructor(config?: DigestConfig) {
    this.config = config || DEFAULT_CONFIG;
  }
}

// Avoid
class DigestGenerator {
  generateDigest() {
    const config = loadConfig(); // Hidden dependency
  }
}
```

### Separation of Concerns

Separate IO operations from business logic.

```typescript
// Good: Separate read, process, write
function loadEvents(path: string): DigestEvent[] {
  // IO: Read file
}

function applyRules(events: DigestEvent[], rules: DigestRule[]): DigestEvent[] {
  // Logic: Filter events
}

async function writeDigest(digest: DigestOutput, path: string): Promise<void> {
  // IO: Write file
}

// Avoid: Mixed concerns
function processDigest(inputPath: string, outputPath: string) {
  const events = fs.readFileSync(inputPath); // IO
  const filtered = events.filter(...);        // Logic
  fs.writeFileSync(outputPath, filtered);     // IO
}
```

### Immutability

Prefer immutable operations over mutation.

```typescript
// Good: Return new object
function applyBudget(events: DigestEvent[], limit: number): DigestEvent[] {
  return events.slice(0, limit);
}

// Avoid: Mutate input
function applyBudget(events: DigestEvent[], limit: number): void {
  events.splice(limit);
}
```

### Error Boundaries

Handle errors at appropriate levels.

```typescript
// High-level: Catch and report
async function generateAllDigests() {
  try {
    const entries = loadSummary();
    for (const entry of entries) {
      try {
        await generateDigest(entry);
      } catch (error) {
        console.error(`Failed to generate digest for ${entry.case}:`, error);
        // Continue with other digests
      }
    }
  } catch (error) {
    console.error('Failed to load summary:', error);
    process.exit(1);
  }
}

// Low-level: Throw descriptive errors
function loadSummary(): SummaryEntry[] {
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Summary file not found: ${summaryPath}`);
  }
  // ...
}
```

## Testing

### Test Structure

Organize tests by module:

```
tests/
├── digest/
│   ├── generator.spec.ts
│   ├── codeframe.spec.ts
│   └── fingerprint.spec.ts
├── config/
│   └── resolve.spec.ts
└── project/
    └── registry.spec.ts
```

### Test Patterns

**Unit Tests**: Test individual functions in isolation.

```typescript
import { describe, it, expect } from 'vitest';
import { generateFingerprint } from '../src/digest/fingerprint.js';

describe('generateFingerprint', () => {
  it('generates consistent fingerprints', () => {
    const info1 = generateFingerprint({
      testName: 'auth.spec/login_test',
      errorType: 'AssertionError',
      stackLocation: 'tests/auth.spec.ts:45'
    });
    
    const info2 = generateFingerprint({
      testName: 'auth.spec/login_test',
      errorType: 'AssertionError',
      stackLocation: 'tests/auth.spec.ts:45'
    });
    
    expect(info1).toBe(info2);
  });
  
  it('generates different fingerprints for different failures', () => {
    const info1 = generateFingerprint({
      testName: 'auth.spec/login_test',
      errorType: 'AssertionError'
    });
    
    const info2 = generateFingerprint({
      testName: 'auth.spec/logout_test',
      errorType: 'AssertionError'
    });
    
    expect(info1).not.toBe(info2);
  });
});
```

**Integration Tests**: Test component interactions.

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DigestGenerator } from '../src/digest/generator.js';
import * as fs from 'fs';

describe('DigestGenerator integration', () => {
  const testDir = 'test-artifacts';
  
  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });
  
  afterEach(() => {
    fs.rmSync(testDir, { recursive: true });
  });
  
  it('generates digest and writes files', async () => {
    const generator = new DigestGenerator();
    
    // Create test artifact
    const artifactPath = `${testDir}/test.jsonl`;
    fs.writeFileSync(artifactPath, JSON.stringify({
      ts: Date.now(),
      lvl: 'error',
      case: 'test',
      evt: 'test.error',
      payload: { message: 'Test failed' }
    }));
    
    const digest = await generator.generateDigest(
      'suite/test',
      'fail',
      100,
      'test.ts:1',
      artifactPath
    );
    
    expect(digest).not.toBeNull();
    expect(digest!.events.length).toBeGreaterThan(0);
    
    await generator.writeDigest(digest!, testDir);
    
    expect(fs.existsSync(`${testDir}/suite/test.digest.json`)).toBe(true);
    expect(fs.existsSync(`${testDir}/suite/test.digest.md`)).toBe(true);
  });
});
```

**Snapshot Tests**: Verify output format.

```typescript
import { describe, it, expect } from 'vitest';
import { formatDigestMarkdown } from '../src/digest/generator.js';

describe('formatDigestMarkdown', () => {
  it('formats digest as markdown', () => {
    const digest = {
      case: 'auth.spec/login_test',
      status: 'fail',
      duration: 142,
      location: 'tests/auth.spec.ts:23',
      error: 'Expected 200, got 401',
      summary: {
        totalEvents: 10,
        includedEvents: 5,
        redactedFields: 0,
        budgetUsed: 1234,
        budgetLimit: 10240
      },
      events: []
    };
    
    const markdown = formatDigestMarkdown(digest);
    expect(markdown).toMatchSnapshot();
  });
});
```

## Contributing

### Workflow

1. **Fork & Clone**: Fork the repository and clone your fork
2. **Branch**: Create a feature branch (`git checkout -b feature/my-feature`)
3. **Develop**: Make changes following code standards
4. **Test**: Ensure all tests pass (`npm test`)
5. **Build**: Verify build succeeds (`npm run build`)
6. **Commit**: Write clear commit messages
7. **Push**: Push to your fork
8. **PR**: Create a pull request to the main repository

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Examples**:

```
feat(digest): add support for custom event patterns

Allows users to define custom match patterns for domain-specific events.

Closes #123
```

```
fix(reporter): prevent partial artifact writes on interrupt

Use atomic write pattern (temp file + rename) to ensure artifacts
are never partially written if the process is killed.
```

### Pull Request Guidelines

**PR Title**: Follow commit message format

**Description**: Include:
- What changed and why
- Testing performed
- Breaking changes (if any)
- Related issues

**Checklist**:
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Commit messages follow conventions

### Code Review

Reviews focus on:
- Correctness
- Test coverage
- Performance implications
- API design
- Documentation clarity
- Breaking changes

## Debugging

### Debug Logging

Enable debug output:

```bash
# Enable all debug output
LAMINAR_DEBUG=1 lam run

# Debug specific module (add custom logic)
LAMINAR_DEBUG=digest lam digest
```

### Inspecting Artifacts

```bash
# View raw JSONL
cat reports/summary.jsonl | jq

# View specific test events
cat reports/auth.spec/login_test.jsonl | jq

# View digest
cat reports/auth.spec/login_test.digest.json | jq
```

### TypeScript Source Maps

Source maps are generated by default, enabling debugging of TypeScript source:

```bash
# Debug with Node.js inspector
node --inspect-brk dist/scripts/lam.js run

# Then open chrome://inspect in Chrome
```

### Common Issues

**"Cannot find module" errors**:
```bash
# Ensure build is up to date
npm run build

# Check dist/ directory exists
ls -la dist/
```

**Type errors**:
```bash
# Run TypeScript compiler
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/digest/generator.ts
```

**Test failures**:
```bash
# Run single test file
npx vitest run tests/digest/generator.spec.ts

# Run with verbose output
npx vitest run --reporter=verbose
```

## Release Process

### Versioning

Laminar follows [Semantic Versioning](https://semver.org/):

- **Major** (x.0.0): Breaking changes
- **Minor** (0.x.0): New features (backward compatible)
- **Patch** (0.0.x): Bug fixes

### Release Checklist

1. **Update Version**: Edit `package.json`
2. **Update Changelog**: Document changes
3. **Build**: `npm run build`
4. **Test**: `npm test`
5. **Commit**: `git commit -am "chore: release v0.2.0"`
6. **Tag**: `git tag v0.2.0`
7. **Push**: `git push && git push --tags`
8. **Publish**: `npm publish`

## Advanced Topics

### Adding New Digest Actions

To add a new digest action type:

1. Update `DigestAction` interface:

```typescript
interface DigestAction {
  type: 'include' | 'slice' | 'redact' | 'codeframe' | 'myaction';
  // Add action-specific params
  myParam?: string;
}
```

2. Implement action in `DigestGenerator.applyRules()`:

```typescript
if (action.type === 'myaction') {
  // Custom logic
}
```

3. Update tests and documentation

### Adding New MCP Tools

To add a new MCP tool:

1. Define tool in `src/mcp/server.ts`:

```typescript
server.addTool({
  name: 'mytool',
  description: 'Description for AI agents',
  handler: async (input: { param: string }) => {
    // Tool implementation
    return { result: 'value' };
  }
});
```

2. Update MCP documentation
3. Add tests

### Adding New Ingest Adapters

To support a new test framework:

1. Create `scripts/ingest-myframework.ts`:

```typescript
export async function ingestMyFramework(input: string): Promise<void> {
  // Parse framework output
  const tests = parseFrameworkOutput(input);
  
  // Transform to Laminar events
  const events = tests.map(transformToLaminarEvent);
  
  // Write to standard artifact structure
  writeArtifacts(events);
}
```

2. Add CLI command in `scripts/lam.ts`
3. Update documentation

## Resources

### Documentation

- [Architecture](./architecture.md) - System design
- [API Reference](./api-reference.md) - TypeScript API
- [CLI Guide](./cli-guide.md) - Command reference
- [MCP Integration](./mcp-integration.md) - MCP usage

### External

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Semantic Versioning](https://semver.org/)

### Community

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Pull Requests: Code contributions

## Getting Help

**Bug Reports**: Open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)

**Feature Requests**: Open an issue with:
- Use case description
- Proposed solution
- Alternative approaches considered

**Questions**: Start a GitHub discussion for:
- Usage questions
- Architecture clarifications
- Design discussions
