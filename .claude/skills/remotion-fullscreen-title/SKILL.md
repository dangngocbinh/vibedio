---
name: remotion-fullscreen-title
description: Tạo Fullscreen Title Element cho Remotion - tiêu đề chiếm nguyên khung hình với hình nền gradient/solid/ảnh và chữ to rõ đẹp. Sử dụng cho intro, outro, chapter dividers, và các title screens nổi bật. Tích hợp với project.otio.
---

# Remotion Fullscreen Title Skill

Tạo các fullscreen title element chiếm **nguyên khung hình** với hình nền đẹp và typography nổi bật.

## Cách sử dụng (OTIO-based)

### Trong project.otio

Thêm track "Title Overlays" với FullscreenTitle clip:

```json
{
    "OTIO_SCHEMA": "Track.1",
    "name": "Title Overlays",
    "kind": "Video",
    "children": [
        {
            "OTIO_SCHEMA": "Clip.2",
            "metadata": {
                "remotion_component": "FullscreenTitle",
                "props": {
                    "title": "Tiêu đề chính",
                    "subtitle": "Phụ đề (tùy chọn)",
                    "backgroundType": "gradient",
                    "backgroundValue": "sunset",
                    "textStyle": "bold-shadow",
                    "animation": "zoom-fade",
                    "titleSize": 120,
                    "subtitleSize": 48
                }
            },
            "name": "Intro Title",
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "duration": { "rate": 30.0, "value": 150.0 },
                "start_time": { "rate": 30.0, "value": 0.0 }
            }
        }
    ]
}
```

## Background Types

| Type | Mô tả | Ví dụ backgroundValue |
|------|-------|----------------------|
| `solid` | Màu đơn sắc | `#FF5733`, `#1a1a2e` |
| `gradient` | Gradient đẹp | `sunset`, `ocean`, `fire`, `custom: #FF0000, #0000FF` |
| `image` | Ảnh nền | `public/images/bg.jpg` |
| `pattern` | Pattern lặp lại | `dots`, `lines`, `grid` |
| `video-blur` | Blur video phía dưới | `blur-20` (blur intensity) |

## Gradient Presets

| Preset | Colors | Mô tả |
|--------|--------|-------|
| `sunset` | Orange → Pink → Purple | Hoàng hôn ấm áp |
| `ocean` | Blue → Cyan → Teal | Đại dương mát mẻ |
| `fire` | Red → Orange → Yellow | Lửa rực rỡ |
| `forest` | Green → Emerald → Teal | Rừng xanh |
| `night` | Dark Blue → Purple → Black | Đêm huyền bí |
| `gold` | Gold → Yellow → Orange | Sang trọng |
| `neon` | Pink → Blue → Cyan | Neon hiện đại |
| `dark` | Black → Dark Gray | Tối giản |
| `light` | White → Light Gray | Sáng sủa |

## Text Styles

| Style | Effect | Use case |
|-------|--------|----------|
| `bold-shadow` | Chữ đậm + bóng đổ mạnh | Tiêu đề nổi bật |
| `glow` | Chữ phát sáng | Neon, gaming |
| `outline` | Viền chữ không fill | Modern, clean |
| `3d` | Hiệu ứng 3D layers | Eye-catching |
| `minimal` | Đơn giản, không hiệu ứng | Elegant, professional |
| `gradient-text` | Gradient trên chữ | Trendy, colorful |

## Animations

| Animation | Effect | Mô tả |
|-----------|--------|-------|
| `zoom-fade` | Zoom từ nhỏ + fade in | Mặc định, phổ biến |
| `slide-up-bounce` | Trượt lên + bounce | Năng động |
| `reveal-left` | Lộ ra từ trái | Professional |
| `blur-in` | Từ blur → rõ nét | Cinematic |
| `typewriter` | Gõ từng chữ | Narrative |
| `glitch` | Hiệu ứng nhiễu | Tech, gaming |
| `split` | Chữ tách ra rồi nhập | Creative |

## Props Reference

```typescript
interface FullscreenTitleProps {
  // === NỘI DUNG ===
  title: string;              // Bắt buộc: tiêu đề chính
  subtitle?: string;          // Tùy chọn: phụ đề

  // === HÌNH NỀN ===
  backgroundType?: 'solid' | 'gradient' | 'image' | 'pattern' | 'video-blur';
  backgroundValue?: string;   // Giá trị tương ứng với type
  backgroundOverlay?: string; // Overlay màu (vd: 'rgba(0,0,0,0.5)')

  // === CHỮ ===
  textStyle?: 'bold-shadow' | 'glow' | 'outline' | '3d' | 'minimal' | 'gradient-text';
  textColor?: string;         // Mặc định: '#ffffff'
  accentColor?: string;       // Màu subtitle/accent
  titleSize?: number;         // Mặc định: 96
  subtitleSize?: number;      // Mặc định: 36
  fontFamily?: string;        // Mặc định: 'Inter, system-ui'

  // === VỊ TRÍ ===
  verticalAlign?: 'top' | 'center' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
  padding?: number;           // Padding từ edges (px)

  // === ANIMATION ===
  animation?: string;         // Xem bảng Animations
  enterDuration?: number;     // Frames vào
  exitDuration?: number;      // Frames ra

  // === HIỆU ỨNG PHỤ ===
  showParticles?: boolean;    // Hiệu ứng hạt nền
  showVignette?: boolean;     // Viền tối xung quanh
}
```

## Tính toán thời gian (FPS = 30)

| Thời gian | Frames |
|-----------|--------|
| 3 giây | 90 |
| 5 giây | 150 |
| 7 giây | 210 |
| 10 giây | 300 |

## Prompt mẫu

### Intro Video hoành tráng
```
Thêm Fullscreen Title intro ở đầu video:
- Title: "TOP 10 SỰ THẬT"
- Subtitle: "BẠN CHƯA BIẾT"
- Background: gradient sunset
- Text style: bold-shadow
- Animation: zoom-fade
- Duration: 5 giây (150 frames)
```

### Chapter Divider tối giản
```
Thêm Fullscreen Title chapter ở giây 30:
- Title: "Chương 1"
- Subtitle: "Khởi đầu"
- Background: solid #1a1a2e
- Text style: minimal
- Animation: blur-in
- Duration: 3 giây
```

### Title Gaming/Tech
```
Thêm Fullscreen Title gaming:
- Title: "GAME REVIEW"
- Background: gradient neon
- Text style: glow
- Animation: glitch
- Show particles: true
- Duration: 4 giây
```

### Title với ảnh nền
```
Thêm Fullscreen Title với ảnh nền:
- Title: "VIỆT NAM ĐẸP"
- Background type: image
- Background value: public/images/vietnam.jpg
- Background overlay: rgba(0,0,0,0.4)
- Text style: bold-shadow
- Duration: 5 giây
```

## So sánh với BrollTitle

| Feature | BrollTitle | FullscreenTitle |
|---------|------------|-----------------|
| Kích thước | Partial (lower-third, corner, etc.) | Toàn màn hình |
| Hình nền | Chỉ màu đơn | Gradient, ảnh, pattern |
| Font size mặc định | 36-48px | 96-120px |
| Use case | Overlay nhỏ | Intro, outro, chapter |
| Hiệu ứng text | Cơ bản | Nâng cao (glow, 3D, outline) |
| Particles | Không | Có |

## Files

- `assets/FullscreenTitle.tsx` - Component chính (React/Remotion)
- `assets/BackgroundPresets.ts` - Các gradient/pattern presets
- `assets/useBackgroundAnimation.ts` - Hook cho hiệu ứng chuyển động nền động
- `huongdan.md` - Hướng dẫn chi tiết tiếng Việt cho người dùng No-code/Prompt

## Thứ tự Track trong project.otio

```
1. Images (Video) - Video/ảnh chính
2. Subtitles (Video) - Caption
3. Title Overlays (Video) - FullscreenTitle VÀ BrollTitle
4. Voice (Audio)
5. Background Music (Audio)
```

## Lưu ý quan trọng cho No-code (Vibe User)

1. **FullscreenTitle che toàn bộ màn hình** - Dùng cho những thời điểm cần title riêng biệt (Intro/Outro), không phải overlay khi đang phát video chính.
2. **Hỗ trợ chuyển động (Premium)** - Mặc định nền sẽ có chuyển động xoay/thu phóng nhẹ để tăng tính thẩm mỹ.
3. **zIndex 1000** - Đảm bảo hiển thị trên tất cả layers khác.
4. **Responsive** - Tự động scale theo kích thước video (tối ưu nhất cho 1920x1080).
5. **Dễ dàng tùy chỉnh**: Có thể chỉ định `animateBackground: false` nếu muốn nền tĩnh hoàn toàn.
