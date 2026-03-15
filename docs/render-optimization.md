# Render Optimization — Vibedio

Tài liệu này ghi lại toàn bộ các vấn đề được phát hiện và tối ưu được thực hiện để tăng tốc render video trong dự án Vibedio (Remotion 4.0.414).

---

## 1. Vấn đề gốc

Render video ban đầu chạy nhanh ở phần đầu nhưng **rất chậm và treo** về cuối. Sau khi điều tra, có nhiều nguyên nhân xếp chồng nhau:

| # | Vấn đề | Hậu quả |
|---|--------|---------|
| 1 | Stock photo giải phẩu quá lớn (8192×5464px) | Chrome OOM, delayRender timeout 88s |
| 2 | Preload toàn bộ ảnh trong lúc render | Tắc nghẽn HTTP connection pool |
| 3 | Blur background dùng 2× `<Img>` trên mỗi clip | Gấp đôi delayRender calls trong transition |
| 4 | Tài nguyên HTTP remote trong OTIO | Mỗi frame phải fetch từ CDN |
| 5 | 1GB video candidate không dùng trong `public/` | Remotion copy toàn bộ vào bundle mỗi lần render |
| 6 | Composition ID sai trong `package.json` | Build script không tìm được composition |
| 7 | Per-frame `console.log` | Overhead nhỏ nhưng tích lũy theo 5000+ frames |
| 8 | Polling mỗi 2s chạy cả trong lúc render | Gửi fetch request không cần thiết |
| 9 | `delayRender` timeout quá ngắn (28s default) | Timeout giả ngay cả khi tải chậm |

---

## 2. Chi tiết từng fix

### 2.1 Ảnh stock photo giải phẩu khổng lồ (nguyên nhân chính)

**File:** `public/projects/<project>/imports/images/`

**Vấn đề:**
Pexels/Unsplash stock photo có thể có độ phân giải rất cao. Ví dụ:

```
intro-2_selected_unknown_20870805.jpg   8192×5464px  → 134 MB RAM khi decode
way2-1_selected_unknown_18068462.jpg    7104×4000px  →  81 MB RAM khi decode
vibe-coding-2_selected_unknown...jpg    5900×4200px  →  70 MB RAM khi decode
```

Với hệ thống chỉ có **63 MB RAM free**, Chromium headless không thể decode ảnh 134MB → delayRender treo 88 giây → timeout.

**Fix:**
Dùng `sips` (macOS built-in) để resize tất cả ảnh > 1920px về max 1920px trước khi render.

```bash
sips --resampleHeightWidthMax 1920 "image.jpg" --out "image.jpg"
```

**Kết quả:** `intro-2...jpg` từ 8192×5464 (134MB) → 1920×1280 (7MB). Load time từ 88s timeout → **70ms**.

---

### 2.2 Preload can thiệp vào `<Img>` delayRender

**File:** `src/compositions/OtioPlayer.tsx`

**Vấn đề:**
`@remotion/preload` tạo `<link rel="preload">` cho **tất cả ảnh/video** ngay khi timeline load. Khi có 28+ ảnh được preload đồng thời, HTTP connection pool (max 6 concurrent per host) bị nghẽn. Khi `<Img>` component cần load ảnh mới tại frame 94, request phải xếp hàng sau các preload request đang chờ → timeout.

Hiện tượng đặc biệt: render **1 frame duy nhất** (frame 94) thành công ngay, nhưng render frame 93 → 94 liên tiếp lại treo tại frame 94, vì các preload từ frame đầu vẫn còn đang pending.

**Fix:**
```ts
useEffect(() => {
    if (!activeTimeline) return;
    if (isRendering) return; // ← Thêm dòng này
    // ... preload logic
}, [activeTimeline, projectId, isRendering]);
```

Preload chỉ chạy trong **Remotion Studio** (preview), không chạy khi render headless.

---

### 2.3 Blur background tạo 2× `<Img>` mỗi clip ảnh

**File:** `src/components/effects/ImageWithEffect.tsx`

**Vấn đề:**
Trong vertical mode (9:16), `ImageWithEffect` render **2 `<Img>`** trên cùng 1 ảnh:
- Layer 1: background blur (đồng nhất, decorative)
- Layer 2: foreground chính

Khi có SMPTE_Dissolve transition giữa 2 clip ảnh: **4 `<Img>` delayRender** đồng thời → gấp đôi memory và connection pressure.

**Fix:**
Trong lúc render (headless), bỏ blur background layer, thay bằng `<div style={{backgroundColor: '#000'}}>`:

```tsx
const isRendering = getRemotionEnvironment().isRendering;

// Background layer
{!isRendering && <Img src={src} style={{filter: 'blur(30px)'}} ... />}
{isRendering && <div style={{backgroundColor: '#000'}} />}

// Foreground layer (luôn render)
<Img src={src} ... />
```

Tương tự áp dụng cho vertical video trong `OtioPlayer.tsx`.

---

### 2.4 Tài nguyên HTTP remote trong OTIO

**File:** `public/projects/<project>/project.otio` + `scripts/pre-render-download.js`

**Vấn đề:**
OTIO có thể chứa URL remote (Pexels CDN, v.v.). Mỗi frame render phải fetch từ internet → không ổn định, phụ thuộc mạng, chậm.

**Fix:**
Tạo script `scripts/pre-render-download.js`:
- Download tất cả remote URL trong OTIO về local `videos/downloaded_N.ext`
- Patch OTIO in-place: thay remote URL → relative local path
- Cập nhật `resources.json` với `localPath` và `relativePath`
- Chỉ download resource được **selected** (không download toàn bộ candidate)
- Deduplication qua `seenDestPaths` Set tránh race condition
- 4 parallel downloads

Chạy tự động qua `npm run build` (prebuild hook):
```json
"prebuild": "node scripts/pre-render-download.js"
```

**Lưu ý path:** OTIO phải dùng **relative path** (`videos/downloaded_0.mp4`), không phải absolute path (`/Users/...`). `sanitizeUrl()` trong OtioPlayer sẽ prefix với `projectBase` khi serve.

---

### 2.5 Auto-resize ảnh trong prebuild

**File:** `scripts/pre-render-download.js`

**Fix:**
Sau khi download, script tự động resize tất cả ảnh > 1920px trong thư mục project:

```js
const MAX_IMAGE_DIMENSION = 1920;

function resizeImageIfNeeded(filePath) {
    // dùng sips (macOS) để check và resize
    // skip silently nếu không có sips (non-macOS)
}
```

Scan các thư mục: `images/`, `imports/images/`, `uploads/`, `videos/`, `.`

---

### 2.6 Dọn dẹp video candidate không dùng

**Vấn đề:**
`public/projects/ai-automation-workshop/videos/` chứa ~81 file video Pexels (~1GB) là **candidate** (không được select). Remotion copy toàn bộ `public/` vào temp bundle trước mỗi render → 1GB phải copy mỗi lần.

**Fix:**
Move các file không dùng ra `/tmp/`:
```bash
mv public/projects/ai-automation-workshop/videos/pexels-*.mp4 /tmp/ai-automation-workshop-candidates/
```

Chỉ giữ lại 3 file được sử dụng thực sự:
- `videos/downloaded_0.jpeg` (4.7MB)
- `videos/downloaded_1.mp4`
- `videos/downloaded_2.mp4`

---

### 2.7 Composition ID sai trong `package.json`

**Vấn đề:**
Build scripts dùng composition ID cũ `AutoVideo`, `AutoVideoLandscape`, `AutoVideoSquare` không tồn tại.

**Fix:**
```json
"build": "remotion render Preview-Portrait output.mp4",
"build:landscape": "remotion render Preview-Landscape output-landscape.mp4",
"build:square": "remotion render Preview-Square output-square.mp4",
"build:fast": "remotion render Preview-Portrait output.mp4 --gl=angle --jpeg-quality=75"
```

---

### 2.8 Per-frame console.log

**File:** `src/compositions/OtioPlayer.tsx`

**Vấn đề:**
2 `console.log()` call trong render path, chạy mỗi frame (5935 frames = 5935 log calls vào stdout của Chromium).

**Fix:** Xóa cả 2 call.

---

### 2.9 Polling trong lúc render

**File:** `src/compositions/OtioPlayer.tsx`

**Vấn đề:**
`setInterval` mỗi 2s gửi `fetch(script.json)` để detect thay đổi trong Studio. Trong lúc render headless, điều này vô nghĩa và tiêu thụ tài nguyên.

**Fix:**
```ts
const isRendering = getRemotionEnvironment().isRendering;

let intervalId = null;
if (!isRendering) {
    intervalId = setInterval(() => { load(true); }, 2000);
}
```

---

### 2.10 delayRender timeout quá ngắn

**File:** `remotion.config.ts`

**Fix:**
```ts
Config.setDelayRenderTimeoutInMilliseconds(90000); // 90s thay vì 28s default
```

Trong `OtioPlayer.tsx`:
```ts
const [handle] = useState(() => delayRender('Loading project', { timeoutInMilliseconds: 60000 }));
```

---

### 2.11 Resource candidate merge order

**File:** `src/utils/project-loader.ts`

**Vấn đề:**
`selectedResourceIds` có thể là array chứa nhiều ID. `mergedCandidates` order sai:
```ts
// BEFORE (wrong): script.json candidates (có uploaded PNG) ở đầu
const mergedCandidates = [...sceneCandidates, ...(localByScene[scene?.id] || [])];
```

Nếu scene có `selectedResourceIds: ['pexels-9783346', 'uploaded-xxx']`, và `resourceCandidates` trong script.json chỉ chứa uploaded image → uploaded image được pick thay vì pexels từ resources.json.

**Fix:**
```ts
// AFTER (correct): resources.json candidates (có localPath đã download) ở đầu
const mergedCandidates = [...(localByScene[scene?.id] || []), ...sceneCandidates];
```

Chỉ fix trong `buildScenePreferredMediaUrls`, không thay đổi `convertScriptToOtio`.

---

## 3. Cấu hình Remotion tối ưu

**File:** `remotion.config.ts`

```ts
Config.setVideoImageFormat('jpeg');          // jpeg nhanh hơn png
Config.setJpegQuality(80);                   // trade-off quality/speed
Config.setOverwriteOutput(true);             // không hỏi overwrite
Config.setCodec('h264');                     // codec tương thích tốt nhất
Config.setConcurrency(1);                    // 1 tab Chromium (ít RAM hơn)
Config.setDelayRenderTimeoutInMilliseconds(90000); // 90s timeout
Config.setMaxTimelineTracks(500);            // hỗ trợ nhiều track
```

**Lưu ý concurrency:** Với máy RAM thấp (<4GB free), nên giữ concurrency=1. Nếu có >8GB free, có thể thử concurrency=2-4 để tăng tốc.

---

## 4. Kết quả sau tối ưu

| Metric | Trước | Sau |
|--------|-------|-----|
| Frame 94 load time | Timeout 88s | 30ms ✅ |
| Render toàn bộ (5935 frames) | Không hoàn thành | ~10 phút ✅ |
| Output file | N/A | 128MB `output.mp4` ✅ |
| Public dir copy size | ~361MB (với 1GB candidate) | ~360MB (video candidates moved) |
| Ảnh `intro-2` RAM usage | 134MB (8192×5464) | 7MB (1920×1280) |

---

## 5. Quy trình render chuẩn

```bash
# 1. Download remote resources + resize ảnh (chạy tự động qua prebuild)
npm run download

# 2. Render (tự chạy prebuild trước)
npm run build                  # 9:16 Portrait
npm run build:landscape        # 16:9 Landscape
npm run build:square           # 1:1 Square
npm run build:fast             # Portrait nhanh hơn (ANGLE GL, quality 75)
```

---

## 6. Checklist khi thêm project mới

- [ ] Kiểm tra kích thước ảnh: chạy `node scripts/pre-render-download.js [project-id]` để tự động resize
- [ ] Không để video candidate (~1GB) trong `public/projects/[id]/videos/` — chỉ giữ video được select
- [ ] OTIO `target_url` phải là **relative path** hoặc URL HTTPS, không phải absolute local path
- [ ] `resources.json` phải có `relativePath` hoặc `localPath` cho resource đã được download

---

## 7. Files đã thay đổi

| File | Thay đổi |
|------|---------|
| `remotion.config.ts` | Thêm timeout, quality, concurrency config |
| `package.json` | Sửa composition ID, thêm prebuild/download scripts |
| `src/compositions/OtioPlayer.tsx` | Xóa console.log, disable polling/preload khi render, tăng delayRender timeout, skip blur BG video khi render |
| `src/components/effects/ImageWithEffect.tsx` | Skip blur BG `<Img>` khi render, dùng black div thay thế |
| `src/utils/project-loader.ts` | Fix merge order cho resource candidates |
| `scripts/pre-render-download.js` | Tạo mới: download + patch OTIO + resize ảnh |
| `public/projects/ai-automation-workshop/project.otio` | Patch remote URL → local relative path |
