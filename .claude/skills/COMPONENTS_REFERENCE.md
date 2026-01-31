# COMPONENT REFERENCE - Video Overlays & Effects

> **Tài liệu này dành cho AI Agent** để hiểu rõ các components overlay/effect có sẵn trong codebase và cách sử dụng chúng trong video production.

---

## 📋 TỔNG QUAN

Codebase có **5 main components** để tạo overlays và effects:

| Component | File Path | Use Case |
|-----------|-----------|----------|
| **LayerTitle** | `src/components/titles/LayerTitle.tsx` | Title overlays với nhiều styles (lower-third, centered, corner-badge, full-screen) |
| **Sticker** | `src/components/titles/Sticker.tsx` | Emoji/sticker overlays (160+ templates: Lottie animated + static) |
| **LayerEffect** | `src/components/effects/LayerEffect.tsx` | Visual effects (50+ types: tech, geometric, comic, nature) |
| **LowerThird** | `src/components/titles/LowerThird.tsx` | Broadcast-style lower thirds (40+ templates) |
| **OpeningTitle** | `src/components/titles/OpeningTitle.tsx` | Full-screen opening title card |

---

## 🎬 1. LAYER TITLE COMPONENT

**File**: `src/components/titles/LayerTitle.tsx`

### Use Cases
- Thêm title overlay ở bất kỳ vị trí nào (lower-third, centered, corner-badge, full-screen)
- Animated text với nhiều hiệu ứng (slide, fade, typewriter, scale)
- Có thể custom màu sắc, font, animation duration

### Props Reference

```typescript
interface LayerTitleProps {
  title: string;              // ✅ REQUIRED - Nội dung chính
  subtitle?: string;          // ⭕ OPTIONAL - Nội dung phụ

  // STYLE & POSITION
  style?: 'lower-third' | 'centered' | 'corner-badge' | 'full-screen';
  // Default: 'lower-third'

  // ANIMATION
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'typewriter' | 'scale';
  // Default: 'slide-up'

  enterDuration?: number;     // Thời gian animation vào (frames)
  exitDuration?: number;      // Thời gian animation ra (frames)

  // COLORS
  backgroundColor?: string;   // Default: 'rgba(6, 182, 79, 0.85)'
  textColor?: string;         // Default: '#eb0000ff'
  accentColor?: string;       // Default: '#ffae00ff'

  // TYPOGRAPHY
  fontSize?: number;          // Default: 48
  subtitleSize?: number;      // Default: 28
  fontFamily?: string;        // Google Font name (e.g., 'Roboto', 'Poppins')

  // STYLING
  showAccentLine?: boolean;   // Default: true
}
```

### Examples

**Example 1: Lower third với neon style**
```json
{
  "component": "LayerTitle",
  "props": {
    "title": "Breaking News",
    "subtitle": "Live from New York",
    "style": "lower-third",
    "animation": "slide-up",
    "backgroundColor": "rgba(0, 0, 0, 0.8)",
    "textColor": "#00ff00",
    "accentColor": "#ffff00"
  }
}
```

**Example 2: Centered title với typewriter effect**
```json
{
  "component": "LayerTitle",
  "props": {
    "title": "Chapter 1: The Beginning",
    "style": "centered",
    "animation": "typewriter",
    "fontSize": 64
  }
}
```

---

## 🎨 2. STICKER COMPONENT

**File**: `src/components/titles/Sticker.tsx`

### Use Cases
- Thêm emoji/sticker overlays
- Animated reactions (pop, shake, rotate, slide)
- 160+ templates có sẵn (Lottie animated + static webp)

### Templates Available

#### **Lottie Animated (60+ templates)** - prefix: `lottie-*`

**Faces & Emotions:**
- `lottie-heart-eyes`, `lottie-laughing`, `lottie-thinking`, `lottie-mind-blown`, `lottie-sweat`, `lottie-cool`, `lottie-cry`, `lottie-angry`, `lottie-wink`, `lottie-kiss`, `lottie-fear`, `lottie-sleep`

**Social & Reaction:**
- `lottie-party`, `lottie-fire`, `lottie-stars`, `lottie-thumbs-up`, `lottie-thumbs-down`, `lottie-clap`, `lottie-check`, `lottie-cross`, `lottie-warning`, `lottie-hundred`

**Hands & Gestures:**
- `lottie-peace`, `lottie-ok`, `lottie-muscle`, `lottie-wave`, `lottie-pray`

**Objects & Symbols:**
- `lottie-rocket`, `lottie-target`, `lottie-bulb`, `lottie-medal`, `lottie-trophy`, `lottie-crown`, `lottie-gem`, `lottie-diamond`

**Food & Celebration:**
- `lottie-pizza`, `lottie-burger`, `lottie-coffee`, `lottie-cake`, `lottie-balloon`, `lottie-gift`

**Nature:**
- `lottie-sun`, `lottie-moon`, `lottie-rainbow`, `lottie-sparkles`

**Animals & Characters:**
- `lottie-cat`, `lottie-dog`, `lottie-unicorn`, `lottie-ghost`, `lottie-alien`, `lottie-robot`

**Entertainment:**
- `lottie-clapper`, `lottie-controller`

**Hearts:**
- `lottie-heart-red`, `lottie-heart-broken`, `lottie-heart-blue`

#### **Static WebP (100+ templates)** - no prefix

**Faces:** `face-heart-eyes`, `face-laughing`, `face-wow`, `face-crying`, `face-angry`, `face-cool`, `face-thinking`, `face-mind-blown`, `face-partying`, etc.

**Hearts:** `heart-red`, `heart-broken`, `heart-fire`, `heart-sparkle`, `heart-blue`

**Social:** `like-thumb`, `dislike-thumb`, `clap`, `fire`, `hundred`, `check-mark`, `warning`, `money-bag`, `rocket`, `trophy`

**Nature:** `sun`, `moon`, `cloud-rain`, `lightning`, `rainbow`, `sparkles`

**Food:** `pizza`, `burger`, `coffee`, `beer`, `cake`

**Symbols:** `target`, `bulb`, `magnifier`, `controller`, `megaphone`, `medal-gold`

**Animals:** `cat-smile`, `dog-face`, `unicorn`, `alien`, `robot`

**Hands:** `hand-peace`, `hand-rock`, `hand-ok`, `hand-muscle`, `hand-wave`, `hand-pray`

### Props Reference

```typescript
interface StickerProps {
  // SOURCE (Choose ONE)
  src?: string;               // URL hoặc local path
  template?: string;          // Template name (e.g., 'lottie-fire', 'heart-red')

  // POSITION
  style?: 'center' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'random' | 'custom';
  // Default: 'random'

  // CUSTOM POSITION (nếu style='custom')
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;

  // SIZE
  width?: number | string;    // Default: 300
  height?: number | string;   // Default: auto

  // ANIMATION
  animation?: 'pop' | 'fade' | 'shake' | 'rotate' | 'slide-up' | 'slide-down' | 'elastic';
  // Default: 'pop'

  enterDuration?: number;     // Frames
  exitDuration?: number;      // Frames

  // TRANSFORM
  rotation?: number;          // Góc xoay tĩnh (degrees)
  scale?: number;             // Default: 1
}
```

### Examples

**Example 1: Fire emoji với pop animation**
```json
{
  "component": "Sticker",
  "props": {
    "template": "lottie-fire",
    "style": "top-right",
    "animation": "pop",
    "width": 200
  }
}
```

**Example 2: Custom positioned thumbs up**
```json
{
  "component": "Sticker",
  "props": {
    "template": "like-thumb",
    "style": "custom",
    "bottom": 100,
    "right": 50,
    "animation": "elastic",
    "scale": 1.5
  }
}
```

---

## ⚡ 3. LAYER EFFECT COMPONENT

**File**: `src/components/effects/LayerEffect.tsx`

### Use Cases
- Thêm visual effects (tech, geometric, comic, nature)
- Animated overlays (scan-lines, particles, neon circles, etc.)
- Custom Lottie effects

### Effect Types (50+)

#### **Tech / HUD (20 types)**
- `neon-circle`, `scan-lines`, `techno-triangle`, `crosshair`, `hud-grid`
- `loading-ring`, `plus-grid`, `digital-noise`, `radar-sweep`, `target-scope-a`, `target-scope-b`
- `cyber-frame-corners`, `loading-dots`, `loading-bars`, `countdown-circle`, `concentric-circles`
- `dashed-ring`, `globe-grid`, `dna-helix`

#### **Geometric / Abstract (13 types)**
- `burst`, `rotating-squares`, `crossed-lines`, `not-x`, `zigzag-wave`
- `hex-hive`, `square-tunnel`, `floating-shapes`, `triangle-float`, `glitch-bars`
- `shockwave-ring`, `electric-arc`, `concentric-squares`

#### **Comic / Hand-drawn (7 types)**
- `speed-lines-radial`, `speed-lines-side`, `comic-boom`, `comic-speed`
- `hand-drawn-circle`, `hand-drawn-arrow`, `hand-drawn-scratch`, `confetti-pop`

#### **Nature / Organic (10 types)**
- `sound-wave`, `particles`, `star-field`, `heart-beat`, `music-notes-flow`
- `equalizer-circular`, `lens-flare-sim`, `vignette-pulse`, `arrow-chevron-up`, `arrow-chevron-right`

#### **Custom**
- `custom` - Use with `src` prop for custom Lottie/image

### Props Reference

```typescript
interface LayerEffectProps {
  // EFFECT TYPE
  type?: LayerEffectType;     // Default: 'custom'
  src?: string;               // Custom Lottie/image URL (nếu type='custom')

  // POSITION
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  // Default: centered if not specified

  // SIZE
  width?: number | string;    // Default: 300
  height?: number | string;   // Default: 300

  // ANIMATION
  animation?: 'fade' | 'scale' | 'rotate' | 'pulse';
  // Default: 'fade'

  enterDuration?: number;     // Default: 15 frames
  exitDuration?: number;      // Default: 15 frames

  // STYLING
  color?: string;             // Default: '#00d4ff'
  secondaryColor?: string;    // Default: '#ffae00'
  scale?: number;             // Default: 1
  rotation?: number;          // Default: 0
  opacity?: number;           // Default: 1
  speed?: number;             // Animation speed multiplier, Default: 1
}
```

### Examples

**Example 1: Neon circle effect**
```json
{
  "component": "LayerEffect",
  "props": {
    "type": "neon-circle",
    "width": 400,
    "height": 400,
    "color": "#00ff00",
    "speed": 1.5
  }
}
```

**Example 2: Scan lines overlay**
```json
{
  "component": "LayerEffect",
  "props": {
    "type": "scan-lines",
    "top": 0,
    "left": 0,
    "width": "100%",
    "height": "100%",
    "color": "#00ffff",
    "opacity": 0.3
  }
}
```

---

## 📺 4. LOWER THIRD COMPONENT

**File**: `src/components/titles/LowerThird.tsx`

### Use Cases
- Broadcast-style lower thirds (news, sports, social media)
- 40+ pre-designed templates
- Automatic entrance/exit animations

### Templates (40+)

#### **Original (10 templates)**
- `modern-skew`, `glass-modern`, `neon-glow`, `minimal-bold`, `gradient-wave`
- `corporate-clean`, `tech-grid`, `elegant-serif`, `playful-round`, `split-reveal`

#### **Broadcast (3 templates)**
- `breaking-news`, `classic-tv`, `sports-ticker`

#### **Social Media (2 templates)**
- `social-youtube`, `social-insta`

#### **Gaming/Tech (3 templates)**
- `gaming-glitch`, `cyberpunk-hud`, `retro-8bit`

#### **Artistic (9 templates)**
- `hand-drawn`, `brush-stroke`, `comic-pop`, `ink-bleed`, `stencil-cut`
- `liquid-motion`, `confetti`, `shadow-stack`, `floating-bubbles`

#### **Special Purpose (8 templates)**
- `wedding-floral`, `documentary-sidebar`, `quote-box`, `ribbon-tag`
- `hologram`, `border-animate`, `industrial-steel`, `nature-eco`

#### **Premium (5 templates)**
- `space-cosmos`, `luxury-gold`, `chalkboard`, `blueprint`, `origami`

### Props Reference

```typescript
interface LowerThirdProps {
  title: string;              // ✅ REQUIRED
  subtitle?: string;          // ⭕ OPTIONAL

  template?: LowerThirdTemplate;  // Default: 'modern-skew'

  // COLORS
  primaryColor?: string;      // Default: '#3498db'
  secondaryColor?: string;    // Default: '#ffffff'
  textColor?: string;         // Default: '#2c3e50'

  // TYPOGRAPHY
  fontSize?: number;          // Default: 42
  fontFamily?: string;        // Google Font name
}
```

### Examples

**Example 1: Breaking news style**
```json
{
  "component": "LowerThird",
  "props": {
    "title": "BREAKING NEWS",
    "subtitle": "Market crashes by 10%",
    "template": "breaking-news",
    "primaryColor": "#ff0000"
  }
}
```

**Example 2: Social YouTube style**
```json
{
  "component": "LowerThird",
  "props": {
    "title": "Subscribe Now!",
    "subtitle": "@YourChannel",
    "template": "social-youtube",
    "primaryColor": "#ff0000"
  }
}
```

---

## 🎞️ 5. OPENING TITLE COMPONENT

**File**: `src/components/titles/OpeningTitle.tsx`

### Use Cases
- Full-screen opening title card
- Staggered word animation with spring effect
- Cinematic intro/outro

### Props Reference

```typescript
interface OpeningTitleProps {
  title: string;              // ✅ REQUIRED - Will be split into words for staggered effect
  subtitle?: string;          // ⭕ OPTIONAL - Fades in after title
}
```

### Example

```json
{
  "component": "OpeningTitle",
  "props": {
    "title": "The Ultimate Guide",
    "subtitle": "Chapter One"
  }
}
```

---

## 🔧 INTEGRATION GUIDE

### For video-editor skill

Khi tạo OTIO timeline, thêm component vào Overlays track:

```python
overlay_clip = otio.schema.Clip(
    name="LayerTitle",
    metadata={
        "component": "LayerTitle",
        "props": {
            "title": "Welcome",
            "style": "lower-third",
            "animation": "slide-up"
        }
    },
    source_range=otio.opentime.TimeRange(
        start_time=otio.opentime.RationalTime(0, fps),
        duration=otio.opentime.RationalTime(duration_frames, fps)
    )
)
overlay_track.append(overlay_clip)
```

### For otio-quick-editor skill

Add overlay at specific timestamp:

```bash
otio-quick-editor add-title --project "demo" --text "Subscribe!" --at-second 3 --duration 4 --style "neon-glow"
otio-quick-editor add-sticker --project "demo" --emoji "lottie-fire" --at-second 10 --duration 2
otio-quick-editor add-effect --project "demo" --effect-type "neon-circle" --at-second 5 --duration 3
```

### For video-production-director skill

Director nên hiểu:
- LayerTitle: General purpose overlays
- Sticker: Quick emoji reactions
- LayerEffect: Background/atmosphere effects
- LowerThird: Professional broadcast overlays
- OpeningTitle: Intro/outro cards

---

## 🎯 BEST PRACTICES

1. **Chọn component phù hợp:**
   - Title overlay đơn giản → **LayerTitle**
   - Broadcast-style professional → **LowerThird**
   - Emoji/reaction → **Sticker**
   - Background effect → **LayerEffect**
   - Full-screen intro → **OpeningTitle**

2. **Animation timing:**
   - enterDuration: 15-30 frames (0.5-1s @ 30fps)
   - exitDuration: 10-20 frames (0.3-0.7s @ 30fps)

3. **Color harmony:**
   - Dùng màu tương phản với background
   - Neon effects: #00ff00, #00ffff, #ff00ff
   - Professional: #3498db, #2c3e50, #ffffff

4. **Font loading:**
   - LayerTitle & LowerThird hỗ trợ Google Fonts
   - Pass tên font: "Roboto", "Poppins", "Montserrat"

5. **Performance:**
   - Lottie stickers render tốt hơn static (smooth animation)
   - Effect types đơn giản (neon-circle, scan-lines) render nhanh nhất
   - Tránh dùng quá nhiều effects cùng lúc (>3)

---

## 📊 QUICK REFERENCE TABLE

| Need | Component | Key Props |
|------|-----------|-----------|
| Lower third overlay | LayerTitle | style="lower-third" |
| Centered big text | LayerTitle | style="centered", fontSize=64 |
| Corner badge | LayerTitle | style="corner-badge" |
| Typewriter effect | LayerTitle | animation="typewriter" |
| Fire emoji | Sticker | template="lottie-fire" |
| Like button | Sticker | template="lottie-thumbs-up" |
| Random sticker | Sticker | style="random" |
| Tech HUD overlay | LayerEffect | type="neon-circle" or "hud-grid" |
| Scan lines | LayerEffect | type="scan-lines" |
| Particles | LayerEffect | type="particles" |
| Breaking news banner | LowerThird | template="breaking-news" |
| Social media style | LowerThird | template="social-youtube" |
| Gaming style | LowerThird | template="gaming-glitch" |
| Opening card | OpeningTitle | title="...", subtitle="..." |

---

**Last Updated**: 2026-01-31
**Maintained by**: AI Agent System
