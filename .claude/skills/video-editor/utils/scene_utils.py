"""
Scene utilities for video editor (sections + scenes structure)
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


def resolve_selected_resource(
    scene: Dict[str, Any],
    resources: Dict[str, Any]
) -> Optional[str]:
    """
    Resolve selectedResourceId to local path from resourceCandidates.

    Args:
        scene: Scene dict with resourceCandidates and selectedResourceId
        resources: Parsed resources.json (for fallback lookup)

    Returns:
        Local path string or None
    """
    selected_id = scene.get('selectedResourceId')
    if not selected_id:
        return None

    # Look in resourceCandidates
    candidates = scene.get('resourceCandidates', [])
    for candidate in candidates:
        if candidate.get('id') == selected_id:
            local_path = candidate.get('localPath')
            if local_path:
                return local_path

    # Fallback: search in resources.json
    return _search_resource_in_resources(selected_id, resources)


def _search_resource_in_resources(
    resource_id: str,
    resources: Dict[str, Any]
) -> Optional[str]:
    """
    Search for resource ID in resources.json

    Args:
        resource_id: Resource ID to find
        resources: Parsed resources.json

    Returns:
        Local path or None
    """
    # Search in videos
    videos = resources.get('resources', {}).get('videos', [])
    for video_group in videos:
        for result in video_group.get('results', []):
            if result.get('id') == resource_id:
                return result.get('localPath')

    # Search in images
    images = resources.get('resources', {}).get('images', [])
    for image_group in images:
        for result in image_group.get('results', []):
            if result.get('id') == resource_id:
                return result.get('localPath')

    return None
