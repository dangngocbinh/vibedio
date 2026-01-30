# Call To Action (CTA) Component Guide

Cung cấp **40 templates** cho các nút kêu gọi hành động, thông báo, và social media overlays.

## Usage

Thêm vào OTIO timeline như một clip trong track "Title Overlays" (nên đặt layer trên cùng).

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "CallToAction",
        "props": {
            "template": "classic-youtube",
            "title": "SUBSCRIBE",
            "subtitle": "1.2M Subscribers",
            "primaryColor": "#FF0000"
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `template` | string | `classic-youtube` | Tên mẫu interface (xem danh sách dưới) |
| `title` | string | (varies) | Nội dung chính (e.g., "Subscribe", "Buy Now") |
| `subtitle` | string | (optional) | Nội dung phụ (e.g., "@username", "50% Off") |
| `primaryColor` | string | `#ff0000` | Màu chủ đạo (nút, icon, viền) |
| `secondaryColor`| string | `#ffffff` | Màu phụ/nền |
| `textColor` | string | `#000000` | Màu chữ |
| `fontSize` | number | 32 | Kích thước chữ cơ bản |

## Template Library

### 1. Social Media & Platforms

| Template ID | Description | Default Text |
|-------------|-------------|--------------|
| `classic-youtube` | Pill màu trắng với nút đỏ Subscribe | "SUBSCRIBE" |
| `minimal-subscribe` | Pill đen đơn giản, chữ trắng đậm | "SUBSCRIBE" |
| `social-instagram` | Icon IG gradient + handle | "Follow" |
| `social-tiktok` | Hiệu ứng glitch TikTok màu đen | "Follow" |
| `social-facebook` | Nút Like Facebook xanh dương | "Like us" |
| `social-twitter` | Nút Follow X đen | "Follow" |
| `notification-bell` | Chuông rung nhắc nhở | "Turn on Notifications" |
| `channel-footer` | Thanh thông tin kênh cuối màn hình | "Subscribe" |
| `join-discord` | Nút Discord màu xanh tím | "Join Discord" |
| `patreon-support` | Nút Patreon màu đỏ cam | "Support on Patreon" |

### 2. Actions & Commercial

| Template ID | Description | Default Text |
|-------------|-------------|--------------|
| `swipe-up` | Mũi tên chỉ lên + Text (cho Stories) | "Swipe Up" |
| `app-store` | Nút Download App Store chuẩn | "Download on App Store" |
| `play-store` | Nút Google Play chuẩn | "Get it on Google Play" |
| `website-visit` | Thanh địa chỉ web đơn giản | "www.site.com" |
| `shop-now` | Nút mua sắm với icon túi | "SHOP NOW" |
| `discount-badge` | Huy hiệu giảm giá tròn xoay nhẹ | "50% OFF" |
| `newsletter-signup` | Mô phỏng form nhập email | "Sign Up" |
| `like-comment-share`| 3 hành động tương tác ngang | "Like Comment Share" |
| `qrcode-scan` | Khung QR Code giả lập | "SCAN ME" |
| `location-pin` | Icon bản đồ + nút chỉ đường | "Visit Us" |

### 3. Generic Buttons

| Template ID | Description | Style Note |
|-------------|-------------|------------|
| `generic-blue` | Nút xanh dương cơ bản | Bootstrap style |
| `generic-gradient` | Nút gradient hiện đại | Cyan to Green |
| `generic-outline` | Nút viền trong suốt | Minimalist |
| `generic-3d` | Nút khối 3D retro | Vàng/Đen |
| `marketing-pill` | Pill nhỏ gọn marketing | Màu cam |

### 4. Effects & Styles

| Template ID | Description | Style Note |
|-------------|-------------|------------|
| `neon-pulse` | Khung neon phát sáng | Cyberpunk |
| `cyberpunk-glitch` | Khung lỗi kỹ thuật số | Hacker style |
| `retro-pixel` | Khung game 8-bit | Gaming |
| `hand-drawn` | Khung vẽ tay nguệch ngoạc | Artistic |
| `speech-bubble` | Bong bóng hội thoại comic | Fun |
| `glassmorphism` | Hiệu ứng kính mờ | Modern UI |
| `modern-float` | Nút nổi đổ bóng mềm | Clean |
| `corner-ribbon` | Ruy băng góc màn hình | "NEW", "SALE" |
| `search-bar` | Thanh tìm kiếm mô phỏng | Search visual |
| `loading-complete` | Thanh loading chạy xong | Progress bar |

### 5. Interactive & Misc

| Template ID | Description | Animation |
|-------------|-------------|-----------|
| `mouse-cursor` | Con trỏ chuột click vào nút | Click loop |
| `finger-tap` | Ngón tay chạm vào nút | Tap loop |
| `live-badge` | Huy hiệu LIVE đỏ nhấp nháy | Pulse alpha |
| `upcoming-event` | Thẻ lịch sự kiện | Static |
| `review-stars` | 5 sao vàng + kêu gọi rate | Static |
