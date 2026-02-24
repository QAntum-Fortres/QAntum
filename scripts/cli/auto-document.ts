
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   AUTO-DOCUMENTER - THE CHRONICLER                                            ║
 * ║   "Self-Writing Documentation for Self-Evolving Systems"                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Scans the codebase, analyzes structure, and regenerates documentation.
 */

import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
    sourceDirs: ['src', 'scripts'],
    outputFile: path.join(process.cwd(), 'docs', 'enterprise', 'LIVE_SYSTEM_STATUS.md'),
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
    ignore: ['node_modules', 'dist', '.git', 'test', 'tests']
};

interface FileStats {
    path: string;
    name: string;
    extension: string;
    size: number;
    lines: number;
    classes: string[];
    functions: string[];
}

interface SystemStats {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    files: FileStats[];
    scanTime: Date;
    modules: Record<string, number>;
}

// Ensure docs directory exists
if (!fs.existsSync(path.dirname(CONFIG.outputFile))) {
    fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
}

function countLines(content: string): number {
    return content.split('\n').length;
}

function extractSymbols(content: string): { classes: string[], functions: string[] } {
    const classes: string[] = [];
    const functions: string[] = [];

    // Simple regex extractors
    const classRegex = /class\s+(\w+)/g;
    const funcRegex = /function\s+(\w+)/g;
    const constFuncRegex = /const\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^\s=>]+)\s*=>/g;

    let match;
    while ((match = classRegex.exec(content)) !== null) classes.push(match[1]);
    while ((match = funcRegex.exec(content)) !== null) functions.push(match[1]);
    while ((match = constFuncRegex.exec(content)) !== null) functions.push(match[1]);

    return { classes, functions };
}

function scanDirectory(dir: string, rootDir: string): FileStats[] {
    let results: FileStats[] = [];
    if (!fs.existsSync(dir)) return [];

    const list = fs.readdirSync(dir);

    for (const file of list) {
        if (CONFIG.ignore.includes(file)) continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(scanDirectory(fullPath, rootDir));
        } else {
            const ext = path.extname(file);
            if (CONFIG.extensions.includes(ext)) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const symbols = extractSymbols(content);

                results.push({
                    path: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
                    name: file,
                    extension: ext,
                    size: stat.size,
                    lines: countLines(content),
                    classes: symbols.classes,
                    functions: symbols.functions
                });
            }
        }
    }

    return results;
}

function generateMarkdown(stats: SystemStats): string {
    const kbSize = (stats.totalSize / 1024).toFixed(2);

    // Group by directory depth 1
    const structure: Record<string, FileStats[]> = {};
    for (const file of stats.files) {
        const topDir = file.path.split('/')[0];
        if (!structure[topDir]) structure[topDir] = [];
        structure[topDir].push(file);
    }

    return `# 🧬 LIVE SYSTEM STATUS: QANTUM VORTEX ENTERPRISE

> **GENERATED AT:** ${stats.scanTime.toISOString().replace('T', ' ').substring(0, 19)}
> **STATUS:** ONLINE
> **VERSION:** 28.3.0-ENTERPRISE

## 📊 System Vital Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | ${stats.totalFiles} |
| **Total Lines of Code** | ${stats.totalLines.toLocaleString()} |
| **Codebase Size** | ${kbSize} KB |
| **Primary Languages** | TypeScript, JavaScript |

## 🏗️ Architectural Map (Modules)

${Object.keys(structure).map(dir => {
        const files = structure[dir];
        const lines = files.reduce((s, f) => s + f.lines, 0);
        return `- **${dir}/** (${files.length} files, ${lines} lines)`;
    }).join('\n')}

## 📜 Complete Module Manifest

${stats.files.map(f => {
        const symbols = [
            ...f.classes.map(c => `\`class ${c}\``),
            ...f.functions.slice(0, 3).map(fn => `\`func ${fn}\``)
        ];
        let symbolStr = symbols.length > 0 ? ` — Exports: ${symbols.join(', ')}` : '';
        if (f.functions.length > 3) symbolStr += `, +${f.functions.length - 3} more`;

        return `### 📄 ${f.path}
- **Lines:** ${f.lines} | **Size:** ${(f.size / 1024).toFixed(1)} KB
${symbolStr ? `- ${symbolStr}` : ''}`;
    }).join('\n\n')}

---
*Generated by **The Chronicler** (Auto-Documenter Script)*
`;
}

async function main() {
    console.log('📖 Starting Auto-Documenter...');

    const rootDir = process.cwd();
    let allFiles: FileStats[] = [];

    for (const dir of CONFIG.sourceDirs) {
        const targetPath = path.join(rootDir, dir);
        console.log(`   Scanning ${dir}...`);
        allFiles = allFiles.concat(scanDirectory(targetPath, rootDir));
    }

    const stats: SystemStats = {
        totalFiles: allFiles.length,
        totalLines: allFiles.reduce((sum, f) => sum + f.lines, 0),
        totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
        files: allFiles.sort((a, b) => a.path.localeCompare(b.path)),
        scanTime: new Date(),
        modules: {}
    };

    console.log(`   Found ${stats.totalFiles} files with ${stats.totalLines} lines.`);

    const markdown = generateMarkdown(stats);
    fs.writeFileSync(CONFIG.outputFile, markdown);

    console.log(`✅ Documentation generated: docs/enterprise/LIVE_SYSTEM_STATUS.md`);
}

main().catch(console.error);
