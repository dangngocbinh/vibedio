# Video Processing Scripts

Node.js utilities for video processing (wrappers for FFmpeg/FFprobe).

## Available Scripts

### 1. extract-audio.js

Extract audio from video file to MP3.

**Usage:**
```bash
node extract-audio.js <video-path> <output-audio-path> [quality]
```

**Examples:**
```bash
# Basic usage
node extract-audio.js video.mp4 audio.mp3

# With quality setting (0-9, lower = better)
node extract-audio.js video.mp4 audio/output.mp3 2

# Absolute paths
node extract-audio.js /Users/binhpc/Downloads/video.mp4 ./audio/extracted.mp3
```

**Quality levels:**
- `0-3`: High quality (larger file)
- `4-6`: Medium quality (balanced)
- `7-9`: Low quality (smaller file)

---

### 2. get-video-metadata.js

Get video file metadata (duration, resolution, codecs, etc.).

**Usage:**
```bash
node get-video-metadata.js <video-path> [--json]
```

**Examples:**
```bash
# Human-readable output
node get-video-metadata.js video.mp4

# JSON output (for programmatic use)
node get-video-metadata.js video.mp4 --json
```

**Output includes:**
- Duration (seconds)
- Resolution (width x height)
- FPS
- Has audio
- Video codec
- Audio codec
- File size
- Bitrate

---

## Requirements

**FFmpeg** and **FFprobe** must be installed:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Check installation
ffmpeg -version
ffprobe -version
```

---

## Programmatic Usage

You can also import these scripts in your Node.js code:

```javascript
const { extractAudio } = require('./extract-audio.js');
const { getVideoMetadata } = require('./get-video-metadata.js');

// Extract audio
extractAudio('video.mp4', 'audio.mp3', 2);

// Get metadata
const metadata = getVideoMetadata('video.mp4');
console.log(`Duration: ${metadata.duration}s`);
console.log(`Resolution: ${metadata.resolution}`);
console.log(`Has audio: ${metadata.hasAudio}`);
```

---

## Python Alternative

Python utilities với same functionality:

```bash
# Check dependencies
python utils/video_processor.py check

# Get metadata
python utils/video_processor.py metadata video.mp4

# Extract audio
python utils/video_processor.py extract video.mp4 audio.mp3
```

---

## When to Use Which?

**Use Node.js scripts when:**
- Already in Node.js workflow
- Need to chain with other JS tools
- Quick CLI operations

**Use Python utilities when:**
- Part of script generation workflow
- Need to integrate with multi_video_generator.py
- Prefer Python API for automation

Both have identical functionality! 🎯
