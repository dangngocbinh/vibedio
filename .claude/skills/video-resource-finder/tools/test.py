#!/usr/bin/env python3
"""
Test script to verify tools are working correctly
"""

import sys
from pathlib import Path

def test_imports():
    """Test if required packages are installed"""
    print("Testing imports...")

    try:
        import duckduckgo_search
        print("✅ duckduckgo-search installed")
    except ImportError:
        print("❌ duckduckgo-search not installed")
        print("   Run: pip install duckduckgo-search")
        return False

    try:
        import requests
        print("✅ requests installed")
    except ImportError:
        print("❌ requests not installed")
        print("   Run: pip install requests")
        return False

    return True


def test_search():
    """Test search_web_images.py"""
    print("\nTesting search_web_images.py...")

    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            results = list(ddgs.images(
                keywords="test",
                max_results=1,
                safesearch='moderate'
            ))

            if results:
                print("✅ DuckDuckGo search working")
                print(f"   Sample result: {results[0].get('title', 'N/A')}")
                return True
            else:
                print("⚠️  No results found (this may be normal)")
                return True

    except Exception as e:
        print(f"❌ Search test failed: {e}")
        return False


def test_file_sanitization():
    """Test filename sanitization"""
    print("\nTesting filename sanitization...")

    # Import the sanitize function
    sys.path.insert(0, str(Path(__file__).parent))
    from download_web_image import sanitize_filename

    test_cases = [
        ("normal_file.jpg", "normal_file.jpg"),
        ("../../etc/passwd", "..___.._etc_passwd"),
        ("file/with/slashes.jpg", "file_with_slashes.jpg"),
        ("dangerous<>chars.jpg", "dangerous__chars.jpg"),
    ]

    all_passed = True
    for input_name, expected in test_cases:
        result = sanitize_filename(input_name)
        if result == expected:
            print(f"✅ {input_name!r} -> {result!r}")
        else:
            print(f"❌ {input_name!r} -> {result!r} (expected {expected!r})")
            all_passed = False

    return all_passed


def main():
    print("=" * 60)
    print("Web Image Search Tools - Test Suite")
    print("=" * 60)
    print()

    tests = [
        ("Imports", test_imports),
        ("Search", test_search),
        ("Filename Sanitization", test_file_sanitization),
    ]

    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")

    print()
    print(f"Result: {passed_count}/{total_count} tests passed")

    if passed_count == total_count:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
