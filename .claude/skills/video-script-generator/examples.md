# VIDEO SCRIPT GENERATOR - EXAMPLES

## Example 1: FACTS Video (60s)

### User Request:
```
Topic: "Tại sao bạn luôn thấy mệt dù ngủ đủ 8 tiếng?"
Type: facts
Duration: 60s
```

### Generated JSON:

```json
{
  "metadata": {
    "projectName": "Tại sao bạn luôn thấy mệt dù ngủ đủ 8 tiếng?",
    "videoType": "facts",
    "duration": 60,
    "ratio": "9:16",
    "targetAudience": "General",
    "platform": "shorts",
    "createdAt": "2025-01-24T10:30:00Z",
    "version": "1.0"
  },
  "script": {
    "fullText": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt như chưa ngủ? Không phải tại bạn lười. Khoa học giải thích rồi. Giấc ngủ không chỉ tính bằng số giờ. Nó tính bằng chu kỳ. Mỗi chu kỳ khoảng 90 phút. Nếu bạn thức dậy giữa chu kỳ, não bạn đang ở trạng thái ngủ sâu. Bị kéo ra đột ngột = mệt mỏi, uể oải cả ngày. Thay vì ngủ 8 tiếng, hãy ngủ theo bội số của 90 phút. 6 tiếng hoặc 7 tiếng rưỡi sẽ tốt hơn 8 tiếng. Thử tối nay xem. Follow để biết thêm mẹo ngủ ngon mà không ai dạy bạn ở trường.",
    "wordCount": 142,
    "estimatedDuration": 58,
    "readingSpeed": 142
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt như chưa ngủ?",
      "voiceNotes": "Đọc chậm, nhấn mạnh, tạo suspense",
      "visualSuggestion": {
        "type": "stock",
        "query": "tired waking up morning bed",
        "style": "zoom-in"
      }
    },
    {
      "id": "problem",
      "startTime": 5,
      "duration": 15,
      "text": "Không phải tại bạn lười. Khoa học giải thích rồi. Giấc ngủ không chỉ tính bằng số giờ. Nó tính bằng chu kỳ. Mỗi chu kỳ khoảng 90 phút.",
      "voiceNotes": "Tone đồng cảm, relatable",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "sleep cycle brain waves illustration, blue purple gradient, minimal style, dark background --ar 9:16",
        "style": "ken-burns"
      }
    },
    {
      "id": "insight",
      "startTime": 20,
      "duration": 15,
      "text": "Nếu bạn thức dậy giữa chu kỳ, não bạn đang ở trạng thái ngủ sâu. Bị kéo ra đột ngột = mệt mỏi, uể oải cả ngày.",
      "voiceNotes": "Explain rõ ràng, moderate pace",
      "visualSuggestion": {
        "type": "stock",
        "query": "alarm clock ringing morning",
        "style": "zoom-in"
      }
    },
    {
      "id": "solution",
      "startTime": 35,
      "duration": 15,
      "text": "Thay vì ngủ 8 tiếng, hãy ngủ theo bội số của 90 phút. 6 tiếng hoặc 7 tiếng rưỡi sẽ tốt hơn 8 tiếng. Thử tối nay xem.",
      "voiceNotes": "Energetic, confident tone",
      "visualSuggestion": {
        "type": "stock",
        "query": "refreshed morning wake up stretch",
        "style": "fade"
      }
    },
    {
      "id": "cta",
      "startTime": 50,
      "duration": 10,
      "text": "Follow để biết thêm mẹo ngủ ngon mà không ai dạy bạn ở trường.",
      "voiceNotes": "Clear, direct, không rush",
      "visualSuggestion": {
        "type": "stock",
        "query": "peaceful sleep bedroom",
        "style": "fade"
      }
    }
  ],
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "vietnamese-male-professional",
    "speed": 1.0,
    "notes": "Male voice, professional tone, clear enunciation"
  },
  "music": {
    "mood": "calm",
    "volume": 0.15,
    "fadeIn": 2,
    "fadeOut": 3,
    "suggestions": ["ambient-calm-1", "minimal-background-2"]
  },
  "subtitle": {
    "enabled": true,
    "style": "highlight-word",
    "position": "center",
    "font": "Montserrat",
    "fontSize": 48,
    "highlightColor": "#FFD700",
    "backgroundColor": "transparent",
    "outline": true,
    "outlineColor": "#000000",
    "outlineWidth": 2
  },
  "qualityMetrics": {
    "hookStrength": 8.5,
    "pacingScore": 9.0,
    "engagementPotential": "high",
    "suggestions": [
      "Hook mạnh với câu hỏi relatable",
      "Pacing tốt, balanced",
      "Có thể thêm 1 số liệu vào hook để mạnh hơn"
    ]
  }
}
```

---

## Example 2: LISTICLE Video (60s)

### User Request:
```
Topic: "5 thói quen buổi sáng của người thành công"
Type: listicle
Duration: 60s
Target Audience: "Dân văn phòng 25-35 tuổi"
```

### Generated JSON:

```json
{
  "metadata": {
    "projectName": "5 thói quen buổi sáng của người thành công",
    "videoType": "listicle",
    "duration": 60,
    "ratio": "9:16",
    "targetAudience": "Dân văn phòng 25-35 tuổi",
    "platform": "shorts",
    "createdAt": "2025-01-24T10:35:00Z",
    "version": "1.0"
  },
  "script": {
    "fullText": "Người thành công không có nhiều thời gian hơn bạn. Họ chỉ biết cách dùng nó. Số 1: Dậy sớm trước 6h. Não bộ hoạt động tốt nhất trong 2 tiếng đầu sau khi thức dậy. Số 2: Không check điện thoại ngay. 30 phút đầu tiên quyết định mood cả ngày. Số 3: Tập thể dục 15 phút. Không cần gym, chỉ cần di chuyển cơ thể. Số 4: Ăn sáng có protein. Protein giúp tỉnh táo, không buồn ngủ sau ăn. Số 5: Viết 3 việc quan trọng nhất. Không phải to-do list dài, chỉ 3 việc thôi. Bạn đã có thói quen nào? Comment cho mình biết!",
    "wordCount": 148,
    "estimatedDuration": 59,
    "readingSpeed": 148
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Người thành công không có nhiều thời gian hơn bạn. Họ chỉ biết cách dùng nó.",
      "voiceNotes": "Đọc chậm, nhấn mạnh, tạo suspense",
      "visualSuggestion": {
        "type": "stock",
        "query": "successful businessman morning routine",
        "style": "zoom-in"
      }
    },
    {
      "id": "item1",
      "startTime": 5,
      "duration": 10,
      "text": "Số 1: Dậy sớm trước 6h. Não bộ hoạt động tốt nhất trong 2 tiếng đầu sau khi thức dậy.",
      "voiceNotes": "Consistent pace, số thứ tự rõ ràng",
      "visualSuggestion": {
        "type": "stock",
        "query": "sunrise early morning 6am",
        "style": "ken-burns"
      }
    },
    {
      "id": "item2",
      "startTime": 15,
      "duration": 10,
      "text": "Số 2: Không check điện thoại ngay. 30 phút đầu tiên quyết định mood cả ngày.",
      "voiceNotes": "Consistent pace, số thứ tự rõ ràng",
      "visualSuggestion": {
        "type": "stock",
        "query": "phone alarm ignore morning",
        "style": "fade"
      }
    },
    {
      "id": "item3",
      "startTime": 25,
      "duration": 10,
      "text": "Số 3: Tập thể dục 15 phút. Không cần gym, chỉ cần di chuyển cơ thể.",
      "voiceNotes": "Consistent pace, số thứ tự rõ ràng",
      "visualSuggestion": {
        "type": "stock",
        "query": "morning exercise stretching home",
        "style": "zoom-in"
      }
    },
    {
      "id": "item4",
      "startTime": 35,
      "duration": 10,
      "text": "Số 4: Ăn sáng có protein. Protein giúp tỉnh táo, không buồn ngủ sau ăn.",
      "voiceNotes": "Consistent pace, số thứ tự rõ ràng",
      "visualSuggestion": {
        "type": "stock",
        "query": "healthy breakfast protein eggs",
        "style": "fade"
      }
    },
    {
      "id": "item5",
      "startTime": 45,
      "duration": 10,
      "text": "Số 5: Viết 3 việc quan trọng nhất. Không phải to-do list dài, chỉ 3 việc thôi.",
      "voiceNotes": "Consistent pace, số thứ tự rõ ràng",
      "visualSuggestion": {
        "type": "stock",
        "query": "writing notebook planning morning",
        "style": "ken-burns"
      }
    },
    {
      "id": "cta",
      "startTime": 55,
      "duration": 5,
      "text": "Bạn đã có thói quen nào? Comment cho mình biết!",
      "voiceNotes": "Clear, direct, không rush",
      "visualSuggestion": {
        "type": "stock",
        "query": "comment subscribe engage",
        "style": "fade"
      }
    }
  ],
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "vietnamese-male-energetic",
    "speed": 1.05,
    "notes": "Energetic male voice, upbeat tone"
  },
  "music": {
    "mood": "upbeat",
    "volume": 0.15,
    "fadeIn": 1,
    "fadeOut": 2,
    "suggestions": ["upbeat-corporate-1", "energetic-pop-2"]
  },
  "subtitle": {
    "enabled": true,
    "style": "karaoke",
    "position": "center",
    "font": "Poppins",
    "fontSize": 52,
    "highlightColor": "#FF6B6B",
    "backgroundColor": "rgba(0,0,0,0.7)",
    "outline": false
  },
  "qualityMetrics": {
    "hookStrength": 7.5,
    "pacingScore": 9.5,
    "engagementPotential": "high",
    "suggestions": [
      "Hook tốt nhưng có thể thêm số liệu",
      "Pacing xuất sắc, items đều nhau",
      "CTA engaging với call to comment"
    ]
  }
}
```

---

## Example 3: MOTIVATION Video (60s)

### User Request:
```
Topic: "Câu nói của Steve Jobs về đam mê"
Type: motivation
Duration: 60s
```

### Shortened JSON (key parts):

```json
{
  "metadata": {
    "videoType": "motivation",
    "duration": 60
  },
  "scenes": [
    {
      "id": "quote",
      "duration": 10,
      "text": "\"The only way to do great work is to love what you do.\" - Steve Jobs",
      "voiceNotes": "Dramatic, có pause sau quote"
    },
    {
      "id": "story",
      "duration": 20,
      "text": "Steve Jobs bị sa thải khỏi Apple năm 1985..."
    },
    {
      "id": "lesson",
      "duration": 20,
      "text": "Đam mê không phải là thứ bạn tìm thấy. Nó là thứ bạn xây dựng..."
    },
    {
      "id": "cta",
      "duration": 10,
      "text": "Save video này nếu bạn đang tìm động lực. Follow để xem thêm."
    }
  ],
  "voice": {
    "voiceId": "vietnamese-male-deep",
    "speed": 0.95,
    "notes": "Deep male voice, dramatic tone, slower pace"
  },
  "music": {
    "mood": "epic",
    "volume": 0.20,
    "suggestions": ["epic-cinematic-1", "motivational-strings-2"]
  },
  "subtitle": {
    "style": "minimal",
    "font": "Playfair Display",
    "fontSize": 56
  }
}
```

---

## How to Use These Examples

### In Claude Code:
```bash
# Copy example to working directory
cp examples/facts-video.json my-script.json

# Or generate new one with Python
python utils/json_builder.py --type facts --topic "Your topic here"
```

### In Antigravity:
```
User: "Generate script JSON for [topic]"
Claude: [Uses templates from examples, outputs JSON]
User: "Save this"
Claude: [Saves to user's workspace]
```

### Iteration:
```
User: "Hook quá dài, rút ngắn"
Claude: [Updates hook in JSON, re-balances timing]

User: "Thêm số liệu vào hook"
Claude: [Adds statistic, updates hook strength score]
```
