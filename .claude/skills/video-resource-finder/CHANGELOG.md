# Changelog

All notable changes to the video-resource-finder skill.

## [v1.4] - 2026-02-02

### Added - Web Image Search

**New Python Tools for DuckDuckGo Image Search:**

- `tools/search_web_images.py` - Search for images on the web using DuckDuckGo
  - Support for search queries with customizable max results
  - JSON output format compatible with existing resource structure
  - Built-in copyright warning system
  - Safe filename handling

- `tools/download_web_image.py` - Download images from web URLs
  - User-Agent spoofing to avoid blocks
  - Filename sanitization (path traversal protection)
  - Timeout and error handling
  - Content-type validation
  - Streaming download for large files

**Documentation:**

- `tools/README.md` - Comprehensive tool documentation
- `tools/QUICKSTART.md` - Quick start guide for new users
- `tools/example.sh` - Example workflow script
- `tools/test.py` - Test suite for verification

**Dependencies:**

- `requirements.txt` - Python dependencies
  - duckduckgo-search>=7.0.0
  - requests>=2.31.0

**SKILL.md Updates:**

- Added "WEB IMAGE SEARCH (NEW - v1.4)" section
- Updated description to include web image search capability
- Added copyright warning guidelines
- Integration guide with local-asset-import skill

### Important Notes

⚠️ **COPYRIGHT WARNING**: Images from web search may have copyright restrictions. Always:
- Confirm with users before searching web images
- Verify usage rights before using images in production
- Prefer stock APIs (Pexels, Pixabay, Unsplash) for commercial use
- Only use web search when explicitly requested or when stock APIs don't have suitable results

### Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Search images
python3 tools/search_web_images.py "your query" \
  --max-results 20 \
  --confirm-copyright

# Download image
python3 tools/download_web_image.py \
  "https://example.com/image.jpg" \
  --output "downloads/images/image.jpg"
```

### Integration

Works seamlessly with existing workflow:
1. Search web images with `search_web_images.py`
2. Download selected images with `download_web_image.py`
3. Rename to match scene IDs: `scene_1_description.jpg`
4. Import with `local-asset-import` skill

---

## [v1.3] - 2025-01-XX

### Added
- Smart filename matching for pinned resources
- Resource type selection (image/video/auto)
- Documentation: Resource Type Selection Guide

## [v1.2] - 2025-01-XX

### Added
- Batch size limiting for AI generation
- Resume capability for interrupted searches
- API quota management

## [v1.1] - 2025-01-XX

### Added
- Auto download functionality
- Quality selection (best/hd/sd/medium)
- Local storage adapter
- Download summary in resources.json

## [v1.0] - 2025-01-XX

### Initial Release
- Stock video/image search (Pexels, Pixabay, Unsplash)
- AI image generation (Gemini)
- Background music search (Pixabay)
- Sound effects search (Pixabay)
- Pinned resources support
