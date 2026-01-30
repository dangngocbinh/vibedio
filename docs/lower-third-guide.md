# Lower Third Templates Guide

Tài liệu này hướng dẫn chi tiết cách sử dụng 40 mẫu thiết kế sẵn của component `LowerThird`.

💡 **Xem trước hình ảnh tất cả các mẫu tại đây:** [Lower Third Gallery Preview (HTML)](lower-third-gallery.html)

## 1. Cách sử dụng cơ bản

Trong file OTIO, bạn có thể thêm clip `LowerThird` vào track "Title Overlays" (vốn được đặt trên cùng của timeline).

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "LowerThird",
        "props": {
            "title": "Tên Người Nói",
            "subtitle": "Chức danh / Mô tả",
            "template": "modern-skew",
            "primaryColor": "#3498db"
        }
    }
}
```

## 2. Danh sách 40 Templates theo nhóm

### Nhóm 1: Modern & Basic (Chuyên nghiệp & Cơ bản)
*   **modern-skew**: Thiết kế nghiêng mạnh mẽ, phù hợp các video hiện đại, vlog.
*   **minimal-bold**: Tối giản, chữ in đậm cực kỳ rõ ràng trên nền tối.
*   **playful-round**: Thân thiện, bo góc tròn, màu sắc tươi tắn.
*   **corporate-clean**: Thanh lịch, chuyên nghiệp, phù hợp video doanh nghiệp.

### Nhóm 2: Elegant & Luxury (Sang trọng)
*   **elegant-serif**: Sử dụng font có chân (Serif), chữ nghiêng, cực kỳ sang trọng.
*   **luxury-gold**: Chữ hiệu ứng nhũ vàng (Gold foil), dành cho video cao cấp.
*   **wedding-floral**: Mềm mại, lãng mạn, phù hợp video cưới hỏi, sự kiện.
*   **glass-modern**: Hiệu ứng kính mờ (Glassmorphism), nền tối bán trong suốt.

### Nhóm 3: Broadcast & News (Truyền hình & Tin tức)
*   **breaking-news**: Mẫu thanh đỏ/trắng kinh điển của các bản tin nóng.
*   **classic-tv**: Phong cách bản tin truyền hình thập niên 90.
*   **sports-ticker**: Dạng thanh dài chạy ngang, chuyên cho tỉ số, tin thể thao.
*   **documentary-sidebar**: Chữ xuất hiện ở lề dọc, phong cách phim tài liệu.

### Nhóm 4: Social Media (Mạng xã hội)
*   **social-youtube**: Có icon nút Play tròn, phong cách nút Subscribe.
*   **social-insta**: Hiệu ứng gradient đặc trưng của Instagram.
*   **ribbon-tag**: Dạng ruy băng uốn lượn từ lề màn hình vào.

### Nhóm 5: Creative Arts (Nghệ thuật & Sáng tạo)
*   **hand-drawn**: Hiệu ứng vẽ tay, nét nguệch ngoạc cá tính.
*   **brush-stroke**: Nền là một vệt cọ vẽ màu sắc.
*   **ink-bleed**: Chữ hiện ra như vết mực loang trên giấy.
*   **origami**: Hiệu ứng gấp giấy 3D tinh tế.
*   **comic-pop**: Phong cách truyện tranh Marvel/DC với màu sắc rực rỡ.

### Nhóm 6: Tech & Futuristic (Công nghệ & Tương lai)
*   **tech-grid**: Hiệu ứng lưới tọa độ, báo cáo hệ thống.
*   **cyberpunk-hud**: Giao diện điều khiển (HUD) màu Neon Cyan.
*   **hologram**: Hiệu ứng hình chiếu 3D, có các đường scanline mờ.
*   **blueprint**: Bản vẽ kỹ thuật trên nền xanh sọc trắng.
*   **industrial-steel**: Bề mặt kim loại xám, phong cách công nghiệp nặng.

### Nhóm 7: Dynamic Effects (Hiệu ứng chuyển động mạnh)
*   **split-reveal**: Chữ tách đôi và hiện ra từ giữa dòng kẻ.
*   **gradient-wave**: Dải màu Gradient chuyển động mềm mại.
*   **neon-glow**: Chữ phát sáng rực rỡ như đèn Neon.
*   **gaming-glitch**: Hiệu ứng nhiễu sóng kỹ thuật số (Glitch), giật khung hình.
*   **liquid-motion**: Nền chuyển động uốn lượn như chất lỏng.
*   **confetti**: Có các hạt giấy màu sắc bay quanh khi tiêu đề xuất hiện.
*   **border-animate**: Khung viền chạy quanh chữ khi xuất hiện.
*   **shadow-stack**: Nhiều lớp bóng đổ tạo độ sâu 3D.
*   **floating-bubbles**: Các khối chữ hình bong bóng bay lơ lửng.
*   **stencil-cut**: Chữ đục lỗ trên một khối màu.

### Nhóm 8: Nature & Theme (Tự nhiên & Chủ đề đặc biệt)
*   **nature-eco**: Tông màu xanh lá, lá mầm, phù hợp video môi trường.
*   **space-cosmos**: Chữ thưa, lung linh, phong cách vũ trụ.
*   **chalkboard**: Chữ viết phấn trên bảng xanh/đen thô ráp.
*   **quote-box**: Có dấu ngoặc kép lớn, chuyên dùng để trích dẫn lời nói.

## 3. Các thuộc tính tùy chỉnh (Props)

| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
|------------|-------------|----------|-------|
| `title` | string | (Bắt buộc) | Nội dung chính |
| `subtitle` | string | undefined | Nội dung phụ (chức danh, handle...) |
| `template` | string | `modern-skew` | Chọn 1 trong 40 mẫu trên |
| `primaryColor` | string | `#3498db` | Màu chủ đạo của template |
| `secondaryColor` | string | `#ffffff` | Màu phụ (thường là màu nền phụ) |
| `textColor` | string | `#2c3e50` | Màu chữ (nếu template hỗ trợ) |
| `fontSize` | number | 42 | Kích thước chữ tiêu đề chính |
