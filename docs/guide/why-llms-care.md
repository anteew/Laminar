# Why LLMs Should Use Laminar

## The Context Window Problem

**You're an LLM debugging a failing test. Here's what you're up against:**

### Without Laminar (Traditional Approach)

```bash
# Test fails, you run:
npm test 2>&1 | tee test-output.txt

# Output: 45,231 characters of test logs
# Your context window: ~200,000 tokens (≈800KB)
# Test output alone: ~11,000 tokens (≈45KB)
```

**What you have to do:**
1. Read entire 45KB log (11,000 tokens)
2. Grep/sed to find the failure: `grep -A 20 "Error:" test-output.txt`
3. Still get 2,000+ tokens of mixed signal/noise
4. Try to understand: `grep -B 10 -A 10 "at Object.<anonymous>" test-output.txt`
5. More filtering: `sed -n '/FAIL/,/PASS/p' test-output.txt`
6. **Total context used: ~15,000 tokens just to find the failure**

**Next session:**
- You lose all those grep/sed patterns
- Have to rediscover the same filters
- Repeat token expenditure every time

---

### With Laminar (Optimized Approach)

```bash
# Test fails, Laminar automatically creates:
lam summary  # 2KB summary (500 tokens)
lam digest   # 8KB digest (2,000 tokens)
```

**What you get:**
1. **Summary** (500 tokens):
   - Pass/fail counts
   - Which tests failed
   - Digest file paths

2. **Digest** (2,000 tokens):
   - Failure event
   - ±10 events around failure
   - Code frame (2 lines before/after error)
   - Suspects (most relevant log lines)
   - Stack trace (first 3 frames)

**Total context used: ~2,500 tokens (83% reduction)**

---

## Token Efficiency Comparison

### Real Example: Authentication Test Failure

**Scenario**: Test fails because JWT token expired

| Approach | Tokens Used | What You Read |
|----------|-------------|---------------|
| **Raw logs** | 11,000 | All test output, setup, teardown, console logs, stack traces |
| **Manual filtering** | 3,500 | grep -A 20 "Error", still has noise |
| **Laminar digest** | 1,800 | Just the failure + context + code frame |

**Savings: 84% fewer tokens per failure investigation**

For a project with 10 failing tests across 5 sessions:
- Without Laminar: ~175,000 tokens
- With Laminar: ~25,000 tokens
- **You save: 150,000 tokens (75% of a Claude Code session)**

---

## The "Learnings Persist" Advantage

### Without Laminar (Session 1)
```
You: "Show me logs for the auth test"
System: [45KB of output]
You: "Too much. Let me filter..."
You: grep -A 10 "JWT" test-output.txt
You: sed -n '/Error/,/at/p' test-output.txt
You: "Ah, JWT expired at line 45"
```

### Without Laminar (Session 2 - Next Day)
```
You: "Show me logs for the auth test"
System: [45KB of output]
You: "Ugh, need to filter again..."
You: grep -A 10 "JWT" test-output.txt  # REPEAT
You: sed -n '/Error/,/at/p' test-output.txt  # REPEAT
```

**You lose all your filtering work between sessions.**

---

### With Laminar (Session 1)
```
You: "Show me the failing test"
Laminar: [8KB digest with JWT error highlighted]
You: "I want more context around JWT errors in the future"
You: lam rules set --inline '{
  "rules": [{
    "match": { "evt": "jwt.error" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 15 },
      { "type": "codeframe", "contextLines": 3 }
    ],
    "priority": 10,
    "_comment": "2025-10-14: JWT errors need extra context for token expiry debugging"
  }]
}'
```

### With Laminar (Session 2 - Next Day)
```
You: "Show me the failing test"
Laminar: [10KB digest with JWT error + 15 events context + 3-line code frame]
You: "Perfect, I have exactly what I need"
```

**Your filtering rules are saved.** You documented WHY. Future sessions benefit.

---

## Progressive Learning Path

### Level 1: "I Just Want to See Failures"
**When:** First time using Laminar
**Tokens saved:** ~50%

```bash
# Just use defaults
lam run --lane auto
lam summary  # See what failed
lam digest   # Get failure analysis
```

**What you get:**
- Errors highlighted
- Basic code frames
- Secrets redacted automatically

---

### Level 2: "I'm Seeing Patterns"
**When:** After 2-3 debugging sessions
**Tokens saved:** ~70%

```bash
# You notice: "I always need more context around assertion failures"
lam rules set --inline '{
  "rules": [{
    "match": { "evt": "assert.fail" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 12 }
    ],
    "_comment": "Assertions need ±12 events to see test setup"
  }]
}'
```

**What you get:**
- Failures + 12 events before/after
- Still under 3,000 tokens per failure
- Rules persist across sessions

---

### Level 3: "I'm Optimizing for This Codebase"
**When:** After 5-10 sessions, you understand failure patterns
**Tokens saved:** ~85%

```bash
# Complex rules based on learnings
lam rules set --inline '{
  "budget": { "kb": 12, "lines": 250 },
  "rules": [
    {
      "match": { "evt": "jwt.error" },
      "actions": [
        { "type": "include" },
        { "type": "slice", "window": 15 },
        { "type": "codeframe", "contextLines": 3 }
      ],
      "priority": 15,
      "_comment": "JWT errors: need token lifecycle + stack trace"
    },
    {
      "match": { "evt": "database.query" },
      "actions": [
        { "type": "include" },
        { "type": "redact", "field": "payload" }
      ],
      "priority": 10,
      "_comment": "Include DB queries but redact connection strings"
    },
    {
      "match": { "lvl": "error", "path": "src/auth/**" },
      "actions": [
        { "type": "include" },
        { "type": "codeframe", "contextLines": 4 }
      ],
      "priority": 8,
      "_comment": "Auth module: always need deep code context"
    }
  ]
}'
```

**What you get:**
- Custom filtering per failure type
- Documented reasoning (future LLMs see your notes!)
- Optimal token usage for THIS specific codebase
- Rules evolve with your understanding

---

## The "Post-It Notes" Feature

### Why Comments Matter

You're not just saving grep patterns - you're saving **reasoning**:

```json
{
  "rules": [{
    "match": { "evt": "timeout" },
    "actions": [
      { "type": "include" },
      { "type": "slice", "window": 20 }
    ],
    "priority": 12,
    "_comment": "2025-10-14: Timeouts need large window - usually race conditions with setup/teardown. Tried window: 10 (too small), 15 (close), 20 (perfect). Don't go lower!"
  }]
}
```

**Next LLM reading this config:**
- Sees your experimentation (10→15→20)
- Understands WHY 20 is the right number
- Doesn't repeat your trial-and-error
- Knows not to reduce it

**This is knowledge transfer between AI sessions.**

---

## Use Cases: When to Level Up

### Start with Defaults If:
- First time debugging this project
- Quick triage needed
- You don't know failure patterns yet

### Add Custom Rules If:
- You've debugged 3+ similar failures
- You keep needing more context in one area
- Default digest is too sparse or too dense
- You want future sessions to benefit

### Optimize Budget If:
- Digests are truncated (`budgetUsed` ≈ `budgetLimit`)
- You're hitting context window limits (increase `kb`)
- Digests have too much noise (decrease `lines`)

### Use Advanced Features If:
- Tracking flaky tests over time (`trends.query`)
- Comparing test runs (`diff.get`)
- Need to redact sensitive data (`redact` action)
- Debugging specific code paths (`match: { path: "src/module/**" }`)

---

## Bottom Line for LLMs

### Without Laminar:
- ❌ Spend 10,000+ tokens per failure reading raw logs
- ❌ Lose all filtering work between sessions
- ❌ Repeat grep/sed commands every time
- ❌ No knowledge transfer between LLM sessions

### With Laminar:
- ✅ Spend 2,000-3,000 tokens per failure (optimized digests)
- ✅ Rules persist - improve over time
- ✅ Document reasoning for future sessions
- ✅ Knowledge compounds across investigations

**Result**: You can debug 5x more issues in the same context window, and each session makes the next one easier.

---

## Quick Start (5 Minutes)

```bash
# 1. Register project (one-time)
claude mcp: workspace.root.register { root: "/path/to/project", id: "myproject" }

# 2. Run tests
claude mcp: run { project: "myproject", lane: "auto" }

# 3. See failures
claude mcp: summary { project: "myproject" }

# 4. Get optimized digest
claude mcp: digest.generate { project: "myproject" }

# 5. Read digest (2,000 tokens instead of 11,000)
claude mcp: show { project: "myproject", case: "auth/test_jwt_expiry" }
```

**That's it.** You just saved 9,000 tokens and your filtering rules will persist.

---

## FAQ for LLMs

**Q: Does Laminar change what gets logged during tests?**
A: No - raw logs are complete. Laminar only affects the **digest** (the summary you read).

**Q: Can I adjust rules without re-running tests?**
A: Yes! Change `laminar.config.json` and run `lam digest` again. Instant feedback.

**Q: What if I need the full logs anyway?**
A: They're still there! Use `show { case: "...", window: 999 }` to see everything. But start with the digest.

**Q: How do I know if my rules are working?**
A: Check digest JSON: `summary.budgetUsed` vs `summary.budgetLimit`. Aim for 60-80% utilization.

**Q: Can I see what other LLMs configured?**
A: Check `laminar.config.json` comments! Read the `_comment` fields to see reasoning.

**Q: Is this just for test failures?**
A: Primarily yes, but works for any JSONL event stream (can ingest Go tests, pytest, etc.).

---

**Ready?** Start with `readme.get` to see the full workflow, or jump straight to `workspace.root.register` to begin.
