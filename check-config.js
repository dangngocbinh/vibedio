#!/usr/bin/env node

/**
 * Check if .env is configured correctly
 */

require('dotenv').config();

console.log('🔑 Checking API Keys Configuration\n');

const keys = {
  'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY,
  'UNSPLASH_ACCESS_KEY': process.env.UNSPLASH_ACCESS_KEY,
  'PEXELS_API_KEY': process.env.PEXELS_API_KEY,
  'PIXABAY_API_KEY': process.env.PIXABAY_API_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'DEEPGRAM_API_KEY': process.env.DEEPGRAM_API_KEY,
};

const missing = [];
const configured = [];

Object.entries(keys).forEach(([name, value]) => {
  if (value && value !== 'your_key_here') {
    console.log(`✅ ${name}`);
    configured.push(name);
  } else {
    console.log(`❌ ${name} - Missing or not configured`);
    missing.push(name);
  }
});

console.log(`\n📊 Summary: ${configured.length}/${Object.keys(keys).length} keys configured\n`);

if (missing.length > 0) {
  console.log('⚠️  Missing keys:', missing.join(', '));
  console.log('\n💡 Add them to your .env file to use all features\n');
} else {
  console.log('🎉 All API keys configured! Ready to generate videos!\n');
}

console.log('📹 Test script content:');
console.log('─'.repeat(60));
const testScript = `Trí tuệ nhân tạo đang thay đổi cuộc sống chúng ta từng ngày. Từ những trợ lý ảo thông minh đến xe tự lái, AI đang ở khắp mọi nơi. Công nghệ học máy giúp phân tích dữ liệu nhanh hơn con người hàng triệu lần. Các mô hình ngôn ngữ lớn có thể hiểu và tạo ra văn bản như người thật. Nhận dạng hình ảnh giúp chẩn đoán bệnh chính xác hơn bác sĩ. Robot thông minh đang cách mạng hóa sản xuất công nghiệp. AI tạo sinh mở ra vô vàn khả năng sáng tạo mới. Tương lai với AI sẽ tuyệt vời hơn chúng ta tưởng tượng.`;

console.log(testScript);
console.log('─'.repeat(60));
console.log(`\n📏 Length: ${testScript.length} characters (~${Math.ceil(testScript.split(' ').length * 0.4)}s estimated)\n`);
