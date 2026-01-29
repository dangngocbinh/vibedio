# Hướng dẫn sử dụng Layer Title trong Vibe Video

## Tổng quan

LayerTitle là component Remotion để hiển thị title/text overlay trên video. Được tích hợp sẵn trong OtioPlayer và có thể sử dụng qua file `project.otio`.

## Cách sử dụng trong Prompt

### 1. Thêm Title Hook ở đầu video

```
Thêm layer title ở đầu video:
- Title: "Nội dung tiêu đề"
- Style: centered
- Animation: scale
- Màu nền: vàng (#FFD700)
- Màu chữ: đỏ (#FF0000)
- Font size: 64
- Duration: 5 giây
```

### 2. Thêm Lower-third (góc dưới trái)

```
Thêm layer title lower-third ở giây thứ 10:
- Title: "Tên người nói"
- Subtitle: "Chức vụ"
- Style: lower-third
- Animation: slide-up
- Duration: 3 giây
```

### 3. Thêm Badge góc trên phải

```
Thêm layer title badge ở góc trên phải:
- Title: "LIVE" hoặc "HOT"
- Style: corner-badge
- Màu nền: đỏ
- Duration: toàn bộ video
```

## Cấu trúc trong project.otio

LayerTitle được thêm vào track "Title Overlays" trong file `project.otio`:

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
                    "title": "Tiêu đề của bạn",
                    "subtitle": "Phụ đề (tùy chọn)",
                    "style": "centered",
                    "animation": "scale",
                    "backgroundColor": "#FFD700",
                    "textColor": "#FF0000",
                    "accentColor": "#FF0000",
                    "fontSize": 64,
                    "showAccentLine": false
                }
            },
            "name": "Title Hook LayerTitle",
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "duration": {
                    "OTIO_SCHEMA": "RationalTime.1",
                    "rate": 30.0,
                    "value": 150.0
                },
                "start_time": {
                    "OTIO_SCHEMA": "RationalTime.1",
                    "rate": 30.0,
                    "value": 0.0
                }
            },
            "effects": [],
            "markers": [],
            "enabled": true,
            "color": null,
            "media_references": {},
            "active_media_reference_key": "DEFAULT_MEDIA"
        }
    ]
}
```

## Tham số Props

| Prop | Giá trị | Mặc định | Mô tả |
|------|---------|----------|-------|
| `title` | string | (bắt buộc) | Nội dung chính |
| `subtitle` | string | - | Nội dung phụ |
| `style` | `centered`, `lower-third`, `corner-badge`, `full-screen` | `lower-third` | Vị trí trên màn hình |
| `animation` | `scale`, `slide-up`, `slide-left`, `fade`, `typewriter` | `slide-up` | Hiệu ứng xuất hiện |
| `backgroundColor` | Mã màu | `rgba(6, 182, 79, 0.85)` | Màu nền |
| `textColor` | Mã màu | `#eb0000ff` | Màu chữ chính |
| `accentColor` | Mã màu | `#ffae00ff` | Màu accent (subtitle, viền) |
| `fontSize` | number | `48` | Cỡ chữ title |
| `subtitleSize` | number | `28` | Cỡ chữ subtitle |
| `showAccentLine` | boolean | `true` | Hiển thị viền accent bên trái |
| `enterDuration` | number | fps * 0.4 | Số frame cho animation vào |
| `exitDuration` | number | fps * 0.3 | Số frame cho animation ra |

## Styles chi tiết

### 1. `centered` - Ở giữa màn hình
- Chiếm 90% chiều rộng khung hình
- Chiều cao tối thiểu 40%
- Căn giữa cả ngang và dọc
- Phù hợp: Title hook, chapter titles, quotes

### 2. `lower-third` - Góc dưới trái
- Chiếm tối đa 60% chiều rộng
- Cách đáy 80px, cách trái 60px
- Có viền accent bên trái
- Phù hợp: Tên người nói, địa điểm

### 3. `corner-badge` - Góc trên phải
- Kích thước nhỏ gọn
- Cách trên 40px, cách phải 40px
- Bo góc 4px
- Phù hợp: Tags, status (LIVE, HOT, NEW)

### 4. `full-screen` - Toàn màn hình
- Phủ toàn bộ video
- Căn giữa nội dung
- Phù hợp: Intro/outro, transition screens

## Animations

| Animation | Mô tả | Phù hợp với |
|-----------|-------|-------------|
| `scale` | Zoom từ 0.8 lên 1.0 | centered, full-screen |
| `slide-up` | Trượt từ dưới lên | lower-third |
| `slide-left` | Trượt từ phải sang | corner-badge |
| `fade` | Mờ dần vào/ra | Tất cả |
| `typewriter` | Gõ từng chữ | quotes, captions |

## Tính toán thời gian

- **FPS**: 30 frames/giây
- **Duration**: Số frame = Số giây × 30
  - 3 giây = 90 frames
  - 5 giây = 150 frames
  - 10 giây = 300 frames
- **Start time**: Frame bắt đầu = Giây bắt đầu × 30
  - Đầu video = 0
  - Giây thứ 5 = 150 frames
  - Giây thứ 10 = 300 frames

## Thứ tự Track (quan trọng!)

Trong `project.otio`, thứ tự tracks từ trên xuống:
1. Images (video/image content)
2. Subtitles (TikTokCaption)
3. **Title Overlays** (LayerTitle) ← Đặt SAU Subtitles để hiển thị trên cùng
4. Voice (audio)
5. Background Music (audio)

## Ví dụ Prompt đầy đủ

```
Tạo video tin tức về [chủ đề].

Thêm layer title:
1. Title hook đầu video (frame 0-150):
   - Title: "Tiêu đề tin nóng"
   - Style: centered
   - Màu nền: vàng (#FFD700)
   - Màu chữ: đỏ (#FF0000)
   - Font: 64px
   - Animation: scale

2. Lower-third giới thiệu (frame 200-290):
   - Title: "Phóng viên Nguyễn Văn A"
   - Subtitle: "Đài truyền hình XYZ"
   - Style: lower-third
   - Animation: slide-up

3. Badge LIVE (frame 0 đến hết):
   - Title: "LIVE"
   - Style: corner-badge
   - Màu nền: đỏ (#FF0000)
```

## Lưu ý

1. **Vị trí track**: Title Overlays phải nằm SAU Subtitles track trong project.otio để hiển thị trên subtitle
2. **zIndex**: LayerTitle có zIndex: 100 để đảm bảo hiển thị trên các layer khác
3. **Font**: Sử dụng font Inter, system-ui làm mặc định
4. **Responsive**: fontSize sẽ được scale tự động theo style (centered: ×1.2, full-screen: ×1.5)
5. **Component name**: Trong OTIO metadata, sử dụng `"remotion_component": "LayerTitle"`
