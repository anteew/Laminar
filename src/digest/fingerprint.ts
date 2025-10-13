import * as crypto from 'node:crypto';
import * as path from 'node:path';

/**
 * Normalizes file paths for fingerprint generation to ensure consistency
 * across different checkout directories (e.g., CI base/head dual-checkout).
 * 
 * Handles:
 * - CI dual-checkout pattern: .../base/... or .../head/... → relative path
 * - Absolute local paths → relative to cwd
 * - Already relative paths → unchanged
 */
export function normalizePathForFingerprint(filePath: string): string {
  if (!filePath) {
    return filePath;
  }

  const normalizedPath = filePath.replace(/\\/g, '/');

  if (!normalizedPath.startsWith('/') && !/^[A-Za-z]:\//.test(normalizedPath)) {
    return filePath;
  }

  const dualCheckoutMatch = normalizedPath.match(/\/(base|head)\/(.*)/);
  if (dualCheckoutMatch) {
    return dualCheckoutMatch[2];
  }

  const projectRootMatch = normalizedPath.match(/\/Laminar\/(.*)/);
  if (projectRootMatch) {
    return projectRootMatch[1];
  }

  try {
    const cwd = process.cwd();
    if (filePath.startsWith(cwd + path.sep)) {
      return path.relative(cwd, filePath);
    }
  } catch {
    // Ignore errors from process.cwd() or path.relative()
  }

  // Return original if we can't normalize (defensive fallback)
  return filePath;
}

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

export function generateFingerprint(failure: FailureInfo): string {
  const parts: string[] = [failure.testName];
  
  if (failure.errorType) {
    parts.push(failure.errorType);
  }
  
  if (failure.stackLocation) {
    parts.push(failure.stackLocation);
  }
  
  const content = parts.join('::');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

export function extractFailureInfo(
  testName: string,
  error?: string,
  payload?: any
): FailureInfo {
  const info: FailureInfo = { testName };
  
  if (error) {
    info.errorMessage = error;
    
    const errorTypeMatch = error.match(/^(\w+Error)/);
    if (errorTypeMatch) {
      info.errorType = errorTypeMatch[1];
    }
  }
  
  if (payload && typeof payload === 'object') {
    if ('stack' in payload && typeof payload.stack === 'string') {
      const stackLines = payload.stack.split('\n');
      const firstRelevantLine = stackLines.find((line: string) => 
        line.includes('.spec.ts') || line.includes('.test.ts')
      );
      
      if (firstRelevantLine) {
        const match = firstRelevantLine.match(/\(([^)]+):(\d+):(\d+)\)/) ||
                      firstRelevantLine.match(/at ([^:]+):(\d+):(\d+)/);
        if (match) {
          const normalizedPath = normalizePathForFingerprint(match[1]);
          info.stackLocation = `${normalizedPath}:${match[2]}`;
        }
      }
    }
    
    if ('name' in payload && typeof payload.name === 'string') {
      info.errorType = payload.name;
    }
  }
  
  return info;
}
