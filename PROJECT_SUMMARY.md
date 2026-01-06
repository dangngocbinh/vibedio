# Project Summary - Auto Video Generator

## Tổng quan

Đã xây dựng hoàn chỉnh một hệ thống tạo video tự động từ text input với các tính năng:

1. **Text-to-Speech** (ElevenLabs + dynamic providers)
2. **AI Content Analysis** (OpenAI GPT-4) - phân tích text, tạo scenes
3. **Multi-platform Image Search** (Unsplash, Pexels, Pixabay)
4. **AI Image Selection** - chọn hình phù hợp nhất
5. **Speech-to-Text** (Deepgram) - tạo word-level timestamps
6. **Remotion Components**:
   - AnimatedImage (zoom, pan, ken-burns effects)
   - TikTokCaption (word-by-word highlighting)
   - Subtitle (traditional subtitles)
7. **Remotion Studio Integration** - editable props, real-time preview
8. **Multiple Video Formats** - vertical, landscape, square

## Cấu trúc Files

```
remotion-test/
├── .env.example              # API keys template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── remotion.config.ts       # Remotion configuration
│
├── README.md                # Main documentation
├── QUICKSTART.md            # Quick start guide
├── DEVELOPERS.md            # Developer guide
├── PROJECT_SUMMARY.md       # This file
│
├── public/                  # Public assets
│   ├── audio/              # Generated audio files
│   ├── images/             # Downloaded images
│   │   └── downloaded/     # Auto-downloaded from APIs
│   ├── video/              # Video assets
│   ├── videos/             # Video assets
│   └── generated/          # Generated JSON data
│
└── src/
    ├── index.ts            # Remotion entry point
    ├── Root.tsx            # Remotion root (compositions)
    │
    ├── types/
    │   └── index.ts        # TypeScript interfaces
    │
    ├── components/         # Remotion components
    │   ├── AnimatedImage.tsx
    │   ├── TikTokCaption.tsx
    │   └── Subtitle.tsx
    │
    ├── compositions/       # Remotion compositions
    │   └── VideoComposition.tsx
    │
    ├── services/           # External API integrations
    │   ├── tts/
    │   │   ├── elevenlabs.ts
    │   │   └── index.ts   # TTS factory
    │   ├── image-search/
    │   │   ├── unsplash.ts
    │   │   ├── pexels.ts
    │   │   ├── pixabay.ts
    │   │   └── index.ts   # Search aggregator
    │   ├── ai-agent/
    │   │   └── content-analyzer.ts
    │   └── stt/
    │       └── speech-to-text.ts
    │
    ├── utils/
    │   ├── config.ts              # Environment config
    │   ├── video-generator.ts     # Main orchestrator
    │   ├── download-images.ts     # Image downloader
    │   └── animation-selector.ts  # Smart animation selection
    │
    ├── hooks/
    │   └── use-video-data.ts     # React hooks for data loading
    │
    └── cli/
        └── generate-video.ts     # CLI tool
```

## Workflow

```
1. User Input (Text)
   ↓
2. AI Content Analysis (GPT-4)
   - Phân tích thành 3-7 scenes
   - Extract keywords
   - Suggest animations
   - Generate image queries
   ↓
3. Parallel Processing:
   ├─ Text-to-Speech (ElevenLabs)
   │  └─ Generate audio file
   │
   ├─ Image Search (3 platforms)
   │  ├─ Unsplash API
   │  ├─ Pexels API
   │  └─ Pixabay API
   │  └─ AI selects best image per scene
   │
   └─ Speech-to-Text (Deepgram)
      └─ Generate word timestamps for captions
   ↓
4. Remotion Render
   - Combine all assets
   - Apply animations
   - Add TikTok captions
   - Export video
```

## API Services

| Service | Purpose | Free Tier | Status |
|---------|---------|-----------|--------|
| ElevenLabs | Text-to-Speech | 10k chars/month | ✅ Implemented |
| Unsplash | Image Search | 50 req/hour | ✅ Implemented |
| Pexels | Image Search | 200 req/hour | ✅ Implemented |
| Pixabay | Image Search | 100 req/min | ✅ Implemented |
| OpenAI | Content Analysis | Paid ($0.01/1k tokens) | ✅ Implemented |
| Deepgram | Speech-to-Text | 45k minutes free | ✅ Implemented |

## Components

### 1. AnimatedImage
- **Props**: `src`, `animation`, `durationInFrames`
- **Features**:
  - Zoom-in, zoom-out
  - Pan-left, pan-right
  - Ken-burns effect
  - Smooth fade in/out
  - Configurable intensity

### 2. TikTokCaption
- **Props**: `words`, `style`
- **Features**:
  - Word-by-word highlighting
  - Scale animation on active word
  - Customizable colors, fonts
  - Position: top/center/bottom
  - Stroke/shadow effects

### 3. Subtitle
- **Props**: `text`, `startTime`, `endTime`, `style`
- **Features**:
  - Traditional subtitle display
  - Timed appearance/disappearance
  - Customizable styling

### 4. VideoComposition
- **Main composition** combining all elements
- **Editable in Remotion Studio**
- **Supports 3 aspect ratios**:
  - 1080x1920 (vertical)
  - 1920x1080 (landscape)
  - 1080x1080 (square)

## Usage

### Method 1: Remotion Studio (Visual)
```bash
npm start
```
- Edit props visually
- Real-time preview
- Export when ready

### Method 2: CLI (Automated)
```bash
npm run generate "Your text here"
```
- Fully automated
- Generates JSON data
- Load in Studio for preview

### Method 3: Direct Render
```bash
npm run build
npm run build:landscape
npm run build:square
```

## Customization Points

### 1. Animation Effects
File: `src/components/AnimatedImage.tsx`
- Add new animation types
- Modify existing effects
- Adjust timing/easing

### 2. Caption Styles
File: `src/components/TikTokCaption.tsx`
- Change font styles
- Modify highlighting behavior
- Adjust positioning

### 3. AI Prompts
File: `src/services/ai-agent/content-analyzer.ts`
- Modify scene analysis logic
- Change keyword extraction
- Adjust tone detection

### 4. Image Selection
File: `src/services/ai-agent/content-analyzer.ts`
- Change selection criteria
- Add new image sources
- Implement custom scoring

## Environment Variables

Required `.env` variables:

```bash
# TTS
ELEVENLABS_API_KEY=sk_xxxxx

# Images
UNSPLASH_ACCESS_KEY=xxxxx
PEXELS_API_KEY=xxxxx
PIXABAY_API_KEY=xxxxx

# AI
OPENAI_API_KEY=sk-xxxxx

# STT
DEEPGRAM_API_KEY=xxxxx
```

## NPM Scripts

```json
{
  "start": "remotion studio",
  "build": "remotion render AutoVideo output.mp4",
  "build:landscape": "remotion render AutoVideoLandscape output-landscape.mp4",
  "build:square": "remotion render AutoVideoSquare output-square.mp4",
  "generate": "ts-node src/cli/generate-video.ts",
  "upgrade": "remotion upgrade"
}
```

## Extension Ideas

1. **Add more TTS providers**:
   - Google Cloud TTS
   - Azure Cognitive Services
   - Amazon Polly

2. **Add more image sources**:
   - Shutterstock
   - Getty Images
   - Custom image libraries

3. **Advanced animations**:
   - 3D transforms
   - Particle effects
   - Transition effects between scenes

4. **Caption variations**:
   - Netflix-style
   - YouTube-style
   - Karaoke-style

5. **Background music**:
   - Auto music selection based on tone
   - Volume ducking for voice-over
   - Beat-synced transitions

6. **Video templates**:
   - Pre-designed layouts
   - Brand templates
   - Industry-specific themes

## Performance Notes

- **Cache generated data** to avoid redundant API calls
- **Pre-download images** to avoid CORS issues
- **Parallel processing** for image search (3 APIs simultaneously)
- **Fallback mechanisms** if APIs fail
- **Rate limiting** respect API quotas

## Known Limitations

1. **API Costs**: OpenAI charges per token, watch usage
2. **Rate Limits**: Free tiers have request limits
3. **Audio Duration**: TTS has character limits
4. **Image Quality**: Depends on search results
5. **Render Time**: Long videos take time to render

## Next Steps

1. **Testing**: Add unit tests, integration tests
2. **Error Handling**: More robust error handling
3. **Caching**: Implement Redis for API response caching
4. **Queue System**: For batch video generation
5. **Web UI**: Build web interface (not just CLI/Studio)
6. **Analytics**: Track usage, success rates
7. **Templates**: Pre-built video templates
8. **Localization**: Multi-language support

## Credits

- **Remotion**: Video rendering framework
- **ElevenLabs**: Text-to-Speech
- **OpenAI**: Content analysis
- **Deepgram**: Speech-to-Text
- **Unsplash/Pexels/Pixabay**: Image APIs
