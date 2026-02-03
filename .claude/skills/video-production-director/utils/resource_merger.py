#!/usr/bin/env python3
"""
Resource Merger
Merges resources.json into script.json (resourceCandidates + selectedResourceId)
"""
import argparse
import json
import sys
from pathlib import Path
from scene_utils import merge_resources_into_sections


def merge_resources(project_dir: str) -> bool:
    """
    Merge resources.json into script.json

    Args:
        project_dir: Path to project directory

    Returns:
        True if successful, False otherwise
    """
    project_path = Path(project_dir)
    script_path = project_path / 'script.json'
    resources_path = project_path / 'resources.json'

    # Validate paths
    if not script_path.exists():
        print(f"❌ script.json not found: {script_path}")
        return False

    if not resources_path.exists():
        print(f"❌ resources.json not found: {resources_path}")
        return False

    # Load files
    print(f"📂 Loading files from {project_dir}")
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            script = json.load(f)

        with open(resources_path, 'r', encoding='utf-8') as f:
            resources = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load JSON files: {e}")
        return False

    # Check if script has sections
    if 'sections' not in script:
        print("❌ script.json does not have 'sections' field")
        print("   This tool requires the new sections + scenes structure")
        return False

    sections = script['sections']
    print(f"   Found {len(sections)} sections")

    # Count scenes
    total_scenes = sum(len(s.get('scenes', [])) for s in sections)
    print(f"   Found {total_scenes} total scenes")

    # Merge resources
    print("\n🔄 Merging resources into scenes...")
    updated_sections = merge_resources_into_sections(sections, resources)

    # Count merged resources
    merged_count = 0
    selected_count = 0
    for section in updated_sections:
        for scene in section.get('scenes', []):
            candidates = scene.get('resourceCandidates', [])
            merged_count += len(candidates)
            if scene.get('selectedResourceId'):
                selected_count += 1

    print(f"   ✓ Merged {merged_count} resource candidates")
    print(f"   ✓ Auto-selected {selected_count} resources")

    # Update script
    script['sections'] = updated_sections

    # Save
    print(f"\n💾 Saving updated script.json...")
    try:
        with open(script_path, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)
        print(f"   ✓ Saved to {script_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to save script.json: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Merge resources.json into script.json"
    )
    parser.add_argument(
        '--project-dir',
        required=True,
        help="Path to project directory containing script.json and resources.json"
    )

    args = parser.parse_args()

    success = merge_resources(args.project_dir)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
