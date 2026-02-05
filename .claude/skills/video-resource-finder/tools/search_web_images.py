#!/usr/bin/env python3
"""
Web Image Search Tool using DuckDuckGo
Tìm kiếm ảnh trên web và trả về danh sách URLs
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import List, Dict, Any

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
        print("Warning: Using deprecated 'duckduckgo-search' package.", file=sys.stderr)
        print("Please upgrade: pip install ddgs", file=sys.stderr)
    except ImportError:
        print("Error: ddgs library not installed.", file=sys.stderr)
        print("Please run: pip install ddgs", file=sys.stderr)
        sys.exit(1)


def search_web_images(query: str, max_results: int = 20, retry: int = 3, size: str = None, type_image: str = None) -> List[Dict[str, Any]]:
    """
    Tìm kiếm ảnh trên web bằng DuckDuckGo

    Args:
        query: Từ khóa tìm kiếm
        max_results: Số lượng kết quả tối đa (default: 20)
        retry: Số lần retry khi bị rate limit (default: 3)
        size: Kích thước ảnh (Small, Medium, Large, Wallpaper)
        type_image: Loại ảnh (photo, gif, transparent, etc)

    Returns:
        List các ảnh với thông tin: title, image_url, thumbnail, source
    """
    results = []

    for attempt in range(retry):
        try:
            # Add delay between retries to avoid rate limit
            if attempt > 0:
                delay = 2 ** attempt  # Exponential backoff: 2, 4, 8 seconds
                print(f"⏳ Retrying in {delay} seconds... (attempt {attempt + 1}/{retry})", file=sys.stderr)
                time.sleep(delay)

            with DDGS() as ddgs:
                # Search images
                search_results = ddgs.images(
                    query,
                    max_results=max_results,
                    safesearch='moderate',
                    size=size,
                    type_image=type_image
                )

                for idx, result in enumerate(search_results, 1):
                    image_url = result.get('image', '')
                    results.append({
                        'id': f'ddg-{idx}',
                        'title': result.get('title', 'Untitled'),
                        'url': result.get('source', image_url),  # Page URL for attribution
                        'image_url': image_url,  # Direct image URL (backward compat)
                        'downloadUrls': {  # Standardized format like Pexels/Pixabay
                            'original': image_url,
                            'large': image_url,
                            'medium': result.get('thumbnail', image_url),
                            'small': result.get('thumbnail', image_url)
                        },
                        'thumbnail': result.get('thumbnail', ''),
                        'source': 'duckduckgo',  # Standardized source identifier
                        'width': result.get('width', 0),
                        'height': result.get('height', 0),
                        'photographer': 'Web Source',  # Standardized field
                        'photographerUrl': result.get('source', ''),
                        'tags': [],
                        'license': 'Unknown - Verify rights before use',
                        'rank': idx,
                        'copyrightWarning': True  # Flag for UI
                    })

                # Success - break retry loop
                break

        except Exception as e:
            error_msg = str(e)

            # Check if rate limit error
            if 'ratelimit' in error_msg.lower() or '403' in error_msg:
                print(f"⚠️  Rate limit detected (attempt {attempt + 1}/{retry})", file=sys.stderr)
                if attempt == retry - 1:
                    print(f"❌ Rate limit exceeded after {retry} attempts", file=sys.stderr)
                    print("💡 Tip: Wait a few minutes before trying again", file=sys.stderr)
                continue
            else:
                print(f"Error searching DuckDuckGo: {e}", file=sys.stderr)
                return []

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Search for images on the web using DuckDuckGo'
    )
    parser.add_argument(
        'query',
        type=str,
        help='Search query'
    )
    parser.add_argument(
        '--max-results',
        type=int,
        default=20,
        help='Maximum number of results (default: 20)'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output JSON file path (optional, prints to stdout if not provided)'
    )
    parser.add_argument(
        '--confirm-copyright',
        action='store_true',
        help='Show copyright warning before searching'
    )

    parser.add_argument(
        '--size',
        type=str,
        choices=['Small', 'Medium', 'Large', 'Wallpaper'],
        help='Filter by image size (default: None)'
    )
    parser.add_argument(
        '--type-image',
        type=str,
        choices=['photo', 'clipart', 'gif', 'transparent', 'line'],
        default='photo',
        help='Filter by image type (default: photo - excludes GIFs)'
    )

    args = parser.parse_args()

    # Copyright warning
    if args.confirm_copyright:
        print("\n⚠️  COPYRIGHT WARNING / CẢNH BÁO BẢN QUYỀN", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print("Images found via web search may have copyright restrictions.", file=sys.stderr)
        print("Ảnh tìm được từ web search có thể có vấn đề về bản quyền.", file=sys.stderr)
        print("\nPlease ensure you have the right to use these images.", file=sys.stderr)
        print("Vui lòng đảm bảo bạn có quyền sử dụng những ảnh này.", file=sys.stderr)
        print("=" * 70, file=sys.stderr)

        response = input("\nDo you want to continue? (y/N): ")
        if response.lower() not in ['y', 'yes']:
            print("Search cancelled.", file=sys.stderr)
            sys.exit(0)

    # Search images
    print(f"\n🔍 Searching for: {args.query}", file=sys.stderr)
    print(f"📊 Max results: {args.max_results}", file=sys.stderr)
    if args.size:
        print(f"📐 Size: {args.size}", file=sys.stderr)
    print(f"📷 Type: {args.type_image}", file=sys.stderr)

    results = search_web_images(
        args.query, 
        args.max_results, 
        size=args.size,
        type_image=args.type_image
    )

    if not results:
        print("\n❌ No results found", file=sys.stderr)
        sys.exit(1)

    print(f"\n✅ Found {len(results)} images", file=sys.stderr)

    # Build output
    output = {
        'query': args.query,
        'total': len(results),
        'source': 'duckduckgo',
        'results': results,
        'copyright_warning': 'Images may have copyright restrictions. Verify usage rights before use.'
    }

    # Write output
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Saved to: {output_path}", file=sys.stderr)
    else:
        # Print to stdout
        print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
