# VIDEO RESOURCE FINDER SKILL

## MỤC ĐÍCH

Tự động tìm kiếm và **tải về** FREE resources cho video production từ Pexels, Pixabay APIs và **Gemini AI Image Generation**:
- **Stock Videos (B-roll)** - Từ Pexels, Pixabay
- **Stock Images** - Từ Pexels, Pixabay
- **AI Generated Images** - Từ Gemini Nano Banana (cho nội dung sáng tạo/minh họa)
- **Background Music** - Từ Pixabay Music
- **Sound Effects** - Từ Pixabay SFX

**🆕 v1.1 - Auto Download:**
- Tự động tải resources về local để tránh lỗi CORS khi sử dụng
- Lưu trữ theo cấu trúc: `downloads/videos/`, `downloads/images/`, `downloads/music/`, `downloads/sfx/`
- Hỗ trợ chọn quality: best (4K/original), hd, sd, medium
- Thiết kế sẵn cho cloud storage integration trong tương lai

**🆕 AI Image Generation:**
- Tự động generate ảnh khi scene có `type: "ai-generated"` hoặc `type: "illustration"`
- Fallback sang AI generation khi stock search không có kết quả phù hợp
- Hỗ trợ tạo ảnh liên hoàn cho story/slideshow với style nhất quán

**🆕 Pinned Resources (User-provided assets):**
- Scene có `type: "pinned"` → skip API search, dùng file/URL user cung cấp
- Local files ngoài project tự động copy vào `imports/{videos,images,music,sfx}/`
- Hỗ trợ path: absolute, `~/...`, relative to project, hoặc remote URL
- Tên file được expand rõ ràng: `import_{sceneId}_{description}_{originalName}.ext`
- Kết quả lưu trong `resources.pinnedResources[]` trong resources.json

## WORKFLOW

```
script.json → Read Scenes → Extract Queries → Call APIs/AI → Download → Build resources.json
                                ↓
                    [Stock Queries]    [AI Queries]
                          ↓                  ↓
                   Pexels/Pixabay      Gemini Nano Banana
                          ↓                  ↓
                      Fallback ────────→ AI Generation
                          ↓
                    📥 Download to local (downloads/)
```

**Chi tiết:**
1. Đọc `script.json` từ project directory
2. Extract visual queries từ scenes:
   - `type="stock"` → Search Pexels/Pixabay
   - `type="ai-generated"` hoặc `type="illustration"` → Gemini AI
   - `type="pinned"` → User-provided file/URL (skip search, auto-import local files)
3. Extract music query từ music.mood
4. Tạo standard SFX queries (whoosh, pop, ding)
5. Call Pexels API cho videos/images (stock)
6. Call Pixabay API cho music/SFX (và backup cho videos/images)
7. Call Gemini API cho AI-generated images
8. Fallback sang Gemini nếu stock search không có kết quả
9. **📥 Tải resources về local** (mặc định tải 1 result tốt nhất mỗi scene)
10. Lưu kết quả vào `resources.json` với localPath cho mỗi resource

## INPUT PARAMETERS

### Required
- **`--projectDir`**: Đường dẫn đến folder chứa script.json (bắt buộc)

### Search Options
- **`--resultsPerQuery`**: Số lượng results mỗi query (default: 3, max: 80)
- **`--preferredSource`**: API ưu tiên "pexels" hoặc "pixabay" (default: pexels)
- **`--enableAI`**: Bật AI image generation (default: true nếu có GEMINI_API_KEY)
- **`--noAI`**: Tắt AI image generation (chỉ dùng stock)

### Download Options (v1.1)
- **`--download`**: Bật download (default: true)
- **`--skipDownload`**: Tắt download, chỉ lấy URLs
- **`--quality`**: Chọn quality: best | hd | sd | medium (default: best)
  - `best`: Video 4K > HD, Image original > large
  - `hd`: Video HD, Image large
  - `sd`: Video SD, Image medium
- **`--downloadCount`**: Số results tải mỗi scene (default: 1)
- **`--concurrency`**: Số download song song (default: 3)
- **`--storage`**: Loại storage: local | cloud (default: local, cloud cho tương lai)

### Environment Variables (.env)
```bash
# Stock Resources
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key

# AI Image Generation (optional but recommended)
GEMINI_API_KEY=your_gemini_api_key
```

**Lưu ý:** GEMINI_API_KEY có thể đặt ở:
- File `.env` ở root project
- File `.env` trong thư mục skill

## OUTPUT STRUCTURE

File `resources.json` được lưu trong `projectDir`:

```json
{
  "projectName": "tai-sao-ngu-8-tieng-van-met",
  "generatedAt": "2026-01-24T20:00:00Z",
  "apiSources": {
    "pexels": { "used": true, "requestCount": 5 },
    "pixabay": { "used": true, "requestCount": 3 },
    "gemini": { "used": true, "requestCount": 2, "description": "AI image generation" }
  },
  "downloadSummary": {
    "enabled": true,
    "totalDownloaded": 7,
    "totalFailed": 0,
    "totalSkipped": 14,
    "storageLocation": "/path/to/project/downloads",
    "storageType": "local",
    "qualityPreference": "best"
  },
  "summary": {
    "totalVideos": 15,
    "totalImages": 6,
    "totalGeneratedImages": 2,
    "totalMusic": 6,
    "totalSoundEffects": 9,
    "totalScenes": 7,
    "successfulQueries": 9,
    "failedQueries": 0
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
    "generatedImages": [
      {
        "sceneId": "concept",
        "query": "brain illustration showing neural connections",
        "source": "gemini-ai",
        "type": "ai-generated",
        "results": [
          {
            "id": "gemini-concept-1706284800000",
            "title": "AI Generated: brain illustration",
            "localPath": "/projects/my-video/generated/concept_ai.png",
            "prompt": "brain illustration showing neural connections...",
            "source": "gemini-nano-banana",
            "generated": true,
            "license": "AI Generated"
          }
        ]
      }
    ],
    "music": [...],
    "soundEffects": [...]
  },
  "errors": []
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
      "localPath": "/path/to/project/downloads/videos/hook_pexels-12345.mp4",
      "publicUrl": null,
      "downloadStatus": "success",
      "downloadedQuality": "4k",
      "fileSize": 15728640,
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

#### AI Generated Images (NEW)
```json
{
  "sceneId": "metaphor",
  "sceneText": "Imagine your mind as a garden...",
  "query": "surreal garden inside a human brain, illustration",
  "source": "gemini-ai",
  "type": "ai-generated",
  "results": [
    {
      "id": "gemini-metaphor-1706284800000",
      "title": "AI Generated: surreal garden inside brain",
      "localPath": "/projects/video/generated/metaphor_ai.png",
      "prompt": "surreal garden inside a human brain, illustration...",
      "source": "gemini-nano-banana",
      "generated": true,
      "license": "AI Generated (usage follows Gemini Terms of Service)",
      "rank": 1
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

### 3. Gemini API Key (cho AI Image Generation)

**Lấy key miễn phí:**
1. Truy cập: https://aistudio.google.com/apikey
2. Đăng nhập Google account
3. Click "Create API key"
4. Copy API Key

**Model sử dụng:** Gemini 2.0 Flash (Imagen 3)
- Hỗ trợ image generation chất lượng cao
- Free tier có rate limit

### 4. Tạo file .env

Copy `.env.example` thành `.env`:

```bash
cd .claude/skills/video-resource-finder
cp .env.example .env
```

Hoặc thêm vào file `.env` ở root project:

```bash
# Stock Resources
PEXELS_API_KEY=abc123xyz...
PIXABAY_API_KEY=def456uvw...

# AI Image Generation
GEMINI_API_KEY=AIza...your_gemini_key...
```

## USAGE EXAMPLES

### Example 1: Basic Usage (với download mặc định)

```bash
cd .claude/skills/video-resource-finder

# Install dependencies (first time only)
npm install

# Run skill - mặc định sẽ download với quality=best, 1 result mỗi scene
node scripts/find-resources.js \
  --projectDir "../../public/projects/tai-sao-ngu-8-tieng-van-met"
```

**Output:**
```
📥 Download: enabled
   Quality: best, Count per scene: 1

✅ Found 15 videos, 6 images, 6 music tracks, 9 sound effects
📥 Downloaded: 7 files to downloads/
📄 resources.json saved to: public/projects/tai-sao-ngu-8-tieng-van-met/resources.json
```

### Example 2: Chỉ lấy URLs (không download)

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --skipDownload
```

Sẽ chỉ trả về URLs trong resources.json, không tải files về.

### Example 3: Tùy chỉnh số lượng results và download

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --resultsPerQuery 5 \
  --downloadCount 2 \
  --quality hd
```

- Search 5 results mỗi query
- Download 2 results tốt nhất mỗi scene
- Ưu tiên quality HD (thay vì 4K)

### Example 5: Ưu tiên Pixabay

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --preferredSource "pixabay"
```

Sẽ search Pixabay trước, Pexels làm fallback.

### Example 6: Với AI Image Generation

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/creative-story" \
  --enableAI
```

Scenes với `type: "ai-generated"` sẽ được generate bằng Gemini.
Stock search không có kết quả sẽ fallback sang AI.

### Example 7: Tắt AI Generation

```bash
node scripts/find-resources.js \
  --projectDir "../../public/projects/my-project" \
  --noAI
```

Chỉ dùng stock resources, bỏ qua AI generation.

## ADD MUSIC TO PROJECT (NEW)

Script riêng để tìm và thêm nhạc nền vào project đã có sẵn.

### Tại sao cần script riêng?

- Pixabay Music API không hỗ trợ tìm kiếm trực tiếp
- Script này dùng PixabayScraper (Puppeteer) để tìm và tải nhạc thực sự
- Tự động cập nhật resources.json và project.otio

### Cách sử dụng

```bash
# Cơ bản - tự động đọc music query từ script.json
node scripts/add-music-to-project.js \
  --projectDir "../../public/projects/my-project"

# Custom query
node scripts/add-music-to-project.js \
  --projectDir "../../public/projects/my-project" \
  --query "epic cinematic"

# Cập nhật cả OTIO timeline
node scripts/add-music-to-project.js \
  --projectDir "../../public/projects/my-project" \
  --updateOtio

# Ghi đè file nhạc đã có
node scripts/add-music-to-project.js \
  --projectDir "../../public/projects/my-project" \
  --force
```

### Options

| Option | Default | Mô tả |
|--------|---------|-------|
| `--projectDir` | (required) | Đường dẫn đến thư mục project |
| `--query` | từ script.json | Custom music search query |
| `--limit` | 3 | Số lượng kết quả tìm kiếm |
| `--outputFile` | background-music.mp3 | Tên file output |
| `--updateOtio` | false | Cập nhật project.otio với music track |
| `--force` | false | Ghi đè file nhạc đã có |

### Output

```
public/projects/my-project/
├── audio/
│   └── background-music.mp3    ← File nhạc tải về
├── resources.json              ← Cập nhật với music info
└── project.otio                ← (nếu --updateOtio) Thêm Music track
```

### Music Query Tips

Script sử dụng 3 từ đầu tiên của query để tìm kiếm. Nên dùng các từ khóa:

| Mood | Query gợi ý |
|------|-------------|
| Calm | `piano ambient calm` |
| Epic | `epic cinematic orchestral` |
| Happy | `upbeat happy cheerful` |
| Sad | `emotional piano melancholy` |
| Inspiring | `motivational inspiring corporate` |

## CONVERSATION FLOW

### Flow 1: Simple Flow (Đã có script.json)

```
User: "Tìm resources cho video tai-sao-ngu-8-tieng-van-met"