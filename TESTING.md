# Testing Guide

## Cách test project mà không cần API keys

Nếu chưa có API keys, bạn vẫn có thể test project bằng cách:

### 1. Test Animation Showcase

```bash
npm install
npm start
```

Trong Remotion Studio:
- Chọn composition **"AnimationShowcase"**
- Preview để xem tất cả animation effects
- Không cần API keys

### 2. Test với Default Data

```bash
npm start
```

Chọn **"AutoVideo"** composition:
- Đã có default props sẵn
- Preview được ngay
- Chỉnh style trong Props panel
- Không cần API calls

### 3. Test từng Component riêng lẻ

#### Test AnimatedImage

Tạo file `src/test-compositions/TestAnimatedImage.tsx`:

```typescript
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedImage } from '../components/AnimatedImage';

export const TestAnimatedImage: React.FC = () => {
  return (
    <AbsoluteFill>
      <AnimatedImage
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
        animation={{ type: 'zoom-in', duration: 5, intensity: 0.3 }}
        durationInFrames={150}
      />
    </AbsoluteFill>
  );
};
```

#### Test TikTokCaption

```typescript
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TikTokCaption } from '../components/TikTokCaption';

export const TestCaption: React.FC = () => {
  const words = [
    { word: 'Hello', start: 0, end: 0.5, confidence: 1 },
    { word: 'World', start: 0.5, end: 1.2, confidence: 1 },
    { word: 'This', start: 1.2, end: 1.6, confidence: 1 },
    { word: 'is', start: 1.6, end: 1.8, confidence: 1 },
    { word: 'a', start: 1.8, end: 1.9, confidence: 1 },
    { word: 'test', start: 1.9, end: 2.5, confidence: 1 },
  ];

  const style = {
    fontFamily: 'Arial',
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom' as const,
    highlightColor: '#FFD700',
    strokeColor: '#000000',
    strokeWidth: 2,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#333' }}>
      <TikTokCaption words={words} style={style} />
    </AbsoluteFill>
  );
};
```

## Test với Mock Data

### 1. Create Mock JSON

Tạo file `public/test-data/sample-video.json`:

```json
{
  "config": {
    "text": "This is a test video",
    "ttsProvider": "elevenlabs",
    "animationStyle": "dynamic",
    "captionStyle": {
      "fontFamily": "Arial",
      "fontSize": 48,
      "color": "#FFFFFF",
      "backgroundColor": "rgba(0, 0, 0, 0.8)",
      "position": "bottom",
      "highlightColor": "#FFD700"
    },
    "transitionType": "auto"
  },
  "sceneAnalysis": {
    "tone": "casual",
    "keywords": ["test", "video"],
    "duration": 10,
    "scenes": [
      {
        "text": "This is a test",
        "keywords": ["test"],
        "startTime": 0,
        "endTime": 5,
        "imageQuery": "technology",
        "suggestedAnimation": {
          "type": "zoom-in",
          "duration": 5,
          "intensity": 0.3
        }
      },
      {
        "text": "video demonstration",
        "keywords": ["video"],
        "startTime": 5,
        "endTime": 10,
        "imageQuery": "creative",
        "suggestedAnimation": {
          "type": "pan-right",
          "duration": 5,
          "intensity": 0.25
        }
      }
    ]
  },
  "audioTimestamp": {
    "words": [
      { "word": "This", "start": 0, "end": 0.3, "confidence": 1 },
      { "word": "is", "start": 0.3, "end": 0.5, "confidence": 1 },
      { "word": "a", "start": 0.5, "end": 0.6, "confidence": 1 },
      { "word": "test", "start": 0.6, "end": 1.0, "confidence": 1 }
    ],
    "duration": 10,
    "audioUrl": "public/audio/sample.mp3"
  },
  "selectedImages": [
    {
      "url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
      "thumbnailUrl": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=200",
      "source": "unsplash",
      "photographer": "Test Artist",
      "relevanceScore": 0.9
    }
  ]
}
```

### 2. Load Mock Data

```typescript
// In VideoComposition or custom component
import mockData from '../../public/test-data/sample-video.json';

export const TestComposition: React.FC = () => {
  return (
    <VideoComposition
      config={mockData.config}
      sceneAnalysis={mockData.sceneAnalysis}
      audioTimestamp={mockData.audioTimestamp}
      selectedImages={mockData.selectedImages}
    />
  );
};
```

## Unit Tests (Optional)

Install testing libraries:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Test Utils

```typescript
// src/utils/__tests__/animation-selector.test.ts
import { animationSelector } from '../animation-selector';

describe('AnimationSelector', () => {
  it('should select pan animation for action keywords', () => {
    const result = animationSelector.selectAnimation(
      ['walk', 'move'],
      'energetic',
      'dynamic',
      5
    );

    expect(['pan-left', 'pan-right']).toContain(result.type);
  });

  it('should select zoom-in for focus keywords', () => {
    const result = animationSelector.selectAnimation(
      ['focus', 'look'],
      'professional',
      'cinematic',
      5
    );

    expect(result.type).toBe('zoom-in');
  });
});
```

### Test Components

```typescript
// src/components/__tests__/TikTokCaption.test.tsx
import { render } from '@testing-library/react';
import { TikTokCaption } from '../TikTokCaption';

describe('TikTokCaption', () => {
  it('should render words', () => {
    const words = [
      { word: 'Hello', start: 0, end: 1, confidence: 1 },
    ];

    const style = {
      fontFamily: 'Arial',
      fontSize: 48,
      color: '#FFF',
      backgroundColor: '#000',
      position: 'bottom' as const,
      highlightColor: '#FFD700',
    };

    const { container } = render(
      <TikTokCaption words={words} style={style} />
    );

    expect(container).toBeTruthy();
  });
});
```

## Integration Tests

### Test Full Workflow (with real APIs)

```typescript
// tests/integration/full-workflow.test.ts
import { videoGenerator } from '../../src/utils/video-generator';
import { VideoConfig } from '../../src/types';

describe('Full Video Generation', () => {
  it('should generate complete video data', async () => {
    const config: VideoConfig = {
      text: 'Test video generation',
      ttsProvider: 'elevenlabs',
      animationStyle: 'dynamic',
      captionStyle: {
        fontFamily: 'Arial',
        fontSize: 48,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'bottom',
        highlightColor: '#FFD700',
      },
      transitionType: 'auto',
    };

    const result = await videoGenerator.generate(config);

    expect(result.sceneAnalysis.scenes.length).toBeGreaterThan(0);
    expect(result.selectedImages.length).toBe(result.sceneAnalysis.scenes.length);
    expect(result.audioTimestamp.words.length).toBeGreaterThan(0);
  }, 60000); // 60s timeout for API calls
});
```

## Performance Tests

```typescript
// tests/performance/render-speed.test.ts
describe('Render Performance', () => {
  it('should render frame in under 100ms', () => {
    const startTime = performance.now();

    // Render a frame
    // ... render logic

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });
});
```

## Visual Regression Tests

Use Remotion's snapshot testing:

```bash
# Generate snapshots
remotion snapshot AutoVideo

# Compare snapshots
remotion snapshot AutoVideo --compare
```

## Manual Testing Checklist

### ✅ Animation Effects
- [ ] Zoom-in works smoothly
- [ ] Zoom-out works smoothly
- [ ] Pan-left works correctly
- [ ] Pan-right works correctly
- [ ] Ken-burns effect is smooth

### ✅ Caption Display
- [ ] Words appear at correct time
- [ ] Highlighted word changes correctly
- [ ] Position (top/center/bottom) works
- [ ] Font size adjustable
- [ ] Colors customizable

### ✅ Remotion Studio
- [ ] Props are editable
- [ ] Preview updates in real-time
- [ ] Render produces correct output
- [ ] All formats work (vertical/landscape/square)

### ✅ API Integration (when keys available)
- [ ] TTS generates audio
- [ ] Image search returns results
- [ ] AI selects appropriate images
- [ ] STT creates accurate timestamps

## Troubleshooting Tests

### "Module not found"
```bash
npm install
```

### "Type errors"
```bash
npx tsc --noEmit
```

### "Render fails"
- Check Remotion logs
- Verify image URLs are accessible
- Check audio file exists

### "Tests timeout"
- Increase Jest timeout
- Mock API calls
- Use smaller test data

## CI/CD Testing

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npx remotion snapshot AutoVideo
```

## Test Coverage

Generate coverage report:

```bash
npm test -- --coverage
```

Target coverage:
- Utils: 80%+
- Components: 70%+
- Services: 60%+ (many rely on external APIs)
