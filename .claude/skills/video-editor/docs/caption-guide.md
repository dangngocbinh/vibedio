# TikTok Caption Guide

Hướng dẫn sử dụng TikTok-style captions với word-by-word highlighting cho video.

## Quick Start

Trong `script.json`, thêm config subtitle:

```json
{
  "subtitle": {
    "theme": "clean-minimal",
    "position": "bottom"
  }
}
```

**That's it!** Captions sẽ tự động được tạo từ voice timestamps.

## Caption Themes

### 1. clean-minimal (Default - RECOMMENDED)
**Best for:** Educational, professional, tutorial, explainer content

```json
{"subtitle": {"theme": "clean-minimal", "position": "bottom"}}
```

**Features:**
- White rounded background pill
- Black text with gray highlight on active word
- Professional and highly readable
- Lowercase text for modern look
- Subtle fade animation

**When to use:** Default choice for most content, especially educational videos.

---

### 2. gold-bold
**Best for:** Attention-grabbing, news, facts, shocking reveals, Vietnamese content

```json
{"subtitle": {"theme": "gold-bold", "position": "bottom"}}
```

**Features:**
- Bold yellow text (#FFD700)
- Thick black outline (8px stroke)
- White highlight on active word
- Uppercase text
- Scale animation (1.15x)

**When to use:** Viral content, dramatic reveals, news-style videos, content that needs maximum attention.

---

### 3. drop-green
**Best for:** Dynamic, action, energetic, sports, gaming

```json
{"subtitle": {"theme": "drop-green", "position": "bottom"}}
```

**Features:**
- Words drop into place (50px drop animation)
- Green highlight (#22c55e) on active word
- Dark text with black stroke
- Uppercase text
- Energetic drop animation

**When to use:** Fast-paced content, gaming videos, sports highlights, action clips.

---

### 4. red-box
**Best for:** Important points, calls to action, warnings, emphasis

```json
{"subtitle": {"theme": "red-box", "position": "bottom"}}
```

**Features:**
- Active word gets red background box (#dc2626)
- White text throughout
- Black stroke
- Uppercase text
- Scale animation with emphasis

**When to use:** Key points, CTAs, warnings, whenever you need strong emphasis.

---

### 5. impact-yellow
**Best for:** Hooks, viral content, shocking reveals, maximum impact

```json
{"subtitle": {"theme": "impact-yellow", "position": "bottom"}}
```

**Features:**
- Extra large text (80px)
- Yellow color (#FCD34D)
- Heavy black stroke (10px)
- White highlight on active
- Bounce animation for impact

**When to use:** Video hooks (first 3 seconds), shocking reveals, viral moments.

---

### 6. neon-glow
**Best for:** Night scenes, tech, futuristic, cyberpunk, gaming

```json
{"subtitle": {"theme": "neon-glow", "position": "bottom"}}
```

**Features:**
- Cyan base color (#06b6d4)
- Pink glow on active word (#f0abfc)
- Multiple glow shadows
- Wide letter spacing
- Tech/futuristic aesthetic

**When to use:** Tech content, night footage, futuristic themes, gaming.

---

### 7. story-elegant
**Best for:** Storytelling, emotional content, narrative, poetry

```json
{"subtitle": {"theme": "story-elegant", "position": "bottom"}}
```

**Features:**
- Serif font (Playfair Display)
- White text with warm gold highlight (#fbbf24)
- Soft shadow
- Gentle fade animation
- Elegant and emotional

**When to use:** Story videos, emotional content, poetry, artistic narratives.

---

### 8. minimal-dark
**Best for:** Minimalist, aesthetic, art, design content

```json
{"subtitle": {"theme": "minimal-dark", "position": "bottom"}}
```

**Features:**
- Simple dark gray text
- No stroke, minimal shadow
- Clean and aesthetic
- Fade animation
- Modern minimalist

**When to use:** Aesthetic content, minimalist design, art videos, photography.

---

## Position Options

Control where captions appear on screen:

```json
{
  "subtitle": {
    "theme": "clean-minimal",
    "position": "bottom"  //  "bottom" | "bottom-high" | "top" | "center" 
  }
}
```

**Positions:**
- `bottom` (default) - 8% from bottom, TikTok standard
- `bottom-high` - 20% from bottom, avoid UI elements
- `center` - Perfect center, for emphasis
- `top` - 15% from top, when bottom is busy

**Best Practice:** Use `bottom` for 95% of content. Only change if you have specific visual needs (e.g., lower third graphics blocking bottom).

---

## Advanced Customization

Override theme defaults:

```json
{
  "subtitle": {
    "theme": "clean-minimal",
    "position": "bottom",
    "font": "Roboto",           // Override theme font
    "highlightColor": "#ff0000" // Override highlight color
  }
}
```

**Warning:** Only override if absolutely necessary. Themes are carefully designed for readability and impact.

---

## Best Practices

### ✅ DO:
1. **Use `clean-minimal` as default** - Works for 80% of content
2. **Match theme to content mood** - Educational → clean-minimal, Viral → gold-bold/impact-yellow
3. **Keep position at `bottom`** - Standard TikTok/Reels placement
4. **Let themes handle styling** - Don't override unless necessary
5. **Test readability** - Ensure text is readable over your footage

### ❌ DON'T:
1. **Don't use center position by default** - Bottom is standard
2. **Don't mix multiple themes** - One theme per video
3. **Don't override colors randomly** - Themes are designed for contrast
4. **Don't use complex themes for long videos** - Simple themes are less fatiguing
5. **Don't forget to check on mobile** - Most viewers watch on phones

---

## Auto Theme Selection (Future)

Themes can auto-select based on content keywords:

```python
# In your script generation:
content_type = analyze_content(script)
if content_type in ['educational', 'tutorial']:
    theme = 'clean-minimal'
elif content_type in ['shocking', 'viral']:
    theme = 'impact-yellow'
elif content_type in ['story', 'emotional']:
    theme = 'story-elegant'
# ... etc
```

---

## Examples

### Educational Video
```json
{
  "subtitle": {
    "theme": "clean-minimal",
    "position": "bottom"
  }
}
```

### Viral Facts Video
```json
{
  "subtitle": {
    "theme": "gold-bold",
    "position": "bottom"
  }
}
```

### Gaming Highlight
```json
{
  "subtitle": {
    "theme": "drop-green",
    "position": "bottom-high"
  }
}
```

### Story/Emotional
```json
{
  "subtitle": {
    "theme": "story-elegant",
    "position": "bottom"
  }
}
```

---

## Troubleshooting

### Captions not showing?
1. Check `voice.json` has `timestamps` array
2. Ensure `voice.enabled = true` in script.json
3. Check console for errors

### Captions appearing in wrong position?
- Verify `position` in script.json subtitle config
- Default should be `bottom`, not `center`

### Theme not applying?
1. Check theme name spelling (lowercase, hyphenated)
2. Verify theme exists in `caption-themes.ts`
3. Fallback is always `clean-minimal`

### Captions flickering/unstable?
- This has been fixed in latest version
- Update to latest TikTokCaption.tsx
- Report if issue persists

---

## Technical Details

Captions are rendered using:
- **Component:** `TikTokCaption.tsx`
- **Themes:** `caption-themes.ts`
- **Generator:** `subtitle_generator.py`
- **Track:** Separate Captions track in OTIO

**Performance:** Captions are highly optimized with:
- Memoized calculations
- Efficient word windowing (4 words max)
- No re-renders on non-active frames
- GPU-accelerated animations
