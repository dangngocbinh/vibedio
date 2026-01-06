# Quick Start Guide

## Setup trong 5 phút

### 1. Install Dependencies

```bash
npm install
```

### 2. Tạo API Keys (Free)

Lấy API keys miễn phí từ các service sau:

1. **ElevenLabs** (Text-to-Speech)
   - Đi tới: https://elevenlabs.io
   - Sign up → Settings → API Key
   - Free: 10,000 characters/month

2. **Unsplash** (Images)
   - Đi tới: https://unsplash.com/developers
   - Create App → Copy Access Key
   - Free: 50 requests/hour

3. **Pexels** (Images)
   - Đi tới: https://www.pexels.com/api
   - Request API Key
   - Free: 200 requests/hour

4. **Pixabay** (Images)
   - Đi tới: https://pixabay.com/api/docs
   - Sign up → Get API Key
   - Free: 100 requests/minute

5. **OpenAI** (AI Agent)
   - Đi tới: https://platform.openai.com
   - API Keys → Create new key
   - Cần credit (~$0.10 per video)

6. **Deepgram** (Speech-to-Text)
   - Đi tới: https://deepgram.com
   - Sign up → Console → API Keys
   - Free: 45,000 minutes

### 3. Cấu hình .env

```bash
# Copy example
cp .env.example .env

# Edit .env file và paste API keys
nano .env
```

Paste vào:
```bash
ELEVENLABS_API_KEY=sk_xxxxx
UNSPLASH_ACCESS_KEY=xxxxx
PEXELS_API_KEY=xxxxx
PIXABAY_API_KEY=xxxxx
OPENAI_API_KEY=sk-xxxxx
DEEPGRAM_API_KEY=xxxxx
```

### 4. Start Remotion Studio

```bash
npm start
```

Browser sẽ tự động mở tại http://localhost:3000

## Tạo Video Đầu Tiên

### Option 1: Dùng Remotion Studio (Dễ nhất)

1. Trong Studio, chọn composition **"AutoVideo"**

2. Trong panel **Props** bên phải, sửa:
   ```
   text: "Xin chào! Đây là video đầu tiên của tôi.
          Video này được tạo tự động với AI.
          Rất đơn giản và nhanh chóng!"
   ```

3. Click **Preview** để xem video

4. Chỉnh sửa caption style:
   - `captionStyle.fontSize`: 56
   - `captionStyle.highlightColor`: #FF6B6B
   - `captionStyle.position`: bottom

5. Khi hài lòng, click **Render** để export video

### Option 2: Dùng CLI (Tự động hoàn toàn)

```bash
npm run generate "Xin chào! Đây là video đầu tiên của tôi..."
```

Sau đó:
1. Mở Remotion Studio: `npm start`
2. Load file JSON vừa tạo trong `public/generated/`
3. Preview và render

## Ví dụ Text Input

### Marketing Video (30s)
```
Bạn đang tìm kiếm giải pháp tạo video nhanh chóng?
Đây chính là công cụ bạn cần!
Chỉ cần nhập văn bản, AI sẽ tự động tạo video hoàn chỉnh.
Có giọng đọc tự nhiên, hình ảnh đẹp mắt, và caption sinh động.
Hãy thử ngay hôm nay!
```

### Educational Video (45s)
```
Remotion là framework tạo video bằng React.
Bạn có thể lập trình các hiệu ứng animation phức tạp.
Mỗi component là một React component.
Data-driven, dễ dàng customize và scale.
Hoàn hảo cho việc tạo video tự động từ dữ liệu.
```

### Product Demo (60s)
```
Giới thiệu sản phẩm mới của chúng tôi.
Thiết kế hiện đại, tính năng vượt trội.
Dễ sử dụng cho mọi người.
Giá cả cạnh tranh, chất lượng đảm bảo.
Đặt hàng ngay để nhận ưu đãi đặc biệt.
Miễn phí vận chuyển toàn quốc.
```

## Chọn Animation Style

- **`cinematic`**: Chậm rãi, dramatic (cho content nghiêm túc)
- **`dynamic`**: Năng động, nhanh (cho ads, marketing)
- **`minimal`**: Tinh tế, ít chuyển động (cho giáo dục)

## Video Formats

Chọn composition phù hợp:

- **AutoVideo**: 1080x1920 (TikTok, Instagram Reels)
- **AutoVideoLandscape**: 1920x1080 (YouTube, Facebook)
- **AutoVideoSquare**: 1080x1080 (Instagram Feed)

## Troubleshooting

### "Cannot find module 'remotion'"
```bash
npm install
```

### "API key missing"
- Check file `.env` đã tạo
- Restart Remotion Studio sau khi edit .env

### Video render lỗi
- Check API quotas còn
- Xem logs trong terminal
- Thử với text ngắn hơn trước

## Next Steps

1. Đọc [README.md](./README.md) để hiểu architecture
2. Customize components trong `src/components/`
3. Thêm animation effects mới
4. Tích hợp thêm TTS providers

## Support

- GitHub Issues: [Report bugs](https://github.com/your-repo/issues)
- Documentation: [Full docs](./README.md)
