#!/usr/bin/env node

/**
 * Test video generation with actual API calls
 * Run: node test-generate.js
 */

require('dotenv').config();

const testText = `Trí tuệ nhân tạo đang thay đổi cuộc sống chúng ta từng ngày. Từ những trợ lý ảo thông minh đến xe tự lái, AI đang ở khắp mọi nơi. Công nghệ học máy giúp phân tích dữ liệu nhanh hơn con người hàng triệu lần.`;

console.log('🎬 Auto Video Generator - Test Script\n');
console.log('📝 Input text:', testText, '\n');

// Import and run generation
async function testGenerate() {
  try {
    // Dynamic import for ES modules
    const { videoGenerator } = await import('./src/utils/video-generator.js');

    const config = {
      text: testText,
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

    console.log('🚀 Starting generation...\n');

    const result = await videoGenerator.generate(config);

    console.log('\n✅ Generation complete!\n');
    console.log('📊 Results:');
    console.log('  - Scenes:', result.sceneAnalysis.scenes.length);
    console.log('  - Images:', result.selectedImages.length);
    console.log('  - Words:', result.audioTimestamp.words.length);
    console.log('  - Duration:', result.sceneAnalysis.duration, 'seconds');
    console.log('  - Audio:', result.audioTimestamp.audioUrl);

    // Save to file
    const fs = require('fs');
    const outputPath = `public/generated/test-video-${Date.now()}.json`;
    fs.mkdirSync('public/generated', { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log('\n💾 Saved to:', outputPath);
    console.log('\n🎉 Now you can:');
    console.log('  1. npm start');
    console.log('  2. Open Remotion Studio');
    console.log('  3. Load this JSON data');
    console.log('  4. Preview & render!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testGenerate();
