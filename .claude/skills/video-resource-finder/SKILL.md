# VIDEO RESOURCE FINDER SKILL

## MỤC ĐÍCH

Tự động tìm kiếm FREE resources cho video production từ Pexels và Pixabay APIs:
- **Stock Videos (B-roll)** - Từ Pexels, Pixabay
- **Stock Images** - Từ Pexels, Pixabay
- **Background Music** - Từ Pixabay Music
- **Sound Effects** - Từ Pixabay SFX

Skill trả về metadata và URLs (không tự động download), cho phép user tự chọn resources phù hợp.

## WORKFLOW

```
script.json → Read Scenes → Extract Queries → Call APIs → Build resources.json
```

**Chi tiết:**
1. Đọc `script.json` từ project directory
2. Extract visual queries từ scenes (type="stock")
3. Extract music query từ music.mood
4. Tạo standard SFX queries (whoosh, pop, ding)
5. Call Pexels API cho videos/images
6. Call Pixabay API cho music/SFX (và backup cho videos/images)
7. Lưu kết quả vào `resources.json` với top 3 results mỗi query

## INPUT PARAMETERS

### Required
- **`--projectDir`**: Đường dẫn đến folder chứa script.json (bắt buộc)

### Optional
- **`--resultsPerQuery`**: Số lượng results mỗi query (default: 3, max: 80)
- **`--preferredSource`**: API ưu tiên "pexels" hoặc "pixabay" (default: pexels)

### Environment Variables (.env)
```bash
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key
```

## OUTPUT STRUCTURE

File `resources.json` được lưu trong `projectDir`:

```json
{
  "projectName": "tai-sao-ngu-8-tieng-van-met",
  "generatedAt": "2026-01-24T20:00:00Z",
  "apiSources": {
    "pexels": { "used": true, "requestCount": 5 },
    "pixabay": { "used": true, "requestCount": 3 }
  },
  "summary": {
    "totalVideos": 15,
    "totalImages": 6,
    "totalMusic": 6,
    "totalSoundEffects": 9,
    "totalScenes": 5,
    "successfulQueries": 7,
    "failedQueries": 1
  },
  "resources": {
    "videos": [
      {
        "sceneId": "hook",
        "sceneText": "Bạn ngủ đủ 8 tiếng...",
        "query": "tired waking up",
        "source": "pexels",
        "results": [
          {
            "id": "pexels-12345",
            "title": "Tired Woman Waking Up",
            "url": "https://www.pexels.com/video/12345",
            "downloadUrls": {
              "hd": "https://player.vimeo.com/.../hd.mp4",
              "sd": "https://player.vimeo.com/.../sd.mp4"
            },
            "width": 1920,
            "height": 1080,
            "duration": 12,
            "fps": 30,
            "user": {
              "name": "John Doe",
              "url": "https://www.pexels.com/@johndoe"
            },
            "license": "Pexels License (Free to use)",
            "rank": 1
          }
          // ... 2 more results
        ]
      }
    ],
    "images": [...],
    "music": [...],
    "soundEffects": [...]
  },
  "errors": [
    {
      "type": "video",
      "sceneId": "cta",
      "query": "follow button animation",
      "error": "No results found",
      "suggestion": "Try simpler query or use AI-generated imagery"
    }
  ]
}
```

### Resources Structure Details

#### Videos
```json
{
  "sceneId": "hook",
  "sceneText": "Scene text...",
  "query": "cleaned search query",
  "source": "pexels|pixabay",
  "results": [
    {
      "id": "pexels-12345",
      "title": "Video title",
      "url": "https://pexels.com/video/...",
      "downloadUrls": {
        "hd": "...",
        "sd": "...",
        "4k": "..."
      },
      "width": 1920,
      "height": 1080,
      "duration": 15,
      "fps": 30,
      "user": { "name": "...", "url": "..." },
      "tags": [],
      "license": "Pexels License (Free to use)",
      "rank": 1
    }
  ]
}
```

#### Images
```json
{
  "sceneId": "solution",
  "query": "alarm clock",
  "source": "pexels",
  "results": [
    {
      "id": "pexels-67890",
      "title": "Modern Alarm Clock",
      "url": "https://pexels.com/photo/...",
      "downloadUrls": {
        "original": "...",
        "large": "...",
        "medium": "..."
      },
      "width": 1920,
      "height": 1080,
      "photographer": "Jane Smith",
      "tags": ["alarm", "clock"],
      "license": "Pexels License (Free to use)",
      "rank": 1
    }
  ]
}
```

#### Music
```json
{
  "mood": "calm",
  "query": "calm ambient peaceful background music",
  "source": "pixabay",
  "results": [
    {
      "id": "pixabay-music-456",
      "title": "Calm Piano Meditation",
      "url": "https://pixabay.com/music/...",
      "downloadUrl": "https://cdn.pixabay.com/.../audio.mp3",
      "duration": 156,
      "genre": "Ambient",
      "tags": ["calm", "piano"],
      "license": "Pixabay Content License (Free to use)"
    }
  ]
}
```

#### Sound Effects
```json
{
  "type": "whoosh",
  "query": "whoosh transition swoosh",
  "description": "For scene transitions and text animations",
  "source": "pixabay",
  "results": [
    {
      "id": "pixabay-sfx-whoosh",
      "title": "Whoosh Transition 1",
      "url": "https://pixabay.com/sound-effects/...",
      "downloadUrl": "https://cdn.pixabay.com/.../sfx.mp3",
      "duration": 2,
      "tags": ["whoosh", "transition"],
      "license": "Pixabay Content License (Free to use)"
    }
  ]
}
```

## API SETUP

### 1. Pexels API Key

**Lấy key miễn phí:**
1. Truy cập: https://www.pexels.com/api/
2. Click "Get Started" / "Sign Up"
3. Đăng ký tài khoản (email + password)
4. Verify email
5. Vào API Dashboard → Copy API Key

**Rate Limits:**
- 200 requests/hour
- 50 requests/15 minutes

### 2. Pixabay API Key

**Lấy key miễn phí:**
1. Truy cập: https://pixabay.com/api/docs/
2. Sign up for an account
3. Verify email
4. Vào profile → API → Copy API Key

**Rate Limits:**
- 5000 requests/day
- 100 requests/minute

### 3. Tạo file .env

Copy `.env.example` thành `.env`:

```bash
cd .claude/skills/video-resource-finder
cp .env.example .env
```

Điền API keys:

```bash
PEXELS_API_KEY=abc123xyz...
PIXABAY_API_KEY=def456uvw...
```

## USAGE EXAMPLES

### Example 1: Basic Usage

```bash
cd .claude/skills/video-resource-finder

# Install dependencies (first time only)
npm install

# Run skill
node scripts/find-resources.js \
  --projectDir "../../public/projects/tai-sao-ngu-8-tieng-van-met"
```

**Output:**
```
✅ Found 15 videos, 6 images, 6 music tracks, 9 sound effects
📄 resources.json saved to: public/projects/tai-sao-ngu-8-tieng-van-met/resources.json
```

### Example 2: Tùy chỉnh số lượng results

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --resultsPerQuery 5
```

Mỗi query sẽ trả về 5 results thay vì 3 (default).

### Example 3: Ưu tiên Pixabay

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --preferredSource "pixabay"
```

Sẽ search Pixabay trước, Pexels làm fallback.

## CONVERSATION FLOW

### Flow 1: Simple Flow (Đã có script.json)

```
User: "Tìm resources cho video tai-sao-ngu-8-tieng-van-met"