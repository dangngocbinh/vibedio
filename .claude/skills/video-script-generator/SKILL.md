# VIDEO SCRIPT GENERATOR SKILL

## MỤC ĐÍCH
Tạo kịch bản video faceless hoàn chỉnh dưới dạng JSON, sẵn sàng cho bước tiếp theo (video generation).

## WORKFLOW

```
User Request → Analyze → Research (nếu cần) → Generate Script → Quality Check → Output JSON
```

## AVAILABLE UTILITIES

### 1. Video Processor (FFmpeg utilities)

**Location**: `utils/video_processor.py`

**CLI Usage**:
```bash
# Check FFmpeg/FFprobe installed
python utils/video_processor.py check

# Get video metadata
python utils/video_processor.py metadata /path/to/video.mp4

# Extract audio to MP3
python utils/video_processor.py extract /path/to/video.mp4 output.mp3
```

**Python API**:
```python
from utils.video_processor import VideoProcessor

# Check dependencies
deps = VideoProcessor.check_dependencies()
if not deps['all_installed']:
    print(VideoProcessor.get_installation_instruction())

# Get metadata
metadata = VideoProcessor.get_video_metadata('/path/to/video.mp4')
# Returns: {duration, resolution, fps, hasAudio, videoCodec, audioCodec, fileSize}

# Extract audio
VideoProcessor.extract_audio(
    video_path='/path/to/video.mp4',
    output_audio_path='audio/output.mp3',
    quality=2  # 0-9, lower is better
)
```

---

### 2. Multi-Video Generator

**Location**: `utils/multi_video_generator.py`

**Python API**:
```python
from utils.multi_video_generator import (
    generate_multi_video_script,
    update_script_transcript
)

# Step 1: Generate initial script (process videos)
result = generate_multi_video_script(
    video_paths=['/path/to/video1.mp4', '/path/to/video2.mp4'],
    project_name='my-project',
    ratio='9:16'
)
# Returns: {scriptPath, projectDir, totalDuration, audioFiles, nextSteps}

# Step 2: Update transcript (after user transcribes)
script = update_script_transcript(
    project_dir='public/projects/my-project',
    transcript_data={
        "fullText": "...",
        "timestamps": [{"word": "Xin", "start": 0.1, "end": 0.3}],
        "provider": "elevenlabs"
    }
)
# Returns: Updated script dict

# Step 3: Find segment by description (optional)
generator = MultiVideoEditGenerator(project_dir='public/projects/my-project')
segment = generator.find_segment_by_natural_language(
    query='đoạn nói về giấc ngủ',
    transcript_data=script['transcript']
)
# Returns: {start: 10.5, end: 25.0, text: '...'}
```

**Agent Workflow**:
1. Call `generate_multi_video_script()` when user provides video files
2. Wait for user to transcribe audio
3. Call `update_script_transcript()` to add transcript
4. **AI agent analyzes transcript** and updates `scenes` field manually
5. Generate timeline via video-editor skill

---

### 3. Script Generator (Core logic)

**Location**: `utils/script_generator.py`

**Purpose**: Core templates và logic để generate script structures

**Python API**:
```python
from utils.script_generator import ScriptGenerator

gen = ScriptGenerator()

# Calculate word target for duration
min_words, max_words = gen.calculate_word_target(
    duration=60,
    video_type='listicle'
)
# Returns: (140, 160) for 60s listicle

# Generate scene structure with timing
scenes = gen.generate_structure(
    video_type='facts',
    duration=60
)
# Returns: [
#   {id: 'hook', type: 'hook', duration: 5, ...},
#   {id: 'problem', type: 'main', duration: 15, ...},
#   ...
# ]

# Suggest visuals for scene
visual_suggestion = gen.suggest_visuals(
    section='hook',
    content='Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?'
)
# Returns: {type: 'stock', query: 'tired person morning', style: 'zoom-in'}

# Generate hook options
hooks = gen.generate_hook_options(
    video_type='listicle',
    topic='học tiếng Anh',
    count=3
)
# Returns: ['5 sai lầm khi học tiếng Anh', '...', ...]

# Validate script structure
validation = gen.validate_script(scenes, target_duration=60)
# Returns: {valid: True/False, issues: [...], warnings: [...]}
```

**Templates Available**:
- `facts`: Hook → Problem → Insight → Solution → CTA
- `listicle`: Hook → Item1-5 → CTA
- `motivation`: Quote → Story → Lesson → CTA
- `story`: Spoiler → Setup → Tension → Climax → CTA

---

### 4. JSON Builder

**Location**: `utils/json_builder.py`

**Purpose**: Build final `script.json` theo schema chuẩn

**Python API**:
```python
from utils.json_builder import JSONBuilder

builder = JSONBuilder()

# Build complete project JSON
project = builder.build_project_json(
    topic='5 cách học tiếng Anh hiệu quả',
    video_type='listicle',
    duration=60,
    scenes=[...],  # List of scene dicts
    script_text='Full script text...',
    metadata={
        'ratio': '9:16',
        'platform': 'shorts',
        'targetAudience': 'Người đi làm'
    },
    quality_metrics={...}  # Optional, from QualityChecker
)

# Validate schema
validation = builder.validate_schema(project)
# Returns: {valid: True/False, errors: [...]}

# Save to file
builder.save_to_file(project, 'public/projects/my-video/script.json')

# Or get JSON string
json_str = builder.to_json_string(project, indent=2)
```

**Functions**:
- `build_project_json()` - Tạo full JSON structure
- `validate_schema()` - Check schema requirements
- `save_to_file()` - Write to file
- `to_json_string()` - Convert to formatted string

---

### 5. Quality Checker

**Location**: `utils/quality_checker.py`

**Purpose**: Đánh giá chất lượng script (hook strength, pacing, engagement)

**Python API**:
```python
from utils.quality_checker import QualityChecker

checker = QualityChecker()

# Check hook strength (0-10)
hook_result = checker.calculate_hook_strength(
    'Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?'
)
# Returns: {
#   score: 8.0,
#   rating: 'excellent',
#   reasons: ['Has question', 'Good length', ...],
#   suggestions: [...]
# }

# Check pacing score (0-10)
pacing_result = checker.calculate_pacing_score(
    scenes=[...],
    target_duration=60
)
# Returns: {score: 9.0, issues: [], suggestions: []}

# Check word count vs duration
word_check = checker.check_word_count(
    text='Full script text...',
    duration=60,
    video_type='listicle'
)
# Returns: {valid: True, message: 'Word count OK', suggestions: []}

# Full quality check
quality_report = checker.full_quality_check({
    'scenes': [...],
    'metadata': {duration: 60, videoType: 'listicle'},
    'transcript': {fullText: '...'}
})
# Returns: {
#   hookStrength: 8.5,
#   pacingScore: 9.0,
#   wordCountValid: True,
#   engagementPotential: 'high',
#   overallRating: 'A',
#   suggestions: [...]
# }
```

**Metrics**:
- **Hook Strength**: Số liệu, power words, câu hỏi, độ dài
- **Pacing Score**: Timing từng scene, total duration
- **Word Count**: Check với speaking rate (2.3-2.6 words/s)
- **Engagement**: Hook + Pacing + Elements (call-outs, stats, questions)

---

### 6. Script Generator (for topic-based videos)

**Location**: `demo.py`

**CLI Usage**:
```bash
# Generate script for topic-based videos
python demo.py \
  --topic "5 cách học tiếng Anh hiệu quả" \
  --type listicle \
  --duration 60 \
  --ratio 9:16 \
  --output public/projects/my-video/script.json
```

**Python API**:
```python
# For AI agent: directly create script dict and write to file
import json
from pathlib import Path

script = {
    "metadata": {...},
    "scenes": [...],
    "transcript": {...},
    # ... full script structure
}

output_path = Path('public/projects/my-video/script.json')
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
```


## INPUT PARAMETERS

User có thể cung cấp:
- **Topic**: Chủ đề video (bắt buộc) - hoặc **Video Paths** cho multi-video-edit
- **Video Type**: facts | listicle | motivation | story | image-slide | **multi-video-edit** (mặc định: facts)
- **Duration**: 30 | 60 | 90 giây (mặc định: 60) - auto-calculated cho multi-video-edit
- **Aspect Ratio**: 9:16 | 16:9 | 1:1 | 4:5 (mặc định: 9:16)
- **Target Audience**: Đối tượng xem (optional)
- **Tone**: professional | casual | energetic | dramatic (mặc định: professional)
- **Platform**: youtube | tiktok | reels | shorts (mặc định: shorts)

### ASPECT RATIO - PLATFORM MAPPING

Nếu user không chỉ định aspect ratio, tự động suy từ platform:

| Platform | Default Ratio | Width | Height | Ghi chú |
|----------|--------------|-------|--------|---------|
| tiktok   | 9:16         | 1080  | 1920   | Portrait - TikTok/Reels |
| reels    | 9:16         | 1080  | 1920   | Portrait - Instagram Reels |
| shorts   | 9:16         | 1080  | 1920   | Portrait - YouTube Shorts |
| youtube  | 16:9         | 1920  | 1080   | Landscape - YouTube |
| instagram| 4:5          | 1080  | 1350   | Portrait 4:5 - Instagram Feed |
| facebook | 4:5          | 1080  | 1350   | Portrait 4:5 - Facebook Feed |

User cũng có thể override trực tiếp: `"ratio": "1:1"` cho Square format.

**Supported ratios**: `9:16`, `16:9`, `1:1`, `4:5`

## OUTPUT STRUCTURE

Skill trả về JSON với cấu trúc sau:

```json
{
  "metadata": {
    "projectName": "string",
    "videoType": "facts|listicle|motivation|story",
    "duration": 60,
    "ratio": "9:16",
    "width": 1080,
    "height": 1920,
    "targetAudience": "string",
    "platform": "shorts",
    "createdAt": "ISO date"
  },
  "script": {
    "fullText": "Script đầy đủ...",
    "wordCount": 140,
    "estimatedDuration": 58,
    "readingSpeed": 145
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Hook text...",
      "voiceNotes": "Đọc chậm, nhấn mạnh",
      "visualSuggestion": {
        "type": "stock|ai-generated|pinned",
        "query": "tired waking up",
        "style": "zoom-in",
        "path": "(pinned only) local file path e.g. ~/Downloads/demo.mp4",
        "url": "(pinned only) remote URL e.g. https://example.com/video.mp4",
        "description": "(pinned only) mô tả nội dung asset"
      }
    }
  ],
  "voice": {
    "provider": "elevenlabs|openai|gemini|vbee",
    "voiceId": "suggested-voice-id",
    "speed": 1.0,
    "styleInstruction": "Trầm – ấm – chậm – rất đời",
    "notes": "Male voice, professional tone. styleInstruction chỉ hoạt động với Gemini provider để tùy chỉnh cảm xúc và phong cách giọng đọc."
  },
  "music": {
    "query": "ambient calm peaceful",
    "mood": "calm|energetic|dramatic|uplifting|dark|happy|sad|mysterious",
    "genre": "ambient|cinematic|electronic|acoustic|corporate|epic",
    "volume": 0.15,
    "fadeIn": 1.0,
    "fadeOut": 2.0,
    "notes": "Nhạc nền nên có volume thấp (0.1-0.2) để không át giọng voice-over. Query nên kết hợp mood + genre để tìm chính xác hơn trên Pixabay."
  },
  "subtitle": {
    "style": "highlight-word|karaoke|minimal",
    "position": "center|bottom",
    "font": "Montserrat",
    "highlightColor": "#FFD700"
  },
  "qualityMetrics": {
    "hookStrength": 8.5,
    "pacingScore": 9.0,
    "engagementPotential": "high",
    "suggestions": ["Consider adding số liệu vào hook", "CTA có thể mạnh hơn"]
  }
}
```

## TEMPLATES

### 1. FACTS (60s)
**Cấu trúc**: Hook (5s) → Problem (15s) → Insight (15s) → Solution (15s) → CTA (10s)

**Hook formulas**:
- "Bạn [action] mà vẫn [unexpected result]?"
- "[X%] người [mistake] mà không biết [truth]"
- "Tại sao [surprising fact]?"

**Word count**: 130-150 từ

### 2. LISTICLE (60s)
**Cấu trúc**: Hook (5s) → Item 1 (10s) → Item 2 (10s) → Item 3 (10s) → Item 4 (10s) → Item 5 (10s) → CTA (5s)

**Hook formulas**:
- "X điều [target audience] cần biết về [topic]"
- "Top X [things] mà [expert/successful people] làm"
- "X sai lầm khi [common activity]"

**Word count**: 140-160 từ

### 5. MULTI-VIDEO-EDIT (auto-duration) ✨ **NEW**

**🎯 Mục đích**: Edit nhiều MP4 files thành 1 video hoàn chỉnh với AI analysis

**Workflow**:
```
1. User provides video paths
2. **CONFIRMATION 1**: Agent identifies video order & duration -> User confirms
3. Extract metadata + audio (FFmpeg)
4. User transcribes audio
5. AI analyzes content structure
   - Identify logical sections
   - Propose title card placements
6. **CONFIRMATION 2**: Agent lists proposed Title Cards/Segments -> User confirms
   - User can override: "Tìm đoạn nói về [topic] để tạo title"
7. Generate timeline with sync-safe clips
```

**Interactive Features**:
- **Video Ordering**: Agent phải liệt kê thứ tự video (Video 1, Video 2...) để user confirm trước khi process.
- **Segment Search**: User có thể yêu cầu: *"Cắt clip tại đoạn nói về 'giấc ngủ' và hiện title 'Giấc ngủ quan trọng'"* -> Agent dùng `find_segment_by_natural_language` để tìm timestamp chính xác.

**Đặc điểm**:
- ✅ **Separate video/audio clips** - Không combine
- ✅ **sourceVideoId references** - Auto-sync khi clip move
- ✅ **AI content analysis** - Detect hook, intro, sections, outro
- ✅ **Smart B-roll mode** - Replace/overlay/skip dựa trên context
- ✅ **Title cards** - Full-screen transitions

**Input**:
```python
{
  "video_paths": ["/path/to/video1.mp4", "/path/to/video2.mp4"],
  "ratio": "9:16",
  "platform": "shorts"
}
```

**AI sẽ tự động**:
- Phân tích transcript → sections
- Generate title cards cho transitions
- Suggest B-roll placements
- Map timestamps với sourceVideoId

**Use cases**:
- User có sẵn video quay (talking head, demo, vlog)
- Muốn thêm captions, title cards, B-roll
- Cần edit nhanh nhiều clips thành 1 video



### 3. MOTIVATION (60s)
**Cấu trúc**: Quote (10s) → Story context (20s) → Lesson (20s) → Call to action (10s)

**Hook formulas**:
- "[Powerful quote]"
- "Người [successful person] từng nói..."
- "[Unexpected wisdom]"

**Word count**: 100-130 từ (chậm hơn)

### 4. STORY (60s)
**Cấu trúc**: Spoiler hook (5s) → Setup (15s) → Build tension (20s) → Climax (15s) → CTA (5s)

**Hook formulas**:
- "Người đàn ông này [extreme outcome]. Chuyện gì đã xảy ra?"
- "[Person] làm [surprising thing] và kết quả..."
- "Không ai ngờ rằng [unexpected twist]..."

**Word count**: 130-160 từ

## VISUAL SUGGESTION GUIDELINES

Mỗi scene cần có visual suggestion với:

### Stock footage keywords (tiếng Anh)
- **Hook (attention-grabbing)**: "shocked expression", "dramatic reveal", "surprising moment"
- **Problem**: "frustrated person", "common mistake", "confusion"
- **Solution**: "success moment", "aha moment", "positive outcome"
- **CTA**: "follow gesture", "subscribe button", "call to action"

### AI-generated prompts
Sử dụng `--ar` khớp với `metadata.ratio` của video:
- **Abstract concepts**: "brain neural network visualization, blue purple gradient, minimal style, dark background --ar {ratio}"
- **Scientific**: "sleep cycle diagram, scientific illustration, clean design --ar {ratio}"
- **Emotional**: "person feeling [emotion], cinematic lighting, photorealistic --ar {ratio}"

**Ví dụ**: Nếu `ratio: "16:9"`, prompt sẽ là: `"... --ar 16:9"`. Nếu `ratio: "1:1"`, prompt sẽ là: `"... --ar 1:1"`.

### Pinned resources (user-provided)
Khi user cung cấp file cụ thể cho scene, dùng `type: "pinned"`:

```json
{
  "visualSuggestion": {
    "type": "pinned",
    "path": "~/Downloads/product-demo.mp4",
    "description": "Video demo sản phẩm quay bằng iPhone",
    "style": "zoom-in"
  }
}
```

Hỗ trợ 3 dạng path:
- **Absolute**: `/Users/binhpc/Downloads/demo.mp4`
- **Home-relative**: `~/Downloads/demo.mp4`
- **Project-relative**: `imports/videos/import_hook_demo.mp4`
- **Remote URL**: dùng `url` thay `path`: `"url": "https://example.com/video.mp4"`

Optional `query` field: fallback search query nếu pinned file không tìm thấy.

### Animation styles
- `zoom-in`: Tạo focus, nhấn mạnh
- `zoom-out`: Reveal, mở rộng context
- `ken-burns`: Cho ảnh tĩnh, smooth pan
- `fade`: Chuyển cảnh mượt
- `slide`: Dynamic, energetic

## MUSIC SELECTION GUIDELINES

### Pixabay Search Strategy

Khi tạo music config, cần kết hợp **query**, **mood**, và **genre** để tìm nhạc phù hợp:

**Query Format**: `[genre] [mood] [style/instrument]`

Ví dụ:
- `"ambient calm peaceful"` → Nhạc nền êm dịu
- `"cinematic epic dramatic"` → Nhạc hùng tráng
- `"electronic upbeat energetic"` → Nhạc sôi động

### Music by Video Type

#### 1. FACTS Video
**Mục đích**: Giữ attention, không át voice, hỗ trợ thông tin

```json
{
  "query": "ambient corporate minimal",
  "mood": "calm",
  "genre": "ambient",
  "volume": 0.12
}
```

**Pixabay keywords tốt**:
- `"corporate background"` - Nhạc văn phòng, chuyên nghiệp
- `"ambient minimal"` - Tối giản, không gây xao nhãng
- `"soft piano calm"` - Piano nhẹ nhàng
- `"technology background"` - Phù hợp nội dung tech/science

**Tránh**: Nhạc có beat mạnh, vocal, melody quá nổi bật

#### 2. LISTICLE Video
**Mục đích**: Tạo năng lượng, giữ pace, upbeat

```json
{
  "query": "upbeat corporate energetic",
  "mood": "energetic",
  "genre": "corporate",
  "volume": 0.15
}
```

**Pixabay keywords tốt**:
- `"upbeat corporate"` - Sôi động nhưng không quá ồn
- `"motivational background"` - Tạo động lực
- `"positive energy"` - Năng lượng tích cực
- `"bright happy"` - Vui tươi, lạc quan

**Tránh**: Nhạc quá chậm, buồn, hoặc quá dramatic

#### 3. MOTIVATION Video
**Mục đích**: Tạo cảm xúc, build up, inspiring

```json
{
  "query": "cinematic inspiring emotional",
  "mood": "uplifting",
  "genre": "cinematic",
  "volume": 0.18
}
```

**Pixabay keywords tốt**:
- `"cinematic inspiring"` - Hùng tráng, truyền cảm hứng
- `"epic motivational"` - Epic nhưng không quá loud
- `"emotional piano"` - Piano cảm xúc
- `"uplifting orchestral"` - Dàn nhạc nâng cao tinh thần

**Lưu ý**: Volume có thể cao hơn (0.18-0.22) vì cần tạo impact

#### 4. STORY Video
**Mục đích**: Theo dõi cảm xúc câu chuyện, build tension

```json
{
  "query": "cinematic mysterious dramatic",
  "mood": "mysterious",
  "genre": "cinematic",
  "volume": 0.15
}
```

**Pixabay keywords tốt**:
- `"cinematic suspense"` - Hồi hộp, căng thẳng
- `"mysterious dark"` - Bí ẩn, tối tăm
- `"dramatic tension"` - Kịch tính
- `"storytelling background"` - Phù hợp kể chuyện

**Advanced**: Có thể dùng 2 tracks khác nhau cho setup vs climax

### Volume Guidelines

**Quan trọng**: Nhạc nền KHÔNG được át voice-over!

| Video Type | Recommended Volume | Notes |
|------------|-------------------|-------|
| Facts | 0.10 - 0.12 | Rất nhỏ, chỉ làm nền |
| Listicle | 0.12 - 0.15 | Vừa phải, tạo energy |
| Motivation | 0.15 - 0.20 | Cao hơn, cần impact |
| Story | 0.12 - 0.18 | Tùy scene, có thể fade |

**Fade Settings**:
- `fadeIn`: 1.0-2.0s - Tránh nhạc bật đột ngột
- `fadeOut`: 2.0-3.0s - Kết thúc mượt mà

### Mood-Genre Matrix

Bảng kết hợp mood + genre phù hợp:

| Mood | Best Genres | Pixabay Query Example |
|------|-------------|----------------------|
| calm | ambient, acoustic | `"ambient calm peaceful"` |
| energetic | electronic, corporate | `"electronic upbeat energetic"` |
| dramatic | cinematic, epic | `"cinematic dramatic tension"` |
| uplifting | cinematic, corporate | `"cinematic inspiring uplifting"` |
| dark | cinematic, ambient | `"dark ambient mysterious"` |
| happy | acoustic, electronic | `"happy bright positive"` |
| sad | piano, ambient | `"sad emotional piano"` |
| mysterious | cinematic, ambient | `"mysterious suspense dark"` |

### Common Mistakes

❌ **Tránh những lỗi này**:
1. **Volume quá cao** → Át voice, khó nghe
2. **Nhạc có vocal** → Conflict với voice-over
3. **Genre không match tone** → Epic music cho facts video
4. **Query quá chung** → `"music"` thay vì `"ambient calm corporate"`
5. **Không fade** → Nhạc bật/tắt đột ngột

✅ **Best Practices**:
1. **Test volume**: Voice phải rõ hơn music ít nhất 2x
2. **Match energy**: Nhạc phải theo pace của script
3. **Specific query**: Càng cụ thể càng tốt
4. **Consider platform**: TikTok thích upbeat hơn YouTube
5. **Fade transitions**: Luôn dùng fadeIn/fadeOut


## QUALITY CHECKERS

### 1. Hook Strength (0-10)
```python
def calculate_hook_strength(hook_text):
    score = 0
    # Có số liệu/thống kê? +2
    if any(char.isdigit() for char in hook_text):
        score += 2
    # Có từ khóa mạnh? +2
    power_words = ['bí mật', 'đừng', 'tại sao', 'không ai', 'shocking']
    if any(word in hook_text.lower() for word in power_words):
        score += 2
    # Có câu hỏi? +2
    if '?' in hook_text:
        score += 2
    # Độ dài phù hợp (20-60 chars)? +2
    if 20 <= len(hook_text) <= 60:
        score += 2
    # Có negative/warning? +2
    negative_words = ['đừng', 'sai lầm', 'cảnh báo', 'nguy hiểm']
    if any(word in hook_text.lower() for word in negative_words):
        score += 2
    return min(score, 10)
```

### 2. Pacing Score (0-10)
```python
def calculate_pacing_score(scenes, target_duration):
    # Check nếu mỗi scene có độ dài hợp lý
    ideal_scene_length = {
        'hook': (3, 7),
        'body': (8, 20),
        'cta': (5, 10)
    }
    score = 10
    for scene in scenes:
        min_dur, max_dur = ideal_scene_length.get(scene['type'], (5, 15))
        if not (min_dur <= scene['duration'] <= max_dur):
            score -= 1
    # Check tổng duration
    total = sum(s['duration'] for s in scenes)
    if abs(total - target_duration) > 3:
        score -= 2
    return max(score, 0)
```

### 3. Word Count Check
```python
def check_word_count(text, duration, video_type):
    words = len(text.split())
    # Facts/Listicle: 130-150 wpm
    # Motivation: 100-130 wpm (chậm hơn)
    if video_type in ['facts', 'listicle']:
        ideal_min = duration * 130 / 60
        ideal_max = duration * 150 / 60
    else:  # motivation, story
        ideal_min = duration * 100 / 60
        ideal_max = duration * 130 / 60
    
    if ideal_min <= words <= ideal_max:
        return True, "Word count phù hợp"
    elif words < ideal_min:
        return False, f"Quá ngắn. Cần thêm {int(ideal_min - words)} từ"
    else:
        return False, f"Quá dài. Cần cắt {int(words - ideal_max)} từ"
```

## USAGE EXAMPLES

### Example 1: Simple Facts Video

**User Input:**
```
Topic: "Tại sao bạn luôn thấy mệt dù ngủ đủ 8 tiếng?"
Video Type: facts
Duration: 60s
```

**Claude Response Process:**
1. Phân tích: Facts video, educational, cần research
2. Research (nếu cần): Search về sleep cycles
3. Generate hook: "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?"
4. Build body: 3 points về sleep cycles
5. Write CTA: "Follow để biết thêm mẹo ngủ ngon"
6. **Select music**: `query: "ambient calm peaceful"`, `mood: "calm"`, `genre: "ambient"`, `volume: 0.12`
7. Quality check: Hook strength 8/10, pacing 9/10
8. Output JSON

### Example 2: Listicle Video

**User Input:**
```
Topic: "5 thói quen buổi sáng của người thành công"
Video Type: listicle
Duration: 60s
Target Audience: "Dân văn phòng 25-35 tuổi"
```

**Claude Response Process:**
1. Confirm 5 items × 10s each = 50s + hook 5s + CTA 5s = 60s
2. Generate hook: "Người thành công không có nhiều thời gian hơn bạn"
3. List 5 items với timing đều
4. Visual suggestions cho từng item
5. Output JSON

## CONVERSATION FLOW

### Flow 1: Đầy đủ thông tin
```
User: "Tạo script 60s về tại sao ngủ 8 tiếng vẫn mệt, dạng facts"

Claude:
1. Generate full JSON script
2. Create folder: projects/tai-sao-ngu-8-tieng-van-met/
3. Save to projects/tai-sao-ngu-8-tieng-van-met/script.json
4. Confirm folder và file path
```

### Flow 2: Thiếu thông tin
```
User: "Tạo script về thói quen buổi sáng"

Claude: "Tôi sẽ tạo script về thói quen buổi sáng. Để tối ưu nội dung:
- Video dạng nào? (facts / listicle / motivation)
- Độ dài? (30s / 60s / 90s)
- Target audience? (dân văn phòng / học sinh / entrepreneur)

Hoặc tôi có thể tạo mặc định: Listicle 60s về '5 thói quen buổi sáng', phù hợp dân văn phòng?"

User: "OK, listicle 60s"

Claude:
1. Generate full JSON
2. Create folder: projects/5-thoi-quen-buoi-sang/
3. Save to projects/5-thoi-quen-buoi-sang/script.json
4. Return folder path
```

### Flow 3: Iteration
```
User: "Hook hơi dài, rút ngắn"

Claude:
1. Read existing script.json from projects/{ten-kich-ban}/
2. Update hook, re-balance timing
3. Save updated JSON to projects/{ten-kich-ban}/script.json
4. Confirm changes
```

## RESEARCH INTEGRATION

Khi cần research (facts, statistics), Claude sẽ:

```python
# 1. Identify if research needed
if video_type == 'facts' and not user_provided_facts:
    # 2. Use web_search tool
    search_query = f"{topic} scientific facts statistics"
    results = web_search(search_query)
    
    # 3. Extract key facts
    facts = extract_facts_from_search(results)
    
    # 4. Integrate into script
    script = build_script_with_facts(facts)
```

## PYTHON UTILITIES

Skill này đi kèm các Python scripts trong `/utils/`:

### 1. `script_generator.py`
Core logic để generate script từ template

### 2. `quality_checker.py`
Tính hook strength, pacing score, word count

### 3. `visual_matcher.py`
Suggest visual keywords dựa trên script content

### 4. `json_builder.py`
Build final JSON output theo đúng schema

## QUAN TRỌNG - OUTPUT STRUCTURE

1. **LUÔN TẠO FOLDER CHO KỊCH BẢN** - Tạo `projects/{ten-kich-ban}/`
2. **LƯU SCRIPT.JSON** - Lưu vào `projects/{ten-kich-ban}/script.json`
3. **Tên folder**: Slug hóa từ project name hoặc topic (VD: `tai-sao-ngu-8-tieng-van-met`)
4. **Folder structure**:
   ```
   projects/{ten-kich-ban}/
   ├── script.json       # Kịch bản (file này)
   ├── voice.mp3         # Voice (skill khác tạo)
   └── voice.json        # Voice metadata (skill khác tạo)
   ```
5. **KHÔNG tạo audio/video** - Chỉ output JSON script
6. **KHÔNG gọi API thật** - Chỉ suggest trong JSON (provider, voiceId)
7. **Focus vào script quality** - Hook, pacing, engagement
8. **Visual suggestions** - Để cho skill khác xử lý

## VALIDATION RULES

Trước khi output JSON, validate:
- ✅ Tổng duration của scenes = target duration (±3s)
- ✅ Word count phù hợp với duration
- ✅ Hook có trong 3-7s
- ✅ CTA có trong 5-10s
- ✅ Mỗi scene có visual suggestion
- ✅ Script text không trống
- ✅ `metadata.ratio` là giá trị hợp lệ: `9:16`, `16:9`, `1:1`, `4:5`
- ✅ `metadata.width` và `metadata.height` khớp với ratio:
  - `9:16` → 1080×1920
  - `16:9` → 1920×1080
  - `1:1` → 1080×1080
  - `4:5` → 1080×1350
- ✅ AI-generated prompts sử dụng đúng `--ar {ratio}` theo metadata

## ERROR HANDLING

```python
# Nếu topic quá mơ hồ
if not clear_topic:
    return {
        "error": "Topic không rõ ràng",
        "suggestion": "Ví dụ: 'Tại sao [X]' hoặc '5 cách [Y]'",
        "examples": [...]
    }

# Nếu duration không hợp lý với content
if duration < 30 or duration > 120:
    return {
        "warning": "Duration nên trong khoảng 30-90s cho video faceless",
        "adjusted_duration": 60
    }
```

## INTEGRATION VỚI SKILLS KHÁC

Output JSON của skill này được design để:
- ✅ **video-generator skill** đọc và render
- ✅ **voice-generator skill** lấy script text
- ✅ **b-roll-fetcher skill** lấy visual suggestions
- ✅ **editor skill** modify và re-generate

## ⚠️ CRITICAL RULES

### 1. ALWAYS Use JSONBuilder

**Bắt buộc**: Khi tạo `script.json`, PHẢI dùng `JSONBuilder` class.

**✅ Đúng**:
```python
from utils.json_builder import JSONBuilder

builder = JSONBuilder()

# Traditional videos (facts, listicle, etc.)
script = builder.build_project_json(
    topic='...',
    video_type='listicle',
    duration=60,
    scenes=[...],
    script_text='...',
    metadata={'ratio': '9:16', 'platform': 'shorts'}
)

# Multi-video-edit
script = builder.build_project_json(
    topic='my-edit',
    video_type='multi-video-edit',
    source_videos=[...],
    transcript={...},
    scenes=[...],
    metadata={'ratio': '9:16'}
)

# Save to file
builder.save_to_file(script, 'public/projects/my-video/script.json')
```

**❌ Sai** (KHÔNG làm thế này):
```python
# KHÔNG tự tạo dict manually
script = {
    "metadata": {...},  # ❌ Missing fields, wrong structure
    "scenes": [...]     # ❌ Không chuẩn schema
}
```

**Lý do**:
- ✅ Đảm bảo schema chuẩn (traditional & multi-video-edit)
- ✅ Auto-fill các fields cần thiết
- ✅ Validation trước khi save
- ✅ Backward compatible với video-editor skill
- ✅ Consistent với examples

---

## BEST PRACTICES

### 1. Hook Writing
- Bắt đầu bằng số liệu hoặc câu hỏi
- Tạo curiosity gap
- Không reveal hết trong hook

### 2. Pacing
- Hook: nhanh, punchy
- Body: theo logic flow
- CTA: chậm, rõ ràng

### 3. Visual Pairing
- Mỗi script segment → 1 visual suggestion
- Đa dạng: stock + AI-generated
- Keywords cụ thể, không mơ hồ

### 4. CTA
- Platform-specific: "Follow" (TikTok) vs "Subscribe" (YouTube)
- Actionable: "Comment bên dưới" vs "Hãy suy nghĩ"
- Short: 1-2 câu

## VERSION HISTORY

- v1.0 (2025-01-24): Initial release
  - Support 4 video types
  - Quality checkers
  - Visual suggestions
- v1.1 (2026-01-25): Added image-slide type
  - AI image generation support
  - Custom image upload
- v1.2 (2026-01-28): **Added multi-video-edit type** ✨
  - User video processing (FFmpeg)
  - AI content analysis
  - Smart B-roll suggestions
  - Timeline sync with sourceVideoId

---

## USAGE EXAMPLES

### Multi-Video-Edit Workflow

```python
# User: "Tôi có 2 video này, edit giúp tôi"
# AI Agent:

from utils.multi_video_generator import generate_multi_video_script

# Step 1: Process videos
result = generate_multi_video_script(
    video_paths=[
        '/Users/binhpc/Downloads/intro.mp4',
        '/Users/binhpc/Downloads/content.mp4'
    ],
    project_name='my-cooking-video',
    ratio='9:16'
)

# Output:
# {
#   "scriptPath": "public/projects/my-cooking-video/script.json",
#   "audioFiles": ["audio/video_1.mp3", "audio/video_2.mp3"],
#   "totalDuration": 32.8,
#   "nextSteps": ["Transcribe audio files..."]
# }

# Step 2: User transcribes audio (external service)
# transcript_data = {...}

# Step 3: Update transcript
from utils.multi_video_generator import update_script_transcript

script = update_script_transcript(
    'public/projects/my-cooking-video',
    transcript_data
)

# Step 4: AI analyzes & updates script.json
# → Sections detected
# → Title cards generated
# → B-roll suggestions added
# → Timeline ready for generation
```

**Result**: `script.json` với:
- ✅ `sourceVideos` array
- ✅ `transcript` với `sourceVideoId` references
- ✅ `scenes` với `titleCard` và `brollSuggestions`
- ✅ Ready cho video-editor skill

