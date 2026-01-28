---
name: remotion-broll-title
description: Tạo B-roll title components cho Remotion video projects. Sử dụng khi cần tạo title overlays, lower thirds, text animations có thể chèn vào bất kỳ frame/track nào trong Remotion composition. Hỗ trợ các style như lower-third, centered, corner badge, animated text reveals với customizable timing và positioning.
---

# Remotion B-roll Title Skill

Tạo các B-roll title components có thể tái sử dụng trong Remotion projects.

## Core Concept

B-roll title trong Remotion sử dụng `<Sequence>` để chèn title vào bất kỳ vị trí nào:

```tsx
<Sequence from={frameNumber} durationInFrames={duration}>
  <BrollTitle title="Your Title" style="lower-third" />
</Sequence>
```

## Quick Start

### 1. Copy component từ assets

Copy `assets/BrollTitle.tsx` vào project của bạn tại `src/components/`

### 2. Sử dụng trong Composition

```tsx
import { Composition, Sequence, AbsoluteFill } from 'remotion';
import { BrollTitle } from './components/BrollTitle';

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Main video content - Track 0 */}
      <Sequence from={0}>
        <YourMainContent />
      </Sequence>
      
      {/* Title overlay - Track 1: frame 30-120 */}
      <Sequence from={30} durationInFrames={90}>
        <BrollTitle 
          title="Giới thiệu sản phẩm"
          subtitle="Phiên bản 2024"
          style="lower-third"
          animation="slide-up"
        />
      </Sequence>
      
      {/* Another title - Track 1: frame 150-210 */}
      <Sequence from={150} durationInFrames={60}>
        <BrollTitle 
          title="Tính năng mới"
          style="corner-badge"
          accentColor="#ff6b6b"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Styles có sẵn

| Style | Position | Use case |
|-------|----------|----------|
| `lower-third` | Bottom-left | Speaker names, locations |
| `centered` | Center screen | Chapter titles, quotes |
| `corner-badge` | Top-right | Tags, categories |
| `full-screen` | Full overlay | Intro/outro titles |

## Animations

| Animation | Effect |
|-----------|--------|
| `fade` | Fade in/out |
| `slide-up` | Slide from bottom |
| `slide-left` | Slide from right |
| `typewriter` | Type character by character |
| `scale` | Zoom effect |

## Multi-track System

Để overlay nhiều titles cùng lúc, stack `<Sequence>` components:

```tsx
<AbsoluteFill>
  {/* Base video */}
  <Sequence from={0}><VideoContent /></Sequence>
  
  {/* Track 1: Lower thirds */}
  <Sequence from={30} durationInFrames={90}>
    <BrollTitle title="Name" style="lower-third" />
  </Sequence>
  
  {/* Track 2: Corner badge (cùng thời điểm) */}
  <Sequence from={30} durationInFrames={90}>
    <BrollTitle title="LIVE" style="corner-badge" />
  </Sequence>
</AbsoluteFill>
```

## Props Reference

```tsx
interface BrollTitleProps {
  title: string;              // Required: main text
  subtitle?: string;          // Optional: secondary text
  style?: BrollTitleStyle;    // Default: 'lower-third'
  animation?: AnimationType;  // Default: 'slide-up'
  backgroundColor?: string;   // Default: 'rgba(0,0,0,0.8)'
  textColor?: string;         // Default: '#ffffff'
  accentColor?: string;       // Default: '#00d4ff'
  enterDuration?: number;     // Frames for enter animation
  exitDuration?: number;      // Frames for exit animation
}
```

## Assets

- `assets/BrollTitle.tsx` - Full component với tất cả styles/animations
- `assets/TitlePresets.ts` - Color và style presets sẵn có
- `assets/useTextAnimation.ts` - Hook cho typewriter effect

## Advanced

Xem [references/advanced-patterns.md](references/advanced-patterns.md) cho:
- Data-driven titles từ JSON/CSV
- Dynamic positioning
- Spring animations
- Responsive scaling
