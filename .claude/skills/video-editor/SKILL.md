# VIDEO EDITOR SKILL

## MỤC ĐÍCH

Tạo file OTIO timeline từ outputs của 3 skills upstream:
- video-script-generator → `script.json`
- voice-generation → `voice.mp3` + `voice.json`
- video-resource-finder → `resources.json`

Output: `project.otio` file render được trong Remotion với OtioPlayer.tsx component.

## WORKFLOW

```
public/projects/{project-name}/
├── script.json      (input)
├── voice.json       (input)
├── resources.json   (input)
└── project.otio     (OUTPUT - skill này tạo ra)
```

## SUPPORTED VIDEO TYPES

| Type | Status | Track Structure |
|------|--------|----------------|
| **listicle** | ✅ Implemented | B-Roll + Graphics + Subtitles + Voice + Music |
| **image-slide** | ✅ **NEW** | Images (với effects) + Subtitles + Voice + Music |
| **facts** | 🚧 Planned | Video + Fact Callouts + Subtitles + Voice + Music |
| **motivation** | 🚧 Planned | Cinematic + Quotes + Subtitles + Voice + Music |
| **story** | 🚧 Planned | Narrative + Chapters + Subtitles + Voice + SFX + Music |

### Image-Slide Video Type (NEW)

Dành cho video tạo từ ảnh AI (Gemini) hoặc stock images với:
- **Voice-synced timing** - Ảnh sync chính xác với voice timestamps
- **AI auto-suggest effects** - Zoom, Ken Burns, Slide dựa trên content
- **AI auto-suggest transitions** - Crossfade, Cut, Dissolve dựa trên mood
- **TikTok highlight captions** - Word-by-word highlight

## USAGE

### Basic Usage

```bash
python .claude/skills/video-editor/cli.py public/projects/5-sai-lam-hoc-tieng-anh
```

Output:
```
📂 Project: 5-sai-lam-hoc-tieng-anh
✓ Loaded inputs from projects/5-sai-lam-hoc-tieng-anh
✓ Video type: listicle (60s @ 30fps)
✓ Using ListicleStrategy
✓ Built timeline with 5 track(s)
✓ Saved timeline to: projects/5-sai-lam-hoc-tieng-anh/project.otio

🎬 Timeline generation complete!
   Next: Load 'project.otio' in Remotion Studio
```

### Advanced Options

```bash
# Custom FPS
python .claude/skills/video-editor/cli.py public/projects/my-project --fps 60

# Custom output path
python .claude/skills/video-editor/cli.py public/projects/my-project -o custom.otio

# Validate inputs only (no generation)
python .claude/skills/video-editor/cli.py public/projects/my-project --validate-only

# Verbose mode
python .claude/skills/video-editor/cli.py public/projects/my-project -v
```

## CRITICAL FEATURE: RELATIVE PATHS

🔑 **All paths trong OTIO are relative** để project folder có thể di chuyển:

### Path Examples

```python
# ✅ CORRECT - Relative paths
voice.mp3                           # Same folder as project.otio
../../public/audio/music.mp3        # Shared public assets
https://cdn.pixabay.com/video.mp4   # Remote URLs

# ❌ WRONG - Absolute paths (breaks portability)
/Users/binhpc/code/automation-video/public/projects/my-project/voice.mp3
file:///absolute/path/to/voice.mp3
```

### Why Relative Paths?

✅ Copy `public/projects/my-project/` anywhere → still works
✅ Share project folder với team → paths valid
✅ Move project to production server → no path updates needed

## INPUT REQUIREMENTS

### 1. script.json (Required)

#### For Listicle Type:
```json
{
  "metadata": {
    "projectName": "5-sai-lam-hoc-tieng-anh",
    "videoType": "listicle",
    "duration": 60
  },
  "scenes": [
    {"id": "hook", "startTime": 0, "duration": 5},
    {"id": "item1", "startTime": 5, "duration": 10}
  ],
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#FFD700"
  }
}
```

#### For Image-Slide Type:
```json
{
  "metadata": {
    "projectName": "su-that-ve-meo",
    "videoType": "image-slide",
    "duration": 20
  },
  "scenes": [
    {
      "id": "hook",
      "text": "Bạn có biết mèo ngủ tới 70% cuộc đời?",
      "visualSuggestion": {
        "type": "stock",
        "query": "sleeping cat close up"
      }
    },
    {
      "id": "fact1",
      "text": "Mèo không thể cảm nhận vị ngọt.",
      "visualSuggestion": {
        "type": "ai-generated",
        "prompt": "A cat looking at candy, confused expression"
      }
    }
  ],
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#F4D03F"
  }
}
```

**Required fields:**
- `metadata.videoType` - determines which strategy to use (`listicle`, `image-slide`)
- `metadata.duration` - expected total duration
- `scenes` - array with `id`, `text` (for image-slide)
- `scenes[].visualSuggestion` - optional, for AI effect suggestion

### 2. voice.json (Required)
```json
{
  "text": "Full script text",
  "timestamps": [
    {"word": "5", "start": 0, "end": 0.32},
    {"word": "sai", "start": 0.32, "end": 0.66}
  ]
}
```

**Required fields:**
- `timestamps` - word-level timing for subtitles

### 3. resources.json (Required)
```json
{
  "resources": {
    "videos": [
      {
        "sceneId": "hook",
        "results": [
          {
            "downloadUrls": {"hd": "https://...", "sd": "https://..."}
          }
        ]
      }
    ],
    "music": [
      {
        "results": [{"downloadUrl": "https://..."}]
      }
    ]
  }
}
```

**Required fields:**
- At least one of: `videos`, `images`, `music`, `soundEffects`

## OUTPUT STRUCTURE

### Listicle Timeline (5 tracks)

```
project.otio
├── Track 1: B-Roll (Video)
│   ├── hook.mp4 (5s)
│   ├── [Fade transition 0.5s]
│   ├── item1.mp4 (10s)
│   ├── [Fade transition 0.5s]
│   └── ...
├── Track 2: Item Numbers (Video)
│   ├── ItemNumber #1 component (10s)
│   ├── ItemNumber #2 component (10s)
│   └── ...
├── Track 3: Subtitles (Video)
│   ├── TikTokCaption phrase 1
│   ├── TikTokCaption phrase 2
│   └── ...
├── Track 4: Voice (Audio)
│   └── voice.mp3 (60s)
└── Track 5: Music (Audio)
    └── background-music.mp3 (60s, fade-in 2s)
```

### Image-Slide Timeline (4 tracks) - NEW

```
project.otio
├── Track 1: Images (Video) - Voice-synced timing
│   ├── hook.png (3.1s) [effect: zoom-in, intensity: 0.7]
│   ├── [Crossfade transition 0.5s]
│   ├── fact1.png (2.7s) [effect: ken-burns, intensity: 0.5]
│   ├── [Crossfade transition 0.5s]
│   └── cta.png (0.9s) [effect: zoom-in, intensity: 0.7]
├── Track 2: Subtitles (Video)
│   ├── TikTokCaption "Bạn có biết..."
│   ├── TikTokCaption "mèo ngủ..."
│   └── ...
├── Track 3: Voice (Audio)
│   └── voice.mp3 (synced duration)
└── Track 4: Music (Audio) - Optional
    └── background-music.mp3 (fade-in 2s)
```

**Key Features:**
- Image duration = voice timing (not fixed script duration)
- Effects auto-suggested based on content keywords
- Transitions auto-suggested based on scene mood

## INTEGRATION VỚI REMOTION

### Loading OTIO in Remotion

1. Import timeline in `Root.tsx`:
```typescript
import projectTimeline from '../public/projects/my-project/project.otio';
```

2. Register composition:
```typescript
<Composition
  id="MyVideo"
  component={OtioPlayer}
  durationInFrames={calculateDuration(projectTimeline)}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{timeline: projectTimeline}}
/>
```

3. Render:
```bash
npm run dev  # Preview
npm run render -- MyVideo  # Final render
```

## ERROR HANDLING

### Missing Resources
```
⚠ Scene 'item3' has no video/image resource
→ Fallback: Use previous scene resource or skip
```

### Timing Mismatch
```
⚠ Scene duration mismatch: 58s (expected 60s, diff: 2s)
→ Auto-adjust: Extend last clip duration
```

### Invalid Video Type
```
✗ Error: Unsupported video type 'tutorial'
  Available types: listicle
  Hint: The strategy for 'tutorial' may not be implemented yet
```

## ARCHITECTURE

### Core Components

```
video-editor/
├── cli.py                       # Entry point
├── core/
│   ├── otio_builder.py          # Timeline builder orchestrator
│   └── asset_resolver.py        # Relative path conversion (supports pinned resources)
├── strategies/
│   ├── base_strategy.py         # Abstract strategy class
│   ├── listicle_strategy.py     # Listicle implementation
│   └── image_slide_strategy.py  # Image-slide implementation (NEW)
├── templates/
│   └── subtitle_generator.py    # Subtitle track generation
└── utils/
    ├── json_loader.py           # Input validation
    ├── timing_calculator.py     # Time/frame conversion
    ├── voice_timing_sync.py     # Voice-scene sync (NEW)
    └── effect_suggester.py      # AI effect suggestion (NEW)
```

### Strategy Pattern

Each video type implements `BaseStrategy`:

```python
class ListicleStrategy(BaseStrategy):
    def populate_tracks(self, timeline, script, voice_data, resources):
        # Create 5 tracks specific to listicle format
        pass

class ImageSlideStrategy(BaseStrategy):
    def populate_tracks(self, timeline, script, voice_data, resources):
        # 1. Sync scenes with voice timestamps
        voice_sync = VoiceTimingSync()
        scene_timings = voice_sync.map_scenes_to_voice(scenes, voice_data)

        # 2. Auto-suggest effects and transitions
        effect_suggester = EffectSuggester()
        effects = effect_suggester.suggest_all_effects(scenes)

        # 3. Create image track with voice-synced timing
        # 4. Create subtitle, voice, music tracks
        pass
```

### Effect Suggestion Rules

| Content Keywords | Suggested Effect |
|-----------------|------------------|
| face, portrait, close, detail | `zoom-in` (intensity: 0.7) |
| landscape, scenery, nature, panorama | `ken-burns` (intensity: 0.5) |
| action, move, fast, travel | `slide` (intensity: 0.6) |
| important, highlight, wow | `scale` (intensity: 0.4) |
| (default) | `ken-burns` (intensity: 0.5) |

### Transition Suggestion Rules

| Scene Pattern | Suggested Transition |
|--------------|---------------------|
| hook → item | `cut` (0s) |
| item → item | `crossfade` (0.4s) |
| item → cta | `dissolve` (0.6s) |
| (default) | `crossfade` (0.5s) |

### Asset Resolution Priority

Khi tìm asset cho mỗi scene, `AssetResolver` kiểm tra theo thứ tự:

1. **Pinned resources** (`resources.pinnedResources[]`) — user-provided files/URLs, ưu tiên cao nhất
2. **Videos** (`resources.videos[]`) — stock footage từ Pexels/Pixabay
3. **Images** (`resources.images[]`) — stock images
4. **Generated images** (`generated/{sceneId}_ai.png`) — AI-generated fallback
5. **Placeholder** — component hiển thị "image missing"

Pinned resources hỗ trợ `relativePath`, `localPath`, hoặc `url`. Paths được convert sang relative cho OTIO portability.

## VALIDATION RULES

Before generating timeline:
- ✅ All 3 JSON files exist
- ✅ `script.json` has valid `videoType`
- ✅ `voice.json` has `timestamps` array
- ✅ `resources.json` has at least one resource type (including pinnedResources)
- ✅ Scene durations sum to expected total (±3s tolerance)

## BEST PRACTICES

### 1. Consistent Folder Structure
```
public/projects/
├── video-1/
│   ├── script.json
│   ├── voice.mp3
│   ├── voice.json
│   ├── resources.json
│   └── project.otio
└── video-2/
    └── ...
```

### 2. Run Pipeline in Order
```bash
# 1. Generate script
claude "Create script about X"  # → script.json

# 2. Generate voice
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "..." --outputDir public/projects/my-project  # → voice.mp3, voice.json

# 3. Find resources
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir public/projects/my-project  # → resources.json

# 4. Generate timeline (THIS SKILL)
python .claude/skills/video-editor/cli.py public/projects/my-project  # → project.otio

# 5. Render video
npm run render -- MyVideo  # → final.mp4
```

### 3. Test Portability
```bash
# Copy project to different location
cp -r public/projects/test-project /tmp/test-project

# Timeline should still work
cd /tmp/test-project
# Load project.otio in Remotion → should render correctly
```

## TROUBLESHOOTING

### "Required file not found: script.json"
→ Run video-script-generator skill first

### "Unsupported video type: facts"
→ Only `listicle` implemented currently, other types coming soon

### "No valid URL found in resource"
→ Check resources.json has `downloadUrls` or `downloadUrl` field

### Paths not resolving in Remotion
→ Verify all paths are relative, no absolute `/Users/...` paths

## DEPENDENCIES

```txt
opentimelineio>=0.15.0
pydantic>=2.0.0
requests>=2.31.0
```

Install:
```bash
cd .claude/skills/video-editor
pip install -r requirements.txt
```

## VERSION HISTORY

- v1.2 (2026-01-26): Enhanced Music Support
  - **IMPROVED** `AssetResolver.resolve_music_from_resources()` supports multiple formats:
    - Nested format: `resources.music[].results[].downloadUrl`
    - Flat format: `resources.music[].downloadUrl`
    - Direct URL: `resources.music[].url` or `resources.music[].sourceUrl`
  - Compatible with both `find-resources.js` and `add-music-to-project.js` outputs
  - Music track auto-added when resources.json has music entry

- v1.1 (2026-01-26): Image-Slide Strategy
  - **NEW** `image-slide` video type for AI-generated image videos
  - **NEW** Voice-synced timing (images match voice timestamps)
  - **NEW** AI effect suggestion (zoom, ken-burns, slide)
  - **NEW** AI transition suggestion (crossfade, cut, dissolve)
  - **NEW** `VoiceTimingSync` utility for scene-voice mapping
  - **NEW** `EffectSuggester` utility for rule-based suggestions

- v1.0 (2026-01-24): Initial release
  - Listicle strategy implemented
  - Relative path support
  - Subtitle generation
  - Migration from output/ to public/projects/
