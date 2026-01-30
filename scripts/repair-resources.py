import json
from pathlib import Path

def repair_resources(project_dir):
    res_path = Path(project_dir) / 'resources.json'
    if not res_path.exists():
        print(f"File not found: {res_path}")
        return

    with open(res_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    resources = data.get('resources', {})
    
    # 1. Fix pinnedResources structure for scene-3
    pinned = resources.get('pinnedResources', [])
    new_pinned = []
    for p in pinned:
        if p.get('sceneId') == 'scene-3' and 'results' not in p:
            # Wrap the result info into a 'results' list
            result_info = {
                'id': 'pinned-scene-3',
                'localPath': p.get('localPath'),
                'type': 'pinned',
                'description': p.get('description')
            }
            p['results'] = [result_info]
        new_pinned.append(p)
    resources['pinnedResources'] = new_pinned

    # 2. For scene-1, scene-4, scene-9, if the first result is invalid (no downloadUrl/localPath),
    # swap it with a valid one from same scene
    for group_name in ['videos', 'images']:
        groups = resources.get(group_name, [])
        for group in groups:
            scene_id = group.get('sceneId')
            results = group.get('results', [])
            if not results:
                continue
            
            # Check if first result is valid
            first = results[0]
            is_valid = first.get('localPath') or (first.get('downloadUrls') and any(first['downloadUrls'].values()))
            
            if not is_valid:
                print(f"Scene {scene_id} first result is invalid. Searching for backup...")
                for i in range(1, len(results)):
                    backup = results[i]
                    if backup.get('localPath') or (backup.get('downloadUrls') and any(backup['downloadUrls'].values())):
                        print(f"Found valid backup for {scene_id} at rank {i+1}")
                        # Swap
                        results[0], results[i] = results[i], results[0]
                        break

    # 3. Ensure music is correctly identified
    # The music track in resources.json was scraped, it has localPath.
    
    with open(res_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Repaired resources.json")

if __name__ == "__main__":
    repair_resources('public/projects/noi-long-con-xa-que')
