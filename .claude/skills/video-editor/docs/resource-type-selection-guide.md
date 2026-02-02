# Resource Type Selection & Smart Filename Matching Guide

## Overview

Video Editor và Video Resource Finder skills giờ hỗ trợ:
1. **Lựa chọn linh hoạt ảnh/video** cho từng phân cảnh (scene)
2. **Smart Filename Matching** - Tự động map file theo tên sang sceneId

---

## 1. Lựa chọn ảnh/video linh hoạt

### Cách sử dụng

Thêm field `resourceType` vào `visualSuggestion` trong `script.json`:

```json
{
  "scenes": [
    {
      "id": "scene_1",
      "text": "Amazing parkour action",
      "duration": 10,
      "visualSuggestion": {
        "type": "stock",
        "resourceType": "video",  // Force video only
        "query": "parkour jumping"
      }
    },
    {
      "id": "scene_2",
      "text": "Neural network diagram",
      "duration": 8,
      "visualSuggestion": {
        "type": "ai-generated",
        "resourceType": "image",  // Force image only
        "query": "brain neural network"
      }
    },
    {
      "id": "scene_3",
      "text": "Beautiful sunset",
      "duration": 7,
      "visualSuggestion": {
        "type": "stock",
        "resourceType": "auto",   // Auto-detect (default)
        "query": "sunset beach"
      }
    }
  ]
}
```

### Các giá trị của `resourceType`

| Value | Behavior |
|-------|----------|
| `"video"` | Chỉ tìm/sử dụng video cho scene này |
| `"image"` | Chỉ tìm/sử dụng ảnh cho scene này |
| `"auto"` | Tự động chọn (ưu tiên video → fallback sang ảnh) |

**Mặc định:** `"auto"` nếu không chỉ định

### Khi nào dùng?

✅ **Dùng `resourceType: "video"`** khi:
- Scene cần chuyển động (action, demo, walkthrough)
- Muốn tránh ảnh tĩnh cho scene động

✅ **Dùng `resourceType: "image"`** khi:
- Scene cần illustration/diagram cụ thể
- Muốn consistent style (AI-generated images)
- Tiết kiệm dung lượng/tránh video nặng

✅ **Dùng `resourceType: "auto"`** khi:
- Không quan tâm loại resource
- Muốn skill tự quyết định based on availability

---

## 2. Smart Filename Matching

### Cách hoạt động

Khi bạn import file hoặc cung cấp file với pattern tên: `{sceneId}_{description}.ext`, skill sẽ **tự động map** vào scene tương ứng.

### Ví dụ

**Tên file:**
- `scene_1_peaceful_nature.mp4` → `scene_1`
- `item1_coding_workspace.jpg` → `item1`
- `hook_amazing_intro.mp4` → `hook`
- `intro_brand_logo.png` → `intro`
- `cta_call_to_action.mp4` → `cta`

**Supported patterns:**
- `scene_\d+` (scene_1, scene_2, ...)
- `item\d+` (item1, item2, ...)
- `hook`, `intro`, `cta`, `outro`, `conclusion` (common scene names)
- `{anything}_...` (bất kỳ text nào trước dấu `_` đầu tiên)

### Cách sử dụng

#### Option A: Sử dụng local-asset-import skill

```bash
# Import files với sceneId tự động detect
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files scene_1_nature.mp4 item1_workspace.jpg hook_intro.mp4 \
  --updateResources
```

Skill sẽ:
1. Detect `sceneId` từ filename
2. Import vào folder `imports/{videos,images}/`
3. Update `resources.json` với sceneId đúng

#### Option B: Manual pinned resources

Trong `script.json`, sử dụng `type: "pinned"`:

```json
{
  "scenes": [
    {
      "id": "scene_1",
      "text": "My custom scene",
      "duration": 10,
      "visualSuggestion": {
        "type": "pinned",
        "path": "imports/videos/scene_1_custom.mp4"
      }
    }
  ]
}
```

---

## 3. Workflow hoàn chỉnh

### Step 1: Chuẩn bị files (nếu có)

Đặt tên file theo pattern: `{sceneId}_{description}.{ext}`

```
~/Downloads/
├── scene_1_peaceful_nature.mp4
├── item1_coding_workspace.jpg
├── hook_amazing_intro.mp4
└── cta_subscribe.mp4
```

### Step 2: Import files vào project

```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files ~/Downloads/scene_1_*.mp4 ~/Downloads/item1_*.jpg \
  --updateResources
```

### Step 3: Tạo script.json với resourceType

```json
{
  "metadata": {
    "projectName": "my-video",
    "videoType": "image-slide",
    "duration": 60,
    "width": 1920,
    "height": 1080,
    "ratio": "16:9",
    "platform": "youtube",
    "createdAt": "2026-02-02T00:00:00Z"
  },
  "scenes": [
    {
      "id": "scene_1",
      "text": "Peaceful nature scene",
      "duration": 10,
      "visualSuggestion": {
        "type": "pinned",  // Sử dụng file đã import
        "path": "imports/videos/import_scene-1_peaceful-nature.mp4"
      }
    },
    {
      "id": "item1",
      "text": "Coding workspace",
      "duration": 8,
      "visualSuggestion": {
        "type": "stock",
        "resourceType": "image",  // Force image
        "query": "modern workspace"
      }
    }
  ]
}
```

### Step 4: Tìm resources (nếu cần)

```bash
node .claude/skills/video-resource-finder/scripts/find-resources.js \
  --projectDir public/projects/my-video
```

### Step 5: Build timeline

```bash
python .claude/skills/video-editor/scripts/build_timeline.py \
  --projectDir public/projects/my-video
```

---

## 4. Best Practices

### 🎯 Khi nào dùng resourceType?

| Use Case | Recommended resourceType |
|----------|-------------------------|
| Educational/Tutorial video | `auto` (video cho demo, image cho diagram) |
| Action/Gaming video | `video` (cần chuyển động) |
| Explainer/Infographic | `image` (consistent AI-generated style) |
| Mixed content | `auto` (flexible) |

### 🎯 Khi nào dùng Smart Filename?

✅ **Nên dùng** khi:
- Bạn có nhiều files custom cho project
- Muốn control chính xác resource cho từng scene
- Muốn avoid API search/AI generation

❌ **Không cần** khi:
- Muốn skill tự động tìm stock resources
- Muốn AI generate toàn bộ images
- Không có custom files

### 🎯 Priority Order

Skill sẽ ưu tiên theo thứ tự:
1. **Pinned resources** (user-provided files)
2. **Downloaded local files** (từ video-resource-finder)
3. **Remote URLs** (API results)

---

## 5. Troubleshooting

### Skill không detect sceneId từ filename?

Check:
- Filename có theo pattern `{sceneId}_description.ext`?
- sceneId có match với patterns hỗ trợ (scene_\d+, item\d+, hook, intro, etc.)?

**Fix:** Đổi tên file hoặc provide `--sceneId` manually khi import:

```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files my-custom-file.mp4 \
  --sceneId scene_1
```

### Skill vẫn tìm video khi tôi set `resourceType: "image"`?

Check:
- `visualSuggestion.resourceType` có đúng value `"image"`?
- resources.json có chứa pinned video cho scene đó? (pinned luôn có priority cao nhất)

**Fix:** Remove pinned resource hoặc update resourceType trong script.json

---

## Examples

### Example 1: Mixed video/image listicle

```json
{
  "scenes": [
    {
      "id": "hook",
      "visualSuggestion": {
        "type": "stock",
        "resourceType": "video",  // Action intro
        "query": "excited reaction"
      }
    },
    {
      "id": "item1",
      "visualSuggestion": {
        "type": "ai-generated",
        "resourceType": "image",  // AI diagram
        "query": "brain connections illustration"
      }
    },
    {
      "id": "item2",
      "visualSuggestion": {
        "type": "pinned",
        "path": "imports/videos/item2_custom_demo.mp4"  // Custom file
      }
    }
  ]
}
```

### Example 2: Full custom resources with smart naming

**Files:**
```
imports/
├── videos/
│   ├── hook_intro.mp4
│   ├── scene_1_demo.mp4
│   └── cta_outro.mp4
└── images/
    ├── item1_diagram.png
    └── item2_chart.jpg
```

**script.json:**
```json
{
  "scenes": [
    {
      "id": "hook",
      "visualSuggestion": { "type": "pinned", "path": "imports/videos/hook_intro.mp4" }
    },
    {
      "id": "scene_1",
      "visualSuggestion": { "type": "pinned", "path": "imports/videos/scene_1_demo.mp4" }
    },
    {
      "id": "item1",
      "visualSuggestion": { "type": "pinned", "path": "imports/images/item1_diagram.png" }
    }
  ]
}
```

---

## Summary

✅ **resourceType** cho phép control chính xác loại resource (image/video/auto)
✅ **Smart Filename Matching** tự động map file based on naming pattern
✅ **Priority:** Pinned > Local downloads > Remote URLs
✅ **Compatible** với tất cả video types (listicle, image-slide, etc.)

Enjoy flexible resource management! 🎬
