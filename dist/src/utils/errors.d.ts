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
export declare function formatError(message: string, fix?: string): string;
/**
 * Print error and exit with specified code
 */
export declare function exitWithError(message: string, fix?: string, exitCode?: number): never;
/**
 * Common error patterns
 */
export declare const Errors: {
    fileNotFound: (path: string) => ErrorMessage;
    missingArgument: (command: string, usage: string) => ErrorMessage;
    invalidArgument: (arg: string, expected: string) => ErrorMessage;
    configNotFound: () => ErrorMessage;
    invalidConfig: (reason: string) => ErrorMessage;
    distNotFound: () => ErrorMessage;
    binSymlinkMissing: (binName: string) => ErrorMessage;
    noTestsFound: () => ErrorMessage;
    testCaseNotFound: (caseId: string) => ErrorMessage;
    commandFailed: (cmd: string, details?: string) => ErrorMessage;
    generic: (message: string, fix?: string) => ErrorMessage;
};
/**
 * Usage message formatter
 */
export declare function formatUsage(command: string, usage: string, description?: string): string;
//# sourceMappingURL=errors.d.ts.map