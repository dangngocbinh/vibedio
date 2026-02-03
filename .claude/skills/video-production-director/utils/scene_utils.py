"""
Scene utilities for sections + scenes structure
"""
from typing import Dict, List, Any, Optional


def flatten_sections(sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Flatten sections into a flat list of all scenes.

    Args:
        sections: List of section dicts with scenes[] inside

    Returns:
        Flat list of all scenes from all sections
    """
    all_scenes = []
    for section in sections:
        scenes = section.get('scenes', [])
        all_scenes.extend(scenes)
    return all_scenes


def merge_resources_into_sections(
    sections: List[Dict[str, Any]],
    resources: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Merge resource candidates from resources.json into scenes.
    Auto-selects first local resource as selectedResourceId.

    Args:
        sections: List of sections with scenes
        resources: Parsed resources.json

    Returns:
        Updated sections with resourceCandidates and selectedResourceId
    """
    # Build resource lookup maps
    video_map = _build_resource_map(resources.get('resources', {}).get('videos', []))
    image_map = _build_resource_map(resources.get('resources', {}).get('images', []))

    # Iterate sections and scenes
    for section in sections:
        for scene in section.get('scenes', []):
            scene_id = scene.get('id')
            if not scene_id:
                continue

            candidates = []

            # Add video candidates
            if scene_id in video_map:
                for result in video_map[scene_id]:
                    candidates.append({
                        'id': result.get('id', ''),
                        'type': 'video',
                        'source': result.get('source', 'unknown'),
                        'localPath': result.get('localPath', ''),
                        'url': result.get('url', ''),
                        'width': result.get('width', 1920),
                        'height': result.get('height', 1080),
                        'duration': result.get('duration', 0)
                    })

            # Add image candidates
            if scene_id in image_map:
                for result in image_map[scene_id]:
                    candidates.append({
                        'id': result.get('id', ''),
                        'type': 'image',
                        'source': result.get('source', 'unknown'),
                        'localPath': result.get('localPath', ''),
                        'url': result.get('url', ''),
                        'width': result.get('width', 1920),
                        'height': result.get('height', 1080)
                    })

            # Set resourceCandidates
            scene['resourceCandidates'] = candidates

            # Auto-select first local resource
            selected = None
            for candidate in candidates:
                if candidate.get('localPath'):
                    selected = candidate.get('id')
                    break

            scene['selectedResourceId'] = selected

    return sections


def _build_resource_map(resource_groups: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Build lookup map: sceneId -> list of resource results

    Args:
        resource_groups: List of resource groups from resources.json

    Returns:
        Dict mapping sceneId to list of results
    """
    resource_map = {}
    for group in resource_groups:
        scene_id = group.get('sceneId')
        if scene_id:
            resource_map[scene_id] = group.get('results', [])
    return resource_map
