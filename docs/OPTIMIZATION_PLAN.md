# 🚀 System Optimization Plan - Script & Skill Stability

## 📋 Summary
Dựa trên lessons learned từ "Chờ Anh Trong Cơn Mưa" project, đây là 9 improvements để:
- ✅ Reduce manual fixes
- ✅ Auto-detect issues trước khi lỗi xảy ra
- ✅ Standardize project structure
- ✅ Auto-regenerate timelines
- ✅ Better error messages

---

## 🎯 9 Optimization Areas

### 1. **Project Configuration File** (NEW)
**Problem**: Project settings hardcoded, no consistent defaults
**Solution**: Create `project-config.json` template

```json
{
  "project": {
    "name": "my-project",
    "type": "image-slide",
    "autoRegeneratOtio": true,
    "autoValidateOnLoad": true
  },
  "rendering": {
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "ratio": "16:9"
  },
  "scenes": {
    "defaultDuration": 6,
    "defaultTransition": "fade",
    "defaultEffect": "ken-burns"
  },
  "subtitles": {
    "position": "bottom",
    "font": "Arial",
    "fontSize": 16,
    "highlightColor": "#FFEB3B"
  },
  "title": {
    "enabled": true,
    "duration": 5,
    "backgroundColor": "#000000",
    "textColor": "#FFFFFF",
    "font": "Georgia",
    "fontSize": 72
  }
}
```

**Benefits**:
- One source of truth for all settings
- Easy to switch presets (TikTok, YouTube, etc.)
- Reduces script.json boilerplate

---

### 2. **Automatic OTIO Regeneration Hook** (NEW)
**Problem**: Need to manually run `python3 cli.py` after script changes
**Solution**: Add file watcher in project loader

```javascript
// In project-loader.ts
import chokidar from 'chokidar';

export function watchProjectForChanges(projectPath: string) {
  const watcher = chokidar.watch(
    [`${projectPath}/script.json`, `${projectPath}/resources.json`],
    { ignored: /project.otio/ }
  );

  watcher.on('change', async (filepath) => {
    console.log(`📝 Detected change in ${filepath}`);
    console.log(`🔄 Auto-regenerating project.otio...`);

    try {
      await regenerateOtio(projectPath);
      console.log(`✅ OTIO regenerated successfully`);
    } catch (error) {
      console.error(`❌ Failed to regenerate OTIO: ${error}`);
    }
  });

  return watcher;
}
```

**Benefits**:
- Changes to script.json → Instant OTIO update
- No manual regeneration needed
- Real-time preview updates

---

### 3. **Script Validator with Auto-Fix** (IMPROVE)
**Problem**: Validation errors only caught at runtime
**Solution**: Add pre-generation validation

```python
# In video-editor/utils/script_validator.py (NEW)
class ScriptValidator:
    def validate_and_fix(self, script):
        """Validate script and auto-fix common issues."""
        errors = []
        fixes = []

        # Check 1: Scene timing continuity
        for i, scene in enumerate(script['scenes']):
            if i > 0:
                prev_end = script['scenes'][i-1]['endTime']
                if scene['startTime'] != prev_end:
                    fixes.append(
                        f"Scene {i} timing gap: {prev_end} → {scene['startTime']}, "
                        f"auto-fixing to {prev_end}"
                    )
                    scene['startTime'] = prev_end
                    scene['endTime'] = prev_end + scene['duration']

        # Check 2: Total duration consistency
        total = script['scenes'][-1]['endTime']
        if total != script['metadata']['duration']:
            fixes.append(
                f"Duration mismatch: script says {script['metadata']['duration']}s "
                f"but scenes total {total}s, updating metadata"
            )
            script['metadata']['duration'] = total

        # Check 3: Required subtitle fields
        if 'position' not in script.get('subtitle', {}):
            fixes.append("Adding default subtitle position: 'bottom'")
            script['subtitle']['position'] = 'bottom'

        # Check 4: Title scene metadata
        if script['scenes'][0]['id'] == 'scene_title':
            if 'metadata' not in script['scenes'][0]:
                fixes.append("Adding title scene metadata for text rendering")
                script['scenes'][0]['metadata'] = {
                    'text_content': script['scenes'][0].get('text', ''),
                    'overlayType': 'title'
                }

        return script, fixes, errors
```

**Benefits**:
- Auto-fix 80% of common issues
- Clear feedback on what was fixed
- No "missing field" surprises

---

### 4. **Script Template Generator** (NEW)
**Problem**: Creating script.json from scratch is error-prone
**Solution**: Generate template from description

```bash
# Usage:
python3 generate-script-template.py \
  --name "my-project" \
  --type image-slide \
  --duration 300 \
  --num-scenes 20 \
  --scene-duration 15 \
  --output script.json
```

Generates complete, valid `script.json` automatically.

**Benefits**:
- 0% syntax errors
- Correct timing from start
- Ready to customize

---

### 5. **Skill Health Check** (NEW)
**Problem**: Silent failures, no way to diagnose issues early
**Solution**: Add `--check` mode to video-editor skill

```bash
python3 video-editor/cli.py <project> --health-check
```

Output:
```
📊 Project Health Check: cho-anh-trong-con-mua

✓ script.json
  - Valid syntax
  - 57 scenes
  - Timing: 0s → 341s (continuous)
  - Title scene present
  - Subtitles position: bottom ✓

✓ resources.json
  - Valid syntax
  - 20 unique images
  - All images exist in imports/images/
  - No broken references

✓ voice.json
  - Valid syntax
  - 341.34s audio
  - 341 timestamps
  - No gaps or overlaps

⚠️ Warnings:
  - No music.json found (optional)

✅ All checks passed! Ready to render.
```

**Benefits**:
- Catch issues before regeneration
- Clear action items
- Peace of mind before rendering

---

### 6. **Metadata Schema Documentation** (IMPROVE)
**Problem**: Metadata fields not well documented
**Solution**: Generate schema with examples

```json
// In skill-metadata-schema.json (NEW)
{
  "title_scene": {
    "description": "First scene with title overlay",
    "required_fields": ["text_content", "overlayType"],
    "optional_fields": ["backgroundColor", "textColor", "fontSize"],
    "example": {
      "id": "scene_title",
      "text": "My Video Title",
      "duration": 5,
      "metadata": {
        "text_content": "My Video Title",
        "overlayType": "title",
        "backgroundColor": "#000000",
        "textColor": "#FFFFFF"
      }
    }
  },
  "image_scene": {
    "description": "Image with optional effects",
    "required_fields": ["imagePath"],
    "optional_fields": ["effect", "transition"],
    "example": {
      "id": "scene_1",
      "duration": 6,
      "metadata": {
        "imagePath": "imports/images/scene_01.png",
        "effect": "ken-burns",
        "transition": "fade"
      }
    }
  }
}
```

**Benefits**:
- IDE auto-completion support
- Clearer examples
- Fewer surprises

---

### 7. **Project Type Presets** (NEW)
**Problem**: Different project types need different config
**Solution**: Create presets for common types

```bash
# Usage:
python3 create-project.py \
  --preset youtube-short \
  --name my-video
```

**Presets**:
- `youtube-short`: 60s, fast-paced, bottom subtitles
- `tiktok-story`: 30-60s, vertical, large captions
- `instagram-reel`: 30-90s, square, centered text
- `music-video`: 3-5min, looping images, top title
- `educational`: Variable, detailed subtitles, annotations

**Benefits**:
- 1 command → fully configured project
- Best practices built-in
- Consistent output quality

---

### 8. **Automated Testing Suite** (NEW)
**Problem**: Changes break things, no regression detection
**Solution**: Add test suite

```python
# In tests/test_video_editor.py (NEW)
import pytest

def test_script_validation():
    """Test script validation catches errors."""
    invalid_script = {
        'metadata': {'duration': 100},
        'scenes': [
            {'id': 's1', 'duration': 30, 'startTime': 0, 'endTime': 30},
            {'id': 's2', 'duration': 30, 'startTime': 35, 'endTime': 65}  # Gap!
        ]
    }

    validator = ScriptValidator()
    script, fixes, errors = validator.validate_and_fix(invalid_script)

    assert len(fixes) > 0, "Should detect timing gap"
    assert script['scenes'][1]['startTime'] == 30, "Should fix gap"

def test_otio_generation():
    """Test OTIO generation produces valid timeline."""
    project = load_project('public/projects/cho-anh-trong-con-mua')
    otio = generate_otio(project)

    assert otio.duration().to_seconds() == 341.0
    assert len(otio.tracks) == 3
    assert otio.tracks[0].name == 'Images'
    assert otio.tracks[1].name == 'Subtitles'
    assert otio.tracks[2].name == 'Voice'

def test_title_scene_rendering():
    """Test title scene renders correctly."""
    component = render_component('TitleOverlay', {
        'text': 'My Title',
        'duration': 5
    })

    assert component.props.text == 'My Title'
    assert component.duration == 5 * 30  # 150 frames @ 30fps
```

Run with: `pytest tests/ -v`

**Benefits**:
- Catch regressions automatically
- Confidence in changes
- CI/CD ready

---

### 9. **Logging & Diagnostics** (IMPROVE)
**Problem**: Errors show up too late, hard to debug
**Solution**: Add comprehensive logging

```python
# In video-editor/utils/logger.py (IMPROVE)
import logging

logger = logging.getLogger('video-editor')

# Different log levels:
logger.debug("Loading script.json")
logger.info("✓ Loaded 57 scenes, 341s total")
logger.warning("⚠️  Image scene_5 has no transition set, using default")
logger.error("❌ Failed to load image: imports/images/missing.png")

# Usage:
python3 cli.py <project> --log-level debug > debug.log

# Output shows exact flow:
# [DEBUG] Loading script.json from cho-anh-trong-con-mua
# [DEBUG] Validating script schema
# [INFO] ✓ Script valid: 57 scenes
# [DEBUG] Loading resources.json
# [INFO] ✓ Found 20 images in imports/images/
# [DEBUG] Creating image track with 57 clips
# [WARNING] Scene title has type 'text-overlay', rendering as special case
# [DEBUG] Creating subtitle track with 118 clips
# [INFO] ✓ Timeline built successfully
# [DEBUG] Writing project.otio to disk
# [INFO] ✓ Complete: 480KB file
```

**Benefits**:
- Easy debugging
- Understand what's happening
- Archive logs for later review

---

## 📊 Implementation Priority

| Priority | Item | Effort | Impact | Timeline |
|----------|------|--------|--------|----------|
| 🔴 High | Script Validator with Auto-Fix | 2h | 8/10 | Week 1 |
| 🔴 High | Skill Health Check | 1.5h | 7/10 | Week 1 |
| 🟠 Medium | Project Config File | 1h | 6/10 | Week 1 |
| 🟠 Medium | Auto OTIO Regeneration | 2h | 9/10 | Week 2 |
| 🟠 Medium | Script Template Generator | 1.5h | 5/10 | Week 2 |
| 🟡 Low | Project Type Presets | 3h | 4/10 | Week 3 |
| 🟡 Low | Automated Testing | 2h | 7/10 | Week 3 |
| 🟡 Low | Logging & Diagnostics | 1h | 5/10 | Week 3 |
| 🟡 Low | Metadata Schema Doc | 0.5h | 3/10 | Week 2 |

---

## 🎯 Success Metrics

After implementing these 9 optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Setup time** | 15 min | 2 min | 85% ↓ |
| **Manual OTIO regeneration** | Every change | Automatic | 100% ↓ |
| **Script validation errors** | Found at render time | Pre-generation | 100% ↓ |
| **Common issues auto-fixed** | 0% | 80% | 80% ↑ |
| **Time to debug issues** | 30 min | 5 min | 83% ↓ |
| **Documentation clarity** | Scattered | Unified schema | 10x ↑ |
| **Test coverage** | 0% | 70% | 70% ↑ |
| **User onboarding time** | 1 hour | 10 min | 85% ↓ |

---

## 📝 Implementation Checklist

- [ ] 1. Add ScriptValidator with auto-fix logic
- [ ] 2. Add health-check mode to video-editor CLI
- [ ] 3. Create project-config.json template
- [ ] 4. Add file watcher for auto OTIO regeneration
- [ ] 5. Build script-template generator
- [ ] 6. Add metadata schema documentation
- [ ] 7. Create project type presets
- [ ] 8. Build test suite
- [ ] 9. Add comprehensive logging

---

## 💡 Quick Wins (Can Do Today)

1. **Update json_loader.py** - Add more auto-fixes (5 min)
2. **Improve error messages** - Add examples & suggestions (10 min)
3. **Create BEST_PRACTICES.md** - Document what we learned (15 min)
4. **Add script-template.json** - Provide template for users (10 min)

---

## 🚀 Next Project

With these 9 improvements in place:
- Create next video project → Takes 5 minutes setup
- Script validation → Automatic
- OTIO regeneration → Automatic
- Rendering → Zero errors

---

## Final Note

These optimizations transform the workflow from:
```
Create project → Debug errors → Fix script → Regenerate OTIO → Try again
[45 minutes of frustration]
```

To:
```
Create project → Auto-validate & fix → Auto-regenerate OTIO → Ready to render
[5 minutes, zero issues]
```

**Investment**: 2 days of development
**Return**: 80% faster future projects, near-zero errors
