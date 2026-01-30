# 📚 Best Practices for Project Setup

## Lessons Learned from "Chờ Anh Trong Cơn Mưa"

### ✅ DO - What Works Well

1. **Always start with project-config.json**
   - Define all settings upfront
   - Single source of truth
   - Easy to switch presets

2. **Validate script before rendering**
   ```bash
   python3 video-editor/cli.py <project> --validate-only
   ```

3. **Use descriptive scene IDs**
   ```json
   ✅ Good:  "scene_01_khoi_dau_co_don"
   ❌ Bad:   "scene_1" or "s1"
   ```

4. **Set subtitle position explicitly**
   ```json
   "subtitle": {
     "position": "bottom",  // ← Explicit
     "font": "Arial",
     "highlightColor": "#FFEB3B"
   }
   ```

5. **Use 6s per image for fast-paced videos**
   - Engages viewers
   - Syncs well with music
   - Professional pacing

6. **Always backup before major changes**
   ```bash
   cp -r public/projects/my-project my-project.backup-$(date +%s)
   ```

---

### ❌ DON'T - What Causes Issues

1. ❌ Don't manually edit OTIO files
   - Always regenerate from script.json
   - Regenerate = `python3 video-editor/cli.py <project>`

2. ❌ Don't assume default subtitle position
   - Explicitly set `"position": "bottom"` or `"center"`
   - Don't rely on implicit defaults

3. ❌ Don't create scenes without duration
   ```json
   ❌ Bad:
   {"id": "scene_1", "text": "..."}  // Missing duration, startTime, endTime

   ✅ Good:
   {"id": "scene_1", "text": "...", "duration": 6, "startTime": 0, "endTime": 6}
   ```

4. ❌ Don't skip validation before rendering
   - Validation catches 80% of issues early
   - Takes 2 seconds
   - Saves 30 minutes debugging

5. ❌ Don't hardcode file paths
   - Use relative paths: `imports/images/scene_1.png`
   - Never absolute: `/Users/binhpc/code/.../scene_1.png`

6. ❌ Don't mix manual + automated setup
   - Either use templates + presets, or manual config
   - Don't mix both (confusing)

---

### 🎯 Scene Duration Reference

| Use Case | Duration | Count | Total |
|----------|----------|-------|-------|
| Music video (fast montage) | 5-6s | 60 | 5-6 min |
| Music video (moderate) | 8-10s | 30-40 | 5-6 min |
| Educational (detailed) | 15-20s | 20 | 5-6 min |
| Story/narrative | 20-30s | 12-15 | 5-6 min |
| Title/intro | 3-5s | 1 | 3-5s only |
| Outro | 3-5s | 1 | 3-5s only |

**Cho Anh Trong Cơn Mưa**: 6s per image = 60 scenes = ~5:41 (fits audio perfectly)

---

### 🔍 Pre-Render Checklist

Before running rendering, verify:

- [ ] **script.json**
  - [ ] `metadata.duration` set
  - [ ] All scenes have `id`, `duration`, `startTime`, `endTime`
  - [ ] Scenes are continuous (no gaps)
  - [ ] Total duration matches `metadata.duration`
  - [ ] `subtitle.position` is set (not relying on default)

- [ ] **resources.json**
  - [ ] All image paths exist in `imports/images/`
  - [ ] No broken references
  - [ ] At least one resource type has items

- [ ] **voice.json**
  - [ ] `text` field exists
  - [ ] `timestamps` array is present
  - [ ] Timestamps are in chronological order

- [ ] **Title Scene** (if present)
  - [ ] Has `metadata.text_content` or `metadata.textContent`
  - [ ] Has `metadata.overlayType: "title"`
  - [ ] Duration is 3-5 seconds

- [ ] **Images**
  - [ ] All images exist in `imports/images/`
  - [ ] No corrupted files
  - [ ] Correct aspect ratio (16:9)

---

### 🚀 Common Fixes

**Issue**: "Scene timing is invalid"
**Fix**:
```python
# Recalculate all timings
current_time = 0
for scene in scenes:
    scene['startTime'] = current_time
    scene['endTime'] = current_time + scene['duration']
    current_time = scene['endTime']

# Update metadata
metadata['duration'] = current_time
```

**Issue**: "Title not displaying"
**Fix**: Add metadata to title scene
```json
{
  "id": "scene_title",
  "text": "My Title",
  "metadata": {
    "text_content": "My Title",
    "overlayType": "title"
  }
}
```

**Issue**: "Subtitles in wrong position"
**Fix**: Set position explicitly
```json
"subtitle": {
  "position": "bottom",  // or "center", "top"
  "font": "Arial"
}
```

---

### 📖 Command Reference

```bash
# Validate only (no generation)
python3 video-editor/cli.py <project> --validate-only

# Validate + Generate OTIO
python3 video-editor/cli.py <project> --fps 30

# Health check (diagnose issues)
python3 video-editor/cli.py <project> --health-check

# Verbose mode (see what's happening)
python3 video-editor/cli.py <project> -v

# Generate script template
python3 generate-script-template.py \
  --name my-project \
  --duration 300 \
  --num-scenes 50
```

---

### 💾 Project Structure

```
public/projects/my-project/
├── project.otio            ← Timeline (auto-generated)
├── production_status.json   ← Status tracking
├── script.json             ← Scene definitions (YOU edit this)
├── resources.json          ← Image/video paths (auto-generated)
├── voice.json              ← Voice timestamps (auto-generated)
├── imports/
│   └── images/             ← Image files go here
│       ├── scene_1.png
│       ├── scene_2.png
│       └── ...
└── generated-new/          ← Temporary, can delete
    └── generation-summary.json
```

**Edit only**: `script.json`
**Auto-generated**: Everything else
**Don't touch**: `project.otio` (always regenerate)

---

### 📋 Project Setup Workflow

```
1. Create project folder
2. Create/copy script.json
3. Run: python3 video-editor/cli.py <project> --validate-only
4. Fix any validation errors
5. Run: python3 video-editor/cli.py <project>
6. Load project.otio in Remotion
7. Preview & render
```

---

### 🎓 Example: Minimal Valid Project

```json
// script.json
{
  "metadata": {
    "projectName": "demo",
    "videoType": "image-slide",
    "duration": 30
  },
  "scenes": [
    {
      "id": "scene_1",
      "text": "Scene 1",
      "startTime": 0,
      "endTime": 15,
      "duration": 15,
      "visualSuggestion": {
        "type": "ai-generated",
        "imagePath": "imports/images/scene_1.png"
      }
    },
    {
      "id": "scene_2",
      "text": "Scene 2",
      "startTime": 15,
      "endTime": 30,
      "duration": 15,
      "visualSuggestion": {
        "type": "ai-generated",
        "imagePath": "imports/images/scene_2.png"
      }
    }
  ],
  "subtitle": {
    "position": "bottom",
    "font": "Arial",
    "highlightColor": "#FFEB3B"
  }
}
```

That's it! This will generate a valid OTIO timeline.

---

## Summary

**Golden Rules**:
1. ✅ Always validate before rendering
2. ✅ Use explicit settings (don't rely on defaults)
3. ✅ Keep scene timing continuous
4. ✅ Backup before big changes
5. ✅ Regenerate OTIO after editing script
6. ✅ Use relative paths for images
