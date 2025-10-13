/**
 * Standardized error messages for Laminar CLI
 * Provides consistent, actionable error messages with clear remediation steps
 */

export interface ErrorMessage {
  message: string;
  fix?: string;
  exitCode?: number;
}

/**
 * Format an error message with optional fix suggestion
 */
export function formatError(message: string, fix?: string): string {
  let output = `Error: ${message}`;
  if (fix) {
    output += `\n  → Fix: ${fix}`;
  }
  return output;
}

/**
 * Print error and exit with specified code
 */
export function exitWithError(message: string, fix?: string, exitCode: number = 1): never {
  console.error(formatError(message, fix));
  process.exit(exitCode);
}

/**
 * Common error patterns
 */
export const Errors = {
  fileNotFound: (path: string): ErrorMessage => ({
    message: `File not found: ${path}`,
    fix: 'Verify the file path and ensure the file exists',
    exitCode: 1,
  }),

  missingArgument: (command: string, usage: string): ErrorMessage => ({
    message: `Missing required argument for '${command}'`,
    fix: `Usage: ${usage}`,
    exitCode: 1,
  }),

  invalidArgument: (arg: string, expected: string): ErrorMessage => ({
    message: `Invalid argument: ${arg}`,
    fix: `Expected: ${expected}`,
    exitCode: 1,
  }),

  configNotFound: (): ErrorMessage => ({
    message: 'laminar.config.json not found',
    fix: 'Initialize Laminar: npx lam init',
    exitCode: 1,
  }),

  invalidConfig: (reason: string): ErrorMessage => ({
    message: `Invalid configuration: ${reason}`,
    fix: 'Fix the configuration file or regenerate: npx lam init --force',
    exitCode: 1,
  }),

  distNotFound: (): ErrorMessage => ({
    message: 'Laminar dist files not found',
    fix: 'Reinstall Laminar: npm install -D @agent_vega/laminar',
    exitCode: 1,
  }),

  binSymlinkMissing: (binName: string): ErrorMessage => ({
    message: `Binary symlink missing: ${binName}`,
    fix: 'Rebuild node_modules: npm install or npm rebuild',
    exitCode: 1,
  }),

  noTestsFound: (): ErrorMessage => ({
    message: 'No test results found',
    fix: 'Run tests first: npx lam run',
    exitCode: 1,
  }),

  testCaseNotFound: (caseId: string): ErrorMessage => ({
    message: `Test case not found: ${caseId}`,
    fix: 'Check test case name and verify it exists in reports/',
    exitCode: 1,
  }),

  commandFailed: (cmd: string, details?: string): ErrorMessage => ({
    message: `Command failed: ${cmd}`,
    fix: details || 'Check the command output for details',
    exitCode: 1,
  }),

  generic: (message: string, fix?: string): ErrorMessage => ({
    message,
    fix,
    exitCode: 1,
  }),
};

/**
 * Usage message formatter
 */
export function formatUsage(command: string, usage: string, description?: string): string {
  let output = `Usage: lam ${command} ${usage}`;
  if (description) {
    output += `\n  ${description}`;
  }
  return output;
}
