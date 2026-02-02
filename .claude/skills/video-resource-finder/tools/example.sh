#!/bin/bash
# Example workflow: Search and download web images

set -e  # Exit on error

echo "=========================================="
echo "Web Image Search - Example Workflow"
echo "=========================================="
echo ""

# Check if dependencies are installed
echo "🔍 Checking dependencies..."
python3 -c "import duckduckgo_search" 2>/dev/null || {
    echo "❌ duckduckgo-search not installed"
    echo "Run: pip install -r requirements.txt"
    exit 1
}

python3 -c "import requests" 2>/dev/null || {
    echo "❌ requests not installed"
    echo "Run: pip install -r requirements.txt"
    exit 1
}

echo "✅ Dependencies OK"
echo ""

# Create output directory
mkdir -p downloads/images

# Step 1: Search for images
echo "=========================================="
echo "Step 1: Searching for images..."
echo "=========================================="
echo ""

python3 tools/search_web_images.py "cat playing piano" \
  --max-results 5 \
  --output downloads/search-results.json \
  --confirm-copyright

echo ""
echo "✅ Search complete"
echo ""

# Step 2: Show results
echo "=========================================="
echo "Step 2: Search Results"
echo "=========================================="
echo ""

if command -v jq &> /dev/null; then
    echo "Found $(jq '.total' downloads/search-results.json) images:"
    echo ""
    jq -r '.results[] | "\(.rank). \(.title)\n   URL: \(.image_url)\n"' downloads/search-results.json
else
    echo "Results saved to: downloads/search-results.json"
    echo "(Install jq to see formatted results: brew install jq)"
fi

echo ""

# Step 3: Download first image
echo "=========================================="
echo "Step 3: Downloading first image..."
echo "=========================================="
echo ""

FIRST_IMAGE_URL=$(python3 -c "
import json
with open('downloads/search-results.json') as f:
    data = json.load(f)
    print(data['results'][0]['image_url'])
")

python3 tools/download_web_image.py "$FIRST_IMAGE_URL" \
  --output downloads/images/example-image.jpg \
  --timeout 30

echo ""
echo "✅ Download complete"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "📁 Files created:"
echo "   - downloads/search-results.json"
echo "   - downloads/images/example-image.jpg"
echo ""
echo "Next steps:"
echo "1. Review downloaded image: open downloads/images/example-image.jpg"
echo "2. Rename to match scene ID: mv downloads/images/example-image.jpg downloads/images/scene_1_cat.jpg"
echo "3. Import to project: local-asset-import --projectDir YOUR_PROJECT --files downloads/images/scene_1_cat.jpg"
echo ""
echo "✅ Done!"
