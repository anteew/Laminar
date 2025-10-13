#!/usr/bin/env node
/**
 * Link Linter - Validates markdown links and file paths
 *
 * Checks that all repo-relative links and paths in markdown files
 * point to existing files or valid anchors.
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Extract links from markdown content
 */
function extractLinks(content, filePath) {
    const links = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = markdownLinkRegex.exec(line)) !== null) {
            const link = match[2];
            if (!link.startsWith('http://') && !link.startsWith('https://') && !link.startsWith('#')) {
                links.push({ line: i + 1, link, type: 'markdown' });
            }
        }
        const reporterPathRegex = /(laminar\/dist\/[^\s"'`]+)/g;
        while ((match = reporterPathRegex.exec(line)) !== null) {
            links.push({ line: i + 1, link: match[1], type: 'inline-path' });
        }
    }
    return links;
}
/**
 * Resolve a link relative to the markdown file
 */
function resolveLink(link, markdownFile, rootDir) {
    const [pathPart] = link.split('#');
    if (pathPart.startsWith('/')) {
        return path.join(rootDir, pathPart);
    }
    else if (pathPart.startsWith('./') || pathPart.startsWith('../') || !pathPart.includes('/')) {
        const markdownDir = path.dirname(markdownFile);
        return path.resolve(markdownDir, pathPart);
    }
    else {
        return path.join(rootDir, pathPart);
    }
}
/**
 * Check if a link has a valid anchor
 */
function hasValidAnchor(link, targetFile) {
    const anchorMatch = link.match(/#(.+)$/);
    if (!anchorMatch)
        return true; // No anchor to validate
    const anchor = anchorMatch[1];
    if (!fs.existsSync(targetFile))
        return false;
    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('#')) {
            const heading = line.replace(/^#+\s+/, '');
            const generatedAnchor = heading
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            if (generatedAnchor === anchor) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Validate a single link
 */
function validateLink(link, markdownFile, rootDir) {
    const resolvedPath = resolveLink(link.link, markdownFile, rootDir);
    const [pathPart, anchor] = link.link.split('#');
    if (link.type === 'inline-path') {
        const nodeModulesPath = path.join(rootDir, 'node_modules', link.link);
        const localRepoPath = path.join(rootDir, link.link.replace(/^laminar\//, ''));
        if (!fs.existsSync(nodeModulesPath) && !fs.existsSync(localRepoPath)) {
            return {
                file: markdownFile,
                line: link.line,
                link: link.link,
                type: 'invalid-path',
                message: `Reporter path not found: ${link.link}`
            };
        }
        return null;
    }
    if (!fs.existsSync(resolvedPath)) {
        return {
            file: markdownFile,
            line: link.line,
            link: link.link,
            type: 'broken-file',
            message: `File not found: ${resolvedPath}`
        };
    }
    if (anchor && !hasValidAnchor(link.link, resolvedPath)) {
        return {
            file: markdownFile,
            line: link.line,
            link: link.link,
            type: 'broken-anchor',
            message: `Anchor not found: #${anchor} in ${path.relative(rootDir, resolvedPath)}`
        };
    }
    return null;
}
/**
 * Find all markdown files
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
    console.log(`🔗 Linting links in: ${rootDir}\n`);
    const mdFiles = findMarkdownFiles(rootDir);
    console.log(`Found ${mdFiles.length} markdown files\n`);
    const issues = [];
    let totalLinks = 0;
    for (const file of mdFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const links = extractLinks(content, file);
        totalLinks += links.length;
        for (const link of links) {
            const issue = validateLink(link, file, rootDir);
            if (issue) {
                issues.push(issue);
            }
        }
    }
    console.log(`Checked ${totalLinks} links\n`);
    if (issues.length === 0) {
        console.log('✅ All links are valid!');
        process.exit(0);
    }
    const issuesByFile = new Map();
    for (const issue of issues) {
        const relPath = path.relative(rootDir, issue.file);
        if (!issuesByFile.has(relPath)) {
            issuesByFile.set(relPath, []);
        }
        issuesByFile.get(relPath).push(issue);
    }
    console.error('❌ Found link issues:\n');
    for (const [file, fileIssues] of issuesByFile.entries()) {
        console.error(`📄 ${file}:`);
        for (const issue of fileIssues) {
            console.error(`   Line ${issue.line}: ${issue.message}`);
            console.error(`   Link: ${issue.link}`);
        }
        console.error('');
    }
    console.error(`\n${issues.length} broken link(s) found`);
    process.exit(1);
}
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=link-lint.js.map