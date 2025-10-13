import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createTempDir, cleanupTempDir, execCLI } from '../helpers/test-utils.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
describe('lam doctor command', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = createTempDir();
    });
    afterEach(() => {
        cleanupTempDir(tempDir);
    });
    describe('Basic execution', () => {
        test('should execute without errors', () => {
            const result = execCLI(['doctor']);
            expect([0, 1]).toContain(result.code);
            expect(result.stdout).toContain('Laminar Doctor');
        });
        test('should show all health checks', () => {
            const result = execCLI(['doctor']);
            expect(result.stdout).toContain('Node Version');
            expect(result.stdout).toContain('PATH Configuration');
            expect(result.stdout).toContain('Bin Symlinks');
            expect(result.stdout).toContain('Dist Directory');
            expect(result.stdout).toContain('Reporter File');
            expect(result.stdout).toContain('Laminar Config');
        });
        test('should show pass/fail status for each check', () => {
            const result = execCLI(['doctor']);
            expect(result.stdout).toMatch(/✓|✗/);
            expect(result.stdout).toMatch(/PASS|FAIL/);
        });
        test('should show summary with pass/fail counts', () => {
            const result = execCLI(['doctor']);
            expect(result.stdout).toMatch(/Summary: \d+ passed, \d+ failed/);
        });
    });
    describe('Node version check', () => {
        test('should check Node version >= 24', () => {
            const result = execCLI(['doctor']);
            const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
            if (majorVersion >= 24) {
                expect(result.stdout).toContain('Node Version: PASS');
            }
            else {
                expect(result.stdout).toContain('Node Version: FAIL');
                expect(result.stdout).toContain('>= 24 is required');
            }
        });
    });
    describe('Config check', () => {
        test('should detect missing laminar.config.json', () => {
            const result = execCLI(['doctor'], tempDir);
            expect(result.stdout).toContain('Laminar Config: FAIL');
            expect(result.stdout).toContain('not found');
            expect(result.stdout).toContain('npx lam init');
        });
        test('should detect valid laminar.config.json', () => {
            fs.writeFileSync(path.join(tempDir, 'laminar.config.json'), JSON.stringify({ budget: { kb: 2 } }, null, 2));
            const result = execCLI(['doctor'], tempDir);
            expect(result.stdout).toContain('Laminar Config: PASS');
            expect(result.stdout).toContain('found and valid');
        });
        test('should detect invalid JSON in laminar.config.json', () => {
            fs.writeFileSync(path.join(tempDir, 'laminar.config.json'), '{ invalid json }');
            const result = execCLI(['doctor'], tempDir);
            expect(result.stdout).toContain('Laminar Config: FAIL');
            expect(result.stdout).toContain('invalid JSON');
        });
    });
    describe('Exit codes', () => {
        test('should exit with 1 when critical issues detected', () => {
            const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
            if (majorVersion < 24) {
                const result = execCLI(['doctor']);
                expect(result.code).toBe(1);
                expect(result.stdout).toContain('Critical issues detected');
            }
        });
        test('should exit with 0 when only non-critical issues present', () => {
            const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
            if (majorVersion >= 24) {
                const result = execCLI(['doctor'], tempDir);
                expect(result.code).toBe(0);
            }
        });
    });
    describe('Remediation guidance', () => {
        test('should provide fix instructions for missing config', () => {
            const result = execCLI(['doctor'], tempDir);
            if (result.stdout.includes('Laminar Config: FAIL')) {
                expect(result.stdout).toContain('Fix:');
                expect(result.stdout).toContain('npx lam init');
            }
        });
        test('should provide fix instructions for each failing check', () => {
            const result = execCLI(['doctor']);
            const failedChecks = result.stdout.match(/FAIL/g)?.length || 0;
            if (failedChecks > 0) {
                expect(result.stdout).toContain('Fix:');
            }
        });
    });
});
//# sourceMappingURL=doctor.test.js.map