# Laminar Testing Strategy

## Purpose

This document outlines the comprehensive testing strategy for Laminar. It serves as a guide for all contributors (human and AI) to ensure we maintain high quality and never ship broken installations again.

## Philosophy

**The code should do what the repo says it will do.** If it doesn't, nobody will use it. Every feature promised in the README must be tested and verified to work in the way users will actually use it.

Laminar was built by AI for AI. We have higher standards, not lower ones. AI-assisted development requires rigorous testing because automated code generation can miss edge cases that human developers might catch through experience.

## Testing Levels

### 1. Unit Tests

**Location**: `tests/`

**What**: Test individual functions and modules in isolation.

**Tools**: Vitest

**Run**: `npm test`

**Standards**:
- Every utility function should have unit tests
- Test both happy paths and error cases
- Mock external dependencies
- Aim for >80% code coverage

**Examples**:
- Parser functions (Go, Pytest, JUnit ingesters)
- Digest generation logic
- Fingerprint calculation
- Configuration resolution

### 2. Integration Tests

**Location**: `tests/`

**What**: Test how multiple modules work together.

**Tools**: Vitest

**Run**: `npm test`

**Standards**:
- Test complete workflows (e.g., ingest → process → output)
- Use real test data when possible
- Verify file I/O operations
- Test CLI commands programmatically

**Examples**:
- Full test run pipeline (run → summary → digest)
- MCP server request/response handling
- Multi-step CLI workflows
- Cross-language ingestion pipelines

### 3. End-to-End Tests

**Location**: `tests/e2e/`

**What**: Test the complete user journey from installation to usage.

**Tools**: Bash scripts, npm scripts

**Run**: `npm run test:e2e`

**Standards**:
- Simulate real user workflows exactly
- Test in a clean environment (fresh directory)
- Verify all commands work as documented
- Test the actual installation method users will use

**Examples**:
- Install from GitHub → run lam init → verify config created
- Install → run tests → verify artifacts generated
- Install → test all CLI commands from README
- Install → verify bin symlinks work

**Critical**: E2E tests must test the ACTUAL installation method (`npm install -D github:anteew/Laminar`), not just local builds.

### 4. CI/CD Tests

**Location**: `.github/workflows/`

**What**: Automated tests that run on every PR and push.

**Tools**: GitHub Actions

**Run**: Automatically on PR/push

**Standards**:
- Must test actual GitHub installation flow
- Test on multiple Node versions (18, 20)
- Fail fast is disabled to see all failures
- Include debug output for failures

**Required Workflows**:
1. **Integration Tests** (`integration-tests.yml`)
   - Build and run unit/integration tests
   - Test on Node 18 and 20
   - Upload coverage

2. **Package Installation** (`test-package-install.yml`)
   - Test npm pack + install flow
   - Verify CLI commands work

3. **GitHub Installation** (`test-github-install.yml`)
   - Test `npm install github:anteew/Laminar` flow
   - Verify package.json included
   - Verify all dist files present
   - Test all bin commands
   - Validate symlinks

## Quality Gates

### Pre-Merge Requirements

Before any PR can merge to `main`, it MUST pass:

1. ✅ All unit tests pass
2. ✅ All integration tests pass
3. ✅ GitHub installation test passes
4. ✅ E2E installation test passes
5. ✅ Build succeeds with no errors
6. ✅ No reduction in test coverage (if applicable)

**No exceptions.** If tests fail, fix the code or fix the tests, but don't merge.

### Pre-Release Requirements

Before publishing a release:

1. ✅ All quality gates above
2. ✅ Manual smoke test of installation:
   ```bash
   npm install -g github:anteew/Laminar#branch-name
   lam --help
   laminar-mcp --help
   lam init
   ```
3. ✅ Verify README examples work
4. ✅ Test MCP integration with Claude Desktop
5. ✅ Version number updated in package.json

## Testing the User Journey

### Critical User Paths to Test

1. **Installation from GitHub**
   ```bash
   npm install -D github:anteew/Laminar
   npx lam --help  # Must work
   ```

2. **First-time setup**
   ```bash
   npx lam init
   # laminar.config.json created
   ```

3. **Running tests**
   ```bash
   npx lam run --lane auto
   # reports/ directory created with artifacts
   ```

4. **Viewing results**
   ```bash
   npx lam summary
   npx lam show <test-case>
   npx lam digest
   ```

5. **MCP Server**
   ```bash
   npx laminar-mcp
   # Server starts and responds to MCP protocol
   ```

Each of these MUST be tested in CI and E2E tests.

## Common Failure Modes to Test

Based on historical issues, always test for:

### 1. Installation Failures
- ❌ Missing dist files in package
- ❌ Missing package.json in installation
- ❌ Broken bin symlinks
- ❌ postinstall hooks that require devDependencies
- ❌ Files excluded by .gitignore not in package

**Prevention**: Test actual GitHub installation in CI

### 2. CLI Failures
- ❌ Command not found
- ❌ Missing required files at runtime
- ❌ Incorrect file paths in bin scripts
- ❌ Node version incompatibility

**Prevention**: Test all CLI commands in E2E tests

### 3. Configuration Issues
- ❌ Config file not created
- ❌ Default values not applied
- ❌ Config resolution fails
- ❌ Missing required config fields

**Prevention**: Test config workflows in integration tests

### 4. Cross-Language Issues
- ❌ Go test output parsing fails
- ❌ Pytest JSON format changes
- ❌ JUnit XML variations not handled
- ❌ Encoding issues with special characters

**Prevention**: Test ingesters with real-world samples

## Test Data Management

### Fixtures

**Location**: `tests/fixtures/`

Store sample data for tests:
- Sample test outputs (Go, Pytest, JUnit)
- Sample JSONL artifacts
- Sample config files
- Sample digest files

**Standards**:
- Keep fixtures minimal but realistic
- Document what each fixture tests
- Use real-world examples when possible
- Version control all fixtures

### Generated Test Data

For tests that need dynamic data:
- Use deterministic generation (seeded random)
- Clean up generated data after tests
- Don't commit generated test data

## Continuous Improvement

### After Every Bug

When a bug is found:

1. Create a failing test that reproduces it
2. Fix the bug
3. Verify test now passes
4. Add to CI if appropriate
5. Update this strategy if needed

### Regular Reviews

Every sprint:

1. Review test coverage reports
2. Identify gaps in testing
3. Add tests for uncovered code
4. Update test data to match real-world usage
5. Review CI performance and optimize

### Metrics to Track

- Test coverage percentage
- CI pass rate
- Time to run full test suite
- Number of flaky tests
- Installation success rate

## For AI Contributors

If you're an AI agent working on Laminar, follow these rules:

### Before Submitting a PR

1. ✅ Run `npm run build` - must succeed
2. ✅ Run `npm test` - all tests must pass
3. ✅ Run `npm run test:e2e` - must succeed
4. ✅ If you added new features, add tests for them
5. ✅ If you fixed a bug, add a test that would have caught it
6. ✅ Update documentation to match code changes

### When Adding Features

1. Write tests FIRST (TDD approach)
2. Implement the feature
3. Verify tests pass
4. Test the actual user journey
5. Update README with examples
6. Test those examples

### When Fixing Bugs

1. Understand the root cause
2. Write a test that reproduces the bug
3. Verify the test fails
4. Fix the bug
5. Verify the test now passes
6. Check if similar bugs exist elsewhere

### Never Do This

- ❌ Skip tests because "it's too hard"
- ❌ Disable tests to make CI pass
- ❌ Commit broken code with TODO comments
- ❌ Assume code works without testing
- ❌ Test only locally, not in CI environment
- ❌ Mock away the actual user journey
- ❌ Trust that installation works without testing it

## Development Workflow

### Local Development Loop

```bash
# 1. Make changes
vim src/some-file.ts

# 2. Build
npm run build

# 3. Run unit tests
npm test

# 4. Run e2e tests
npm run test:e2e

# 5. Test manually
cd /tmp/test-project
npm install -D ~/path/to/Laminar
npx lam --help

# 6. Commit if all pass
git add .
git commit -m "feat: add awesome feature"
```

### CI Workflow

```
PR Created
  ↓
Integration Tests (Node 18, 20)
  ↓
Package Install Test
  ↓
GitHub Install Test (Node 18, 20)
  ↓
All Pass → Ready to Merge
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Testing Best Practices](https://docs.npmjs.com/cli/v10/using-npm/developers#testing)

## Questions?

If you're unsure about testing:
1. Check this document
2. Look at existing tests for examples
3. Ask in PR comments
4. When in doubt, add MORE tests, not fewer

---

**Remember**: We built Laminar by AI for AI. Let's make the AI community proud with world-class quality and testing practices.
