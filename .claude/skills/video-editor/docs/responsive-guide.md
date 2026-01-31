# Responsive Video Components Guide

This guide explains how the video overlay components (LayerTitle, LowerThird, CallToAction) now support responsive scaling across different video aspect ratios.

## The Problem

When rendering videos with different aspect ratios:
- **Landscape (16:9)**: 1920x1080, 1280x720
- **Portrait (9:16)**: 1080x1920, 720x1280
- **Square (1:1)**: 1080x1080

Elements designed for landscape videos would overflow or get cut off in portrait/square videos because they used fixed pixel values.

## The Solution: `useResponsiveScale` Hook

A new utility hook `src/utils/useResponsiveScale.ts` provides automatic scaling based on video dimensions.

### Key Features

```typescript
const { 
  width, height, aspectRatio,  // Raw dimensions
  isLandscape, isPortrait, isSquare,  // Orientation flags
  uniformScale, minScale,  // Scale factors
  scalePixel,     // Scale any pixel value
  scaleFontSize,  // Scale fonts (with minimum threshold)
  getResponsivePosition,  // Scale position objects
  getLayoutHints  // Get layout recommendations
} = useResponsiveScale();
```

### How It Works

1. **Base Design**: Components are designed for 1920x1080 (landscape)
2. **Scale Calculation**: `uniformScale = min(currentWidth/1920, currentHeight/1080)`
3. **Auto-Adjustment**: Positions, sizes, and fonts scale proportionally

### Example Usage

```tsx
// Before (fixed values)
bottom: 100,
left: 80,
fontSize: 42,

// After (responsive)
bottom: scalePixel(100),
left: scalePixel(80),
fontSize: scaleFontSize(42),
```

## Updated Components

### 1. LayerTitle
- Uses `scalePixel()` for positioning in different styles
- Uses `scaleFontSize()` for title and subtitle
- Adjusts `maxWidth` based on orientation (90% for portrait, 60% for landscape)

### 2. LowerThird
- Wrapped in a responsive container that scales via CSS `transform`
- Transform origin changes based on orientation (center-bottom for portrait)
- All 40 templates auto-scale without individual modifications

### 3. CallToAction
- Scale factor multiplied with animation scale
- Position adjusts for portrait (bottom-aligned with padding)
- All 120+ templates auto-scale

## Aspect Ratio Behaviors

| Aspect | Scale Factor | Position Origin | Notes |
|--------|-------------|-----------------|-------|
| Landscape (16:9) | ~1.0 | left-bottom | Reference design |
| Portrait (9:16) | ~0.56 | center-bottom | Elements smaller, centered |
| Square (1:1) | ~0.56 | left-bottom | Balanced scaling |

## Testing Your Video

Run the dev server and use the composition selector to preview different sizes:

```bash
npm run dev
# In browser, select different composition sizes to test
```

## Adding Responsive Support to New Components

1. Import the hook:
```tsx
import { useResponsiveScale } from '../../utils/useResponsiveScale';
```

2. Get values in your component:
```tsx
const { scalePixel, scaleFontSize, isPortrait, uniformScale } = useResponsiveScale();
```

3. Apply to your styles:
```tsx
// Positions
left: scalePixel(80),
bottom: scalePixel(100),

// Fonts
fontSize: scaleFontSize(32),

// Or use transform for entire containers
transform: `scale(${uniformScale})`,
```

## Best Practices

1. **Design for 1920x1080 first** - All values should look good at this size
2. **Use percentage where possible** - For widths and horizontal centering
3. **Test all three orientations** - Landscape, Portrait, Square
4. **Set minimum font sizes** - Prevent text from becoming unreadable
5. **Consider safe zones** - Keep important content away from edges

## Related Files

- `src/utils/useResponsiveScale.ts` - The responsive utility hook
- `src/components/titles/LayerTitle.tsx` - Title overlay component
- `src/components/titles/LowerThird.tsx` - Lower third templates
- `src/components/CallToAction/CallToAction.tsx` - CTA button templates
