// @ts-nocheck
import { Engine } from '../core/Engine';
import * as path from 'path';
import * as fs from 'fs';

// Simple CLI wrapper for RefactorX
async function main() {
    const targetPath = process.argv[2];
    const mode = process.argv[3] || 'scan'; // 'scan' or 'fix'

    if (!targetPath) {
        console.error('Usage: ts-node run.ts <file-or-directory> [scan|fix]');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), targetPath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Path not found: ${absolutePath}`);
        process.exit(1);
    }

    const engine = Engine.getInstance();

    console.log('\n🔍 REFACTOR X (ISOLATED MODE) 🔍');
    console.log('-----------------------------------');
    console.log(`Target: ${absolutePath}`);
    console.log(`Mode:   ${mode.toUpperCase()}`);
    console.log('-----------------------------------\n');

    // Determine if target is directory or file
    const isDir = fs.statSync(absolutePath).isDirectory();

    // Scan
    const issues = await engine.scanLegacy(isDir ? absolutePath : path.dirname(absolutePath));

    // Filter issues for the specific file if target is a file
    const relevantIssues = isDir
        ? issues
        : issues.filter(i => i.file === path.basename(absolutePath));

    if (relevantIssues.length === 0) {
        console.log('✅ No legacy patterns found.');
        return;
    }

    console.log(engine.generatePlan(relevantIssues));

    if (mode === 'fix') {
        if (isDir) {
            console.error('⚠️  Fixing entire directories is disabled in Safety Mode. Please target specific files.');
            return;
        }

        console.log('\n[SURGEON] Attempting Auto-Fix...');
        await new Promise(r => setTimeout(r, 1000));

        const success = await engine.fix(absolutePath, relevantIssues);
        if (success) {
            console.log('\n✅ FILE PATCHED SUCCESSFULLY.');
        } else {
            console.error('\n❌ Patch failed or no changes needed.');
        }
    }
}

main();
