
import json

project_path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(project_path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Find the CTA track
tracks = project['tracks']['children']
for track in tracks:
    if track.get('name') == 'CTA Gallery Preview':
        # Update the first clip (should be the classic-youtube one)
        # Check if it has children (it has [Gap, Clip])
        for child in track['children']:
            if child.get('OTIO_SCHEMA') == 'Clip.2' and child['metadata'].get('remotion_component') == 'CallToAction':
                child['metadata']['props']['fontFamily'] = 'Anton' # Use a distinct font if available, or just 'Impact' to see change
                child['metadata']['props']['title'] = 'FONT CHANGED'
                print("Updated font to Anton")

with open(project_path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)
