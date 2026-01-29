---
name: remotion-broll-title
description: Tạo B-roll title components cho Remotion video projects. Sử dụng khi cần tạo title overlays, lower thirds, text animations có thể chèn vào bất kỳ frame/track nào trong Remotion composition thông qua project.otio. Hỗ trợ các style như lower-third, centered, corner badge, animated text reveals với customizable timing và positioning.
---

# Remotion B-roll Title Skill

Tạo các B-roll title components có thể tái sử dụng trong Remotion projects thông qua OTIO timeline.

## Cách sử dụng (OTIO-based)

### Trong project.otio

Thêm track "Title Overlays" với BrollTitle clip:

```json
{
    "OTIO_SCHEMA": "Track.1",
    "name": "Title Overlays",
    "kind": "Video",
    "children": [
        {
            "OTIO_SCHEMA": "Clip.2",
            "metadata": {
                "remotion_component": "BrollTitle",
                "props": {
                    "title": "Tiêu đề của bạn",
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

### Quan trọng: Thứ tự Track

Đặt "Title Overlays" track **SAU** "Subtitles" track để title hiển thị trên subtitle:

```
1. Images (Video)
2. Subtitles (Video)
3. Title Overlays (Video)  ← Đặt sau Subtitles
4. Voice (Audio)
5. Background Music (Audio)
```

## Styles có sẵn

| Style | Position | Kích thước | Use case |
|-------|----------|------------|----------|
| `centered` | Giữa màn hình | 90% width, 40% min-height | Title hook, chapter titles |
| `lower-third` | Góc dưới trái | 60% max-width | Speaker names, locations |
| `corner-badge` | Góc trên phải | Compact | Tags, LIVE badge |
| `full-screen` | Toàn màn hình | 100% | Intro/outro |

## Animations

| Animation | Effect | Best for |
|-----------|--------|----------|
| `scale` | Zoom từ 0.8 → 1.0 | centered, full-screen |
| `slide-up` | Trượt từ dưới lên | lower-third |
| `slide-left` | Trượt từ phải sang | corner-badge |
| `fade` | Mờ dần vào/ra | Tất cả |
| `typewriter` | Gõ từng chữ | Quotes |

## Props Reference

```typescript
interface BrollTitleProps {
  title: string;              // Bắt buộc: nội dung chính
  subtitle?: string;          // Tùy chọn: nội dung phụ
  style?: 'centered' | 'lower-third' | 'corner-badge' | 'full-screen';
  animation?: 'scale' | 'slide-up' | 'slide-left' | 'fade' | 'typewriter';
  backgroundColor?: string;   // Mặc định: 'rgba(0,0,0,0.85)'
  textColor?: string;         // Mặc định: '#ffffff'
  accentColor?: string;       // Mặc định: '#00d4ff'
  fontSize?: number;          // Mặc định: 48
  subtitleSize?: number;      // Mặc định: 28
  showAccentLine?: boolean;   // Mặc định: true
  enterDuration?: number;     // Frames cho animation vào
  exitDuration?: number;      // Frames cho animation ra
}
```

## Tính toán thời gian (FPS = 30)

| Thời gian | Frames |
|-----------|--------|
| 1 giây | 30 |
| 3 giây | 90 |
| 5 giây | 150 |
| 10 giây | 300 |

## Prompt mẫu

### Title Hook đầu video
```
Thêm B-roll title hook ở đầu video:
- Title: "Tiêu đề thu hút"
- Style: centered
- Animation: scale
- Màu nền: vàng, chữ đỏ
- Font: 64px
- Duration: 5 giây (150 frames)
```

### Lower-third giới thiệu
```
Thêm B-roll title lower-third ở giây thứ 10:
- Title: "Tên người"
- Subtitle: "Chức vụ"
- Style: lower-third
- Animation: slide-up
- Duration: 3 giây
```

### Badge góc
```
Thêm B-roll title badge:
- Title: "LIVE"
- Style: corner-badge
- Màu nền đỏ
- Hiển thị từ đầu đến hết video
```

## Files

- `src/components/BrollTitle.tsx` - Component chính
- `huongdan.md` - Hướng dẫn chi tiết

## Xem thêm

- [huongdan.md](huongdan.md) - Hướng dẫn đầy đủ với ví dụ
- [references/advanced-patterns.md](extracted/remotion-broll-title/references/advanced-patterns.md) - Patterns nâng cao
