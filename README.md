# Auto Video Generator

Ứng dụng tạo video tự động với voice-over, hình ảnh minh họa, và caption động (TikTok-style).

## Tính năng

- **Text-to-Speech**: Chuyển văn bản thành giọng nói tự nhiên (ElevenLabs)
- **AI Content Analysis**: Phân tích nội dung và chia thành scenes logic
- **Auto Image Search**: Tìm hình ảnh phù hợp từ Unsplash, Pexels, Pixabay
- **Smart Image Selection**: AI chọn hình ảnh phù hợp nhất cho từng cảnh
- **Dynamic Animations**: Zoom, pan, ken-burns effects tự động
- **TikTok-style Captions**: Caption từng từ theo nhịp nói
- **Speech-to-Text**: Tạo timestamps chính xác cho caption

## Cài đặt

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

## Cấu hình API Keys

Mở file `.env` và thêm API keys:

```bash
# Text-to-Speech
ELEVENLABS_API_KEY=your_key_here

# Image Search
UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here
PIXABAY_API_KEY=your_key_here

# AI Agent
OPENAI_API_KEY=your_key_here

# Speech-to-Text
DEEPGRAM_API_KEY=your_key_here
```

### Lấy API Keys miễn phí:

1. **ElevenLabs**: https://elevenlabs.io (10,000 characters/month miễn phí)
2. **Unsplash**: https://unsplash.com/developers (50 requests/hour)
3. **Pexels**: https://www.pexels.com/api (200 requests/hour)
4. **Pixabay**: https://pixabay.com/api/docs (100 requests/minute)
5. **OpenAI**: https://platform.openai.com (cần credit)
6. **Deepgram**: https://deepgram.com (free tier 45,000 minutes)

## Sử dụng

### Cách 1: Remotion Studio (Recommended)

```bash
# Mở Remotion Studio
npm start
```

Trong Studio:
1. Chọn composition "AutoVideo" (vertical), "AutoVideoLandscape", hoặc "AutoVideoSquare"
2. Chỉnh sửa props trong panel bên phải:
   - `text`: Nội dung voice-over
   - `ttsProvider`: Chọn dịch vụ TTS
   - `animationStyle`: Phong cách animation
   - `captionStyle.*`: Tùy chỉnh caption
3. Preview video real-time
4. Render khi hài lòng

### Cách 2: CLI Tool

```bash
# Generate video data từ text
npx ts-node src/cli/generate-video.ts "Nội dung voice-over của bạn"

# Sẽ tạo file JSON trong public/generated/
# Sau đó load file này trong Remotion Studio
```

### Cách 3: Render trực tiếp

```bash
# Render video (sau khi đã generate data)
npx remotion render AutoVideo output.mp4
```

## Cấu trúc Project

```
src/
├── compositions/          # Remotion compositions
│   └── VideoComposition.tsx
├── components/           # Remotion components
│   ├── AnimatedImage.tsx
│   ├── TikTokCaption.tsx
│   └── Subtitle.tsx
├── services/             # API integrations
│   ├── tts/              # Text-to-Speech
│   ├── image-search/     # Image APIs
│   ├── ai-agent/         # Content analysis
│   └── stt/              # Speech-to-Text
├── utils/
│   ├── config.ts         # Environment config
│   └── video-generator.ts # Main orchestrator
├── types/                # TypeScript types
└── cli/                  # CLI tools
```

## Workflow

```
Text Input
  ↓
1. AI Content Analysis
   - Phân tích nội dung
   - Chia thành scenes (3-7 scenes)
   - Extract keywords
   - Đề xuất animations
  ↓
2. Text-to-Speech
   - Generate voice-over
   - Save to public/audio/
  ↓
3. Image Search (Parallel)
   - Unsplash API
   - Pexels API
   - Pixabay API
  ↓
4. AI Image Selection
   - Chọn hình phù hợp nhất cho mỗi scene
  ↓
5. Speech-to-Text
   - Tạo word-level timestamps
   - Dùng cho TikTok caption
  ↓
6. Remotion Render
   - Combine audio + images + captions
   - Apply animations
   - Export video
```

## Customization

### Tùy chỉnh Animation

Sửa file `src/components/AnimatedImage.tsx`:

```typescript
// Thêm animation type mới
case 'custom-effect': {
  const scale = interpolate(progress, [0, 1], [1, 1.5]);
  const rotate = interpolate(progress, [0, 1], [0, 10]);
  return `scale(${scale}) rotate(${rotate}deg)`;
}
```

### Tùy chỉnh Caption Style

Trong Remotion Studio hoặc code, modify `captionStyle`:

```typescript
captionStyle: {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 64,
  color: '#FF6B6B',
  backgroundColor: 'transparent',
  position: 'center',
  highlightColor: '#FFD93D',
  strokeColor: '#000000',
  strokeWidth: 3,
}
```

### Thêm TTS Provider mới

1. Tạo file `src/services/tts/google-tts.ts`
2. Implement class tương tự `ElevenLabsService`
3. Add vào factory trong `src/services/tts/index.ts`

## Video Formats

- **Vertical (TikTok/Reels)**: 1080x1920 - `AutoVideo`
- **Landscape (YouTube)**: 1920x1080 - `AutoVideoLandscape`
- **Square (Instagram)**: 1080x1080 - `AutoVideoSquare`

## Tips & Best Practices

1. **Text Input**:
   - Độ dài 50-200 từ cho video 30-60s
   - Câu văn rõ ràng, dễ hiểu
   - Tránh từ ngữ quá chuyên môn

2. **Animation Style**:
   - `cinematic`: Chậm rãi, smooth (professional content)
   - `dynamic`: Nhanh, năng động (marketing, ads)
   - `minimal`: Tinh tế, ít chuyển động (educational)

3. **Caption Position**:
   - `bottom`: Phổ biến nhất (TikTok, Reels)
   - `top`: Khi có UI elements ở dưới
   - `center`: Content chính yếu tố

4. **Performance**:
   - Cache generated data (JSON files)
   - Reuse cho multiple renders
   - Tránh generate lại nếu chỉ đổi style

## Troubleshooting

### Lỗi "API key missing"
- Check file `.env` đã tạo và có đúng format
- Restart Remotion Studio sau khi thay đổi .env

### Không tìm thấy hình ảnh
- Check API keys còn quota
- Thử keywords đơn giản hơn
- Fallback: dùng placeholder images

### Caption không sync
- Check Deepgram API key
- Fallback sẽ tự động phân bố đều timestamps

## License

MIT

## Contributors

Created with Remotion + AI
