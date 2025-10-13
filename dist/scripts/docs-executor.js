#!/usr/bin/env node
/**
 * Docs Executor - Validates executable documentation
 *
 * Parses markdown files for runnable bash code blocks and executes them
 * in a sandboxed environment to ensure documentation stays accurate.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
/**
 * Parse markdown file and extract code blocks
 */
function parseMarkdownCodeBlocks(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const blocks = [];
    let inCodeBlock = false;
    let currentBlock = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                const match = line.match(/^```(\w+)(?:\s+(.+))?/);
                if (match) {
                    const language = match[1];
                    const tags = match[2] ? match[2].split(/\s+/) : [];
                    currentBlock = { start: i + 1, code: [], language, tags };
                    inCodeBlock = true;
                }
            }
            else {
                if (currentBlock) {
                    blocks.push({
                        file: filePath,
                        lineNumber: currentBlock.start,
                        code: currentBlock.code.join('\n'),
                        language: currentBlock.language,
                        tags: currentBlock.tags
                    });
                }
                inCodeBlock = false;
                currentBlock = null;
            }
        }
        else if (inCodeBlock && currentBlock) {
            currentBlock.code.push(line);
        }
    }
    return blocks;
}
/**
 * Check if a command is allowlisted
 */
function isAllowlisted(command) {
    const allowlist = [
        /^npm install(-D)?\s+(github:anteew\/Laminar|@agent_vega\/laminar)/,
        /^npm install\s+-[Dg]\s+/,
        /^npx lam\s+/,
        /^lam\s+/,
        /^laminar-mcp/,
        /^ls(\s|$)/,
        /^cat\s+/,
        /^head\s+/,
        /^tail\s+/,
        /^find\s+/,
        /^grep\s+/,
        /^which\s+/,
        /^npm root\s+-g/,
        /^node\s+--version/,
        /^npm\s+--version/,
        /^npm (run )?test/,
        /^vitest/,
        /^go test/,
        /^pytest/,
        /^npm (run )?build/,
        /^npm ci/,
        /^git status/,
        /^git log/,
        /^git diff/,
    ];
    const trimmedCommand = command.trim();
    for (const pattern of allowlist) {
        if (pattern.test(trimmedCommand)) {
            return true;
        }
    }
    return false;
}
/**
 * Execute a command in a sandbox directory
 */
function executeInSandbox(command, sandboxDir) {
    try {
        const stdout = execSync(command, {
            cwd: sandboxDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 60000, // 60 second timeout
        });
        return { stdout: stdout.toString(), stderr: '', exitCode: 0 };
    }
    catch (error) {
        return {
            stdout: error.stdout?.toString() || '',
            stderr: error.stderr?.toString() || error.message,
            exitCode: error.status || 1
        };
    }
}
/**
 * Find all markdown files in the project
 */
function findMarkdownFiles(rootDir) {
    const files = [];
    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    walk(fullPath);
                }
            }
            else if (entry.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }
    }
    walk(rootDir);
    return files;
}
/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const rootDir = args[0] || process.cwd();
    console.log(`🔍 Scanning for executable docs in: ${rootDir}\n`);
    const mdFiles = findMarkdownFiles(rootDir);
    console.log(`Found ${mdFiles.length} markdown files\n`);
    const allBlocks = [];
    for (const file of mdFiles) {
        const blocks = parseMarkdownCodeBlocks(file);
        allBlocks.push(...blocks);
    }
    const runnableBlocks = allBlocks.filter(block => block.language === 'bash' && block.tags.includes('runnable'));
    console.log(`Found ${runnableBlocks.length} runnable bash blocks\n`);
    if (runnableBlocks.length === 0) {
        console.log('✅ No runnable blocks to execute');
        return;
    }
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'laminar-docs-'));
    console.log(`📦 Sandbox: ${sandboxDir}\n`);
    let failureCount = 0;
    let skipCount = 0;
    try {
        for (const block of runnableBlocks) {
            const commands = block.code.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
            for (const command of commands) {
                const relPath = path.relative(rootDir, block.file);
                console.log(`\n📄 ${relPath}:${block.lineNumber}`);
                console.log(`   $ ${command}`);
                if (!isAllowlisted(command)) {
                    console.log(`   ⏭️  SKIPPED (not allowlisted)`);
                    skipCount++;
                    continue;
                }
                const result = executeInSandbox(command, sandboxDir);
                if (result.exitCode !== 0) {
                    console.log(`   ❌ FAILED (exit code ${result.exitCode})`);
                    if (result.stderr) {
                        console.log(`   Error: ${result.stderr.split('\n')[0]}`);
                    }
                    failureCount++;
                }
                else {
                    console.log(`   ✅ SUCCESS`);
                    if (result.stdout && result.stdout.trim()) {
                        const firstLine = result.stdout.trim().split('\n')[0];
                        if (firstLine.length > 80) {
                            console.log(`   Output: ${firstLine.substring(0, 77)}...`);
                        }
                        else {
                            console.log(`   Output: ${firstLine}`);
                        }
                    }
                }
            }
        }
    }
    finally {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total runnable blocks: ${runnableBlocks.length}`);
    console.log(`   Skipped (not allowlisted): ${skipCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`   Passed: ${runnableBlocks.length - skipCount - failureCount}`);
    console.log('='.repeat(60));
    if (failureCount > 0) {
        console.error(`\n❌ ${failureCount} command(s) failed`);
        process.exit(1);
    }
    else {
        console.log(`\n✅ All executable docs passed!`);
        process.exit(0);
    }
}
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=docs-executor.js.map