# SHORT-60S EXAMPLES

## Example 1: Facts Video - "Bí mật giấc ngủ"

### Prompt tạo script

```
Tạo script video short 60s về: "Tại sao bạn ngủ đủ 8 tiếng mà vẫn mệt?"

Yêu cầu:
- Video type: facts
- Platform: tiktok
- Target audience: Người đi làm 25-35 tuổi
- Tone: professional
- Ngôn ngữ: Tiếng Việt

Hook phải gây tò mò ngay 3 giây đầu với câu hỏi hoặc số liệu shocking.
```

### Script output mẫu

```json
{
  "metadata": {
    "projectName": "bi-mat-giac-ngu",
    "videoType": "facts",
    "duration": 60,
    "ratio": "9:16"
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt rã rời?",
      "visualSuggestion": {
        "type": "stock",
        "query": "tired person alarm clock morning frustrated",
        "style": "zoom-in",
        "transition": "cut"
      }
    },
    {
      "id": "problem",
      "startTime": 5,
      "duration": 12,
      "text": "Vấn đề không nằm ở thời gian ngủ. 90% người đang ngủ SAI cách mà không biết.",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "brain waves sleep cycle scientific diagram, blue glow, dark background --ar 9:16",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "insight",
      "startTime": 17,
      "duration": 15,
      "text": "Giấc ngủ chia thành chu kỳ 90 phút. Thức dậy giữa chu kỳ khiến não bạn bị 'lag' cả ngày, dù ngủ đủ giờ.",
      "visualSuggestion": {
        "type": "stock",
        "query": "sleep cycle infographic person sleeping",
        "style": "zoom-out",
        "transition": "crossfade"
      }
    },
    {
      "id": "solution",
      "startTime": 32,
      "duration": 18,
      "text": "Cách fix đơn giản: Tính ngược từ giờ thức dậy. Muốn dậy 6h sáng? Ngủ lúc 10h30 hoặc 12h đêm. Đúng bội số 90 phút.",
      "visualSuggestion": {
        "type": "stock",
        "query": "person sleeping peacefully cozy bedroom soft light",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "cta",
      "startTime": 50,
      "duration": 10,
      "text": "Follow để xem thêm mẹo ngủ ngon. Comment giờ ngủ của bạn để tôi tính giúp!",
      "visualSuggestion": {
        "type": "stock",
        "query": "happy morning person stretching sunshine",
        "style": "zoom-in",
        "transition": "dissolve"
      }
    }
  ],
  "voice": {
    "provider": "gemini",
    "voiceId": "Charon",
    "styleInstruction": "Trầm – ấm – chậm – rất đời"
  },
  "music": {
    "query": "ambient calm peaceful night",
    "mood": "calm",
    "volume": 0.12
  },
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#4ECDC4"
  }
}
```

---

## Example 2: Listicle Video - "5 sai lầm học tiếng Anh"

### Prompt tạo script

```
Tạo script video short 60s về: "5 sai lầm khi học tiếng Anh mà người Việt hay mắc"

Yêu cầu:
- Video type: listicle
- Platform: tiktok
- Target audience: Học sinh, sinh viên, người đi làm muốn cải thiện tiếng Anh
- Tone: energetic
- Ngôn ngữ: Tiếng Việt

Mỗi item ngắn gọn, dễ nhớ. Hook bằng số liệu shocking.
```

### Script output mẫu

```json
{
  "metadata": {
    "projectName": "5-sai-lam-hoc-tieng-anh",
    "videoType": "listicle",
    "duration": 60,
    "ratio": "9:16"
  },
  "scenes": [
    {
      "id": "hook",
      "startTime": 0,
      "duration": 5,
      "text": "Học tiếng Anh 10 năm vẫn không nói được? Đây là 5 sai lầm bạn đang mắc!",
      "visualSuggestion": {
        "type": "stock",
        "query": "frustrated student studying english confused",
        "style": "zoom-in",
        "transition": "cut"
      }
    },
    {
      "id": "item1",
      "startTime": 5,
      "duration": 10,
      "text": "Số 1: Chỉ học ngữ pháp. Ngữ pháp quan trọng, nhưng không ai giao tiếp bằng công thức!",
      "visualSuggestion": {
        "type": "stock",
        "query": "grammar book boring studying alone",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "item2",
      "startTime": 15,
      "duration": 10,
      "text": "Số 2: Sợ nói sai. Người bản xứ không care ngữ pháp của bạn, họ care bạn có hiểu không!",
      "visualSuggestion": {
        "type": "stock",
        "query": "shy person afraid speaking anxiety",
        "style": "zoom-out",
        "transition": "crossfade"
      }
    },
    {
      "id": "item3",
      "startTime": 25,
      "duration": 10,
      "text": "Số 3: Học từ vựng riêng lẻ. Học 'apple' thì quên. Học 'I eat an apple' thì nhớ mãi!",
      "visualSuggestion": {
        "type": "stock",
        "query": "vocabulary flashcards memorizing words",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "item4",
      "startTime": 35,
      "duration": 10,
      "text": "Số 4: Không nghe tiếng Anh thật. Nghe thầy cô đọc chậm ≠ nghe phim Netflix!",
      "visualSuggestion": {
        "type": "stock",
        "query": "person watching movie headphones english",
        "style": "zoom-in",
        "transition": "crossfade"
      }
    },
    {
      "id": "item5",
      "startTime": 45,
      "duration": 10,
      "text": "Số 5: Không practice daily. 10 phút mỗi ngày tốt hơn 2 tiếng cuối tuần!",
      "visualSuggestion": {
        "type": "stock",
        "query": "person practicing english daily routine speaking",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "cta",
      "startTime": 55,
      "duration": 5,
      "text": "Follow để xem cách fix từng lỗi nhé!",
      "visualSuggestion": {
        "type": "stock",
        "query": "confident person speaking english success",
        "style": "zoom-in",
        "transition": "dissolve"
      }
    }
  ],
  "voice": {
    "provider": "gemini",
    "voiceId": "Puck",
    "styleInstruction": "Sôi động – trẻ trung – năng lượng cao"
  },
  "music": {
    "query": "upbeat energetic corporate positive",
    "mood": "energetic",
    "volume": 0.15
  },
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#FFD700"
  }
}
```

---

## Example 3: Motivation Video - "Thất bại không đáng sợ"

### Prompt tạo script

```
Tạo script video short 60s về: "Thất bại không đáng sợ, sợ thất bại mới đáng sợ"

Yêu cầu:
- Video type: motivation
- Platform: tiktok
- Target audience: Người trẻ đang gặp khó khăn
- Tone: dramatic, inspiring
- Ngôn ngữ: Tiếng Việt

Bắt đầu bằng quote mạnh. Kể câu chuyện ngắn. Kết thúc truyền cảm hứng.
```

### Script output mẫu

```json
{
  "metadata": {
    "projectName": "that-bai-khong-dang-so",
    "videoType": "motivation",
    "duration": 60,
    "ratio": "9:16"
  },
  "scenes": [
    {
      "id": "quote",
      "startTime": 0,
      "duration": 10,
      "text": "\"Tôi không sợ thất bại. Tôi sợ không dám thử.\" Jack Ma nói câu này khi bị từ chối 30 lần.",
      "voiceNotes": "Đọc chậm, nhấn mạnh",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "silhouette person standing on mountain top, sunrise, cinematic, inspirational --ar 9:16",
        "style": "ken-burns",
        "transition": "cut"
      }
    },
    {
      "id": "story",
      "startTime": 10,
      "duration": 20,
      "text": "Năm 1999, Jack Ma bị từ chối bởi Harvard 10 lần. Bị 30 công ty từ chối. KFC tuyển 24 người, chỉ có Jack bị loại. Nhưng ông không từ bỏ.",
      "visualSuggestion": {
        "type": "stock",
        "query": "person rejected failure disappointed but determined",
        "style": "zoom-out",
        "transition": "crossfade"
      }
    },
    {
      "id": "lesson",
      "startTime": 30,
      "duration": 20,
      "text": "Hôm nay, Alibaba là công ty trị giá 500 tỷ đô. Mỗi lần bị từ chối là một bài học. Mỗi thất bại là một bước gần hơn đến thành công.",
      "visualSuggestion": {
        "type": "stock",
        "query": "success achievement celebration business growth",
        "style": "zoom-in",
        "transition": "crossfade"
      }
    },
    {
      "id": "cta",
      "startTime": 50,
      "duration": 10,
      "text": "Bạn đang sợ điều gì? Comment bên dưới. Đừng để nỗi sợ viết lên câu chuyện của bạn.",
      "voiceNotes": "Chậm, chân thành, nhìn vào camera (nếu có)",
      "visualSuggestion": {
        "type": "ai-generated",
        "query": "person walking towards light at end of tunnel, hope, cinematic --ar 9:16",
        "style": "ken-burns",
        "transition": "dissolve"
      }
    }
  ],
  "voice": {
    "provider": "gemini",
    "voiceId": "Aoede",
    "styleInstruction": "Cảm xúc – sâu lắng – truyền cảm hứng"
  },
  "music": {
    "query": "cinematic inspiring emotional piano",
    "mood": "uplifting",
    "volume": 0.18
  },
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#E74C3C"
  }
}
```

---

## Example 4: Story Video - "Bài học từ người lạ"

### Prompt tạo script

```
Tạo script video short 60s về: "Bài học đắt giá từ người lạ trên xe bus"

Yêu cầu:
- Video type: story
- Platform: tiktok
- Target audience: Mọi người
- Tone: dramatic, heartwarming
- Ngôn ngữ: Tiếng Việt

Hook bằng spoiler. Build tension. Twist ở cuối.
```

### Script output mẫu

```json
{
  "metadata": {
    "projectName": "bai-hoc-nguoi-la",
    "videoType": "story",
    "duration": 60,
    "ratio": "9:16"
  },
  "scenes": [
    {
      "id": "spoiler_hook",
      "startTime": 0,
      "duration": 5,
      "text": "Một người lạ trên xe bus nói một câu khiến tôi khóc giữa đường.",
      "visualSuggestion": {
        "type": "stock",
        "query": "person sitting bus thinking emotional",
        "style": "zoom-in",
        "transition": "cut"
      }
    },
    {
      "id": "setup",
      "startTime": 5,
      "duration": 15,
      "text": "Hôm đó tôi vừa bị sếp mắng. Vừa biết bạn thân nói xấu sau lưng. Tôi ngồi xe bus, cố kìm nước mắt.",
      "visualSuggestion": {
        "type": "stock",
        "query": "sad person public transport looking window rain",
        "style": "ken-burns",
        "transition": "crossfade"
      }
    },
    {
      "id": "build_tension",
      "startTime": 20,
      "duration": 20,
      "text": "Một cụ già ngồi cạnh. Bà nhìn tôi một lúc rồi hỏi: 'Cháu ơi, cháu đang nghĩ gì mà buồn vậy?' Tôi không trả lời, chỉ cúi đầu.",
      "visualSuggestion": {
        "type": "stock",
        "query": "elderly woman kind face public transport",
        "style": "zoom-out",
        "transition": "crossfade"
      }
    },
    {
      "id": "climax",
      "startTime": 40,
      "duration": 15,
      "text": "Bà nắm tay tôi, nói nhẹ: 'Bà 80 tuổi rồi. Những thứ cháu đang khóc bây giờ, bà đã quên từ lâu. Đừng giữ nỗi buồn của hôm nay vào ngày mai.'",
      "visualSuggestion": {
        "type": "stock",
        "query": "elderly hand holding young hand comfort kindness",
        "style": "zoom-in",
        "transition": "crossfade"
      }
    },
    {
      "id": "cta",
      "startTime": 55,
      "duration": 5,
      "text": "Câu nói đó, tôi nhớ mãi. Và bạn cũng nên nhớ.",
      "visualSuggestion": {
        "type": "stock",
        "query": "sunrise hope new beginning peaceful",
        "style": "ken-burns",
        "transition": "dissolve"
      }
    }
  ],
  "voice": {
    "provider": "gemini",
    "voiceId": "Aoede",
    "styleInstruction": "Kể chuyện – nhẹ nhàng – cảm xúc"
  },
  "music": {
    "query": "emotional storytelling piano soft",
    "mood": "sad",
    "volume": 0.15
  },
  "subtitle": {
    "style": "highlight-word",
    "highlightColor": "#9B59B6"
  }
}
```

---

## Transition & Effect Cheat Sheet

| Scene Type | Effect | Transition | Lý do |
|------------|--------|------------|-------|
| Hook | zoom-in | cut | Tạo impact ngay lập tức |
| Problem/Setup | ken-burns | crossfade | Smooth, không distract |
| Insight/Build | zoom-out | crossfade | Reveal, mở rộng |
| Solution/Climax | zoom-in | crossfade | Focus, nhấn mạnh |
| CTA | zoom-in | dissolve | Ending mượt, CTA rõ |

## Highlight Color Cheat Sheet

| Video Type | Color | Hex | Lý do |
|------------|-------|-----|-------|
| Facts/Edu | Turquoise | #4ECDC4 | Trust, knowledge |
| Listicle | Gold | #FFD700 | Energy, attention |
| Motivation | Red | #E74C3C | Passion, emotion |
| Story | Purple | #9B59B6 | Mystery, depth |
