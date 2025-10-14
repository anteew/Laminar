/**
 * Normalizes file paths for fingerprint generation to ensure consistency
 * across different checkout directories (e.g., CI base/head dual-checkout).
 *
 * Handles:
 * - CI dual-checkout pattern: .../base/... or .../head/... → relative path
 * - Absolute local paths → relative to cwd
 * - Already relative paths → unchanged
 */
export declare function normalizePathForFingerprint(filePath: string): string;
export interface FailureInfo {
    testName: string;
    errorType?: string;
    stackLocation?: string;
    errorMessage?: string;
}
export interface HistoryEntry {
    timestamp: string;
    fingerprint: string;
    testName: string;
    status: 'pass' | 'fail' | 'skip';
    duration: number;
    location: string;
    runMetadata?: {
        seed?: string;
        runId?: string;
        [key: string]: any;
    };
}
export declare function generateFingerprint(failure: FailureInfo): string;
export declare function extractFailureInfo(testName: string, error?: string, payload?: any): FailureInfo;
//# sourceMappingURL=fingerprint.d.ts.map