import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolveContext, resolveReportsAbsolute } from '../config/resolve.js';
import { listProjects, registerProject, removeProject, getProject, deriveIdFromRoot } from '../project/registry.js';
import { DigestDiffEngine } from '../digest/diff.js';
import { DigestGenerator } from '../digest/generator.js';
import { logUsage } from '../utils/logger.js';

export interface ToolDef<I = any, O = any> {
  name: string;
  description: string;
  handler: (input: I) => Promise<O>;
}

export class LaminarMcpServer {
  private tools: Map<string, ToolDef> = new Map();

  addTool<I, O>(def: ToolDef<I, O>): void {
    if (this.tools.has(def.name)) throw new Error(`Tool already exists: ${def.name}`);
    this.tools.set(def.name, def as ToolDef);
  }

  listTools(): { name: string; description: string }[] {
    return Array.from(this.tools.values()).map(t => ({ name: t.name, description: t.description }));
  }

  async call<I, O>(name: string, input: I): Promise<O> {
    logUsage('mcp', name, input);
    const t = this.tools.get(name);
    if (!t) throw new Error(`Unknown tool: ${name}`);
    return t.handler(input) as Promise<O>;
  }
}

function readSummaryAt(reportsAbs: string): any[] {
  const pIndex = path.join(reportsAbs, 'index.json');
  if (fs.existsSync(pIndex)) {
    try {
      const index = JSON.parse(fs.readFileSync(pIndex, 'utf-8'));
      return index.artifacts || [];
    } catch {}
  }
  const pSum = path.join(reportsAbs, 'summary.jsonl');
  if (!fs.existsSync(pSum)) return [];
  return fs.readFileSync(pSum, 'utf-8').trim().split(/\n+/).map(l => { try { return JSON.parse(l); } catch { return undefined; } }).filter(Boolean);
}

function findTestInIndex(caseId: string, reportsAbs: string): any | null {
  const indexPath = path.join(reportsAbs, 'index.json');
  if (!fs.existsSync(indexPath)) return null;
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const artifacts = index.artifacts || [];
    const [suite, testName] = caseId.split('/');
    const normalized = testName?.replace(/_/g, ' ');
    return artifacts.find((a: any) => {
      const entryLocation = a.location || '';
      const entryTestName = a.testName || '';
      return entryLocation.includes(suite) && (
        entryTestName === normalized || entryTestName.replace(/\s+/g, '_') === testName
      );
    }) || null;
  } catch { return null; }
}

export function createLaminarServer(): LaminarMcpServer {
  const server = new LaminarMcpServer();

  // readme.get — essential introduction for LLMs
  server.addTool<{ }, {
    title: string;
    why: string;
    whyLLMsCare: string;
    caseStudy: { scenario: string; withoutLaminar: { tokens: number; what: string }; withLaminar: { tokens: number; what: string }; savings: string };
    quickstart: string[];
    concepts: { digests: string; rules: string; budget: string; postItNotes: string };
    workflow: string;
    progressivePath: { level1: { when: string; usage: string; savings: string }; level2: { when: string; usage: string; savings: string }; level3: { when: string; usage: string; savings: string } };
    registryPath: string;
    commands: { name: string; description: string; signature: string; tokenCost?: string }[];
    learnMore: string[];
    feedback: string
  }>(
    {
      name: 'readme.get',
      description: '⭐ Start here: Essential guide to Laminar test observability - what it does, why use it, and how to get started',
      handler: async () => {
        const registryPath = path.join(process.env.XDG_CONFIG_HOME ? path.join(process.env.XDG_CONFIG_HOME, 'laminar') : path.join(homedir(), '.laminar'), 'registry.json');

        const why = [
          'Laminar transforms test failures into structured, AI-friendly artifacts.',
          'Instead of parsing raw test output, you get: token-efficient summaries (500 tokens), detailed JSONL logs with stable schema, failure digests with suspects and code frames (2-3K tokens), diff comparison between test runs, and historical trend analysis.',
          'Perfect for understanding test failures, debugging issues, tracking flaky tests, and generating reproduction steps.'
        ].join(' ');

        const whyLLMsCare = [
          'Context window efficiency is critical. Raw test logs consume 10,000-15,000 tokens per failure.',
          'Laminar digests use only 2,000-3,000 tokens (70-85% reduction).',
          'Rules persist across sessions - your filtering work compounds over time.',
          'Document reasoning with _comment fields - future LLM sessions benefit from your learnings.',
          'Result: Debug 5x more issues in the same context window.'
        ].join(' ');

        const caseStudy = {
          scenario: 'Authentication test fails because JWT token expired',
          withoutLaminar: {
            tokens: 11000,
            what: 'Read 45KB of raw logs, grep/sed to filter, lose patterns next session'
          },
          withLaminar: {
            tokens: 1800,
            what: 'Read 8KB digest with failure + context + code frame, rules saved'
          },
          savings: '84% fewer tokens per failure. For 10 failures over 5 sessions: save 150,000 tokens (75% of Claude Code session)'
        };

        const quickstart = [
          '1. Register your project: workspace.root.register { root: "/path/to/project", id: "myproject" }',
          '2. Run tests: run { project: "myproject", lane: "auto" }',
          '3. Check results (500 tokens): summary { project: "myproject" }',
          '4. Analyze failures (2K tokens): digest.generate { project: "myproject" }',
          '5. Deep dive if needed: show { project: "myproject", case: "suite/test_name", window: 30 }'
        ];

        const concepts = {
          digests: 'Compact (~10KB) JSON snapshots of test failures with failure event, ±N events for context, code frames from stack traces, and suspects (most relevant log lines). Purpose: token-efficient summaries instead of 45KB+ raw logs.',
          rules: 'Control what goes into digests (NOT what gets logged). Format: { match: { evt: "assert.fail" }, actions: [{ type: "include" }, { type: "slice", window: 10 }] }. Rules persist across sessions and compound over time.',
          budget: 'Size limits to keep digests AI-friendly. kb: max kilobytes (~10KB default), lines: max events considered (~200 default). Protects your context window from massive logs.',
          postItNotes: 'Use _comment fields in rules to document WHY: { "_comment": "2025-10-14: Timeouts need large window - tried 10 (too small), 15 (close), 20 (perfect)" }. Future LLMs see your reasoning and don\'t repeat trial-and-error.'
        };

        const workflow = 'Token-efficient pattern: run tests → summary (500 tokens) → digest.generate (creates 2K token digests) → read digests → show (1-2K tokens) if need more context. Compare: without Laminar = 11K+ tokens per failure with manual filtering that doesn\'t persist.';

        const progressivePath = {
          level1: {
            when: 'First time using Laminar, don\'t know failure patterns yet',
            usage: 'lam run --lane auto; lam summary; lam digest',
            savings: '~50% tokens vs raw logs. Errors highlighted, basic code frames, secrets redacted automatically.'
          },
          level2: {
            when: 'After 2-3 debugging sessions, seeing patterns',
            usage: 'Add custom rules: lam rules set --inline \'{ "rules": [{ "match": { "evt": "assert.fail" }, "actions": [{ "type": "include" }, { "type": "slice", "window": 12 }], "_comment": "Assertions need ±12 events to see test setup" }] }\'',
            savings: '~70% tokens + rules persist across sessions. No more re-discovering filters.'
          },
          level3: {
            when: 'After 5+ sessions, understand codebase failure patterns',
            usage: 'Optimize per-module: complex rules with different windows/contexts per event type, documented reasoning in comments, budget tuned for this project.',
            savings: '~85% tokens + knowledge compounds for all future sessions. Optimal token usage for THIS specific codebase.'
          }
        };

        const commands = [
          { name: 'workspace.roots.list', description: 'List all registered test projects', signature: '{}', tokenCost: '~100 tokens' },
          { name: 'workspace.root.register', description: 'Register a project (do this first!)', signature: '{ id?, root, configPath?, reportsDir?, historyPath? }', tokenCost: '~50 tokens' },
          { name: 'run', description: 'Execute tests with Laminar instrumentation', signature: '{ project?, lane?, filter? }', tokenCost: 'N/A (test execution)' },
          { name: 'summary', description: 'Get pass/fail counts and test list', signature: '{ project? }', tokenCost: '~500 tokens (very efficient!)' },
          { name: 'show', description: 'View detailed JSONL logs for a specific test', signature: '{ project?, case, around?, window? }', tokenCost: '~1-2K tokens (window-dependent)' },
          { name: 'digest.generate', description: 'Create failure analysis with suspects & code frames', signature: '{ project?, cases? }', tokenCost: '~2-3K tokens per digest' },
          { name: 'diff.get', description: 'Compare two test runs to see what changed', signature: '{ left, right, format? }', tokenCost: '~500-1K tokens' },
          { name: 'trends.query', description: 'Find flaky tests and failure patterns over time', signature: '{ project?, since?, until?, top? }', tokenCost: '~200-500 tokens' },
          { name: 'rules.get', description: 'View Laminar configuration', signature: '{ project? }', tokenCost: '~100-300 tokens' },
          { name: 'rules.set', description: 'Update Laminar configuration', signature: '{ project?, inline? | file? }', tokenCost: '~50 tokens' }
        ];

        const learnMore = [
          'For complete case study with before/after examples: docs/guide/why-llms-care.md',
          'For rules syntax and examples: docs/guide/rules-budget-filters.md',
          'For MCP tool reference: docs/guide/mcp-integration.md',
          'For troubleshooting: docs/guide/troubleshooting.md',
          'For config schema: docs/schema/laminar.config.schema.json'
        ];

        const feedback = [
          '🙏 AI agents are strongly encouraged to submit bug reports and feature requests!',
          'Found a bug? Workflow confusing? Documentation unclear? Wish Laminar could do something it can\'t?',
          'Please open an issue at https://github.com/anteew/Laminar/issues',
          'Agent feedback is highly valued and helps improve the tool for the AI development community.',
          'Share your experience: what worked well, what didn\'t, what would make your workflow better.',
          'Include token counts, workflow pain points, and optimization suggestions.'
        ].join(' ');

        return {
          title: 'Laminar Test Observability',
          why,
          whyLLMsCare,
          caseStudy,
          quickstart,
          concepts,
          workflow,
          progressivePath,
          registryPath,
          commands,
          learnMore,
          feedback
        };
      }
    }
  );

  // workspace.roots.list
  server.addTool<{}, { projects: any[] }>(
    {
      name: 'workspace.roots.list',
      description: 'List registered projects (aliases → roots)',
      handler: async () => {
        const projects = listProjects().map(p => ({
          id: p.id,
          root: p.root,
          configPath: p.configPath ?? null,
          reportsDir: p.reportsDir ?? 'reports',
          historyPath: p.historyPath ?? 'reports/history.jsonl',
        }));
        return { projects };
      }
    }
  );

  // workspace.root.register
  server.addTool<{ id?: string; root: string; configPath?: string; reportsDir?: string; historyPath?: string }, { id: string; root: string }>(
    {
      name: 'workspace.root.register',
      description: 'Register a project alias → root mapping',
      handler: async (input) => {
        if (!input?.root) throw new Error('root is required');
        const id = input.id || deriveIdFromRoot(input.root);
        registerProject({ id, root: path.resolve(input.root), configPath: input.configPath, reportsDir: input.reportsDir, historyPath: input.historyPath });
        return { id, root: path.resolve(input.root) };
      }
    }
  );

  // workspace.root.remove
  server.addTool<{ id: string }, { removed: boolean }>(
    {
      name: 'workspace.root.remove',
      description: 'Remove an alias from registry',
      handler: async (input) => {
        if (!input?.id) throw new Error('id is required');
        const removed = removeProject(input.id);
        return { removed };
      }
    }
  );

  // workspace.root.show
  server.addTool<{ id: string }, any>(
    {
      name: 'workspace.root.show',
      description: 'Show a project record',
      handler: async (input) => {
        if (!input?.id) throw new Error('id is required');
        const rec = getProject(input.id);
        if (!rec) throw new Error('not found');
        return rec;
      }
    }
  );

  // run
  server.addTool<{ project?: string; root?: string; lane?: 'ci'|'pty'|'auto'; filter?: string }, { status: 'ok'; lane: string; warnings: string[] }>(
    {
      name: 'run',
      description: 'Run tests with Laminar instrumentation',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project, root: input.root, lane: input.lane });
        process.chdir(ctx.root);
        const lane = (ctx.lane as string) || input.lane || 'auto';
        const filter = input.filter;
        const sh = (cmd: string, args: string[]) => spawnSync(cmd, args, { stdio: 'inherit' }).status ?? 0;
        if (lane === 'auto') {
          if (filter) { sh('vitest', ['run', '--pool=threads', '--reporter=./dist/src/test/reporter/jsonlReporter.js', '-t', filter]); sh('npm', ['run','laminar:run']); }
          else { sh('npm', ['run','laminar:run']); }
        } else if (lane === 'ci') {
          const a = ['run','test:ci']; if (filter) a.push('--','-t', filter); sh('npm', a);
        } else if (lane === 'pty') {
          const a = ['run','test:pty']; if (filter) a.push('--','-t', filter); sh('npm', a);
        } else { throw new Error('Unknown lane'); }
        return { status: 'ok', lane, warnings: ctx.warnings };
      }
    }
  );

  // summary
  server.addTool<{ project?: string; root?: string; reports?: string }, { entries: any[]; warnings: string[] }>(
    {
      name: 'summary',
      description: 'Return summary entries from last run',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project, root: input.root, reports: input.reports });
        const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
        const entries = readSummaryAt(reportsAbs);
        return { entries, warnings: ctx.warnings };
      }
    }
  );

  // show
  server.addTool<{ project?: string; case: string; around?: string; window?: number }, { slice: string[]; start: number; end: number }>(
    {
      name: 'show',
      description: 'Return a sliced view of a case log around a pattern',
      handler: async (input) => {
        if (!input?.case) throw new Error('case is required');
        const ctx = resolveContext({ project: input.project });
        const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
        const entry = findTestInIndex(input.case, reportsAbs);
        let caseFile: string | undefined = entry?.artifacts?.caseFile;
        if (!caseFile) {
          const [suite, test] = input.case.split('/');
          caseFile = path.join(reportsAbs, `${suite}/${test}.jsonl`);
        }
        if (!caseFile || !fs.existsSync(caseFile)) throw new Error('case file not found');
        const content = fs.readFileSync(caseFile, 'utf-8').split(/\n/);
        const pattern = input.around || 'assert.fail';
        const idx = content.findIndex(l => l.includes(pattern));
        const win = Math.max(1, input.window ?? 50);
        const start = Math.max(0, (idx >= 0 ? idx : 0) - win);
        const end = Math.min(content.length, (idx >= 0 ? idx : 0) + win);
        return { slice: content.slice(start, end), start, end };
      }
    }
  );

  // digest.generate
  server.addTool<{ project?: string; cases?: string[] }, { generated: string[] }>(
    {
      name: 'digest.generate',
      description: 'Generate digests for failed cases (or given cases)',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project });
        const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
        const entries = readSummaryAt(reportsAbs);
        const gen = new DigestGenerator(DigestGenerator.loadConfig(ctx.configPath || path.join(ctx.root, 'laminar.config.json')));
        const targets = input.cases && input.cases.length
          ? entries.filter(e => input.cases!.includes(`${(e.location||'').split('/').pop()?.replace('.ts','')}/${(e.testName||'').replace(/\s+/g,'_')}`))
          : entries.filter(e => (e.status||'').toUpperCase() === 'FAIL');
        const outPaths: string[] = [];
        for (const e of targets) {
          const caseName = `${(e.location||'').split('/').pop()?.replace('.ts','')}/${(e.testName||'').replace(/\s+/g,'_')}`;
          const artifact = e.artifacts?.caseFile || e.artifactURI;
          if (!artifact) continue;
          const digest = await gen.generateDigest(caseName, 'fail', e.duration||0, e.location||'', artifact, e.error);
          if (!digest) continue;
          const outJson = artifact.replace('.jsonl', '.digest.json');
          fs.writeFileSync(outJson, JSON.stringify(digest, null, 2));
          outPaths.push(outJson);
        }
        return { generated: outPaths };
      }
    }
  );

  // diff.get
  server.addTool<{ left: string; right: string; format?: 'json'|'markdown' }, { output: string }>(
    {
      name: 'diff.get',
      description: 'Compare two digest files and return formatted output',
      handler: async (input) => {
        if (!input?.left || !input?.right) throw new Error('left and right are required');
        const engine = new DigestDiffEngine();
        const diff = engine.compareFiles(input.left, input.right);
        const fmt = input.format || 'json';
        if (fmt === 'markdown') return { output: engine.formatAsMarkdown(diff) };
        return { output: engine.formatAsJson(diff, true) };
      }
    }
  );

  // trends.query
  server.addTool<{ project?: string; history?: string; since?: string; until?: string; top?: number }, any>(
    {
      name: 'trends.query',
      description: 'Return trends summary and top offenders',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project, history: input.history });
        const historyPath = path.isAbsolute(ctx.historyPath) ? ctx.historyPath : path.join(ctx.root, ctx.historyPath);
        if (!fs.existsSync(historyPath)) throw new Error('history not found');
        const sinceTs = input.since ? new Date(input.since).getTime() : 0;
        const untilTs = input.until ? new Date(input.until).getTime() : Date.now();
        const topN = input.top ?? 10;
        const entries = fs.readFileSync(historyPath, 'utf-8').trim().split(/\n+/).map(l => { try { return JSON.parse(l); } catch { return undefined; } }).filter(Boolean);
        const filtered = entries.filter((e: any) => {
          const ts = e.ts ?? (e.timestamp ? Date.parse(e.timestamp) : e.time);
          return typeof ts === 'number' && ts >= sinceTs && ts <= untilTs;
        });
        // Lightweight aggregation
        const fails = filtered.filter((e: any) => e.status === 'fail');
        return { total: filtered.length, failures: fails.length, top: topN };
      }
    }
  );

  // rules.get
  server.addTool<{ project?: string }, { config: any }>(
    {
      name: 'rules.get',
      description: 'Return resolved rules configuration',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project });
        const cfgPath = ctx.configPath || path.join(ctx.root, 'laminar.config.json');
        const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) : {};
        return { config: cfg };
      }
    }
  );

  // rules.set
  server.addTool<{ project?: string; inline?: any; file?: string }, { updated: string }>(
    {
      name: 'rules.set',
      description: 'Update rules configuration (inline or from file)',
      handler: async (input) => {
        const ctx = resolveContext({ project: input.project });
        const cfgPath = ctx.configPath || path.join(ctx.root, 'laminar.config.json');
        const content = input.file ? fs.readFileSync(input.file, 'utf-8') : JSON.stringify(input.inline ?? {});
        JSON.parse(content); // validate
        fs.writeFileSync(cfgPath, content);
        return { updated: cfgPath };
      }
    }
  );

  return server;
}

