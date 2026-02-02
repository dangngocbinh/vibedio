#!/usr/bin/env python3
"""
Web Image Downloader
Download images from web URLs with proper error handling
"""

import argparse
import sys
import os
from pathlib import Path
from urllib.parse import urlparse
import hashlib

try:
    import requests
except ImportError:
    print("Error: requests library not installed.", file=sys.stderr)
    print("Please run: pip install requests", file=sys.stderr)
    sys.exit(1)


# User-Agent to avoid being blocked
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'


def sanitize_filename(filename: str) -> str:
    """
    Validate and sanitize filename to prevent path traversal
    """
    # First replace .. to prevent path traversal
    filename = filename.replace('..', '__')

    # Remove path separators
    filename = filename.replace('/', '_').replace('\\', '_')

    # Remove potentially dangerous characters
    dangerous_chars = ['~', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')

    return filename


def download_image(url: str, output_path: str, timeout: int = 30) -> bool:
    """
    Download image from URL

    Args:
        url: Image URL
        output_path: Output file path
        timeout: Request timeout in seconds

    Returns:
        True if successful, False otherwise
    """
    try:
        # Validate output path
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Download with User-Agent header
        headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=timeout,
            stream=True
        )
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            print(f"Warning: URL does not return an image (content-type: {content_type})", file=sys.stderr)

        # Write file
        with open(output_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = output_file.stat().st_size
        print(f"✅ Downloaded: {output_file} ({file_size:,} bytes)", file=sys.stderr)
        return True

    except requests.exceptions.Timeout:
        print(f"❌ Timeout: {url}", file=sys.stderr)
        return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}", file=sys.stderr)
        return False

    except OSError as e:
        print(f"❌ File write error: {e}", file=sys.stderr)
        return False

    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Download image from web URL'
    )
    parser.add_argument(
        'url',
        type=str,
        help='Image URL to download'
    )
    parser.add_argument(
        '--output',
        type=str,
        required=True,
        help='Output file path'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='Request timeout in seconds (default: 30)'
    )

    args = parser.parse_args()

    # Sanitize output filename
    output_path = Path(args.output)
    safe_filename = sanitize_filename(output_path.name)

    if safe_filename != output_path.name:
        print(f"⚠️  Filename sanitized: {output_path.name} -> {safe_filename}", file=sys.stderr)
        output_path = output_path.parent / safe_filename

    # Download
    print(f"🔽 Downloading: {args.url}", file=sys.stderr)

    success = download_image(args.url, str(output_path), args.timeout)

    if success:
        print(f"\n✅ Success: {output_path}")
        sys.exit(0)
    else:
        print(f"\n❌ Failed to download image", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
