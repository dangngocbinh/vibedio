# ⚡ QUICK START - VIDEO SCRIPT GENERATOR

## 🎯 MỤC ĐÍCH
Skill này giúp bạn tạo kịch bản video faceless tự động, output là JSON sẵn sàng cho video generation.

---

## 🚀 CÁCH DÙNG NHANH NHẤT

### Trong Claude Chat:

```
User: "Tạo script 60s về tại sao ngủ 8 tiếng vẫn mệt"

Claude: [Tự động generate JSON với:]
- Script đầy đủ với timing
- Visual suggestions
- Voice config
- Quality metrics
```

**Chỉ cần nói với Claude** - skill sẽ tự động:
1. Phân tích video type (facts/listicle/motivation/story)
2. Generate structure phù hợp
3. Check quality (hook, pacing, word count)
4. Output JSON hoàn chỉnh

---

## 📋 CÁC LỆNH CƠ BẢN

### 1. Tạo script đơn giản
```
"Tạo script 60s về [topic]"
```

### 2. Tạo script có chi tiết
```
"Tạo listicle 60s về 5 thói quen buổi sáng, target dân văn phòng"
```

### 3. Chỉnh sửa
```
User: [Sau khi có script]
"Hook quá dài, rút ngắn"
"Thêm số liệu vào hook"
"Body scene 2 cần thêm explanation"
```

### 4. Xem quality metrics
```
"Quality check của script này thế nào?"
```

---

## 🎬 4 LOẠI VIDEO

| Type | Khi nào dùng | Example |
|------|-------------|---------|
| **facts** | Educational, giải thích | "Tại sao X?" |
| **listicle** | Top N, danh sách | "5 cách để..." |
| **motivation** | Truyền cảm hứng | "Quote của Steve Jobs" |
| **story** | Kể chuyện | "Người này đã..." |

Claude sẽ tự động detect type phù hợp, hoặc bạn chỉ định rõ.

---

## 📊 JSON OUTPUT

Script JSON gồm:
- ✅ **metadata**: Project info, target audience, platform
- ✅ **script**: Full text, word count, timing
- ✅ **scenes**: Từng scene với visual suggestions
- ✅ **voice**: Config cho voice generation
- ✅ **music**: Mood, volume suggestions
- ✅ **subtitle**: Style, font, position
- ✅ **qualityMetrics**: Hook score, pacing score

---

## 🎯 WORKFLOW CHUẨN

```
1. Request script
   ↓
2. Claude generates JSON
   ↓
3. Review quality metrics
   ↓
4. Iterate nếu cần (adjust hook, timing, etc)
   ↓
5. Final JSON
   ↓
6. Pass to video-generator skill
```

---

## 💡 TIPS

### Hook tốt:
- Có số liệu: "80% người..."
- Có câu hỏi: "Tại sao...?"
- Có warning: "Đừng..."
- Ngắn gọn: 20-60 characters

### Pacing tốt:
- Hook: 3-7 giây
- Body: 8-20 giây per scene
- CTA: 5-10 giây

### Word count:
- Facts: 130-150 words cho 60s
- Listicle: 140-160 words
- Motivation: 100-130 words (chậm hơn)

---

## 🔧 DEMO

Chạy demo để xem skill hoạt động:

```bash
cd /mnt/skills/user/video-script-generator
python demo.py
```

Sẽ output:
1. Facts video JSON (sleep cycle)
2. Listicle video JSON (morning habits)
3. Hook comparison với scores

---

## 🐛 TROUBLESHOOTING

### "Hook score thấp"
→ Claude sẽ suggest improvements tự động
→ Thêm số liệu, câu hỏi, power words

### "Word count không đủ"
→ Claude suggest số từ cần thêm
→ Expand explanations hoặc add examples

### "Pacing lỗi"
→ Claude re-balance scene durations
→ Đảm bảo total = target duration

---

## 📖 ĐỌC THÊM

- **SKILL.md**: Chi tiết đầy đủ về templates, workflows
- **README.md**: Tổng quan, integration, customization
- **examples.md**: JSON examples cho từng video type
- **demo.py**: Code demo cách dùng Python utilities

---

## ✅ NEXT STEPS

Sau khi có script JSON:

1. **Optional**: Save JSON để track
2. **Generate voice**: Pass script text + voiceId to voice-generator
3. **Fetch B-roll**: Pass visual suggestions to b-roll-fetcher
4. **Render video**: Pass full JSON to video-generator

---

**Chỉ cần nói với Claude - skill sẽ lo phần còn lại!** 🚀
