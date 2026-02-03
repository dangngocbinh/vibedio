#!/usr/bin/env node

// Load environment from skill .env first, then project root .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '..', '.env') });
const minimist = require('minimist');
const path = require('path');
const fs = require('fs');

// Import modules
const PexelsClient = require('./api/pexels-client');
const PixabayClient = require('./api/pixabay-client');
const UnsplashClient = require('./api/unsplash-client');
const GeminiClient = require('./api/gemini-client');
const ScriptReader = require('./utils/script-reader');
const QueryBuilder = require('./utils/query-builder');
const ResourceMatcher = require('./processors/resource-matcher');
const JSONBuilder = require('./processors/json-builder');
const PixabayScraper = require('./api/pixabay-scraper'); // New Scraper
const { createStorageAdapter } = require('./storage');
const ResourceDownloader = require('./downloader');

/**
 * Main function to find video resources
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       VIDEO RESOURCE FINDER v1.1                      ║');
  console.log('║       Finding free resources from Pexels & Pixabay    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    string: ['projectDir', 'provider', 'quality', 'storage'],
    number: ['resultsPerQuery', 'concurrency', 'downloadCount'],
    boolean: ['enableAI', 'noAI', 'download', 'skipDownload'],
    default: {
      resultsPerQuery: 3,
      provider: null,           // null = multi-provider (search all available)
      enableAI: true,
      download: true,           // Enable download by default
      skipDownload: false,      // Explicit skip
      quality: 'best',          // best | hd | sd | medium
      storage: 'local',         // local | cloud (future)
      concurrency: 3,           // Parallel downloads
      downloadCount: 10,        // Download 10 results per scene for selection
      batchSize: 0              // 0 = unlimited, otherwise limit number of AI generation requests
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
    console.log('  --provider           Specific provider: pexels|pixabay|unsplash (default: all available)');
    console.log('  --download           Enable download (default: true)');
    console.log('  --skipDownload       Skip downloading, only get URLs');
    console.log('  --quality            Quality preference: best|hd|sd|medium (default: best)');
    console.log('  --downloadCount      Number of results to download per scene (default: 1)');
    console.log('  --concurrency        Parallel download threads (default: 3)');
    console.log('  --storage            Storage type: local|cloud (default: local)');
    console.log('  --batchSize          Limit number of new AI generation requests (0 = unlimited)');
    process.exit(1);
  }

  // Resolve project directory path
  let projectDir = path.resolve(args.projectDir);

  // Smart detection: If script.json doesn't exist at resolved path, try resolving relative to project root
  if (!fs.existsSync(path.join(projectDir, 'script.json'))) {
    const rootDir = path.resolve(__dirname, '..', '..', '..', '..');
    const fallbackPath = path.resolve(rootDir, args.projectDir);

    if (fs.existsSync(path.join(fallbackPath, 'script.json'))) {
      console.log(`ℹ️  Adjusted project path to: ${fallbackPath}`);
      projectDir = fallbackPath;
    }
  }

  console.log(`📁 Project Directory: ${projectDir}`);
  console.log(`🔍 Provider Mode: ${args.provider || 'multi-provider (all available)'}`);
  console.log(`📥 Download: ${args.download && !args.skipDownload ? 'enabled' : 'disabled'}`);
  if (args.download && !args.skipDownload) {
    console.log(`   Quality: ${args.quality}, Count per scene: ${args.downloadCount}`);
  }
  if (args.batchSize > 0) {
    console.log(`   Batch Size: ${args.batchSize} (AI generation limited)`);
  }
  console.log('');

  try {
    // Step 0: Load existing resources.json for RESUME capability
    let existingResources = null;
    const resourcesPath = path.join(projectDir, 'resources.json');
    if (fs.existsSync(resourcesPath)) {
      try {
        const raw = fs.readFileSync(resourcesPath, 'utf8');
        existingResources = JSON.parse(raw).resources;
        console.log('🔄 Found existing resources.json - enabling RESUME mode\n');
      } catch (err) {
        console.warn('⚠️  Could not read existing resources.json, starting fresh.\n');
      }
    }

    // Step 1: Initialize API clients
    console.log('🔧 Initializing API clients...\n');

    const pexelsApiKey = process.env.PEXELS_API_KEY;
    const pixabayApiKey = process.env.PIXABAY_API_KEY;
    const unsplashApiKey = process.env.UNSPLASH_API_KEY;

    if (!pexelsApiKey && !pixabayApiKey && !unsplashApiKey) {
      throw new Error('At least one API key (PEXELS_API_KEY, PIXABAY_API_KEY, or UNSPLASH_API_KEY) must be set in .env file');
    }

    const pexelsClient = pexelsApiKey ? new PexelsClient(pexelsApiKey) : null;
    const pixabayClient = pixabayApiKey ? new PixabayClient(pixabayApiKey) : null;
    const unsplashClient = unsplashApiKey ? new UnsplashClient(unsplashApiKey) : null;

    // Initialize Gemini client for AI image generation
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const enableAI = args.enableAI && !args.noAI && geminiApiKey;
    let geminiClient = null;

    if (enableAI && geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        geminiClient = new GeminiClient(geminiApiKey);
        console.log('✅ Gemini client initialized (AI generation enabled)');
      } catch (error) {
        console.warn('⚠️  Gemini client initialization failed:', error.message);
      }
    } else if (args.enableAI && !geminiApiKey) {
      console.log('ℹ️  AI generation disabled (GEMINI_API_KEY not set)');
    }

    if (pexelsClient) console.log('✅ Pexels client initialized');
    if (pixabayClient) console.log('✅ Pixabay client initialized');
    if (unsplashClient) console.log('✅ Unsplash client initialized');

    // Step 2: Read script.json
    console.log('\n📖 Reading script.json...\n');
    const scriptReader = new ScriptReader();
    const script = await scriptReader.readScript(projectDir);
    const metadata = scriptReader.getMetadata(script);
    const visualQueries = scriptReader.extractVisualQueries(script);
    const musicQuery = scriptReader.extractMusicQuery(script);

    const totalQueries = (visualQueries.stock?.length || 0) + (visualQueries.ai?.length || 0) + (visualQueries.pinned?.length || 0);
    if (totalQueries === 0 && !musicQuery) {
      console.warn('⚠️  No queries found in script.json');
      console.log('Make sure your script has scenes with visualSuggestion.type="stock", "ai-generated", or "pinned"');
      process.exit(0);
    }

    // Step 3: Build queries
    console.log('\n🔨 Building search queries...\n');
    const queryBuilder = new QueryBuilder();
    const queries = queryBuilder.buildAllQueries(visualQueries, musicQuery);

    // Initialize Pixabay Scraper for music
    const pixabayScraper = new PixabayScraper();

    // Step 4: Fetch resources
    console.log('\n🌐 Fetching resources from APIs...\n');
    const resourceMatcher = new ResourceMatcher(pexelsClient, pixabayClient, {
      unsplashClient: unsplashClient,
      geminiClient: geminiClient,
      pixabayScraper: pixabayScraper, // Pass scraper instance
      resultsPerQuery: args.resultsPerQuery,
      provider: args.provider,          // null = multi-provider, or specific provider name
      enableAIGeneration: enableAI,
      projectDir: projectDir,
      existingResources: existingResources, // Pass existing resources
      batchSize: args.batchSize             // Pass batch size
    });

    let results = await resourceMatcher.fetchAllResources(queries);

    // Step 5: Download resources (if enabled)
    let downloadSummary = null;
    const shouldDownload = args.download && !args.skipDownload;

    if (shouldDownload) {
      console.log('\n📥 Downloading resources...\n');

      // Initialize storage adapter
      const storageAdapter = createStorageAdapter(args.storage, {
        baseDir: projectDir,
        structure: 'by-type'
      });
      await storageAdapter.initialize();

      // Initialize downloader
      const downloader = new ResourceDownloader(storageAdapter, {
        quality: args.quality,
        concurrency: args.concurrency,
        downloadCount: args.downloadCount
      });

      // Download with progress
      let downloadedCount = 0;
      results = await downloader.downloadAllResources(results, (progress) => {
        downloadedCount++;
        const status = progress.result.success ? '✓' : '✗';
        const title = progress.current.metadata?.title || progress.current.id;
        const truncatedTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
        console.log(`  [${status}] ${progress.completed}/${progress.total} - ${truncatedTitle}`);
      });

      // Get download summary
      const storageInfo = storageAdapter.getStorageInfo();
      downloadSummary = {
        enabled: true,
        totalDownloaded: countDownloaded(results),
        totalFailed: countFailedDownloads(results),
        totalSkipped: countSkipped(results, args.downloadCount),
        storageLocation: storageInfo.downloadsDir,
        storageType: storageInfo.type,
        qualityPreference: args.quality
      };

      console.log(`\n[Download] Complete: ${downloadSummary.totalDownloaded} downloaded, ${downloadSummary.totalFailed} failed`);
    }

    // Step 6: Build and save resources.json
    console.log('\n💾 Building resources.json...\n');
    const jsonBuilder = new JSONBuilder();

    const apiStats = {
      pexels: pexelsClient ? pexelsClient.getRequestCount() : 0,
      pixabay: pixabayClient ? pixabayClient.getRequestCount() : 0,
      unsplash: unsplashClient ? unsplashClient.getRequestCount() : 0,
      gemini: geminiClient ? geminiClient.getRequestCount() : 0
    };

    const resourcesJSON = jsonBuilder.buildResourcesJSON(metadata, results, apiStats, downloadSummary);

    // Validate before saving
    if (!jsonBuilder.validate(resourcesJSON)) {
      throw new Error('Generated resources.json failed validation');
    }

    const outputPath = await jsonBuilder.saveToFile(projectDir, resourcesJSON);

    // Step 7: Print summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                   ✅ SUCCESS                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`  Total Videos:        ${resourcesJSON.summary.totalVideos}`);
    console.log(`  Total Images:        ${resourcesJSON.summary.totalImages}`);
    if (resourcesJSON.summary.totalGeneratedImages > 0) {
      console.log(`  AI Generated Images: ${resourcesJSON.summary.totalGeneratedImages}`);
    }
    if (resourcesJSON.summary.totalPinned > 0) {
      console.log(`  Pinned Resources:    ${resourcesJSON.summary.totalPinned}`);
    }
    console.log(`  Total Music:         ${resourcesJSON.summary.totalMusic}`);
    console.log(`  Total Sound Effects: ${resourcesJSON.summary.totalSoundEffects}`);
    console.log(`  Successful Queries:  ${resourcesJSON.summary.successfulQueries}`);
    console.log(`  Failed Queries:      ${resourcesJSON.summary.failedQueries}`);

    if (downloadSummary) {
      console.log('\n📥 Download Summary:');
      console.log(`  Downloaded:          ${downloadSummary.totalDownloaded}`);
      console.log(`  Failed:              ${downloadSummary.totalFailed}`);
      console.log(`  Storage Location:    ${downloadSummary.storageLocation}`);
    }

    console.log('\n🔌 API Usage:');
    console.log(`  Pexels requests:     ${apiStats.pexels}`);
    console.log(`  Pixabay requests:    ${apiStats.pixabay}`);
    console.log(`  Unsplash requests:   ${apiStats.unsplash}`);
    if (apiStats.gemini > 0) {
      console.log(`  Gemini requests:     ${apiStats.gemini} (AI generated images)`);
    }

    if (resourcesJSON.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      resourcesJSON.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.query || error.sceneId}`);
        console.log(`     Error: ${error.error}`);
        console.log(`     Suggestion: ${error.suggestion}`);
      });
    }

    console.log(`\n📄 Output saved to: ${outputPath}`);

    if (shouldDownload) {
      console.log('\n✨ Next steps:');
      console.log('  1. Review resources.json to see all downloaded resources');
      console.log('  2. Find downloaded files in: ' + downloadSummary.storageLocation);
      console.log('  3. Use the local files in your video editing workflow\n');
    } else {
      console.log('\n✨ Next steps:');
      console.log('  1. Review resources.json to see all found resources');
      console.log('  2. Run again without --skipDownload to download files');
      console.log('  3. Or manually download the resources you want to use\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Count successfully downloaded resources
 */
function countDownloaded(results) {
  let count = 0;
  for (const group of [...(results.videos || []), ...(results.images || []), ...(results.music || []), ...(results.soundEffects || [])]) {
    for (const result of (group.results || [])) {
      if (result.downloadStatus === 'success') count++;
    }
  }
  return count;
}

/**
 * Count failed downloads
 */
function countFailedDownloads(results) {
  let count = 0;
  for (const group of [...(results.videos || []), ...(results.images || []), ...(results.music || []), ...(results.soundEffects || [])]) {
    for (const result of (group.results || [])) {
      if (result.downloadStatus === 'failed') count++;
    }
  }
  return count;
}

/**
 * Count skipped resources (beyond downloadCount)
 */
function countSkipped(results, downloadCount) {
  let count = 0;
  for (const group of [...(results.videos || []), ...(results.images || []), ...(results.music || []), ...(results.soundEffects || [])]) {
    const resultsArray = group.results || [];
    if (resultsArray.length > downloadCount) {
      count += resultsArray.length - downloadCount;
    }
  }
  return count;
}

// Run main function
main();
