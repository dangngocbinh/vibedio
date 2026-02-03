#!/usr/bin/env node
/**
 * Batch Add Scenes Script
 * ========================
 * Safely run multiple add-scenes commands sequentially to avoid terminal hang.
 *
 * Usage:
 *   node add-scenes-batch.js \
 *     --script <path> \
 *     --voice <path> \
 *     --section <id> <scenes-file> \
 *     --section <id> <scenes-file> \
 *     ...
 *
 * Why this script?
 * - Running multiple add-scenes commands in parallel causes I/O congestion
 * - Using && to chain commands can cause terminal hang
 * - This script runs them sequentially with proper delays
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);

  let scriptPath = null;
  let voicePath = null;
  const sections = []; // [{sectionId, scenesFile}]

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--script' && i + 1 < args.length) {
      scriptPath = args[i + 1];
      i++;
    } else if (args[i] === '--voice' && i + 1 < args.length) {
      voicePath = args[i + 1];
      i++;
    } else if (args[i] === '--section' && i + 2 < args.length) {
      sections.push({
        sectionId: args[i + 1],
        scenesFile: args[i + 2]
      });
      i += 2;
    }
  }

  // Validation
  if (!scriptPath || !voicePath || sections.length === 0) {
    console.error('Usage: node add-scenes-batch.js \\');
    console.error('  --script <path> \\');
    console.error('  --voice <path> \\');
    console.error('  --section <id> <scenes-file> \\');
    console.error('  [--section <id> <scenes-file> ...]');
    console.error('');
    console.error('Example:');
    console.error('  node add-scenes-batch.js \\');
    console.error('    --script "public/projects/demo/script.json" \\');
    console.error('    --voice "public/projects/demo/voice.json" \\');
    console.error('    --section "intro" "scenes_intro.json" \\');
    console.error('    --section "p1" "scenes_p1.json" \\');
    console.error('    --section "p2" "scenes_p2.json"');
    process.exit(1);
  }

  // Verify files exist
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script file not found: ${scriptPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(voicePath)) {
    console.error(`❌ Voice file not found: ${voicePath}`);
    process.exit(1);
  }

  for (const {scenesFile} of sections) {
    if (!fs.existsSync(scenesFile)) {
      console.error(`❌ Scenes file not found: ${scenesFile}`);
      process.exit(1);
    }
  }

  console.log(`\n📦 Batch Add Scenes`);
  console.log(`   Script: ${scriptPath}`);
  console.log(`   Voice: ${voicePath}`);
  console.log(`   Sections: ${sections.length}\n`);

  const cliPath = path.join(__dirname, '..', 'script_cli.py');

  // Run commands sequentially
  for (let i = 0; i < sections.length; i++) {
    const {sectionId, scenesFile} = sections[i];

    console.log(`\n[${i + 1}/${sections.length}] Processing section: ${sectionId}`);
    console.log(`   Scenes file: ${scenesFile}`);

    const cmd = `python3 "${cliPath}" add-scenes --script "${scriptPath}" --voice "${voicePath}" --section "${sectionId}" --scenes-file "${scenesFile}"`;

    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log(`   ✅ Section ${sectionId} complete`);
    } catch (error) {
      console.error(`   ❌ Error processing section ${sectionId}`);
      process.exit(1);
    }

    // Small delay to avoid I/O congestion (not needed for last item)
    if (i < sections.length - 1) {
      console.log(`   ⏳ Waiting 500ms before next section...`);
      await sleep(500);
    }
  }

  console.log(`\n✅ All ${sections.length} sections processed successfully!\n`);
  process.exit(0);
}

main();
