# OTIO Quick Editor

⚡ **Fast timeline editing** without rebuilding entire project

## Overview

OTIO Quick Editor là tool chỉnh sửa nhanh OTIO timeline, cho phép thêm overlays (titles, stickers, effects) trong **~1-2 giây** thay vì phải rebuild toàn bộ project (10-20 giây).

### Key Features

- ⚡ **Siêu nhanh**: 1-2s vs 10-20s rebuild
- 📦 **Minimal dependencies**: Chỉ cần `project.otio`, không cần `script.json`, `voice.json`
- 🎯 **Targeted edits**: Chỉ modify phần cần thiết
- 💾 **Auto-backup**: Tự động backup trước khi save
- 🎨 **Rich components**: Hỗ trợ LayerTitle, Sticker, LayerEffect

## Installation

Dependencies đã được cài sẵn (shared venv với video-editor).

## Usage

### 1. Add Title Overlay

```bash
./otio-quick-editor.sh add-title \
  --project "my-video" \
  --text "Subscribe Now!" \
  --at-second 3 \
  --duration 4 \
  --style "neon-glow" \
  --position "center"
```

**Available Styles**:
- `default` - Simple text
- `neon-glow` - Neon effect với glow
- `retro` - Retro 80s style
- `minimal` - Minimal clean
- `bold` - Bold large text
- `handwritten` - Handwritten font

**Available Positions**:
- `center` - Center of screen
- `top`, `bottom`, `left`, `right`
- `top-left`, `top-right`, `bottom-left`, `bottom-right`

### 2. Add Sticker/Emoji

```bash
./otio-quick-editor.sh add-sticker \
  --project "my-video" \
  --emoji "🔥" \
  --at-second 5 \
  --duration 2 \
  --animation "pop" \
  --position "top-right"
```

**Available Animations**:
- `pop` - Pop in/out
- `shake` - Shake effect
- `rotate` - Rotation
- `slide-in` - Slide from edge
- `bounce` - Bounce effect
- `pulse` - Pulsing scale
- `fade` - Fade in/out

### 3. Add Layer Effect

```bash
./otio-quick-editor.sh add-effect \
  --project "my-video" \
  --effect-type "neon-circles" \
  --at-second 10 \
  --duration 3 \
  --intensity 0.7
```

**Available Effects**:
- `neon-circles` - Animated neon circles
- `hud-overlay` - Futuristic HUD display
- `radar` - Radar scan effect
- `scan-lines` - CRT scan lines
- `glitch` - Digital glitch
- `particles` - Particle system
- `vhs` - VHS tape effect

### 4. List Tracks/Clips

```bash
# List all tracks
./otio-quick-editor.sh list-clips --project "my-video"

# List clips in specific track
./otio-quick-editor.sh list-clips --project "my-video" --track "Overlays"
```

## Real-World Example

```bash
cd .claude/skills/otio-quick-editor

# 1. Thêm title ở giây 3
./otio-quick-editor.sh add-title \
  --project "demo-video" \
  --text "Like & Subscribe" \
  --at-second 3 \
  --duration 4 \
  --style "neon-glow"

# 2. Thêm fire emoji ở giây 10
./otio-quick-editor.sh add-sticker \
  --project "demo-video" \
  --emoji "🔥" \
  --at-second 10 \
  --duration 2 \
  --animation "pop" \
  --position "top-right"

# 3. Thêm neon effect ở giây 15
./otio-quick-editor.sh add-effect \
  --project "demo-video" \
  --effect-type "neon-circles" \
  --at-second 15 \
  --duration 5 \
  --intensity 0.7

# 4. Kiểm tra kết quả
./otio-quick-editor.sh list-clips --project "demo-video" --track "Overlays"

# Total time: ~3 giây ⚡
```

## Architecture

```
otio-quick-editor/
├── README.md (this file)
├── skill.md (skill documentation)
├── cli.py (CLI entry point)
├── otio-quick-editor.sh (wrapper script)
├── requirements.txt
├── venv -> ../video-editor/venv (symlink)
├── utils/
│   ├── otio_handler.py (load/save OTIO)
│   └── time_converter.py (time utilities)
└── commands/
    ├── add_title.py
    ├── add_sticker.py
    ├── add_effect.py
    └── list_clips.py
```

## How It Works

1. **Load OTIO**: Load existing `project.otio` file
2. **Find/Create Overlay Track**: Get or create "Overlays" video track
3. **Add Clip**: Insert component clip (LayerTitle/Sticker/LayerEffect) at specified time
4. **Validate**: Basic validation (track structure)
5. **Save**: Backup original, save modified timeline

### OTIO Clip Metadata

Clips store component information in metadata:

```json
{
  "OTIO_SCHEMA": "Clip.2",
  "metadata": {
    "remotion_component": "LayerTitle",
    "props": {
      "text": "Subscribe Now!",
      "style": "neon-glow",
      "position": "center",
      "fontSize": 48,
      "color": "#FFFFFF"
    }
  },
  "source_range": {
    "duration": {"rate": 30, "value": 120}
  }
}
```

OtioPlayer.tsx automatically renders these components!

## Integration with OtioPlayer

No changes needed in OtioPlayer! It already supports:
- `LayerTitle` → `src/components/titles/LayerTitle.tsx`
- `Sticker` → `src/components/titles/Sticker.tsx`
- `LayerEffect` → `src/components/effects/LayerEffect.tsx`

## Performance Comparison

| Operation | Full Rebuild | Quick Edit | Speedup |
|-----------|-------------|------------|---------|
| Add title | 15-20s | 1-2s | **~10x faster** |
| Add sticker | 15-20s | 1-2s | **~10x faster** |
| Add effect | 15-20s | 1-2s | **~10x faster** |
| Multiple edits (3) | 45-60s | 3-6s | **~10x faster** |

## Backup & Safety

- ✅ Auto-backup before each save (`project.otio.backup`)
- ✅ Basic validation before save
- ✅ Non-destructive (only adds clips, doesn't modify existing)
- ✅ Relative paths (portable across machines)

## Troubleshooting

### "OTIO file not found"
Make sure you're in the automation-video directory or subdirectory.

### "Module not found: click"
```bash
.claude/skills/video-editor/venv/bin/pip install click colorama
```

### "Timeline validation failed"
Check if the OTIO file is corrupted. Restore from backup:
```bash
cp public/projects/my-video/project.otio.backup public/projects/my-video/project.otio
```

## Future Enhancements

- [ ] `remove-clip` command
- [ ] `move-clip` command (change timing)
- [ ] `update-clip` command (modify properties)
- [ ] Timeline inspector (visualize all clips)
- [ ] Batch operations (add multiple overlays from JSON)

## License

Part of Vibe Video Studio automation pipeline.
