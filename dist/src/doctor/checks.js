import * as fs from 'node:fs';
import * as path from 'node:path';
export function checkNodeVersion() {
    const currentVersion = process.version;
    const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);
    if (majorVersion >= 24) {
        return {
            name: 'Node Version',
            passed: true,
            message: `Node ${currentVersion} detected (>= 24 required)`,
            critical: false,
        };
    }
    return {
        name: 'Node Version',
        passed: false,
        message: `Node ${currentVersion} detected, but >= 24 is required`,
        fix: 'Install Node 24 or later: https://nodejs.org/ or use nvm: nvm install 24 && nvm use 24',
        critical: true,
    };
}
export function checkPath() {
    const pathEnv = process.env.PATH || '';
    const nodeModulesBin = path.join(process.cwd(), 'node_modules', '.bin');
    if (pathEnv.includes('node_modules/.bin') || pathEnv.includes(nodeModulesBin)) {
        return {
            name: 'PATH Configuration',
            passed: true,
            message: 'node_modules/.bin is in PATH',
            critical: false,
        };
    }
    return {
        name: 'PATH Configuration',
        passed: false,
        message: 'node_modules/.bin not found in PATH',
        fix: 'Use npx to run commands (e.g., npx lam) or add node_modules/.bin to your PATH',
        critical: false,
    };
}
export function checkBinSymlinks() {
    const binPath = path.join(process.cwd(), 'node_modules', '.bin');
    if (!fs.existsSync(binPath)) {
        return {
            name: 'Bin Symlinks',
            passed: false,
            message: 'node_modules/.bin directory not found',
            fix: 'Run: npm install',
            critical: true,
        };
    }
    const lamBin = path.join(binPath, 'lam');
    const laminarMcpBin = path.join(binPath, 'laminar-mcp');
    const lamExists = fs.existsSync(lamBin);
    const mcpExists = fs.existsSync(laminarMcpBin);
    if (lamExists && mcpExists) {
        return {
            name: 'Bin Symlinks',
            passed: true,
            message: 'All bin symlinks present (lam, laminar-mcp)',
            critical: false,
        };
    }
    const missing = [];
    if (!lamExists)
        missing.push('lam');
    if (!mcpExists)
        missing.push('laminar-mcp');
    return {
        name: 'Bin Symlinks',
        passed: false,
        message: `Missing symlinks: ${missing.join(', ')}`,
        fix: 'Run: npm install or npm rebuild',
        critical: true,
    };
}
export function checkDistPresence() {
    const distPath = path.join(process.cwd(), 'node_modules', '@agent_vega', 'laminar', 'dist');
    if (!fs.existsSync(distPath)) {
        return {
            name: 'Dist Directory',
            passed: false,
            message: 'dist/ directory not found in package',
            fix: 'Reinstall Laminar: npm install -D @agent_vega/laminar',
            critical: true,
        };
    }
    const requiredFiles = [
        'scripts/lam.js',
        'scripts/laminar-run.js',
        'src/test/reporter/jsonlReporter.js',
    ];
    const missing = requiredFiles.filter(file => !fs.existsSync(path.join(distPath, file)));
    if (missing.length === 0) {
        return {
            name: 'Dist Directory',
            passed: true,
            message: 'All required dist files present',
            critical: false,
        };
    }
    return {
        name: 'Dist Directory',
        passed: false,
        message: `Missing dist files: ${missing.join(', ')}`,
        fix: 'Reinstall Laminar: npm install -D @agent_vega/laminar',
        critical: true,
    };
}
export function checkReporterPath() {
    const reporterPath = path.join(process.cwd(), 'node_modules', '@agent_vega', 'laminar', 'dist', 'src', 'test', 'reporter', 'jsonlReporter.js');
    if (fs.existsSync(reporterPath)) {
        return {
            name: 'Reporter File',
            passed: true,
            message: `Reporter found at ${reporterPath}`,
            critical: false,
        };
    }
    const altPath = path.join(process.cwd(), 'dist', 'src', 'test', 'reporter', 'jsonlReporter.js');
    if (fs.existsSync(altPath)) {
        return {
            name: 'Reporter File',
            passed: true,
            message: `Reporter found at ${altPath}`,
            critical: false,
        };
    }
    return {
        name: 'Reporter File',
        passed: false,
        message: 'jsonlReporter.js not found',
        fix: 'Reinstall Laminar: npm install -D @agent_vega/laminar',
        critical: true,
    };
}
export function checkLaminarConfig() {
    const configPath = path.join(process.cwd(), 'laminar.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            JSON.parse(content); // Validate JSON
            return {
                name: 'Laminar Config',
                passed: true,
                message: 'laminar.config.json found and valid',
                critical: false,
            };
        }
        catch (err) {
            return {
                name: 'Laminar Config',
                passed: false,
                message: 'laminar.config.json exists but contains invalid JSON',
                fix: 'Fix JSON syntax or regenerate: npx lam init --force',
                critical: false,
            };
        }
    }
    return {
        name: 'Laminar Config',
        passed: false,
        message: 'laminar.config.json not found',
        fix: 'Initialize Laminar: npx lam init',
        critical: false,
    };
}
export function runAllChecks() {
    return [
        checkNodeVersion(),
        checkPath(),
        checkBinSymlinks(),
        checkDistPresence(),
        checkReporterPath(),
        checkLaminarConfig(),
    ];
}
//# sourceMappingURL=checks.js.map