Laminar Rules, Budget, and Filters — Quick Guide

Why Laminar helps (for agents)
- Keeps failure context tiny and high‑signal so you don’t blow your token budget.
- Gives you precise “what to look at next” via rules and optional hints.
- Standardizes artifacts (summary.jsonl, per‑case JSONL, digests) so you can script triage and trends.

What is a digest?
- A compact JSON snapshot of a failing test’s most relevant events, suspects, and optional codeframes.
- Built from the per‑case JSONL log using rules and a strict budget (see below).
- Default output files: `<suite>/<case>.digest.json` and `<suite>/<case>.digest.md` next to the case JSONL.

Event model (very short)
- Each line in the per‑case JSONL is an event with fields like: `ts`, `lvl`, `evt`, `case`, `phase?`, `corr?`, `path?`, `payload?`.
- Examples: `evt: 'assert.fail'`, `lvl: 'error'`, `phase: 'setup'|'call'|'teardown'` (ingest adapters may set these).

laminar.config.json — the parts you care about
```json
{
  "enabled": true,
  "budget": { "kb": 10, "lines": 200 },
  "rules": [
    {
      "match": { "lvl": "error" },
      "actions": [ { "type": "include" }, { "type": "codeframe", "contextLines": 2 } ],
      "priority": 10
    },
    {
      "match": { "evt": "assert.fail" },
      "actions": [ { "type": "include" }, { "type": "slice", "window": 10 } ],
      "priority": 9
    }
  ],
  "redaction": { "enabled": true, "secrets": true }
}
```

Rules: what they do
- A rule says “when an event MATCHes, perform ACTIONS”. Higher `priority` runs first.
- match fields (any can be a string or array): `evt`, `lvl`, `phase`, `case`, `path`.
- actions:
  - `include` — keep the matching event in the digest.
  - `slice {window}` — also keep ±N events around the match (context window from the source log, not tokens).
  - `redact {field}` — replace a field (e.g., `payload`) with `[REDACTED]` in the included event.
  - `codeframe {contextLines}` — attempt to extract codeframes from error stacks for nearby events.

Minimal examples
1) Keep all error‑level events and try to show a 2‑line codeframe
```json
{ "match": { "lvl": "error" }, "actions": [ {"type": "include"}, {"type": "codeframe", "contextLines": 2 } ] }
```

2) For assertion failures, include the event and 10 events around it
```json
{ "match": { "evt": "assert.fail" }, "actions": [ {"type": "include"}, {"type": "slice", "window": 10 } ] }
```

3) Redact a field in security events (and still include them)
```json
{ "match": { "evt": ["auth.token", "security.audit"] }, "actions": [ {"type": "include"}, {"type": "redact", "field": "payload" } ] }
```

Budget: what gets limited and why
- The budget enforces a strict upper bound on digest size to keep responses agent‑friendly.
- `budget.kb` — maximum serialized size of the digest’s `events` section (approximate bytes). Default 10KB.
- `budget.lines` — maximum number of events considered before we start trimming. Default 200.
- Trimming strategy: keep included events (and slices) in order, then reduce until both line and byte budgets are satisfied. Suspects/codeframes also count toward the overall footprint.

Filters you can use right away
- CLI quick filters (work from the generated artifacts):
  - `lam show --case <suite/case> --around assert.fail --window 50` — slice a human‑readable view around a pattern.
  - `lam digest --cases <suite/case1>,<suite/case2>` — build digests just for specific cases.
  - `lam trends --top 10` — show top failure fingerprints from history.
- Log query (structured):
  - `lam logq -- evt=/assert\.fail/ reports/<suite>/<case>.jsonl` — grep‑like matching on `evt` field.
  - `lam logq -- lvl=error --around corr=abc123 --window 5 reports/<suite>/<case>.jsonl` — filter + contextual slice.

Typical workflows
1) “Only show me the failure and a little context”
   - Add a rule with `{ match: { evt: 'assert.fail' }, actions: [include, {slice:{window:8}}] }`
   - Run `lam digest` and review `<suite>/<case>.digest.md`.

2) “My digest is too big; why?”
   - Check `summary.budgetUsed` vs `summary.budgetLimit` inside the digest JSON.
   - Reduce `window` sizes or lower `budget.lines`; ensure you are not including large payloads (use `redact`).

3) “I need more context for one module”
   - Add a temporary rule (overlay) that slices around `evt: 'module.x'` with `window: 20`.
   - Re‑run `lam digest` (or call the MCP tool `digest.generate`) and compare.

JSON Schema (laminar.config.json)
- Use this schema to validate your config; fields are optional unless specified.
- File: `docs/schema/laminar.config.schema.json`

Schema highlights:
- `enabled`: toggle digests on/off quickly.
- `budget.kb`/`budget.lines`: cap digest size by bytes and lines.
- `rules[]`: array of `{ match, actions[], priority? }`.
- `redaction`: master switch for built‑in secret redactions (JWTs, API keys, URL creds, etc.).

FAQ
- “Do rules change my raw logs?” No — rules only affect what goes into the digest artifacts. Your per‑case JSONL stays complete.
- “Are rules order‑dependent?” Yes — higher `priority` acts first. If omitted, order among equal priorities is stable but not significant.
- “What if I include too much?” The budget trims; design rules to minimize unnecessary slices and redact large payloads.

Pointers
- CLI help: `npm exec lam -- --help`
- MCP: use `readme.get`, `workspace.roots.list`, then `summary`, `show`, `digest.generate`, `trends.query` with `{ project: <alias> }`.

