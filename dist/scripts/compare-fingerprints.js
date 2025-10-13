#!/usr/bin/env node
import * as fs from 'node:fs';
function compareFingerprints(basePath, headPath) {
    const baseRecords = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
    const headRecords = JSON.parse(fs.readFileSync(headPath, 'utf-8'));
    const baseMap = new Map();
    const headMap = new Map();
    baseRecords.forEach(r => baseMap.set(r.fingerprint, r));
    headRecords.forEach(r => headMap.set(r.fingerprint, r));
    const added = [];
    const removed = [];
    const unchanged = [];
    for (const [fp, record] of headMap) {
        if (!baseMap.has(fp)) {
            added.push(record);
        }
        else {
            unchanged.push(record);
        }
    }
    for (const [fp, record] of baseMap) {
        if (!headMap.has(fp)) {
            removed.push(record);
        }
    }
    const regressionDetected = added.length > 0;
    return {
        summary: {
            baseCount: baseRecords.length,
            headCount: headRecords.length,
            added: added.length,
            removed: removed.length,
            unchanged: unchanged.length,
            regressionDetected,
        },
        addedFingerprints: added,
        removedFingerprints: removed,
        unchangedFingerprints: unchanged,
    };
}
function formatMarkdownReport(result) {
    const lines = [];
    lines.push('# Digest/Fingerprint Regression Report');
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Base failures: ${result.summary.baseCount}`);
    lines.push(`- Head failures: ${result.summary.headCount}`);
    lines.push(`- Added failures: ${result.summary.added}`);
    lines.push(`- Removed failures: ${result.summary.removed}`);
    lines.push(`- Unchanged failures: ${result.summary.unchanged}`);
    lines.push('');
    if (result.summary.regressionDetected) {
        lines.push('## ⚠️ Regression Detected');
        lines.push('');
        lines.push('New failure fingerprints were detected. This PR introduces regressions.');
        lines.push('');
    }
    else if (result.summary.removed > 0) {
        lines.push('## ✅ Improvements Detected');
        lines.push('');
        lines.push('Some failure fingerprints were removed. This PR fixes issues!');
        lines.push('');
    }
    else {
        lines.push('## ✅ No Changes Detected');
        lines.push('');
        lines.push('Failure fingerprints are unchanged.');
        lines.push('');
    }
    if (result.addedFingerprints.length > 0) {
        lines.push('## Added Fingerprints');
        lines.push('');
        for (const fp of result.addedFingerprints) {
            lines.push(`### ${fp.testName}`);
            lines.push(`- **Fingerprint**: \`${fp.fingerprint}\``);
            lines.push(`- **Location**: ${fp.location}`);
            if (fp.errorType) {
                lines.push(`- **Error Type**: ${fp.errorType}`);
            }
            if (fp.stackLocation) {
                lines.push(`- **Stack Location**: ${fp.stackLocation}`);
            }
            if (fp.error) {
                lines.push(`- **Error**: ${fp.error.split('\n')[0].substring(0, 100)}`);
            }
            lines.push('');
        }
    }
    if (result.removedFingerprints.length > 0) {
        lines.push('## Removed Fingerprints (Fixes)');
        lines.push('');
        for (const fp of result.removedFingerprints) {
            lines.push(`### ${fp.testName}`);
            lines.push(`- **Fingerprint**: \`${fp.fingerprint}\``);
            lines.push(`- **Location**: ${fp.location}`);
            if (fp.errorType) {
                lines.push(`- **Error Type**: ${fp.errorType}`);
            }
            lines.push('');
        }
    }
    return lines.join('\n');
}
function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: compare-fingerprints.ts <base-fingerprints.json> <head-fingerprints.json> [--format markdown|json] [--output <path>]');
        process.exit(1);
    }
    const basePath = args[0];
    const headPath = args[1];
    const formatIndex = args.indexOf('--format');
    const outputIndex = args.indexOf('--output');
    const format = formatIndex !== -1 ? args[formatIndex + 1] || 'json' : 'json';
    const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;
    if (!fs.existsSync(basePath)) {
        console.error(`Base file not found: ${basePath}`);
        process.exit(1);
    }
    if (!fs.existsSync(headPath)) {
        console.error(`Head file not found: ${headPath}`);
        process.exit(1);
    }
    const result = compareFingerprints(basePath, headPath);
    let output;
    if (format === 'markdown') {
        output = formatMarkdownReport(result);
    }
    else {
        output = JSON.stringify(result, null, 2);
    }
    if (outputPath) {
        fs.writeFileSync(outputPath, output);
        console.error(`Comparison written to: ${outputPath}`);
    }
    console.log(output);
    if (result.summary.regressionDetected) {
        console.error('\nRegression detected! Failing CI.');
        process.exit(1);
    }
    process.exit(0);
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { compareFingerprints, formatMarkdownReport };
//# sourceMappingURL=compare-fingerprints.js.map