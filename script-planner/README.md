# Script Planner

> **Công cụ quản lý và chỉnh sửa kịch bản video tự động với giao diện trực quan**

Script Planner là một ứng dụng web độc lập giúp bạn quản lý, xem và chỉnh sửa các kịch bản video được tạo tự động. Ứng dụng tích hợp trình phát audio, hiển thị waveform và cho phép chỉnh sửa nội dung theo thời gian thực.

---

## 🎯 Nhu Cầu

### Vấn Đề
Khi tạo video tự động với AI, việc quản lý và chỉnh sửa kịch bản (script.json) gặp nhiều khó khăn:
- **Khó đọc**: File JSON phức tạp với nhiều sections, scenes, timestamps
- **Khó chỉnh sửa**: Phải edit JSON thủ công, dễ sai format
- **Không trực quan**: Không thấy được audio waveform và timing
- **Thiếu context**: Không biết đang ở section nào khi scroll

### Giải Pháp
Script Planner cung cấp:
- ✅ **Giao diện trực quan** để xem và edit kịch bản
- ✅ **Audio player tích hợp** với waveform thật
- ✅ **Sticky section headers** để luôn biết vị trí hiện tại
- ✅ **Play từng scene** để kiểm tra timing chính xác
- ✅ **Search & filter** projects nhanh chóng
- ✅ **Auto-sync** với thư mục projects gốc

---

## 🏗️ Kiến Trúc Dự Án

### Cấu Trúc Thư Mục
```
automation-video/
├── public/
│   ├── projects/              # Thư mục chứa tất cả projects
│   │   ├── nguoi-que/
│   │   │   ├── script.json    # Kịch bản chi tiết
│   │   │   ├── voice.mp3      # Audio đã generate
│   │   │   └── downloads/     # Media resources
│   │   └── sample-project/
│   └── projects-list.json     # Danh sách projects (auto-generated)
├── script-planner/            # Ứng dụng Script Planner (Vite + React)
│   ├── src/
│   │   ├── App.tsx           # Component chính
│   │   └── index.css         # Tailwind CSS v4
│   ├── vite.config.ts        # Config để serve từ ../public
│   └── package.json
└── scripts/
    └── generate-project-list.js  # Script tự động scan projects
```

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (CSS-first config)
- **Audio**: WaveSurfer.js
- **Icons**: Material Symbols

---

## 📋 Đặc Tả Chức Năng

### 1. Project Listing (Trang Chủ)
**Mục đích**: Hiển thị danh sách tất cả projects để chọn

**Tính năng**:
- Auto-discover tất cả projects trong `public/projects/`
- Hiển thị metadata: tên, thời gian cập nhật, duration
- Sắp xếp theo thời gian (mới nhất lên đầu)
- Search/filter theo tên project
- Sticky session: Tự động mở lại project cuối cùng

**UI Components**:
- Search box với icon và clear button
- Project cards với hover effects
- Loading state
- Empty states (no projects, no search results)

### 2. Script Editor (Trang Chính)
**Mục đích**: Xem và chỉnh sửa kịch bản video

**Tính năng**:
- **Header**:
  - Back button → Về trang listing
  - Project title (editable)
  - Voice provider info
  - Save button
  
- **Audio Player Bar**:
  - Play/Pause button
  - Waveform visualization (WaveSurfer.js)
  - Time display (current / total)
  - Seek by clicking waveform

- **Content Area**:
  - **Sections** (sticky headers):
    - Section title (editable)
    - Time range (MM:SS - MM:SS)
    - Auto-stick khi scroll
  
  - **Scenes** (trong mỗi section):
    - Scene number
    - Play button → Nhảy đến timestamp và play
    - Scene title (editable)
    - Time range
    - Voice text (collapsible)
    - Voice notes (nếu có)
    - Visual description (editable textarea)
    - Visual suggestion (type, query, style)
    - Media preview (image/video thumbnail)

### 3. Data Schema

**Script.json Structure** (Schema v2.0):
```json
{
  "metadata": {
    "schemaVersion": "2.0",
    "projectName": "Tên Project",
    "aspectRatio": "16:9",
    "totalDuration": 62.77,
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  },
  "sections": [
    {
      "id": "section-id",
      "name": "Tên Section",
      "startTime": 0.0,
      "endTime": 10.0,
      "duration": 10.0,
      "pace": "slow|medium|fast",
      "scenes": [
        {
          "id": "scene-id",
          "startTime": 0.0,
          "endTime": 5.0,
          "duration": 5.0,
          "text": "Nội dung voice",
          "voiceNotes": "Ghi chú cho voice actor",
          "visualDescription": "Mô tả visual",
          "visualSuggestion": {
            "type": "stock|generated|pinned",
            "query": "search query",
            "style": "fade|zoom|slide"
          },
          "resourceCandidates": [
            {
              "id": "resource-id",
              "type": "image|video",
              "source": "pexels|pixabay|gemini-ai",
              "localPath": "downloads/...",
              "width": 1920,
              "height": 1080
            }
          ],
          "selectedResourceIds": ["resource-id"]
        }
      ]
    }
  ],
  "voice": {
    "provider": "gemini|elevenlabs|openai",
    "voiceId": "voice-id",
    "voiceName": "Voice Name",
    "audioPath": "voice.mp3"
  },
  "music": {
    "enabled": true,
    "trackPath": "audio/background.mp3",
    "volume": 0.2
  },
  "subtitle": {
    "enabled": true,
    "style": "modern",
    "position": "bottom"
  }
}
```

---

## 🚀 Cài Đặt & Sử Dụng

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation
```bash
# Clone repo
git clone <repo-url>
cd automation-video

# Install dependencies cho root project
npm install

# Install dependencies cho script-planner
cd script-planner
npm install
cd ..
```

### Development
```bash
# Start Script Planner
npm run plan

# Tự động chạy:
# 1. Generate projects list
# 2. Start Vite dev server tại http://localhost:3001
```

### Workflow
1. **Tạo project mới** trong `public/projects/your-project/`
2. **Tạo script.json** theo schema v2.0
3. **Generate audio** (voice.mp3 hoặc speech.mp3)
4. **Mở Script Planner**: `npm run plan`
5. **Chọn project** từ danh sách
6. **Edit & Save** kịch bản

---

## 🎨 Design Principles

### UI/UX
- **Modern & Clean**: Sử dụng Tailwind CSS với custom theme
- **Responsive**: Hoạt động tốt trên nhiều kích thước màn hình
- **Accessible**: Icons rõ ràng, contrast tốt
- **Performant**: Lazy loading, optimized rendering

### Code Quality
- **TypeScript**: Type-safe, dễ maintain
- **Component-based**: React functional components
- **Single Source of Truth**: `public/projects/` là nguồn dữ liệu duy nhất
- **Auto-sync**: Không cần copy/paste files

---

## 🔧 Configuration

### Vite Config
```typescript
// script-planner/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: { port: 3001 },
  publicDir: path.resolve(__dirname, '../public'), // Serve từ root public
})
```

### Tailwind CSS v4
```css
/* script-planner/src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #13a4ec;
  --font-sans: "Inter", sans-serif;
}
```

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run plan` | Start Script Planner dev server |
| `node scripts/generate-project-list.js` | Generate projects list manually |

---

## 🐛 Troubleshooting

### Projects không hiển thị
1. Kiểm tra `public/projects-list.json` có tồn tại không
2. Chạy `node scripts/generate-project-list.js`
3. Refresh browser

### Audio không load
1. Kiểm tra file audio tồn tại: `public/projects/[project]/voice.mp3`
2. Kiểm tra `script.json` có field `voice.audioPath`
3. Mở Console (F12) để xem lỗi

### Sticky headers không hoạt động
1. Clear browser cache
2. Hard refresh: `Cmd+Shift+R` (Mac) hoặc `Ctrl+Shift+R` (Windows)

---

## 🤝 Contributing

### Adding New Features
1. Fork repo
2. Create feature branch
3. Implement & test
4. Submit PR

### Code Style
- Use TypeScript
- Follow existing patterns
- Add comments for complex logic
- Update README if needed

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Credits

- **WaveSurfer.js**: Audio waveform visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool
- **Material Symbols**: Icon library

---

**Made with ❤️ for efficient video script management**
