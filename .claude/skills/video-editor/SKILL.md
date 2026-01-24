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
| **facts** | 🚧 Planned | Video + Fact Callouts + Subtitles + Voice + Music |
| **motivation** | 🚧 Planned | Cinematic + Quotes + Subtitles + Voice + Music |
| **story** | 🚧 Planned | Narrative + Chapters + Subtitles + Voice + SFX + Music |

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
```json
{
  "metadata": {
    "projectName": "5-sai-lam-hoc-tieng-anh",
    "videoType": "listicle",
    "duration": 60,
    "fps": 30
  },
  "scenes": [
    {"id": "hook", "startTime": 0, "duration": 5},
    {"id": "item1", "startTime": 5, "duration": 10},
    ...
  ],
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#FFD700"
  }
}
```

**Required fields:**
- `metadata.videoType` - determines which strategy to use
- `metadata.duration` - expected total duration
- `scenes` - array with `id`, `startTime`, `duration`

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
├── cli.py                   # Entry point
├── core/
│   ├── otio_builder.py      # Timeline builder orchestrator
│   └── asset_resolver.py    # Relative path conversion
├── strategies/
│   ├── base_strategy.py     # Abstract strategy class
│   └── listicle_strategy.py # Listicle implementation
├── templates/
│   └── subtitle_generator.py # Subtitle track generation
└── utils/
    ├── json_loader.py       # Input validation
    └── timing_calculator.py # Time/frame conversion
```

### Strategy Pattern

Each video type implements `BaseStrategy`:

```python
class ListicleStrategy(BaseStrategy):
    def populate_tracks(self, timeline, script, voice_data, resources):
        # Create 5 tracks specific to listicle format
        pass
```

## VALIDATION RULES

Before generating timeline:
- ✅ All 3 JSON files exist
- ✅ `script.json` has valid `videoType`
- ✅ `voice.json` has `timestamps` array
- ✅ `resources.json` has at least one resource type
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

- v1.0 (2026-01-24): Initial release
  - Listicle strategy implemented
  - Relative path support
  - Subtitle generation
  - Migration from output/ to public/projects/
