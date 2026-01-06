#!/usr/bin/env node

/**
 * Simple test script to generate video
 */

import { config } from './src/utils/config.js';

const testText = `Trí tuệ nhân tạo đang thay đổi cuộc sống chúng ta từng ngày. Từ những trợ lý ảo thông minh đến xe tự lái, AI đang ở khắp mọi nơi. Công nghệ học máy giúp phân tích dữ liệu nhanh hơn con người hàng triệu lần. Các mô hình ngôn ngữ lớn có thể hiểu và tạo ra văn bản như người thật. Nhận dạng hình ảnh giúp chẩn đoán bệnh chính xác hơn bác sĩ. Robot thông minh đang cách mạng hóa sản xuất công nghiệp. AI tạo sinh mở ra vô vàn khả năng sáng tạo mới. Tương lai với AI sẽ tuyệt vời hơn chúng ta tưởng tượng.`;

console.log('🚀 Auto Video Generator Test\n');
console.log('📝 Text input:', testText.substring(0, 100) + '...\n');

// Validate config
console.log('🔑 Checking API keys...');
console.log('- ElevenLabs:', config.elevenlabs.apiKey ? '✅' : '❌ Missing');
console.log('- Unsplash:', config.unsplash.accessKey ? '✅' : '❌ Missing');
console.log('- Pexels:', config.pexels.apiKey ? '✅' : '❌ Missing');
console.log('- OpenAI:', config.openai.apiKey ? '✅' : '❌ Missing');
console.log('- Deepgram:', config.deepgram.apiKey ? '✅' : '❌ Missing');

const missingKeys = [];
if (!config.elevenlabs.apiKey) missingKeys.push('ELEVENLABS_API_KEY');
if (!config.unsplash.accessKey) missingKeys.push('UNSPLASH_ACCESS_KEY');
if (!config.pexels.apiKey) missingKeys.push('PEXELS_API_KEY');
if (!config.openai.apiKey) missingKeys.push('OPENAI_API_KEY');
if (!config.deepgram.apiKey) missingKeys.push('DEEPGRAM_API_KEY');

if (missingKeys.length > 0) {
  console.log('\n❌ Error: Missing API keys:', missingKeys.join(', '));
  console.log('\n💡 Please add them to your .env file');
  console.log('See .env.example for the required format\n');
  process.exit(1);
}

console.log('\n✅ All API keys configured!');
console.log('\n📹 To generate video, use the full CLI:');
console.log('   npx tsx src/cli/generate-video.ts "Your text here"\n');
console.log('Or use this test text with the VideoComposition component in Remotion Studio.\n');
