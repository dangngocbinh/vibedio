# Rate Limits & Best Practices

## 📊 DuckDuckGo Rate Limits

### Current Status (Tested 2026-02-02)

DuckDuckGo does NOT publish official rate limits, but based on extensive testing:

**✅ GOOD NEWS - No Strict Rate Limits with `ddgs` package!**

**Test Results:**
- ✅ **20/20 consecutive searches**: ALL successful
- ✅ **No delay needed**: Can search at ~1.1 searches/second
- ✅ **No rate limiting**: With new `ddgs>=1.0.0` package

**Previous Issues (Resolved):**
- ❌ Old `duckduckgo-search` package: Had strict rate limits
- ✅ New `ddgs` package: Much more reliable

**Recommendation:**
- ✅ Use `ddgs>=1.0.0` (current)
- ✅ No need to add delays between searches
- ✅ Can batch process multiple queries

### Rate Limit Error (Rare with ddgs package)

If you encounter rate limit (very unlikely with `ddgs>=1.0.0`):

```
⚠️  Rate limit detected (attempt 1/3)
⏳ Retrying in 2 seconds... (attempt 2/3)
```

### Built-in Rate Limit Handling (Safety Net)

Tool has retry logic as safety net:
- ✅ **Retries** 3 times with exponential backoff (2s, 4s, 8s)
- ✅ **Detects** rate limit errors (403, "ratelimit" in message)
- ✅ **Shows** helpful tips when limit exceeded

**Note:** With `ddgs>=1.0.0`, rate limits are **very rare** in practice.

## 🎯 Image Selection Strategy

### How Tool Ranks Images

Tool returns images in **DuckDuckGo's default ranking**:

```json
{
  "rank": 1,  // Position in search results (1 = best match)
  "title": "Beach During Sunset",
  "image_url": "https://...",
  "width": 3387,
  "height": 2250
}
```

### Ranking Factors (Estimated)

DuckDuckGo likely considers:
1. **Relevance** - How well image matches query
2. **Quality** - Resolution, clarity
3. **Source Reputation** - Getty, Pexels, etc. ranked higher
4. **Freshness** - Newer images may rank higher
5. **Engagement** - Popular images rank higher

### Multiple Results Strategy

When tool returns 10 results:
- **rank: 1** = Best match (most relevant, highest quality)
- **rank: 2-3** = Good alternatives
- **rank: 4-7** = Decent options
- **rank: 8-10** = Less relevant fallbacks

**Recommendation:**
- Use `--max-results 5` for focused search
- Use `--max-results 20` for variety
- Review top 3-5 manually before downloading

## 💡 Best Practices

### 1. Rate Limits (Not an Issue!)

**✅ NEW: No Delays Needed with ddgs Package**

You can search continuously:
```bash
# Multiple consecutive searches - ALL WORK! ✅
python3 tools/search_web_images.py "query1" --max-results 20
python3 tools/search_web_images.py "query2" --max-results 20  # ✅ Works
python3 tools/search_web_images.py "query3" --max-results 20  # ✅ Works
python3 tools/search_web_images.py "query4" --max-results 20  # ✅ Works
```

**Tested:** 20 consecutive searches without delays - all successful!

**Optional Delays (If Preferred):**
```bash
# Add small delay for politeness (not required)
python3 tools/search_web_images.py "query1" --max-results 10
sleep 1  # Optional courtesy delay
python3 tools/search_web_images.py "query2" --max-results 10
```

### 2. Optimize Search Queries

**Good Queries (Specific):**
- ✅ "sunset beach orange sky"
- ✅ "cat playing piano keys"
- ✅ "mountain landscape snow peaks"

**Bad Queries (Too Generic):**
- ❌ "image"
- ❌ "photo"
- ❌ "picture of something"

### 3. Select Right Max Results

| Use Case | Recommended Max |
|----------|----------------|
| Quick search | 5 |
| Normal search | 10 |
| Need variety | 20 |
| Batch processing | 5 (to avoid rate limit) |

### 4. Review Before Downloading

Always review search results before batch downloading:

```bash
# Step 1: Search
python3 tools/search_web_images.py "sunset" \
  --output search.json \
  --max-results 10

# Step 2: Review results
cat search.json | jq '.results[] | {rank, title, image_url}'

# Step 3: Download only selected images (manually)
python3 tools/download_web_image.py \
  "https://..." \
  --output downloads/images/sunset_1.jpg
```

### 5. Use Retry Logic

Tool has built-in retry, but you can also retry manually:

```bash
# First attempt
python3 tools/search_web_images.py "query" --max-results 10

# If rate limited, wait and retry
sleep 120  # Wait 2 minutes
python3 tools/search_web_images.py "query" --max-results 10
```

## 🔄 Comparison: Stock APIs vs Web Search

| Feature | Pexels/Pixabay | DuckDuckGo Web |
|---------|----------------|----------------|
| **Rate Limits** | High (200-5000/hour) | Low (~2-3/minute) |
| **Quality** | Curated, high quality | Variable quality |
| **License** | Guaranteed free | Unknown, verify needed |
| **Speed** | Fast | Slower (rate limits) |
| **Variety** | Limited stock | Entire web |
| **Use Case** | Production | Niche/specific content |

**Recommendation:**
1. **First choice**: Stock APIs (Pexels, Pixabay, Unsplash)
2. **Second choice**: AI generation (Gemini)
3. **Last resort**: DuckDuckGo web search (when above don't work)

## 📈 Rate Limit Recovery

If you hit rate limit:

1. **Wait 2-5 minutes** before next search
2. **Use VPN** (may help, but not guaranteed)
3. **Reduce max_results** to 5 or less
4. **Switch to stock APIs** for batch operations

## 🚨 Common Issues

### "403 Ratelimit" immediately

**Cause:** DuckDuckGo detected automation
**Solution:**
- Wait 5-10 minutes
- Use smaller max_results (5 instead of 20)
- Try from different IP (VPN)

### No results found

**Cause:** Query too specific or rate limited
**Solution:**
- Simplify query
- Check internet connection
- Wait and retry

### All results low quality

**Cause:** Generic query or low rank results
**Solution:**
- Use more specific query
- Reduce max_results to get only top matches
- Try stock APIs instead

## ✅ Summary

**Rate Limits:**
- ~2-3 searches per minute
- Automatic retry with exponential backoff
- Wait 2-5 minutes if exceeded

**Image Selection:**
- Rank 1 = Best match
- Review top 3-5 results
- Download selectively

**Best Practices:**
- Prefer stock APIs for production
- Use web search for niche content only
- Always verify copyright before use
- Space out searches to avoid rate limits

---

**Remember:** DuckDuckGo web search is a fallback option, not primary source! ⚠️
