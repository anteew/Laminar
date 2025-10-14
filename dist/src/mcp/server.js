import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolveContext, resolveReportsAbsolute } from '../config/resolve.js';
import { listProjects, registerProject, removeProject, getProject, deriveIdFromRoot } from '../project/registry.js';
import { DigestDiffEngine } from '../digest/diff.js';
import { DigestGenerator } from '../digest/generator.js';
import { logUsage } from '../utils/logger.js';
export class LaminarMcpServer {
    tools = new Map();
    addTool(def) {
        if (this.tools.has(def.name))
            throw new Error(`Tool already exists: ${def.name}`);
        this.tools.set(def.name, def);
    }
    listTools() {
        return Array.from(this.tools.values()).map(t => ({ name: t.name, description: t.description }));
    }
    async call(name, input) {
        logUsage('mcp', name, input);
        const t = this.tools.get(name);
        if (!t)
            throw new Error(`Unknown tool: ${name}`);
        return t.handler(input);
    }
}
function readSummaryAt(reportsAbs) {
    const pIndex = path.join(reportsAbs, 'index.json');
    if (fs.existsSync(pIndex)) {
        try {
            const index = JSON.parse(fs.readFileSync(pIndex, 'utf-8'));
            return index.artifacts || [];
        }
        catch { }
    }
    const pSum = path.join(reportsAbs, 'summary.jsonl');
    if (!fs.existsSync(pSum))
        return [];
    return fs.readFileSync(pSum, 'utf-8').trim().split(/\n+/).map(l => { try {
        return JSON.parse(l);
    }
    catch {
        return undefined;
    } }).filter(Boolean);
}
function findTestInIndex(caseId, reportsAbs) {
    const indexPath = path.join(reportsAbs, 'index.json');
    if (!fs.existsSync(indexPath))
        return null;
    try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        const artifacts = index.artifacts || [];
        const [suite, testName] = caseId.split('/');
        const normalized = testName?.replace(/_/g, ' ');
        return artifacts.find((a) => {
            const entryLocation = a.location || '';
            const entryTestName = a.testName || '';
            return entryLocation.includes(suite) && (entryTestName === normalized || entryTestName.replace(/\s+/g, '_') === testName);
        }) || null;
    }
    catch {
        return null;
    }
}
export function createLaminarServer() {
    const server = new LaminarMcpServer();
    // readme.get — essential introduction for LLMs
    server.addTool({
        name: 'readme.get',
        description: '⭐ Start here: Essential guide to Laminar test observability - what it does, why use it, and how to get started',
        handler: async () => {
            const registryPath = path.join(process.env.XDG_CONFIG_HOME ? path.join(process.env.XDG_CONFIG_HOME, 'laminar') : path.join(homedir(), '.laminar'), 'registry.json');
            const why = [
                'Laminar transforms test failures into structured, AI-friendly artifacts.',
                'Instead of parsing raw test output, you get: token-efficient summaries, detailed JSONL logs with stable schema, failure digests with suspects and code frames, diff comparison between test runs, and historical trend analysis.',
                'Perfect for understanding test failures, debugging issues, tracking flaky tests, and generating reproduction steps.'
            ].join(' ');
            const quickstart = [
                '1. Register your project: workspace.root.register { root: "/path/to/project", id: "myproject" }',
                '2. Run tests: run { project: "myproject", lane: "auto" }',
                '3. Check results: summary { project: "myproject" }',
                '4. Analyze failures: digest.generate { project: "myproject" }',
                '5. Deep dive: show { project: "myproject", case: "suite/test_name" }'
            ];
            const workflow = 'Common pattern: run tests → check summary for pass/fail counts → generate digests for failures → examine detailed logs with show → compare runs with diff.get → track patterns with trends.query';
            const commands = [
                { name: 'workspace.roots.list', description: 'List all registered test projects', signature: '{}' },
                { name: 'workspace.root.register', description: 'Register a project (do this first!)', signature: '{ id?, root, configPath?, reportsDir?, historyPath? }' },
                { name: 'run', description: 'Execute tests with Laminar instrumentation', signature: '{ project?, lane?, filter? }' },
                { name: 'summary', description: 'Get pass/fail counts and test list', signature: '{ project? }' },
                { name: 'show', description: 'View detailed JSONL logs for a specific test', signature: '{ project?, case, around?, window? }' },
                { name: 'digest.generate', description: 'Create failure analysis with suspects & code frames', signature: '{ project?, cases? }' },
                { name: 'diff.get', description: 'Compare two test runs to see what changed', signature: '{ left, right, format? }' },
                { name: 'trends.query', description: 'Find flaky tests and failure patterns over time', signature: '{ project?, since?, until?, top? }' },
                { name: 'rules.get', description: 'View Laminar configuration', signature: '{ project? }' },
                { name: 'rules.set', description: 'Update Laminar configuration', signature: '{ project?, inline? | file? }' }
            ];
            const feedback = [
                '🙏 AI agents are strongly encouraged to submit bug reports and feature requests!',
                'Found a bug? Workflow confusing? Documentation unclear? Wish Laminar could do something it can\'t?',
                'Please open an issue at https://github.com/anteew/Laminar/issues',
                'Agent feedback is highly valued and helps improve the tool for the AI development community.',
                'Share your experience: what worked well, what didn\'t, what would make your workflow better.'
            ].join(' ');
            return { title: 'Laminar Test Observability', why, quickstart, workflow, registryPath, commands, feedback };
        }
    });
    // workspace.roots.list
    server.addTool({
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
    });
    // workspace.root.register
    server.addTool({
        name: 'workspace.root.register',
        description: 'Register a project alias → root mapping',
        handler: async (input) => {
            if (!input?.root)
                throw new Error('root is required');
            const id = input.id || deriveIdFromRoot(input.root);
            registerProject({ id, root: path.resolve(input.root), configPath: input.configPath, reportsDir: input.reportsDir, historyPath: input.historyPath });
            return { id, root: path.resolve(input.root) };
        }
    });
    // workspace.root.remove
    server.addTool({
        name: 'workspace.root.remove',
        description: 'Remove an alias from registry',
        handler: async (input) => {
            if (!input?.id)
                throw new Error('id is required');
            const removed = removeProject(input.id);
            return { removed };
        }
    });
    // workspace.root.show
    server.addTool({
        name: 'workspace.root.show',
        description: 'Show a project record',
        handler: async (input) => {
            if (!input?.id)
                throw new Error('id is required');
            const rec = getProject(input.id);
            if (!rec)
                throw new Error('not found');
            return rec;
        }
    });
    // run
    server.addTool({
        name: 'run',
        description: 'Run tests with Laminar instrumentation',
        handler: async (input) => {
            const ctx = resolveContext({ project: input.project, root: input.root, lane: input.lane });
            process.chdir(ctx.root);
            const lane = ctx.lane || input.lane || 'auto';
            const filter = input.filter;
            const sh = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit' }).status ?? 0;
            if (lane === 'auto') {
                if (filter) {
                    sh('vitest', ['run', '--pool=threads', '--reporter=./dist/test/reporter/jsonlReporter.js', '-t', filter]);
                    sh('npm', ['run', 'laminar:run']);
                }
                else {
                    sh('npm', ['run', 'laminar:run']);
                }
            }
            else if (lane === 'ci') {
                const a = ['run', 'test:ci'];
                if (filter)
                    a.push('--', '-t', filter);
                sh('npm', a);
            }
            else if (lane === 'pty') {
                const a = ['run', 'test:pty'];
                if (filter)
                    a.push('--', '-t', filter);
                sh('npm', a);
            }
            else {
                throw new Error('Unknown lane');
            }
            return { status: 'ok', lane, warnings: ctx.warnings };
        }
    });
    // summary
    server.addTool({
        name: 'summary',
        description: 'Return summary entries from last run',
        handler: async (input) => {
            const ctx = resolveContext({ project: input.project, root: input.root, reports: input.reports });
            const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
            const entries = readSummaryAt(reportsAbs);
            return { entries, warnings: ctx.warnings };
        }
    });
    // show
    server.addTool({
        name: 'show',
        description: 'Return a sliced view of a case log around a pattern',
        handler: async (input) => {
            if (!input?.case)
                throw new Error('case is required');
            const ctx = resolveContext({ project: input.project });
            const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
            const entry = findTestInIndex(input.case, reportsAbs);
            let caseFile = entry?.artifacts?.caseFile;
            if (!caseFile) {
                const [suite, test] = input.case.split('/');
                caseFile = path.join(reportsAbs, `${suite}/${test}.jsonl`);
            }
            if (!caseFile || !fs.existsSync(caseFile))
                throw new Error('case file not found');
            const content = fs.readFileSync(caseFile, 'utf-8').split(/\n/);
            const pattern = input.around || 'assert.fail';
            const idx = content.findIndex(l => l.includes(pattern));
            const win = Math.max(1, input.window ?? 50);
            const start = Math.max(0, (idx >= 0 ? idx : 0) - win);
            const end = Math.min(content.length, (idx >= 0 ? idx : 0) + win);
            return { slice: content.slice(start, end), start, end };
        }
    });
    // digest.generate
    server.addTool({
        name: 'digest.generate',
        description: 'Generate digests for failed cases (or given cases)',
        handler: async (input) => {
            const ctx = resolveContext({ project: input.project });
            const reportsAbs = resolveReportsAbsolute(ctx.root, ctx.reportsDir);
            const entries = readSummaryAt(reportsAbs);
            const gen = new DigestGenerator(DigestGenerator.loadConfig(ctx.configPath || path.join(ctx.root, 'laminar.config.json')));
            const targets = input.cases && input.cases.length
                ? entries.filter(e => input.cases.includes(`${(e.location || '').split('/').pop()?.replace('.ts', '')}/${(e.testName || '').replace(/\s+/g, '_')}`))
                : entries.filter(e => (e.status || '').toUpperCase() === 'FAIL');
            const outPaths = [];
            for (const e of targets) {
                const caseName = `${(e.location || '').split('/').pop()?.replace('.ts', '')}/${(e.testName || '').replace(/\s+/g, '_')}`;
                const artifact = e.artifacts?.caseFile || e.artifactURI;
                if (!artifact)
                    continue;
                const digest = await gen.generateDigest(caseName, 'fail', e.duration || 0, e.location || '', artifact, e.error);
                if (!digest)
                    continue;
                const outJson = artifact.replace('.jsonl', '.digest.json');
                fs.writeFileSync(outJson, JSON.stringify(digest, null, 2));
                outPaths.push(outJson);
            }
            return { generated: outPaths };
        }
    });
    // diff.get
    server.addTool({
        name: 'diff.get',
        description: 'Compare two digest files and return formatted output',
        handler: async (input) => {
            if (!input?.left || !input?.right)
                throw new Error('left and right are required');
            const engine = new DigestDiffEngine();
            const diff = engine.compareFiles(input.left, input.right);
            const fmt = input.format || 'json';
            if (fmt === 'markdown')
                return { output: engine.formatAsMarkdown(diff) };
            return { output: engine.formatAsJson(diff, true) };
        }
    });
    // trends.query
    server.addTool({
        name: 'trends.query',
        description: 'Return trends summary and top offenders',
        handler: async (input) => {
            const ctx = resolveContext({ project: input.project, history: input.history });
            const historyPath = path.isAbsolute(ctx.historyPath) ? ctx.historyPath : path.join(ctx.root, ctx.historyPath);
            if (!fs.existsSync(historyPath))
                throw new Error('history not found');
            const sinceTs = input.since ? new Date(input.since).getTime() : 0;
            const untilTs = input.until ? new Date(input.until).getTime() : Date.now();
            const topN = input.top ?? 10;
            const entries = fs.readFileSync(historyPath, 'utf-8').trim().split(/\n+/).map(l => { try {
                return JSON.parse(l);
            }
            catch {
                return undefined;
            } }).filter(Boolean);
            const filtered = entries.filter((e) => {
                const ts = e.ts ?? (e.timestamp ? Date.parse(e.timestamp) : e.time);
                return typeof ts === 'number' && ts >= sinceTs && ts <= untilTs;
            });
            // Lightweight aggregation
            const fails = filtered.filter((e) => e.status === 'fail');
            return { total: filtered.length, failures: fails.length, top: topN };
        }
    });
    // rules.get
    server.addTool({
        name: 'rules.get',
        description: 'Return resolved rules configuration',
        handler: async (input) => {
            const ctx = resolveContext({ project: input.project });
            const cfgPath = ctx.configPath || path.join(ctx.root, 'laminar.config.json');
            const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) : {};
            return { config: cfg };
        }
    });
    // rules.set
    server.addTool({
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
    });
    return server;
}
//# sourceMappingURL=server.js.map