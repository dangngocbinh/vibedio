#!/usr/bin/env node

/**
 * EXTRACT AUDIO FROM VIDEO
 * 
 * Node.js wrapper cho FFmpeg audio extraction
 * Tương đương với video_processor.py extract command
 * 
 * Usage:
 *   node extract-audio.js <video-path> <output-audio-path> [quality]
 * 
 * Examples:
 *   node extract-audio.js video.mp4 audio.mp3
 *   node extract-audio.js video.mp4 audio.mp3 2
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chinh quality: 0-9 (0 = best, 9 = worst)
const DEFAULT_QUALITY = 2;

function checkFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function extractAudio(videoPath, outputPath, quality = DEFAULT_QUALITY) {
    if (!checkFFmpeg()) {
        console.error('❌ FFmpeg not installed!');
        console.error('Install: brew install ffmpeg (macOS)');
        process.exit(1);
    }

    if (!fs.existsSync(videoPath)) {
        console.error(`❌ Video file not found: ${videoPath}`);
        process.exit(1);
    }

    console.log(`📹 Input: ${videoPath}`);
    console.log(`🎵 Output: ${outputPath}`);
    console.log(`⚙️  Quality: ${quality} (0=best, 9=worst)`);

    // Tạo output directory nếu chưa có
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // FFmpeg command
    const cmd = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a ${quality} -y "${outputPath}"`;

    try {
        console.log('\n🔄 Extracting audio...');
        execSync(cmd, { stdio: 'inherit' });

        // Check output exists
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`\n✅ Success!`);
            console.log(`   File: ${outputPath}`);
            console.log(`   Size: ${sizeMB} MB`);
        } else {
            throw new Error('Output file not created');
        }
    } catch (error) {
        console.error('\n❌ Extraction failed:', error.message);
        process.exit(1);
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node extract-audio.js <video-path> <output-audio-path> [quality]');
        console.log('');
        console.log('Examples:');
        console.log('  node extract-audio.js video.mp4 audio.mp3');
        console.log('  node extract-audio.js video.mp4 audio/output.mp3 2');
        console.log('');
        console.log('Quality: 0-9 (0=best quality, 9=worst quality, default=2)');
        process.exit(1);
    }

    const [videoPath, outputPath, quality = DEFAULT_QUALITY] = args;
    extractAudio(videoPath, outputPath, parseInt(quality));
}

module.exports = { extractAudio, checkFFmpeg };
