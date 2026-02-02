#!/usr/bin/env python3
"""
Video Script Generator CLI
Production CLI for topic-to-video workflow
"""
import argparse
import json
import sys
import re
from pathlib import Path
from utils.script_generator import ScriptGenerator
from utils.quality_checker import QualityChecker
from utils.json_builder import JSONBuilder


def slugify(text):
    """Convert text to URL-friendly slug"""
    # Convert to lowercase
    text = text.lower()
    # Remove Vietnamese accents (basic)
    replacements = {
        'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd'
    }
    for viet, latin in replacements.items():
        text = text.replace(viet, latin)
    # Replace spaces and special chars with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def main():
    parser = argparse.ArgumentParser(description="Video Script Generator")
    parser.add_argument("--topic", required=True, help="Video topic")
    parser.add_argument("--type", default="facts", help="Video type (facts, listicle, story, etc.)")
    parser.add_argument("--ratio", default="9:16", help="Aspect ratio (9:16, 16:9, 1:1, 4:5)")
    parser.add_argument("--duration", type=int, default=60, help="Target duration in seconds")
    parser.add_argument("--output", help="Output script.json path (default: auto-generated from topic)")

    args = parser.parse_args()

    # Auto-generate output path if not provided
    if not args.output:
        project_slug = slugify(args.topic)
        args.output = f"public/projects/{project_slug}/script.json"
        print(f"📝 Auto-generated project path: {project_slug}")


    print(f"🎬 Generating {args.type} video script...")
    print(f"   Topic: {args.topic}")
    print(f"   Ratio: {args.ratio}")
    print(f"   Duration: {args.duration}s")

    # Initialize components
    gen = ScriptGenerator()
    checker = QualityChecker()
    builder = JSONBuilder()

    # 1. Generate structure
    print("\n1. Generating scene structure...")
    scenes = gen.generate_structure(args.type, args.duration)

    # 2. Fill content (simplified - in production this would use LLM)
    print("2. Filling content...")

    if args.type == "facts":
        # Generate simple facts video script
        scenes[0]['text'] = f"{args.topic} - Sự thật thú vị!"
        scenes[1]['text'] = f"Vấn đề: {args.topic} có nhiều điều bạn chưa biết."
        scenes[2]['text'] = f"Sự thật: {args.topic} thực sự đáng chú ý."
        scenes[3]['text'] = f"Giải pháp: Tìm hiểu thêm về {args.topic}."
        scenes[4]['text'] = "Follow để biết thêm!"

    elif args.type == "listicle":
        # Generate listicle script
        num_items = 5
        scenes[0]['text'] = f"{num_items} điều về {args.topic}"
        for i in range(1, num_items + 1):
            if i < len(scenes) - 1:
                scenes[i]['text'] = f"Điều {i}: {args.topic} - điểm {i}"
        if len(scenes) > num_items:
            scenes[-1]['text'] = "Bấm follow để biết thêm!"

    else:
        # Default simple script
        for i, scene in enumerate(scenes):
            scene['text'] = f"{args.topic} - Phần {i + 1}"

    # Add visual suggestions
    for scene in scenes:
        scene['visualSuggestion'] = gen.suggest_visuals(scene['id'], scene['text'])

    # 3. Build full script
    full_script = " ".join([s['text'] for s in scenes])
    word_count = len(full_script.split())
    print(f"   Script: {word_count} words")

    # 4. Quality check
    print("\n3. Quality checking...")
    hook_check = checker.calculate_hook_strength(scenes[0]['text'])
    print(f"   Hook strength: {hook_check['score']}/10 - {hook_check['rating']}")

    # 5. Build JSON
    print("\n4. Building JSON...")

    script_json = builder.build_project_json(
        topic=args.topic,
        video_type=args.type,
        scenes=scenes,
        script_text=full_script,
        duration=args.duration,
        metadata={"ratio": args.ratio}  # ← Pass ratio via metadata
    )

    # 6. Save to file
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(script_json, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Script saved to: {output_path}")
    print(f"   Ratio: {args.ratio}")
    print(f"   Total scenes: {len(scenes)}")
    print(f"   Total words: {word_count}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
