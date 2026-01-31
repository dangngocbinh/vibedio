---
name: local-asset-import
description: Import file nội bộ (video, image, audio) vào project, tự động đổi tên và cập nhật resources.json.
---
# Local Asset Import Skill

Import local files (images, videos, audio) into a video project. Supports files from anywhere on the filesystem - files outside the project are automatically copied in.

## When to Use
- User references a local file path (e.g., `~/Downloads/photo.jpg`, `/tmp/clip.mp4`)
- User wants to use their own media files in a video project
- User provides files from outside the project directory

## How It Works

1. **Detect content type** from file extension (video, image, audio/music, sfx)
2. **Smart rename** - expand filename to be descriptive and match project conventions:
   - `IMG_2045.jpg` → `import_img-2045_photo_2025-01-27.jpg`
   - `screen-recording.mp4` → `import_screen-recording.mp4`
   - Preserves original name context, adds `import_` prefix for traceability
3. **Classify into subfolder** by content type:
   ```
   {projectDir}/imports/
   ├── videos/       # .mp4, .mov, .webm, .avi, .mkv
   ├── images/       # .jpg, .png, .webp, .gif, .svg, .bmp, .tiff
   ├── music/        # .mp3, .wav, .ogg, .m4a, .flac, .aac (long audio)
   └── sfx/          # .mp3, .wav (short audio, when --type=sfx)
   ```
4. **Update resources.json** with import metadata (optional, with `--updateResources`)
5. **Return JSON** with import result for pipeline integration

## Usage

```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files "~/Downloads/photo.jpg" "/tmp/clip.mp4" "./assets/music.mp3" \
  [--type auto|video|image|music|sfx] \
  [--sceneId hook] \
  [--label "product showcase"] \
  [--updateResources] \
  [--dryRun]
```

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--projectDir` | Yes | - | Project directory (relative or absolute) |
| `--files` | Yes | - | Space-separated file paths to import |
| `--type` | No | `auto` | Force content type: `video`, `image`, `music`, `sfx`, or `auto` (detect from extension) |
| `--sceneId` | No | - | Scene ID to associate with (used in filename) |
| `--label` | No | - | Descriptive label to include in filename |
| `--updateResources` | No | false | Update resources.json with import entries |
| `--dryRun` | No | false | Preview import without copying files |

### Examples

**Import a single image:**
```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files ~/Downloads/product-photo.jpg
```

**Import multiple files with scene association:**
```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files ~/Downloads/intro.mp4 ~/Pictures/logo.png \
  --sceneId hook \
  --label "brand intro"
```

**Import audio as SFX (not music):**
```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files ~/Downloads/ding.wav \
  --type sfx
```

**Dry run to preview:**
```bash
node .claude/skills/local-asset-import/scripts/import-assets.js \
  --projectDir public/projects/my-video \
  --files ~/Downloads/*.jpg \
  --dryRun
```

## Output

```json
{
  "success": true,
  "imported": [
    {
      "originalPath": "/Users/binhpc/Downloads/product-photo.jpg",
      "importedPath": "/Users/binhpc/code/automation-video/public/projects/my-video/imports/images/import_product-photo.jpg",
      "relativePath": "imports/images/import_product-photo.jpg",
      "contentType": "image",
      "fileSize": 245760,
      "filename": "import_product-photo.jpg"
    }
  ],
  "skipped": [],
  "errors": [],
  "summary": {
    "total": 1,
    "imported": 1,
    "skipped": 0,
    "errors": 0
  }
}
```

## Filename Expansion Rules

The smart renamer makes filenames more descriptive:

| Original | Imported As | Rule |
|----------|-------------|------|
| `IMG_2045.jpg` | `import_img-2045.jpg` | Camera naming → cleaned |
| `Screenshot 2025-01-27.png` | `import_screenshot-2025-01-27.png` | Spaces → hyphens |
| `video.mp4` | `import_video.mp4` | Simple name preserved |
| `a.jpg` (with --label "hero banner") | `import_hero-banner_a.jpg` | Label adds context |
| `clip.mp4` (with --sceneId hook) | `import_hook_clip.mp4` | SceneId adds context |
| `my file (1).png` | `import_my-file-1.png` | Special chars cleaned |

**Prefix:** Always `import_` so imported assets are easily identifiable.

**With sceneId:** `import_{sceneId}_{name}.{ext}`

**With label:** `import_{label}_{name}.{ext}`

**With both:** `import_{sceneId}_{label}_{name}.{ext}`

## Integration with Pipeline

Imported files are stored in `imports/` (separate from `downloads/` and `generated/`) to clearly distinguish user-provided assets from auto-downloaded or AI-generated ones.

The video-editor skill's AssetResolver handles paths in `imports/` the same way as `downloads/` - they become relative paths in the OTIO timeline.

## Conversation Flow

```
User: "Use ~/Downloads/product-demo.mp4 for the hook scene"

Claude:
1. Run import-assets.js with --files ~/Downloads/product-demo.mp4 --sceneId hook
2. File copied to: imports/videos/import_hook_product-demo.mp4
3. Reference this path when building the video timeline
```
