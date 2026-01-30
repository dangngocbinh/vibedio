# Hướng dẫn sử dụng Fullscreen Title trong Vibe Video

## Tổng quan

`FullscreenTitle` là component Remotion dùng để tạo các slide tiêu đề chiếm toàn bộ khung hình. Đây là công cụ mạnh mẽ để làm Intro, Outro, Chapter Dividers hoặc các Quote nổi bật với hiệu ứng hình ảnh cao cấp.

💡 **Xem trước hình ảnh tất cả các mẫu tại đây:** [Fullscreen Title Gallery Preview (HTML)](fullscreen-title-gallery.html)

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
            "template": "cinematic-intro",
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
| `template` | FullscreenTemplate | `default` | Chọn mẫu thiết kế sẵn (xem bên dưới) |
| `backgroundType` | `solid`, `gradient`, `image`, `pattern`, `video-blur` | `gradient` | Loại hình nền (dùng cho mode default) |
| `backgroundValue` | string | `dark` | Giá trị màu/preset/đường dẫn ảnh |
| `backgroundOverlay` | string | - | Overlay màu (vd: 'rgba(0,0,0,0.5)') |
| `textStyle` | `bold-shadow`, `glow`, `outline`, `3d`, `minimal`, `gradient-text` | `bold-shadow` | Kiểu hiển thị chữ |
| `animation` | `zoom-fade`, `slide-up-bounce`, `reveal-left`, `blur-in`, `typewriter`, `glitch`, `split`, `fade` | `zoom-fade` | Hiệu ứng xuất hiện |
| `titleSize` | number | 96 | Cỡ chữ tiêu đề chính |
| `subtitleSize` | number | 36 | Cỡ chữ phụ đề |
| `textColor` | string | `#ffffff` | Màu chữ chính |
| `accentColor` | string | `#00d4ff` | Màu nhấn (cho phụ đề/glow) |
| `fontFamily` | string | `Inter, Montserrat, system-ui` | Font chữ |
| `verticalAlign` | `top`, `center`, `bottom` | `center` | Căn chỉnh dọc |
| `horizontalAlign` | `left`, `center`, `right` | `center` | Căn chỉnh ngang |
| `padding` | number | 60 | Padding từ edges (px) |
| `showParticles` | boolean | `false` | Hiển thị hiệu ứng hạt bay lơ lửng |
| `showVignette` | boolean | `true` | Hiệu ứng tối dần ở 4 góc màn hình |
| `animateBackground` | boolean | `true` | Chuyển động nền (xoay/zoom nhẹ) |
| `enterDuration` | number | fps * 0.6 | Số frames cho animation vào |
| `exitDuration` | number | fps * 0.4 | Số frames cho animation ra |

## Danh sách Templates (Mới)
Sử dụng `template` prop để kích hoạt các thiết kế chuyên nghiệp này. Khi dùng template, các props về text style có thể bị ghi đè để đảm bảo đúng thiết kế.

| Template ID | Mô tả | Phong cách |
|-------------|-------|------------|
| `cinematic-intro` | Chữ mảnh, spacing rộng, có dòng kẻ | Phim điện ảnh, Intro sang trọng |
| `tech-hub` | Font monospace, màu xanh lá matrix | Công nghệ, Coding tutorial |
| `minimal-chapter` | Nền trắng, chữ đen đậm, tối giản | Vlog, Chapter divider |
| `bold-statement` | Chữ in hoa cực lớn, có badge cảnh báo | Thông báo quan trọng, Sale |
| `neon-night` | Hiệu ứng đèn neon rực rỡ, viền sáng | Gaming, Nightlife, Cyberpunk |
| `gradient-dream` | Text gradient pastel nhẹ nhàng | Vlog chill, Beauty, Fashion |
| `retro-pop` | Phong cách Pop Art 90s, màu tương phản | Vui nhộn, Năng động |
| `breaking-news-full` | Giao diện bản tin thời sự toàn màn hình | Tin tức, Sự kiện nóng |
| `quote-hero` | Dấu ngoặc kép lớn, font serif nghiêng | Trích dẫn câu nói hay |
| `split-screen` | Màn hình chia đôi 2 màu tương phản | So sánh Before/After, Đối lập |
| `space-odyssey` | Chữ cực mảnh, spacing cực rộng, hiệu ứng vũ trụ | Intro phim viễn tưởng, không gian |
| `luxury-gold` | Chữ vàng kim gradient sang trọng | Thời trang cao cấp, Event quý tộc |
| `nature-vibes` | Font serif nghiêng, màu sắc thiên nhiên | Vlog du lịch, môi trường, organic |
| `cyberpunk-glitch` | Chữ nghiêng, đổ bóng màu cyan/magenta | Tech, Gaming, Future City |
| `vintage-film` | Phong cách phim cũ, tông màu sepia | Hoài niệm, lịch sử, retro |
| `liquid-motion` | Chữ lớn, tương phản cực cao trên nền lỏng | Nghệ thuật hiện đại, music video |
| `magazine-cover` | Layout bìa tạp chí, chữ đè chữ | Fashion, Lifestyle, Phóng sự |
| `industrial-steel` | Tông màu kim loại, viền sắc cạnh | Xây dựng, công nghiệp, cơ khí |
| `ink-wash` | Phong cách tranh thủy mặc, loang mực | Văn hóa, nghệ thuật truyền thống |
| `floating-bubbles` | Chữ mỏng trên nền các hạt bokeh | Mơ mộng, nhẹ nhàng, cinematic |
| `gaming-stream` | Có badge "LIVE NOW", viền sáng rực | Streamer, Esports, Gaming video |
| `architect-blueprint` | Đường kẻ lưới kỹ thuật, font monospace | Kiến trúc, thiết kế, quy hoạch |
| `comic-kaboom` | Chữ nằm trong khung thoại pop art | Vui nhộn, truyện tranh, hành động |
| `holographic-lens` | Màu sắc lăng kính, hiệu ứng chiếu 3D | Sci-fi, công nghệ tương lai |
| `abstract-waves` | Chữ chuyển động nhẹ nhàng như sóng | Trình diễn nghệ thuật, intro mượt |
| `midnight-mystery` | Chữ ẩn hiện trong bóng tối, bí ẩn | Phim trinh thám, kinh dị, bí mật |
| `paper-cutout` | Hiệu ứng lớp cắt giấy, đổ bóng sâu | Craft, handmade, vlog trẻ em |
| `brush-stroke` | Chữ trên nền vết cọ quét sơn | Nghệ thuật, tự do, Creative |
| `strobe-light` | Hiệu ứng nhấp nháy mạnh, năng lượng cao | Music, Party, High energy |
| `sunset-serenity` | Tông màu hoàng hôn ấm áp, thanh bình | Storytelling, cảm xúc, healing |
| `urban-graffiti` | Phong cách vẽ tường đường phố | Hip-hop, Street life, Youth culture |
| `frozen-pixel` | Viền băng xanh lạnh, phong cách pixel | Game retro, mùa đông, công nghệ |
| `royal-velvet` | Tông vàng/tím sang trọng hoàng gia | Tài liệu lịch sử, đồ trang sức |
| `eco-green` | Khung hữu cơ, tông màu xanh lá | Môi trường, lối sống xanh, sạch |
| `data-stream` | Chữ chạy như dòng dữ liệu matrix | Hacking, Big Data, Security |
| `pop-shock` | Màu vàng/hồng đối lập mạnh | Sale, Shocking news, Viral content |
| `shadow-play` | Bóng đổ dài từ chữ lớn | Tối giản, nghệ thuật đổ bóng |
| `geometric-grid` | Khung hình học cân đối | Toán học, logic, chính xác |
| `watercolor-bleed` | Màu nước loang mờ ảo | Mỹ thuật, lãng mạn, tinh tế |
| `glassmorphism-pro` | Kính mờ siêu thực, bo góc mịn | App showcase, UI/UX, Premium tech |

## Danh sách Preset Hình nền (Cho Default Mode)

### 1. Gradients (`backgroundType: "gradient"`)
- `sunset`: Cam → Hồng → Tím (Hoàng hôn)
- `ocean`: Xanh dương → Cyan (Đại dương)
- `fire`: Đỏ → Vàng (Lửa)
- `forest`: Xanh lá → Emerald (Rừng)
- `night`: Xanh đậm → Đen (Đêm)
- `gold`: Vàng kim huyền ảo
- `neon`: Hồng → Xanh dương → Tím (Hiện đại)
- `dark`: Xám đậm → Đen (Tối giản)
- `light`: Trắng → Xám nhạt (Sáng sủa)

### 2. Patterns (`backgroundType: "pattern"`)
- `dots`: Chấm nhỏ li ti
- `grid`: Lưới vuông công nghệ
- `lines`: Đường kẻ chéo
- `checkerboard`: Bàn cờ mờ

### 3. Solid (`backgroundType: "solid"`)
Sử dụng bất kỳ mã màu nào: `#FF5733`, `#1a1a2e`, `rgba(0,0,0,0.8)`

### 4. Image (`backgroundType: "image"`)
Đường dẫn đến ảnh: `public/images/bg.jpg`, `https://...`

### 5. Video Blur (`backgroundType: "video-blur"`)
Blur video phía dưới: `blur-20` (blur intensity)

## Text Styles

| Style | Effect | Use Case |
|-------|--------|----------|
| `bold-shadow` | Chữ đậm + bóng đổ mạnh | Tiêu đề nổi bật, mặc định |
| `glow` | Chữ phát sáng | Neon, gaming, tech |
| `outline` | Viền chữ không fill | Modern, clean |
| `3d` | Hiệu ứng 3D layers | Eye-catching, retro |
| `minimal` | Đơn giản, không hiệu ứng | Elegant, professional |
| `gradient-text` | Gradient trên chữ | Trendy, colorful |

## Animations

| Animation | Effect | Best For |
|-----------|--------|----------|
| `zoom-fade` | Zoom từ nhỏ + fade in | Mặc định, phổ biến |
| `slide-up-bounce` | Trượt lên + bounce | Năng động, vui tươi |
| `reveal-left` | Lộ ra từ trái | Professional |
| `blur-in` | Từ blur → rõ nét | Cinematic |
| `typewriter` | Gõ từng chữ | Narrative, storytelling |
| `glitch` | Hiệu ứng nhiễu | Tech, gaming |
| `split` | Chữ tách ra rồi nhập | Creative |
| `fade` | Fade in/out đơn giản | Minimal |

## Gợi ý Phối hợp (Design Tips)

1. **Cho Gaming**: Dùng `backgroundValue: "neon"`, `textStyle: "glow"`, và `animation: "glitch"`.
2. **Cho Tin tức/Sự thật**: Dùng `backgroundValue: "dark"`, `textStyle: "bold-shadow"`, và `animation: "zoom-fade"`.
3. **Cho Storytelling/Kể chuyện**: Dùng `backgroundType: "image"` với ảnh mờ, kết hợp `animation: "typewriter"`.
4. **Cho Chapter**: Nên dùng `animation: "blur-in"` hoặc `reveal-left` để tạo cảm giác chuyên nghiệp.
5. **Cho Motivational**: Dùng `backgroundValue: "sunset"`, `textStyle: "3d"`, `showParticles: true`.

## So sánh với LayerTitle

| Feature | LayerTitle | FullscreenTitle |
|---------|------------|-----------------|
| Kích thước | Partial (lower-third, corner, etc.) | Toàn màn hình |
| Hình nền | Chỉ màu đơn | Gradient, ảnh, pattern |
| Font size mặc định | 36-48px | 96-120px |
| Use case | Overlay nhỏ trên video | Intro, outro, chapter |
| Hiệu ứng text | Cơ bản | Nâng cao (glow, 3D, outline) |
| Particles | Không | Có |
| Background animation | Không | Có (xoay/zoom nhẹ) |
| zIndex | 100 | 1000 |

## Lưu ý kỹ thuật

1. **Thứ tự Track**: Đặt track chứa `FullscreenTitle` ở trên các track video khác nếu muốn nó che toàn bộ video cũ (mặc dù nó có hình nền riêng).
2. **zIndex**: zIndex mặc định là `1000` để đảm bảo luôn nằm trên cùng.
3. **Responsive**: Component tự động scale cỡ chữ theo độ phân giải video (tối ưu nhất cho 1920x1080).
4. **Font**: Tự động sử dụng font hệ thống hoặc "Inter", "Montserrat" nếu có.
5. **Component name**: Trong OTIO metadata, sử dụng `"remotion_component": "FullscreenTitle"`
6. **Background animation**: Mặc định bật (`animateBackground: true`), set `false` nếu muốn nền tĩnh hoàn toàn.

## Ví dụ đầy đủ

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
            "textColor": "#ffffff",
            "accentColor": "#FFD700",
            "animation": "zoom-fade",
            "titleSize": 120,
            "subtitleSize": 48,
            "showParticles": true,
            "showVignette": true,
            "animateBackground": true,
            "verticalAlign": "center",
            "horizontalAlign": "center"
        }
    },
    "name": "Intro Title",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": 30.0, "value": 150.0 },
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
}
```
