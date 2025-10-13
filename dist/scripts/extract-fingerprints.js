#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateFingerprint, extractFailureInfo } from '../src/digest/fingerprint.js';
function extractFingerprintsFromReports(reportsDir) {
    const records = [];
    if (!fs.existsSync(reportsDir)) {
        console.error(`Reports directory not found: ${reportsDir}`);
        return records;
    }
    const digestFiles = findDigestFiles(reportsDir);
    for (const digestPath of digestFiles) {
        try {
            const content = fs.readFileSync(digestPath, 'utf-8');
            const digest = JSON.parse(content);
            if (digest.status === 'fail') {
                const failureInfo = extractFailureInfo(digest.case, digest.error, digest.events.find(e => e.lvl === 'error')?.payload);
                const fingerprint = generateFingerprint(failureInfo);
                records.push({
                    testName: digest.case,
                    fingerprint,
                    location: digest.location,
                    error: digest.error,
                    errorType: failureInfo.errorType,
                    stackLocation: failureInfo.stackLocation,
                });
            }
        }
        catch (err) {
            console.error(`Failed to process ${digestPath}:`, err);
        }
    }
    return records;
}
function findDigestFiles(dir) {
    const results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results.push(...findDigestFiles(fullPath));
        }
        else if (item.endsWith('.digest.json')) {
            results.push(fullPath);
        }
    }
    return results;
}
function main() {
    const args = process.argv.slice(2);
    const reportsDir = args[0] || 'reports';
    const outputPath = args[1] || 'fingerprints.json';
    console.log(`Extracting fingerprints from: ${reportsDir}`);
    const records = extractFingerprintsFromReports(reportsDir);
    console.log(`Found ${records.length} fingerprint(s)`);
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
    console.log(`Fingerprints written to: ${outputPath}`);
    console.log(JSON.stringify(records));
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { extractFingerprintsFromReports };
//# sourceMappingURL=extract-fingerprints.js.map