
import json

project_path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(project_path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Find the CTA track
tracks = project['tracks']['children']
updated = False
for track in tracks:
    # We look for the CTA track we created earlier
    if track.get('name') == 'CTA Gallery Preview':
        for child in track.get('children', []):
            if child.get('OTIO_SCHEMA') == 'Clip.2' and child.get('metadata', {}).get('remotion_component') == 'CallToAction':
                # Update fontFamily to Lobster
                props = child['metadata'].setdefault('props', {})
                props['fontFamily'] = 'Lobster' 
                # Optional: update title/subtitle to show it working, but user just asked for font change.
                # Let's keep title/subtitle relevant or update if it helps visibility.
                # props['title'] = 'Lobster Font'
                updated = True
                print("Updated CallToAction font to Lobster")

if not updated:
    print("Warning: CTA Gallery Preview track or CallToAction clip not found.")

with open(project_path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)
