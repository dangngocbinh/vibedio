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

## Usage

### 1. Setup
Ensure the `.env` file is configured with valid API keys in `skill-voice-gen/.env`.

### 2. General Instruction
To generate voice, you will typically run the Node.js script located at `skill-voice-gen/scripts/generate-voice.js`.

### 3. Command Line Interface
The script accepts the following arguments:

```bash
node skill-voice-gen/scripts/generate-voice.js \
  --text "Your text here" \ # should use for short text
  --script "path/to/script.json" \ # should use for long text: path to script.json
  --provider "elevenlabs" \    # options: elevenlabs, vbee, openai, gemini
  --emotion "happy" \          # optional: happy, sad, angry, neutral, excited
  --voiceId "specific_id" \    # optional: override automatic selection
  --styleInstruction "Trầm – ấm – chậm – rất đời" \  # optional (Gemini only): custom voice style
  --outputDir "public/projects/folder"  # optional: custom output directory
```

**IMPORTANT**: When generating voice for a script, always use `--outputDir` to match the script folder:
```bash
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --text "Your text here" \ # should use for short text
  --script "path/to/script.json" \ # should use for long text: path to script.json
  --provider "gemini" \
  --voiceId "Charon" \
  --styleInstruction "Trầm – ấm – chậm – rất đời" \  # Custom style for Gemini
  --outputDir "public/projects/ten-kich-ban"  # Same folder as script.json
```

### 3.1. Style Instruction (Gemini Only)

Gemini API hỗ trợ **style instruction** - mô tả tự do về cách bạn muốn giọng nói được thể hiện.

**Ví dụ style instructions**:
- `"Trầm – ấm – chậm – rất đời"` - Giọng sâu, ấm áp, nhịp chậm, chân thành
- `"Vui tươi – năng động – nhiệt tình"` - Giọng sôi nổi, tràn đầy năng lượng  
- `"Nghiêm túc – chuyên nghiệp – rõ ràng"` - Giọng trang trọng, dễ hiểu
- `"Nhẹ nhàng – êm dịu – thư giãn"` - Giọng dịu dàng, meditation

**Lưu ý**: 
- Style instruction chỉ hoạt động với provider `gemini`
- Nó sẽ bị bỏ qua với các provider khác (elevenlabs, openai, vbee)
- Kết hợp với `voiceId` để tùy chỉnh cả giọng nói và phong cách

### 4. Automatic Voice Selection Logic
If `voiceId` is not provided, the Agent (you) or the Script should attempt to select a voice based on the `emotion` and `language` of the text.

**Recommended Mapping (Extendable in implementation):**
- **Vietnamese**: Default to **Vbee** or **ElevenLabs** (multilingual model).
- **English + Emotion**: Default to **ElevenLabs**.
- **General/Cost-effective**: Default **Google**. or  **OpenAI**

## 🚀 Recommended Voices by Use Case (Personas)

| Use Case | Recommended Voice | Provider | Why? |
| :--- | :--- | :--- | :--- |
| **News / Facts / Edu** | `Charon` | Gemini | Deep, authoritative, trustworthy. |
| | `onyx` | OpenAI | Serious, professional tone. |
| | `hn_male_manh_dung_news_48k-h` | Vbee | Standard Vietnamese News voice. |
| **Storytelling / Podcast** | `Aoede` | Gemini | Expressive, emotional, great for stories. |
| | `echo` | OpenAI | Warm, soft, good for audiobooks. |
| | `fable` | OpenAI | Narrative, slightly British phrasing. |
| **TikTok / Shorts / Vlog** | `Puck` | Gemini | Energetic, mischievous, "Youtuber" vibe. |
| | `Fenrir` | Gemini | Intense, wild, good for dramatic shorts. |
| | `nova` | OpenAI | Fast, friendly, energetic. |
| **Meditation / Soothing** | `Kore` | Gemini | Very calm, slow, relaxing. |
| | `shimmer` | OpenAI | Clear, resonant, pure. |

### 5. Utility: List Available Voices
 To see a list of available voice IDs (Gemini, OpenAI, Vbee, ElevenLabs), run:
```bash
node skill-voice-gen/scripts/list-voices.js
```

## Voice Reference (Quick Look)

### Google Gemini (Generative)
| id            | description                 |
|---------------|-----------------------------|
| Zephyr        | Tươi sáng                   |
| Puck          | Rộn ràng                    |
| Charon        | Cung cấp nhiều thông tin    |
| Kore          | Firm                        |
| Fenrir        | Dễ kích động                |
| Leda          | Trẻ trung                   |
| Orus          | Firm                        |
| Aoede         | Breezy                      |
| Callirrhoe    | Dễ chịu                     |
| Autonoe       | Tươi sáng                   |
| Enceladus     | Breathy                     |
| Iapetus       | Rõ ràng                     |
| Umbriel       | Dễ tính                     |
| Algieba       | Làm mịn                     |
| Despina       | Smooth (Mượt mà)            |
| Erinome       | Clear                       |
| Algenib       | Khàn                        |
| Rasalgethi    | Cung cấp nhiều thông tin    |
| Laomedeia     | Rộn ràng                    |
| Achernar      | Mềm                         |
| Alnilam       | Firm                        |
| Schedar       | Even                        |
| Gacrux        | Người trưởng thành          |
| Pulcherrima   | Lạc quan                    |
| Achird        | Thân thiện                  |
| Zubenelgenubi | Thông thường                |
| Vindemiatrix  | Êm dịu                      |
| Sadachbia     | Lively                      |
| Sadaltager    | Hiểu biết                   |
| Sulafat       | Ấm                          |


### OpenAI
| ID | Gender | Description |
| :--- | :--- | :--- |
| `alloy` | Neutral | Versatile, Balanced |
| `echo` | Male | Warm, Soft |
| `fable` | Male | British, Narrative |
| `onyx` | Male | Deep, Serious |
| `nova` | Female | Energetic, Friendly |
| `shimmer` | Female | Clear, Resonant |

### Vbee (Vietnamese)
| ID | Name | Style |
| :--- | :--- | :--- |
| `hn_male_manh_dung_news_48k-h` | Mạnh Dũng | News, Standard (HN) |
| `sg_female_thao_vy_news_48k-h` | Thảo Vy | News, Clear (SG) |

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
