#!/usr/bin/env python3
"""
Write Intermediate File Helper
===============================
Helper script to ensure intermediate files (sections, scenes) are written
to the correct location: public/projects/{project-name}/init/

Usage:
    python write_intermediate.py --project <dir> --type <section|scenes> --id <name> --content <json/text>
"""

import argparse
import json
import sys
from pathlib import Path
from file_manager import FileManager

def main():
    parser = argparse.ArgumentParser(description="Write intermediate files to correct location")
    parser.add_argument('--project', required=True, help='Project directory')
    parser.add_argument('--type', required=True, choices=['section', 'scenes'],
                        help='File type: section (text) or scenes (json)')
    parser.add_argument('--id', required=True, help='Section ID (e.g., intro, fitness)')
    parser.add_argument('--content', help='Content to write (for section text)')
    parser.add_argument('--content-file', help='Path to file containing content')

    args = parser.parse_args()

    try:
        # Initialize file manager
        fm = FileManager(args.project)

        # Read content
        if args.content_file:
            with open(args.content_file, 'r', encoding='utf-8') as f:
                content = f.read()
        elif args.content:
            content = args.content
        else:
            print("❌ Error: Either --content or --content-file must be provided")
            return 1

        # Write to correct location
        if args.type == 'section':
            output_path = fm.get_section_text_path(args.id)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Section text written to: {output_path}")

        elif args.type == 'scenes':
            output_path = fm.get_scenes_file_path(args.id)
            # Validate JSON
            try:
                scenes_data = json.loads(content)
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(scenes_data, f, indent=2, ensure_ascii=False)
                print(f"✅ Scenes file written to: {output_path}")
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON: {e}")
                return 1

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
