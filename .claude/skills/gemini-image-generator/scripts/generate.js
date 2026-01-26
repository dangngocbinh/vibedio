#!/usr/bin/env node

// Load environment from project root .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '..', '.env') });

const minimist = require('minimist');
const path = require('path');
const fs = require('fs-extra');
const GeminiClient = require('./gemini-client');

/**
 * Main function to generate images using Gemini
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       GEMINI IMAGE GENERATOR v1.0                     ║');
  console.log('║       AI Image Generation with Imagen 3               ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    string: ['prompt', 'outputDir', 'filename', 'aspectRatio', 'inputFile', 'style'],
    boolean: ['help'],
    alias: {
      p: 'prompt',
      o: 'outputDir',
      f: 'filename',
      i: 'inputFile',
      h: 'help'
    },
    default: {
      outputDir: process.cwd(),
      aspectRatio: '16:9'
    }
  });

  // Show help
  if (args.help || (!args.prompt && !args.inputFile)) {
    console.log('Usage:');
    console.log('  node scripts/generate.js --prompt "your image description"');
    console.log('  node scripts/generate.js --inputFile "./prompts.json"');
    console.log('\nOptions:');
    console.log('  -p, --prompt       Image prompt/description');
    console.log('  -o, --outputDir    Output directory (default: current)');
    console.log('  -f, --filename     Output filename');
    console.log('  -i, --inputFile    JSON file with multiple prompts');
    console.log('  --aspectRatio      Aspect ratio: 16:9, 9:16, 1:1, 4:3 (default: 16:9)');
    console.log('  --style            Style to apply to all prompts');
    console.log('  -h, --help         Show this help');
    console.log('\nExamples:');
    console.log('  node scripts/generate.js -p "A sunset over mountains" -o ./output');
    console.log('  node scripts/generate.js -i ./story-prompts.json');
    process.exit(0);
  }

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ Error: GEMINI_API_KEY is not set');
    console.log('\nTo fix this:');
    console.log('1. Get your API key from: https://aistudio.google.com/apikey');
    console.log('2. Add to your .env file: GEMINI_API_KEY=your_key_here');
    process.exit(1);
  }

  try {
    // Initialize Gemini client
    console.log('🔧 Initializing Gemini client...\n');
    const client = new GeminiClient(apiKey);
    console.log('✅ Gemini client initialized\n');

    // Ensure output directory exists
    await fs.ensureDir(args.outputDir);

    // Check if input file mode
    if (args.inputFile) {
      await generateFromFile(client, args);
    } else {
      await generateSingleImage(client, args);
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                   ✅ SUCCESS                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Generate a single image
 */
async function generateSingleImage(client, args) {
  console.log('🎨 Generating image...\n');
  console.log(`Prompt: "${args.prompt}"`);
  console.log(`Aspect Ratio: ${args.aspectRatio}`);
  console.log(`Output Dir: ${args.outputDir}\n`);

  let prompt = args.prompt;
  if (args.style) {
    prompt = `${args.prompt}. Style: ${args.style}`;
  }

  const result = await client.generateImage(prompt, {
    aspectRatio: args.aspectRatio,
    outputDir: args.outputDir,
    filename: args.filename
  });

  if (!result.success) {
    throw new Error(`Image generation failed: ${result.error}`);
  }

  console.log('✅ Image generated successfully!');
  console.log(`📁 Saved to: ${result.savedPath}`);

  return result;
}

/**
 * Generate images from a JSON file
 */
async function generateFromFile(client, args) {
  console.log('📄 Reading input file...\n');

  const inputPath = path.resolve(args.inputFile);
  if (!await fs.pathExists(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const inputData = await fs.readJson(inputPath);
  const prompts = inputData.prompts || [];
  const style = inputData.style || args.style || null;
  const outputDir = inputData.outputDir || args.outputDir;

  if (prompts.length === 0) {
    throw new Error('No prompts found in input file');
  }

  console.log(`Found ${prompts.length} prompts to generate`);
  console.log(`Style: ${style || 'none'}`);
  console.log(`Output Dir: ${outputDir}\n`);

  await fs.ensureDir(outputDir);

  // Generate sequence
  const results = await client.generateImageSequence(
    prompts.map(p => ({
      ...p,
      style: style
    })),
    {
      outputDir,
      aspectRatio: args.aspectRatio
    }
  );

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n📊 Summary:');
  console.log(`  Total: ${results.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Failed generations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.id}: ${r.error}`);
    });
  }

  // Save results summary
  const summaryPath = path.join(outputDir, 'generation-summary.json');
  await fs.writeJson(summaryPath, {
    generatedAt: new Date().toISOString(),
    totalPrompts: prompts.length,
    successful,
    failed,
    results: results.map(r => ({
      id: r.id,
      success: r.success,
      savedPath: r.savedPath || null,
      error: r.error || null
    }))
  }, { spaces: 2 });

  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  return results;
}

// Run main function
main();
