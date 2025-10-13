/**
 * Standardized error messages for Laminar CLI
 * Provides consistent, actionable error messages with clear remediation steps
 */
/**
 * Format an error message with optional fix suggestion
 */
export function formatError(message, fix) {
    let output = `Error: ${message}`;
    if (fix) {
        output += `\n  → Fix: ${fix}`;
    }
    return output;
}
/**
 * Print error and exit with specified code
 */
export function exitWithError(message, fix, exitCode = 1) {
    console.error(formatError(message, fix));
    process.exit(exitCode);
}
/**
 * Common error patterns
 */
export const Errors = {
    fileNotFound: (path) => ({
        message: `File not found: ${path}`,
        fix: 'Verify the file path and ensure the file exists',
        exitCode: 1,
    }),
    missingArgument: (command, usage) => ({
        message: `Missing required argument for '${command}'`,
        fix: `Usage: ${usage}`,
        exitCode: 1,
    }),
    invalidArgument: (arg, expected) => ({
        message: `Invalid argument: ${arg}`,
        fix: `Expected: ${expected}`,
        exitCode: 1,
    }),
    configNotFound: () => ({
        message: 'laminar.config.json not found',
        fix: 'Initialize Laminar: npx lam init',
        exitCode: 1,
    }),
    invalidConfig: (reason) => ({
        message: `Invalid configuration: ${reason}`,
        fix: 'Fix the configuration file or regenerate: npx lam init --force',
        exitCode: 1,
    }),
    distNotFound: () => ({
        message: 'Laminar dist files not found',
        fix: 'Reinstall Laminar: npm install -D @agent_vega/laminar',
        exitCode: 1,
    }),
    binSymlinkMissing: (binName) => ({
        message: `Binary symlink missing: ${binName}`,
        fix: 'Rebuild node_modules: npm install or npm rebuild',
        exitCode: 1,
    }),
    noTestsFound: () => ({
        message: 'No test results found',
        fix: 'Run tests first: npx lam run',
        exitCode: 1,
    }),
    testCaseNotFound: (caseId) => ({
        message: `Test case not found: ${caseId}`,
        fix: 'Check test case name and verify it exists in reports/',
        exitCode: 1,
    }),
    commandFailed: (cmd, details) => ({
        message: `Command failed: ${cmd}`,
        fix: details || 'Check the command output for details',
        exitCode: 1,
    }),
    generic: (message, fix) => ({
        message,
        fix,
        exitCode: 1,
    }),
};
/**
 * Usage message formatter
 */
export function formatUsage(command, usage, description) {
    let output = `Usage: lam ${command} ${usage}`;
    if (description) {
        output += `\n  ${description}`;
    }
    return output;
}
//# sourceMappingURL=errors.js.map