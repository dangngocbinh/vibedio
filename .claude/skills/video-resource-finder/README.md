# Video Resource Finder

Tự động tìm kiếm FREE video/image/music/SFX resources từ Pexels và Pixabay APIs.

## Features

✅ Tìm stock videos (B-roll) từ Pexels & Pixabay
✅ Tìm stock images từ Pexels & Pixabay
✅ Tìm background music từ Pixabay Music
✅ Tìm sound effects (whoosh, pop, ding)
✅ Top 3 results mỗi query
✅ Metadata-only mode (không auto-download)
✅ Fallback giữa APIs
✅ Error handling graceful

## Quick Start

### 1. Install dependencies

```bash
cd .claude/skills/video-resource-finder
npm install
```

### 2. Setup API keys

Copy `.env.example` thành `.env` và điền API keys:

```bash
cp .env.example .env
```

Lấy API keys miễn phí:
- **Pexels**: https://www.pexels.com/api/
- **Pixabay**: https://pixabay.com/api/docs/

### 3. Run

```bash
node scripts/find-resources.js --projectDir "../../output/your-project"
```

## Input

Skill đọc từ `script.json` trong project directory:

```json
{
  "scenes": [
    {
      "id": "hook",
      "text": "Bạn ngủ đủ 8 tiếng...",
      "visualSuggestion": {
        "type": "stock",
        "query": "tired waking up"
      }
    }
  ],
  "music": {
    "mood": "calm"
  }
}
```

## Output

File `resources.json` với metadata và URLs:

```json
{
  "projectName": "...",
  "summary": {
    "totalVideos": 15,
    "totalImages": 6,
    "totalMusic": 6,
    "totalSoundEffects": 9
  },
  "resources": {
    "videos": [...],
    "images": [...],
    "music": [...],
    "soundEffects": [...]
  }
}
```

## CLI Options

```bash
--projectDir         # Required: Path to project directory
--resultsPerQuery    # Optional: Number of results per query (default: 3)
--preferredSource    # Optional: pexels|pixabay (default: pexels)
```

## Examples

### Basic usage
```bash
node scripts/find-resources.js \
  --projectDir "../../output/tai-sao-ngu-8-tieng-van-met"
```

### Get 5 results per query
```bash
node scripts/find-resources.js \
  --projectDir "../../output/my-project" \
  --resultsPerQuery 5
```

### Prefer Pixabay over Pexels
```bash
node scripts/find-resources.js \
  --projectDir "../../output/my-project" \
  --preferredSource "pixabay"
```

## Integration

Works seamlessly with `video-script-generator`:

```
video-script-generator → script.json
                            ↓
video-resource-finder  → resources.json
                            ↓
(future) video-renderer → final video
```

## API Rate Limits

**Pexels:**
- 200 requests/hour
- 50 requests/15 minutes

**Pixabay:**
- 5000 requests/day
- 100 requests/minute

## License

MIT

## Documentation

See `SKILL.md` for complete documentation.
