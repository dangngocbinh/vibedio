# Hướng Dẫn Responsive cho FullscreenTitle

## Tổng Quan

Component `FullscreenTitle` đã được nâng cấp với hệ thống responsive thông minh, tự động điều chỉnh kích thước chữ, padding, và layout dựa trên **aspect ratio** của video.

## Các Tỷ Lệ Khung Hình Được Hỗ Trợ

### 1. **9:16 (Vertical - TikTok/Reels/Shorts)**
- Aspect Ratio: `0.5625`
- Scale Factor: Dựa trên `width / 1080`
- Title Size: Giảm 35% (`titleSizeMultiplier = 0.65`)
- Subtitle Size: Giảm 30% (`subtitleSizeMultiplier = 0.7`)
- Padding: Giảm 40% (`paddingMultiplier = 0.6`)
- Max Width: 90% (tránh chữ sát mép)
- Line Height: 1.15 (tăng để dễ đọc)
- Letter Spacing: -0.01em

### 2. **4:5 (Instagram Post)**
- Aspect Ratio: `0.8`
- Scale Factor: Dựa trên `width / 1080`
- Title Size: Giảm 25% (`titleSizeMultiplier = 0.75`)
- Subtitle Size: Giảm 20% (`subtitleSizeMultiplier = 0.8`)
- Padding: Giảm 40% (`paddingMultiplier = 0.6`)
- Max Width: 90%
- Line Height: 1.15
- Letter Spacing: -0.01em

### 3. **1:1 (Square - Instagram/Facebook)**
- Aspect Ratio: `1.0`
- Scale Factor: `Math.min(width / 1080, height / 1080)`
- Title Size: Giảm 15% (`titleSizeMultiplier = 0.85`)
- Subtitle Size: Giảm 15% (`subtitleSizeMultiplier = 0.85`)
- Padding: Giảm 30% (`paddingMultiplier = 0.7`)
- Max Width: 88%
- Line Height: 1.12
- Letter Spacing: -0.015em

### 4. **16:9 (Horizontal - YouTube/TV)**
- Aspect Ratio: `1.777`
- Scale Factor: Dựa trên `height / 1080`
- Title Size: 100% (không giảm)
- Subtitle Size: 100%
- Padding: 100%
- Max Width: 94%
- Line Height: 1.1 (mặc định)
- Letter Spacing: -0.02em (mặc định)

## Cách Hoạt Động

### 1. Phát Hiện Aspect Ratio
```typescript
const aspectRatio = width / height;
const isVertical = aspectRatio < 0.75;    // 9:16, 4:5
const isSquare = aspectRatio >= 0.75 && aspectRatio <= 1.25;  // 1:1
const isHorizontal = aspectRatio > 1.25;  // 16:9
```

### 2. Tính Toán Scale Factor
- **Vertical**: Scale theo width (vì width là dimension nhỏ hơn)
- **Square**: Scale theo dimension nhỏ nhất
- **Horizontal**: Scale theo height (vì height là dimension nhỏ hơn)

### 3. Áp Dụng Multipliers
```typescript
const scaledTitleSize = titleSize * baseScaleFactor * titleSizeMultiplier;
const scaledSubtitleSize = subtitleSize * baseScaleFactor * subtitleSizeMultiplier;
const scaledPadding = padding * baseScaleFactor * paddingMultiplier;
```

### 4. Điều Chỉnh Typography
- **Line Height**: Tăng cho vertical để text dễ đọc hơn
- **Letter Spacing**: Điều chỉnh để text không bị chật
- **Word Wrap**: Tự động xuống dòng nếu text quá dài

## Ví Dụ Sử Dụng

### Video 9:16 (1080x1920)
```typescript
<FullscreenTitle
  title="TÊN VIDEO CỦA BẠN"
  subtitle="Mô tả ngắn gọn"
  titleSize={96}  // Sẽ tự động scale xuống ~62px
  template="default"
/>
```

### Video 16:9 (1920x1080)
```typescript
<FullscreenTitle
  title="TÊN VIDEO CỦA BẠN"
  subtitle="Mô tả ngắn gọn"
  titleSize={96}  // Sẽ giữ nguyên ~96px
  template="default"
/>
```

### Video 1:1 (1080x1080)
```typescript
<FullscreenTitle
  title="TÊN VIDEO CỦA BẠN"
  subtitle="Mô tả ngắn gọn"
  titleSize={96}  // Sẽ scale xuống ~82px
  template="default"
/>
```

## Lưu Ý Quan Trọng

1. **Không cần thay đổi props**: Component tự động điều chỉnh dựa trên video config
2. **Text dài**: Sẽ tự động xuống dòng nhờ `word-wrap: break-word`
3. **Safe Area**: Padding và maxWidth đã được tính toán để tránh text bị cắt
4. **Templates**: Tất cả 40+ templates đều được hưởng lợi từ responsive system

## Kiểm Tra Responsive

Để kiểm tra responsive, bạn có thể:

1. Thay đổi `width` và `height` trong `remotion.config.ts`
2. Xem preview trong Remotion Player
3. Text sẽ tự động điều chỉnh kích thước phù hợp

## Công Thức Tính Toán

### Base Scale Factor
```
Vertical:   baseScaleFactor = width / 1080
Square:     baseScaleFactor = min(width, height) / 1080
Horizontal: baseScaleFactor = height / 1080
```

### Final Size
```
finalSize = originalSize × baseScaleFactor × multiplier
```

### Ví Dụ Cụ Thể (9:16 - 1080x1920)
```
titleSize = 96
baseScaleFactor = 1080 / 1080 = 1
titleSizeMultiplier = 0.65
finalTitleSize = 96 × 1 × 0.65 = 62.4px
```

## Tùy Chỉnh Nâng Cao

Nếu bạn muốn override responsive behavior, bạn có thể:

1. Truyền `titleSize` và `subtitleSize` lớn hơn cho vertical
2. Sử dụng `padding` nhỏ hơn cho square
3. Chọn `fontFamily` phù hợp với từng aspect ratio

---

**Tác giả**: Đặng Ngọc Bình  
**Ngày cập nhật**: 2026-02-03
