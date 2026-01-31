---
name: gemini-image-generator
description: Tạo ảnh minh họa, creative content bằng Google Gemini API. Hỗ trợ tạo chuỗi ảnh (sequence) cho story.
---
# GEMINI IMAGE GENERATOR SKILL

## MỤC ĐÍCH

Tạo ảnh bằng AI sử dụng Google Gemini API (Nano Banana). Skill này phù hợp cho:
- **Illustration/Minh họa** - Ảnh concept, diagram, infographic
- **Creative Content** - Ảnh sáng tạo, abstract, surreal
- **Story Slides** - Tạo chuỗi ảnh liên hoàn cho slideshow/story
- **Custom Visuals** - Khi stock images không phù hợp

## WORKFLOW

```
Prompt → Gemini API (Nano Banana) → Base64 Image → Save to File
```

**Chi tiết:**
1. Nhận prompt mô tả ảnh cần tạo
2. Gọi Gemini API với model `gemini-2.0-flash-exp`
3. Extract image data từ response
4. Save ảnh vào thư mục output (PNG format)
5. Trả về path và metadata

## INPUT PARAMETERS

### CLI Arguments
- **`--prompt`**: Mô tả ảnh cần tạo (required)
- **`--outputDir`**: Thư mục lưu ảnh (default: current directory)
- **`--filename`**: Tên file (default: gemini_[timestamp].png)
- **`--aspectRatio`**: Tỷ lệ khung hình (default: 16:9)

### JSON Input (cho sequence generation)
```json
{
  "prompts": [
    {"id": "slide1", "prompt": "A seed sprouting in soil"},
    {"id": "slide2", "prompt": "A small plant growing"},
    {"id": "slide3", "prompt": "A mature tree with flowers"}
  ],
  "style": "watercolor illustration",
  "outputDir": "./output/story"
}
```

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key
```

## OUTPUT

### Single Image
```json
{
  "success": true,
  "prompt": "A futuristic city at sunset",
  "savedPath": "/output/gemini_1706284800000.png",
  "source": "gemini-nano-banana",
  "mimeType": "image/png"
}
```

### Image Sequence
```json
{
  "success": true,
  "totalImages": 3,
  "results": [
    {
      "id": "slide1",
      "savedPath": "/output/story/slide1.png",
      "prompt": "A seed sprouting...",
      "index": 1,
      "total": 3
    }
  ]
}
```

## API SETUP

### Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com/apikey
2. Đăng nhập Google account
3. Click "Create API key"
4. Copy API Key

### Thêm vào .env

```bash
# Trong file .env ở root project
GEMINI_API_KEY=AIzaSy...your_key_here
```

## USAGE EXAMPLES

### Example 1: Generate Single Image

```bash
cd .claude/skills/gemini-image-generator

node scripts/generate.js \
  --prompt "A peaceful zen garden with cherry blossoms, illustration style" \
  --outputDir "./output"
```

### Example 2: Generate Story Sequence

```bash
node scripts/generate.js \
  --inputFile "./story-prompts.json"
```

Với file `story-prompts.json`:
```json
{
  "prompts": [
    {"id": "opening", "prompt": "An empty classroom at dawn"},
    {"id": "middle", "prompt": "Students entering the classroom"},
    {"id": "ending", "prompt": "A full classroom with happy students"}
  ],
  "style": "anime illustration, soft lighting",
  "outputDir": "./output/classroom-story"
}
```

### Example 3: Sử dụng từ code

```javascript
const GeminiClient = require('./scripts/gemini-client');

const client = new GeminiClient(process.env.GEMINI_API_KEY);

// Single image
const result = await client.generateImage(
  "A futuristic robot in a garden",
  { outputDir: "./output", aspectRatio: "16:9" }
);

// Sequence
const sequence = await client.generateImageSequence([
  { id: "step1", prompt: "Before" },
  { id: "step2", prompt: "During" },
  { id: "step3", prompt: "After" }
], { outputDir: "./output/sequence", style: "minimalist" });
```

## BEST PRACTICES

### Prompt Guidelines

**Good prompts:**
- "A cozy coffee shop interior, warm lighting, illustration style"
- "Brain with neural connections glowing, 3D render, blue color scheme"
- "Person meditating in nature, watercolor painting style"

**Avoid:**
- Vague descriptions: "something cool"
- Too complex: Multiple unrelated elements
- Copyrighted content: Specific brand logos, characters

### Style Consistency

Khi tạo sequence, thêm style hints:
```json
{
  "style": "consistent flat illustration, pastel colors, soft shadows",
  "prompts": [...]
}
```

### Aspect Ratios

- **16:9** - Video thumbnails, YouTube
- **9:16** - TikTok, Instagram Stories
- **1:1** - Instagram posts, thumbnails
- **4:3** - Presentations

## INTEGRATION

### Với video-resource-finder

Skill này được tích hợp sẵn vào `video-resource-finder`:
- Scenes có `type: "ai-generated"` tự động dùng Gemini
- Fallback khi stock search không có kết quả

### Trong script.json

```json
{
  "scenes": [
    {
      "id": "concept",
      "text": "Imagine your mind...",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "abstract brain visualization with glowing neurons",
        "style": "3D render, blue neon"
      }
    }
  ]
}
```

## RATE LIMITS

Gemini API Free Tier:
- 60 requests/minute
- 1500 requests/day

Để tránh rate limit với sequence generation, skill tự động thêm 1 giây delay giữa các requests.

## ERROR HANDLING

| Error | Cause | Solution |
|-------|-------|----------|
| `GEMINI_API_KEY is required` | Key chưa được set | Thêm key vào .env |
| `No image generated` | API không trả về image | Thử lại hoặc đơn giản hóa prompt |
| `Rate limit exceeded` | Quá nhiều requests | Chờ 1 phút rồi thử lại |
| `Content policy violation` | Prompt vi phạm policy | Sửa prompt, tránh nội dung nhạy cảm |

## LICENSE

Images được tạo bằng Gemini AI tuân theo [Google AI Terms of Service](https://ai.google.dev/terms).
