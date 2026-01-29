# SHORT-60S QUICKSTART

## Bắt đầu trong 5 phút

### Bước 1: Tạo Script
```
Prompt Claude:

"Tạo script video short 60s về: [CHỦ ĐỀ CỦA BẠN]
- Video type: facts
- Platform: tiktok
- Ngôn ngữ: Tiếng Việt
- Hook phải gây tò mò trong 3 giây đầu"
```

Claude sẽ tạo file `public/projects/{ten-project}/script.json`

### Bước 2: Tạo Voice

```bash
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --script "public/projects/{ten-project}/script.json" \
  --provider "gemini" \
  --voiceId "Charon" \
  --outputDir "public/projects/{ten-project}"
```

### Bước 3: Tìm Resources

```bash
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir "public/projects/{ten-project}" \
  --enableAI
```

### Bước 4: Build Timeline

```bash
python .claude/skills/video-editor/cli.py "public/projects/{ten-project}"
```

### Bước 5: Render

```bash
npx remotion render OtioTimeline "public/projects/{ten-project}/out/final.mp4" \
  --props='{"projectFolder":"{ten-project}"}'
```

---

## Ví dụ cụ thể

### Tạo video "5 sai lầm khi học tiếng Anh"

```bash
# 1. Claude tạo script (bạn prompt)
# → public/projects/5-sai-lam-hoc-tieng-anh/script.json

# 2. Voice
node .claude/skills/voice-generation/scripts/generate-voice.js \
  --script "public/projects/5-sai-lam-hoc-tieng-anh/script.json" \
  --provider "gemini" \
  --voiceId "Puck" \
  --styleInstruction "Sôi động – trẻ trung – năng lượng" \
  --outputDir "public/projects/5-sai-lam-hoc-tieng-anh"

# 3. Resources
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir "public/projects/5-sai-lam-hoc-tieng-anh"

# 4. Timeline
python .claude/skills/video-editor/cli.py "public/projects/5-sai-lam-hoc-tieng-anh"

# 5. Render
npx remotion render OtioTimeline out/final.mp4 \
  --props='{"projectFolder":"5-sai-lam-hoc-tieng-anh"}'
```

---

## Chọn Voice phù hợp

| Nội dung | Provider | Voice | Style |
|----------|----------|-------|-------|
| Facts/Edu | Gemini | Charon | "Trầm – ấm – chậm" |
| Listicle/TikTok | Gemini | Puck | "Sôi động – năng lượng" |
| Story | Gemini | Aoede | "Kịch tính – cảm xúc" |
| Motivation | Gemini | Kore | "Nhẹ nhàng – truyền cảm hứng" |

---

## Tips

1. **Hook là quan trọng nhất** - 3 giây đầu quyết định viewer ở lại hay swipe
2. **Word count 130-150** - Đủ để nói hết trong 60s
3. **Subtitle highlight-word** - TikTok style phổ biến nhất
4. **Music volume 0.10-0.15** - Không được át voice
5. **Transition crossfade 0.5s** - Mượt mà, không gây giật
