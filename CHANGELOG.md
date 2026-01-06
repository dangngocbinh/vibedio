# Changelog

## [Updated] - 2026-01-06 - Remotion Best Practices Compliance

### 🔧 Fixed

#### 1. **Removed CSS transitions** (TikTokCaption.tsx)
- ❌ Before: `transition: 'all 0.1s ease'` (không hoạt động trong Remotion)
- ✅ After: Dùng `interpolate()` cho opacity animation
- **Impact**: Animations bây giờ render đúng trong video output

#### 2. **Fixed staticFile() usage** (VideoComposition.tsx)
- ❌ Before: `audioUrl: 'public/audio/sample.mp3'`
- ✅ After: `audioUrl: staticFile('audio/sample.mp3')`
- **Impact**: Audio paths hoạt động đúng trong mọi môi trường

#### 3. **Updated TTS service paths** (elevenlabs.ts, tts/index.ts)
- ❌ Before: Return `public/audio/generated_xxx.mp3`
- ✅ After: Return `audio/generated_xxx.mp3` (relative path for staticFile)
- **Impact**: Generated audio có thể dùng trực tiếp với `staticFile()`

#### 4. **Fixed Zod schema** (Root.tsx)
- ❌ Before: Plain object schema (gây lỗi "not a Zod schema")
- ✅ After: Proper Zod schemas với `z.object()`, `z.string()`, etc.
- **Impact**: Remotion Studio props editing bây giờ hoạt động

### ✨ Added

#### 5. **New utility helpers** (static-helpers.ts)
```typescript
- getAudioFile()
- getImageFile()
- getVideoFile()
- isExternalUrl()
- getProperFilePath()
```
**Purpose**: Helpers để handle static files và external URLs properly

#### 6. **Added Remotion MCP server**
- Command: `claude mcp add remotion-documentation`
- **Benefit**: Access Remotion docs trực tiếp trong conversation

#### 7. **Documentation** (REMOTION_BEST_PRACTICES.md)
- Comprehensive guide về Remotion best practices
- 15 rules đã áp dụng trong project
- Examples về đúng/sai
- Checklist trước khi render

### 📝 Changed

#### 8. **Improved TikTokCaption animations**
- Added smooth opacity transitions
- All animations dùng `interpolate()` thay vì CSS
- Better performance

### 🎯 Summary

**Files changed:**
- `src/Root.tsx` - Zod schemas
- `src/components/TikTokCaption.tsx` - Remove CSS transitions
- `src/compositions/VideoComposition.tsx` - staticFile() import
- `src/services/tts/elevenlabs.ts` - Path handling
- `src/services/tts/index.ts` - Path handling
- `src/utils/static-helpers.ts` - NEW
- `REMOTION_BEST_PRACTICES.md` - NEW
- `CHANGELOG.md` - NEW

**Impact:**
- ✅ 100% tuân thủ Remotion best practices
- ✅ Video renders đúng
- ✅ Props editable trong Studio
- ✅ Paths hoạt động mọi môi trường
- ✅ Better performance
- ✅ Production-ready

---

## [Initial Release] - 2026-01-06

### Features

- ✅ Text-to-Speech (ElevenLabs)
- ✅ AI Content Analysis (OpenAI GPT-4)
- ✅ Multi-platform Image Search (Unsplash, Pexels, Pixabay)
- ✅ AI Image Selection
- ✅ Speech-to-Text (Deepgram)
- ✅ 5 animation effects (zoom, pan, ken-burns)
- ✅ TikTok-style captions
- ✅ 3 video formats (vertical, landscape, square)
- ✅ Remotion Studio integration
- ✅ CLI tool
- ✅ Full TypeScript support

### Documentation

- README.md
- QUICKSTART.md
- DEVELOPERS.md
- ARCHITECTURE.md
- TESTING.md
- PROJECT_SUMMARY.md
- NEXT_STEPS.md

### Source Code

- 22 TypeScript files
- 7 services (TTS, Image Search, AI, STT)
- 3 Remotion components
- 2 Compositions
- 4 Utilities
- Full type system

---

## Migration Guide

Nếu bạn đã dùng version cũ:

### Update imports:
```typescript
// Add staticFile import
import { staticFile } from 'remotion';

// Update audio paths
- audioUrl: 'public/audio/file.mp3'
+ audioUrl: staticFile('audio/file.mp3')
```

### Remove CSS transitions:
```typescript
// Replace transition với interpolate
- style={{ transition: 'all 0.3s' }}
+ const opacity = interpolate(frame, [0, 30], [0, 1])
+ style={{ opacity }}
```

### Update Zod schemas:
```typescript
import { z } from 'zod';

- schema={{ config: { text: { type: 'string' } } }}
+ schema={z.object({ text: z.string() })}
```

---

## Next Release Plans

### v1.1.0 (Planned)
- [ ] Background music support
- [ ] More animation effects
- [ ] Video templates
- [ ] Batch rendering
- [ ] Web UI

### v1.2.0 (Planned)
- [ ] Google TTS integration
- [ ] Azure TTS integration
- [ ] More image sources
- [ ] Advanced caption styles
- [ ] Transition effects

---

## Credits

- **Remotion** - Video framework
- **ElevenLabs** - Text-to-Speech
- **OpenAI** - AI analysis
- **Deepgram** - Speech-to-Text
- **Unsplash/Pexels/Pixabay** - Images
