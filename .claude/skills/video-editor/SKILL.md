---
name: video-editor
description: Build và chỉnh sửa OTIO timeline từ script/voice/resources. Unified architecture - không cần strategy, tự động xử lý mọi loại video.
---

# VIDEO EDITOR SKILL

## MỤC ĐÍCH

Tạo file OTIO timeline từ outputs của upstream skills:
- `script.json` (từ director hoặc video-production-director)
- `voice.mp3` + `voice.json` (từ voice-generation)
- `resources.json` (từ video-resource-finder)

**Output**: `project.otio` file để render trong Remotion với OtioPlayer component.

---

## 🏗️ UNIFIED ARCHITECTURE (MỚI)

**Thay đổi lớn**: Không còn strategy pattern, chỉ có **single unified builder**.

### Kiến trúc cũ (ĐÃ XÓA)
```
❌ strategies/
   ├── listicle_strategy.py
   ├── image_slide_strategy.py
   ├── unified_strategy.py
   └── ...
```

### Kiến trúc mới (HIỆN TẠI)
```
✅ core/
   ├── timeline_builder.py           # Single unified builder
   └── track_builders/                # Modular track builders
       ├── visual_track.py            # Main visual (clips + title cards)
       ├── overlay_track.py           # Auto-generated overlays
       ├── audio_tracks.py            # Voice + music
       └── subtitle_track.py          # Captions

✅ editors/
   └── overlay_editor.py              # Post-editing (add-title, add-sticker)

✅ utils/
   └── component_factory.py           # Consistent metadata factory
```

### Lợi ích
- ✅ **70% ít code hơn** - Xóa 2000+ lines strategies
- ✅ **Không cần chọn type** - Auto-detect từ script.json
- ✅ **Build nhanh hơn** - Không có strategy dispatch overhead
- ✅ **Dễ maintain** - Modular track builders
- ✅ **Integrated post-editing** - Không cần skill riêng

---

## 🐍 PYTHON EXECUTION

**Luôn sử dụng `python3` để chạy CLI này.**

```bash
# ✅ ĐÚNG - Sử dụng python3
python3 .claude/skills/video-editor/cli.py build public/projects/my-video

# ❌ SAI - Không dùng 'python' (có thể gọi Python 2.x)
python .claude/skills/video-editor/cli.py build public/projects/my-video
```

---

## 🔗 KẾT NỐI VỚI DIRECTOR SKILL

### Cách Director gọi Video-Editor

**Bước 7 trong director workflow**:
```bash
# Director tự động gọi skill video-editor
# Không cần chỉ định params - skill tự đọc từ project files
```

**Skill tự động**:
1. Load `script.json`, `voice.json`, `resources.json`
2. Detect video type và aspect ratio từ metadata
3. Build timeline với unified builder (không cần strategy)
4. Save `project.otio`

### Manual Build (nếu cần)

```bash
# Build timeline
python3 .claude/skills/video-editor/cli.py build public/projects/my-video

# Build với custom FPS
python3 .claude/skills/video-editor/cli.py build public/projects/my-video --fps 60

# Validate only (không build)
python3 .claude/skills/video-editor/cli.py build public/projects/my-video --validate-only
```

---

## CLI COMMANDS

### 1. Build Timeline

**Command:**
```bash
python3 cli.py build <project_dir> [options]
```

**Parameters:**
- `project_dir` (bắt buộc): Path tới project directory
  - VD: `public/projects/my-video`
- `--fps` (optional): Frames per second (default: 30)
- `--output` / `-o` (optional): Output file path
- `--validate-only` (optional): Chỉ validate, không build

**Examples:**
```bash
# Basic build
python3 cli.py build public/projects/demo

# Custom FPS
python3 cli.py build public/projects/demo --fps 60

# Custom output
python3 cli.py build public/projects/demo -o custom.otio

# Validate only
python3 cli.py build public/projects/demo --validate-only
```

---

### 2. Add Title Overlay

**Command:**
```bash
python3 cli.py add-title <project_dir> --text <text> --at-second <time> --duration <dur> [options]
```

**Parameters:**
- `project_dir` (bắt buộc): Path tới project directory
- `--text` (bắt buộc): Title text
- `--at-second` (bắt buộc): Start time in seconds
- `--duration` (bắt buộc): Duration in seconds
- `--style` (optional): Title style (default: highlight)
  - Options: `highlight`, `bold`, `clean`, `cyber`, `minimalist`
- `--position` (optional): Position (default: bottom)
  - Options: `top`, `center`, `bottom`, `top-left`, `top-right`, etc.
- `--subtitle` (optional): Optional subtitle text

**Example:**
```bash
python3 cli.py add-title public/projects/demo \
  --text "Subscribe!" \
  --at-second 5 \
  --duration 3 \
  --style highlight \
  --position bottom
```

---

### 3. Add Sticker Overlay

**Command:**
```bash
python3 cli.py add-sticker <project_dir> --emoji <emoji> --at-second <time> --duration <dur> [options]
```

**Parameters:**
- `project_dir` (bắt buộc): Path tới project directory
- `--emoji` (bắt buộc): Emoji or sticker content
- `--at-second` (bắt buộc): Start time in seconds
- `--duration` (bắt buộc): Duration in seconds
- `--position` (optional): Position (default: center)
- `--size` (optional): Size (default: medium)
  - Options: `small`, `medium`, `large`
- `--animation` (optional): Animation type (default: bounce)
  - Options: `bounce`, `pop`, `fade`, `slide-up`, etc.

**Example:**
```bash
python3 cli.py add-sticker public/projects/demo \
  --emoji "👍" \
  --at-second 10 \
  --duration 2 \
  --position top-right \
  --animation pop
```

---

### 4. Add Effect Overlay

**Command:**
```bash
python3 cli.py add-effect <project_dir> --effect-type <type> --at-second <time> --duration <dur> [options]
```

**Parameters:**
- `project_dir` (bắt buộc): Path tới project directory
- `--effect-type` (bắt buộc): Effect type
  - Options: `zoom`, `blur`, `shake`, `flash`, `neon-circle`, etc.
- `--at-second` (bắt buộc): Start time in seconds
- `--duration` (bắt buộc): Duration in seconds
- `--intensity` (optional): Effect intensity 0.0-1.0 (default: 0.5)

**Example:**
```bash
python3 cli.py add-effect public/projects/demo \
  --effect-type neon-circle \
  --at-second 15 \
  --duration 5 \
  --intensity 0.7
```

---

### 5. Add CTA Overlay

**Command:**
```bash
python3 cli.py add-cta <project_dir> --text <text> --at-second <time> --duration <dur> [options]
```

**Parameters:**
- `project_dir` (bắt buộc): Path tới project directory
- `--text` (bắt buộc): CTA text
- `--at-second` (bắt buộc): Start time in seconds
- `--duration` (bắt buộc): Duration in seconds
- `--action` (optional): Action type (default: subscribe)
  - Options: `subscribe`, `like`, `follow`, `visit`, etc.
- `--style` (optional): CTA style (default: default)
- `--position` (optional): Position (default: bottom)

**Example:**
```bash
python3 cli.py add-cta public/projects/demo \
  --text "Like & Subscribe!" \
  --at-second 60 \
  --duration 3 \
  --action subscribe \
  --style bold
```

---

## TRACK STRUCTURE

Timeline được build với cấu trúc tracks sau (bottom to top):

```
Timeline (project.otio)
├── Track 1: Main Visual (Video)       ← Scene clips + Title cards
├── Track 2: Overlays (Video)          ← Auto-generated + Manual overlays
├── Track 3: Voice (Audio)             ← Voiceover
├── Track 4: Music (Audio)             ← Background music (optional)
└── Track 5: Captions (Video)          ← Subtitles (ALWAYS LAST)
```

### Track 1: Main Visual
- **Scene clips** từ `selectedResourceIds[]` hoặc resources.json
- **Title cards** nếu section.titleCard.enabled
- **Transitions** giữa scenes

### Track 2: Overlays
- **Auto-generated** từ scene.titleOverlay.enabled
- **Manual overlays** thêm qua CLI commands
- **Legacy overlays** từ script.overlays[] (nếu có)

### Track 3: Voice
- Voice audio với timing chính xác

### Track 4: Music
- Background music với fade in/out (nếu enabled)

### Track 5: Captions
- Word-level subtitles từ voice.json timestamps
- **LUÔN ở vị trí cuối cùng** (để hiển thị trên top)

---

## INPUT FILES SCHEMA

### script.json (Required)

**Minimum required:**
```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "image-slide",
    "duration": 300,
    "ratio": "9:16"
  },
  "sections": [
    {
      "id": "intro",
      "name": "Giới thiệu",
      "scenes": [
        {
          "id": "scene_1",
          "text": "Scene text",
          "duration": 10
        }
      ]
    }
  ]
}
```

**Auto-populated fields** (nếu missing):
- `script` → empty narration metadata
- `voice` → null provider (pre-recorded)
- `music` → disabled
- `subtitle` → default theme (clean-minimal)
- `metadata.width/height` → 1920x1080 (16:9)

### voice.json (Required)

```json
{
  "text": "Full script text",
  "timestamps": [
    {"word": "Hello", "start": 0, "end": 0.32},
    {"word": "world", "start": 0.32, "end": 0.66}
  ]
}
```

### resources.json (Required)

```json
{
  "resources": {
    "videos": [
      {
        "sceneId": "scene_1",
        "results": [
          {
            "id": "vid_1",
            "localPath": "imports/videos/scene_1.mp4",
            "downloadUrls": {"hd": "https://..."}
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

---

## 📐 RESPONSIVE COMPONENT SCALING

**TẤT CẢ overlay components tự động scale cho mọi aspect ratio.**

### Scale Behavior

| Video Aspect | Kích thước | Scale Factor | Behavior |
|--------------|-----------|-------------|----------|
| **Landscape (16:9)** | 1920×1080 | ~1.0 | Thiết kế gốc (reference) |
| **Portrait (9:16)** | 1080×1920 | ~0.56 | Thu nhỏ, căn giữa/dưới |
| **Square (1:1)** | 1080×1080 | ~0.56 | Thu nhỏ cân đối |
| **Instagram (4:5)** | 1080×1350 | ~0.65 | Scale trung bình |

### Các thành phần auto-scale

✅ **Positions** - `bottom`, `left`, `right`, `top`
✅ **Font sizes** - `fontSize`, `titleSize`, `subtitleSize`
✅ **Dimensions** - `width`, `height` của Sticker và LayerEffect
✅ **Paddings** - Khoảng cách tự động scale

### Lưu ý

- ❌ KHÔNG cần thay đổi fontSize cho từng tỷ lệ
- ❌ KHÔNG cần điều chỉnh positions
- ✅ CHỈ cần khai báo `ratio` trong script.json metadata
- ✅ Component tự động scale phù hợp!

---

## 📚 COMPONENTS REFERENCE

Khi tạo overlays (titles, stickers, effects), **BẮT BUỘC** tham khảo:

👉 **`.claude/skills/COMPONENTS_REFERENCE.md`**

**Thông tin:**
- **5 main components**: LayerTitle, Sticker, LayerEffect, LowerThird, FullscreenTitle
- **160+ sticker templates**: lottie-fire, lottie-thumbs-up, heart-red, etc.
- **50+ effect types**: neon-circle, scan-lines, particles, etc.
- **40+ lower third templates**: breaking-news, social-youtube, gaming-glitch, etc.
- **120+ CTA templates**: YouTube, Instagram, TikTok, etc.

**Integration trong OTIO**: ComponentFactory tự động tạo metadata đúng format.

---

## 🔊 AUDIO EFFECTS SUPPORT

Skill hỗ trợ SFX (sound effects) để tăng cảm xúc cho video.

### Quy tắc quan trọng

1. **Đường dẫn**: BẮT BUỘC `/audio/whoosh.mp3` (absolute path)
2. **Volume**: BẮT BUỘC `volume: "2.0"` (200% để nghe rõ trên nền nhạc)
3. **Track riêng**: Tách SFX thành tracks riêng (Transition SFX, Component SFX)
4. **Positioning**: Dùng `globalTimelineStart` (giây)

### Code mẫu

```python
sfx_clip = ComponentFactory.create_sticker(
    emoji="🔥",
    start_time=5.0,
    duration=2.0
)
# SFX metadata tự động được thêm bởi ComponentFactory
```

### Mapping gợi ý

| Component/Action | Suggested SFX |
|------------------|---------------|
| LayerTitle (slide/fly) | `/audio/whoosh.mp3` |
| Sticker (pop) | `/audio/click.mp3` |
| FullscreenTitle | `/audio/transition.mp3` |
| LayerEffect (tech) | `/audio/bling1.mp3` |

---

## VALIDATION & SAFE SAVE

Skill áp dụng quy trình **Safe-Save** với validation:

### Validation Rules

1. ✅ No consecutive transitions
2. ✅ Transition duration < adjacent clip duration
3. ✅ All paths are relative (no absolute paths)
4. ✅ Captions track is LAST
5. ✅ Component clips have required metadata
6. ✅ No overlapping clips in same track

### Khi validation fail

Timeline không được save, error message hiển thị rõ ràng:
```
Timeline validation failed:
  - Track 'Main Visual': Consecutive transitions at index 2 and 3
  - Track 'Overlays': Clip 'Title' missing 'remotion_component' metadata
```

---

## CRITICAL RULES FOR DEVELOPERS

### Rule 1: NO Consecutive Transitions

```python
# ❌ WRONG - Will crash Remotion
track.append(clip1)
track.append(transition1)
track.append(transition2)  # ERROR!

# ✅ CORRECT
track.append(clip1)
track.append(transition1)
track.append(clip2)
```

### Rule 2: Transition Duration < Clip Duration

```python
# ❌ WRONG
clip = create_clip(duration=1.0)  # 1 second
transition = create_transition(duration=2.0)  # TOO LONG!

# ✅ CORRECT
clip = create_clip(duration=5.0)
transition = create_transition(duration=0.5)
```

### Rule 3: Always Use Relative Paths

```python
# ❌ WRONG - Absolute path
url="/Users/name/project/video.mp4"

# ✅ CORRECT - Relative path
url="downloads/videos/video.mp4"
```

### Rule 4: Use ComponentFactory

```python
# ❌ WRONG - Manual metadata
clip.metadata['remotion_component'] = 'LayerTitle'
clip.metadata['props'] = {'title': 'Text'}

# ✅ CORRECT - Use factory
clip = ComponentFactory.create_layer_title(
    text='Text',
    start_time=5.0,
    duration=3.0
)
```

---

## ASPECT RATIO SUPPORT

### Supported Ratios

| Ratio | Platform | Dimensions |
|-------|----------|------------|
| **9:16** | TikTok/Shorts/Reels | 1080×1920 |
| **16:9** | YouTube/Facebook | 1920×1080 |
| **1:1** | Instagram Feed | 1080×1080 |
| **4:5** | Instagram Portrait | 1080×1350 |

### Short Video Layout (9:16 with landscape content)

For 9:16 videos using landscape source (16:9), skill tự động tạo:

1. **Background Track** (Track 0) - Custom video/image OR auto-generated blur
2. **Main Content** (Track 1) - Landscape content centered/cropped
3. **Overlays** (Track 2+) - Respect safe zones

**6 Background Types:**
- `custom-video` - User-provided background
- `custom-image` - User-provided image
- `blur-original` - Auto-blur of main content (recommended)
- `gradient` - Auto-generated gradient
- `solid-color` - Solid color fill
- `auto` - Smart detection (default)

**4 Content Positioning:**
- `centered` (default) - Max-width 90%, shows background
- `crop-to-fill` - Smart crop to fill frame
- `zoom` - Zoom to fill
- `ken-burns` - Animated pan+zoom (images only)

**Safe Zones** tự động respected:
- Top danger: 0-180px (pause/sound buttons)
- Header safe: 180-350px (main title)
- Content zone: 350-1400px (video + overlays)
- Footer safe: 1400-1720px (descriptions, CTAs)
- Bottom danger: 1720-1920px (progress bar)

See **[docs/short-video-layout-guide.md](docs/short-video-layout-guide.md)** for details.

---

## INTEGRATION VỚI REMOTION

### Loading OTIO

```typescript
// Auto-detect ratio từ script.json
import projectTimeline from '../public/projects/my-project/project.otio';

// Composition tự động chọn đúng kích thước:
// - OtioTimeline        → 9:16 (default)
// - OtioTimelineLandscape → 16:9
// - OtioTimelineSquare    → 1:1
// - OtioTimeline4x5       → 4:5
```

### Render

```bash
# Preview - tự chọn composition phù hợp
npm run dev

# Render specific composition
npx remotion render OtioTimeline          # 9:16
npx remotion render OtioTimelineLandscape # 16:9
npx remotion render OtioTimelineSquare    # 1:1
npx remotion render OtioTimeline4x5       # 4:5
```

---

## WORKFLOW WITH DIRECTOR

### Complete Pipeline

```
1. User → Director skill
   ↓
2. Director: Generate script.json
   ↓
3. Director: Generate voice (voice-generation skill)
   ↓
4. Director: Find resources (video-resource-finder skill)
   ↓
5. Director: Call video-editor skill ← YOU ARE HERE
   ↓
6. video-editor: Build timeline
   ├─ Load inputs (script, voice, resources)
   ├─ Detect type & ratio
   ├─ Build tracks (unified builder)
   ├─ Validate timeline
   └─ Save project.otio
   ↓
7. Director: Open Remotion Studio
```

### Manual Edit After Build

```bash
# Add overlays after initial build
python3 cli.py add-title public/projects/demo --text "..." --at-second 5 --duration 3
python3 cli.py add-sticker public/projects/demo --emoji "👍" --at-second 10 --duration 2
python3 cli.py add-cta public/projects/demo --text "..." --at-second 60 --duration 3
```

---

## BEST PRACTICES

### 1. Consistent Folder Structure

```
public/projects/my-video/
├── script.json        # Input
├── voice.json         # Input
├── voice.mp3          # Input
├── resources.json     # Input
├── imports/           # User uploads
│   ├── videos/
│   ├── images/
│   └── audio/
└── project.otio       # OUTPUT
```

### 2. Use Relative Paths

✅ Browser can load relative paths
✅ Project is portable
✅ Faster (no network)
✅ Offline-friendly

### 3. Test Portability

```bash
# Copy project to different location
cp -r public/projects/test-project /tmp/test-project

# Timeline should still work
cd /tmp/test-project
# Load project.otio in Remotion → should render correctly
```

---

## TROUBLESHOOTING

### "Required file not found: script.json"
→ Run director workflow first or ensure files exist

### "Timeline validation failed"
→ Check error messages for specific issues
→ Most common: consecutive transitions or wrong paths

### Paths not resolving in Remotion
→ Verify all paths are relative
→ Use AssetResolver.sanitize_for_otio() for all local paths

### "Duration mismatch"
→ Ensure voice.json timestamps are synced with script
→ Run director sync command if needed

---

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

---

## VERSION HISTORY

- **v2.0 (2026-02-03)**: Unified Architecture
  - **BREAKING**: Removed ALL strategies (~2000 lines)
  - **NEW**: Single unified TimelineBuilder
  - **NEW**: Modular track builders (visual, overlay, audio, subtitle)
  - **NEW**: ComponentFactory for consistent metadata
  - **NEW**: Integrated post-editing (add-title, add-sticker, add-cta, add-effect)
  - **NEW**: Enhanced validation (captions last, no overlaps, component metadata)
  - **IMPROVED**: CLI with subcommands
  - **IMPROVED**: 70% less code, faster builds

- v1.3 (2026-01-30): Sticker Overlays & Animations
- v1.2 (2026-01-26): Enhanced Music Support
- v1.1 (2026-01-26): Image-Slide Strategy
- v1.0 (2026-01-24): Initial release with strategies

---

## SUMMARY

**Video-editor skill** là core engine để build OTIO timeline:
- ✅ **Unified architecture** - Không cần strategy, auto-detect type
- ✅ **Modular** - Track builders độc lập, dễ test
- ✅ **Post-editing** - Tích hợp commands để edit sau khi build
- ✅ **Validated** - Safe-save với comprehensive checks
- ✅ **Portable** - Relative paths, project có thể move anywhere
- ✅ **Connected** - Được gọi tự động bởi director skill

**Khi nào dùng trực tiếp**:
- Manual build khi không dùng director
- Post-editing với CLI commands
- Debug hoặc test timeline generation
