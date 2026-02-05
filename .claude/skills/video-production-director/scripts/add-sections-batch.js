#!/usr/bin/env node
/**
 * Batch Add Sections Helper
 * ==========================
 * Adds multiple sections to script.json in a single command.
 * Prevents terminal hangs and I/O congestion.
 *
 * Usage:
 *   node add-sections-batch.js \
 *     --script "public/projects/my-video/script.json" \
 *     --voice "public/projects/my-video/voice.json" \
 *     --section "intro" "Mở đầu" "Text content..." \
 *     --section "body" "Nội dung chính" "Long text..." \
 *     --section "outro" "Kết thúc" "Ending text..."
 *
 * Features:
 * - Sequential processing (no I/O congestion)
 * - Progress reporting
 * - Error handling with clear messages
 * - 500ms delay between sections
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');

// Parse arguments
const args = minimist(process.argv.slice(2), {
    string: ['script', 'voice'],
    alias: {
        's': 'script',
        'v': 'voice'
    }
});

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Execute command with proper error handling
function executeCommand(cmd, description) {
    try {
        console.log(`⚙️  ${description}...`);
        execSync(cmd, {
            stdio: 'inherit',
            encoding: 'utf8'
        });
        return true;
    } catch (error) {
        console.error(`❌ Failed: ${description}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('📦 Batch Add Sections\n');

    // Validate required arguments
    if (!args.script) {
        console.error('❌ Error: Missing required arguments');
        console.log('\nUsage:');
        console.log('  node add-sections-batch.js \\');
        console.log('    --script "path/to/script.json" \\');
        console.log('    [--voice "path/to/voice.json"] (optional) \\');
        console.log('    --section "<id>" "<name>" "<text-or-path>" \\');
        console.log('    --section "<id>" "<name>" "<text-or-path>" \\');
        console.log('    ...');
        console.log('\nExample:');
        console.log('  node add-sections-batch.js \\');
        console.log('    --script "public/projects/demo/script.json" \\');
        console.log('    --section "intro" "Giới thiệu" "sec_intro.txt" \\');
        console.log('    --section "body" "Nội dung" "sec_body.txt"');
        console.log('\nNote: Third argument can be either text content or file path.');
        console.log('      --voice is optional (for timing resolution).');
        process.exit(1);
    }

    // Parse sections
    // minimist splits: --section values go to args.section, positional args go to args._
    const sections = [];
    const sectionIds = Array.isArray(args.section) ? args.section : (args.section ? [args.section] : []);
    const positionalArgs = args._ || [];

    if (sectionIds.length === 0) {
        console.error('❌ Error: No sections provided');
        console.error('   Use --section "<id>" "<name>" "<text-or-path>" for each section');
        process.exit(1);
    }

    // Each section needs: id (from args.section) + name + text (from args._)
    // Example: --section "intro" "Mở đầu" "file.txt" --section "body" "Nội dung" "file2.txt"
    // Results in: section=["intro", "body"], _=["Mở đầu", "file.txt", "Nội dung", "file2.txt"]
    for (let i = 0; i < sectionIds.length; i++) {
        const posIdx = i * 2; // Each section takes 2 positional args (name, text)

        if (posIdx + 1 >= positionalArgs.length) {
            console.error(`❌ Error: Section "${sectionIds[i]}" missing name and/or text`);
            console.error(`   Expected: --section "${sectionIds[i]}" "<name>" "<text-or-path>"`);
            process.exit(1);
        }

        const name = positionalArgs[posIdx];
        const textOrPath = positionalArgs[posIdx + 1];
        let textContent = textOrPath;

        // Check if it's a file path
        if (fs.existsSync(textOrPath) && fs.lstatSync(textOrPath).isFile()) {
            console.log(`   📖 Reading text from file: ${path.basename(textOrPath)}`);
            textContent = fs.readFileSync(textOrPath, 'utf8');
        }

        sections.push({
            id: sectionIds[i],
            name: name,
            text: textContent
        });
    }

    if (sections.length === 0) {
        console.error('❌ Error: No sections provided');
        console.error('   Use --section "<id>" "<name>" "<text>" for each section');
        process.exit(1);
    }

    // Validate files exist
    if (!fs.existsSync(args.script)) {
        console.error(`❌ Error: Script file not found: ${args.script}`);
        process.exit(1);
    }

    if (args.voice && !fs.existsSync(args.voice)) {
        console.error(`❌ Error: Voice file not found: ${args.voice}`);
        process.exit(1);
    }

    console.log(`   Script: ${args.script}`);
    console.log(`   Voice: ${args.voice || '(not provided - using default timing)'}`);
    console.log(`   Sections: ${sections.length}\n`);

    // Get Python path
    const pythonCmd = 'python3';
    const cliPath = path.join(__dirname, '..', 'script_cli.py');

    // Process each section sequentially
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const num = i + 1;

        console.log(`[${num}/${sections.length}] Processing section: ${section.id}`);
        console.log(`   Name: ${section.name}`);
        console.log(`   Text: ${section.text.substring(0, 60)}${section.text.length > 60 ? '...' : ''}`);

        // Write text to temporary file to avoid shell escaping issues
        const tmpDir = path.join(__dirname, '..', '..', '..', '..', '.tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tmpFile = path.join(tmpDir, `section_${section.id}_${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, section.text, 'utf8');

        // Build command with text-path instead of text
        let cmd = `${pythonCmd} "${cliPath}" add-section --script "${args.script}"`;
        if (args.voice) {
            cmd += ` --voice "${args.voice}"`;
        }
        cmd += ` --id "${section.id}" --name "${section.name}" --text-path "${tmpFile}" --pace "medium"`;

        const success = executeCommand(cmd, `Adding section ${section.id}`);

        // Cleanup temp file
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {
            // Ignore cleanup errors
        }

        if (!success) {
            console.error(`\n❌ Failed at section: ${section.id}`);
            console.error('   Stopping batch process.');
            process.exit(1);
        }

        console.log(`   ✅ Section ${section.id} complete`);

        // Delay between sections to prevent I/O congestion
        if (i < sections.length - 1) {
            console.log(`   ⏳ Waiting 500ms before next section...\n`);
            await sleep(500);
        }
    }

    console.log(`\n✅ All ${sections.length} sections processed successfully!`);
    console.log('📊 Next step: Add scenes to each section\n');
}

main().catch(error => {
    console.error('\n❌ Batch process failed:', error.message);
    process.exit(1);
});
