# Architecture - Kiến trúc hệ thống

## Tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO VIDEO GENERATOR                      │
│                                                              │
│  Input: Text → Output: Video with Voice, Images, Captions   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│  User Input  │
│   (Text)     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│    AI Content Analyzer           │
│    (OpenAI GPT-4)                │
│                                  │
│  1. Parse text                   │
│  2. Identify scenes (3-7)        │
│  3. Extract keywords             │
│  4. Determine tone               │
│  5. Suggest animations           │
│  6. Generate image queries       │
└──────┬───────────────────────────┘
       │
       │  SceneAnalysis
       │
       ├─────────────┬─────────────┬──────────────┐
       │             │             │              │
       ▼             ▼             ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│    TTS      │ │  Image   │ │   STT    │ │  Animation   │
│  Service    │ │  Search  │ │ Service  │ │  Selector    │
│             │ │          │ │          │ │              │
│ ElevenLabs  │ │ Unsplash │ │ Deepgram │ │ Smart Logic  │
│             │ │ + Pexels │ │          │ │              │
│             │ │ + Pixabay│ │          │ │              │
└─────┬───────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
      │              │            │               │
      │ Audio        │ Images     │ Timestamps    │ Effects
      │              │            │               │
      └──────────────┴────────────┴───────────────┘
                     │
                     ▼
       ┌─────────────────────────┐
       │   Video Data Object     │
       │                         │
       │  - config               │
       │  - sceneAnalysis        │
       │  - audioTimestamp       │
       │  - selectedImages       │
       └────────┬────────────────┘
                │
                ▼
       ┌─────────────────────────┐
       │   Remotion Renderer     │
       │                         │
       │  Components:            │
       │  - AnimatedImage        │
       │  - TikTokCaption        │
       │  - Subtitle             │
       │  - VideoComposition     │
       └────────┬────────────────┘
                │
                ▼
       ┌─────────────────────────┐
       │    Final Video MP4      │
       │  1080x1920 (vertical)   │
       │  1920x1080 (landscape)  │
       │  1080x1080 (square)     │
       └─────────────────────────┘
```

## Component Architecture

### Layer 1: User Interface

```
┌─────────────────────────────────────┐
│       Remotion Studio UI            │
│                                     │
│  - Text Input                       │
│  - Style Controls                   │
│  - Real-time Preview                │
│  - Render Button                    │
└─────────────────────────────────────┘
```

### Layer 2: Composition Layer

```
┌─────────────────────────────────────┐
│      VideoComposition.tsx           │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Sequence 1: Scene 1       │    │
│  │  - AnimatedImage           │    │
│  │  - TikTokCaption           │    │
│  └────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Sequence 2: Scene 2       │    │
│  │  - AnimatedImage           │    │
│  │  - TikTokCaption           │    │
│  └────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Audio Layer               │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Layer 3: Component Layer

#### AnimatedImage Component

```
┌──────────────────────────────┐
│    AnimatedImage.tsx         │
│                              │
│  Props:                      │
│  - src: string               │
│  - animation: AnimationType  │
│  - durationInFrames: number  │
│                              │
│  Features:                   │
│  - Zoom In/Out               │
│  - Pan Left/Right            │
│  - Ken Burns Effect          │
│  - Fade In/Out               │
│  - Responsive Transform      │
└──────────────────────────────┘
```

#### TikTokCaption Component

```
┌──────────────────────────────┐
│    TikTokCaption.tsx         │
│                              │
│  Props:                      │
│  - words: CaptionWord[]      │
│  - style: CaptionStyle       │
│                              │
│  Features:                   │
│  - Word-level timing         │
│  - Active word highlight     │
│  - Scale animation           │
│  - Customizable styling      │
│  - Position control          │
└──────────────────────────────┘
```

### Layer 4: Service Layer

#### Text-to-Speech Service

```
┌──────────────────────────────┐
│       TTS Service            │
│                              │
│  Factory Pattern:            │
│  ┌────────────────────────┐  │
│  │  ElevenLabsService     │  │
│  │  - textToSpeech()      │  │
│  │  - getVoices()         │  │
│  │  - saveAudioToFile()   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  GoogleTTSService      │  │
│  │  (Future)              │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  AzureTTSService       │  │
│  │  (Future)              │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

#### Image Search Service

```
┌──────────────────────────────┐
│    Image Search Service      │
│                              │
│  ┌────────────────────────┐  │
│  │  UnsplashService       │  │
│  │  - searchImages()      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  PexelsService         │  │
│  │  - searchImages()      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  PixabayService        │  │
│  │  - searchImages()      │  │
│  └────────────────────────┘  │
│                              │
│  Aggregator:                 │
│  - searchAllPlatforms()      │
│  - Parallel requests         │
│  - Combined results          │
└──────────────────────────────┘
```

#### AI Agent Service

```
┌──────────────────────────────┐
│    Content Analyzer          │
│    (AI Agent)                │
│                              │
│  Methods:                    │
│  - analyzeContent()          │
│    → SceneAnalysis           │
│                              │
│  - selectBestImage()         │
│    → ImageSearchResult       │
│                              │
│  Uses:                       │
│  - OpenAI GPT-4              │
│  - JSON mode                 │
│  - Structured output         │
└──────────────────────────────┘
```

#### Speech-to-Text Service

```
┌──────────────────────────────┐
│    STT Service               │
│    (Deepgram)                │
│                              │
│  Methods:                    │
│  - transcribeAudio()         │
│    → AudioTimestamp          │
│                              │
│  - transcribeWithFallback()  │
│    → Fallback timing         │
│                              │
│  Output:                     │
│  - Word-level timestamps     │
│  - Confidence scores         │
│  - Total duration            │
└──────────────────────────────┘
```

### Layer 5: Utility Layer

```
┌──────────────────────────────┐
│    Video Generator           │
│    (Main Orchestrator)       │
│                              │
│  generate(config):           │
│    1. TTS                    │
│    2. Content Analysis       │
│    3. Image Search           │
│    4. Image Selection        │
│    5. STT                    │
│    6. Return VideoData       │
└──────────────────────────────┘

┌──────────────────────────────┐
│    Animation Selector        │
│                              │
│  - selectAnimation()         │
│  - ensureVariety()           │
│  - Smart logic based on:     │
│    - Keywords                │
│    - Tone                    │
│    - Style                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│    Image Downloader          │
│                              │
│  - downloadImage()           │
│  - downloadImages()          │
│  - cleanup()                 │
└──────────────────────────────┘

┌──────────────────────────────┐
│    Config Manager            │
│                              │
│  - Load .env                 │
│  - Validate API keys         │
│  - Export config object      │
└──────────────────────────────┘
```

## Type System

```typescript
// Core Types
VideoConfig {
  text: string
  ttsProvider: 'elevenlabs' | 'google' | 'azure'
  voiceId?: string
  animationStyle: 'cinematic' | 'dynamic' | 'minimal'
  captionStyle: CaptionStyle
  transitionType: 'fade' | 'slide' | 'zoom' | 'auto'
}

SceneAnalysis {
  scenes: Scene[]
  keywords: string[]
  tone: string
  duration: number
}

Scene {
  text: string
  keywords: string[]
  startTime: number
  endTime: number
  suggestedAnimation: AnimationType
  imageQuery: string
}

AudioTimestamp {
  words: CaptionWord[]
  duration: number
  audioUrl: string
}

CaptionWord {
  word: string
  start: number
  end: number
  confidence: number
}

ImageSearchResult {
  url: string
  thumbnailUrl: string
  source: 'unsplash' | 'pexels' | 'pixabay'
  photographer: string
  relevanceScore: number
}
```

## File Structure

```
src/
├── index.ts                   # Entry point
├── Root.tsx                   # Compositions registry
│
├── types/
│   └── index.ts              # TypeScript interfaces
│
├── compositions/
│   ├── VideoComposition.tsx  # Main composition
│   └── ShowcaseComposition.tsx # Animation demo
│
├── components/
│   ├── AnimatedImage.tsx     # Image with effects
│   ├── TikTokCaption.tsx     # Word-by-word caption
│   └── Subtitle.tsx          # Traditional subtitle
│
├── services/
│   ├── tts/
│   │   ├── elevenlabs.ts     # ElevenLabs API
│   │   └── index.ts          # TTS factory
│   ├── image-search/
│   │   ├── unsplash.ts       # Unsplash API
│   │   ├── pexels.ts         # Pexels API
│   │   ├── pixabay.ts        # Pixabay API
│   │   └── index.ts          # Search aggregator
│   ├── ai-agent/
│   │   └── content-analyzer.ts # OpenAI analysis
│   └── stt/
│       └── speech-to-text.ts  # Deepgram STT
│
├── utils/
│   ├── config.ts             # Config manager
│   ├── video-generator.ts    # Main orchestrator
│   ├── animation-selector.ts # Smart animations
│   └── download-images.ts    # Image downloader
│
├── hooks/
│   └── use-video-data.ts     # React hooks
│
└── cli/
    └── generate-video.ts     # CLI tool
```

## Design Patterns

### 1. Factory Pattern
- `TTSServiceFactory`: Create TTS provider instances
- `ImageSearchService`: Aggregate multiple search services

### 2. Strategy Pattern
- `AnimationSelector`: Choose animation based on context
- Different TTS providers with same interface

### 3. Composition Pattern
- `VideoComposition`: Compose multiple Remotion components
- Layer-based rendering

### 4. Service Layer Pattern
- Separate business logic from UI
- API integrations isolated in services

### 5. Configuration Pattern
- Centralized config management
- Environment-based settings

## Performance Optimizations

### 1. Parallel Processing
```typescript
// Search all platforms simultaneously
Promise.all([
  unsplash.searchImages(query),
  pexels.searchImages(query),
  pixabay.searchImages(query),
])
```

### 2. Caching
```typescript
// Cache AI analysis
const cacheKey = `analysis:${hash(text)}`;
if (cache.has(cacheKey)) return cache.get(cacheKey);
```

### 3. Lazy Loading
```typescript
// Only load services when needed
const ttsService = await import('./services/tts');
```

### 4. Resource Management
```typescript
// Cleanup old images
imageDownloader.cleanup(24); // hours
```

## Security Considerations

### 1. API Key Management
- Never commit .env files
- Use environment variables
- Validate keys on startup

### 2. Input Validation
- Sanitize user text input
- Validate URLs
- Check file sizes

### 3. Rate Limiting
- Respect API quotas
- Implement retry logic
- Handle failures gracefully

### 4. Error Handling
- Try-catch around all API calls
- Fallback mechanisms
- User-friendly error messages

## Extensibility

### Easy to Extend:

1. **New TTS Provider**: Add to `services/tts/`
2. **New Image Source**: Add to `services/image-search/`
3. **New Animation**: Add case to `AnimatedImage`
4. **New Caption Style**: Create new component
5. **New AI Model**: Replace in `content-analyzer`

### Extension Points:

```typescript
// Add new animation type
type AnimationType =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'ken-burns'
  | 'your-new-effect'; // ← Add here

// Implement in AnimatedImage.tsx
case 'your-new-effect': {
  // Your implementation
}
```

## Conclusion

Kiến trúc được thiết kế:
- ✅ **Modular**: Dễ thay thế/nâng cấp components
- ✅ **Scalable**: Có thể xử lý nhiều videos
- ✅ **Maintainable**: Code rõ ràng, tách biệt concerns
- ✅ **Extensible**: Dễ dàng thêm features mới
- ✅ **Testable**: Mỗi layer có thể test riêng
