
import json

path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Filter tracks: Keep "Images" and "CTA Gallery Preview", remove "Titles"
tracks = project['tracks']['children']
filtered_tracks = []

for track in tracks:
    if track.get('name') == 'Titles':
        print("Removing 'Titles' track")
        continue
    filtered_tracks.append(track)

project['tracks']['children'] = filtered_tracks

with open(path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)
