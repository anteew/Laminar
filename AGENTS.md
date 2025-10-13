# Guide for AI Agents Contributing to Laminar

## Welcome!

Laminar was built by AI for AI. This codebase is designed to be worked on by AI agents like you. However, with that privilege comes responsibility: we need to maintain exceptional quality because this tool is meant for production use by the AI development community.

## Core Ethos

> **The code in this repo was built by AI for AI. Make us proud.**

This means:
- The code should do what the README says it will do
- Installation should work flawlessly
- Tests should pass every time
- Documentation should be accurate
- Quality should be world-class

If humans using AI-generated code is going to become the norm, we need to prove that AI can build production-quality software with rigorous standards.

## Before You Start

Read these documents:
1. `README.md` - Understand what Laminar does
2. `TESTING_STRATEGY.md` - Understand our testing requirements
3. `docs/architecture.md` - Understand the system design
4. `docs/development-guide.md` - Development setup and practices

## Quality Standards

### Code Quality

1. **Follow TypeScript Best Practices**
   - Use strict type checking
   - No `any` types without justification
   - Prefer interfaces over types for objects
   - Export types for public APIs

2. **Follow Existing Patterns**
   - Look at similar code in the codebase
   - Match the style and structure
   - Use existing utilities rather than duplicating
   - Follow the established project structure

3. **Write Clear, Maintainable Code**
   - Functions should be small and focused
   - Variable names should be descriptive
   - Complex logic needs comments
   - Edge cases should be handled explicitly

4. **No Shortcuts**
   - Don't hardcode values that should be configurable
   - Don't skip error handling
   - Don't leave TODO comments without tickets
   - Don't assume things work without testing

### Testing Requirements

**Every PR must include tests.** This is non-negotiable.

1. **Unit Tests** for new functions
   - Test happy path
   - Test error cases
   - Test edge cases
   - Use descriptive test names

2. **Integration Tests** for new features
   - Test the complete workflow
   - Use realistic test data
   - Verify file outputs
   - Test CLI interactions

3. **E2E Tests** for user-facing changes
   - Test the actual user journey
   - Don't mock the installation process
   - Verify all commands work
   - Test in a clean environment

4. **Run All Tests Before Submitting**
   ```bash
   npm run build        # Must succeed
   npm test             # All tests pass
   npm run test:e2e     # E2E tests pass
   ```

### Documentation Requirements

1. **Update README** if you change:
   - Installation process
   - CLI commands
   - Configuration options
   - Core features

2. **Update API Docs** if you change:
   - Public functions
   - Exported types
   - Module interfaces
   - Event schemas

3. **Add JSDoc Comments** for:
   - All public functions
   - Complex private functions
   - Non-obvious logic
   - Configuration options

4. **Update CHANGELOG** for:
   - New features
   - Breaking changes
   - Bug fixes
   - Deprecations

### Git Standards

1. **Commit Messages**
   - Use conventional commits format
   - Format: `type(scope): description`
   - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
   - Example: `feat(cli): add --verbose flag to lam run`

2. **Branch Names**
   - Format: `type/short-description`
   - Examples: `feat/add-verbose-mode`, `fix/broken-symlinks`
   - Keep them concise but descriptive

3. **PR Descriptions**
   - Explain what and why, not how
   - Link to related issues
   - Include testing notes
   - Add screenshots for UI changes

## Common Mistakes to Avoid

### 1. Installation Issues

❌ **Don't** assume installation works without testing it

✅ **Do** test with: `npm install -D github:anteew/Laminar`

❌ **Don't** rely on local builds to verify installation

✅ **Do** test in a fresh directory like a real user would

❌ **Don't** add postinstall hooks that require devDependencies

✅ **Do** commit built files or use prepare hook correctly

### 2. Test Issues

❌ **Don't** skip tests because they're "too hard to write"

✅ **Do** ask for help or look at existing test patterns

❌ **Don't** disable failing tests to make CI pass

✅ **Do** fix the bug or fix the test expectations

❌ **Don't** test only the happy path

✅ **Do** test error cases and edge cases too

### 3. Code Quality Issues

❌ **Don't** use `any` types everywhere

✅ **Do** define proper types or use generics

❌ **Don't** copy-paste code with slight variations

✅ **Do** extract common logic into utilities

❌ **Don't** hardcode values that might change

✅ **Do** use configuration or constants

### 4. Documentation Issues

❌ **Don't** change behavior without updating docs

✅ **Do** update README and comments in the same PR

❌ **Don't** leave outdated examples in README

✅ **Do** test examples before committing them

❌ **Don't** write generic or unhelpful comments

✅ **Do** explain *why* code exists, not *what* it does

## Development Workflow

### Starting Work

```bash
# 1. Sync with latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Install dependencies
npm install

# 4. Build to verify setup
npm run build
```

### During Development

```bash
# Run tests frequently
npm test

# Run specific test file
npm test path/to/test.spec.ts

# Watch mode for active development
npm run test:watch

# Build to check TypeScript errors
npm run build
```

### Before Submitting PR

```bash
# 1. Build succeeds
npm run build

# 2. All tests pass
npm test

# 3. E2E tests pass
npm run test:e2e

# 4. Code is formatted (if we add a formatter)
# npm run format:check

# 5. No TypeScript errors
npm run build -- --noEmit

# 6. Commit with good message
git add .
git commit -m "feat(scope): description"

# 7. Push to your branch
git push origin feat/my-feature
```

### After Creating PR

1. Wait for CI to complete
2. Address any CI failures immediately
3. Respond to review comments
4. Update based on feedback
5. Request re-review when ready

## CI Pipeline

Our CI runs these checks on every PR:

1. **Integration Tests** (Node 18, 20)
   - Builds the project
   - Runs all unit and integration tests
   - Uploads coverage

2. **Package Install Test**
   - Tests npm pack → install flow
   - Verifies CLI commands work

3. **GitHub Install Test** (Node 18, 20)
   - Tests actual `npm install github:anteew/Laminar`
   - Verifies package.json included
   - Verifies dist files present
   - Tests all CLI commands
   - Validates symlinks

All must pass. No exceptions.

## TypeScript Configuration

Our TypeScript config is strict. Key settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

This means:
- Every function parameter needs a type
- Every return value needs a type
- Null/undefined must be handled explicitly
- No implicit `any` allowed

## File Structure

```
Laminar/
├── src/                    # TypeScript source
│   ├── config/            # Configuration handling
│   ├── digest/            # Failure analysis
│   ├── ingest/            # Cross-language parsers
│   ├── test/              # Test utilities
│   └── index.ts           # Public API
├── scripts/               # CLI entry points
│   ├── lam.ts            # Main CLI
│   └── mcp-server.ts     # MCP server
├── tests/                 # Test files
│   ├── e2e/              # End-to-end tests
│   ├── cli/              # CLI tests
│   └── fixtures/         # Test data
├── dist/                  # Built output (committed)
├── docs/                  # Documentation
└── .github/workflows/     # CI configuration
```

When adding new files:
- Put source in `src/` or `scripts/`
- Put tests in `tests/` matching the source path
- Put docs in `docs/`
- Build artifacts go to `dist/` (auto-generated)

## Key Concepts

### Event Envelope

Every test event uses this schema:

```typescript
interface LaminarTestEvent {
  ts: number;        // Unix timestamp
  lvl: string;       // Log level
  case: string;      // Test identifier
  phase: string;     // Execution phase
  evt: string;       // Event type
  payload: any;      // Event data
}
```

Always use this for new event types.

### JSONL Format

We use JSON Lines (JSONL) for artifacts:
- One JSON object per line
- No commas between lines
- Newline-delimited
- Easy to stream and append

```typescript
// ✅ Correct
fs.appendFileSync('output.jsonl', JSON.stringify(event) + '\n');

// ❌ Wrong - creates invalid JSON array
fs.writeFileSync('output.json', JSON.stringify(events));
```

### Token Efficiency

Design for AI consumption:
- Short summaries (one line per test)
- Detailed logs on disk (for deep analysis)
- Structured data (JSON, not plain text)
- Queryable formats (JSONL)

## Examples

### Adding a New CLI Command

```typescript
// 1. Add command handler in scripts/lam.ts
program
  .command('newcmd')
  .description('Does something useful')
  .option('-f, --flag', 'Optional flag')
  .action(async (options) => {
    // Implementation
  });

// 2. Add function in src/
export async function handleNewCommand(options: NewCmdOptions) {
  // Implementation
}

// 3. Add tests in tests/cli/
describe('lam newcmd', () => {
  it('should do the thing', () => {
    // Test
  });
});

// 4. Update README
// Document the new command with examples

// 5. Test manually
npm run build
npx lam newcmd --help
```

### Adding a New Ingester

```typescript
// 1. Create src/ingest/my-framework.ts
export function parseMyFramework(input: string): TestEvent[] {
  // Parse framework-specific format
}

export function convertToLaminar(events: TestEvent[]): {
  events: LaminarTestEvent[];
  summary: Summary[];
} {
  // Convert to Laminar format
}

// 2. Add CLI integration in scripts/lam.ts
// Handle --format my-framework

// 3. Add tests with real-world fixtures
// tests/fixtures/my-framework-output.json

// 4. Document in README
// Add to "Cross-Language" section
```

## Getting Help

If you're stuck:

1. **Read the code** - Look for similar functionality
2. **Read the tests** - See how existing features are tested
3. **Read the docs** - Check architecture and API docs
4. **Ask in PR** - Leave a comment with questions
5. **Create an issue** - For bigger questions or discussions

## Security

- Never commit secrets or API keys
- Don't log sensitive information
- Validate all user inputs
- Escape shell commands properly
- Use parameterized queries (if we add DB later)

## Performance

- Keep CLI commands fast (<1s response time)
- Don't load huge files into memory
- Stream large files when possible
- Use async/await for I/O operations
- Consider performance in tight loops

## Accessibility

- Provide helpful error messages
- Use colors sparingly (some terminals don't support)
- Always have a non-color fallback
- Make output machine-readable (JSON) when requested
- Support --quiet and --verbose modes

## Final Checklist

Before submitting your PR, verify:

- [ ] Code builds without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No TypeScript `any` without justification
- [ ] Error handling in place
- [ ] User-facing changes tested manually

## Remember

You're not just writing code. You're building a tool that other developers and AI agents will rely on. Every line matters. Every test matters. Every edge case matters.

**Make us proud. Ship quality.**

---

*For detailed testing requirements, see `TESTING_STRATEGY.md`*

*For architecture details, see `docs/architecture.md`*

*For development setup, see `docs/development-guide.md`*
