# Gemini Image Generator

Tạo ảnh bằng AI sử dụng Google Gemini API (Imagen 3).

## Cách sử dụng

Khi user yêu cầu tạo ảnh với Gemini, thực hiện các bước sau:

### 1. Kiểm tra GEMINI_API_KEY

Đảm bảo `GEMINI_API_KEY` đã được set trong file `.env` ở root project.

### 2. Tạo ảnh đơn

```bash
cd .claude/skills/gemini-image-generator

node scripts/generate.js \
  --prompt "Mô tả ảnh cần tạo" \
  --outputDir "đường dẫn output" \
  --aspectRatio "16:9"
```

### 3. Tạo chuỗi ảnh (story/slideshow)

Tạo file JSON với các prompt:

```json
{
  "prompts": [
    {"id": "slide1", "prompt": "Mô tả slide 1"},
    {"id": "slide2", "prompt": "Mô tả slide 2"},
    {"id": "slide3", "prompt": "Mô tả slide 3"}
  ],
  "style": "illustration style, consistent colors",
  "outputDir": "./output/story"
}
```

Sau đó chạy:

```bash
node scripts/generate.js --inputFile "path/to/prompts.json"
```

### 4. Tích hợp với video-resource-finder

Trong `script.json`, sử dụng `type: "ai-generated"`:

```json
{
  "scenes": [
    {
      "id": "concept",
      "text": "Nội dung scene",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "Mô tả ảnh cần tạo",
        "style": "illustration"
      }
    }
  ]
}
```

Khi chạy video-resource-finder, scene này sẽ tự động dùng Gemini.

## Aspect Ratios

- `16:9` - Video thumbnails, YouTube
- `9:16` - TikTok, Instagram Stories
- `1:1` - Instagram posts
- `4:3` - Presentations

## Tips

1. **Prompt rõ ràng**: Mô tả chi tiết, bao gồm style, mood, colors
2. **Thêm style**: Sử dụng `--style` để áp dụng style nhất quán
3. **Sequence**: Khi tạo story, thêm style hint để giữ visual consistency

## Xem thêm

Đọc SKILL.md để biết chi tiết: `.claude/skills/gemini-image-generator/SKILL.md`
