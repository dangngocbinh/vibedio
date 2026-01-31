# Aspect Ratio Detection - Example Conversations

> **Note**: This is a simplified guide. AI agent uses natural language reasoning to detect aspect ratio from user input - no Python scripts needed!

---

## Example 1: Clear Detection (TikTok)

**User**: "Tạo video TikTok về 5 bí quyết du lịch tiết kiệm"

**AI Agent** (Reasoning):
- Detects keyword: "TikTok"
- TikTok → 9:16 (vertical format)

**AI Agent** (Response):
> "Dạ em hiểu rồi anh! Em sẽ tạo video **dọc (9:16)** cho TikTok/Shorts/Reels nhé.
>
> 📐 Aspect Ratio: 9:16 (1080x1920)
> 🎯 Platform: TikTok, YouTube Shorts, Instagram Reels
>
> Bắt đầu tạo kịch bản về '5 bí quyết du lịch tiết kiệm'..."

---

## Example 2: Clear Detection (YouTube)

**User**: "Làm video ngang cho YouTube về review sản phẩm"

**AI Agent** (Reasoning):
- Detects keywords: "YouTube" + "ngang"
- YouTube + horizontal → 16:9

**AI Agent** (Response):
> "Dạ! Em sẽ tạo video **ngang (16:9)** cho YouTube nhé anh.
>
> 📐 Aspect Ratio: 16:9 (1920x1080)
> 🎯 Platform: YouTube, Facebook
>
> Em bắt đầu làm video review sản phẩm..."

---

## Example 3: Ambiguous - Need Confirmation

**User**: "Tạo video về cách nấu ăn"

**AI Agent** (Reasoning):
- No platform keywords detected
- No orientation keywords detected
- → Must ask user

**AI Agent** (Uses AskUserQuestion):
> "Anh/chị muốn tạo video theo format nào?"
>
> Options:
> - 9:16 - TikTok/Shorts/Reels (Dọc) - 1080x1920
> - 16:9 - YouTube/Facebook (Ngang) - 1920x1080
> - 1:1 - Instagram Feed (Vuông) - 1080x1080
> - 4:5 - Instagram Portrait - 1080x1350

**User selects**: "9:16 - TikTok/Shorts/Reels (Dọc)"

**AI Agent**:
> "Dạ cảm ơn anh! Em sẽ tạo video **dọc (9:16)** cho TikTok/Shorts/Reels nhé."

---

## Example 4: Instagram (Ambiguous Platform)

**User**: "Video cho Instagram về fitness"

**AI Agent** (Reasoning):
- Detects "Instagram" but Instagram supports multiple formats:
  - Feed: 1:1 (square) or 4:5 (portrait)
  - Reels: 9:16 (vertical)
- → Clarify with user

**AI Agent**:
> "Em phát hiện anh muốn tạo video cho Instagram.
>
> Instagram hỗ trợ nhiều format:
> - **1:1 (Vuông)** - Instagram Feed (phổ biến nhất)
> - **9:16 (Dọc)** - Instagram Reels
> - **4:5 (Portrait)** - Instagram Feed Portrait
>
> Anh muốn format nào ạ?"

---

## Example 5: Multiple Platforms (Conflict)

**User**: "Tạo video về yoga cho TikTok và YouTube"

**AI Agent** (Reasoning):
- TikTok → 9:16 (vertical)
- YouTube → 16:9 (horizontal)
- Conflict! → Ask which is primary

**AI Agent**:
> "Em thấy anh muốn đăng cả TikTok và YouTube.
>
> Hai platform này dùng aspect ratio khác nhau:
> - **TikTok**: 9:16 (dọc)
> - **YouTube**: 16:9 (ngang)
>
> Anh muốn tạo video theo format nào làm chính?"

**User**: "TikTok là chính"

**AI Agent**:
> "Dạ! Em sẽ tạo video **dọc (9:16)** cho TikTok nhé anh.
>
> 📐 Aspect Ratio: 9:16 (1080x1920)"

---

## Example 6: Shorts Detection

**User**: "Video Shorts về động lực sống"

**AI Agent** (Reasoning):
- Detects "Shorts" → YouTube Shorts
- Shorts = vertical format → 9:16

**AI Agent**:
> "Dạ! Em sẽ tạo video **Shorts dọc (9:16)** về động lực sống nhé anh.
>
> 📐 Aspect Ratio: 9:16 (1080x1920)
> 🎯 Platform: YouTube Shorts, TikTok, Instagram Reels"

---

## Detection Keywords Reference

| Keywords | Aspect Ratio |
|----------|--------------|
| TikTok, Shorts, Reels, dọc, vertical | **9:16** |
| YouTube, ngang, horizontal | **16:9** |
| Instagram (Feed), vuông, square | **1:1** |
| Instagram Portrait | **4:5** |

---

## Best Practices

1. **Always detect first** before calling video-script-generator
2. **Ask if ambiguous** - Use AskUserQuestion when not clear
3. **Save in script.json** - Ratio goes into metadata
4. **Pass downstream** - All skills read ratio from script.json
5. **No default** - Never assume a ratio if user doesn't specify

---

## Workflow

```
User Request
    ↓
AI Agent detects keywords
    ↓
Clear? → Confirm & proceed
Ambiguous? → AskUserQuestion
    ↓
Pass ratio to video-script-generator (--ratio "9:16")
    ↓
Saved in script.json → metadata.ratio
    ↓
Downstream skills use ratio
```
