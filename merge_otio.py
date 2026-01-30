
import json

# Load the main project
with open(r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio', 'r', encoding='utf-8') as f:
    project = json.load(f)

# Load the CTA track
with open(r'd:\VIDEOCODE\vibe-video-insight\cta_track.json', 'r', encoding='utf-8') as f:
    cta_track = json.load(f)

# Append the CTA track to the tracks list
project['tracks']['children'].append(cta_track)

# Save the updated project
with open(r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio', 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)
