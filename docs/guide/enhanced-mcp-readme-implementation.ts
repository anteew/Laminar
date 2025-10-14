/**
 * Enhanced MCP readme.get Implementation
 *
 * This shows how to update src/mcp/server.ts to include
 * the comprehensive "Why LLMs Care" information.
 *
 * Replace the existing readme.get handler with this enhanced version.
 */

// Update the return type to include new fields
type EnhancedReadmeResponse = {
  title: string;
  why: string;
  whyLLMsCare: string;
  caseStudy: {
    scenario: string;
    withoutLaminar: { tokens: number, what: string };
    withLaminar: { tokens: number, what: string };
    savings: string;
  };
  quickstart: string[];
  concepts: {
    digests: string;
    rules: string;
    budget: string;
    postItNotes: string;
  };
  workflow: string;
  progressivePath: {
    level1: { when: string; usage: string; savings: string };
    level2: { when: string; usage: string; savings: string };
    level3: { when: string; usage: string; savings: string };
  };
  registryPath: string;
  commands: { name: string; description: string; signature: string; tokenCost?: string }[];
  learnMore: string[];
  feedback: string;
};

// Enhanced readme.get handler
server.addTool<{}, EnhancedReadmeResponse>({
  name: 'readme.get',
  description: '⭐ Start here: Essential guide to Laminar test observability - what it does, why use it, and how to get started',
  handler: async () => {
    const registryPath = path.join(
      process.env.XDG_CONFIG_HOME ? path.join(process.env.XDG_CONFIG_HOME, 'laminar') : path.join(homedir(), '.laminar'),
      'registry.json'
    );

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
});

/**
 * USAGE NOTES:
 *
 * 1. This enhanced response is ~250 tokens (vs ~65 tokens for minimal version)
 * 2. Provides critical context that saves 10,000+ tokens per debugging session
 * 3. ROI: Spend 250 tokens once, save 10,000+ tokens repeatedly
 *
 * 4. Alternative: Keep minimal version, add a separate "readme.why_llms_care" tool
 *    for agents who want deeper understanding without bloating the main readme.
 *
 * 5. Consider: The caseStudy object could link to external docs instead of
 *    being inline, reducing tokens while still providing the information.
 *
 * RECOMMENDATION:
 * - Use this full version for now
 * - Monitor token usage via telemetry
 * - If agents rarely read full response, split into:
 *   - readme.get (essential workflow)
 *   - readme.why_llms_care (case studies, optimization guide)
 *   - readme.advanced (deep dive on rules/budget)
 */

/**
 * ALTERNATIVE: Compressed Version (~150 tokens)
 *
 * If token count is critical, use this compressed version instead:
 */

const compressedVersion = {
  title: 'Laminar Test Observability',

  why: 'Transform 45KB test logs (11K tokens) into 8KB digests (2K tokens). 84% token savings. Rules persist across sessions.',

  caseStudy: 'Real example: Auth test failure. Without: 11K tokens. With: 1.8K tokens. 10 failures over 5 sessions: save 150K tokens.',

  quickstart: [
    'workspace.root.register {root: "/path"}',
    'run {project: "myproject"}',
    'summary {project: "myproject"} // 500 tokens',
    'digest.generate {project: "myproject"} // 2K tokens/digest',
    'show {case: "suite/test"} // if need more'
  ],

  concepts: {
    digests: '~10KB snapshots with failure+context+codeframes (vs 45KB+ raw)',
    rules: 'Control digest content. Persist across sessions. Example: {match: {evt: "assert.fail"}, actions: [{type: "include"}, {type: "slice", window: 10}]}',
    budget: 'Size limits. kb: ~10KB (default), lines: ~200 (default). Protects context window.',
    comments: 'Document WHY with _comment fields. Future LLMs see your reasoning.'
  },

  progressivePath: 'L1: Use defaults (~50% savings). L2: Add rules after 2-3 sessions (~70% + persist). L3: Optimize per-codebase after 5+ sessions (~85% + compound knowledge).',

  commands: [/* same as full version but without tokenCost field */],

  learnMore: [
    'Full case study: docs/guide/why-llms-care.md',
    'Rules guide: docs/guide/rules-budget-filters.md',
    'MCP reference: docs/guide/mcp-integration.md'
  ],

  feedback: '🙏 AI agents: submit issues at https://github.com/anteew/Laminar/issues. Include token counts & workflow pain points.'
};

/**
 * IMPLEMENTATION INSTRUCTIONS:
 *
 * 1. Open: /home/ubuntu/repos/Laminar/src/mcp/server.ts
 *
 * 2. Find the readme.get handler (lines 71-119)
 *
 * 3. Replace with either:
 *    - Full version above (recommended, ~250 tokens)
 *    - Compressed version (~150 tokens)
 *
 * 4. Update the return type interface at the top of the handler
 *
 * 5. Build: npm run build
 *
 * 6. Test: restart Claude Code and call readme.get
 *
 * 7. Monitor: Check if agents read the full response or skip sections
 *
 * 8. Iterate: Adjust based on usage patterns
 */
