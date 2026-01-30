
import json

project_path = r'd:\VIDEOCODE\vibe-video-insight\public\projects\noi-long-con-xa-que\project.otio'

with open(project_path, 'r', encoding='utf-8') as f:
    project = json.load(f)

# Define the single CTA clip (Template 1: classic-youtube)
cta_clip = {
    "OTIO_SCHEMA": "Clip.2",
    "metadata": {
        "remotion_component": "CallToAction",
        "props": {
            "template": "classic-youtube",
            "title": "SUBSCRIBE NOW",
            "subtitle": "Join our community"
        }
    },
    "name": "CTA: classic-youtube",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": 30.0, "value": 210.0 }, # 7 seconds * 30 fps
        "start_time": { "rate": 30.0, "value": 0.0 }
    },
    "media_references": {
        "DEFAULT_MEDIA": {
            "OTIO_SCHEMA": "MissingReference.1",
            "metadata": {},
            "name": ""
        }
    },
    "active_media_reference_key": "DEFAULT_MEDIA"
}

# Gap for 100 frames
gap = {
    "OTIO_SCHEMA": "Gap.1",
    "source_range": {
        "OTIO_SCHEMA": "TimeRange.1",
        "duration": { "rate": 30.0, "value": 100.0 },
        "start_time": { "rate": 30.0, "value": 0.0 }
    }
}

# Create the new track with only this clip
new_cta_track = {
    "OTIO_SCHEMA": "Track.1",
    "metadata": {},
    "name": "CTA Gallery Preview",
    "source_range": None,
    "effects": [],
    "markers": [],
    "enabled": True,
    "color": None,
    "children": [gap, cta_clip],
    "kind": "Video"
}

# Find and replace the track
tracks = project['tracks']['children']
found = False
for i, track_obj in enumerate(tracks):
    if track_obj.get('name') == 'CTA Gallery Preview':
        tracks[i] = new_cta_track
        found = True
        break

if not found:
    tracks.append(new_cta_track)

with open(project_path, 'w', encoding='utf-8') as f:
    json.dump(project, f, indent=4)

print("Project updated: Single CTA (classic-youtube) at frame 100 for 7s.")
