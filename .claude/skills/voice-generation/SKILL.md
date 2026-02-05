---
name: Voice Generation
description: Generates Text-to-Speech audio using various providers (ElevenLabs, Vbee, OpenAI, Google) with support for emotion-based voice selection and timestamp generation.
---

# Voice Generation Skill

This skill allows you to generate high-quality voiceovers from text using multiple providers. It is designed to be used within the `skill-voice-gen` directory.

## Capabilities
- **Multi-Provider**: Support for ElevenLabs (Emotive), Vbee (Vietnamese), OpenAI (General), and Google (Cloud TTS).
- **Emotion-Aware**: valid logic to select appropriate voices based on the detailed emotion of the text.
- **Timestamps**: improving subtitle creation by attempting to fetch word-level timestamps (Alignment) where supported (ElevenLabs, Google).
- **Timestamp Generation for Existing Voice**: Generate word-level timestamps from any existing audio file using **ElevenLabs Scribe v2** (preferred) or **OpenAI Whisper** (fallback).

## Usage

### 1. Setup
Ensure the `.env` at root project

### 2. General Instruction
To generate voice, you will typically run the Node.js script located at `skill-voice-gen/scripts/generate-voice.js`.

### 3. Command Line Interface

#### Text Input Options (Priority Order)

**IMPORTANT**: For long text (>200 chars), always use `--text-path` to avoid terminal limitations.

```bash
# Option 1: File path (RECOMMENDED)
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text-path "public/projects/my-video/raw_script.txt" \
  --provider "gemini" \
  --outputDir "public/projects/my-video"

# Option 2: JSON script file (alternative)
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --script "public/projects/my-video/script.json" \
  --provider "elevenlabs"
```

**Priority Resolution**:
1. `--text-path` (highest priority) - Path to text file
2. `--script` (fallback) - Path to JSON script file containing text

**Additional Options**:
```bash
--provider "gemini"                           # Voice provider (auto|elevenlabs|vbee|openai|gemini)
--emotion "happy"                             # Emotion (neutral|happy|sad|angry|excited)
--voiceId "Charon"                            # Specific voice ID
--styleInstruction "Trầm – ấm – chậm – rất đời"  # Gemini only: custom voice style
--outputDir "public/projects/folder"          # Output directory
--title "My Video"                            # Custom title for filename
```

#### Migration Guide (BREAKING CHANGE)

**REMOVED**: `--text` parameter no longer exists. You MUST migrate to `--text-path`:

```bash
# BEFORE (NO LONGER WORKS):
node generate-voice.js --text "Any text here..."

# AFTER (REQUIRED):
# 1. Save text to a file:
echo "Any text here..." > public/projects/my-video/raw_script.txt

# 2. Use --text-path:
node generate-voice.js --text-path "public/projects/my-video/raw_script.txt"
```

**If you're using `director.py`**: ✅ No changes needed! It automatically uses `raw_script.txt`.

### 3.1. Style Instruction (Gemini Only)

Gemini API hỗ trợ **style instruction** - mô tả tự do về cách bạn muốn giọng nói được thể hiện.

**Ví dụ style instructions**:
- `"Trầm – ấm – chậm – rất đời"` - Giọng sâu, ấm áp, nhịp chậm, chân thành
- `"Vui tươi – năng động – nhiệt tình"` - Giọng sôi nổi, tràn đầy năng lượng  
- `"Nghiêm túc – chuyên nghiệp – rõ ràng"` - Giọng trang trọng, dễ hiểu
- `"Nhẹ nhàng – êm dịu – thư giãn"` - Giọng dịu dàng, meditation

**Lưu ý**: 
- Style instruction được đưa vào **dòng đầu tiên** của prompt (format: `Instruction \n Text`)
- Để tránh bị đọc thành tiếng, nên dùng câu mệnh lệnh rõ ràng:
  - ✅ `"Read in a warm, friendly tone:"`
  - ✅ `"Giọng đọc trầm ấm, chậm rãi:"`
- Tránh dùng tính từ ngắn cộc lốc có thể bị hiểu nhầm là text:
  - ⚠️ `"Vui tươi"` (Có thể bị đọc "Vui tươi. Xin chào...")
- Kết hợp với `voiceId` để tùy chỉnh cả giọng nói và phong cách

### 4. Voice Provider Priority Strategy (Quality First)
When `voiceId` is not explicitly provided, or when creating a new configuration, the Agent **MUST** follow this priority order based on available API Keys in `.env`:

**1. ElevenLabs** (`ELEVENLABS_API_KEY`) 🥇
   - **Why**: Best emotion, best timestamp alignment (native), highest realism.
   - **Use when**: Key is available. ALWAYS prefer for English or high-quality Vietnamese.

**2. Gemini** (`GEMINI_API_KEY` or `GOOGLE_API_KEY`) 🥈
   - **Why**: Generative AI, very natural prosody, free/cheap.
   - **Use when**: ElevenLabs is missing, but Google key is present.
   - **Note**: Supports `styleInstruction`.

**3. OpenAI** (`OPENAI_API_KEY`) 🥉
   - **Why**: Standard quality, reliable, but less emotive than above.
   - **Use when**: No ElevenLabs or Gemini keys.

**4. Vbee** (`VBEE_API_KEY`) 🇻🇳
   - **Why**: Specialized for Vietnamese News/Broadcast.
   - **Use when**: Specifically requested for "News/Tintuc" style or no other keys available for Vietnamese.

**Agent Action**: Before running generation, check `.env`. If user asks for "highest quality", jumping to ElevenLabs is mandatory if the key exists.

## 🚀 Recommended Voices by Use Case (Personas)

| Use Case                   | Recommended Voice              | Provider | Why?                                      |
| :------------------------- | :----------------------------- | :------- | :---------------------------------------- |
| **News / Facts / Edu**     | `Charon`                       | Gemini   | Deep, authoritative, trustworthy.         |
|                            | `onyx`                         | OpenAI   | Serious, professional tone.               |
|                            | `hn_male_manh_dung_news_48k-h` | Vbee     | Standard Vietnamese News voice.           |
| **Storytelling / Podcast** | `Aoede`                        | Gemini   | Expressive, emotional, great for stories. |
|                            | `echo`                         | OpenAI   | Warm, soft, good for audiobooks.          |
|                            | `fable`                        | OpenAI   | Narrative, slightly British phrasing.     |
| **TikTok / Shorts / Vlog** | `Puck`                         | Gemini   | Energetic, mischievous, "Youtuber" vibe.  |
|                            | `Fenrir`                       | Gemini   | Intense, wild, good for dramatic shorts.  |
|                            | `nova`                         | OpenAI   | Fast, friendly, energetic.                |
| **Meditation / Soothing**  | `Kore`                         | Gemini   | Very calm, slow, relaxing.                |
|                            | `shimmer`                      | OpenAI   | Clear, resonant, pure.                    |

### 5. Generate Timestamps for Existing Voice Files

Nếu bạn đã có voice file từ nguồn khác (thu âm, tải về, hoặc từ provider không hỗ trợ timestamps), bạn có thể tạo timestamps riêng bằng script `generate-timestamps.js`.

**STT Provider Selection** (flag `--provider`):
| Provider         | Model     | Accuracy                      | Notes                                           |
| :--------------- | :-------- | :---------------------------- | :---------------------------------------------- |
| `elevenlabs`     | Scribe v2 | Cao nhất, hỗ trợ 90+ ngôn ngữ | Tính phí theo giờ audio                         |
| `whisper`        | Whisper-1 | Tốt                           | ~$0.006/phút (~140đ/phút)                       |
| `auto` (default) | Tự chọn   | -                             | Ưu tiên ElevenLabs nếu có key, fallback Whisper |

**Use Cases**:
- ✅ Voice file từ TikTok, YouTube, hoặc nguồn khác
- ✅ Voice đã thu âm sẵn
- ✅ Voice từ Gemini/OpenAI không có timestamps
- ✅ Cần timestamps chính xác hơn cho subtitle

**Command Syntax**:
```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "path/to/voice.mp3" \
  --text-path "path/to/text.txt" \  # Optional: original text file for better accuracy
  --provider "auto" \                # Options: elevenlabs, whisper, auto (default: auto)
  --outputDir "public/projects/folder"  # Optional: custom output directory
```

**Example 1: Auto-select best provider (ElevenLabs > Whisper)**
```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "public/projects/my-video/voice.mp3" \
  --text-path "public/projects/my-video/raw_script.txt"
```

**Example 2: Force ElevenLabs Scribe v2 (higher accuracy)**
```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "public/projects/my-video/voice.mp3" \
  --provider elevenlabs \
  --text-path "public/projects/my-video/raw_script.txt"
```

**Example 3: Force Whisper**
```bash
node .claude/skills/voice-generation/scripts/generate-timestamps.js \
  --audio "public/projects/my-video/voice.mp3" \
  --provider whisper
```

**NOTE**: `--text` parameter has been removed. Use `--text-path` to pass text from a file instead.

**Output**:
- Tạo file `voice.json` cùng thư mục với audio file
- Chứa word-level timestamps và metadata
- Field `timestamp_source`: `elevenlabs_scribe_v2` hoặc `whisper`
- Format tương thích với video editor skill

**Requirements**:
- ⚠️ Cần `ELEVENLABS_API_KEY` và/hoặc `OPENAI_API_KEY` trong file `.env`
- ⚠️ Auto mode: ưu tiên ElevenLabs nếu có key (chính xác hơn), fallback Whisper
- ⚠️ Cần cài `ffprobe` (thường đi kèm với ffmpeg)

### 6. Utility: List Available Voices
 To see a list of available voice IDs (Gemini, OpenAI, Vbee, ElevenLabs), run:
```bash
node skill-voice-gen/scripts/list-voices.js
```

## Voice Reference (Quick Look)

### Google Gemini (Generative)
| id            | description              |
| ------------- | ------------------------ |
| Zephyr        | Tươi sáng                |
| Puck          | Rộn ràng                 |
| Charon        | Cung cấp nhiều thông tin |
| Kore          | Firm                     |
| Fenrir        | Dễ kích động             |
| Leda          | Trẻ trung                |
| Orus          | Firm                     |
| Aoede         | Breezy                   |
| Callirrhoe    | Dễ chịu                  |
| Autonoe       | Tươi sáng                |
| Enceladus     | Breathy                  |
| Iapetus       | Rõ ràng                  |
| Umbriel       | Dễ tính                  |
| Algieba       | Làm mịn                  |
| Despina       | Smooth (Mượt mà)         |
| Erinome       | Clear                    |
| Algenib       | Khàn                     |
| Rasalgethi    | Cung cấp nhiều thông tin |
| Laomedeia     | Rộn ràng                 |
| Achernar      | Mềm                      |
| Alnilam       | Firm                     |
| Schedar       | Even                     |
| Gacrux        | Người trưởng thành       |
| Pulcherrima   | Lạc quan                 |
| Achird        | Thân thiện               |
| Zubenelgenubi | Thông thường             |
| Vindemiatrix  | Êm dịu                   |
| Sadachbia     | Lively                   |
| Sadaltager    | Hiểu biết                |
| Sulafat       | Ấm                       |


### OpenAI
| ID        | Gender  | Description         |
| :-------- | :------ | :------------------ |
| `alloy`   | Neutral | Versatile, Balanced |
| `echo`    | Male    | Warm, Soft          |
| `fable`   | Male    | British, Narrative  |
| `onyx`    | Male    | Deep, Serious       |
| `nova`    | Female  | Energetic, Friendly |
| `shimmer` | Female  | Clear, Resonant     |

### Vbee (Vietnamese)
| ID                             | Name      | Style               |
| :----------------------------- | :-------- | :------------------ |
| `hn_male_manh_dung_news_48k-h` | Mạnh Dũng | News, Standard (HN) |
| `sg_female_thao_vy_news_48k-h` | Thảo Vy   | News, Clear (SG)    |

## Output Structure

### When used with Script Generator:
Voice files are saved in the same folder as script.json:
```
public/projects/{ten-kich-ban}/
├── script.json       # Kịch bản (từ script generator)
├── voice.mp3         # Audio file
└── voice.json        # Metadata với timestamps
```

### Standalone usage:
If no `--outputDir` is specified, files go to main output folder:
```
public/projects/
├── <timestamp>_<provider>.mp3
└── <timestamp>_<provider>.json
```

### Timestamp generation for existing voice:
When using `generate-timestamps.js`, the JSON file is created in the same directory as the audio file:
```
public/projects/{your-folder}/
├── voice.mp3         # Your existing audio file (unchanged)
└── voice.json        # NEW: Generated metadata with timestamps
```

### Metadata content (voice.json):
- `text`: Original text.
- `provider`: Service used.
- `voiceId`: Voice ID used.
- `timestamps`: Array of `{ word: string, start: number, end: number }` (if available).

## Example Workflow
1.  **User**: "Generate a sad voiceover for this text: 'It was a rainy day...'"
2.  **Agent**:
    - Detect emotion: "sad".
    - Detect language: "English".
    - Select provider: "elevenlabs" (best for emotion).
    - Construct command: `node skill-voice-gen/scripts/generate-voice.js --text "It was a rainy day..." --provider elevenlabs --emotion sad`
    - executing command...
    - Returns path to generated file to user.
