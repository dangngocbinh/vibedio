# Web Image Search - Quick Start

Hướng dẫn nhanh để sử dụng web image search tools.

## 🚀 Installation (5 minutes)

```bash
# 1. Navigate to skill directory
cd .claude/skills/video-resource-finder

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Verify installation
python3 tools/test.py
```

## 📖 Basic Usage

### Search for Images

```bash
python3 tools/search_web_images.py "your search query" \
  --max-results 20 \
  --confirm-copyright
```

**Example:**

```bash
python3 tools/search_web_images.py "mountain sunset" \
  --max-results 10 \
  --output search-results.json \
  --confirm-copyright
```

### Download an Image

```bash
python3 tools/download_web_image.py \
  "https://example.com/image.jpg" \
  --output "downloads/images/my-image.jpg"
```

## 🎬 Complete Workflow

### Step-by-Step Example

```bash
# Step 1: Search for images
python3 tools/search_web_images.py "cat playing piano" \
  --max-results 5 \
  --output search-results.json \
  --confirm-copyright

# Step 2: View results (requires jq)
cat search-results.json | jq '.results[] | {title, image_url}'

# Step 3: Download first image
python3 tools/download_web_image.py \
  "https://example.com/cat-piano.jpg" \
  --output downloads/images/cat-piano.jpg

# Step 4: Rename for scene matching
mv downloads/images/cat-piano.jpg downloads/images/scene_1_cat.jpg

# Step 5: Import to project (using local-asset-import skill)
local-asset-import \
  --projectDir "../../public/projects/my-video" \
  --files "downloads/images/scene_1_cat.jpg" \
  --type images
```

### Quick Test (Run Example Script)

```bash
./tools/example.sh
```

This will:
1. Search for "cat playing piano" images
2. Download the first result
3. Save to `downloads/images/example-image.jpg`

## ⚠️ Important Notes

### Copyright Warning

**ALWAYS remember:**
- Images from web search may have copyright restrictions
- Verify usage rights before using in production
- Prefer stock APIs (Pexels, Pixabay) when possible

### When to Use Web Search

Use web image search only when:
- ✅ User explicitly requests web search
- ✅ Stock APIs don't have suitable results
- ✅ You need very specific/niche content
- ✅ You will verify copyright before use

### File Naming Convention

For automatic scene matching, name files as:

```
{sceneId}_{description}.{ext}

Examples:
scene_1_mountain.jpg
item1_workspace.jpg
hook_intro.jpg
```

## 🔧 Troubleshooting

### "Module not found: duckduckgo_search"

```bash
pip install duckduckgo-search requests
```

### "Permission denied"

```bash
chmod +x tools/*.py
```

### Timeout errors

Increase timeout for large images:

```bash
python3 tools/download_web_image.py URL \
  --output FILE \
  --timeout 60
```

### No results found

Try simpler search terms:

```bash
# Too specific ❌
"cat playing piano in Paris at sunset with Eiffel Tower"

# Better ✅
"cat playing piano"
```

## 📚 More Information

- Full documentation: [tools/README.md](./README.md)
- Main skill documentation: [../SKILL.md](../SKILL.md)
- local-asset-import integration: [../SKILL.md#integration-với-local-asset-import](../SKILL.md)

## 💡 Tips

1. **Always use `--confirm-copyright`** to see copyright warning
2. **Search first, download later** - review results before downloading
3. **Use descriptive filenames** that match your scene IDs
4. **Verify image quality** before importing to project
5. **Keep backup of original URLs** in case you need to re-download

## ✅ Checklist

Before using in production:

- [ ] Installed dependencies (`pip install -r requirements.txt`)
- [ ] Tested with `python3 tools/test.py`
- [ ] Understood copyright implications
- [ ] Verified image licenses
- [ ] Named files to match scene IDs
- [ ] Ready to import with `local-asset-import`

---

**Happy searching! 🎉**

Remember: With great power comes great responsibility - always verify copyright before use.
