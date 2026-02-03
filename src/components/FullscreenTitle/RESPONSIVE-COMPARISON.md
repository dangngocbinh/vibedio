# So Sánh Responsive Giữa Các Aspect Ratio

## Bảng So Sánh Chi Tiết

| Thuộc Tính | 9:16 (Vertical) | 4:5 (Instagram) | 1:1 (Square) | 16:9 (Horizontal) |
|------------|-----------------|-----------------|--------------|-------------------|
| **Aspect Ratio** | 0.5625 | 0.8 | 1.0 | 1.777 |
| **Kích Thước Mẫu** | 1080×1920 | 1080×1350 | 1080×1080 | 1920×1080 |
| **Base Scale** | width/1080 | width/1080 | min(w,h)/1080 | height/1080 |
| **Title Multiplier** | 0.65 (↓35%) | 0.75 (↓25%) | 0.85 (↓15%) | 1.0 (100%) |
| **Subtitle Multiplier** | 0.7 (↓30%) | 0.8 (↓20%) | 0.85 (↓15%) | 1.0 (100%) |
| **Padding Multiplier** | 0.6 (↓40%) | 0.6 (↓40%) | 0.7 (↓30%) | 1.0 (100%) |
| **Max Width** | 90% | 90% | 88% | 94% |
| **Line Height** | 1.15 | 1.15 | 1.12 | 1.1 |
| **Letter Spacing** | -0.01em | -0.01em | -0.015em | -0.02em |

## Ví Dụ Kích Thước Thực Tế

Với `titleSize = 96` và `subtitleSize = 36`:

| Aspect Ratio | Title Size (px) | Subtitle Size (px) | Padding (px) |
|--------------|-----------------|-------------------|--------------|
| **9:16** (1080×1920) | 62.4 | 25.2 | 36 |
| **4:5** (1080×1350) | 72 | 28.8 | 36 |
| **1:1** (1080×1080) | 81.6 | 30.6 | 42 |
| **16:9** (1920×1080) | 96 | 36 | 60 |

## Công Thức Tính

```
Final Size = Original Size × Base Scale Factor × Multiplier
```

### Ví Dụ Cụ Thể

#### 9:16 (1080×1920)
```
titleSize = 96
baseScaleFactor = 1080 / 1080 = 1.0
titleSizeMultiplier = 0.65
finalTitleSize = 96 × 1.0 × 0.65 = 62.4px
```

#### 16:9 (1920×1080)
```
titleSize = 96
baseScaleFactor = 1080 / 1080 = 1.0
titleSizeMultiplier = 1.0
finalTitleSize = 96 × 1.0 × 1.0 = 96px
```

#### 16:9 (3840×2160 - 4K)
```
titleSize = 96
baseScaleFactor = 2160 / 1080 = 2.0
titleSizeMultiplier = 1.0
finalTitleSize = 96 × 2.0 × 1.0 = 192px
```

## Lý Do Thiết Kế

### Tại Sao Giảm Size Cho Vertical?

1. **Không gian hẹp**: Vertical có width nhỏ, cần giảm size để text không bị tràn
2. **Dễ đọc**: Text nhỏ hơn + line-height cao hơn = dễ đọc trên mobile
3. **Safe area**: Tránh text bị che bởi UI của app (TikTok, Instagram)

### Tại Sao Tăng Line Height Cho Vertical?

1. **Mobile viewing**: Người dùng cầm điện thoại gần mắt hơn
2. **Readability**: Line height cao hơn giúp text dễ đọc hơn
3. **Breathing room**: Tạo không gian giữa các dòng

### Tại Sao Giảm Max Width?

1. **Vertical (90%)**: Tránh text sát mép trái/phải
2. **Square (88%)**: Cân bằng không gian
3. **Horizontal (94%)**: Tận dụng không gian rộng

## Best Practices

### 1. Chọn Title Size Phù Hợp

```typescript
// Cho 9:16 - nên dùng titleSize lớn hơn vì sẽ bị scale xuống
<FullscreenTitle titleSize={120} /> // → ~78px

// Cho 16:9 - dùng size vừa phải
<FullscreenTitle titleSize={96} /> // → 96px
```

### 2. Text Dài

```typescript
// Component tự động xuống dòng
<FullscreenTitle 
  title="TIÊU ĐỀ RẤT DÀI SẼ TỰ ĐỘNG XUỐNG DÒNG"
  // Không cần lo lắng về overflow
/>
```

### 3. Templates

```typescript
// Tất cả templates đều responsive
<FullscreenTitle template="cinematic-intro" />
<FullscreenTitle template="neon-night" />
<FullscreenTitle template="glassmorphism-pro" />
```

## Testing

Để test responsive, chạy các compositions demo:

```bash
npm run dev
```

Sau đó xem các compositions:
- `FullscreenTitle-9x16`
- `FullscreenTitle-4x5`
- `FullscreenTitle-1x1`
- `FullscreenTitle-16x9`

---

**Lưu ý**: Hệ thống responsive hoàn toàn tự động, bạn không cần thay đổi props khi thay đổi aspect ratio!
