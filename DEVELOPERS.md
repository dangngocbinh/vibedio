# Developer Guide

Hướng dẫn cho developers muốn customize và extend project.

## Architecture Overview

```
┌─────────────────┐
│   User Input    │
│     (Text)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│    Content Analyzer (AI)    │
│  - Parse text into scenes   │
│  - Extract keywords         │
│  - Suggest animations       │
└────────┬────────────────────┘
         │
         ├──────────┬──────────┐
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │  TTS   │ │ Images │ │  STT   │
    │Service │ │ Search │ │Service │
    └───┬────┘ └───┬────┘ └───┬────┘
        │          │          │
        └──────────┴─────┬────┘
                         ▼
                 ┌────────────────┐
                 │ Remotion Render│
                 │  - Animations  │
                 │  - Captions    │
                 │  - Composition │
                 └────────────────┘
```

## Adding New TTS Provider

### 1. Create Service File

`src/services/tts/azure-tts.ts`:

```typescript
import { TTSOptions } from './elevenlabs';
import { config } from '../../utils/config';

export class AzureTTSService {
  private apiKey: string;
  private region: string;

  constructor(apiKey?: string, region: string = 'eastus') {
    this.apiKey = apiKey || config.azure?.apiKey || '';
    this.region = region;
  }

  async textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
    // Implement Azure TTS API call
    // https://docs.microsoft.com/azure/cognitive-services/speech-service/
    throw new Error('Not implemented');
  }

  async saveAudioToFile(audioBuffer: ArrayBuffer, outputPath: string): Promise<void> {
    // Same as ElevenLabs
  }
}
```

### 2. Update Factory

`src/services/tts/index.ts`:

```typescript
import { AzureTTSService } from './azure-tts';

export type TTSProvider = 'elevenlabs' | 'google' | 'azure';

getService(provider: TTSProvider) {
  switch (provider) {
    case 'azure':
      return new AzureTTSService();
    // ...
  }
}
```

### 3. Update Config

`.env`:
```bash
AZURE_TTS_API_KEY=your_key
AZURE_TTS_REGION=eastus
```

`src/utils/config.ts`:
```typescript
azure: {
  apiKey: process.env.AZURE_TTS_API_KEY || '',
  region: process.env.AZURE_TTS_REGION || 'eastus',
}
```

## Adding New Image Provider

Similar to TTS, create in `src/services/image-search/`:

```typescript
// src/services/image-search/shutterstock.ts
export class ShutterstockService {
  async searchImages(query: string, count: number): Promise<ImageSearchResult[]> {
    // Implement API call
  }
}
```

Then add to `src/services/image-search/index.ts`.

## Custom Animation Effects

### Creating New Animation Type

1. Update type in `src/types/index.ts`:

```typescript
export interface AnimationType {
  type: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'ken-burns' | 'rotate' | 'bounce';
  // ...
}
```

2. Implement in `src/components/AnimatedImage.tsx`:

```typescript
case 'rotate': {
  const rotation = interpolate(progress, [0, 1], [0, 360]);
  const scale = 1 + intensity * 0.2;
  return `rotate(${rotation}deg) scale(${scale})`;
}

case 'bounce': {
  const bounceProgress = Math.sin(progress * Math.PI * 4) * intensity;
  const translateY = bounceProgress * 50;
  return `translateY(${translateY}px)`;
}
```

## Custom Caption Styles

### Creating Caption Variants

Create new component `src/components/SubtitleCaption.tsx`:

```typescript
export const SubtitleCaption: React.FC<CaptionProps> = ({ words, style }) => {
  // Different rendering approach
  // E.g., Netflix-style, YouTube-style, etc.
};
```

Add to composition:

```typescript
import { SubtitleCaption } from '../components/SubtitleCaption';

// In VideoComposition:
{config.captionType === 'subtitle' ? (
  <SubtitleCaption words={audioTimestamp.words} style={config.captionStyle} />
) : (
  <TikTokCaption words={audioTimestamp.words} style={config.captionStyle} />
)}
```

## AI Agent Customization

### Using Different AI Models

`src/services/ai-agent/content-analyzer.ts`:

```typescript
// Use Claude instead of GPT
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: prompt,
  }],
});
```

### Custom Scene Analysis Logic

Override `analyzeContent` method:

```typescript
async analyzeContent(text: string, duration: number): Promise<SceneAnalysis> {
  // Custom logic without AI
  const sentences = this.splitIntoSentences(text);
  const sceneDuration = duration / sentences.length;

  const scenes = sentences.map((sentence, i) => ({
    text: sentence,
    keywords: this.extractKeywords(sentence),
    startTime: i * sceneDuration,
    endTime: (i + 1) * sceneDuration,
    imageQuery: this.generateQuery(sentence),
    suggestedAnimation: this.selectAnimation(sentence),
  }));

  return { scenes, duration, tone: 'casual', keywords: [] };
}
```

## Performance Optimization

### 1. Cache Generated Data

```typescript
// Save to file
const cache = videoGenerator.saveToCache(result);
await fs.writeFile('cache/video-data.json', cache);

// Load from file
const cached = await fs.readFile('cache/video-data.json', 'utf-8');
const data = videoGenerator.generateFromCache(cached);
```

### 2. Parallel Processing

```typescript
// Process multiple scenes in parallel
const imagePromises = scenes.map(scene =>
  imageSearchService.searchAllPlatforms(scene.imageQuery)
);
const allImages = await Promise.all(imagePromises);
```

### 3. Pre-download Images

```typescript
import { imageDownloader } from '../utils/download-images';

// Download all images locally
const localPaths = await imageDownloader.downloadImages(selectedImages);

// Use local paths in composition
selectedImages.forEach((img, i) => {
  img.url = localPaths[i];
});
```

## Testing

### Unit Tests

```typescript
// tests/services/tts.test.ts
import { ElevenLabsService } from '../src/services/tts/elevenlabs';

describe('ElevenLabsService', () => {
  it('should generate speech', async () => {
    const service = new ElevenLabsService('test-key');
    const audio = await service.textToSpeech({ text: 'Hello' });
    expect(audio).toBeInstanceOf(ArrayBuffer);
  });
});
```

### Integration Tests

```typescript
// tests/integration/video-generation.test.ts
import { videoGenerator } from '../src/utils/video-generator';

describe('Video Generation', () => {
  it('should generate complete video data', async () => {
    const config = { /* ... */ };
    const result = await videoGenerator.generate(config);

    expect(result.sceneAnalysis.scenes.length).toBeGreaterThan(0);
    expect(result.selectedImages.length).toBe(result.sceneAnalysis.scenes.length);
    expect(result.audioTimestamp.words.length).toBeGreaterThan(0);
  });
});
```

## Deployment

### Server-side Rendering

```typescript
// server/render.ts
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const bundled = await bundle({
  entryPoint: './src/index.ts',
  webpackOverride: (config) => config,
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: 'AutoVideo',
  inputProps: generatedData,
});

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: 'out/video.mp4',
});
```

### API Endpoint

```typescript
// Express.js example
app.post('/api/generate-video', async (req, res) => {
  const { text, config } = req.body;

  try {
    const videoData = await videoGenerator.generate({ text, ...config });

    // Render video
    const outputPath = await renderVideo(videoData);

    res.json({ success: true, videoUrl: outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Environment Variables

All environment variables:

```bash
# TTS
ELEVENLABS_API_KEY=
GOOGLE_TTS_API_KEY=
AZURE_TTS_API_KEY=
AZURE_TTS_REGION=

# Images
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
SHUTTERSTOCK_API_KEY=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# STT
DEEPGRAM_API_KEY=
ASSEMBLYAI_API_KEY=

# Optional
CACHE_DIR=./cache
OUTPUT_DIR=./out
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Rate Limiting**: Respect API rate limits, implement retry logic
3. **Caching**: Cache generated data to avoid redundant API calls
4. **Validation**: Validate user input before processing
5. **Logging**: Use structured logging for debugging
6. **Security**: Never commit .env file, use environment variables

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Resources

- [Remotion Docs](https://www.remotion.dev/docs)
- [ElevenLabs API](https://docs.elevenlabs.io)
- [OpenAI API](https://platform.openai.com/docs)
- [Deepgram API](https://developers.deepgram.com)
