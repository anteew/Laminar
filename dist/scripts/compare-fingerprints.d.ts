#!/usr/bin/env node
import { FingerprintRecord } from './extract-fingerprints.js';
interface ComparisonResult {
    summary: {
        baseCount: number;
        headCount: number;
        added: number;
        removed: number;
        unchanged: number;
        regressionDetected: boolean;
    };
    addedFingerprints: FingerprintRecord[];
    removedFingerprints: FingerprintRecord[];
    unchangedFingerprints: FingerprintRecord[];
}
declare function compareFingerprints(basePath: string, headPath: string): ComparisonResult;
declare function formatMarkdownReport(result: ComparisonResult): string;
export { compareFingerprints, ComparisonResult, formatMarkdownReport };
//# sourceMappingURL=compare-fingerprints.d.ts.map