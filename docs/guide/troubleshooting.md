# Laminar Troubleshooting Guide

Common issues and solutions for both AI agents and human users.

---

## Installation Issues

### "Reporter not found" Error

```
Error: Failed to load custom Reporter from
./node_modules/laminar/dist/test/reporter/jsonlReporter.js
```

**Cause**: Incorrect reporter path in test scripts, or Laminar not properly installed.

**Solutions**:

#### 1. Check Laminar is installed
```bash
npm list @agent_vega/laminar
```

If not installed:
```bash
npm install -D @agent_vega/laminar
```

#### 2. Fix reporter path (Scoped Package Issue)
For scoped packages (`@agent_vega/laminar`), path must include `src/`:

**Wrong**:
```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=./node_modules/laminar/dist/test/reporter/jsonlReporter.js"
  }
}
```

**Correct**:
```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=./node_modules/@agent_vega/laminar/dist/src/test/reporter/jsonlReporter.js"
  }
}
```

#### 3. Run Diagnostic
```bash
npx lam doctor
```

This checks:
- Node version
- Laminar installation
- Reporter file existence
- PATH configuration

---

### "Command not found: lam"

**Cause**: Laminar bin not in PATH or not installed globally.

**Solutions**:

#### If installed locally (dev dependency):
```bash
# Use npx
npx lam --help

# Or add npm script
{
  "scripts": {
    "lam": "lam"
  }
}
npm run lam -- --help
```

#### If you want global access:
```bash
npm install -g @agent_vega/laminar
lam --help
```

---

### MCP Server Not Showing Up

**Cause**: Claude Code hasn't loaded the MCP server, or registration failed.

**Solutions**:

#### 1. Check Registration
```bash
claude mcp list
```

Should show:
```
laminar: npx laminar-mcp
```

#### 2. Re-register if missing
```bash
claude mcp add --scope user laminar npx laminar-mcp
```

#### 3. Restart Claude Code COMPLETELY
- Don't just start a new conversation
- Fully exit the application
- Restart and begin new session

#### 4. Check Node version
```bash
node --version
```

Must be ≥18.0.0

#### 5. Verify laminar-mcp exists
```bash
npx laminar-mcp --version
```

If this fails, Laminar installation is incomplete.

---

## Configuration Issues

### "No summary.jsonl found"

**Cause**: Tests haven't been run with Laminar instrumentation yet.

**Solutions**:

#### 1. Run tests first
```bash
npx lam run --lane auto
```

#### 2. Check reports directory exists
```bash
ls reports/
```

Should contain:
- `summary.jsonl`
- `index.json`
- Suite directories with `.jsonl` files

#### 3. Verify project is registered (MCP only)
```typescript
// Check registration
claude mcp: workspace.roots.list

// If not registered:
claude mcp: workspace.root.register { root: "/path/to/project", id: "myproject" }
```

---

### "Digest too big" / Budget Exceeded

**Symptom**: Digest is truncated, or `budgetUsed ≈ budgetLimit`

**Solutions**:

#### 1. Check budget usage
```bash
cat reports/suite/test.digest.json | jq '.summary.budgetUsed, .summary.budgetLimit'
```

Example output:
```json
14.2  // budgetUsed
15    // budgetLimit
```

If `budgetUsed` is 90%+ of limit, increase budget.

#### 2. Increase budget
```bash
lam rules set --inline '{
  "budget": { "kb": 20, "lines": 300 }
}'
```

#### 3. Or reduce window sizes
```bash
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "assert.fail" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 8 }  // Was 15
    ]
  }]
}'
```

#### 4. Or redact large payloads
```bash
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "database.query" },
    "actions": [
      { "type": "include" },
      { "type": "redact", "field": "payload" }
    ]
  }]
}'
```

---

### "Digest too sparse" / Not Enough Context

**Symptom**: Digest doesn't have enough information to debug failure.

**Solutions**:

#### 1. Increase window size
```bash
lam rules set --inline '{
  "rules": [{
    "match": { "lvl": "error" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 20 }  // Was 10
    ]
  }]
}'
```

#### 2. Add code frames
```bash
lam rules set --inline '{
  "rules": [{
    "match": { "lvl": "error" },
    "actions": [
      { "type": "include" },
      { "type": "codeframe", "contextLines": 4 }
    ]
  }]
}'
```

#### 3. Or just read full logs
```bash
lam show --case suite/test_name --window 999
```

---

### "Invalid JSON in laminar.config.json"

**Symptom**:
```
Error: Failed to parse laminar.config.json
```

**Solutions**:

#### 1. Validate JSON syntax
```bash
cat laminar.config.json | jq .
```

Common issues:
- Missing commas
- Trailing commas
- Unquoted keys
- Comments (not allowed in strict JSON)

#### 2. Use schema validation
```bash
# Install ajv-cli
npm install -g ajv-cli

# Validate config
ajv validate -s node_modules/@agent_vega/laminar/docs/schema/laminar.config.schema.json \
             -d laminar.config.json
```

#### 3. Start with template
```bash
npx lam init --template agent-friendly --force
```

This overwrites your config with known-good defaults.

---

## Runtime Issues

### Tests Pass But No Digests Generated

**Cause**: Digests are only created for failing tests by default.

**Solutions**:

#### 1. Check if any tests failed
```bash
lam summary
```

If all pass, no digests will be generated.

#### 2. Force digest for passing test
```bash
lam digest --cases suite/test_name
```

#### 3. Generate digests for all tests
```bash
# Modify digest generator config (advanced)
# By default, only failures get digests
```

---

### "Too many events" / Performance Issues

**Symptom**: Laminar is slow, or creates massive artifacts.

**Solutions**:

#### 1. Check event count
```bash
wc -l reports/suite/test.jsonl
```

If >5,000 lines per test, you have excessive logging.

#### 2. Reduce logging verbosity in tests
```javascript
// Before
console.log("Step 1");
console.log("Step 2");
// ... 1000 more logs

// After
// Only log failures or key milestones
```

#### 3. Use budget to limit
```bash
lam rules set --inline '{
  "budget": { "lines": 100 }  // Only consider first 100 events
}'
```

---

### Flaky Test Detection Not Working

**Symptom**: `lam trends` shows no data, or flaky tests aren't detected.

**Solutions**:

#### 1. Check history file exists
```bash
ls reports/history.jsonl
```

If missing, tests haven't been run multiple times yet.

#### 2. Run tests at least 2-3 times
```bash
lam run --lane auto
# ... do some work ...
lam run --lane auto
# ... run again ...
lam run --lane auto
```

#### 3. Then check trends
```bash
lam trends --top 10
```

#### 4. Use flake detection mode
```bash
# Run test 10 times automatically
npm run laminar:run -- --flake-detect 10
```

---

## Token / Context Issues (AI Agents)

### "Still Using Too Many Tokens"

**Symptom**: Digests are smaller than raw logs, but still consuming 5,000+ tokens.

**Solutions**:

#### 1. Check budget is appropriate
```bash
cat laminar.config.json | jq '.budget'
```

For aggressive token savings:
```json
{
  "budget": { "kb": 6, "lines": 100 }
}
```

#### 2. Reduce window sizes
```bash
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "assert.fail" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 5 }  // Minimal context
    ]
  }]
}'
```

#### 3. Skip reading full digest, use summary only
```typescript
// Instead of:
digest.generate { project: "myproject" }
// Read full digest JSON (2-3K tokens)

// Just read summary:
summary { project: "myproject" }
// Only 500 tokens, has failure list

// Deep dive only on critical failures:
show { project: "myproject", case: "auth/critical_test", window: 20 }
```

---

### "Rules Not Persisting Between Sessions"

**Symptom**: You set rules, but next session they're gone.

**Solutions**:

#### 1. Verify config was written
```bash
cat laminar.config.json
```

Should contain your rules.

#### 2. Check you're in the right directory
```bash
pwd
```

Config is project-specific, not global.

#### 3. Use project registry (MCP)
```typescript
// Register project once:
workspace.root.register { root: "/path/to/project", id: "myproject" }

// Then use project ID:
rules.set { project: "myproject", inline: { /* rules */ } }
```

#### 4. Document your changes
Always add `_comment` fields so you remember WHY:
```json
{
  "rules": [{
    "match": { "evt": "timeout" },
    "actions": [{ "type": "include" }, { "type": "slice", "window": 20 }],
    "_comment": "2025-10-14: Timeouts need large window - race conditions. Tried 10/15/20, 20 is optimal."
  }]
}
```

---

## Advanced Issues

### "Code Frames Not Appearing"

**Symptom**: Digests don't have code frames even though you configured them.

**Solutions**:

#### 1. Verify rule is correct
```bash
cat laminar.config.json | jq '.rules[] | select(.actions[] | .type == "codeframe")'
```

#### 2. Check source maps exist
```bash
ls dist/**/*.js.map
```

Code frames need source maps to resolve TypeScript.

#### 3. Verify events have stacks
Code frames extract from `error.stack`. If error events don't have stacks, no frames can be generated.

```bash
# Check raw log
cat reports/suite/test.jsonl | jq 'select(.lvl == "error") | .payload.stack'
```

---

### "Secrets Not Being Redacted"

**Symptom**: API keys or tokens visible in digests.

**Solutions**:

#### 1. Check redaction is enabled
```bash
cat laminar.config.json | jq '.redaction'
```

Should be:
```json
{
  "redaction": {
    "enabled": true,
    "secrets": true
  }
}
```

#### 2. Check secret patterns
Built-in patterns:
- JWT tokens (eyJ...)
- AWS keys (AKIA...)
- API keys (Bearer ...)
- URL credentials (https://user:pass@...)
- RSA private keys (-----BEGIN...)

If your secret doesn't match these, add custom redaction:
```json
{
  "rules": [{
    "match": { "evt": "custom.auth" },
    "actions": [
      { "type": "include" },
      { "type": "redact", "field": "payload" }
    ]
  }]
}
```

---

### "Can't Compare Digests"

**Symptom**: `lam diff` fails or shows no differences.

**Solutions**:

#### 1. Verify digest files exist
```bash
ls reports/suite/test.digest.json
ls reports/suite/test.digest.json.previous
```

#### 2. Use absolute paths
```bash
lam diff $(pwd)/reports/suite/test.digest.json \
         $(pwd)/reports/suite/test.digest.json.previous
```

#### 3. Check digests are from same test
```bash
jq '.caseName' reports/suite/test.digest.json
jq '.caseName' reports/suite/test.digest.json.previous
```

Must match.

---

## Debug Mode

### Enable Verbose Logging

Set environment variable:
```bash
export LAMINAR_DEBUG=1
lam run --lane auto
```

This shows:
- Rule matching decisions
- Budget calculations
- Event filtering
- File paths

### Check Internal State

```bash
# View summary structure
cat reports/summary.jsonl | jq .

# View index structure
cat reports/index.json | jq .

# View raw case log
cat reports/suite/test.jsonl | head -20

# View digest structure
cat reports/suite/test.digest.json | jq '.summary, .suspects[0], .events[0]'
```

---

## Getting Help

### Run Diagnostics
```bash
npx lam doctor
```

This checks:
- Node.js version
- Laminar installation
- Bin symlinks
- Reporter existence
- Config validity

### Collect Debug Info

When reporting issues, include:

```bash
# System info
node --version
npm --version
npx lam --version

# Installation check
npm list @agent_vega/laminar

# Config
cat laminar.config.json

# Directory structure
ls -la reports/

# Recent run output
npx lam run --lane auto 2>&1 | tail -50
```

### Open an Issue

**For AI Agents**: You are strongly encouraged to report issues!

https://github.com/anteew/Laminar/issues

Include:
- What you tried
- What you expected
- What actually happened
- Debug info from above

---

## Common Gotchas

### 1. Comments in JSON
❌ **Don't** use `//` or `/* */` comments in `laminar.config.json`

✅ **Do** use `_comment` fields:
```json
{
  "rules": [{
    "_comment": "This is OK",
    "match": { "evt": "test" }
  }]
}
```

### 2. Relative vs Absolute Paths
❌ **Don't** assume relative paths work:
```javascript
digest.generate { project: "myproject" }  // Fails if cwd is wrong
```

✅ **Do** use absolute paths or register project:
```javascript
workspace.root.register { root: "/absolute/path", id: "myproject" }
digest.generate { project: "myproject" }  // Always works
```

### 3. Rule Priority
❌ **Don't** forget priority matters:
```json
[
  { "match": { "lvl": "error" }, "priority": 5 },
  { "match": { "evt": "assert.fail" }, "priority": 10 }
]
```

Priority 10 runs first! If assert.fail matches, priority 5 might not run.

### 4. Budget is Approximate
❌ **Don't** expect exact KB:
```json
{ "budget": { "kb": 10 } }  // ~10KB, not exactly 10.000KB
```

✅ **Do** use ranges:
```json
{ "budget": { "kb": 10 } }  // Aim for 8-12KB actual
```

---

**Still stuck?** Open an issue with debug info: https://github.com/anteew/Laminar/issues
