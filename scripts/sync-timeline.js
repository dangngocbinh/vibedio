const fs = require('fs');
const path = require('path');

// Đọc file OTIO
const otioPath = './public/projects/vibe-video-capcut-replacement/project.otio';
const otio = JSON.parse(fs.readFileSync(otioPath, 'utf8'));

console.log('🔍 Analyzing timeline...\n');

// Lấy các tracks
const tracks = otio.tracks.children;
const imageTrack = tracks.find(t => t.name === 'Images');
const voiceTrack = tracks.find(t => t.name === 'Voice');

if (!imageTrack || !voiceTrack) {
    console.error('❌ Could not find Images or Voice track');
    process.exit(1);
}

// Tính duration hiện tại của audio
const voiceDuration = voiceTrack.children[0].source_range.duration.value / voiceTrack.children[0].source_range.duration.rate;
console.log(`🎵 Audio duration: ${voiceDuration.toFixed(2)}s`);

// Tính duration hiện tại của images (không tính transitions)
const imageItems = imageTrack.children;
let currentImageDuration = 0;
let imageClips = [];

imageItems.forEach(item => {
    if (item.OTIO_SCHEMA?.startsWith('Transition')) {
        // Transitions overlap, subtract them
        const inOff = item.in_offset ? item.in_offset.value / item.in_offset.rate : 0;
        const outOff = item.out_offset ? item.out_offset.value / item.out_offset.rate : 0;
        currentImageDuration -= (inOff + outOff);
    } else if (item.source_range?.duration) {
        const dur = item.source_range.duration;
        const seconds = dur.value / dur.rate;
        currentImageDuration += seconds;
        imageClips.push(item);
    }
});

console.log(`🖼️  Current image duration: ${currentImageDuration.toFixed(2)}s`);
console.log(`⚠️  Gap: ${(voiceDuration - currentImageDuration).toFixed(2)}s\n`);

// Tính tỷ lệ cần scale
const scaleFactor = voiceDuration / currentImageDuration;
console.log(`📐 Scale factor: ${scaleFactor.toFixed(4)}x (${((scaleFactor - 1) * 100).toFixed(1)}% increase)\n`);

// Apply scale factor to all image clips
console.log('✏️  Updating image durations...\n');

imageClips.forEach(clip => {
    const oldValue = clip.source_range.duration.value;
    const oldSeconds = oldValue / clip.source_range.duration.rate;
    const newSeconds = oldSeconds * scaleFactor;
    const newValue = Math.round(newSeconds * clip.source_range.duration.rate);

    clip.source_range.duration.value = newValue;

    console.log(`  - ${clip.name}: ${oldSeconds.toFixed(2)}s -> ${newSeconds.toFixed(2)}s (${oldValue} -> ${newValue} frames)`);
});

// Verify new total
let newImageDuration = 0;
imageItems.forEach(item => {
    if (item.OTIO_SCHEMA?.startsWith('Transition')) {
        const inOff = item.in_offset ? item.in_offset.value / item.in_offset.rate : 0;
        const outOff = item.out_offset ? item.out_offset.value / item.out_offset.rate : 0;
        newImageDuration -= (inOff + outOff);
    } else if (item.source_range?.duration) {
        const dur = item.source_range.duration;
        newImageDuration += dur.value / dur.rate;
    }
});

console.log(`\n✅ New image duration: ${newImageDuration.toFixed(2)}s (${Math.round(newImageDuration * 30)} frames)`);
console.log(`🎯 Target (audio): ${voiceDuration.toFixed(2)}s (${Math.round(voiceDuration * 30)} frames)`);
console.log(`📊 Difference: ${Math.abs(newImageDuration - voiceDuration).toFixed(2)}s\n`);

// Backup original file
const backupPath = otioPath + '.backup';
fs.copyFileSync(otioPath, backupPath);
console.log(`💾 Backup created: ${backupPath}`);

// Save updated OTIO
fs.writeFileSync(otioPath, JSON.stringify(otio, null, 4), 'utf8');
console.log(`✅ Updated OTIO saved: ${otioPath}\n`);

console.log('🎉 Timeline sync completed!');
