# Hướng dẫn sử dụng Fullscreen Title trong Vibe Video

## Tổng quan

`FullscreenTitle` là component Remotion dùng để tạo các slide tiêu đề chiếm toàn bộ khung hình. Đây là công cụ mạnh mẽ để làm Intro, Outro, Chapter Dividers hoặc các Quote nổi bật với hiệu ứng hình ảnh cao cấp.

## Cách sử dụng trong Prompt

Để sử dụng Fullscreen Title, bạn có thể yêu cầu AI thêm vào `project.otio` bằng các lệnh như:

### 1. Tạo Intro hoành tráng
```text
Thêm Fullscreen Title Intro ở đầu video:
- Title: "BÍ MẬT VŨ TRỤ"
- Subtitle: "KHÁM PHÁ NHỮNG ĐIỀU CHƯA BIẾT"
- Background: gradient sunset
- Text style: bold-shadow
- Animation: zoom-fade
- Show particles: true
- Duration: 5 giây
```

### 2. Tạo Chapter Divider (Phân đoạn)
```text
Thêm Fullscreen Title Chapter ở giây thứ 30:
- Title: "Chương 2"
- Subtitle: "Cuộc phiêu lưu bắt đầu"
- Background: gradient dark
- Text style: minimal
- Animation: blur-in
- Duration: 3 giây
```

### 3. Tạo Outro / Kết thúc
```text
Thêm Fullscreen Title Outro ở cuối video:
- Title: "CẢM ƠN ĐÃ THEO DÕI"
- Subtitle: "Đừng quên Like và Subscribe"
- Background: gradient night
- Text style: 3d
- Animation: slide-up-bounce
- Duration: 4 giây
```

## Cấu trúc trong project.otio

Component được khai báo trong track "Title Overlays" (hoặc track tương đương xử lý layer trên cùng):

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "TIÊU ĐỀ CHÍNH",
            "subtitle": "Phụ đề bên dưới",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "textStyle": "bold-shadow",
            "animation": "zoom-fade",
            "showParticles": true,
            "titleSize": 120
        }
    },
    "name": "Full Title Clip",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": 30.0, "value": 150.0 },
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
}
```

## Tham số Props (Chi tiết)

| Prop | Kiểu dữ liệu | Mặc định | Mô tả |
|------|--------------|----------|-------|
| `title` | string | (Bắt buộc) | Nội dung tiêu đề chính |
| `subtitle` | string | - | Nội dung phụ đề bên dưới |
| `backgroundType` | `solid`, `gradient`, `image`, `pattern` | `gradient` | Loại hình nền |
| `backgroundValue` | string | `dark` | Giá trị màu/preset/đường dẫn ảnh |
| `textStyle` | `bold-shadow`, `glow`, `outline`, `3d`, `minimal`, `gradient-text` | `bold-shadow` | Kiểu hiển thị chữ |
| `animation` | `zoom-fade`, `slide-up-bounce`, `reveal-left`, `blur-in`, `typewriter`, `glitch`, `fade` | `zoom-fade` | Hiệu ứng xuất hiện |
| `titleSize` | number | 96 | Cỡ chữ tiêu đề chính |
| `subtitleSize` | number | 36 | Cỡ chữ phụ đề |
| `textColor` | string | `#ffffff` | Màu chữ chính |
| `accentColor` | string | `#00d4ff` | Màu nhấn (cho phụ đề/glow) |
| `showParticles` | boolean | `false` | Hiển thị hiệu ứng hạt bay lơ lửng |
| `showVignette` | boolean | `true` | Hiệu ứng tối dần ở 4 góc màn hình |

## Danh sách Preset Hình nền

### 1. Gradients (`backgroundType: "gradient"`)
- `sunset`: Cam -> Hồng -> Tím (Hoàng hôn)
- `ocean`: Xanh dương -> Cyan (Đại dương)
- `fire`: Đỏ -> Vàng (Lửa)
- `neon`: Hồng -> Xanh dương -> Tím (Hiện đại)
- `night`: Xanh đậm -> Đen (Đêm)
- `gold`: Vàng kim huyền ảo
- `dark`: Xám đậm -> Đen (Tối giản)
- `cyber`: Xanh lá -> Xanh dương (Công nghệ)

### 2. Patterns (`backgroundType: "pattern"`)
- `dots`: Chấm nhỏ li ti
- `grid`: Lưới vuông công nghệ
- `lines`: Đường kẻ chéo
- `checkerboard`: Bàn cờ mờ

## Gợi ý Phối hợp (Design Tips)

1. **Cho Gaming**: Dùng `backgroundValue: "neon"`, `textStyle: "glow"`, và `animation: "glitch"`.
2. **Cho Tin tức/Sự thật**: Dùng `backgroundValue: "dark"`, `textStyle: "bold-shadow"`, và `animation: "zoom-fade"`.
3. **Cho Storytelling/Kể chuyện**: Dùng `backgroundType: "image"` với ảnh mờ, kết hợp `animation: "typewriter"`.
4. **Cho Chapter**: Nên dùng `animation: "blur-in"` hoặc `reveal-left` để tạo cảm giác chuyên nghiệp.

## Lưu ý kỹ thuật

1. **Thứ tự Track**: Đặt track chứa `FullscreenTitle` ở trên các track video khác nếu muốn nó che toàn bộ video cũ (mặc dù nó có hình nền riêng).
2. **zIndex**: zIndex mặc định là `1000` để đảm bảo luôn nằm trên cùng.
3. **Responsive**: Component tự động scale cỡ chữ theo độ phân giải video (tối ưu nhất cho 1920x1080).
4. **Font**: Tự động sử dụng font hệ thống hoặc "Inter", "Montserrat" nếu có.
