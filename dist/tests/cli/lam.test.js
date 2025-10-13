import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createTempDir, cleanupTempDir, execCLI, setupMinimalProject } from '../helpers/test-utils.js';
describe('Laminar CLI Integration Tests', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = createTempDir();
    });
    afterEach(() => {
        cleanupTempDir(tempDir);
    });
    describe('Help and Discovery', () => {
        test('lam --help should execute without errors', () => {
            const result = execCLI(['--help']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Laminar CLI');
        });
        test('lam with no args should show help', () => {
            const result = execCLI([]);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('USAGE');
        });
    });
    describe('init command', () => {
        test('init --dry-run with default template', () => {
            const result = execCLI(['init', '--dry-run'], tempDir);
            expect(result.code).toBe(0);
        });
        test('init --dry-run with node-defaults template', () => {
            const result = execCLI(['init', '--template', 'node-defaults', '--dry-run'], tempDir);
            expect(result.code).toBe(0);
        });
        test('init --dry-run with go-defaults template', () => {
            const result = execCLI(['init', '--template', 'go-defaults', '--dry-run'], tempDir);
            expect(result.code).toBe(0);
        });
        test('init --dry-run with minimal template', () => {
            const result = execCLI(['init', '--template', 'minimal', '--dry-run'], tempDir);
            expect(result.code).toBe(0);
        });
    });
    describe('project command', () => {
        test('project list executes successfully', () => {
            const result = execCLI(['project', 'list']);
            expect(result.code).toBe(0);
        });
    });
    describe('rules command', () => {
        test('rules get with no config returns empty object', () => {
            setupMinimalProject(tempDir);
            const result = execCLI(['rules', 'get', '--root', tempDir]);
            expect(result.code).toBe(0);
        });
    });
    describe('ingest command', () => {
        test('ingest with no format flag shows error', () => {
            const result = execCLI(['ingest']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('format flag');
        });
        test('ingest --go with no input source shows error', () => {
            const result = execCLI(['ingest', '--go']);
            expect(result.code).toBe(1);
        });
    });
    describe('diff command', () => {
        test('diff with missing args shows error', () => {
            const result = execCLI(['diff']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('diff');
        });
    });
});
//# sourceMappingURL=lam.test.js.map