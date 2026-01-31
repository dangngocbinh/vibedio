# VIDEO EDITOR SKILL

## MỤC ĐÍCH

Tạo file OTIO timeline từ outputs của 3 skills upstream:
- video-script-generator → `script.json`
- voice-generation → `voice.mp3 hoặc voice.wav` + `voice.json`
- video-resource-finder → `resources.json`

Output: `project.otio` file render được trong Remotion với OtioPlayer.tsx component.

## WORKFLOW

```
public/projects/{project-name}/
├── script.json      (input)
├── voice.json       (input)
├── resources.json   (input)
└── project.otio     (OUTPUT - skill này tạo ra)
```

## SUPPORTED VIDEO TYPES

| Type | Status | Track Structure |
|------|--------|-------------------|
| **listicle** | ✅ Implemented | B-Roll + Graphics + Subtitles + Voice + Music |
| **image-slide** | ✅ Implemented | Images (với effects) + Subtitles + Voice + Music |
| **multi-video-edit** | ✅ **NEW** | Base Videos (embedded audio) + Title Cards + B-roll (smart) + Captions + Music |
| **facts** | 🚧 Planned | Video + Fact Callouts + Subtitles + Voice + Music |
| **motivation** | 🚧 Planned | Cinematic + Quotes + Subtitles + Voice + Music |
| **story** | 🚧 Planned | Narrative + Chapters + Subtitles + Voice + SFX + Music |

### Multi-Video-Edit Type (NEW)

User-provided videos (1 hoặc nhiều MP4 files) được edit với:
- **Embedded audio** - Sử dụng luôn audio gốc của video (đồng bộ tuyệt đối), không tách riêng
- **AI content analysis** - Tự động detect hook, intro, sections, outro
- **Smart B-roll mode** - AI quyết định replace/overlay/skip dựa trên video content
- **Title cards** - Full screen transitions giữa các sections
- **Sync-safe captions** - Reference về sourceVideoId, auto-update khi clip move

### Image-Slide Video Type (NEW)

Dành cho video tạo từ ảnh AI (Gemini) hoặc stock images với:
- **Voice-synced timing** - Ảnh sync chính xác với voice timestamps
- **AI auto-suggest effects** - Zoom, Ken Burns, Slide dựa trên content
- **AI auto-suggest transitions** - Crossfade, Cut, Dissolve dựa trên mood
- **TikTok highlight captions** - Word-by-word highlight

## INPUT FILES SCHEMA

### What's Required?

The skill now **auto-populates missing fields** with sensible defaults. You only need:

**Minimum required in `script.json`:**
```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "image-slide",
    "duration": 300
  },
  "scenes": [
    {"id": "scene_1", "text": "Scene 1", "duration": 10, "startTime": 0, "endTime": 10}
  ]
}
```

**Everything else** (voice, music, subtitle, script metadata) will be auto-created with defaults.

### Full Field Reference

See **`SCHEMA.md`** for complete documentation:
- All required fields (metadata, scenes)
- All optional fields with auto-generated defaults
- Validation rules and examples

### Auto-Populated Fields

If these fields are missing, they're created automatically:
- `script` → empty narration metadata
- `voice` → null provider (pre-recorded)
- `music` → disabled by default
- `subtitle` → default styling (Arial, center, yellow)
- `metadata.width/height/ratio` → 1920x1080, 16:9

**Benefit**: Minimal configuration for simple projects ✅

## USAGE

### Basic Usage

```bash
python3 .claude/skills/video-editor/cli.py public/projects/5-sai-lam-hoc-tieng-anh
```

Output:
```
📂 Project: 5-sai-lam-hoc-tieng-anh
✓ Loaded inputs from projects/5-sai-lam-hoc-tieng-anh
✓ Video type: listicle (60s @ 30fps)
✓ Using ListicleStrategy
✓ Built timeline with 5 track(s)
✓ Saved timeline to: projects/5-sai-lam-hoc-tieng-anh/project.otio

🎬 Timeline generation complete!
   Next: Load 'project.otio' in Remotion Studio
```

### Advanced Options

```bash
# Custom FPS
python .claude/skills/video-editor/cli.py public/projects/my-project --fps 60

# Custom output path
python .claude/skills/video-editor/cli.py public/projects/my-project -o custom.otio

# Validate inputs only (no generation)
python .claude/skills/video-editor/cli.py public/projects/my-project --validate-only

# Verbose mode
python .claude/skills/video-editor/cli.py public/projects/my-project -v
```

## CRITICAL FEATURE: RELATIVE PATHS

🔑 **All paths trong OTIO are relative** để project folder có thể di chuyển:

### Path Examples

```python
# ✅ CORRECT - Relative paths
voice.wav                           # Same folder as project.otio
../../public/audio/music.wav        # Shared public assets
https://cdn.pixabay.com/video.mp4   # Remote URLs

# ❌ WRONG - Absolute paths (breaks portability)
/Users/binhpc/code/automation-video/public/projects/my-project/voice.wav
file:///absolute/path/to/voice.wav
```

### Why Relative Paths?

✅ Copy `public/projects/my-project/` anywhere → still works
✅ Share project folder với team → paths valid
✅ Move project to production server → no path updates needed

## 🛡️ VALIDATION & SAFE SAVE

Skill này áp dụng quy trình **Safe-Save** để bảo vệ project khỏi các lỗi render trong Remotion Studio:

1. **Validation**: Sau khi xử lý logic, script sẽ lưu vào file `.otio.tmp`.
2. **Check Rules**: 
   - Không được có 2 Transitions đứng cạnh nhau.
   - Thời lượng của Transition không được lớn hơn thời lượng của Clip đứng trước/sau nó.
3. **Commit**: Nếu thỏa mãn các quy tắc, file `.tmp` mới được ghi đè vào `project.otio`.

Luôn sử dụng `otio_validator.py` khi viết các script can thiệp vào timeline.

## INPUT REQUIREMENTS

### 1. script.json (Required)

#### Aspect Ratio Support
`script.json` chứa thông tin `ratio`, `width`, `height` trong `metadata`:
```json
{
  "metadata": {
    "ratio": "9:16",
    "width": 1080,
    "height": 1920
  }
}
```

**Supported ratios**: `9:16` (1080×1920), `16:9` (1920×1080), `1:1` (1080×1080), `4:5` (1080×1350)

Video editor sẽ đọc `metadata.ratio` và ghi vào `project.otio` metadata để OtioPlayer/Remotion render đúng kích thước.

Nếu `ratio` không có trong script.json, mặc định là `9:16` (1080×1920).

#### For Listicle Type:
```json
{
  "metadata": {
    "projectName": "5-sai-lam-hoc-tieng-anh",
    "videoType": "listicle",
    "duration": 60,
    "ratio": "9:16",
    "width": 1080,
    "height": 1920
  },
  "scenes": [
    {"id": "hook", "startTime": 0, "duration": 5},
    {"id": "item1", "startTime": 5, "duration": 10}
  ],
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#FFD700"
  }
}
```

#### For Image-Slide Type:
```json
{
  "metadata": {
    "projectName": "su-that-ve-meo",
    "videoType": "image-slide",
    "duration": 20
  },
  "scenes": [
    {
      "id": "hook",
      "text": "Bạn có biết mèo ngủ tới 70% cuộc đời?",
      "visualSuggestion": {
        "type": "stock",
        "query": "sleeping cat close up"
      }
    },
    {
      "id": "fact1",
      "text": "Mèo không thể cảm nhận vị ngọt.",
      "visualSuggestion": {
        "type": "ai-generated",
        "prompt": "A cat looking at candy, confused expression"
      }
    }
  ],
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#F4D03F"
  }
}
```

**Required fields:**
- `metadata.videoType` - determines which strategy to use (`listicle`, `image-slide`)
- `metadata.duration` - expected total duration
- `scenes` - array with `id`, `text` (for image-slide)
- `scenes[].visualSuggestion` - optional, for AI effect suggestion

### 2. voice.json (Required)
```json
{
  "text": "Full script text",
  "timestamps": [
    {"word": "5", "start": 0, "end": 0.32},
    {"word": "sai", "start": 0.32, "end": 0.66}
  ]
}
```

**Required fields:**
- `timestamps` - word-level timing for subtitles

### 3. resources.json (Required)
```json
{
  "resources": {
    "videos": [
      {
        "sceneId": "hook",
        "results": [
          {
            "downloadUrls": {"hd": "https://...", "sd": "https://..."}
          }
        ]
      }
    ],
    "music": [
      {
        "results": [{"downloadUrl": "https://..."}]
      }
    ]
  }
}
```

**Required fields:**
- At least one of: `videos`, `images`, `music`, `soundEffects`

### Output Track Ordering Policy

Để đảm bảo UI trong Remotion Studio không bị rối (do track Phụ đề thường có rất nhiều clip nhỏ) và Phụ đề luôn hiển thị trên cùng, áp dụng thứ tự sau:

1. **Visual Tracks**: Images, Videos, Title Cards, B-roll.
2. **Audio Tracks**: Voice, Background Music.
3. **Control Tracks**: Trống (nếu có).
4. **Captions/Subtitles**: LUÔN LUÔN ở vị trí cuối cùng trong file OTIO.

## OUTPUT STRUCTURE

### Listicle Timeline (5 tracks)

```
project.otio
├── Track 1: B-Roll (Video)
│   ├── hook.mp4 (5s)
│   ├── [Fade transition 0.5s]
│   ├── item1.mp4 (10s)
│   ├── [Fade transition 0.5s]
│   └── ...
├── Track 2: Item Numbers (Video)
│   ├── ItemNumber #1 component (10s)
│   ├── ItemNumber #2 component (10s)
│   └── ...
├── Track 3: Subtitles (Video)
│   ├── TikTokCaption phrase 1
│   ├── TikTokCaption phrase 2
│   └── ...
├── Track 4: Voice (Audio)
│   └── voice.mp3 (60s)
└── Track 5: Music (Audio)
    └── background-music.mp3 (60s, fade-in 2s)
```

### Image-Slide Timeline (4 tracks) - NEW

```
project.otio
├── Track 1: Images (Video) - Voice-synced timing
│   ├── hook.png (3.1s) [effect: zoom-in, intensity: 0.7]
│   ├── [Crossfade transition 0.5s]
│   ├── fact1.png (2.7s) [effect: ken-burns, intensity: 0.5]
│   ├── [Crossfade transition 0.5s]
│   └── cta.png (0.9s) [effect: zoom-in, intensity: 0.7]
├── Track 2: Subtitles (Video)
│   ├── TikTokCaption "Bạn có biết..."
│   ├── TikTokCaption "mèo ngủ..."
│   └── ...
├── Track 3: Voice (Audio)
│   └── voice.mp3 (synced duration)
└── Track 4: Music (Audio) - Optional
    └── background-music.mp3 (fade-in 2s)
```

**Key Features:**
- Image duration = voice timing (not fixed script duration)
- Effects auto-suggested based on content keywords
- Transitions auto-suggested based on scene mood

## LAYER TITLE OVERLAYS

### Overview

LayerTitle component cho phép thêm title overlays vào bất kỳ vị trí nào trong timeline. Sử dụng để tạo:
- **Title hooks** - Thu hút attention ở đầu video
- **Lower-thirds** - Giới thiệu người nói, địa điểm
- **Corner badges** - Status indicators (LIVE, HOT, NEW)
- **Full-screen titles** - Intro/outro, chapter transitions

### Usage in OTIO

Thêm track "Title Overlays" vào timeline:

```json
{
    "OTIO_SCHEMA": "Track.1",
    "name": "Title Overlays",
    "kind": "Video",
    "children": [
        {
            "OTIO_SCHEMA": "Clip.2",
            "metadata": {
                "remotion_component": "LayerTitle",
                "props": {
                    "title": "Your Title Text",
                    "subtitle": "Optional subtitle",
                    "style": "centered",
                    "animation": "scale",
                    "backgroundColor": "#FFD700",
                    "textColor": "#FF0000",
                    "fontSize": 64
                }
            },
            "name": "Title Hook",
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "duration": { "rate": 30.0, "value": 150.0 },
                "start_time": { "rate": 30.0, "value": 0.0 }
            }
        }
    ]
}
```

### Available Styles

| Style | Position | Use Case |
|-------|----------|----------|
| `centered` | Center screen (90% width, 40% height) | Title hooks, chapter titles |
| `lower-third` | Bottom-left (60% max-width) | Speaker names, locations |
| `corner-badge` | Top-right (compact) | Status tags (LIVE, HOT) |
| `full-screen` | Full screen | Intro/outro screens |

### Available Animations

| Animation | Effect | Best For |
|-----------|--------|----------|
| `scale` | Zoom 0.8 → 1.0 | centered, full-screen |
| `slide-up` | Slide from bottom | lower-third |
| `slide-left` | Slide from right | corner-badge |
| `fade` | Fade in/out | All styles |
| `typewriter` | Type character-by-character | Quotes, captions |

### Props Reference

```typescript
{
  title: string;              // Required: main text
  subtitle?: string;          // Optional: secondary text
  style?: 'centered' | 'lower-third' | 'corner-badge' | 'full-screen';
  animation?: 'scale' | 'slide-up' | 'slide-left' | 'fade' | 'typewriter';
  backgroundColor?: string;   // Default: 'rgba(6, 182, 79, 0.85)'
  textColor?: string;         // Default: '#eb0000ff'
  accentColor?: string;       // Default: '#ffae00ff'
  fontSize?: number;          // Default: 48
  subtitleSize?: number;      // Default: 28
  showAccentLine?: boolean;   // Default: true
  enterDuration?: number;     // Frames for enter animation
  exitDuration?: number;      // Frames for exit animation
  fontFamily?: string;        // Optional: Google Font name
}
```

### Track Order (Important!)

Place "Title Overlays" track **AFTER** "Subtitles" track to display titles on top:

```
1. Images (Video)
2. Subtitles (Video)
3. Title Overlays (Video)  ← Place AFTER Subtitles
4. Voice (Audio)
5. Background Music (Audio)
```

### Example: Title Hook

```json
{
    "metadata": {
        "remotion_component": "LayerTitle",
        "props": {
            "title": "5 SAI LẦM KHI HỌC TIẾNG ANH",
            "style": "centered",
            "animation": "scale",
            "backgroundColor": "#FFD700",
            "textColor": "#FF0000",
            "fontSize": 64
        }
    },
    "source_range": {
        "duration": { "rate": 30, "value": 150 }  // 5 seconds
    }
}
```

### Full Documentation

See [docs/layer-title-guide.md](docs/layer-title-guide.md) for detailed guide with examples.

## FULLSCREEN TITLE

### Overview

FullscreenTitle component tạo title screens chiếm **toàn bộ khung hình** với hình nền đẹp mắt. Sử dụng cho:
- **Intro/Outro** - Màn hình mở đầu/kết thúc video
- **Chapter dividers** - Phân đoạn giữa các phần
- **Quote screens** - Hiển thị quotes nổi bật
- **Transition screens** - Chuyển cảnh có nội dung

### Usage in OTIO

Thêm clip FullscreenTitle vào track "Title Overlays":

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "TOP 10 SỰ THẬT",
            "subtitle": "BẠN CHƯA BAO GIỜ BIẾT",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "textStyle": "bold-shadow",
            "animation": "zoom-fade",
            "titleSize": 120,
            "showParticles": true
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

### Available Templates (NEW)

Now supports **40 named templates** like `cinematic-intro`, `tech-hub`, `neon-night`, `breaking-news-full`, `space-odyssey`, `luxury-gold` etc. to instantly apply professional designs.
See full list in [docs/fullscreen-title-guide.md](docs/fullscreen-title-guide.md).

### Background Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `solid` | Màu đơn sắc | `#FF5733`, `#1a1a2e` |
| `gradient` | Gradient presets | `sunset`, `ocean`, `fire`, `neon`, `dark` |
| `image` | Ảnh nền | `public/images/bg.jpg` |
| `pattern` | Patterns lặp lại | `dots`, `lines`, `grid` |
| `video-blur` | Blur video phía dưới | `blur-20` |

### Text Styles

| Style | Effect | Best For |
|-------|--------|----------|
| `bold-shadow` | Chữ đậm + bóng đổ mạnh | Default, nổi bật |
| `glow` | Chữ phát sáng | Gaming, tech, neon |
| `outline` | Viền chữ không fill | Modern, clean |
| `3d` | Hiệu ứng 3D layers | Eye-catching, retro |
| `minimal` | Đơn giản | Professional, elegant |
| `gradient-text` | Gradient trên chữ | Trendy, colorful |

### Animations

| Animation | Effect | Use Case |
|-----------|--------|----------|
| `zoom-fade` | Zoom + fade in | Default, versatile |
| `slide-up-bounce` | Trượt lên + bounce | Energetic |
| `reveal-left` | Lộ từ trái | Professional |
| `blur-in` | Blur → sharp | Cinematic |
| `typewriter` | Gõ từng chữ | Storytelling |
| `glitch` | Hiệu ứng nhiễu | Tech, gaming |
| `split` | Tách rồi nhập | Creative |

### Props Reference

```typescript
{
  // Content
  title: string;              // Required: main title
  subtitle?: string;          // Optional: subtitle

  // Background
  backgroundType?: 'solid' | 'gradient' | 'image' | 'pattern' | 'video-blur';
  backgroundValue?: string;   // Color/preset/path
  backgroundOverlay?: string; // Overlay color (e.g., 'rgba(0,0,0,0.5)')

  // Text
  textStyle?: 'bold-shadow' | 'glow' | 'outline' | '3d' | 'minimal' | 'gradient-text';
  textColor?: string;         // Default: '#ffffff'
  accentColor?: string;       // Default: '#00d4ff'
  titleSize?: number;         // Default: 96
  subtitleSize?: number;      // Default: 36
  fontFamily?: string;        // Default: 'Inter, Montserrat, system-ui'

  // Position
  verticalAlign?: 'top' | 'center' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
  padding?: number;           // Default: 60

  // Animation
  animation?: string;         // See animations table
  enterDuration?: number;     // Frames for enter
  exitDuration?: number;      // Frames for exit

  // Effects
  showParticles?: boolean;    // Default: false
  showVignette?: boolean;     // Default: true
  animateBackground?: boolean; // Default: true (subtle rotation/zoom)
}
```

### Example: Intro Screen

```json
{
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "BÍ MẬT VŨ TRỤ",
            "subtitle": "KHÁM PHÁ NHỮNG ĐIỀU CHƯA BIẾT",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "textStyle": "bold-shadow",
            "animation": "zoom-fade",
            "titleSize": 120,
            "showParticles": true,
            "showVignette": true
        }
    },
    "source_range": {
        "duration": { "rate": 30, "value": 150 }  // 5 seconds
    }
}
```

### Comparison: LayerTitle vs FullscreenTitle

| Feature | LayerTitle | FullscreenTitle |
|---------|------------|-----------------|
| Coverage | Partial overlay | Full screen |
| Background | Solid color only | Gradient, image, pattern |
| Font size | 48px (default) | 96px (default) |
| Use case | Overlay on video | Intro, outro, chapters |
| Text effects | Basic | Advanced (glow, 3D, outline) |
| Particles | No | Yes |
| Background animation | No | Yes (subtle rotation/zoom) |
| zIndex | 100 | 1000 |

### Full Documentation

See [docs/fullscreen-title-guide.md](docs/fullscreen-title-guide.md) for detailed guide with gradient presets, design tips, and examples.

## LOWER THIRD TEMPLATES

### Overview

`LowerThird` component cung cấp **40 mẫu** tiêu đề ở phần dưới màn hình (lower-thirds) được thiết kế chuyên nghiệp và đa dạng phù hợp cho nhiều loại video:
- **Speaker ID** - Giới thiệu tên và chức danh người đang nói
- **Social Media** - Hiển thị YouTube, Instagram, TikTok handles
- **Broadcast/News** - Mẫu tin tức, thể thao, Breaking News
- **Special Effects** - Gaming Glitch, Cyberpunk, Hologram, Liquid
- **Elegant** - Luxury Gold, Wedding, Elegant Serif
- **Context Info** - Tech Grid, Industrial Steel, Blueprint

### Available Templates

| Group | Templates |
|-------|-----------|
| **Modern & Basic** | `modern-skew`, `minimal-bold`, `playful-round`, `corporate-clean` |
| **Elegant & Luxury**| `elegant-serif`, `luxury-gold`, `wedding-floral`, `glass-modern` |
| **Broadcast & News**| `breaking-news`, `classic-tv`, `sports-ticker`, `documentary-sidebar` |
| **Social Media** | `social-youtube`, `social-insta`, `ribbon-tag` |
| **Creative Arts** | `hand-drawn`, `brush-stroke`, `ink-bleed`, `origami`, `comic-pop` |
| **Tech & Futuristic**| `tech-grid`, `cyberpunk-hud`, `hologram`, `blueprint`, `industrial-steel` |
| **Dynamic Effects** | `split-reveal`, `gradient-wave`, `neon-glow`, `gaming-glitch`, `liquid-motion`, `confetti`, `border-animate`, `shadow-stack`, `floating-bubbles`, `stencil-cut` |
| **Nature & Theme** | `nature-eco`, `space-cosmos`, `chalkboard`, `quote-box` |

### Usage in OTIO

```json
{
    "remotion_component": "LowerThird",
    "props": {
        "title": "DƯƠNG VƯỢT BIỂN",
        "subtitle": "Kỹ Sư Xây Dựng",
        "template": "modern-skew",
        "primaryColor": "#3498db",
        "fontFamily": "Inter" // Optional: Google Font name
    }
}
```

### Full Documentation

See [docs/lower-third-guide.md](docs/lower-third-guide.md) for details on all templates and props.

## CALL TO ACTION TEMPLATES

### Overview

`CallToAction` component cung cấp **120 mẫu** nút bấm, thông báo, social media handles để tăng tương tác người xem (Subscribe, Follow, Buy Now, Click Link).

### Available Groups

| Group | Description |
|-------|-------------|
| **Social Media** | YouTube, Instagram, TikTok, Facebook, Twitter, Discord, Patreon |
| **Commercial** | App Store, Google Play, Shop Now, Discount, QR Code |
| **Generic** | Buttons (Blue, Gradient, 3D, Outline) |
| **Effects** | Neon, Glitch, Pixel, Glassmorphism, Hand-drawn |
| **Interactive** | Mouse Click, Finger Tap, Live Badge |
| **E-commerce** | Flash Sale, Add to Cart, BOGO, Promo Code, Pre-order |
| **Tech & SaaS** | Free Trial, Download, AI Feature, Cloud Sync, API Key |
| **Health** | Book Appointment, Telehealth, Organic, Workout, Nutrition |
| **Education** | Enroll Now, eBook, Webinar, Certificate, Quiz |
| **Finance** | Crypto, Stocks, Invest, Secure Pay, Wallet |
| **Real Estate** | Open House, Sold, Virtual Tour, Mortgage, Agent |
| **Travel** | Book Flight, Hotel, Passport, Luggage, Explore |
| **Food** | Delivery, Menu, Chef Choice, Vegan, Combo |

### Usage in OTIO

```json
{
    "remotion_component": "CallToAction",
    "props": {
        "template": "classic-youtube",
        "title": "SUBSCRIBE",
        "subtitle": "1M Subs",
        "fontFamily": "Anton" // Optional: Specify any Google Font name
    }
}
```

### Font Usage
Component tự động load Google Fonts từ tên được cung cấp trong `fontFamily`.
Ví dụ:
- `fontFamily: "Roboto"` -> Loads Roboto
- `fontFamily: "Open Sans"` -> Loads Open Sans
- `fontFamily: "Press Start 2P"` -> Loads Press Start 2P (Retro gaming font)

### Full Documentation

See [docs/call-to-action-guide.md](docs/call-to-action-guide.md).

## INTEGRATION VỚI REMOTION

### Loading OTIO in Remotion

OtioTimeline composition tự động đọc `ratio` từ `script.json` metadata và render đúng kích thước.

1. Import timeline:
```typescript
import projectTimeline from '../public/projects/my-project/project.otio';
```

2. Composition tự động chọn đúng kích thước dựa trên `script.json` metadata:
```typescript
// Root.tsx đã đăng ký các OtioTimeline variants:
// - OtioTimeline        → Auto-detect từ script.json (default 9:16)
// - OtioTimelineLandscape → 16:9 (1920×1080)
// - OtioTimelineSquare    → 1:1 (1080×1080)
// - OtioTimeline4x5       → 4:5 (1080×1350)
```

3. Render:
```bash
npm run dev  # Preview - tự chọn composition phù hợp
# Render cụ thể:
npx remotion render OtioTimeline          # 9:16 (default)
npx remotion render OtioTimelineLandscape # 16:9
npx remotion render OtioTimelineSquare    # 1:1
npx remotion render OtioTimeline4x5       # 4:5
```

## ERROR HANDLING

### Missing Resources
```
⚠ Scene 'item3' has no video/image resource
→ Fallback: Use previous scene resource or skip
```

### Timing Mismatch
```
⚠ Scene duration mismatch: 58s (expected 60s, diff: 2s)
→ Auto-adjust: Extend last clip duration
```

### Invalid Video Type
```
✗ Error: Unsupported video type 'tutorial'
  Available types: listicle
  Hint: The strategy for 'tutorial' may not be implemented yet
```

## ARCHITECTURE

### Core Components

```
video-editor/
├── cli.py                       # Entry point
├── core/
│   ├── otio_builder.py          # Timeline builder orchestrator
│   └── asset_resolver.py        # Relative path conversion (supports pinned resources)
├── strategies/
│   ├── base_strategy.py         # Abstract strategy class
│   ├── listicle_strategy.py     # Listicle implementation
│   └── image_slide_strategy.py  # Image-slide implementation (NEW)
├── templates/
│   └── subtitle_generator.py    # Subtitle track generation
└── utils/
    ├── json_loader.py           # Input validation
    ├── timing_calculator.py     # Time/frame conversion
    ├── voice_timing_sync.py     # Voice-scene sync (NEW)
    └── effect_suggester.py      # AI effect suggestion (NEW)
```

### Strategy Pattern

Each video type implements `BaseStrategy`:

```python
class ListicleStrategy(BaseStrategy):
    def populate_tracks(self, timeline, script, voice_data, resources):
        # Create 5 tracks specific to listicle format
        pass

class ImageSlideStrategy(BaseStrategy):
    def populate_tracks(self, timeline, script, voice_data, resources):
        # 1. Sync scenes with voice timestamps
        voice_sync = VoiceTimingSync()
        scene_timings = voice_sync.map_scenes_to_voice(scenes, voice_data)

        # 2. Auto-suggest effects and transitions
        effect_suggester = EffectSuggester()
        effects = effect_suggester.suggest_all_effects(scenes)

        # 3. Create image track with voice-synced timing
        # 4. Create subtitle, voice, music tracks
        pass
```

### Effect Suggestion Rules

| Content Keywords | Suggested Effect |
|-----------------|------------------|
| face, portrait, close, detail | `zoom-in` (intensity: 0.7) |
| landscape, scenery, nature, panorama | `ken-burns` (intensity: 0.5) |
| action, move, fast, travel | `slide` (intensity: 0.6) |
| important, highlight, wow | `scale` (intensity: 0.4) |
| (default) | `ken-burns` (intensity: 0.5) |

### Transition Suggestion Rules

| Scene Pattern | Suggested Transition |
|--------------|---------------------|
| hook → item | `cut` (0s) |
| item → item | `crossfade` (0.4s) |
| item → cta | `dissolve` (0.6s) |
| (default) | `crossfade` (0.5s) |

### Asset Resolution Priority

Khi tìm asset cho mỗi scene, `AssetResolver` kiểm tra theo thứ tự:

1. **Pinned resources** (`resources.pinnedResources[]`) — user-provided files/URLs, ưu tiên cao nhất
2. **Videos** (`resources.videos[]`) — stock footage từ Pexels/Pixabay
3. **Images** (`resources.images[]`) — stock images
4. **Generated images** (`generated/{sceneId}_ai.png`) — AI-generated fallback
5. **Placeholder** — component hiển thị "image missing"

Pinned resources hỗ trợ `relativePath`, `localPath`, hoặc `url`. Paths được convert sang relative cho OTIO portability.

## VALIDATION RULES

- ✅ All 3 JSON files exist
- ✅ `script.json` has valid `videoType`
- ✅ `voice.json` has `timestamps` array
- ✅ `resources.json` has at least one resource type (including pinnedResources)
- ✅ Scene durations sum to expected total (±3s tolerance)
- ✅ **Caption track is the last track** in the timeline tracks list.

## BEST PRACTICES

### 1. Consistent Folder Structure
```
public/projects/
├── video-1/
│   ├── script.json
│   ├── voice.mp3
│   ├── voice.json
│   ├── resources.json
│   └── project.otio
└── video-2/
    └── ...
```

### 2. Run Pipeline in Order
```bash
# 1. Generate script
claude "Create script about X"  # → script.json

# 2. Generate voice
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "..." --outputDir public/projects/my-project  # → voice.mp3, voice.json

# 3. Find resources
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir public/projects/my-project  # → resources.json

# 4. Generate timeline (THIS SKILL)
python .claude/skills/video-editor/cli.py public/projects/my-project  # → project.otio

# 5. Render video
npm run render -- MyVideo  # → final.mp4
```

### 3. Test Portability
```bash
# Copy project to different location
cp -r public/projects/test-project /tmp/test-project

# Timeline should still work
cd /tmp/test-project
# Load project.otio in Remotion → should render correctly
```

## TROUBLESHOOTING

### "Required file not found: script.json"
→ Run video-script-generator skill first

### "Unsupported video type: facts"
→ Only `listicle` implemented currently, other types coming soon

### "No valid URL found in resource"
→ Check resources.json has `downloadUrls` or `downloadUrl` field

### Paths not resolving in Remotion
→ Verify all paths are relative, no absolute `/Users/...` paths

### "inputRange must be strictly monotonically increasing"
→ Xảy ra khi dùng `interpolate` với dải giá trị bằng 0 (ví dụ `[0, 0]`). Cần check `duration > 0` trước khi gọi hàm.

### "Duration of <Sequence /> must not be shorter than Transition"
→ Xảy ra khi Clip quá ngắn (ví dụ 0.5s) nhưng Transition trước nó lại dài (ví dụ 1s). Cần rút ngắn Transition lại.

### "Transition must not be followed by another Transition"
→ Lỗi logic timeline khiến 2 transition nằm sát nhau. Cần kiểm tra kỹ index khi chèn hoặc dùng script `fix_sequence.py`.

## DEPENDENCIES

```txt
opentimelineio>=0.15.0
pydantic>=2.0.0
requests>=2.31.0
```

Install:
```bash
cd .claude/skills/video-editor
pip install -r requirements.txt
```

## VERSION HISTORY

- v1.3 (2026-01-30): Sticker Overlays & Animations
  - **NEW** `Sticker` component for emojis, memes, and images
  - **NEW** Overlays track support for multiple sticker layers
  - **NEW** Rich animation library: pop, shake, rotate, elastic, slide
  - **NEW** Positioning system: presets (center, corners), random, custom coordinates
  - **UPDATED** `OtioPlayer` to support Sticker rendering

- v1.2 (2026-01-26): Enhanced Music Support
  - **IMPROVED** `AssetResolver.resolve_music_from_resources()` supports multiple formats:
    - Nested format: `resources.music[].results[].downloadUrl`
    - Flat format: `resources.music[].downloadUrl`
    - Direct URL: `resources.music[].url` or `resources.music[].sourceUrl`
  - Compatible with both `find-resources.js` and `add-music-to-project.js` outputs
  - Music track auto-added when resources.json has music entry

- v1.1 (2026-01-26): Image-Slide Strategy
  - **NEW** `image-slide` video type for AI-generated image videos
  - **NEW** Voice-synced timing (images match voice timestamps)
  - **NEW** AI effect suggestion (zoom, ken-burns, slide)
  - **NEW** AI transition suggestion (crossfade, cut, dissolve)
  - **NEW** `VoiceTimingSync` utility for scene-voice mapping
  - **NEW** `EffectSuggester` utility for rule-based suggestions

- v1.0 (2026-01-24): Initial release
  - Listicle strategy implemented
  - Relative path support
  - Subtitle generation
  - Migration from output/ to public/projects/



---

# TIMELINE INSPECTOR

**Inspect and analyze OTIO timeline structure before editing.**

The Timeline Inspector helps you understand your project's timeline - which tracks exist, what clips are in each track, their indices, and durations. This is **essential** before using the Script Generator to edit.

## Quick Start

### 1. View Timeline Summary

```bash
python generators/cli.py inspect --project public/projects/my-video/project.otio
```

**Output:**
================================================================================
Timeline: {project-name}
================================================================================
Duration: 60.0s
Tracks: 5

Track 0: B-Roll
  Kind: Video
  Items: 11
    [0] hook Video                     Clip         (5.00s)
    [1] item1 Video                    Clip         (10.00s)
    [2]                                Transition   (0.47s)
    ...

Track 4: Subtitles
  Kind: Video
  Items: 34
    [0] Sub: Text...                   Clip         (1.13s)
```

This shows:
- ✅ **Track index** (0, 1, 2, ...) → use in edit commands
- ✅ **Track name** (B-Roll, Subtitles, ...) → reference
- ✅ **Clip index** [0], [1], [2], ... → use for edits
- ✅ **Clip name and duration** → understand content

---

## STICKER OVERLAYS

### Overview

`Sticker` component cho phép thêm các hình ảnh trang trí, memes, emojis, hoặc bất kỳ hình ảnh nào khác lên video dưới dạng overlay. Tính năng này giúp video sinh động, hài hước và giữ sự chú ý của người xem (retention).

### Usage in OTIO

Thêm clip `Sticker` vào track "Title Overlays" hoặc tạo track mới chuyên biệt:

```json
{
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "Sticker",
        "props": {
            "src": "https://example.com/meme.png", 
            "style": "bottom-right",
            "animation": "pop",
            "width": 300,
            "enterDuration": 15,
            "rotation": 10
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 90.0 }, // 3 seconds
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
}
```

### Positioning Styles

| Style | Position | Description |
|-------|----------|-------------|
| `center` | Center | Giữa màn hình |
| `top-left` | Top Left | Góc trên trái (cách lề 50px) |
| `top-right` | Top Right | Góc trên phải (cách lề 50px) |
| `bottom-left` | Bottom Left | Góc dưới trái (cách lề 50px) |
| `bottom-right` | Bottom Right | Góc dưới phải (cách lề 50px) |
| `random` | Random | Vị trí ngẫu nhiên mỗi lần render |
| `custom` | Custom | Sử dụng `top`, `left`, `right`, `bottom` props |

### Animations

| Animation | Effect |
|-----------|--------|
| `pop` | Bật lên từ nhỏ đến lớn (giống bong bóng) - **Mặc định** |
| `elastic` | Giống `pop` nhưng có độ nảy đàn hồi mạnh hơn |
| `shake` | Rung lắc nhẹ (gây chú ý) |
| `rotate` | Xoay vòng khi xuất hiện |
| `slide-up` | Trượt từ dưới lên |
| `slide-down` | Trượt từ trên xuống |
| `fade` | Hiện dần đơn giản |

## LAYER EFFECTS

### Overview

`LayerEffect` component cung cấp các hiệu ứng thị giác (visual accents) hiện đại như HUD, neon shapes, scanlines... giúp video mang phong cách tech, dynamic hơn mà không cần file video nặng nề.

### Usage in OTIO

```json
{
    "metadata": {
        "remotion_component": "LayerEffect",
        "props": {
            "type": "neon-circle",
            "width": 400,
            "height": 400,
            "color": "#00ff00",
            "speed": 1.5
        }
    },
    "source_range": {
        "duration": { "rate": 30.0, "value": 150.0 }
    }
}
```

### Supported Effects

| Type | Description |
|------|-------------|
| **TECH / HUD** || 
| `neon-circle` | Vòng tròn HUD xoay |
| `radar-sweep` | Quét radar xanh |
| `crosshair` | Tâm ngắm sniper |
| `target-scope-a` | Ống ngắm chi tiết |
| `scan-lines` | Hiệu ứng quét dòng |
| `cyber-frame-corners` | Góc khung hình công nghệ |
| `loading-dots` | 3 chấm loading |
| `loading-ring` | Vòng loading đơn giản |
| `digital-noise` | Nhiễu kỹ thuật số |
| **GEOMETRIC** ||
| `rotating-squares` | 2 hình vuông xoay ngược nhau |
| `concentric-circles` | Các vòng tròn đồng tâm xoay |
| `techno-triangle` | Tam giác lồng nhau |
| `dashed-ring` | Vòng tròn nét đứt |
| `burst` | Nổ hình học |
| `zigzag-wave` | Sóng zigzag tần số cao |
| `hex-hive` | Lưới lục giác mờ |
| `floating-shapes` | Các hình khối trôi nổi |
| **COMIC** ||
| `comic-boom` | Chữ BOOM kiểu truyện tranh |
| `speed-lines-radial` | Tia tốc độ từ tâm (Anime) |
| `hand-drawn-circle` | Vòng tròn vẽ tay |
| **MISC** ||
| `particles` | Hạt bụi bay lên |
| `sound-wave` | Sóng âm nhạc |
| `glitch-bars` | Các thanh ngang nhiễu |
| `arrow-chevron-right` | Mũi tên chỉ hướng |
| `custom` | Load Lottie/Image từ URL |

