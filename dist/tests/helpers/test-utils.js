import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
export function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'laminar-test-'));
}
export function cleanupTempDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
export function execCLI(args, cwd) {
    try {
        const stdout = execSync(`node ${path.join(__dirname, '../../dist/scripts/lam.js')} ${args.join(' ')}`, {
            cwd: cwd || process.cwd(),
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        return { stdout, stderr: '', code: 0 };
    }
    catch (error) {
        return {
            stdout: error.stdout?.toString() || '',
            stderr: error.stderr?.toString() || '',
            code: error.status || 1
        };
    }
}
export function setupMinimalProject(dir) {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2));
}
//# sourceMappingURL=test-utils.js.map