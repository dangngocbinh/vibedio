# Listicle Video Strategy

## Overview
Listicle videos present numbered lists of items (e.g., "5 mistakes...", "Top 10..."). They're highly engaging for short-form content.

## Track Structure

```
Track 1: B-Roll Video     - Stock footage for each scene
Track 2: Item Numbers     - Graphic overlays (1, 2, 3...)
Track 3: Subtitles        - Word-level captions
Track 4: Voice            - Voiceover audio
Track 5: Background Music - Upbeat music with fade-in
```

## Scene Flow

Typical listicle structure:
```
Hook (5s) → Item 1 (10s) → Item 2 (10s) → Item 3 (10s) → Item 4 (10s) → Item 5 (10s) → CTA (5s)
```

Total: 60 seconds for 5-item list

## Scene ID Mapping

| Scene ID | Purpose | Duration | Resources |
|----------|---------|----------|-----------|
| `hook` | Attention-grabbing intro | 3-7s | High-energy stock video |
| `item1` - `itemN` | Individual list items | 8-12s each | Relevant B-roll footage |
| `cta` | Call to action / outro | 5-10s | Engaging closing shot |

## Visual Transitions

- **Between Items**: 0.5s fade transition
- **Hook → Item 1**: Direct cut (no transition)
- **Last Item → CTA**: Direct cut

## Component Usage

### ItemNumber Component
Displays item number as graphic overlay:

```json
{
  "remotion_component": "ItemNumber",
  "props": {
    "number": "1",
    "style": "circle",     // or "square", "minimal"
    "position": "top-left"
  }
}
```

### TikTokCaption Component
Word-by-word subtitle highlighting:

```json
{
  "remotion_component": "TikTokCaption",
  "props": {
    "text": "5 sai lầm khi học",
    "words": [
      {"word": "5", "start": 0, "end": 0.32},
      {"word": "sai", "start": 0.32, "end": 0.66}
    ],
    "style": "highlight-word",
    "highlightColor": "#FFD700"
  }
}
```

## Timing Strategy

### Word Count Guidelines
- **60s video**: 130-150 words (140 WPM reading speed)
- Hook: 15-20 words
- Each item: 20-25 words
- CTA: 10-15 words

### Pacing
- Hook: Fast, punchy delivery
- Items: Steady, clear pace
- CTA: Slower, emphatic

## Asset Selection Priority

From resources.json:

1. **Videos**: `downloadUrls.hd` > `downloadUrls.sd` > `url`
2. **Images**: Used only if no video available
3. **Music**: First result from `music` array with 2s fade-in
4. **Fallback**: If scene resource missing, use previous scene or placeholder

## Best Practices

### Visual Selection
- **Hook**: Shocking/surprising imagery
- **Items**: Clear, simple visuals matching topic
- **CTA**: Friendly face or branded graphic

### Item Number Design
- Use contrasting colors for visibility
- Position consistently (top-left recommended)
- Animate entrance (0.3s fade-in)

### Subtitle Optimization
- Max 5 words per phrase
- Center position for portrait videos
- High contrast highlight color (#FFD700 yellow works well)

## Example: "5 Mistakes When Learning English"

### Track Breakdown

**B-Roll (Track 1):**
```
hook    → Frustrated student (5s)
item1   → Person speaking incorrectly (10s)
  [0.5s fade transition]
item2   → Grammar book confusion (10s)
  [0.5s fade transition]
item3   → Pronunciation struggle (10s)
  [0.5s fade transition]
item4   → Reading without context (10s)
  [0.5s fade transition]
item5   → Fear of speaking (10s)
cta     → Success celebration (5s)
```

**Item Numbers (Track 2):**
```
item1 → "1" (10s @ top-left)
item2 → "2" (10s @ top-left)
item3 → "3" (10s @ top-left)
item4 → "4" (10s @ top-left)
item5 → "5" (10s @ top-left)
```

**Subtitles (Track 3):**
```
"5 sai lầm" (0-1s)
"khi học tiếng Anh" (1-2.5s)
"mà bạn cần tránh" (2.5-4s)
...
```

**Voice (Track 4):**
```
Full voiceover.mp3 (60s)
```

**Music (Track 5):**
```
Upbeat background music (60s)
- 2s fade-in
- Volume: 0.2
```

## Common Pitfalls

### ❌ Too Many Items
- 7+ items in 60s = rushed delivery
- Solution: Limit to 5-6 items max

### ❌ Inconsistent Item Length
- Some items 5s, others 15s
- Solution: Keep items within ±2s of each other

### ❌ Missing Transitions
- Hard cuts between items feel jarring
- Solution: Use 0.5s fade transitions

### ❌ Number Overlap with Text
- Number graphic covers important visual
- Solution: Position numbers in consistent, unobtrusive spot

## Rendering Notes

- **Resolution**: 1080x1920 (portrait) recommended for TikTok/Reels
- **FPS**: 30fps standard
- **Codec**: H.264 for maximum compatibility
- **Audio**: AAC, voice at -14 LUFS, music at -20 LUFS
