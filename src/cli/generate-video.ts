#!/usr/bin/env node

/**
 * CLI tool to generate video data from text input
 *
 * Usage:
 * node src/cli/generate-video.ts "Your text here"
 *
 * This will:
 * 1. Generate audio from text using TTS
 * 2. Analyze content and create scenes
 * 3. Search and select images
 * 4. Generate caption timestamps
 * 5. Save all data to JSON file
 */

import { videoGenerator } from '../utils/video-generator.js';
import { VideoConfig } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  const text = process.argv[2];

  if (!text) {
    console.error('❌ Error: Please provide text input');
    console.log('Usage: node src/cli/generate-video.ts "Your text here"');
    process.exit(1);
  }

  console.log('🚀 Auto Video Generator CLI\n');

  const config: VideoConfig = {
    text,
    ttsProvider: 'elevenlabs',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    animationStyle: 'dynamic',
    captionStyle: {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 48,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      position: 'bottom',
      highlightColor: '#FFD700',
      strokeColor: '#000000',
      strokeWidth: 2,
    },
    transitionType: 'auto',
  };

  try {
    const result = await videoGenerator.generate(config);

    // Save to JSON file
    const timestamp = Date.now();
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `video-data-${timestamp}.json`);
    const jsonData = videoGenerator.saveToCache(result);
    await fs.writeFile(outputPath, jsonData);

    console.log('\n✅ Video data saved to:', outputPath);
    console.log('\n📋 Summary:');
    console.log(`   - Scenes: ${result.sceneAnalysis.scenes.length}`);
    console.log(`   - Images: ${result.selectedImages.length}`);
    console.log(`   - Words: ${result.audioTimestamp.words.length}`);
    console.log(`   - Duration: ${result.sceneAnalysis.duration}s`);
    console.log('\n💡 Next steps:');
    console.log('   1. Open Remotion Studio: npm start');
    console.log('   2. Load this data file in the composition');
    console.log('   3. Preview and render your video!');
  } catch (error) {
    console.error('\n❌ Error generating video:', error);
    process.exit(1);
  }
}

main();
