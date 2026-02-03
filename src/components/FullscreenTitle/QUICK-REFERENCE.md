# FullscreenTitle Responsive - Quick Reference

## 📋 Bảng Tra Cứu Nhanh

### Aspect Ratios

| Tên | Ratio | Kích Thước | Nền Tảng | Title | Subtitle | Padding | Max Width |
|-----|-------|------------|----------|-------|----------|---------|-----------|
| **Vertical** | 9:16 | 1080×1920 | TikTok, Reels, Shorts | 65% | 70% | 60% | 90% |
| **Instagram** | 4:5 | 1080×1350 | Instagram Post | 75% | 80% | 60% | 90% |
| **Square** | 1:1 | 1080×1080 | Instagram, Facebook | 85% | 85% | 70% | 88% |
| **Horizontal** | 16:9 | 1920×1080 | YouTube, TV | 100% | 100% | 100% | 94% |

### Kích Thước Thực Tế (titleSize=96, subtitleSize=36)

| Aspect Ratio | Title (px) | Subtitle (px) | Padding (px) |
|--------------|------------|---------------|--------------|
| 9:16 | 62.4 | 25.2 | 36 |
| 4:5 | 72 | 28.8 | 36 |
| 1:1 | 81.6 | 30.6 | 42 |
| 16:9 | 96 | 36 | 60 |

## 🚀 Quick Start

### Cơ Bản
```typescript
<FullscreenTitle
  title="YOUR TITLE"
  subtitle="Your subtitle"
/>
```

### Với Template
```typescript
<FullscreenTitle
  title="YOUR TITLE"
  template="cinematic-intro"
/>
```

### Custom Size
```typescript
<FullscreenTitle
  title="YOUR TITLE"
  titleSize={120}  // Lớn hơn cho vertical
  subtitleSize={40}
/>
```

## 💡 Tips

### Vertical (9:16, 4:5)
- ✅ Dùng `titleSize` lớn hơn (100-120)
- ✅ Chọn font sans-serif dễ đọc
- ✅ Text ngắn gọn
- ✅ Templates minimal

### Horizontal (16:9)
- ✅ Dùng `titleSize` vừa phải (80-100)
- ✅ Có thể dùng font nghệ thuật
- ✅ Text dài hơn OK
- ✅ Templates phức tạp OK

### Square (1:1)
- ✅ Cân bằng giữa vertical và horizontal
- ✅ `titleSize` 90-110
- ✅ Text vừa phải

## 🎨 Recommended Templates

### Cho Vertical (9:16)
```typescript
'minimal-chapter'
'bold-statement'
'neon-night'
'gradient-dream'
'glassmorphism-pro'
```

### Cho Horizontal (16:9)
```typescript
'cinematic-intro'
'magazine-cover'
'split-screen'
'breaking-news-full'
'architect-blueprint'
```

### Cho Square (1:1)
```typescript
'quote-hero'
'eco-green'
'geometric-grid'
'floating-bubbles'
'watercolor-bleed'
```

## 🔧 Common Patterns

### Pattern 1: Auto Responsive
```typescript
// Không cần config gì - tự động responsive!
<FullscreenTitle title="TITLE" />
```

### Pattern 2: Custom Per Aspect Ratio
```typescript
const { width, height } = useVideoConfig();
const isVertical = width / height < 0.75;

<FullscreenTitle 
  titleSize={isVertical ? 120 : 96}
  template={isVertical ? 'minimal-chapter' : 'cinematic-intro'}
/>
```

### Pattern 3: Long Text
```typescript
// Tự động xuống dòng
<FullscreenTitle 
  title="VERY LONG TITLE THAT WILL WRAP AUTOMATICALLY"
/>
```

## 📐 Formulas

### Calculate Final Size
```
finalSize = originalSize × (dimension / 1080) × multiplier
```

### Examples
```
9:16: 96 × (1080/1080) × 0.65 = 62.4px
16:9: 96 × (1080/1080) × 1.0 = 96px
```

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Text bị cắt | Giảm `titleSize` hoặc `padding` |
| Text quá nhỏ | Tăng `titleSize` |
| Text không xuống dòng | Đã tự động - check `maxWidth` |
| Text sát mép | Component tự động safe area |

## 📱 Platform Presets

### TikTok/Reels
```typescript
width: 1080,
height: 1920,
<FullscreenTitle titleSize={100} />
```

### Instagram Post
```typescript
width: 1080,
height: 1350,
<FullscreenTitle titleSize={90} />
```

### YouTube
```typescript
width: 1920,
height: 1080,
<FullscreenTitle titleSize={96} />
```

### Facebook Square
```typescript
width: 1080,
height: 1080,
<FullscreenTitle titleSize={90} />
```

## 🎯 Best Practices

1. ✅ **Để component tự động responsive** - đừng hardcode size
2. ✅ **Test ở nhiều aspect ratios** - dùng demo compositions
3. ✅ **Chọn template phù hợp** - minimal cho vertical, complex cho horizontal
4. ✅ **Font dễ đọc cho mobile** - sans-serif cho vertical
5. ✅ **Text ngắn gọn** - đặc biệt cho vertical

## 📚 More Info

- [README-RESPONSIVE.md](./README-RESPONSIVE.md) - Full documentation
- [RESPONSIVE-GUIDE.md](./RESPONSIVE-GUIDE.md) - Detailed guide
- [RESPONSIVE-COMPARISON.md](./RESPONSIVE-COMPARISON.md) - Comparison table
- [ResponsiveDemo.tsx](./ResponsiveDemo.tsx) - Demo compositions

---

**Print this for quick reference!** 🖨️
