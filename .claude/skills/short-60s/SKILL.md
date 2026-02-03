# SHORT-60S VIDEO SKILL

## MỤC ĐÍCH

Tạo video short dưới 60 giây HOÀN CHỈNH từ A-Z với:
- **Prompt chi tiết** - Script chất lượng cao với hook mạnh
- **Hiệu ứng chuyển cảnh mượt** - Crossfade, zoom, ken-burns
- **Subtitle khớp video** - Word-level timestamps, highlight từng từ
- **Ảnh/Video khớp nội dung nói** - Voice-synced timing

## WORKFLOW TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHORT-60S WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   STEP 1: SCRIPT           STEP 2: VOICE           STEP 3: VISUALS      │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐      │
│   │ video-script │   →    │    voice-    │   →    │   resource   │      │
│   │  generator   │        │  generation  │        │    finder    │      │
│   └──────────────┘        └──────────────┘        └──────────────┘      │
│         ↓                       ↓                       ↓               │
│   script.json             voice.mp3              resources.json         │
│                           voice.json                                     │
│                                                                          │
│   STEP 4: TIMELINE         STEP 5: RENDER                               │
│   ┌──────────────┐        ┌──────────────┐                              │
│   │ video-editor │   →    │   Remotion   │   →   final_video.mp4       │
│   └──────────────┘        └──────────────┘                              │
│         ↓                                                                │
│   project.otio                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## OUTPUT STRUCTURE

```
public/projects/{project-name}/
├── script.json           # Kịch bản với scenes, timing, visual suggestions
├── voice.mp3             # Audio voiceover
├── voice.json            # Word-level timestamps cho subtitles
├── resources.json        # Videos/images/music đã tìm và download
├── downloads/            # Resources đã tải về
│   ├── videos/
│   ├── images/
│   └── music/
├── generated/            # AI-generated images (nếu có)
├── project.otio          # Timeline cho Remotion
└── out/                  # Video đã render
    └── final.mp4
```

---

# STEP 1: TẠO SCRIPT (video-script-generator)

## Mục đích
Tạo kịch bản video faceless hoàn chỉnh với hook mạnh, pacing tốt, và visual suggestions chi tiết.

## Prompt Template

```
Tạo script video short 60s về: [CHỦ ĐỀ]

Yêu cầu:
- Video type: [facts | listicle | motivation | story]
- Platform: [tiktok | youtube shorts | reels]
- Target audience: [đối tượng]
- Tone: [professional | casual | energetic | dramatic]
- Ngôn ngữ: Tiếng Việt

Đặc biệt chú ý:
1. Hook PHẢI gây tò mò trong 3 giây đầu
2. Mỗi scene có visual suggestion chi tiết (stock query hoặc AI prompt)
3. Tổng duration = 55-60 giây
4. Word count: 130-150 từ (cho facts/listicle) hoặc 100-130 từ (cho motivation/story)
```

## Ví dụ Output (script.json)

```json
{
  "metadata": {
    "projectName": "bi-mat-ngu-ngon",
    "videoType": "facts",
    "duration": 60,
    "ratio": "9:16",
    "width": 1080,
    "height": 1920,
    "platform": "tiktok",
    "createdAt": "2026-01-28T10:00:00Z"
  },
  "script": {
    "fullText": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt? Đây không phải vấn đề thời gian ngủ. Đây là vấn đề chất lượng giấc ngủ...",
    "wordCount": 142,
    "estimatedDuration": 58,
    "readingSpeed": 145
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?",
      "voiceNotes": "Đọc chậm, nhấn mạnh từ 'mệt'",
      "visualSuggestion": {
        "type": "stock",
        "query": "tired person waking up bedroom morning",
        "style": "zoom-in",
        "transition": "cut"
      }
    },
    {
      "id": "problem",
      "startTime": 5,
      "duration": 15,
      "text": "Đây không phải vấn đề thời gian ngủ. Đây là vấn đề chất lượng giấc ngủ. 90% người Việt đang mắc sai lầm này mà không biết.",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "brain sleep cycle diagram, glowing neurons, scientific illustration, dark blue background --ar 9:16",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "insight1",
      "startTime": 20,
      "duration": 15,
      "text": "Giấc ngủ được chia thành chu kỳ 90 phút. Nếu bạn thức dậy giữa chu kỳ, não sẽ bị 'lag' cả ngày.",
      "visualSuggestion": {
        "type": "stock",
        "query": "alarm clock ringing morning light",
        "style": "zoom-out",
        "transition": "crossfade"
      }
    },
    {
      "id": "solution",
      "startTime": 35,
      "duration": 15,
      "text": "Cách fix đơn giản: Ngủ đúng bội số 90 phút. Thay vì 8 tiếng, ngủ 7.5 tiếng hoặc 9 tiếng.",
      "visualSuggestion": {
        "type": "stock",
        "query": "person sleeping peacefully cozy bedroom",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "cta",
      "startTime": 50,
      "duration": 10,
      "text": "Follow để biết thêm mẹo ngủ ngon. Comment nếu bạn cũng đang gặp vấn đề này!",
      "voiceNotes": "Đọc chậm hơn, thân thiện",
      "visualSuggestion": {
        "type": "stock",
        "query": "happy person morning routine",
        "style": "zoom-in",
        "transition": "dissolve"
      }
    }
  ],
  "voice": {
    "provider": "gemini",
    "voiceId": "Charon",
    "speed": 1.0,
    "styleInstruction": "Trầm – ấm – chậm – rất đời"
  },
  "music": {
    "query": "ambient calm peaceful background",
    "mood": "calm",
    "genre": "ambient",
    "volume": 0.12,
    "fadeIn": 2.0,
    "fadeOut": 2.0
  },
  "subtitle": {
    "style": "highlight-word"
  }
}
```

## Command

```bash
# Claude tự động tạo script.json
# Hoặc dùng prompt trực tiếp với Claude
```

---

# STEP 2: TẠO VOICE (voice-generation)

## Mục đích
Tạo audio voiceover với word-level timestamps để subtitle khớp chính xác với video.

## Yêu cầu QUAN TRỌNG
- **Word-level timestamps** - Mỗi từ có start/end time chính xác
- **Provider hỗ trợ timestamps** - Gemini, ElevenLabs, hoặc OpenAI Whisper
- **Emotion phù hợp** - Chọn voice và style phù hợp với nội dung

## Provider Recommendations

| Use Case | Provider | Voice ID | Style |
|----------|----------|----------|-------|
| Facts/Edu | Gemini | Charon | Trầm – ấm – chậm |
| Story | Gemini | Aoede | Expressive, emotional |
| TikTok/Energetic | Gemini | Puck | Sôi động, trẻ trung |
| Professional | OpenAI | onyx | Serious, clear |

## Command

```bash
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --script "public/projects/{project-name}/script.json" \
  --provider "gemini" \
  --voiceId "Charon" \
  --styleInstruction "Trầm – ấm – chậm – rất đời" \
  --outputDir "public/projects/{project-name}"
```

## Output (voice.json)

```json
{
  "text": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?...",
  "provider": "gemini",
  "voiceId": "Charon",
  "duration": 58.5,
  "timestamps": [
    {"word": "Bạn", "start": 0.0, "end": 0.32},
    {"word": "ngủ", "start": 0.32, "end": 0.58},
    {"word": "đủ", "start": 0.58, "end": 0.82},
    {"word": "8", "start": 0.82, "end": 1.05},
    {"word": "tiếng", "start": 1.05, "end": 1.38},
    {"word": "mà", "start": 1.38, "end": 1.55},
    {"word": "sáng", "start": 1.55, "end": 1.82},
    {"word": "dậy", "start": 1.82, "end": 2.10},
    {"word": "vẫn", "start": 2.10, "end": 2.35},
    {"word": "mệt?", "start": 2.35, "end": 2.80}
  ]
}
```

## Nếu đã có voice sẵn (không có timestamps)

```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "public/projects/{project-name}/voice.mp3" \
  --text "Script text đầy đủ..."
```

---

# STEP 3: TÌM VISUALS (video-resource-finder)

## Mục đích
Tìm và tải về stock videos/images phù hợp với từng scene, hoặc generate AI images.

## Chiến lược Visual

### 3.1 Stock Videos (Pexels/Pixabay)
Dùng cho nội dung thực tế: người, cảnh, đồ vật

### 3.2 AI-Generated Images (Gemini)
Dùng cho nội dung trừu tượng: concept, diagram, illustration

### 3.3 Pinned Resources (User-provided)
Dùng khi có asset sẵn

## Command

```bash
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir "public/projects/{project-name}" \
  --resultsPerQuery 3 \
  --quality best \
  --enableAI
```

## Thêm nhạc nền

```bash
node .claude/skills/video-resource-finder/scripts/add-music-to-project.js \
  --projectDir "public/projects/{project-name}" \
  --query "ambient calm peaceful"
```

## Output (resources.json)

```json
{
  "projectName": "bi-mat-ngu-ngon",
  "resources": {
    "videos": [
      {
        "sceneId": "hook",
        "query": "tired person waking up bedroom morning",
        "source": "pexels",
        "results": [
          {
            "id": "pexels-12345",
            "downloadUrls": {"hd": "https://...", "sd": "https://..."},
            "localPath": "downloads/videos/hook_pexels-12345.mp4",
            "duration": 15
          }
        ]
      }
    ],
    "generatedImages": [
      {
        "sceneId": "problem",
        "source": "gemini-ai",
        "results": [
          {
            "localPath": "generated/problem_ai.png",
            "prompt": "brain sleep cycle diagram..."
          }
        ]
      }
    ],
    "music": [
      {
        "query": "ambient calm peaceful",
        "results": [
          {
            "downloadUrl": "https://...",
            "localPath": "audio/background-music.mp3"
          }
        ]
      }
    ]
  }
}
```

---

# STEP 4: BUILD TIMELINE (video-editor)

## Mục đích
Tạo file OTIO timeline với:
- **Hiệu ứng chuyển cảnh mượt** - Crossfade, dissolve, cut
- **Subtitle khớp voice** - Word-by-word highlight
- **Ảnh/video sync với voice timing**

## Track Structure cho Short-60s

```
Track 1: Visual (Video/Image)
├── Scene 1 [effect: zoom-in] [transition: cut]
├── Scene 2 [effect: ken-burns] [transition: crossfade 0.5s]
├── Scene 3 [effect: zoom-out] [transition: crossfade 0.5s]
├── Scene 4 [effect: ken-burns] [transition: crossfade 0.5s]
└── Scene 5 [effect: zoom-in] [transition: dissolve 0.6s]

Track 2: Subtitles (TikTokCaption)
├── Phrase 1 với word highlights
├── Phrase 2 với word highlights
└── ...

Track 3: Voice Audio
└── voice.mp3 (full duration)

Track 4: Background Music
└── background-music.mp3 (fade-in 2s, volume 0.12)
```

## Hiệu ứng chuyển cảnh

| Transition | Duration | Khi nào dùng |
|------------|----------|--------------|
| `cut` | 0s | Hook → Scene đầu, cần tạo impact |
| `crossfade` | 0.4-0.5s | Giữa các scene thông thường |
| `dissolve` | 0.5-0.6s | Scene cuối → CTA, tạo cảm giác kết thúc |

## Hiệu ứng video/ảnh

| Effect | Intensity | Khi nào dùng |
|--------|-----------|--------------|
| `zoom-in` | 0.6-0.8 | Close-up, nhấn mạnh chi tiết |
| `zoom-out` | 0.4-0.6 | Reveal, mở rộng context |
| `ken-burns` | 0.4-0.6 | Ảnh tĩnh, tạo chuyển động mượt |
| `slide` | 0.5-0.7 | Dynamic, energetic content |
| `scale` | 0.3-0.5 | Highlight quan trọng |

## Command

```bash
python3 .claude/skills/video-editor/cli.py \
  "public/projects/{project-name}" \
  --fps 30
```

## Output (project.otio metadata)

```json
{
  "OTIO_SCHEMA": "Timeline.1",
  "name": "bi-mat-ngu-ngon",
  "metadata": {
    "ratio": "9:16",
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "duration": 60
  },
  "tracks": {
    "video": "...",
    "subtitles": "...",
    "voice": "...",
    "music": "..."
  }
}
```

---

# STEP 5: RENDER VIDEO (Remotion)

## Mục đích
Render video cuối cùng từ project.otio với đầy đủ effects và transitions.

## Preview trong Studio

```bash
npm run dev

# Mở browser: http://localhost:3000
# Chọn composition: OtioTimeline
# Nhập project folder: bi-mat-ngu-ngon
```

## Render Video

```bash
# Portrait 9:16 (TikTok, Reels, Shorts)
npx remotion render OtioTimeline out/final.mp4 \
  --props='{"projectFolder":"bi-mat-ngu-ngon"}'

# Landscape 16:9 (YouTube)
npx remotion render OtioTimelineLandscape out/final.mp4 \
  --props='{"projectFolder":"bi-mat-ngu-ngon"}'

# Square 1:1 (Instagram)
npx remotion render OtioTimelineSquare out/final.mp4 \
  --props='{"projectFolder":"bi-mat-ngu-ngon"}'
```

## Render Settings tối ưu

| Setting | Value | Lý do |
|---------|-------|-------|
| FPS | 30 | Tiêu chuẩn cho social media |
| Codec | H.264 | Tương thích tốt nhất |
| CRF | 18 | Chất lượng cao, file size hợp lý |
| Audio Codec | AAC | Tiêu chuẩn |
| Audio Bitrate | 192k | Đủ chất lượng |

---

# WORKFLOW HOÀN CHỈNH (COPY-PASTE)

## Quick Start - 5 bước chạy tuần tự

```bash
# Bước 0: Tạo folder project
PROJECT="bi-mat-ngu-ngon"
mkdir -p "public/projects/$PROJECT"

# Bước 1: Tạo script (Claude tự tạo script.json)
# → Prompt Claude với yêu cầu tạo script

# Bước 2: Tạo voice với timestamps
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --script "public/projects/$PROJECT/script.json" \
  --provider "gemini" \
  --voiceId "Charon" \
  --styleInstruction "Trầm – ấm – chậm – rất đời" \
  --outputDir "public/projects/$PROJECT"

# Bước 3: Tìm và tải resources
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir "public/projects/$PROJECT" \
  --quality best \
  --enableAI

# Bước 3b: Thêm nhạc nền (optional, nếu chưa có)
node .claude/skills/video-resource-finder/scripts/add-music-to-project.js \
  --projectDir "public/projects/$PROJECT"

# Bước 4: Build timeline OTIO
python3 .claude/skills/video-editor/cli.py "public/projects/$PROJECT"

# Bước 5: Render video
npx remotion render OtioTimeline "public/projects/$PROJECT/out/final.mp4" \
  --props="{\"projectFolder\":\"$PROJECT\"}"
```

---

# SUBTITLE SYNC CHI TIẾT

## Cách Subtitle khớp với Video

### 1. Word-level Timestamps
Voice generation tạo timestamps cho TỪNG TỪ:

```json
{
  "timestamps": [
    {"word": "Bạn", "start": 0.0, "end": 0.32},
    {"word": "ngủ", "start": 0.32, "end": 0.58},
    {"word": "đủ", "start": 0.58, "end": 0.82}
  ]
}
```

### 2. Phrase Grouping
Video-editor nhóm words thành phrases (3-5 từ):

```
Phrase 1: "Bạn ngủ đủ" (0.0 - 0.82s)
Phrase 2: "8 tiếng mà" (0.82 - 1.55s)
Phrase 3: "sáng dậy vẫn mệt?" (1.55 - 2.80s)
```

### 3. Highlight Animation
TikTokCaption component highlight từng từ khi được đọc:

```
Frame 0-9:    "**Bạn** ngủ đủ"     (Bạn highlighted)
Frame 10-17: "Bạn **ngủ** đủ"     (ngủ highlighted)
Frame 18-24: "Bạn ngủ **đủ**"     (đủ highlighted)
```

### 4. Style Options

| Style | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| `highlight-word` | Highlight từng từ | TikTok, Reels (phổ biến nhất) |
| `karaoke` | Fill từ từ trái qua | Music videos |
| `minimal` | Không highlight | Professional content |

---

# VISUAL SYNC CHI TIẾT

## Cách Ảnh/Video khớp với nội dung nói

### 1. Scene-based Timing (từ script.json)
Mỗi scene có startTime và duration:

```json
{
  "id": "hook",
  "startTime": 0,
  "duration": 5,
  "text": "Bạn ngủ đủ 8 tiếng..."
}
```

### 2. Voice-synced Timing (cho image-slide)
Với video type `image-slide`, ảnh sync chính xác với voice:

```python
# VoiceTimingSync tính toán
scene_timing = {
  "hook": {"start": 0.0, "end": 4.8},      # Từ "Bạn" đến "mệt?"
  "problem": {"start": 4.8, "end": 18.2},  # Từ "Đây" đến "biết"
}
```

### 3. Transition Timing
Transitions KHÔNG ảnh hưởng đến audio sync:

```
Scene 1: 0s - 4.8s (visual)
Transition: 4.3s - 4.8s (crossfade overlap)
Scene 2: 4.8s - 18.2s (visual)
```

---

# HIỆU ỨNG CHUYỂN CẢNH CHI TIẾT

## Transition Types

### 1. Cut (Cắt trực tiếp)
- Duration: 0s
- Dùng cho: Hook → Scene 1, tạo impact mạnh

```json
{
  "transition": "cut"
}
```

### 2. Crossfade (Fade chéo)
- Duration: 0.4-0.5s
- Dùng cho: Giữa các scenes, chuyển cảnh mượt

```json
{
  "transition": "crossfade",
  "transitionDuration": 0.5
}
```

### 3. Dissolve (Tan dần)
- Duration: 0.5-0.6s
- Dùng cho: Scene cuối → CTA, ending

```json
{
  "transition": "dissolve",
  "transitionDuration": 0.6
}
```

## Effect Types

### 1. Zoom-in
- Bắt đầu wide, zoom vào center
- Intensity 0.7 = zoom 30% (từ 1.0 → 1.3x)

```json
{
  "style": "zoom-in",
  "effectIntensity": 0.7
}
```

### 2. Ken-burns
- Pan + zoom nhẹ, tạo chuyển động cho ảnh tĩnh
- Classic cinematic effect

```json
{
  "style": "ken-burns",
  "effectIntensity": 0.5
}
```

### 3. Zoom-out
- Bắt đầu close-up, zoom ra wide
- Reveal, mở rộng không gian

```json
{
  "style": "zoom-out",
  "effectIntensity": 0.6
}
```

---

# VIDEO TYPES HỖ TRỢ

## 1. Facts (60s)
```
Hook (5s) → Problem (15s) → Insight (15s) → Solution (15s) → CTA (10s)
```

**Đặc điểm:**
- Word count: 130-150 từ
- Tone: Professional, educational
- Music: Ambient, calm (volume 0.10-0.12)

## 2. Listicle (60s)
```
Hook (5s) → Item 1 (10s) → Item 2 (10s) → Item 3 (10s) → Item 4 (10s) → Item 5 (10s) → CTA (5s)
```

**Đặc điểm:**
- Word count: 140-160 từ
- Tone: Energetic, punchy
- Music: Upbeat, corporate (volume 0.12-0.15)
- Có Item Number overlay

## 3. Motivation (60s)
```
Quote (10s) → Story context (20s) → Lesson (20s) → CTA (10s)
```

**Đặc điểm:**
- Word count: 100-130 từ (chậm hơn)
- Tone: Emotional, inspiring
- Music: Cinematic, uplifting (volume 0.15-0.20)

## 4. Story (60s)
```
Spoiler hook (5s) → Setup (15s) → Build tension (20s) → Climax (15s) → CTA (5s)
```

**Đặc điểm:**
- Word count: 130-160 từ
- Tone: Dramatic, narrative
- Music: Cinematic, mysterious (volume 0.12-0.18)

## 5. Image-slide (20-60s)
```
AI-generated images với voice-synced timing
```

**Đặc điểm:**
- Dùng ảnh AI thay vì stock video
- Duration tự động sync với voice
- Effects tự động suggest

---

# BEST PRACTICES

## 1. Hook (3 giây đầu)
- **BẮT BUỘC** gây tò mò hoặc shock
- Dùng số liệu, câu hỏi, hoặc statement mạnh
- Visual: Zoom-in, high energy

**Good hooks:**
- "Bạn ngủ đủ 8 tiếng mà vẫn mệt?"
- "90% người Việt đang mắc sai lầm này"
- "Đừng bao giờ làm điều này khi thức dậy"

## 2. Pacing
- Hook: NHANH (130-150 WPM)
- Body: ỔN ĐỊNH (120-140 WPM)
- CTA: CHẬM (100-120 WPM)

## 3. Visual Variety
- Đổi scene mỗi 8-12 giây
- Mix stock video + AI images
- Sử dụng transition đa dạng

## 4. Subtitle Position
- Portrait (9:16): Center, bottom 1/3
- Landscape (16:9): Bottom, có background

## 5. Audio Volume Settings

### Mức volume tiêu chuẩn:
| Audio Type | Volume | Mô tả |
|------------|--------|-------|
| **Voice (Giọng đọc)** | 1.0 (100%) | Luôn ưu tiên cao nhất |
| **Music (Nhạc nền)** | 0.2 (20%) | Không át voice |
| **Video Audio (Âm thanh video)** | 0.2 (20%) | Giảm xuống để không lấn át voice |

### Cấu hình trong script.json:
```json
{
  "music": {
    "volume": 0.2,     // 20% - nhạc nền
    "fadeIn": 1.0,     // fade-in 1 giây
    "fadeOut": 2.0     // fade-out 2 giây
  }
}
```

### Lưu ý:
- Voice LUÔN là 100% để đảm bảo nghe rõ
- Music và Video audio mặc định 20% để không át tiếng giọng đọc
- LUÔN có fadeIn và fadeOut cho nhạc nền

---

# TROUBLESHOOTING

## "Subtitle không khớp với voice"
**Nguyên nhân:** voice.json thiếu word-level timestamps
**Giải pháp:**
```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "public/projects/{project}/voice.mp3"
```

## "Ảnh/video không hiển thị"
**Nguyên nhân:** Path không đúng trong resources.json
**Giải pháp:** Kiểm tra localPath, đảm bảo file tồn tại

## "Transition bị giật"
**Nguyên nhân:** Video source FPS khác nhau
**Giải pháp:** Render với `--fps 30` consistent

## "Voice bị cắt ở cuối"
**Nguyên nhân:** Timeline duration < voice duration
**Giải pháp:** Kiểm tra script.json duration, điều chỉnh scene timing

---

# VERSION HISTORY

- v1.0 (2026-01-28): Initial release
  - Complete 5-step workflow
  - Support 5 video types
  - Detailed transition/effect guidelines
  - Subtitle sync documentation
