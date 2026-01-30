# Layer Effect Component Guide

The `LayerEffect` component allows you to add modern visual accents and motion graphics to your video. These include geometric shapes, HUD elements, neon lines, and more. It can also load custom Lottie animations or images.

## Basic Usage

```json
{
    "metadata": {
        "remotion_component": "LayerEffect",
        "props": {
            "type": "neon-circle",
            "animation": "rotate",
            "width": 400,
            "height": 400,
            "color": "#00ff00"
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'custom'` | Type of effect: `neon-circle`, `scan-lines`, `burst`, `techno-triangle`, `custom`. |
| `src` | string | `undefined` | URL for Lottie/Image (if type is `custom` or omitted). |
| `top` | number/string | `undefined` | Top position (e.g., `50%`, `100`). |
| `left` | number/string | `undefined` | Left position. |
| `right` | number/string | `undefined` | Right position. |
| `bottom` | number/string | `undefined` | Bottom position. |
| `width` | number/string | `300` | Width of the effect container. |
| `height` | number/string | `300` | Height of the effect container. |
| `animation` | string | `'fade'` | Entry animation: `fade`, `scale`, `rotate`, `pulse`. |
| `enterDuration`| number | `15` | Duration of entry animation in frames. |
| `exitDuration` | number | `15` | Duration of exit animation in frames. |
| `color` | string | `'#00d4ff'` | Main color for built-in SVG effects. |
| `secondaryColor` | string | `'#ffae00'` | Secondary color for built-in effects. |
| `speed` | number | `1` | Animation speed multiplier. |
| `scale` | number | `1` | Base scale transformation. |
| `rotation` | number | `0` | Base rotation in degrees. |
| `opacity` | number | `1` | Base opacity. |

## Built-in Effects

## Built-in Effects Library
*(Use `type="color"` to customize)*

### Tech & HUD
- **`neon-circle`**: Classic rotating HUD ring.
- **`radar-sweep`**: Green radar scanning with blips.
- **`crosshair`**: Sniper/Gaming reticle.
- **`target-scope-a`**: Complex aiming scope.
- **`scan-lines`**: CCTV/CRT Monitor effect.
- **`cyber-frame-corners`**: Futuristic UI corner brackets.
- **`digital-noise`**: Glitchy pixel artifacts.
- **`loading-dots`**: 3 dots horizontal loader.

### Geometric & Abstract
- **`rotating-squares`**: Two squares rotating in opposition.
- **`concentric-circles`**: Multiple rings rotating at different speeds.
- **`dashed-ring`**: Thick dashed circle (good for timers).
- **`techno-triangle`**: Nested sci-fi triangles.
- **`burst`**: Impact shape explosion.
- **`zigzag-wave`**: Electrical high-frequency wave.
- **`hex-hive`**: Honeycomb grid background.
- **`floating-shapes`**: Random floating geometric particles.

### Comic & Hand-drawn
- **`comic-boom`**: Pop-art "BOOM!" text.
- **`speed-lines-radial`**: Anime-style focus lines.
- **`hand-drawn-circle`**: Sketchy circle for highlighting.

### Nature & Misc
- **`particles`**: Floating bokeh/dust.
- **`sound-wave`**: Audio visualizer bars.
- **`arrow-chevron-right`**: Directional arrows.
- **`glitch-bars`**: Horizontal interference bars.

## Custom Assets

You can use `type="custom"` (or just omit `type`) and provide a `src`.
- **Lottie:** Provide a `.json` URL (e.g., from Noto Emoji or LottieFiles).
- **Image:** Provide a `.png` / `.svg` / `.webp` path.

```json
{
    "remotion_component": "LayerEffect",
    "props": {
        "src": "https://assets10.lottiefiles.com/packages/lf20_w51pcehl.json",
        "width": 500
    }
}
```
