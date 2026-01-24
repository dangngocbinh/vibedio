# 🎬 VIDEO SCRIPT GENERATOR SKILL

**Version:** 1.0  
**Purpose:** Tạo kịch bản video faceless tự động với JSON output chuẩn, sẵn sàng cho video generation  
**Environment:** Claude Code, Google Antigravity

---

## 📦 STRUCTURE

```
video-script-generator/
├── SKILL.md              # Chi tiết skill, workflow, templates
├── README.md             # File này - tổng quan
├── examples.md           # Ví dụ JSON output
├── utils/
│   ├── script_generator.py   # Core logic generate script
│   ├── quality_checker.py    # Hook strength, pacing check
│   └── json_builder.py       # Build JSON output
└── tests/                     # (Optional) Unit tests
```

---

## 🚀 QUICK START

### Với Claude:

**Simple request:**
```
User: "Tạo script 60s về tại sao bạn mệt dù ngủ đủ 8 tiếng"

Claude: 
- Phân tích: Facts video, educational
- Generate full JSON script
- Include visual suggestions
- Quality metrics
```

**Detailed request:**
```
User: "Tạo listicle 60s về 5 thói quen buổi sáng, target dân văn phòng 25-35"

Claude:
- Confirm structure: 5 items x 10s + hook + CTA
- Generate balanced script
- Suggest visuals cho từng item
- Output JSON
```

---

## 💡 KEY FEATURES

### ✅ 4 Video Types Supported
- **Facts**: Educational, scientific content (Hook → Problem → Insight → Solution → CTA)
- **Listicle**: Top N tips/ways (Hook → Item 1-5 → CTA)
- **Motivation**: Inspirational quotes & stories (Quote → Story → Lesson → CTA)
- **Story**: Narrative timeline (Hook → Setup → Build → Climax → CTA)

### ✅ Quality Assurance
- **Hook Strength**: 0-10 score dựa trên số liệu, power words, câu hỏi
- **Pacing Check**: Đảm bảo timing phù hợp (hook 3-7s, body 8-20s, CTA 5-10s)
- **Word Count**: Auto-calculate dựa trên duration và video type (130-160 wpm)
- **Engagement Potential**: Predict high/medium/low engagement

### ✅ Visual Suggestions
- **Stock footage keywords**: Tiếng Anh, SEO-friendly
- **AI generation prompts**: Midjourney-ready với aspect ratio
- **Animation styles**: zoom-in, ken-burns, fade, slide

### ✅ Complete JSON Output
- Metadata (project info, target audience, platform)
- Script (full text, word count, timing)
- Scenes (với visual suggestions)
- Voice config (provider, speed, notes)
- Music config (mood, volume, suggestions)
- Subtitle config (style, position, font)
- Quality metrics (scores, suggestions)

---

## 📖 USAGE PATTERNS

### Pattern 1: Generate & Go
```
User: "Script 60s facts về [topic]"
→ Claude outputs complete JSON
→ User passes to video-generator skill
```

### Pattern 2: Iterate
```
User: "Script 60s về [topic]"
→ Claude outputs JSON
User: "Hook hơi dài, rút ngắn"
→ Claude updates JSON
User: "Thêm số liệu vào body"
→ Claude updates JSON
User: "OK, final"
→ Done
```

### Pattern 3: Research-based
```
User: "Script facts về [scientific topic]"
→ Claude: "Tôi sẽ research facts trước"
→ Uses web_search tool
→ Extracts key facts
→ Builds script với data
→ Outputs JSON
```

---

## 🛠️ PYTHON UTILITIES

### 1. script_generator.py
```python
from utils.script_generator import ScriptGenerator

gen = ScriptGenerator()

# Generate structure
scenes = gen.generate_structure('facts', 60)

# Calculate word target
min_words, max_words = gen.calculate_word_target(60, 'facts')

# Suggest visuals
visual = gen.suggest_visuals('hook', 'Bạn ngủ 8 tiếng mà vẫn mệt?')
```

### 2. quality_checker.py
```python
from utils.quality_checker import QualityChecker

checker = QualityChecker()

# Check hook
hook_result = checker.calculate_hook_strength("Hook text...")
print(f"Score: {hook_result['score']}/10")

# Check pacing
pacing_result = checker.calculate_pacing_score(scenes, 60)

# Full check
report = checker.full_quality_check(script_data)
```

### 3. json_builder.py
```python
from utils.json_builder import JSONBuilder

builder = JSONBuilder()

# Build complete JSON
project = builder.build_project_json(
    topic="Your topic",
    video_type="facts",
    duration=60,
    scenes=scenes,
    script_text="Full script text..."
)

# Validate
validation = builder.validate_schema(project)

# Output
json_string = builder.to_json_string(project)
```

---

## 🎯 INTEGRATION WITH OTHER SKILLS

### → video-generator skill
```
script.json → video-generator → MP4
```

### → voice-generator skill
```
script.json (text + voiceId) → voice-generator → audio.mp3
```

### → b-roll-fetcher skill
```
script.json (visual suggestions) → b-roll-fetcher → videos/images
```

### → editor skill
```
script.json → visual editor → modified JSON → re-render
```

---

## 📊 QUALITY METRICS EXPLAINED

### Hook Strength (0-10)
- **8-10**: Excellent - Có số liệu, power words, câu hỏi, độ dài OK
- **6-8**: Good - Thiếu 1-2 elements
- **4-6**: Average - Cần improve
- **0-4**: Weak - Cần viết lại

### Pacing Score (0-10)
- **8-10**: Excellent - Timing balanced, flow tốt
- **6-8**: Good - Minor adjustments needed
- **4-6**: Average - Cần re-balance
- **0-4**: Poor - Major restructure needed

### Engagement Potential
- **High**: Hook + pacing + engagement elements đều tốt (8+)
- **Medium**: Có vài điểm mạnh (6-8)
- **Low**: Cần nhiều improvements (<6)

---

## 🔧 CUSTOMIZATION

### Thêm video type mới:
Edit `utils/script_generator.py`:
```python
self.templates['new_type'] = {
    'structure': ['section1', 'section2', ...],
    'timing': [10, 20, ...],
    'wpm': 140
}
```

### Thêm hook formula:
```python
self.hook_formulas['new_type'] = [
    "Formula 1...",
    "Formula 2..."
]
```

### Custom quality metrics:
Edit `utils/quality_checker.py` để adjust scoring logic.

---

## 📝 EXAMPLES

Xem file `examples.md` cho:
- ✅ Facts video JSON (sleep cycle example)
- ✅ Listicle video JSON (morning habits)
- ✅ Motivation video JSON (Steve Jobs quote)
- ✅ Story video JSON structure

---

## 🚨 IMPORTANT NOTES

### ❌ Skill này KHÔNG làm:
- Generate audio files (chỉ suggest voice config)
- Fetch stock footage (chỉ suggest keywords)
- Render video (chỉ output JSON)
- Save files automatically (trả JSON về user)

### ✅ Skill này LÀM:
- Generate script text hoàn chỉnh
- Quality checking (hook, pacing, word count)
- Visual suggestions cho từng scene
- Output JSON chuẩn cho next steps

---

## 🎓 BEST PRACTICES

### 1. Hook Writing
- Bắt đầu bằng số liệu hoặc câu hỏi
- Dưới 60 characters
- Tạo curiosity gap
- Avoid revealing too much

### 2. Body Content
- 3-5 main points cho Facts
- Exact items cho Listicle (5 items = 5 scenes)
- Build tension cho Story
- Flow logic, not random

### 3. CTA
- Platform-specific: "Follow" (TikTok) vs "Subscribe" (YouTube)
- Actionable: "Comment bên dưới" > "Hãy suy nghĩ"
- Short: 1-2 câu max

### 4. Visual Pairing
- Mỗi scene → 1 visual
- Keywords cụ thể, not vague
- Mix stock + AI-generated
- Animation phù hợp mood

---

## 🐛 TROUBLESHOOTING

### Issue: Word count không khớp duration
**Solution:** Adjust script text hoặc duration. Tool sẽ suggest số từ cần thêm/bớt.

### Issue: Hook score thấp
**Solution:** Tool suggest improvements. Common fixes:
- Thêm số liệu
- Đổi sang câu hỏi
- Thêm power words
- Adjust độ dài

### Issue: Pacing score thấp
**Solution:** Re-balance scene durations:
- Hook: 3-7s
- Body: 8-20s per scene
- CTA: 5-10s

---

## 📚 RESOURCES

### Templates
- Xem `SKILL.md` → Templates section cho đầy đủ templates

### Examples
- Xem `examples.md` cho complete JSON examples

### Code
- Xem `utils/` folder cho Python utilities

---

## 🔄 VERSION HISTORY

**v1.0** (2025-01-24)
- Initial release
- 4 video types support
- Quality checkers
- JSON builder
- Examples

---

## 🤝 NEXT STEPS

After generating script JSON:

1. **Review**: Check quality metrics, iterate if needed
2. **Save**: Keep JSON for record (optional)
3. **Generate voice**: Pass to voice-generator skill
4. **Fetch visuals**: Pass to b-roll-fetcher skill
5. **Render video**: Pass to video-generator skill

---

## 💬 SUPPORT

Nếu skill không hoạt động như mong đợi:
1. Check input parameters (topic, type, duration)
2. Review generated JSON structure
3. Run quality check để xem issues
4. Iterate với Claude để fix

---

**Created by:** Mecode Pro  
**For:** Học viên workshop "Tạo Faceless Video với AI Automation"  
**License:** Internal use only
