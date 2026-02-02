---
name: video-editor
description: Tạo và chỉnh sửa file OTIO timeline từ script, voice và resources chuẩn format và best pratice. Hỗ trợ nhiều loại video (listicle, image-slide) và tự động xử lý assets.
---
# VIDEO EDITOR SKILL

## MỤC ĐÍCH

Tạo file OTIO timeline từ outputs của 3 skills upstream:
- video-script-generator → `script.json`
- voice-generation → `voice.mp3 hoặc voice.wav` + `voice.json`
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

---

## 🐍 PYTHON EXECUTION

**Luôn sử dụng `python3` để chạy CLI này.**

### Cách chạy
```bash
# ✅ ĐÚNG - Sử dụng python3
python3 .claude/skills/video-editor/cli.py [args...]

# ✅ ĐÚNG - Direct execution
./.claude/skills/video-editor/cli.py [args...]

# ❌ SAI - Không dùng 'python' (có thể gọi Python 2.x)
python .claude/skills/video-editor/cli.py [args...]
```

**Lý do**: Script này yêu cầu Python 3.x và đã có shebang `#!/usr/bin/env python3`.

---

## SUPPORTED VIDEO TYPES

| Type | Status | Track Structure |
|------|--------|-------------------|
| **listicle** | ✅ Implemented | B-Roll + Graphics + Subtitles + Voice + Music |
| **image-slide** | ✅ Implemented | Images (với effects) + Subtitles + Voice + Music |
| **multi-video-edit** | ✅ **NEW** | Base Videos (embedded audio) + Title Cards + B-roll (smart) + Captions + Music |
| **facts** | 🚧 Planned | Video + Fact Callouts + Subtitles + Voice + Music |
| **motivation** | 🚧 Planned | Cinematic + Quotes + Subtitles + Voice + Music |
| **story** | 🚧 Planned | Narrative + Chapters + Subtitles + Voice + SFX + Music |

### Multi-Video-Edit Type (NEW)

User-provided videos (1 hoặc nhiều MP4 files) được edit với:
- **Embedded audio** - Sử dụng luôn audio gốc của video (đồng bộ tuyệt đối), không tách riêng
- **AI content analysis** - Tự động detect hook, intro, sections, outro
- **Smart B-roll mode** - AI quyết định replace/overlay/skip dựa trên video content
- **Title cards** - Full screen transitions giữa các sections
- **Sync-safe captions** - Reference về sourceVideoId, auto-update khi clip move

### Image-Slide Video Type (NEW)

Dành cho video tạo từ ảnh AI (Gemini) hoặc stock images với:
- **Voice-synced timing** - Ảnh sync chính xác với voice timestamps
- **AI auto-suggest effects** - Zoom, Ken Burns, Slide dựa trên content
- **AI auto-suggest transitions** - Crossfade, Cut, Dissolve dựa trên mood
- **TikTok highlight captions** - Word-by-word highlight

## 📐 RESPONSIVE COMPONENT SCALING (IMPORTANT!)

**TẤT CẢ các overlay components (LayerTitle, LowerThird, CallToAction, FullscreenTitle, Sticker, LayerEffect) đã hỗ trợ RESPONSIVE SCALING tự động.**

### Tại sao quan trọng?

Khi tạo video với các tỷ lệ khác nhau, các element overlay phải scale tự động để:
- **Không bị overflow** - Không bị cắt ra ngoài khung hình
- **Giữ tỷ lệ cân đối** - Không bị méo hoặc quá lớn/nhỏ
- **Dễ đọc** - Font size phù hợp với kích thước video

### Cách hoạt động

Components tự động phát hiện kích thước video và điều chỉnh:

| Video Aspect | Kích thước | Scale Factor | Behavior |
|--------------|-----------|-------------|----------|
| **Landscape (16:9)** | 1920×1080 | ~1.0 | Thiết kế gốc (reference) |
| **Portrait (9:16)** | 1080×1920 | ~0.56 | Thu nhỏ, căn giữa/dưới |
| **Square (1:1)** | 1080×1080 | ~0.56 | Thu nhỏ cân đối |
| **Instagram (4:5)** | 1080×1350 | ~0.65 | Scale trung bình |

### Các thành phần được scale tự động

✅ **Positions** - `bottom`, `left`, `right`, `top` tự động scale
✅ **Font sizes** - `fontSize`, `titleSize`, `subtitleSize` tự động scale  
✅ **Dimensions** - `width`, `height` của Sticker và LayerEffect tự động scale
✅ **Paddings** - Khoảng cách và padding tự động scale
✅ **Max widths** - Chiều rộng tối đa điều chỉnh theo portrait/landscape

## 🔊 AUDIO EFFECTS SUPPORT

Skill video-editor hỗ trợ thêm hiệu ứng âm thanh (SFX) để tăng cảm xúc cho video.

### ⚠️ QUY TẮC QUAN TRỌNG (UPDATED)

Tham khảo tài liệu đầy đủ tại: 👉 **[docs/sfx-guide.md](docs/sfx-guide.md)**

1.  **Đường dẫn (Asset Path):**
    - BẮT BUỘC dùng đường dẫn tuyệt đối bắt đầu bằng `/audio/`.
    - Ví dụ ĐÚNG: `/audio/whoosh.mp3`
    - Ví dụ SAI: `public/audio/whoosh.mp3`, `../../audio/whoosh.mp3`

2.  **Âm lượng (Volume):**
    - BẮT BUỘC đặt metadata `volume: "2.0"` (200%) cho các clip SFX.
    - Lý do: Để âm thanh hiệu ứng nghe rõ trên nền nhạc background.

3.  **Cấu trúc Track:**
    - Không trộn SFX vào track Voice hoặc Music.
    - Nên tách thành các track riêng: `Transition SFX` (cho chuyển cảnh) và `Component SFX` (cho sticker, title).
4.  **Định Vị (Positioning):**
    - Sử dụng `metadata.globalTimelineStart` (tính bằng Giây) để đặt vị trí xuất hiện.
    - `source_range.start_time` phải luôn là `0.0`.

### Code Mẫu (Python OTIO)

```python
sfx_clip = otio.schema.Clip(
    name="SFX: Whoosh",
    metadata={ 
        "volume": "2.0",
        "globalTimelineStart": "5.0" # Position in Seconds
    }, 
    media_reference=otio.schema.ExternalReference(
        target_url="/audio/whoosh.mp3" # Absolute path with /audio/ prefix
    ),
    source_range=otio.opentime.TimeRange(
        start_time=otio.opentime.RationalTime(0.0, fps), # Always 0.0
        duration=otio.opentime.RationalTime(duration, fps)
    )
)
```

### Mapping Gợi Ý

| Component/Action | Suggested SFX |
|------------------|---------------|
| `LayerTitle` (slide/fly) | `/audio/whoosh.mp3` |
| `Sticker` (pop) | `/audio/click.mp3` |
| `FullscreenTitle` | `/audio/transition.mp3` |
| `LayerEffect` (tech) | `/audio/bling1.mp3` |
| `End Screen` | `/audio/finish.mp3` |


### ⚠️ QUAN TRỌNG: Bạn KHÔNG CẦN thay đổi gì!

**❌ KHÔNG CẦN:**
- Đổi `fontSize` cho từng tỷ lệ video
- Thay đổi positions (bottom, left, right)
- Lo lắng về overflow

**✅ CHỈ CẦN:**
- Khai báo `ratio` trong `script.json` metadata
- Sử dụng các props như bình thường (design cho 1920×1080)
- Component tự động scale phù hợp!

### Ví dụ

```json
// script.json
{
  "metadata": {
    "ratio": "9:16",  // ← Chỉ cần khai báo ratio
    "width": 1080,
    "height": 1920
  }
}

// project.otio - Sử dụng props như thiết kế cho 1920×1080
{
  "remotion_component": "LowerThird",
  "props": {
    "title": "SUBSCRIBE NOW",  
    "fontSize": 42,  // ← Không cần thay đổi cho 9:16!
    "template": "breaking-news"
  }
}
```

Component sẽ tự động:
- Scale `fontSize: 42` → `~23.5px` cho video 1080×1920
- Điều chỉnh position để không bị cắt
- Giữ tỷ lệ cân đối

### Tài liệu chi tiết

👉 **[docs/responsive-guide.md](docs/responsive-guide.md)** - Hướng dẫn đầy đủ về responsive system



## �📚 COMPONENTS REFERENCE (Overlays & Effects)

Khi tạo OTIO timeline với overlays (titles, stickers, effects), **BẮT BUỘC** tham khảo:
👉 **`.claude/skills/COMPONENTS_REFERENCE.md`**

Khi làm việc với captions/subtitles, tham khảo:
👉 **`docs/caption-guide.md`** - TikTok Caption themes và best practices

**Thông tin quan trọng:**
- **5 main components**: LayerTitle, Sticker, LayerEffect, LowerThird, FullscreenTitle
- **160+ sticker templates**: lottie-fire, lottie-thumbs-up, heart-red, etc.
- **50+ effect types**: neon-circle, scan-lines, particles, etc.
- **40+ lower third templates**: breaking-news, social-youtube, gaming-glitch, etc.
- **Full props reference** với examples

**Integration trong OTIO:**
```python
# Example: Thêm LayerTitle vào Overlays track
overlay_clip = otio.schema.Clip(
    name="LayerTitle",
    metadata={
        "component": "LayerTitle",
        "props": {
            "title": "Breaking News",
            "style": "lower-third",
            "animation": "slide-up",
            "textColor": "#00ff00"
        }
    },
    source_range=otio.opentime.TimeRange(...)
)
overlay_track.append(overlay_clip)
```

---

## INPUT FILES SCHEMA

### What's Required?

The skill now **auto-populates missing fields** with sensible defaults. You only need:

**Minimum required in `script.json`:**
```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "image-slide",
    "duration": 300
  },
  "scenes": [
    {"id": "scene_1", "text": "Scene 1", "duration": 10, "startTime": 0, "endTime": 10}
  ]
}
```

**Everything else** (voice, music, subtitle, script metadata) will be auto-created with defaults.

### Full Field Reference

See **`SCHEMA.md`** for complete documentation:
- All required fields (metadata, scenes)
- All optional fields with auto-generated defaults
- Validation rules and examples

### Auto-Populated Fields

If these fields are missing, they're created automatically:
- `script` → empty narration metadata
- `voice` → null provider (pre-recorded)
- `music` → disabled by default
- `subtitle` → default theme (clean-minimal, bottom position)
- `metadata.width/height/ratio` → 1920x1080, 16:9

**Benefit**: Minimal configuration for simple projects ✅

## USAGE

### Basic Usage

```bash
python3 .claude/skills/video-editor/cli.py public/projects/5-sai-lam-hoc-tieng-anh
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
python3 .claude/skills/video-editor/cli.py public/projects/my-project --fps 60

# Custom output path
python3 .claude/skills/video-editor/cli.py public/projects/my-project -o custom.otio

# Validate inputs only (no generation)
python3 .claude/skills/video-editor/cli.py public/projects/my-project --validate-only

# Verbose mode
python3 .claude/skills/video-editor/cli.py public/projects/my-project -v
```

## CRITICAL FEATURE: RELATIVE PATHS

🔑 **All paths trong OTIO are relative** để project folder có thể di chuyển:

### Path Examples

```python
# ✅ CORRECT - Relative paths
voice.wav                           # Same folder as project.otio
../../public/audio/music.wav        # Shared public assets
https://cdn.pixabay.com/video.mp4   # Remote URLs

# ❌ WRONG - Absolute paths (breaks portability)
/Users/binhpc/code/automation-video/public/projects/my-project/voice.wav
file:///absolute/path/to/voice.wav
```

### Why Relative Paths?

✅ Copy `public/projects/my-project/` anywhere → still works
✅ Share project folder với team → paths valid
✅ Move project to production server → no path updates needed

## 🛡️ VALIDATION & SAFE SAVE

Skill này áp dụng quy trình **Safe-Save** để bảo vệ project khỏi các lỗi render trong Remotion Studio:

1. **Validation**: Sau khi xử lý logic, script sẽ lưu vào file `.otio.tmp`.
2. **Check Rules**: 
   - Không được có 2 Transitions đứng cạnh nhau.
   - Thời lượng của Transition không được lớn hơn thời lượng của Clip đứng trước/sau nó.
3. **Commit**: Nếu thỏa mãn các quy tắc, file `.tmp` mới được ghi đè vào `project.otio`.

Luôn sử dụng `otio_validator.py` khi viết các script can thiệp vào timeline.

## ⚠️ CRITICAL RULES FOR DEVELOPERS

**Khi modify strategies hoặc tạo timeline logic mới, BẮT BUỘC tuân thủ:**

### Rule 1: NO Consecutive Transitions
```python
# ❌ WRONG - Will crash Remotion
track.append(clip1)
track.append(transition1)
track.append(transition2)  # ERROR: 2 transitions in a row!

# ✅ CORRECT - Transition between clips only
track.append(clip1)
track.append(transition1)
track.append(clip2)
```

**Common Mistake**: Khi thêm nhiều clips cho 1 scene, đừng thêm transition trong vòng lặp clips!

```python
# ❌ WRONG
for clip in clips:
    track.append(clip)
    if should_add_transition:
        track.append(transition)  # Sai! Sẽ tạo nhiều transitions

# ✅ CORRECT
for clip in clips:
    track.append(clip)
# Add transition AFTER all clips of scene
if should_add_transition:
    track.append(transition)
```

### Rule 2: Transition Duration Must Be Smaller Than Adjacent Clips
```python
# ❌ WRONG
clip = create_clip(duration=1.0)  # 1 second clip
transition = create_transition(duration=2.0)  # 2 second transition - TOO LONG!

# ✅ CORRECT
clip = create_clip(duration=5.0)
transition = create_transition(duration=0.5)  # Transition < clip duration
```

### Rule 3: Always Use Safe Save
```python
# ❌ WRONG - Direct save, no validation
otio.adapters.write_to_file(timeline, "project.otio")

# ✅ CORRECT - Validated save
from utils.otio_validator import safe_save_otio
safe_save_otio(timeline, "project.otio")
```

### Rule 4: When Adding Multiple Clips Per Scene
**Problem**: Nếu scene cần nhiều clips (để fill duration), phải cẩn thận với transitions.

**Solution**: Dùng `create_clips_to_fill_duration()` và chỉ thêm transition **SAU** tất cả clips của scene:

```python
# Get multiple clips for scene
clips = self.create_clips_to_fill_duration(
    scene_id=scene_id,
    resources=resources,
    target_duration_sec=duration
)

# Add all clips first
for clip in clips:
    track.append(clip)

# Then add ONE transition between scenes (not between clips)
if should_transition_to_next_scene:
    track.append(transition)
```

**Why?** Remotion's `<TransitionSeries>` expects: `Clip → Transition → Clip`, NOT `Clip → Transition → Transition`.

### Rule 5: Always Use Relative Paths (Never Absolute Paths)
**Problem**: Browser cannot load absolute file paths like `/Users/name/project/video.mp4`.

**Solution**: ALWAYS use relative paths from project directory:

```python
# ❌ WRONG - Absolute path
clip = create_clip_from_url(
    url="/Users/binhpc/code/automation-video/public/projects/my-project/downloads/video.mp4",
    ...
)

# ✅ CORRECT - Relative path
clip = create_clip_from_url(
    url="downloads/videos/video.mp4",  # Relative to project folder
    ...
)
```

**Best Practice**: 
- Use `AssetResolver.sanitize_for_otio()` for ALL local paths
- Prefer local downloaded files over remote URLs
- Remote URLs are OK, but local files are better (faster, portable, offline-friendly)

```python
# Get local path and sanitize it
if 'localPath' in result and result['localPath']:
    # Convert absolute → relative
    relative_path = self.asset_resolver.sanitize_for_otio(result['localPath'])
    urls.append(relative_path)
```

**Why?**
- ✅ Browser can load relative paths via web server
- ✅ Project is portable (works on any machine)
- ✅ Faster (no network requests)
- ✅ Offline-friendly

Luôn sử dụng `otio_validator.py` khi viết các script can thiệp vào timeline.

## INPUT REQUIREMENTS

### 1. script.json (Required)

#### Aspect Ratio Support
`script.json` chứa thông tin `ratio`, `width`, `height` trong `metadata`:
```json
{
  "metadata": {
    "ratio": "9:16",
    "width": 1080,
    "height": 1920
  }
}
```

**Supported ratios**: `9:16` (1080×1920), `16:9` (1920×1080), `1:1` (1080×1080), `4:5` (1080×1350)

Video editor sẽ đọc `metadata.ratio` và ghi vào `project.otio` metadata để OtioPlayer/Remotion render đúng kích thước.

Nếu `ratio` không có trong script.json, mặc định là `9:16` (1080×1920).

#### Short Video Layout (9:16) - Landscape Content Support

For **9:16 Short format** videos (TikTok, Reels, Shorts) using **landscape source content** (16:9 videos/images), the video-editor skill provides an advanced **2-track layout system**.

**The Challenge**: Landscape content doesn't fill a 9:16 vertical frame, leaving empty space on top/bottom.

**The Solution**: Automatic background track creation + smart content positioning + layout presets.

##### Background Track System (Track 0)

When creating 9:16 videos with landscape input, the system automatically creates a **background track** (Track 0 - bottom layer):

```
Track 0: Background          ← Custom video/image OR auto-generated blur/gradient
Track 1: Main Content        ← Landscape content (centered, cropped, or zoomed)
Track 2: Title Overlays
Track 3: Captions
Track 4: Voice (audio)
Track 5: Music (audio)
```

**6 Background Types**:
1. **custom-video** - User-provided background video from `resources.backgroundResources.videos`
2. **custom-image** - User-provided background image from `resources.backgroundResources.images`
3. **blur-original** - Auto-generated blurred version of main content (recommended default)
4. **gradient** - Auto-generated gradient background
5. **solid-color** - Solid color fill (use `metadata.backgroundColor`)
6. **auto** - Smart detection (default)

##### Content Positioning (Track 1)

**4 positioning modes** for main content:
- **centered** (default) - Maintains aspect ratio, centered, max-width 90% (shows background on sides)
- **crop-to-fill** - Smart crop to fill 9:16 frame (no background visible)
- **zoom** - Zoom to fill (may lose quality)
- **ken-burns** - Animated pan+zoom (images only)

##### Layout Presets

**4 layout presets** control text overlay positioning:
- **header-footer** (default) - Main title at top, captions middle, CTA bottom
- **minimal** - Clean aesthetic, captions only at bottom
- **text-heavy** - Multiple text layers staggered (for tips/facts)
- **balanced** - Flexible positioning based on content

##### Safe Zones

Automatically respects platform UI safe zones:
- **Top danger** (0-180px) - Pause/sound/menu buttons
- **Header safe** (180-350px) - Main title area
- **Content zone** (350-1400px) - Video + overlays
- **Footer safe** (1400-1720px) - Descriptions, CTAs
- **Bottom danger** (1720-1920px) - Progress bar
- **Right danger** (920-1080px) - Social icons

##### Configuration

All fields are **optional** with smart auto-detection:

```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "header-footer",        // Layout template
    "backgroundType": "auto",               // Background source (auto-detect)
    "contentPositioning": "centered",       // Main content positioning
    "backgroundColor": "#000000"            // Solid color (if backgroundType: "solid-color")
  },
  "resources": {
    "backgroundResources": {
      "videos": [
        {
          "sceneId": "scene_1",
          "localPath": "backgrounds/animated-pattern.mp4",
          "type": "custom-background"
        }
      ]
    }
  }
}
```

**Minimum configuration** (auto-detection handles rest):
```json
{
  "metadata": {
    "ratio": "9:16"
  }
}
```

See **[docs/short-video-layout-guide.md](docs/short-video-layout-guide.md)** for comprehensive guide with visual examples and best practices.

#### For Listicle Type:
```json
{
  "metadata": {
    "projectName": "5-sai-lam-hoc-tieng-anh",
    "videoType": "listicle",
    "duration": 60,
    "ratio": "9:16",
    "width": 1080,
    "height": 1920
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

### Voice & Subtitle Synchronization (IMPORTANT)

**RULE**: Voice and Subtitle tracks MUST always be perfectly synchronized.
- If the Voice track is delayed/offset (e.g., to start at 2.0s), the Subtitle track MUST be delayed by the exact same amount.
- **Control**: Use `voice.startOffset` in `script.json` to control this. DO NOT hardcode offsets in the code.

**script.json configuration:**
```json
{
  "voice": {
    "enabled": true,
    "startOffset": 2.0  // Delays BOTH voice and subtitles by 2.0 seconds
  }
}
```

**Implementation Logic (in Strategy):**
1. Read `startOffset` from `script.voice`.
2. Insert a `Gap` of `startOffset` duration at the start of **Voice Track**.
3. Insert a `Gap` of `startOffset` duration at the start of **Subtitle Track**.
4. This ensures voice audio and caption visuals remain 1:1 synced.

### Tips for Faster Workflow (Automation)

**1. Smart Intro Sync**
- Just set `voice.startOffset` in `script.json` (e.g. `2.0`).
- The system will **automatically adjust** the duration of your first scene (if it's a Title/Intro) to match this 2.0s perfectly.
- You do NOT need to manually edit the scene duration.

**2. Automatic Text Sync**
- Ensure your scenes in `script.json` have a `"text"` field populated with the corresponding sentence from the script.
- If present, the video clips will automatically stretch/shrink to match the spoken duration of that text.
- This creates instant, semantic synchronization without manual timing.

### Output Track Ordering Policy

Để đảm bảo UI trong Remotion Studio không bị rối (do track Phụ đề thường có rất nhiều clip nhỏ) và Phụ đề luôn hiển thị trên cùng, áp dụng thứ tự sau:

1. **Visual Tracks**: Images, Videos, Title Cards, B-roll.
2. **Audio Tracks**: Voice, Background Music.
3. **Control Tracks**: Trống (nếu có).
4. **Captions/Subtitles**: LUÔN LUÔN ở vị trí cuối cùng trong file OTIO.

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

## LAYER TITLE OVERLAYS

### Overview

LayerTitle component cho phép thêm title overlays vào bất kỳ vị trí nào trong timeline. Sử dụng để tạo:
- **Title hooks** - Thu hút attention ở đầu video
- **Lower-thirds** - Giới thiệu người nói, địa điểm
- **Corner badges** - Status indicators (LIVE, HOT, NEW)
- **Full-screen titles** - Intro/outro, chapter transitions

> **🎯 Responsive Scaling:** Component tự động scale cho mọi tỷ lệ video (16:9, 9:16, 1:1). Sử dụng props như thiết kế cho 1920×1080, không cần điều chỉnh!

### Usage in OTIO

Thêm track "Title Overlays" vào timeline:

```json
{
    "OTIO_SCHEMA": "Track.1",
    "name": "Title Overlays",
    "kind": "Video",
    "children": [
        {
            "OTIO_SCHEMA": "Clip.2",
            "metadata": {
                "remotion_component": "LayerTitle",
                "props": {
                    "title": "Your Title Text",
                    "subtitle": "Optional subtitle",
                    "style": "centered",
                    "animation": "scale",
                    "backgroundColor": "#FFD700",
                    "textColor": "#FF0000",
                    "fontSize": 64
                }
            },
            "name": "Title Hook",
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "duration": { "rate": 30.0, "value": 150.0 },
                "start_time": { "rate": 30.0, "value": 0.0 }
            }
        }
    ]
}
```

### Available Styles

| Style | Position | Use Case |
|-------|----------|----------|
| `centered` | Center screen (90% width, 40% height) | Title hooks, chapter titles |
| `lower-third` | Bottom-left (60% max-width) | Speaker names, locations |
| `corner-badge` | Top-right (compact) | Status tags (LIVE, HOT) |
| `full-screen` | Full screen | Intro/outro screens |

### Available Animations

| Animation | Effect | Best For |
|-----------|--------|----------|
| `scale` | Zoom 0.8 → 1.0 | centered, full-screen |
| `slide-up` | Slide from bottom | lower-third |
| `slide-left` | Slide from right | corner-badge |
| `fade` | Fade in/out | All styles |
| `typewriter` | Type character-by-character | Quotes, captions |

### Props Reference

```typescript
{
  title: string;              // Required: main text
  subtitle?: string;          // Optional: secondary text
  style?: 'centered' | 'lower-third' | 'corner-badge' | 'full-screen';
  animation?: 'scale' | 'slide-up' | 'slide-left' | 'fade' | 'typewriter';
  backgroundColor?: string;   // Default: 'rgba(6, 182, 79, 0.85)'
  textColor?: string;         // Default: '#eb0000ff'
  accentColor?: string;       // Default: '#ffae00ff'
  fontSize?: number;          // Default: 48
  subtitleSize?: number;      // Default: 28
  showAccentLine?: boolean;   // Default: true
  enterDuration?: number;     // Frames for enter animation
  exitDuration?: number;      // Frames for exit animation
  fontFamily?: string;        // Optional: Google Font name
}
```

### Track Order (Important!)

Place "Title Overlays" track **AFTER** "Subtitles" track to display titles on top:

```
1. Images (Video)
2. Subtitles (Video)
3. Title Overlays (Video)  ← Place AFTER Subtitles
4. Voice (Audio)
5. Background Music (Audio)
```

### Example: Title Hook

```json
{
    "metadata": {
        "remotion_component": "LayerTitle",
        "props": {
            "title": "5 SAI LẦM KHI HỌC TIẾNG ANH",
            "style": "centered",
            "animation": "scale",
            "backgroundColor": "#FFD700",
            "textColor": "#FF0000",
            "fontSize": 64
        }
    },
    "source_range": {
        "duration": { "rate": 30, "value": 150 }  // 5 seconds
    }
}
```

### Full Documentation

See [docs/layer-title-guide.md](docs/layer-title-guide.md) for detailed guide with examples.

## FULLSCREEN TITLE

### Overview

FullscreenTitle component tạo title screens chiếm **toàn bộ khung hình** với hình nền đẹp mắt. Sử dụng cho:
- **Intro/Outro** - Màn hình mở đầu/kết thúc video
- **Chapter dividers** - Phân đoạn giữa các phần
- **Quote screens** - Hiển thị quotes nổi bật
- **Transition screens** - Chuyển cảnh có nội dung

### Usage in OTIO

Thêm clip FullscreenTitle vào track "Title Overlays":

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "TOP 10 SỰ THẬT",
            "subtitle": "BẠN CHƯA BAO GIỜ BIẾT",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "textStyle": "bold-shadow",
            "animation": "zoom-fade",
            "titleSize": 120,
            "showParticles": true
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

### Available Templates (NEW)

Now supports **40 named templates** like `cinematic-intro`, `tech-hub`, `neon-night`, `breaking-news-full`, `space-odyssey`, `luxury-gold` etc. to instantly apply professional designs.
See full list in [docs/fullscreen-title-guide.md](docs/fullscreen-title-guide.md).

### Background Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `solid` | Màu đơn sắc | `#FF5733`, `#1a1a2e` |
| `gradient` | Gradient presets | `sunset`, `ocean`, `fire`, `neon`, `dark` |
| `image` | Ảnh nền | `public/images/bg.jpg` |
| `pattern` | Patterns lặp lại | `dots`, `lines`, `grid` |
| `video-blur` | Blur video phía dưới | `blur-20` |

### Text Styles

| Style | Effect | Best For |
|-------|--------|----------|
| `bold-shadow` | Chữ đậm + bóng đổ mạnh | Default, nổi bật |
| `glow` | Chữ phát sáng | Gaming, tech, neon |
| `outline` | Viền chữ không fill | Modern, clean |
| `3d` | Hiệu ứng 3D layers | Eye-catching, retro |
| `minimal` | Đơn giản | Professional, elegant |
| `gradient-text` | Gradient trên chữ | Trendy, colorful |

### Animations

| Animation | Effect | Use Case |
|-----------|--------|----------|
| `zoom-fade` | Zoom + fade in | Default, versatile |
| `slide-up-bounce` | Trượt lên + bounce | Energetic |
| `reveal-left` | Lộ từ trái | Professional |
| `blur-in` | Blur → sharp | Cinematic |
| `typewriter` | Gõ từng chữ | Storytelling |
| `glitch` | Hiệu ứng nhiễu | Tech, gaming |
| `split` | Tách rồi nhập | Creative |

### Props Reference

```typescript
{
  // Content
  title: string;              // Required: main title
  subtitle?: string;          // Optional: subtitle

  // Background
  backgroundType?: 'solid' | 'gradient' | 'image' | 'pattern' | 'video-blur';
  backgroundValue?: string;   // Color/preset/path
  backgroundOverlay?: string; // Overlay color (e.g., 'rgba(0,0,0,0.5)')

  // Text
  textStyle?: 'bold-shadow' | 'glow' | 'outline' | '3d' | 'minimal' | 'gradient-text';
  textColor?: string;         // Default: '#ffffff'
  accentColor?: string;       // Default: '#00d4ff'
  titleSize?: number;         // Default: 96
  subtitleSize?: number;      // Default: 36
  fontFamily?: string;        // Default: 'Inter, Montserrat, system-ui'

  // Position
  verticalAlign?: 'top' | 'center' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
  padding?: number;           // Default: 60

  // Animation
  animation?: string;         // See animations table
  enterDuration?: number;     // Frames for enter
  exitDuration?: number;      // Frames for exit

  // Effects
  showParticles?: boolean;    // Default: false
  showVignette?: boolean;     // Default: true
  animateBackground?: boolean; // Default: true (subtle rotation/zoom)
}
```

### Example: Intro Screen

```json
{
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "BÍ MẬT VŨ TRỤ",
            "subtitle": "KHÁM PHÁ NHỮNG ĐIỀU CHƯA BIẾT",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "textStyle": "bold-shadow",
            "animation": "zoom-fade",
            "titleSize": 120,
            "showParticles": true,
            "showVignette": true
        }
    },
    "source_range": {
        "duration": { "rate": 30, "value": 150 }  // 5 seconds
    }
}
```

### Comparison: LayerTitle vs FullscreenTitle

| Feature | LayerTitle | FullscreenTitle |
|---------|------------|-----------------|
| Coverage | Partial overlay | Full screen |
| Background | Solid color only | Gradient, image, pattern |
| Font size | 48px (default) | 96px (default) |
| Use case | Overlay on video | Intro, outro, chapters |
| Text effects | Basic | Advanced (glow, 3D, outline) |
| Particles | No | Yes |
| Background animation | No | Yes (subtle rotation/zoom) |
| zIndex | 100 | 1000 |

### Full Documentation

See [docs/fullscreen-title-guide.md](docs/fullscreen-title-guide.md) for detailed guide with gradient presets, design tips, and examples.

## LOWER THIRD TEMPLATES

### Overview

`LowerThird` component cung cấp **40 mẫu** tiêu đề ở phần dưới màn hình (lower-thirds) được thiết kế chuyên nghiệp và đa dạng phù hợp cho nhiều loại video:
- **Speaker ID** - Giới thiệu tên và chức danh người đang nói
- **Social Media** - Hiển thị YouTube, Instagram, TikTok handles
- **Broadcast/News** - Mẫu tin tức, thể thao, Breaking News
- **Special Effects** - Gaming Glitch, Cyberpunk, Hologram, Liquid
- **Elegant** - Luxury Gold, Wedding, Elegant Serif
- **Context Info** - Tech Grid, Industrial Steel, Blueprint

> **🎯 Responsive Scaling:** Tất cả 40 templates tự động scale cho video dọc/vuông/ngang. Không cần thay đổi `fontSize` hay positions!

### Available Templates

| Group | Templates |
|-------|-----------|
| **Modern & Basic** | `modern-skew`, `minimal-bold`, `playful-round`, `corporate-clean` |
| **Elegant & Luxury**| `elegant-serif`, `luxury-gold`, `wedding-floral`, `glass-modern` |
| **Broadcast & News**| `breaking-news`, `classic-tv`, `sports-ticker`, `documentary-sidebar` |
| **Social Media** | `social-youtube`, `social-insta`, `ribbon-tag` |
| **Creative Arts** | `hand-drawn`, `brush-stroke`, `ink-bleed`, `origami`, `comic-pop` |
| **Tech & Futuristic**| `tech-grid`, `cyberpunk-hud`, `hologram`, `blueprint`, `industrial-steel` |
| **Dynamic Effects** | `split-reveal`, `gradient-wave`, `neon-glow`, `gaming-glitch`, `liquid-motion`, `confetti`, `border-animate`, `shadow-stack`, `floating-bubbles`, `stencil-cut` |
| **Nature & Theme** | `nature-eco`, `space-cosmos`, `chalkboard`, `quote-box` |

### Usage in OTIO

```json
{
    "remotion_component": "LowerThird",
    "props": {
        "title": "DƯƠNG VƯỢT BIỂN",
        "subtitle": "Kỹ Sư Xây Dựng",
        "template": "modern-skew",
        "primaryColor": "#3498db",
        "fontFamily": "Inter" // Optional: Google Font name
    }
}
```

### Full Documentation

See [docs/lower-third-guide.md](docs/lower-third-guide.md) for details on all templates and props.

## CALL TO ACTION TEMPLATES

### Overview

`CallToAction` component cung cấp **120 mẫu** nút bấm, thông báo, social media handles để tăng tương tác người xem (Subscribe, Follow, Buy Now, Click Link).

> **🎯 Responsive Scaling:** Tất cả 120+ templates tự động scale và căn chỉnh vị trí cho video portrait. Scale factor tích hợp với animation!

### Available Groups

| Group | Description |
|-------|-------------|
| **Social Media** | YouTube, Instagram, TikTok, Facebook, Twitter, Discord, Patreon |
| **Commercial** | App Store, Google Play, Shop Now, Discount, QR Code |
| **Generic** | Buttons (Blue, Gradient, 3D, Outline) |
| **Effects** | Neon, Glitch, Pixel, Glassmorphism, Hand-drawn |
| **Interactive** | Mouse Click, Finger Tap, Live Badge |
| **E-commerce** | Flash Sale, Add to Cart, BOGO, Promo Code, Pre-order |
| **Tech & SaaS** | Free Trial, Download, AI Feature, Cloud Sync, API Key |
| **Health** | Book Appointment, Telehealth, Organic, Workout, Nutrition |
| **Education** | Enroll Now, eBook, Webinar, Certificate, Quiz |
| **Finance** | Crypto, Stocks, Invest, Secure Pay, Wallet |
| **Real Estate** | Open House, Sold, Virtual Tour, Mortgage, Agent |
| **Travel** | Book Flight, Hotel, Passport, Luggage, Explore |
| **Food** | Delivery, Menu, Chef Choice, Vegan, Combo |

### Usage in OTIO

```json
{
    "remotion_component": "CallToAction",
    "props": {
        "template": "classic-youtube",
        "title": "SUBSCRIBE",
        "subtitle": "1M Subs",
        "fontFamily": "Anton" // Optional: Specify any Google Font name
    }
}
```

### Font Usage
Component tự động load Google Fonts từ tên được cung cấp trong `fontFamily`.
Ví dụ:
- `fontFamily: "Roboto"` -> Loads Roboto
- `fontFamily: "Open Sans"` -> Loads Open Sans
- `fontFamily: "Press Start 2P"` -> Loads Press Start 2P (Retro gaming font)

### Full Documentation

See [docs/call-to-action-guide.md](docs/call-to-action-guide.md).

## INTEGRATION VỚI REMOTION

### Loading OTIO in Remotion

OtioTimeline composition tự động đọc `ratio` từ `script.json` metadata và render đúng kích thước.

1. Import timeline:
```typescript
import projectTimeline from '../public/projects/my-project/project.otio';
```

2. Composition tự động chọn đúng kích thước dựa trên `script.json` metadata:
```typescript
// Root.tsx đã đăng ký các OtioTimeline variants:
// - OtioTimeline        → Auto-detect từ script.json (default 9:16)
// - OtioTimelineLandscape → 16:9 (1920×1080)
// - OtioTimelineSquare    → 1:1 (1080×1080)
// - OtioTimeline4x5       → 4:5 (1080×1350)
```

3. Render:
```bash
npm run dev  # Preview - tự chọn composition phù hợp
# Render cụ thể:
npx remotion render OtioTimeline          # 9:16 (default)
npx remotion render OtioTimelineLandscape # 16:9
npx remotion render OtioTimelineSquare    # 1:1
npx remotion render OtioTimeline4x5       # 4:5
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

- ✅ All 3 JSON files exist
- ✅ `script.json` has valid `videoType`
- ✅ `voice.json` has `timestamps` array
- ✅ `resources.json` has at least one resource type (including pinnedResources)
- ✅ Scene durations sum to expected total (±3s tolerance)
- ✅ **Caption track is the last track** in the timeline tracks list.

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
python3 .claude/skills/video-editor/cli.py public/projects/my-project  # → project.otio

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

### "inputRange must be strictly monotonically increasing"
→ Xảy ra khi dùng `interpolate` với dải giá trị bằng 0 (ví dụ `[0, 0]`). Cần check `duration > 0` trước khi gọi hàm.

### "Duration of <Sequence /> must not be shorter than Transition"
→ Xảy ra khi Clip quá ngắn (ví dụ 0.5s) nhưng Transition trước nó lại dài (ví dụ 1s). Cần rút ngắn Transition lại.

### "Transition must not be followed by another Transition"
→ Lỗi logic timeline khiến 2 transition nằm sát nhau. Cần kiểm tra kỹ index khi chèn hoặc dùng script `fix_sequence.py`.

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

- v1.3 (2026-01-30): Sticker Overlays & Animations
  - **NEW** `Sticker` component for emojis, memes, and images
  - **NEW** Overlays track support for multiple sticker layers
  - **NEW** Rich animation library: pop, shake, rotate, elastic, slide
  - **NEW** Positioning system: presets (center, corners), random, custom coordinates
  - **UPDATED** `OtioPlayer` to support Sticker rendering

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



---

# TIMELINE INSPECTOR

**Inspect and analyze OTIO timeline structure before editing.**

The Timeline Inspector helps you understand your project's timeline - which tracks exist, what clips are in each track, their indices, and durations. This is **essential** before using the Script Generator to edit.

## Quick Start

### 1. View Timeline Summary

```bash
python3 generators/cli.py inspect --project public/projects/my-video/project.otio
```

**Output:**
================================================================================
Timeline: {project-name}
================================================================================
Duration: 60.0s
Tracks: 5

Track 0: B-Roll
  Kind: Video
  Items: 11
    [0] hook Video                     Clip         (5.00s)
    [1] item1 Video                    Clip         (10.00s)
    [2]                                Transition   (0.47s)
    ...

Track 4: Subtitles
  Kind: Video
  Items: 34
    [0] Sub: Text...                   Clip         (1.13s)
```

This shows:
- ✅ **Track index** (0, 1, 2, ...) → use in edit commands
- ✅ **Track name** (B-Roll, Subtitles, ...) → reference
- ✅ **Clip index** [0], [1], [2], ... → use for edits
- ✅ **Clip name and duration** → understand content

---

## STICKER OVERLAYS

### Overview

`Sticker` component cho phép thêm các hình ảnh trang trí, memes, emojis, hoặc bất kỳ hình ảnh nào khác lên video dưới dạng overlay. Tính năng này giúp video sinh động, hài hước và giữ sự chú ý của người xem (retention).

### Usage in OTIO

Thêm clip `Sticker` vào track "Title Overlays" hoặc tạo track mới chuyên biệt:

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "Sticker",
        "props": {
            "src": "https://example.com/meme.png", 
            "style": "bottom-right",
            "animation": "pop",
            "width": 300,
            "enterDuration": 15,
            "rotation": 10
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 90.0 }, // 3 seconds
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
}
```

### Positioning Styles

| Style | Position | Description |
|-------|----------|-------------|
| `center` | Center | Giữa màn hình |
| `top-left` | Top Left | Góc trên trái (cách lề 50px) |
| `top-right` | Top Right | Góc trên phải (cách lề 50px) |
| `bottom-left` | Bottom Left | Góc dưới trái (cách lề 50px) |
| `bottom-right` | Bottom Right | Góc dưới phải (cách lề 50px) |
| `random` | Random | Vị trí ngẫu nhiên mỗi lần render |
| `custom` | Custom | Sử dụng `top`, `left`, `right`, `bottom` props |

### Animations

| Animation | Effect |
|-----------|--------|
| `pop` | Bật lên từ nhỏ đến lớn (giống bong bóng) - **Mặc định** |
| `elastic` | Giống `pop` nhưng có độ nảy đàn hồi mạnh hơn |
| `shake` | Rung lắc nhẹ (gây chú ý) |
| `rotate` | Xoay vòng khi xuất hiện |
| `slide-up` | Trượt từ dưới lên |
| `slide-down` | Trượt từ trên xuống |
| `fade` | Hiện dần đơn giản |

## LAYER EFFECTS

### Overview

`LayerEffect` component cung cấp các hiệu ứng thị giác (visual accents) hiện đại như HUD, neon shapes, scanlines... giúp video mang phong cách tech, dynamic hơn mà không cần file video nặng nề.

### Usage in OTIO

```json
{
    "metadata": {
        "remotion_component": "LayerEffect",
        "props": {
            "type": "neon-circle",
            "width": 400,
            "height": 400,
            "color": "#00ff00",
            "speed": 1.5
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

### Supported Effects

| Type | Description |
|------|-------------|
| **TECH / HUD** || 
| `neon-circle` | Vòng tròn HUD xoay |
| `radar-sweep` | Quét radar xanh |
| `crosshair` | Tâm ngắm sniper |
| `target-scope-a` | Ống ngắm chi tiết |
| `scan-lines` | Hiệu ứng quét dòng |
| `cyber-frame-corners` | Góc khung hình công nghệ |
| `loading-dots` | 3 chấm loading |
| `loading-ring` | Vòng loading đơn giản |
| `digital-noise` | Nhiễu kỹ thuật số |
| **GEOMETRIC** ||
| `rotating-squares` | 2 hình vuông xoay ngược nhau |
| `concentric-circles` | Các vòng tròn đồng tâm xoay |
| `techno-triangle` | Tam giác lồng nhau |
| `dashed-ring` | Vòng tròn nét đứt |
| `burst` | Nổ hình học |
| `zigzag-wave` | Sóng zigzag tần số cao |
| `hex-hive` | Lưới lục giác mờ |
| `floating-shapes` | Các hình khối trôi nổi |
| **COMIC** ||
| `comic-boom` | Chữ BOOM kiểu truyện tranh |
| `speed-lines-radial` | Tia tốc độ từ tâm (Anime) |
| `hand-drawn-circle` | Vòng tròn vẽ tay |
| **MISC** ||
| `particles` | Hạt bụi bay lên |
| `sound-wave` | Sóng âm nhạc |
| `glitch-bars` | Các thanh ngang nhiễu |
| `arrow-chevron-right` | Mũi tên chỉ hướng |
| `custom` | Load Lottie/Image từ URL |

