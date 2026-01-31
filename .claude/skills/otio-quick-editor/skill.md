---
name: otio-quick-editor
description: Chỉnh sửa nhanh timeline OTIO (thêm overlays, titles, stickers, effects) trong 1-2 giây mà không cần rebuild toàn bộ project.
---
# OTIO Quick Editor

## Mô tả
Skill chỉnh sửa nhanh OTIO timeline mà không cần rebuild toàn bộ project.

**Tốc độ**: ~1-2s (thay vì 10-20s rebuild)

---

## 📚 COMPONENTS REFERENCE

**QUAN TRỌNG**: Trước khi dùng skill này, tham khảo:
👉 **`.claude/skills/COMPONENTS_REFERENCE.md`**

**Bạn sẽ biết:**
- **LayerTitle styles**: lower-third, centered, corner-badge, full-screen
- **Sticker templates**: 160+ options (lottie-fire, lottie-thumbs-up, heart-red, etc.)
- **Effect types**: 50+ options (neon-circle, scan-lines, particles, etc.)
- **LowerThird templates**: 40+ options (breaking-news, social-youtube, gaming-glitch, etc.)
- **Full props cho mỗi component**

---

## Use Cases
- Thêm title overlay ở thời điểm cụ thể
- Thêm sticker/emoji
- Thêm layer effect (neon, HUD, scan-lines, etc.)
- Xóa hoặc di chuyển clip

## Commands

### 1. Add Title
```bash
otio-quick-editor add-title \
  --project "my-video" \
  --text "Subscribe Now!" \
  --at-second 3 \
  --duration 4 \
  --style "neon-glow" \
  --position "center"
```

**Parameters**:
- `--project`: Tên project (folder trong public/projects/)
- `--text`: Nội dung title
- `--at-second`: Thời điểm xuất hiện (giây)
- `--duration`: Thời lượng hiển thị (giây)
- `--style`: Style title (optional, default: "default")
  - Styles: "neon-glow", "retro", "minimal", "bold", "handwritten", etc.
- `--position`: Vị trí (optional, default: "center")
  - Positions: "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"

### 2. Add Sticker
```bash
otio-quick-editor add-sticker \
  --project "my-video" \
  --emoji "🔥" \
  --at-second 5 \
  --duration 2 \
  --animation "pop" \
  --position "top-right"
```

**Parameters**:
- `--emoji`: Emoji hoặc sticker text
- `--animation`: Animation type (optional, default: "pop")
  - Animations: "pop", "shake", "rotate", "slide-in", "bounce", "pulse", "fade"
- `--position`: Vị trí (default: "center")

### 3. Add Effect
```bash
otio-quick-editor add-effect \
  --project "my-video" \
  --effect-type "neon-circles" \
  --at-second 10 \
  --duration 3 \
  --intensity 0.7
```

**Parameters**:
- `--effect-type`: Loại effect
  - Types: "neon-circles", "hud-overlay", "radar", "scan-lines", "glitch", "particles", "vhs"
- `--intensity`: Cường độ effect (0.0 - 1.0, default: 0.5)

### 4. List Clips (Inspect)
```bash
otio-quick-editor list-clips \
  --project "my-video" \
  --track "Overlays"
```

### 5. Remove Clip
```bash
otio-quick-editor remove-clip \
  --project "my-video" \
  --track "Overlays" \
  --clip-name "title_1"
```

## Architecture

```
otio-quick-editor/
├── skill.md (this file)
├── cli.py (entry point)
├── requirements.txt
├── utils/
│   ├── otio_handler.py (load/save OTIO)
│   └── time_converter.py (seconds → frames)
└── commands/
    ├── add_title.py
    ├── add_sticker.py
    ├── add_effect.py
    ├── list_clips.py
    └── remove_clip.py
```

## Technical Details

**OTIO Overlay Track**:
- Track name: "Overlays" (kind="Video")
- Renders on top of all other tracks
- Contains component clips: LayerTitle, Sticker, LayerEffect

**No Dependencies**:
- ✅ Chỉ cần project.otio file
- ❌ KHÔNG cần script.json, voice.json, resources.json

**Speed Optimization**:
- Direct OTIO manipulation (không rebuild)
- Minimal validation (chỉ check structure)
- In-place modification

## Example Workflow

```bash
# 1. Thêm title ở giây 3
otio-quick-editor add-title --project "demo" --text "Like & Subscribe" --at-second 3 --duration 4

# 2. Thêm fire emoji ở giây 10
otio-quick-editor add-sticker --project "demo" --emoji "🔥" --at-second 10 --duration 2 --animation "pop"

# 3. Thêm neon effect ở giây 15
otio-quick-editor add-effect --project "demo" --effect-type "neon-circles" --at-second 15 --duration 5

# 4. Kiểm tra overlay track
otio-quick-editor list-clips --project "demo" --track "Overlays"

# Total time: ~3 giây (thay vì 30 giây rebuild)
```

## Integration với OtioPlayer

OtioPlayer.tsx sẽ tự động render các component clips:
- `LayerTitle` → Title overlays (src/components/titles/LayerTitle.tsx)
- `Sticker` → Emoji/sticker (src/components/titles/Sticker.tsx)
- `LayerEffect` → Effects (src/components/effects/LayerEffect.tsx)

Không cần thay đổi gì ở OtioPlayer!
