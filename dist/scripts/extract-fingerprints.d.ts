#!/usr/bin/env node
interface FingerprintRecord {
    testName: string;
    fingerprint: string;
    location: string;
    error?: string;
    errorType?: string;
    stackLocation?: string;
}
declare function extractFingerprintsFromReports(reportsDir: string): FingerprintRecord[];
export { extractFingerprintsFromReports, FingerprintRecord };
//# sourceMappingURL=extract-fingerprints.d.ts.map