export interface CheckResult {
    name: string;
    passed: boolean;
    message: string;
    fix?: string;
    critical: boolean;
}
export declare function checkNodeVersion(): CheckResult;
export declare function checkPath(): CheckResult;
export declare function checkBinSymlinks(): CheckResult;
export declare function checkDistPresence(): CheckResult;
export declare function checkReporterPath(): CheckResult;
export declare function checkLaminarConfig(): CheckResult;
export declare function runAllChecks(): CheckResult[];
//# sourceMappingURL=checks.d.ts.map