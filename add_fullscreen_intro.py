
import json

project_path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(project_path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Create the FullscreenTitle clip
fps = 30.0
duration_frames = 90.0 # 3 seconds

intro_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "FullscreenTitle",
        "props": {
            "title": "NỖI LÒNG CON XA QUÊ",
            "subtitle": "Tâm sự những ngày giáp Tết",
            "template": "cinematic-intro",
            "fontFamily": "Anton",
            "backgroundType": "gradient",
            "backgroundValue": "sunset",
            "showParticles": True
        }
    },
    "name": "Intro Title",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": fps, "value": duration_frames },
        "start_time": { "rate": fps, "value": 0.0 }
    }
}

# Create a new track for Title Overlays
new_track = {
    "OTIO_SCHEMA": "Track.1",
    "metadata": {},
    "name": "Title Overlays",
    "kind": "Video",
    "children": [intro_clip]
}

# Add the track to the project
# We should place it at the end to be on top of others
project['tracks']['children'].append(new_track)

with open(project_path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)

print("Added FullscreenTitle 'Intro Title' to 'Title Overlays' track at the beginning.")
