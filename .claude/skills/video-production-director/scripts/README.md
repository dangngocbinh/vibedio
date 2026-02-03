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

---

## 3. write-text.js ⚡ (Non-blocking Text Writer)

**Purpose:** Replace blocking heredoc patterns with fast, non-blocking file writes.

**Problem Solved:**
- Terminal blocking/hanging when using `cat > file << 'EOF'`
- Unreliable with large text content
- Command line argument length limits

**Usage:**
```bash
node write-text.js --file <path> --text <content>
node write-text.js --file <path> --stdin
```

**Examples:**
```bash
# Write section text
node write-text.js \
  --file "public/projects/demo/sec_intro.txt" \
  --text "Một. Antigravity không phải là một công cụ đơn lẻ..."

# Write from stdin (for very long content)
echo "Long content..." | node write-text.js \
  --file "public/projects/demo/raw_script.txt" \
  --stdin
```

**Features:**
- ✅ Non-blocking execution
- ✅ Auto-creates parent directories
- ✅ No text length limits
- ✅ Shows file size after write
- ✅ UTF-8 encoding support

**Migration from heredoc:**
```bash
# OLD (blocks terminal ❌)
cat > file.txt << 'EOF'
...long text...
EOF

# NEW (fast, reliable ✅)
node write-text.js --file "file.txt" --text "...long text..."
```

---

## 4. add-scenes-batch.js 🚀 (Sequential Batch Processor)

**Purpose:** Safely run multiple `add-scenes` commands sequentially without terminal hang.

**Problem Solved:**
- I/O congestion when running multiple add-scenes commands
- Terminal hang with chained commands (`&&`)
- Manual sequential execution is tedious

**Usage:**
```bash
node add-scenes-batch.js \
  --script <path> \
  --voice <path> \
  --section <id> <scenes-file> \
  [--section <id> <scenes-file> ...]
```

**Example:**
```bash
node add-scenes-batch.js \
  --script "public/projects/demo/script.json" \
  --voice "public/projects/demo/voice.json" \
  --section "intro" "scenes_intro.json" \
  --section "p1" "scenes_p1.json" \
  --section "p2" "scenes_p2.json" \
  --section "p3" "scenes_p3.json" \
  --section "outro" "scenes_outro.json"
```

**How it works:**
1. Validates all files exist before starting
2. Runs each `add-scenes` command sequentially (not parallel)
3. Adds 500ms delay between commands to prevent I/O congestion
4. Shows clear progress (1/5, 2/5, ...)
5. Stops immediately on error with clear error message

**Features:**
- ✅ Sequential execution (no blocking)
- ✅ Pre-validation of all inputs
- ✅ Progress tracking
- ✅ Error handling with section identification
- ✅ I/O congestion prevention

**When to use:**
- Videos with 3+ sections needing scenes
- Want to avoid manual sequential command execution
- Need guaranteed no-hang operation

**Migration from chained commands:**
```bash
# OLD (risky, can hang ❌)
python3 script_cli.py add-scenes --section "intro" ... && \
python3 script_cli.py add-scenes --section "p1" ... && \
python3 script_cli.py add-scenes --section "p2" ...

# NEW (safe, sequential with delay ✅)
node add-scenes-batch.js \
  --script "..." --voice "..." \
  --section "intro" "scenes_intro.json" \
  --section "p1" "scenes_p1.json" \
  --section "p2" "scenes_p2.json"
```

---

## Troubleshooting Helper Scripts

**Test write-text.js:**
```bash
node write-text.js --file "/tmp/test.txt" --text "Test content"
cat /tmp/test.txt
```

**Test add-scenes-batch.js:**
```bash
# Create test scenes files first, then:
node add-scenes-batch.js \
  --script "public/projects/test/script.json" \
  --voice "public/projects/test/voice.json" \
  --section "intro" "test_scenes.json"
```

**Common Issues:**

1. **Permission denied**: Make scripts executable
   ```bash
   chmod +x write-text.js add-scenes-batch.js
   ```

2. **Command not found**: Run with `node` prefix
   ```bash
   node write-text.js ...
   ```

3. **File not found**: Use absolute paths or verify working directory
