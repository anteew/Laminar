# Laminar

Agent-first test observability: JSONL artifacts, digests, hints, trends, diff/repro, cross-language ingest.

## Install (private scoped)

Laminar is currently published as a private scoped package: `@agent_vega/laminar`.

1) Configure npm auth (read-only token) for this machine or CI:

```ini
# ~/.npmrc
@agent_vega:registry=https://registry.npmjs.org
always-auth=true
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

2) Install as a dev dependency:

```bash
npm install -D @agent_vega/laminar
```

## CLI

If installed locally:

```bash
npm exec lam -- --help
```

Without installing (uses package from the private scope):

```bash
npx -p @agent_vega/laminar lam --help
```

## Vitest reporter wiring

Use the JSONL reporter path from the package:

```json
{
  "scripts": {
    "test:ci": "vitest run --reporter=./node_modules/@agent_vega/laminar/dist/src/test/reporter/jsonlReporter.js"
  }
}
```
