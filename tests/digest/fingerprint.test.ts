import { describe, it, expect } from 'vitest';
import { 
  normalizePathForFingerprint, 
  generateFingerprint, 
  extractFailureInfo 
} from '../../src/digest/fingerprint.js';

describe('normalizePathForFingerprint', () => {
  it('should strip /base/ prefix from CI dual-checkout paths', () => {
    const input = '/home/runner/work/Laminar/Laminar/base/tests/regression/fixture.test.ts';
    const expected = 'tests/regression/fixture.test.ts';
    expect(normalizePathForFingerprint(input)).toBe(expected);
  });

  it('should strip /head/ prefix from CI dual-checkout paths', () => {
    const input = '/home/runner/work/Laminar/Laminar/head/tests/regression/fixture.test.ts';
    const expected = 'tests/regression/fixture.test.ts';
    expect(normalizePathForFingerprint(input)).toBe(expected);
  });

  it('should handle paths with base/head deeper in the structure', () => {
    const input = '/some/other/path/Laminar/base/src/utils/helper.ts';
    const expected = 'src/utils/helper.ts';
    expect(normalizePathForFingerprint(input)).toBe(expected);
  });

  it('should return relative paths unchanged', () => {
    const input = 'tests/regression/fixture.test.ts';
    expect(normalizePathForFingerprint(input)).toBe(input);
  });

  it('should handle empty input', () => {
    expect(normalizePathForFingerprint('')).toBe('');
  });

  it('should handle paths without base/head by returning original (if not relative to cwd)', () => {
    const input = '/some/absolute/path/to/file.ts';
    expect(normalizePathForFingerprint(input)).toBeTruthy();
  });
});

describe('fingerprint path insensitivity', () => {
  it('should generate identical fingerprints for base and head checkouts', () => {
    const testName = 'tests/regression/fixture.test.ts > should fail deterministically';
    const errorMsg = 'AssertionError: expected 500 to be 200';
    
    const baseStack = `Error: ${errorMsg}
    at Object.<anonymous> (/home/runner/work/Laminar/Laminar/base/tests/regression/fixture.test.ts:20:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;
    
    const headStack = `Error: ${errorMsg}
    at Object.<anonymous> (/home/runner/work/Laminar/Laminar/head/tests/regression/fixture.test.ts:20:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;
    
    const baseInfo = extractFailureInfo(testName, errorMsg, { stack: baseStack });
    const headInfo = extractFailureInfo(testName, errorMsg, { stack: headStack });
    
    const baseFingerprint = generateFingerprint(baseInfo);
    const headFingerprint = generateFingerprint(headInfo);
    
    expect(baseInfo.stackLocation).toBe('tests/regression/fixture.test.ts:20');
    expect(headInfo.stackLocation).toBe('tests/regression/fixture.test.ts:20');
    expect(baseFingerprint).toBe(headFingerprint);
  });

  it('should generate identical fingerprints for local dev paths', () => {
    const testName = 'tests/example.test.ts > test case';
    const errorMsg = 'TypeError: Cannot read property';
    
    const stack1 = `Error: ${errorMsg}
    at Object.<anonymous> (/Users/alice/projects/Laminar/tests/example.test.ts:10:5)`;
    
    const stack2 = `Error: ${errorMsg}
    at Object.<anonymous> (/Users/bob/code/Laminar/tests/example.test.ts:10:5)`;
    
    const info1 = extractFailureInfo(testName, errorMsg, { stack: stack1 });
    const info2 = extractFailureInfo(testName, errorMsg, { stack: stack2 });
    
    const fp1 = generateFingerprint(info1);
    const fp2 = generateFingerprint(info2);
    
    expect(fp1).toBe(fp2);
  });

  it('should handle Windows-style paths in stack traces', () => {
    const testName = 'tests/example.test.ts > test case';
    const errorMsg = 'Error message';
    
    const stack = `Error: ${errorMsg}
    at Object.<anonymous> (C:\\Users\\dev\\Laminar\\base\\tests\\example.test.ts:15:10)`;
    
    const info = extractFailureInfo(testName, errorMsg, { stack });
    const fingerprint = generateFingerprint(info);
    
    expect(info.stackLocation).toContain('tests/example.test.ts:15');
    expect(fingerprint).toBeTruthy();
  });
});

describe('extractFailureInfo', () => {
  it('should extract normalized stack locations', () => {
    const stack = `Error: test failed
    at Object.<anonymous> (/home/runner/work/Laminar/Laminar/head/tests/unit/parser.test.ts:42:10)`;
    
    const info = extractFailureInfo('test-name', 'Error: test failed', { stack });
    
    expect(info.stackLocation).toBe('tests/unit/parser.test.ts:42');
  });

  it('should handle missing stack traces', () => {
    const info = extractFailureInfo('test-name', 'Error message');
    
    expect(info.stackLocation).toBeUndefined();
    expect(info.testName).toBe('test-name');
    expect(info.errorMessage).toBe('Error message');
  });
});
