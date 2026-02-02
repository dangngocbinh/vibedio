# Short Video Layout Guide (9:16 Portrait)

## Overview

This guide explains how to handle **landscape content** (16:9 or wider) in **9:16 Short format** videos (TikTok, Reels, Shorts) using the video-editor skill.

### The Challenge

When creating vertical Short videos from landscape source material (videos or images), you need to:
1. **Fill the empty space** - Landscape content doesn't fill the 9:16 frame
2. **Position content intelligently** - Center, crop, or zoom the main content
3. **Add background layer** - Fill gaps with custom backgrounds or auto-generated fills
4. **Respect safe zones** - Avoid platform UI areas (top/bottom buttons, side icons)
5. **Apply consistent layouts** - Position titles, captions, and CTAs predictably

### The Solution: 2-Track System

Short video layout uses a **2-track visual system**:

```
Track 0: Background (NEW!)      ← Custom video/image/blur/gradient background
Track 1: Main Content            ← Landscape content (centered, cropped, or zoomed)
Track 2: Title Overlays          ← LayerTitle components
Track 3: Captions                ← TikTokCaption (word-by-word)
Track 4: Voice (audio)
Track 5: Music (audio)
```

**Key Concept**: Background is a **separate resource** on Track 0, not a filter applied to the main content.

---

## Safe Zones Reference

### Canvas Dimensions
- **Width**: 1080px
- **Height**: 1920px
- **Aspect Ratio**: 9:16

### Vertical Zones

```
┌─────────────────────────────┐
│   TOP DANGER ZONE           │ 0-180px    ⚠️ Pause/Sound/Menu buttons
├─────────────────────────────┤
│   HEADER SAFE               │ 180-350px  ✅ Main title area
├─────────────────────────────┤
│                             │
│   CONTENT ZONE              │ 350-1400px ✅ Video + overlays
│                             │
├─────────────────────────────┤
│   FOOTER SAFE               │ 1400-1720px ✅ Descriptions, CTAs
├─────────────────────────────┤
│   BOTTOM DANGER ZONE        │ 1720-1920px ⚠️ Progress bar
└─────────────────────────────┘
```

### Horizontal Margins

- **Left margin**: 60px (safe)
- **Right margin**: 160px (extra padding for social icons)
- **Right danger zone**: 920-1080px (like/comment/share buttons)

### Safe Zone Rules

✅ **DO**:
- Place main titles in **Header Safe** (180-350px)
- Place captions in **Content Zone** center (900-1300px)
- Place CTAs in **Footer Safe** (1500-1680px)
- Keep important text **left of 920px** (right danger zone)

❌ **DON'T**:
- Put text in **Top Danger** (0-180px) - gets covered by buttons
- Put text in **Bottom Danger** (1720-1920px) - gets covered by progress bar
- Put text in **Right Danger** (920-1080px) - gets covered by social icons

---

## Layout Presets

The system provides **4 layout presets** that control where titles, captions, and CTAs appear.

### Preset 1: `header-footer` (Default)

**Best for**: Educational content, listicles, tutorials, storytelling

```
┌─────────────────────────────┐
│   [MAIN TITLE]              │ 200-320px (centered, header safe)
├─────────────────────────────┤
│   [Secondary Title]         │ 400-500px (with background shape)
│                             │
│                             │
│   [Captions]                │ 900-1300px (synced with voice)
│                             │
│                             │
├─────────────────────────────┤
│   [Footer CTA]              │ 1500-1680px (footer safe)
└─────────────────────────────┘
```

**Layout mapping**:
- `main_title` → position: `top` (200-320px)
- `secondary_title` → y_start: 400px
- `captions` → position: `bottom-high` (900-1300px)
- `footer` → y_start: 1500px

**Example use case**: "5 Mistakes When Learning English"
- Title: "5 SAI LẦM" at top
- Captions: Center, synced with voice
- CTA: "SUBSCRIBE FOR MORE" at bottom

---

### Preset 2: `minimal` (Clean Aesthetic)

**Best for**: Aesthetic content, cinematic shots, ASMR, vlogs

```
┌─────────────────────────────┐
│ [Branding]                  │ 200px (top-left, small)
│                             │
│                             │
│                             │
│   (Clean content area)      │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│   [Captions only]           │ 1720px (bottom, minimal)
└─────────────────────────────┘
```

**Layout mapping**:
- `branding` → corner: `top-left`, y: 200px
- `captions` → position: `bottom` (1720px)
- No heavy overlays, clean aesthetic

**Example use case**: Cinematic travel video
- Small logo at top-left
- Captions only at bottom
- No distracting overlays

---

### Preset 3: `text-heavy` (Multiple Text Layers)

**Best for**: Tips, hacks, viral facts, quote videos, educational points

```
┌─────────────────────────────┐
│   [Main Hook]               │ 200px (top-center)
├─────────────────────────────┤
│                             │
│   [Text Overlay 1]          │ 500px (staggered)
│                             │
│   [Text Overlay 2]          │ 800px
│                             │
│   [Text Overlay 3]          │ 1200px
│                             │
├─────────────────────────────┤
│   [CTA/Question]            │ 1600px (footer)
└─────────────────────────────┘
```

**Layout mapping**:
- `main_title` → position: `top` (200px)
- `overlays` → stagger: True, y_range: (500-1200px)
- `cta` → y_start: 1600px

**Example use case**: "10 Life Hacks You Need to Know"
- Hook: "10 LIFE HACKS" at top
- Each hack as staggered text overlay
- CTA: "Which one surprised you?" at bottom

---

### Preset 4: `balanced` (Flexible)

**Best for**: Mixed content, user-driven layouts, general purpose

```
┌─────────────────────────────┐
│   [Title - Dynamic]         │ Top OR Bottom based on content
│                             │
│   [Captions - Center]       │ Center (flexible positioning)
│                             │
│   [Overlays - Dynamic]      │ Based on empty space detection
│                             │
└─────────────────────────────┘
```

**Layout mapping**:
- `dynamic` → True (calculate based on content)
- Title position adapts to content
- Captions center by default
- Overlays placed in empty space

**Example use case**: General-purpose Short video
- System detects best positions
- Adapts to content automatically

---

## Background Track System

### Track Structure

**IMPORTANT**: Background is a **separate track** (Track 0 - bottom layer), not a filter on main content.

```
Timeline:
  Track 0: Background          ← Custom video/image OR auto-generated blur/gradient
  Track 1: Main Content        ← Landscape video/image (positioned above background)
  Track 2: Title Overlays
  Track 3: Captions
  Track 4: Voice (audio)
  Track 5: Music (audio)
```

### 6 Background Types

---

#### Type 1: `custom-video`

**Description**: User provides custom background video

**When to use**:
- You have branded motion backgrounds
- You want stock footage as background (e.g., animated patterns, nature scenes)
- You want consistent background across multiple scenes

**How to provide**:

In `resources.json`:
```json
{
  "resources": {
    "backgroundResources": {
      "videos": [
        {
          "sceneId": "scene_1",
          "localPath": "backgrounds/motion-bg.mp4",
          "type": "custom-background",
          "duration": 10
        }
      ]
    }
  }
}
```

**OTIO implementation**:
```python
bg_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "VideoWithEffects",
        "props": {
            "scaleMode": "cover",  # Fill 9:16 frame
            "opacity": 1.0
        }
    },
    "media_reference": {
        "OTIO_SCHEMA": "ExternalReference.1",
        "target_url": "backgrounds/motion-bg.mp4"
    }
}
```

**Example**: Animated geometric patterns, flowing water, city lights

---

#### Type 2: `custom-image`

**Description**: User provides custom background image

**When to use**:
- Branded backgrounds with logos/patterns
- Textured backgrounds (paper, fabric, concrete)
- Consistent visual theme across scenes

**How to provide**:

In `resources.json`:
```json
{
  "resources": {
    "backgroundResources": {
      "images": [
        {
          "sceneId": "scene_2",
          "localPath": "backgrounds/pattern.png",
          "type": "custom-background"
        }
      ]
    }
  }
}
```

**OTIO implementation**:
```python
bg_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "ImageWithEffects",
        "props": {
            "scaleMode": "cover",  # Fill 9:16 frame (stretch or tile)
            "opacity": 1.0
        }
    },
    "media_reference": {
        "OTIO_SCHEMA": "ExternalReference.1",
        "target_url": "backgrounds/pattern.png"
    }
}
```

**Example**: Branded pattern, grunge texture, abstract art

---

#### Type 3: `blur-original` (Recommended Default)

**Description**: Auto-generate blurred version of main content

**When to use**:
- No custom background provided (most common case)
- Professional look without extra assets
- Main content is video with interesting colors/motion

**Auto-applied when**:
- `backgroundType` not specified OR set to `auto`
- No custom background resources provided
- Main content is video

**OTIO implementation**:
```python
bg_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "VideoWithEffects",
        "props": {
            "blur": 20,            # Heavy blur
            "opacity": 0.7,        # Slightly transparent
            "scaleMode": "cover",  # Fill 9:16 frame
            "brightness": 0.8      # Slightly darker
        }
    },
    "media_reference": same_as_main_content  # Same source, different props
}
```

**Visual result**: Blurred, darkened version of main content fills background, main content sits sharp on top

**Example**: Landscape video of sunset → blurred sunset background + sharp centered video on top

---

#### Type 4: `gradient`

**Description**: Auto-generate gradient background

**When to use**:
- Clean, modern aesthetic
- Main content is static image (not video)
- Want consistent color theme

**Gradient presets**:
- `sunset`: Orange to pink
- `ocean`: Blue to teal
- `fire`: Red to orange
- `neon`: Purple to cyan
- `dark`: Dark blue to black (default)

**How to configure**:

In `script.json`:
```json
{
  "metadata": {
    "backgroundType": "gradient",
    "primaryColor": "#1a1a2e"  // Optional: influences gradient colors
  }
}
```

**OTIO implementation**:
```python
bg_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "GradientBackground",
        "props": {
            "colors": ["#1a1a2e", "#16213e"],  # Dark blue gradient
            "direction": "vertical",
            "animated": True  # Subtle rotation
        }
    }
}
```

**Example**: Static image of cat → dark blue gradient background + cat image on top

---

#### Type 5: `solid-color`

**Description**: Solid color fill

**When to use**:
- Minimalist aesthetic
- High contrast needed (e.g., white content on black background)
- Consistent branding color

**How to configure**:

In `script.json`:
```json
{
  "metadata": {
    "backgroundType": "solid-color",
    "backgroundColor": "#000000"  // Black background
  }
}
```

**OTIO implementation**:
```python
bg_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "SolidColor",
        "props": {
            "color": "#000000"
        }
    }
}
```

**Example**: White text on black background (high contrast)

---

#### Type 6: `auto` (Smart Detection)

**Description**: System automatically selects best background type

**Auto-selection rules**:
1. If `backgroundResources.videos` provided for scene → **custom-video**
2. Else if `backgroundResources.images` provided for scene → **custom-image**
3. Else if main content is video → **blur-original**
4. Else if main content is image → **gradient** or **blur-original**
5. Default fallback → **blur-original**

**When to use**: Always! This is the recommended default. Just set `backgroundType: "auto"` (or omit it) and let the system decide.

---

## Content Positioning Modes

These control how the **main content** (Track 1) is positioned **on top of** the background (Track 0).

### Mode 1: `centered` (Default)

**Description**: Maintain aspect ratio, center horizontally & vertically, max-width 90%

**When to use**:
- Default for most landscape content
- Want background visible on sides
- Professional look

**Props**:
```python
{
    "scaleMode": "fit",      # Maintain aspect ratio
    "maxWidth": 0.9,         # 90% of canvas width (972px)
    "centered": True,
    "verticalAlign": "center"
}
```

**Visual result**: Landscape video/image sits in center, background visible on left/right sides (54px margins)

**Example**: 16:9 video in 9:16 frame → video centered, blurred background on sides

---

### Mode 2: `crop-to-fill`

**Description**: Crop content to fill entire 9:16 frame (no background visible)

**When to use**:
- Portrait or square content (already fits 9:16)
- Centered subjects (face, person)
- No background needed

**Props**:
```python
{
    "scaleMode": "cover",    # Fill entire frame
    "cropFocus": "center",   # Crop from center
    "smart_crop": True       # Use face detection if available
}
```

**Visual result**: Content fills entire frame, background not visible

**Example**: Portrait video of person → face centered, no background needed

---

### Mode 3: `zoom`

**Description**: Zoom content to fill frame (may lose quality)

**When to use**:
- Low-res content that needs to fill frame
- Artistic zoom effect

**Props**:
```python
{
    "scaleMode": "zoom",
    "zoomFactor": 1.2  # Zoom 20%
}
```

**Visual result**: Content zoomed to fill, may pixelate

**Example**: Small image needs to fill 9:16 frame

---

### Mode 4: `ken-burns` (Images Only)

**Description**: Animated pan + zoom on static image

**When to use**:
- Static landscape images
- Want motion on still content

**Props**:
```python
{
    "animation": "ken-burns",
    "zoomFrom": 1.0,
    "zoomTo": 1.15,          # Zoom from 100% to 115%
    "panDuration": 10        # Over 10 seconds
}
```

**Visual result**: Slow zoom + pan animation on image (cinematic)

**Example**: Landscape photo slowly zooms in over 10 seconds

---

## Typography Guidelines

### Font Sizes by Layer

| Layer | Font Size | Use Case |
|-------|-----------|----------|
| **Hook Title** | 80px | Main title, maximum impact |
| **Title** | 60px | Section headers, chapter titles |
| **Captions** | 48px | Word-by-word voice captions |
| **Footer/CTA** | 36px | Descriptions, calls-to-action |

### Keyword Highlighting

**Technique**: Scale + color change for important words

```python
{
    "keyword": "SHOCKING",
    "scale": 1.2,           # 20% larger
    "color": "#FFD700",     # Gold color
    "duration": 0.3         # 0.3s entrance animation
}
```

**Example**: "5 SHOCKING Facts" → "SHOCKING" scales up and turns gold

### Background Shapes for Readability

**Problem**: Text hard to read on busy backgrounds

**Solution**: Add semi-transparent background boxes

```python
{
    "text": "Important Title",
    "backgroundColor": "rgba(0, 0, 0, 0.7)",  # Dark semi-transparent
    "padding": 20,
    "borderRadius": 10
}
```

**Example**: White text on dark box → always readable

### Animation Timing

| Animation | Duration | Use Case |
|-----------|----------|----------|
| **Entrance** | 0.3-0.5s | Title/caption appears |
| **Word highlight** | 0.2s | Active word highlight |
| **Exit** | 0.2-0.3s | Title/caption disappears |

---

## Auto-Detection Rules

### Landscape Input Detection

**Check**: If any scene has video/image with aspect ratio > 1.2 → landscape

```python
def detect_landscape_input(resources: dict) -> bool:
    for video in resources.get('videos', []):
        if video.get('width', 0) / video.get('height', 1) > 1.2:
            return True
    return False
```

### Layout Preset Suggestion

**Rules**:
- Many scenes (>5) + listicle type → `header-footer`
- Short (<30s) + single image → `minimal`
- Long text in scenes → `text-heavy`
- Default → `balanced`

### Background Type Suggestion

**Rules**:
1. If `backgroundResources` has video for scene → `custom-video`
2. If `backgroundResources` has image for scene → `custom-image`
3. If main content is video → `blur-original`
4. If main content is image → `gradient`
5. Default → `auto` (blur-original fallback)

### Content Positioning Suggestion

**Rules**:
- Portrait or square content (ratio < 1.2) → `crop-to-fill`
- Landscape video → `centered`
- Landscape image → `ken-burns`
- Default → `centered`

---

## Examples & Best Practices

### Example 1: Educational Listicle (Header-Footer Layout)

**Setup**:
```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "header-footer",
    "backgroundType": "blur-original",
    "contentPositioning": "centered"
  }
}
```

**Result**:
- Main title: "5 SAI LẦM HỌC TIẾNG ANH" at top (200px)
- Landscape videos: Centered, blurred background on sides
- Captions: Center (900-1300px), synced with voice
- CTA: "SUBSCRIBE" at bottom (1500px)

**Best for**: Educational content, tutorials, tips

---

### Example 2: Aesthetic Video (Minimal Layout)

**Setup**:
```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "minimal",
    "backgroundType": "blur-original",
    "contentPositioning": "centered"
  }
}
```

**Result**:
- Small branding: Top-left (200px)
- Clean content: No heavy overlays
- Captions only: Bottom (1720px)

**Best for**: Cinematic, ASMR, vlogs, aesthetic content

---

### Example 3: Viral Facts (Text-Heavy Layout)

**Setup**:
```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "text-heavy",
    "backgroundType": "gradient",
    "contentPositioning": "centered"
  }
}
```

**Result**:
- Hook: "10 SHOCKING FACTS" at top (200px)
- Staggered text overlays: (500-1200px)
- CTA: "Which surprised you?" at bottom (1600px)

**Best for**: Tips, hacks, viral facts, quote videos

---

### Example 4: Custom Background Video

**Setup**:
```json
{
  "metadata": {
    "ratio": "9:16",
    "backgroundType": "custom-video",
    "contentPositioning": "centered"
  },
  "resources": {
    "backgroundResources": {
      "videos": [
        {
          "sceneId": "scene_1",
          "localPath": "backgrounds/animated-pattern.mp4"
        }
      ]
    }
  }
}
```

**Result**:
- Background: Custom animated pattern video (fills frame)
- Main content: Landscape video centered on top

**Best for**: Branded content, consistent visual theme

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Text in Danger Zones

**Problem**: Title at 50px gets covered by platform buttons

**Solution**: Use Header Safe (180-350px) for titles

### ❌ Mistake 2: Ignoring Right Margin

**Problem**: Text at x=1000px gets covered by social icons

**Solution**: Keep text left of 920px

### ❌ Mistake 3: Blur on Main Content

**Problem**: Applying blur filter to main content (makes it blurry)

**Solution**: Background is a **separate track** - blur the background, not main content

### ❌ Mistake 4: No Background for Landscape

**Problem**: Landscape video in 9:16 frame leaves black bars on sides

**Solution**: Always add background track for landscape content

### ❌ Mistake 5: Hardcoding Layout Positions

**Problem**: Using fixed Y positions instead of layout presets

**Solution**: Use layout presets, let system calculate safe positions

---

## Configuration Reference

### In script.json metadata

```json
{
  "metadata": {
    "ratio": "9:16",                        // Required for Short format
    "layoutPreset": "header-footer",        // Layout template
    "backgroundType": "blur-original",      // Background source type
    "contentPositioning": "centered",       // Main content positioning
    "backgroundColor": "#000000"            // Solid color (if backgroundType: "solid-color")
  }
}
```

### In resources.json

```json
{
  "resources": {
    "backgroundResources": {
      "videos": [
        {
          "sceneId": "scene_1",
          "localPath": "backgrounds/bg-video.mp4",
          "type": "custom-background",
          "duration": 10
        }
      ],
      "images": [
        {
          "sceneId": "scene_2",
          "localPath": "backgrounds/pattern.png",
          "type": "custom-background"
        }
      ]
    }
  }
}
```

---

## Summary

### Key Takeaways

1. **Background Track System**: Background is Track 0 (separate from main content)
2. **6 Background Types**: custom-video, custom-image, blur-original (recommended), gradient, solid-color, auto
3. **4 Layout Presets**: header-footer (default), minimal, text-heavy, balanced
4. **4 Content Positioning Modes**: centered (default), crop-to-fill, zoom, ken-burns
5. **Safe Zones**: Header (180-350px), Content (350-1400px), Footer (1400-1720px)
6. **Auto-Detection**: System suggests best defaults if not configured

### Quick Start

**Minimum configuration** (auto-detection handles rest):
```json
{
  "metadata": {
    "ratio": "9:16"
  }
}
```

**Recommended configuration**:
```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "header-footer",
    "backgroundType": "auto",
    "contentPositioning": "centered"
  }
}
```

**Advanced configuration** (custom background):
```json
{
  "metadata": {
    "ratio": "9:16",
    "layoutPreset": "header-footer",
    "backgroundType": "custom-video",
    "contentPositioning": "centered"
  },
  "resources": {
    "backgroundResources": {
      "videos": [
        {"sceneId": "scene_1", "localPath": "backgrounds/bg.mp4"}
      ]
    }
  }
}
```

---

**Next Steps**: See [SKILL.md](../SKILL.md) for implementation details and [SCHEMA.md](../SCHEMA.md) for full field reference.
