# Video Production Workflow - Correct Sequence

## 📋 QUAN TRỌNG: Thứ tự thực hiện

Tài liệu này mô tả **THỨ TỰ CHÍNH XÁC** của workflow để tránh lỗi.

---

## ⚠️ VẤN ĐỀ THƯỜNG GẶP

**❌ SAI:** Chạy `sync` trước khi add sections và scenes
- Sync command CẦN sections/scenes đã tồn tại để update timing
- Chạy sync sớm → Không có gì để sync → Lỗi hoặc kết quả sai

**✅ ĐÚNG:** Add sections → Add scenes → Sync timing
- Tạo cấu trúc trước (sections, scenes với text)
- Sync sau để update timing chính xác

---

## 🎯 WORKFLOW ĐÚNG (8 BƯỚC)

```
┌─────────────────────────────────────────────┐
│ 1. XÁC NHẬN ASPECT RATIO                   │
│    9:16, 16:9, 1:1, 4:5                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. TẠO KỊCH BẢN FULL TEXT                  │
│    • Viết full text (topic → text)          │
│    • Init project (tạo script.json)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ ⭐ CHECKPOINT 1: CONFIRM TEXT               │
│    User review text → OK mới tiếp           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. TẠO GIỌNG ĐỌC                            │
│    3.1: Generate voice (voice.mp3, .json)   │
│    3.2: Update voice info vào script        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. TẠO CẤU TRÚC KỊCH BẢN ⚠️                 │
│    4.1: Add Sections (intro, p1, p2, ...)   │
│    4.2: Add Scenes (scenes cho mỗi section) │
│    4.3: Sync Timing ✅ (SAU 4.1 và 4.2)     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. TÌM TÀI NGUYÊN                           │
│    Download 10 options/scene → downloads/   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. REVIEW MEDIA (Script Planner)            │
│    User xem media + timing                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ ⭐ CHECKPOINT 2: CONFIRM MEDIA              │
│    User confirm OK mới tiếp                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6.5. IMPORT SELECTED RESOURCES              │
│    Chọn best → imports/ → cleanup downloads/│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 7. BUILD TIMELINE                           │
│    video-editor → project.otio               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 8. MỞ REMOTION STUDIO                       │
│    http://localhost:3000                    │
└─────────────────────────────────────────────┘
```

---

## 📝 CHI TIẾT BƯỚC 4 (QUAN TRỌNG!)

**Bước 4 là bước DỄ NHẦM nhất. Phải thực hiện ĐÚNG THỨ TỰ:**

### 4.1: Add Sections (TẠO sections)

**Mục đích:** Tạo sections trong script.json

**Commands:**
```bash
# Tạo text file cho section
node scripts/write-text.js --file "sec_intro.txt" --text "..."

# Add section
python3 script_cli.py add-section \
  --script "public/projects/demo/script.json" \
  --voice "public/projects/demo/voice.json" \
  --id "intro" --name "Giới thiệu" \
  --text "sec_intro.txt" --pace "medium"
```

**Lặp lại cho tất cả sections.**

---

### 4.2: Add Scenes (TẠO scenes)

**Mục đích:** Tạo scenes cho từng section

**Commands:**
```bash
# Tạo scenes definition file
node scripts/write-text.js --file "scenes_intro.json" --text '[
  {"id": "intro_1", "text": "...", "visuals": [...]}
]'

# Add scenes (single section)
python3 script_cli.py add-scenes \
  --script "..." --voice "..." \
  --section "intro" \
  --scenes-file "scenes_intro.json"

# Add scenes (multiple sections - KHUYẾN NGHỊ)
node scripts/add-scenes-batch.js \
  --script "..." --voice "..." \
  --section "intro" "scenes_intro.json" \
  --section "p1" "scenes_p1.json" \
  --section "p2" "scenes_p2.json"
```

---

### 4.3: Sync Timing (UPDATE timing)

**⚠️ BƯỚC NÀY CHỈ CHẠY SAU KHI 4.1 VÀ 4.2 HOÀN TẤT**

**Mục đích:** Update timing chính xác cho sections/scenes đã tạo

**Command:**
```bash
python3 script_cli.py sync \
  --script "public/projects/demo/script.json" \
  --voice "public/projects/demo/voice.json"
```

**Chức năng:**
- ✅ Đọc sections và scenes ĐÃ CÓ
- ✅ Tìm timestamps cho text của từng scene (fuzzy matching)
- ✅ Update startTime, endTime, duration cho scenes
- ✅ Update startTime, endTime, duration cho sections
- ✅ Update total duration

**❌ KHÔNG làm:**
- KHÔNG tạo sections/scenes mới
- KHÔNG tự động chia scenes
- KHÔNG chạy trước khi có sections/scenes

---

## 🔍 KIỂM TRA WORKFLOW ĐÚNG

**Sau Bước 3 (Generate Voice):**
- ✅ Có file `voice.mp3`
- ✅ Có file `voice.json` với timestamps
- ✅ `script.json` có voice info
- ❌ CHƯA có sections
- ❌ CHƯA có scenes

**Sau Bước 4.1 (Add Sections):**
- ✅ `script.json` có `sections[]`
- ✅ Mỗi section có `id`, `name`, `text`
- ⚠️ Timing sections CHƯA chính xác (chỉ sơ bộ)
- ❌ CHƯA có scenes

**Sau Bước 4.2 (Add Scenes):**
- ✅ Mỗi section có `scenes[]`
- ✅ Mỗi scene có `id`, `text`, `visuals`
- ⚠️ Timing scenes CHƯA chính xác (chỉ sơ bộ)

**Sau Bước 4.3 (Sync):**
- ✅ Timing sections CHÍNH XÁC
- ✅ Timing scenes CHÍNH XÁC (khớp với voice)
- ✅ Total duration = voice duration
- ✅ Ready cho bước find resources

---

## 🚨 LỖI THƯỜNG GẶP

### Lỗi 1: "No sections found to sync"
**Nguyên nhân:** Chạy sync trước khi add-section
**Giải pháp:** Chạy add-section trước, sau đó mới sync

### Lỗi 2: "No scenes found in section"
**Nguyên nhân:** Chạy sync sau add-section nhưng trước add-scenes
**Giải pháp:** Chạy add-scenes cho TẤT CẢ sections, sau đó mới sync

### Lỗi 3: Duration mismatch
**Nguyên nhân:** Không chạy sync sau khi add scenes
**Giải pháp:** Luôn chạy sync sau add-scenes để timing chính xác

### Lỗi 4: Terminal hang khi add scenes
**Nguyên nhân:** Dùng heredoc hoặc chạy nhiều add-scenes với `&&`
**Giải pháp:** Dùng `write-text.js` và `add-scenes-batch.js`

---

## ✅ CHECKLIST AGENT

Agent nên kiểm tra trước khi mỗi bước:

**Trước khi Sync (Bước 4.3):**
- [ ] Đã add-section cho TẤT CẢ sections chưa?
- [ ] Đã add-scenes cho TẤT CẢ sections chưa?
- [ ] script.json có sections[] và scenes[] chưa?

**Sau khi Sync:**
- [ ] Tất cả scenes có startTime/endTime chưa?
- [ ] Total duration khớp với voice duration chưa?
- [ ] Kiểm tra script.json có lỗi format không?

**Trước khi Find Resources (Bước 5):**
- [ ] Đã sync timing chưa?
- [ ] Tất cả scenes có duration chính xác chưa?

---

## 📚 TÀI LIỆU LIÊN QUAN

- **SKILL.md**: Full documentation với examples
- **scripts/README.md**: Helper scripts documentation
- **script_cli.py**: CLI reference với all commands

---

## 🎓 BEST PRACTICES

1. **Luôn dùng write-text.js** thay vì heredoc
2. **Luôn dùng add-scenes-batch.js** cho 3+ sections
3. **Luôn sync SAU khi add tất cả sections và scenes**
4. **Kiểm tra script.json** sau mỗi bước quan trọng
5. **Verify timing** trước khi find resources

---

## 🔗 QUICK REFERENCE

```bash
# Bước 4.1: Add Section
node scripts/write-text.js --file "sec_intro.txt" --text "..."
python3 script_cli.py add-section --script "..." --voice "..." --id "intro" --name "Intro" --text "sec_intro.txt"

# Bước 4.2: Add Scenes (batch)
node scripts/write-text.js --file "scenes_intro.json" --text '[...]'
node scripts/add-scenes-batch.js --script "..." --voice "..." --section "intro" "scenes_intro.json" --section "p1" "scenes_p1.json"

# Bước 4.3: Sync
python3 script_cli.py sync --script "..." --voice "..."
```

---

**Ghi nhớ:** ADD FIRST, SYNC LAST! 🎯
