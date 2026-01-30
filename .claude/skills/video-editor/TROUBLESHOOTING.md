# Video Editor Skill - Troubleshooting Guide

## Common Issues & Solutions

### 1. ❌ "missing required field: X"

**Cause**: `script.json` thiếu required fields

**Solution**: Only `metadata` và `scenes` là bắt buộc. Các field khác sẽ auto-populate:

```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "image-slide",
    "duration": 300
  },
  "scenes": [
    {"id": "scene_1", "text": "Scene", "duration": 10, "startTime": 0, "endTime": 10}
  ]
  // script, voice, music, subtitle sẽ auto-create ✓
}
```

**Reference**: See `SCHEMA.md` → "Minimal Configuration"

---

### 2. ❌ "videoType not found"

**Cause**: `videoType` không match với available strategies

**Solution**: Use one of these valid types:
- `facts` ✓ Implemented
- `listicle` ✓ Implemented
- `story` ✓ Implemented
- `motivation` ✓ Implemented
- `image-slide` ✓ Implemented
- `multi-video-edit` ✓ Implemented (NEW)

```json
{
  "metadata": {
    "videoType": "image-slide"  // ✓ Valid
  }
}
```

---

### 3. ❌ "python: command not found"

**Cause**: Gọi `python` thay vì `python3`

**Solution**: Always use `python3`:

```bash
# ❌ Wrong
python .claude/skills/video-editor/cli.py public/projects/my-project

# ✅ Correct
python3 .claude/skills/video-editor/cli.py public/projects/my-project
```

**Or use the shebang**:
```bash
# ✅ Also correct (uses #!/usr/bin/env python3 from cli.py)
./.claude/skills/video-editor/cli.py public/projects/my-project
```

---

### 4. ❌ "voice.json missing 'timestamps'"

**Cause**: `voice.json` không có word-level timestamps

**Solution**: Ensure voice.json has this structure:

```json
{
  "text": "Your narration text here",
  "timestamps": [
    {"word": "Your", "start": 0.0, "end": 0.3},
    {"word": "narration", "start": 0.4, "end": 0.8},
    {"word": "text", "start": 0.9, "end": 1.2}
  ]
}
```

**Generate automatically** using voice-generation skill:
```bash
python3 .claude/skills/voice-generation/cli.py <input-text>
```

---

### 5. ❌ "resources.json missing 'resources' field"

**Cause**: `resources.json` 結構不正確

**Solution**: Ensure top-level `resources` field exists:

```json
{
  "projectName": "my-project",
  "resources": {
    "pinnedResources": [],
    "videos": [],
    "images": [],
    "generatedImages": []
    // At least one of these arrays must be populated
  }
}
```

---

### 6. ❌ "Scene timing is invalid"

**Cause**: startTime, endTime, duration không consistent

**Solution**: Ensure:
- `startTime < endTime` ✓
- `duration = endTime - startTime` ✓
- No gaps between scenes ✓

```json
{
  "scenes": [
    {
      "id": "scene_1",
      "startTime": 0,
      "endTime": 10,
      "duration": 10  // ✓ 10 - 0 = 10
    },
    {
      "id": "scene_2",
      "startTime": 10,  // ✓ Continues from previous
      "endTime": 25,
      "duration": 15    // ✓ 25 - 10 = 15
    }
  ]
}
```

---

### 7. ⚠️ "Auto-populated missing field 'X'"

**Cause**: Optional field was missing (NOT an error)

**Info**: This is a warning. The skill auto-created:
- `script` → empty narration
- `voice` → null provider
- `music` → disabled
- `subtitle` → default styling

**Action**: Only act if you need custom values:

```json
{
  "music": {
    "enabled": true,
    "query": "calm ambient",
    "mood": "melancholic",
    "volume": 0.6
  }
}
```

---

### 8. ❌ "Image file not found: imports/images/scene_1.png"

**Cause**: Image path in `resources.json` không tồn tại

**Solution**:
1. Verify image file exists:
   ```bash
   ls -la public/projects/my-project/imports/images/
   ```

2. Ensure `resources.json` has correct path:
   ```json
   {
     "results": [{
       "localPath": "imports/images/scene_1.png"  // Relative to project root
     }]
   }
   ```

3. Copy images if missing:
   ```bash
   cp generated-new/*.png imports/images/
   ```

---

### 9. ❌ "Duration mismatch: expected 300s, got 298.5s"

**Cause**: Total scene duration không match `metadata.duration`

**Solution**: Adjust either:

**Option A**: Adjust last scene duration:
```json
{
  "metadata": {
    "duration": 300  // Update to match
  },
  "scenes": [
    // ... scenes ...
    {
      "id": "scene_20",
      "startTime": 285,
      "endTime": 300,
      "duration": 15  // Adjust to fill gap
    }
  ]
}
```

**Option B**: Recalculate metadata.duration:
```json
{
  "metadata": {
    "duration": 298.5  // Update to actual total
  }
}
```

---

### 10. ❌ "json.JSONDecodeError: expecting value"

**Cause**: JSON syntax error (invalid JSON)

**Solution**: Validate JSON syntax:
```bash
# Check for syntax errors
python3 -m json.tool public/projects/my-project/script.json

# Or use jq
cat public/projects/my-project/script.json | jq .
```

Common JSON errors:
- Missing comma between objects: `{"a": 1} {"b": 2}` ❌
- Trailing comma: `{"a": 1,}` ❌
- Unquoted keys: `{a: 1}` ❌
- Single quotes: `{'a': 1}` ❌

---

## Validation Checklist

Before running the skill, verify:

### script.json
- [ ] `metadata.projectName` exists and is string
- [ ] `metadata.videoType` is one of the valid types
- [ ] `metadata.duration` is number > 0
- [ ] `scenes` array is not empty
- [ ] Each scene has: `id`, `text`, `duration`, `startTime`, `endTime`
- [ ] Scene timing is consistent (startTime < endTime)
- [ ] Total duration matches `metadata.duration`

### voice.json
- [ ] `text` field exists and is string
- [ ] `timestamps` array exists
- [ ] Each timestamp has: `word`, `start`, `end`
- [ ] Timestamps are in chronological order
- [ ] Timestamps cover full audio duration

### resources.json
- [ ] `resources` field exists (not at top level, under `resources` key)
- [ ] At least one resource type has items (videos, images, generatedImages, etc)
- [ ] Image paths are relative and accessible
- [ ] No duplicate resource IDs

---

## Performance Tips

### Optimize OTIO Generation
- Use `--validate-only` first to catch errors early:
  ```bash
  python3 .claude/skills/video-editor/cli.py public/projects/my-project --validate-only
  ```

- For large projects (100+ scenes), use custom FPS:
  ```bash
  python3 .claude/skills/video-editor/cli.py public/projects/my-project --fps 24
  ```

- Verbose mode helps debug:
  ```bash
  python3 .claude/skills/video-editor/cli.py public/projects/my-project -v
  ```

---

## Getting Help

1. **Check SCHEMA.md** - Full field reference
2. **Check SKILL.md** - Usage examples
3. **Enable verbose mode** - More detailed output
4. **Validate JSON** - Use `python3 -m json.tool`
5. **Check project structure** - Verify all required files exist

---

## Recent Improvements (v2.1)

✅ **Auto-population of optional fields** - No more "missing field" errors for optional configs
✅ **Better error messages** - Include examples and links to documentation
✅ **Flexible metadata** - Auto-defaults for width, height, ratio
✅ **Schema documentation** - Complete SCHEMA.md file added
✅ **This troubleshooting guide** - Self-service problem solving

---

## File Structure Reference

```
public/projects/my-project/
├── script.json          (REQUIRED - Scene definitions)
├── voice.json           (REQUIRED - Voice with timestamps)
├── resources.json       (REQUIRED - Image/video paths)
├── voice.mp3            (Required if voice.json references it)
├── imports/
│   └── images/          (Image files referenced in resources.json)
│       ├── scene_1.png
│       ├── scene_2.png
│       └── ...
└── project.otio         (OUTPUT - Generated by skill)
```

---

## Version & Updates

- **Current Version**: 2.1+
- **Last Updated**: 2026-01-29
- **Recent Features**:
  - Auto-population of optional fields
  - Improved error messages with examples
  - SCHEMA.md documentation
