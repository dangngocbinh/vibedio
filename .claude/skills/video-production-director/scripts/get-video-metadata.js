#!/usr/bin/env node

/**
 * GET VIDEO METADATA
 * 
 * Node.js wrapper cho FFprobe metadata extraction
 * Tương đương với video_processor.py metadata command
 * 
 * Usage:
 *   node get-video-metadata.js <video-path> [--json]
 * 
 * Examples:
 *   node get-video-metadata.js video.mp4
 *   node get-video-metadata.js video.mp4 --json
 */

const { execSync } = require('child_process');
const fs = require('fs');

function checkFFprobe() {
    try {
        execSync('ffprobe -version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function getVideoMetadata(videoPath) {
    if (!checkFFprobe()) {
        console.error('❌ FFprobe not installed!');
        console.error('Install: brew install ffmpeg (macOS)');
        process.exit(1);
    }

    if (!fs.existsSync(videoPath)) {
        console.error(`❌ Video file not found: ${videoPath}`);
        process.exit(1);
    }

    // FFprobe command to get JSON output
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;

    try {
        const output = execSync(cmd, { encoding: 'utf-8' });
        const data = JSON.parse(output);

        // Extract relevant info
        const videoStream = data.streams.find(s => s.codec_type === 'video');
        const audioStream = data.streams.find(s => s.codec_type === 'audio');
        const format = data.format;

        const metadata = {
            duration: parseFloat(format.duration) || 0,
            resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            fps: videoStream ? eval(videoStream.r_frame_rate) : 0,
            hasAudio: !!audioStream,
            videoCodec: videoStream?.codec_name || 'unknown',
            audioCodec: audioStream?.codec_name || 'none',
            fileSize: parseInt(format.size) || 0,
            fileSizeMB: (parseInt(format.size) / (1024 * 1024)).toFixed(2),
            bitrate: parseInt(format.bit_rate) || 0
        };

        return metadata;
    } catch (error) {
        console.error('❌ Failed to get metadata:', error.message);
        process.exit(1);
    }
}

function formatMetadata(metadata) {
    return `
📹 Video Metadata
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Duration:     ${metadata.duration.toFixed(2)}s
📐 Resolution:   ${metadata.resolution}
🎞️  FPS:          ${metadata.fps.toFixed(2)}
🔊 Has Audio:    ${metadata.hasAudio ? '✅ Yes' : '❌ No'}
🎬 Video Codec:  ${metadata.videoCodec}
🎵 Audio Codec:  ${metadata.audioCodec}
📦 File Size:    ${metadata.fileSizeMB} MB
💾 Bitrate:      ${(metadata.bitrate / 1000).toFixed(0)} kbps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('Usage: node get-video-metadata.js <video-path> [--json]');
        console.log('');
        console.log('Examples:');
        console.log('  node get-video-metadata.js video.mp4          # Human-readable');
        console.log('  node get-video-metadata.js video.mp4 --json   # JSON output');
        process.exit(1);
    }

    const videoPath = args[0];
    const jsonOutput = args.includes('--json');

    const metadata = getVideoMetadata(videoPath);

    if (jsonOutput) {
        console.log(JSON.stringify(metadata, null, 2));
    } else {
        console.log(formatMetadata(metadata));
    }
}

module.exports = { getVideoMetadata, checkFFprobe };
