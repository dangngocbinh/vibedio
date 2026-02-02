# Video Resource Finder - Web Image Search Update

## 🎉 What's New

Skill `video-resource-finder` đã được cập nhật với khả năng **tìm kiếm ảnh trên web** bằng DuckDuckGo.

### New Features

✅ **Web Image Search via DuckDuckGo**
- Tìm kiếm ảnh trên toàn web (không giới hạn ở stock APIs)
- Hỗ trợ tìm kiếm niche content, specific images
- Tự động cảnh báo về vấn đề bản quyền

✅ **Smart Image Download**
- Download ảnh với User-Agent header (tránh bị block)
- Filename sanitization (bảo mật)
- Error handling và timeout
- Content validation

✅ **Integration với local-asset-import**
- Workflow hoàn chỉnh từ search → download → import
- Tự động rename và update resources.json
- Scene ID matching

## 📁 Files Added

```
.claude/skills/video-resource-finder/
├── requirements.txt                    # Python dependencies
├── tools/
│   ├── search_web_images.py           # Web search tool
│   ├── download_web_image.py          # Image downloader
│   ├── test.py                        # Test suite
│   ├── example.sh                     # Example workflow
│   ├── README.md                      # Full documentation
│   └── QUICKSTART.md                  # Quick start guide
├── CHANGELOG.md                        # Version history
└── SKILL.md (updated)                 # Added WEB IMAGE SEARCH section
```

## ⚠️ Important: Copyright Warning

**Images from web search may have copyright restrictions!**

Khi sử dụng web image search:
- ✅ Luôn confirm với user trước khi search
- ✅ Nhắc nhở về vấn đề bản quyền
- ✅ Ưu tiên dùng stock APIs (Pexels, Pixabay) trước
- ✅ Chỉ dùng web search khi:
  - User yêu cầu chủ động
  - Stock APIs không có kết quả phù hợp
  - Cần ảnh rất specific/niche

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd .claude/skills/video-resource-finder
pip install -r requirements.txt
```

**Dependencies:**
- `duckduckgo-search>=7.0.0`
- `requests>=2.31.0`

### 2. Verify Installation

```bash
python3 tools/test.py
```

### 3. Search Images

```bash
python3 tools/search_web_images.py "cat playing piano" \
  --max-results 20 \
  --confirm-copyright
```

### 4. Download Image

```bash
python3 tools/download_web_image.py \
  "https://example.com/image.jpg" \
  --output "downloads/images/my-image.jpg"
```

## 📖 Usage Examples

### Example 1: Quick Search

```bash
# Search and save results
python3 tools/search_web_images.py "sunset beach" \
  --max-results 10 \
  --output search-results.json \
  --confirm-copyright

# View results (requires jq)
cat search-results.json | jq '.results[] | {title, image_url}'
```

### Example 2: Complete Workflow

```bash
# 1. Search
python3 tools/search_web_images.py "nature landscape" \
  --output search.json \
  --confirm-copyright

# 2. Download (manual - choose URL from search.json)
python3 tools/download_web_image.py \
  "https://example.com/landscape.jpg" \
  --output downloads/images/nature.jpg

# 3. Rename to match scene
mv downloads/images/nature.jpg downloads/images/scene_1_nature.jpg

# 4. Import to project
local-asset-import \
  --projectDir "public/projects/my-video" \
  --files "downloads/images/scene_1_nature.jpg" \
  --type images
```

### Example 3: Run Full Example

```bash
./tools/example.sh
```

## 🔧 Technical Details

### Tools Overview

| Tool | Purpose | Key Features |
|------|---------|-------------|
| `search_web_images.py` | Web image search | DuckDuckGo API, JSON output, copyright warning |
| `download_web_image.py` | Image download | User-Agent spoofing, sanitization, error handling |
| `test.py` | Verification | Test imports, search, filename sanitization |
| `example.sh` | Demo workflow | End-to-end example |

### Security Features

✅ **Filename Sanitization**
- Removes path separators (`/`, `\`)
- Replaces dangerous characters
- Prevents path traversal attacks

✅ **User-Agent Spoofing**
- Modern browser User-Agent
- Avoids being blocked by servers

✅ **Error Handling**
- Network errors (timeout, connection)
- HTTP errors (404, 403, 500)
- File errors (permission, disk space)

### Output Format

Search results format:

```json
{
  "query": "cat playing piano",
  "total": 20,
  "source": "duckduckgo",
  "results": [
    {
      "id": "ddg-1",
      "title": "Cat Playing Piano",
      "image_url": "https://...",
      "thumbnail": "https://...",
      "source": "example.com",
      "width": 1920,
      "height": 1080,
      "rank": 1
    }
  ],
  "copyright_warning": "Images may have copyright restrictions..."
}
```

## 💡 When to Use

### ✅ Use Web Search When:

- User explicitly requests: "search web for images"
- Stock APIs don't have suitable results
- Need very specific/niche content
- User acknowledges copyright implications

### ❌ Don't Use Web Search When:

- Stock APIs (Pexels, Pixabay) have good results
- Need guaranteed free-to-use images
- For commercial projects without verification
- User hasn't confirmed copyright understanding

## 📚 Documentation

- **Quick Start**: `tools/QUICKSTART.md`
- **Full Documentation**: `tools/README.md`
- **Main Skill**: `SKILL.md` (section: WEB IMAGE SEARCH)
- **Changelog**: `CHANGELOG.md`

## 🧪 Testing

Run test suite:

```bash
python3 tools/test.py
```

Tests verify:
- ✅ Dependencies installed
- ✅ DuckDuckGo search working
- ✅ Filename sanitization working

## 🔄 Integration Flow

```
Web Search → Download → Rename → Import → Update resources.json
     ↓            ↓         ↓         ↓              ↓
search_web   download   manual   local-asset    resources.json
images.py    _web_      rename   -import        with pinned
             image.py            skill          resources
```

## ✅ Next Steps

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Test installation**: `python3 tools/test.py`
3. **Try example**: `./tools/example.sh`
4. **Read docs**: `tools/QUICKSTART.md`
5. **Start using**: Search → Download → Import

---

**Questions?**
- Check `tools/README.md` for detailed documentation
- Check `tools/QUICKSTART.md` for quick examples
- Check `SKILL.md` for full skill documentation

**Remember**: Always verify copyright before using web images! 🔍⚖️
