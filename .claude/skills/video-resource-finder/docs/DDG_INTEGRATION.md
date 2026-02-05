# DuckDuckGo Web Search Integration

## Overview

DDG web search is now **fully standardized** to match Pexels/Pixabay format, ensuring consistent behavior across all resource providers.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Search Layer (Standardized Output)                      │
├─────────────────────────────────────────────────────────┤
│  • PexelsClient     → Pexels API                         │
│  • PixabayClient    → Pixabay API                        │
│  • DDGClient        → Python DDG tools (NEW)             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Download Layer (URL → localPath)                        │
├─────────────────────────────────────────────────────────┤
│  • file-downloader.js  → Generic HTTP downloader         │
│  • ddg-downloader.js   → DDG-specific (NEW)              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Import Layer (downloads/ → imports/)                    │
├─────────────────────────────────────────────────────────┤
│  • ImportManager      → Unified import logic             │
└─────────────────────────────────────────────────────────┘
```

## Standardized Format

All providers (Pexels, Pixabay, DDG) now return the same format:

```javascript
{
  id: "ddg-1",                    // Unique identifier
  title: "Image title",            // Image title/alt text
  url: "https://source-page.com",  // Page URL (for attribution)
  downloadUrls: {                  // ⭐ Standardized download URLs
    original: "https://...",
    large: "https://...",
    medium: "https://...",
    small: "https://..."
  },
  width: 1920,
  height: 1080,
  photographer: "Web Source",      // ⭐ Standardized
  photographerUrl: "https://...",
  tags: [],
  license: "Unknown - Verify rights before use",  // ⭐ Copyright notice
  source: "duckduckgo",           // ⭐ Provider identifier
  rank: 1,
  copyrightWarning: true          // ⭐ Show warning in UI
}
```

## Key Differences: DDG vs Pexels/Pixabay

| Feature | Pexels/Pixabay | DDG Web Search |
|---------|----------------|----------------|
| **License** | Free to use (verified) | Unknown - requires verification |
| **Copyright** | Pre-cleared | ⚠️ User must verify |
| **Attribution** | Optional | Recommended |
| **Quality** | High (stock photos) | Variable (web scraping) |
| **Reliability** | Stable APIs | Rate limits possible |

## Usage

### 1. Search Images

```javascript
const DDGClient = require('./scripts/api/ddg-client');

const client = new DDGClient();
const results = await client.searchPhotos('cat jumping', 10);

// Results are in standardized format
console.log(results[0].downloadUrls.original);
```

### 2. Download Images

```javascript
const DDGDownloader = require('./scripts/downloader/ddg-downloader');

const downloader = new DDGDownloader();
const result = await downloader.downloadImage(
  image,
  '/path/to/project/downloads/images',
  'scene_id'
);

console.log(result.localPath); // Local file path
```

### 3. Import to Project

```javascript
// Same as other providers - no special handling needed
const ImportManager = require('./scripts/utils/import-manager');

const manager = new ImportManager(projectDir);
await manager.importResources(selections);
```

## File Organization

DDG images follow the same structure as Pexels/Pixabay:

```
public/projects/{project-name}/
├── downloads/              # Staging area (temporary)
│   └── images/
│       └── scene_ddg_123.jpg
├── imports/                # Permanent storage
│   └── images/
│       └── scene_selected_ddg_123.jpg
└── resources.json          # Updated with importedPath
```

## Copyright Compliance

**⚠️ IMPORTANT**: DDG web search returns images from various sources with unknown licensing.

### User Responsibilities

1. **Verify Rights**: Check image source and license before use
2. **Attribution**: Provide credit to original source when required
3. **Commercial Use**: Ensure images are cleared for commercial use
4. **Fair Use**: Follow fair use guidelines in your jurisdiction

### In-App Warnings

DDG results include `copyrightWarning: true` flag:

```javascript
if (image.copyrightWarning) {
  showWarning("Please verify usage rights for this image");
}
```

UI should display prominent copyright warnings for DDG results.

## Dependencies

### Python Packages

```bash
pip3 install ddgs requests
```

### Verification

```bash
python3 -c "import ddgs; import requests; print('✅ OK')"
```

Or use the built-in check:

```javascript
const DDGClient = require('./scripts/api/ddg-client');
DDGClient.checkDependencies(); // Returns true/false
```

## Error Handling

### Rate Limits

DDG may impose rate limits. The client handles this with:

- Exponential backoff (2, 4, 8 seconds)
- Retry up to 3 times
- Clear error messages

```javascript
// Rate limit example
try {
  const results = await client.searchPhotos(query);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    console.log('Wait a few minutes before retrying');
  }
}
```

### Download Failures

```javascript
const result = await downloader.downloadImage(image, targetDir, sceneId);

if (!result.success) {
  console.error(`Failed: ${result.error}`);
  // Handle failure (skip resource, show error, etc.)
}
```

## Testing

### Manual Test

```bash
# Search test
python3 .claude/skills/video-resource-finder/tools/search_web_images.py \
  "cat jumping" \
  --max-results 5 \
  --output /tmp/ddg-test.json

# Download test
python3 .claude/skills/video-resource-finder/tools/download_web_image.py \
  "https://example.com/image.jpg" \
  --output /tmp/test-image.jpg
```

### Automated Test

```bash
cd .claude/skills/video-resource-finder
python3 tools/test.py
```

## Integration Checklist

When adding DDG search to a project:

- [x] ✅ Standardized output format
- [x] ✅ Download to staging area (downloads/)
- [x] ✅ Import to permanent storage (imports/)
- [x] ✅ Update resources.json with localPath
- [x] ✅ Copyright warnings in metadata
- [ ] ⚠️ UI displays copyright warnings
- [ ] ⚠️ User acknowledges license verification

## Migration Guide

If you have old DDG search code:

### Before (non-standard)

```javascript
{
  image_url: "https://...",  // Non-standard field
  source: "https://...",     // Ambiguous
  // Missing standardized fields
}
```

### After (standardized)

```javascript
{
  url: "https://source-page",
  downloadUrls: {
    original: "https://..."
  },
  source: "duckduckgo",
  photographer: "Web Source",
  license: "Unknown - Verify rights"
}
```

## Best Practices

1. **Prefer Stock APIs**: Use Pexels/Pixabay first, DDG as fallback
2. **Cache Results**: DDG has rate limits, cache search results
3. **Verify Licenses**: Always check image rights before production use
4. **Provide Attribution**: Link back to source when possible
5. **Monitor Quality**: Web images vary in quality, validate resolution

## Support

For issues or questions:
- Check `tools/test.py` for verification
- Review error logs in console
- Ensure Python dependencies are installed
- Check rate limit warnings

---

**Updated**: 2026-02-05
**Status**: Production Ready ✅
