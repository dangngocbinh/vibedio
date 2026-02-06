import json
import os
import argparse
from pathlib import Path
from thefuzz import fuzz, process
import shutil

def load_script(project_dir):
    with open(f"{project_dir}/script.json", 'r') as f:
        return json.load(f)

def get_scene_text(scene):
    # Combine relevant text fields for matching
    texts = []
    if scene.get('text'): texts.append(scene['text'])
    if scene.get('visualDescription'): texts.append(scene['visualDescription'])
    if scene.get('id'): texts.append(scene['id'].replace('_', ' '))
    return " ".join(texts)

def find_best_match(scene_text, files, threshold=60):
    # Using partial_token_sort_ratio for better matching with long descriptions vs short filenames
    best_match = process.extractOne(scene_text, files, scorer=fuzz.partial_token_sort_ratio)
    
    if best_match and best_match[1] >= threshold:
        return best_match[0], best_match[1]
    return None, 0

def auto_map(project_dir, assets_dir, threshold=60, dry_run=False):
    script_data = load_script(project_dir)
    sections = script_data.get('sections', [])
    
    # Collect all available asset files
    asset_files = [f for f in os.listdir(assets_dir) if not f.startswith('.')]
    print(f"📂 Found {len(asset_files)} files in {assets_dir}")
    
    mapping_plan = []
    used_files = set()

    print("\n🔍 Thinking & Matching...")
    
    for section in sections:
        for scene in section.get('scenes', []):
            scene_id = scene['id']
            scene_text = get_scene_text(scene)
            
            # Find best match from UNUSED files first (to avoid duplicates if possible)
            available_files = [f for f in asset_files if f not in used_files]
            
            # If no available files, check all (maybe reuse is needed? for now prefer unique)
            match_file, score = find_best_match(scene_text, available_files, threshold)
            
            if match_file:
                print(f"   ✨ Matched [{scene_id}] -> '{match_file}' (Confidence: {score}%)")
                mapping_plan.append({
                    "sceneId": scene_id,
                    "file": match_file,
                    "path": os.path.join(assets_dir, match_file)
                })
                used_files.add(match_file)
            else:
                print(f"   ❌ No match for [{scene_id}]")

    if not mapping_plan:
        print("\n⚠️ No matches found. Try lowering threshold or checking asset names.")
        return

    if dry_run:
        print("\n🚫 Dry Run: No changes made.")
        return

    print(f"\n🚀 Executing Import for {len(mapping_plan)} files...")
    
    # Execute Import using import-assets.js
    import_script = ".agent/skills/local-asset-import/scripts/import-assets.js"
    
    for item in mapping_plan:
        cmd = f"node {import_script} --projectDir \"{project_dir}\" --files \"{item['path']}\" --sceneId \"{item['sceneId']}\" --updateResources"
        print(f"   ▶ Importing {item['file']}...")
        os.system(cmd)

    print("\n✅ Auto-Mapping Complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto Map Local Assets to Scenes")
    parser.add_argument("--project", required=True, help="Project directory")
    parser.add_argument("--assets", required=True, help="Assets directory path")
    parser.add_argument("--threshold", type=int, default=50, help="Matching confidence threshold")
    parser.add_argument("--dry-run", action="store_true", help="Preview matches only")
    
    args = parser.parse_args()
    
    auto_map(args.project, args.assets, args.threshold, args.dry_run)
