# Video Resource Finder

Tự động tìm kiếm FREE video/image/music/SFX resources từ Pexels và Pixabay APIs.

## Features

✅ Tìm stock videos (B-roll) từ Pexels & Pixabay  
✅ Tìm stock images từ Pexels & Pixabay  
✅ Tìm background music từ Pixabay Music  
✅ Tìm sound effects (whoosh, pop, ding)  
✅ Multi-provider search (all available APIs)  
✅ **NEW v1.2**: Intelligent resource selection (AI scoring)  
✅ **NEW v1.2**: Staging workflow (downloads → selection → imports)  
✅ Auto-download với quality selection  
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
  "metadata": {
    "projectName": "my-video",
    "description": "Video về giấc ngủ",
    "duration": 60.5,
    "ratio": "9:16"
  },
  "sections": [
    {
      "id": "intro",
      "name": "Giới thiệu",
      "startTime": 0.0,
      "endTime": 5.2,
      "duration": 5.2,
      "scenes": [
        {
          "id": "hook",
          "type": "media",
          "startTime": 0.0,
          "endTime": 5.2,
          "duration": 5.2,
          "text": "Bạn ngủ đủ 8 tiếng...",
          "visualDescription": "Người mệt mỏi thức dậy",
          "visuals": [
            {
              "type": "stock",
              "query": "tired waking up",
              "style": "zoom-in"
            }
          ]
        }
      ]
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
--provider           # Optional: Specific provider to use (default: multi-provider)
                     #   - null/unset: Search ALL providers with API keys (default)
                     #   - pexels: Only Pexels (no fallback)
                     #   - pixabay: Only Pixabay (no fallback)
                     #   - unsplash: Only Unsplash (no fallback)
```

## Workflow

### Traditional Flow (v1.0)

```
script.json → Search APIs → Download 1 best → resources.json → Build video
```

### New Selection Flow (v1.2+)

```
script.json → Search APIs → Download 10 options/scene → downloads/ (staging)
                                          ↓
                              ResourceSelector picks best
                                          ↓
                              Import selected → imports/
                                          ↓
                              Cleanup downloads/
                                          ↓
                              Build video from imports/
```

**Benefits:**
- 🎯 Better resource matching via intelligent selection
- 🎨 More variety and quality options
- 🧹 Clean project structure (only selected resources kept)
- 💾 Efficient storage (staging area auto-cleaned)

**How it works:**

1.  **Download Phase**: `find-resources.js` downloads 10 resources per scene to `downloads/`
2.  **Selection Phase**: `select-and-import.js` uses AI to pick best match
3.  **Import Phase**: Selected resources copied to `imports/`
4.  **Cleanup Phase**: `downloads/` staging area removed
5.  **Build Phase**: Video editor uses resources from `imports/`

## Examples

### Basic usage (Multi-provider - searches all available)
```bash
node scripts/find-resources.js \
  --projectDir "../../output/tai-sao-ngu-8-tieng-van-met"
```

Searches **all providers** with configured API keys (Pexels + Pixabay + Unsplash).

### Get 5 results per query (Multi-provider)
```bash
node scripts/find-resources.js \
  --projectDir "../../output/my-project" \
  --resultsPerQuery 5
```

Searches all providers and returns up to 5 results per provider.

### Search only from Pixabay (No fallback)
```bash
node scripts/find-resources.js \
  --projectDir "../../output/my-project" \
  --provider "pixabay"
```

Only searches Pixabay. Will NOT fallback to other providers if no results found.

### Search only from Pexels (No fallback)
```bash
node scripts/find-resources.js \
  --projectDir "../../output/my-project" \
  --provider "pexels"
```

Only searches Pexels. Will NOT fallback to other providers if no results found.

### Resource Selection & Import (NEW v1.2)
```bash
# Step 1: Download 10 resources per scene
node scripts/find-resources.js \
  --projectDir "../../output/my-project"

# Step 2: Select best and import to project
node scripts/select-and-import.js \
  --projectDir "../../output/my-project"
```

The selection tool will:
- ✅ Analyze all downloaded resources
- ✅ Pick best match using intelligent scoring
- ✅ Import selected to `imports/`
- ✅ Auto-cleanup `downloads/` staging area

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
