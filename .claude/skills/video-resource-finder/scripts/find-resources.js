#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const minimist = require('minimist');
const path = require('path');

// Import modules
const PexelsClient = require('./api/pexels-client');
const PixabayClient = require('./api/pixabay-client');
const ScriptReader = require('./utils/script-reader');
const QueryBuilder = require('./utils/query-builder');
const ResourceMatcher = require('./processors/resource-matcher');
const JSONBuilder = require('./processors/json-builder');

/**
 * Main function to find video resources
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       VIDEO RESOURCE FINDER v1.0                      ║');
  console.log('║       Finding free resources from Pexels & Pixabay    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    string: ['projectDir', 'preferredSource'],
    number: ['resultsPerQuery'],
    default: {
      resultsPerQuery: 3,
      preferredSource: 'pexels'
    }
  });

  // Validate required arguments
  if (!args.projectDir) {
    console.error('❌ Error: --projectDir is required');
    console.log('\nUsage:');
    console.log('  node scripts/find-resources.js --projectDir "output/project-name"');
    console.log('\nOptions:');
    console.log('  --projectDir         Path to project directory (required)');
    console.log('  --resultsPerQuery    Number of results per query (default: 3)');
    console.log('  --preferredSource    Preferred API source: pexels|pixabay (default: pexels)');
    process.exit(1);
  }

  // Resolve project directory path
  const projectDir = path.resolve(args.projectDir);
  console.log(`📁 Project Directory: ${projectDir}\n`);

  try {
    // Step 1: Initialize API clients
    console.log('🔧 Initializing API clients...\n');

    const pexelsApiKey = process.env.PEXELS_API_KEY;
    const pixabayApiKey = process.env.PIXABAY_API_KEY;

    if (!pexelsApiKey && !pixabayApiKey) {
      throw new Error('At least one API key (PEXELS_API_KEY or PIXABAY_API_KEY) must be set in .env file');
    }

    const pexelsClient = pexelsApiKey ? new PexelsClient(pexelsApiKey) : null;
    const pixabayClient = pixabayApiKey ? new PixabayClient(pixabayApiKey) : null;

    if (pexelsClient) console.log('✅ Pexels client initialized');
    if (pixabayClient) console.log('✅ Pixabay client initialized');

    // Step 2: Read script.json
    console.log('\n📖 Reading script.json...\n');
    const scriptReader = new ScriptReader();
    const script = await scriptReader.readScript(projectDir);
    const metadata = scriptReader.getMetadata(script);
    const visualQueries = scriptReader.extractVisualQueries(script);
    const musicQuery = scriptReader.extractMusicQuery(script);

    if (visualQueries.length === 0 && !musicQuery) {
      console.warn('⚠️  No queries found in script.json');
      console.log('Make sure your script has scenes with visualSuggestion.type="stock"');
      process.exit(0);
    }

    // Step 3: Build queries
    console.log('\n🔨 Building search queries...\n');
    const queryBuilder = new QueryBuilder();
    const queries = queryBuilder.buildAllQueries(visualQueries, musicQuery);

    // Step 4: Fetch resources
    console.log('\n🌐 Fetching resources from APIs...\n');
    const resourceMatcher = new ResourceMatcher(pexelsClient, pixabayClient, {
      resultsPerQuery: args.resultsPerQuery,
      preferredSource: args.preferredSource
    });

    const results = await resourceMatcher.fetchAllResources(queries);

    // Step 5: Build and save resources.json
    console.log('\n💾 Building resources.json...\n');
    const jsonBuilder = new JSONBuilder();

    const apiStats = {
      pexels: pexelsClient ? pexelsClient.getRequestCount() : 0,
      pixabay: pixabayClient ? pixabayClient.getRequestCount() : 0
    };

    const resourcesJSON = jsonBuilder.buildResourcesJSON(metadata, results, apiStats);

    // Validate before saving
    if (!jsonBuilder.validate(resourcesJSON)) {
      throw new Error('Generated resources.json failed validation');
    }

    const outputPath = await jsonBuilder.saveToFile(projectDir, resourcesJSON);

    // Step 6: Print summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                   ✅ SUCCESS                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`  Total Videos:        ${resourcesJSON.summary.totalVideos}`);
    console.log(`  Total Images:        ${resourcesJSON.summary.totalImages}`);
    console.log(`  Total Music:         ${resourcesJSON.summary.totalMusic}`);
    console.log(`  Total Sound Effects: ${resourcesJSON.summary.totalSoundEffects}`);
    console.log(`  Successful Queries:  ${resourcesJSON.summary.successfulQueries}`);
    console.log(`  Failed Queries:      ${resourcesJSON.summary.failedQueries}`);

    console.log('\n🔌 API Usage:');
    console.log(`  Pexels requests:     ${apiStats.pexels}`);
    console.log(`  Pixabay requests:    ${apiStats.pixabay}`);

    if (resourcesJSON.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      resourcesJSON.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.query || error.sceneId}`);
        console.log(`     Error: ${error.error}`);
        console.log(`     Suggestion: ${error.suggestion}`);
      });
    }

    console.log(`\n📄 Output saved to: ${outputPath}`);
    console.log('\n✨ Next steps:');
    console.log('  1. Review resources.json to see all found resources');
    console.log('  2. Manually download the resources you want to use');
    console.log('  3. Use the URLs in your video editing workflow\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run main function
main();
