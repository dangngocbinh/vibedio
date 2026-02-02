# Web Image Search Tools

Python tools for searching and downloading images from the web using DuckDuckGo.

## ⚠️ COPYRIGHT WARNING

**Images from web search may have copyright restrictions.**

- Always verify usage rights before using images in your projects
- Prefer stock APIs (Pexels, Pixabay, Unsplash) for commercial use
- Only use web search when explicitly needed

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt
```

**Dependencies:**
- `duckduckgo-search>=7.0.0` - DuckDuckGo search API
- `requests>=2.31.0` - HTTP requests and downloads

## Tools

### 1. search_web_images.py

Search for images on the web using DuckDuckGo.

**Usage:**

```bash
# Basic search with copyright warning
python tools/search_web_images.py "sunset beach" \
  --max-results 20 \
  --confirm-copyright

# Save results to JSON
python tools/search_web_images.py "cat playing piano" \
  --max-results 10 \
  --output search-results.json \
  --confirm-copyright

# Quick search without confirmation (stdout)
python tools/search_web_images.py "nature landscape" --max-results 5
```

**Parameters:**
- `query` (required): Search keywords
- `--max-results`: Maximum number of results (default: 20)
- `--output`: Output JSON file path (optional, prints to stdout if not provided)
- `--confirm-copyright`: Show copyright warning before searching

**Output:**

```json
{
  "query": "sunset beach",
  "total": 20,
  "source": "duckduckgo",
  "results": [
    {
      "id": "ddg-1",
      "title": "Beautiful Sunset Beach",
      "image_url": "https://example.com/sunset.jpg",
      "thumbnail": "https://example.com/thumb.jpg",
      "source": "example.com",
      "width": 1920,
      "height": 1080,
      "rank": 1
    }
  ],
  "copyright_warning": "Images may have copyright restrictions. Verify usage rights before use."
}
```

### 2. download_web_image.py

Download image from web URL with proper error handling and security.

**Usage:**

```bash
# Download single image
python tools/download_web_image.py \
  "https://example.com/image.jpg" \
  --output "downloads/images/my-image.jpg"

# With custom timeout
python tools/download_web_image.py \
  "https://example.com/large-image.jpg" \
  --output "downloads/images/large.jpg" \
  --timeout 60
```

**Parameters:**
- `url` (required): Image URL to download
- `--output` (required): Output file path
- `--timeout`: Request timeout in seconds (default: 30)

**Features:**
- ✅ User-Agent header to avoid being blocked
- ✅ Filename sanitization (prevents path traversal attacks)
- ✅ Timeout and error handling
- ✅ Content-type validation
- ✅ Streaming download for large files

## Complete Workflow Example

```bash
# Step 1: Search for images
python tools/search_web_images.py "mountain landscape" \
  --max-results 10 \
  --output search-results.json \
  --confirm-copyright

# Step 2: Review results
cat search-results.json | jq '.results[] | {title, image_url}'

# Step 3: Download selected image
python tools/download_web_image.py \
  "https://example.com/mountain.jpg" \
  --output "downloads/images/mountain_1.jpg"

# Step 4: Import to project (using local-asset-import skill)
# Rename file to match scene: scene_1_mountain.jpg
mv downloads/images/mountain_1.jpg downloads/images/scene_1_mountain.jpg

# Import to project
local-asset-import \
  --projectDir "../../public/projects/my-video" \
  --files "downloads/images/scene_1_mountain.jpg" \
  --type images
```

## Integration with local-asset-import

For best results, rename downloaded images to match scene IDs before importing:

```bash
# Format: {sceneId}_{description}.ext
# Examples:
scene_1_mountain.jpg
item1_workspace.jpg
hook_intro.jpg
```

Then use `local-asset-import` skill:

```bash
local-asset-import \
  --projectDir "public/projects/my-video" \
  --files "downloads/images/*.jpg" \
  --type images
```

The skill will:
- Automatically detect sceneId from filename
- Copy to `imports/images/`
- Update `resources.json` with `pinnedResources`

## Batch Download Example

```bash
#!/bin/bash
# Download multiple images from search results

# Parse JSON and download top 3 results
jq -r '.results[0:3] | .[] | .image_url' search-results.json | while read url; do
  filename=$(echo "$url" | md5sum | cut -d' ' -f1)
  python tools/download_web_image.py "$url" \
    --output "downloads/images/${filename}.jpg"
done
```

## Security Features

### Filename Sanitization

The download tool automatically sanitizes filenames to prevent security issues:

- Removes path separators (`/`, `\\`)
- Removes dangerous characters (`..`, `~`, `<`, `>`, `:`, `"`, `|`, `?`, `*`)
- Prevents path traversal attacks

**Example:**

```bash
# Input: --output "../../etc/passwd"
# Sanitized: "..___.._etc_passwd"
```

### User-Agent Spoofing

Downloads use a modern browser User-Agent to avoid being blocked:

```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

## Error Handling

Both tools handle common errors gracefully:

- **Network errors**: Timeout, connection refused, DNS errors
- **HTTP errors**: 404, 403, 500, etc.
- **File errors**: Permission denied, disk full, invalid path
- **Content errors**: Invalid image format, corrupted data

All errors are printed to stderr with clear messages.

## Tips

1. **Always use `--confirm-copyright`** when searching to be reminded of copyright issues
2. **Prefer stock APIs** (Pexels, Pixabay) for commercial use
3. **Verify image licenses** before using in production
4. **Use descriptive queries** for better results
5. **Rename files to match scene IDs** before importing to projects

## Troubleshooting

### Module not found

```bash
pip install -r requirements.txt
```

### Permission denied

```bash
chmod +x tools/*.py
```

### Timeout errors

Increase timeout for large images:

```bash
python tools/download_web_image.py URL --output FILE --timeout 60
```

### No results found

Try different search queries:

```bash
# Too specific
python tools/search_web_images.py "cat playing piano in Paris at sunset"

# Better
python tools/search_web_images.py "cat playing piano"
```
