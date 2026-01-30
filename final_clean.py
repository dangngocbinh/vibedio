
import json

path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Keep only Images, Voice, Background Music, and CTA
keep_names = ['Images', 'Voice', 'Background Music', 'CTA Gallery Preview']

tracks = project['tracks']['children']
filtered_tracks = [t for t in tracks if t.get('name') in keep_names]

project['tracks']['children'] = filtered_tracks

with open(path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)

print("Project cleaned: kept only media and CTA preview.")
