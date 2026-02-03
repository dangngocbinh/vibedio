#!/usr/bin/env node
/**
 * Write Text Helper Script
 * ========================
 * Simple utility to write text content to files without blocking terminal.
 *
 * Usage:
 *   node write-text.js --file <path> --text <content>
 *   echo "content" | node write-text.js --file <path> --stdin
 *
 * This replaces the blocking `cat > file << 'EOF'` pattern that causes
 * terminal hangs, especially with long text content.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  let file = null;
  let text = null;
  let useStdin = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      file = args[i + 1];
      i++;
    } else if (args[i] === '--text' && i + 1 < args.length) {
      text = args[i + 1];
      i++;
    } else if (args[i] === '--stdin') {
      useStdin = true;
    }
  }

  // Validation
  if (!file) {
    console.error('Usage: node write-text.js --file <path> (--text <content> | --stdin)');
    console.error('');
    console.error('Examples:');
    console.error('  node write-text.js --file sec_p1.txt --text "Content here"');
    console.error('  echo "Content" | node write-text.js --file sec_p1.txt --stdin');
    process.exit(1);
  }

  // Read from stdin if requested
  if (useStdin) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    text = Buffer.concat(chunks).toString('utf8');
  }

  if (!text) {
    console.error('❌ Error: No text content provided');
    console.error('Use --text <content> or --stdin');
    process.exit(1);
  }

  // Write file
  try {
    const dir = path.dirname(file);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(file, text, 'utf8');

    const size = text.length;
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`✅ Text written to: ${file} (${size} chars, ${sizeKB} KB)`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error writing file: ${error.message}`);
    process.exit(1);
  }
}

main();
