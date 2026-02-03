# FullscreenTitle - Responsive System

## 🎯 Tổng Quan

Component `FullscreenTitle` đã được nâng cấp với **hệ thống responsive thông minh**, tự động điều chỉnh kích thước chữ, padding, và layout dựa trên **aspect ratio** của video.

## ✨ Tính Năng Mới

- ✅ **Tự động phát hiện aspect ratio** (9:16, 4:5, 1:1, 16:9)
- ✅ **Scale thông minh** dựa trên dimension phù hợp
- ✅ **Typography tối ưu** cho từng loại khung hình
- ✅ **Word wrap tự động** - không lo text bị tràn
- ✅ **Safe area** - text không bị cắt ở các cạnh
- ✅ **40+ templates** đều responsive

## 📊 Aspect Ratios Được Hỗ Trợ

### 1. 9:16 - Vertical (TikTok/Reels/Shorts)
- **Kích thước**: 1080×1920
- **Title**: Giảm 35% (0.65×)
- **Subtitle**: Giảm 30% (0.7×)
- **Padding**: Giảm 40% (0.6×)
- **Max Width**: 90%

### 2. 4:5 - Instagram Post
- **Kích thước**: 1080×1350
- **Title**: Giảm 25% (0.75×)
- **Subtitle**: Giảm 20% (0.8×)
- **Padding**: Giảm 40% (0.6×)
- **Max Width**: 90%

### 3. 1:1 - Square
- **Kích thước**: 1080×1080
- **Title**: Giảm 15% (0.85×)
- **Subtitle**: Giảm 15% (0.85×)
- **Padding**: Giảm 30% (0.7×)
- **Max Width**: 88%

### 4. 16:9 - Horizontal (YouTube/TV)
- **Kích thước**: 1920×1080
- **Title**: Không giảm (1.0×)
- **Subtitle**: Không giảm (1.0×)
- **Padding**: Không giảm (1.0×)
- **Max Width**: 94%

## 🚀 Cách Sử Dụng

### Sử Dụng Cơ Bản

```typescript
import { FullscreenTitle } from './components/FullscreenTitle';

// Component tự động responsive - không cần config gì thêm!
<FullscreenTitle
  title="TÊN VIDEO CỦA BẠN"
  subtitle="Mô tả ngắn gọn"
  template="default"
/>
```

### Video 9:16 (TikTok/Reels)

```typescript
// Trong remotion.config.ts hoặc Composition
width: 1080,
height: 1920,

// Component tự động scale xuống phù hợp
<FullscreenTitle
  title="VIRAL VIDEO TITLE"
  subtitle="Trending Now"
  titleSize={96}  // → Tự động scale xuống ~62px
/>
```

### Video 16:9 (YouTube)

```typescript
// Trong remotion.config.ts hoặc Composition
width: 1920,
height: 1080,

// Component giữ nguyên size
<FullscreenTitle
  title="YOUTUBE VIDEO TITLE"
  subtitle="Subscribe for more"
  titleSize={96}  // → Giữ nguyên 96px
/>
```

### Text Dài

```typescript
// Tự động xuống dòng - không lo overflow
<FullscreenTitle
  title="TIÊU ĐỀ RẤT DÀI SẼ TỰ ĐỘNG XUỐNG DÒNG KHI CẦN THIẾT"
  subtitle="Subtitle cũng tự động xuống dòng nếu quá dài"
/>
```

## 📐 Công Thức Tính Toán

### Base Scale Factor

```typescript
if (aspectRatio < 0.75) {
  // Vertical: Scale theo width
  baseScaleFactor = width / 1080;
} else if (aspectRatio >= 0.75 && aspectRatio <= 1.25) {
  // Square: Scale theo dimension nhỏ nhất
  baseScaleFactor = Math.min(width / 1080, height / 1080);
} else {
  // Horizontal: Scale theo height
  baseScaleFactor = height / 1080;
}
```

### Final Size

```typescript
finalSize = originalSize × baseScaleFactor × multiplier
```

### Ví Dụ Cụ Thể

**9:16 (1080×1920)**
```
titleSize = 96
baseScaleFactor = 1080 / 1080 = 1.0
titleSizeMultiplier = 0.65
finalTitleSize = 96 × 1.0 × 0.65 = 62.4px
```

**16:9 (1920×1080)**
```
titleSize = 96
baseScaleFactor = 1080 / 1080 = 1.0
titleSizeMultiplier = 1.0
finalTitleSize = 96 × 1.0 × 1.0 = 96px
```

## 🎨 Templates

Tất cả 40+ templates đều tự động responsive:

```typescript
// Cinematic Intro - Responsive cho mọi aspect ratio
<FullscreenTitle template="cinematic-intro" />

// Neon Night - Tự động điều chỉnh
<FullscreenTitle template="neon-night" />

// Glassmorphism Pro - Hoạt động hoàn hảo
<FullscreenTitle template="glassmorphism-pro" />
```

## 🧪 Testing

### Chạy Demo Compositions

```bash
npm run dev
```

Sau đó xem các compositions demo:
- `FullscreenTitle-9x16` - Test vertical
- `FullscreenTitle-4x5` - Test Instagram
- `FullscreenTitle-1x1` - Test square
- `FullscreenTitle-16x9` - Test horizontal
- `FullscreenTitle-LongText-9x16` - Test text dài

### Test Với Project Của Bạn

1. Thay đổi `width` và `height` trong composition
2. Xem preview trong Remotion Player
3. Text sẽ tự động điều chỉnh!

## 📚 Tài Liệu Chi Tiết

- **[RESPONSIVE-GUIDE.md](./RESPONSIVE-GUIDE.md)** - Hướng dẫn chi tiết
- **[RESPONSIVE-COMPARISON.md](./RESPONSIVE-COMPARISON.md)** - So sánh các aspect ratio
- **[ResponsiveDemo.tsx](./ResponsiveDemo.tsx)** - Demo compositions

## 🎯 Best Practices

### 1. Chọn Title Size Phù Hợp

```typescript
// ❌ KHÔNG TỐT - Size quá nhỏ cho vertical
<FullscreenTitle titleSize={60} /> // → ~39px trên 9:16

// ✅ TỐT - Size vừa phải
<FullscreenTitle titleSize={96} /> // → ~62px trên 9:16

// ✅ TỐT HƠN - Size lớn hơn cho vertical
<FullscreenTitle titleSize={120} /> // → ~78px trên 9:16
```

### 2. Font Family

```typescript
// Chọn font dễ đọc cho mobile (9:16)
<FullscreenTitle 
  fontFamily="Montserrat"  // Sans-serif dễ đọc
  titleSize={100}
/>

// Font nghệ thuật cho desktop (16:9)
<FullscreenTitle 
  fontFamily="Lobster"  // Script font
  titleSize={96}
/>
```

### 3. Templates

```typescript
// Minimal templates cho vertical (ít clutter)
<FullscreenTitle template="minimal-chapter" />

// Complex templates cho horizontal (nhiều không gian)
<FullscreenTitle template="magazine-cover" />
```

## 🔧 Customization

### Override Responsive Behavior

Nếu bạn muốn tự control size:

```typescript
// Tính toán size riêng cho từng aspect ratio
const { width, height } = useVideoConfig();
const aspectRatio = width / height;

const customTitleSize = aspectRatio < 0.75 
  ? 80   // Vertical
  : 120; // Horizontal

<FullscreenTitle titleSize={customTitleSize} />
```

### Adjust Padding

```typescript
// Padding nhỏ hơn cho vertical
const customPadding = aspectRatio < 0.75 ? 40 : 60;

<FullscreenTitle padding={customPadding} />
```

## 🐛 Troubleshooting

### Text Bị Cắt

```typescript
// Giảm titleSize hoặc padding
<FullscreenTitle 
  titleSize={80}  // Thay vì 96
  padding={40}    // Thay vì 60
/>
```

### Text Quá Nhỏ

```typescript
// Tăng titleSize
<FullscreenTitle 
  titleSize={120}  // Thay vì 96
/>
```

### Text Không Xuống Dòng

```typescript
// Component tự động xuống dòng
// Nếu vẫn không xuống dòng, check maxWidth
<FullscreenTitle 
  title="Text dài sẽ tự động xuống dòng"
  // maxWidth được tính tự động
/>
```

## 📊 Visual Guides

### Aspect Ratio Comparison
![Aspect Ratios](./responsive_aspect_ratios.png)

### Scaling System
![Scale Factors](./responsive_scale_factors.png)

## 🎓 Technical Details

### Code Changes

1. **Aspect Ratio Detection** (Line 442-450)
2. **Scale Factor Calculation** (Line 452-483)
3. **Text Styles Enhancement** (Line 116-202)
4. **Max Width Application** (Line 540)

### Performance

- ✅ Zero performance impact
- ✅ Calculations done once per frame
- ✅ No re-renders
- ✅ Optimized for Remotion

## 🤝 Contributing

Nếu bạn muốn thêm aspect ratio mới hoặc cải thiện responsive:

1. Edit `FullscreenTitle.tsx` (Line 442-483)
2. Update multipliers
3. Test với demo compositions
4. Update documentation

## 📝 Changelog

### Version 2.0 (2026-02-03)

- ✨ Added responsive system
- ✨ Auto aspect ratio detection
- ✨ Smart scaling for all templates
- ✨ Word wrap support
- ✨ Safe area implementation
- 📚 Added comprehensive documentation

---

**Tác giả**: Đặng Ngọc Bình  
**Ngày cập nhật**: 2026-02-03  
**License**: MIT
