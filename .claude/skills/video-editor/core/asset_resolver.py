"""Asset path resolution with relative path support for portability."""
import os
from pathlib import Path
from typing import Optional, Dict, Any
from urllib.parse import urlparse


class AssetResolver:
    """
    Resolves asset URLs to relative paths for portable OTIO timelines.

    Key Principle: All local paths must be relative to enable project folder portability.

    Examples:
    - voice.mp3 → "voice.mp3" (same folder)
    - /public/audio/music.mp3 → "../../public/audio/music.mp3"
    - https://cdn.pixabay.com/... → "https://..." (keep remote URLs)
    """

    def __init__(self, project_dir: str):
        """
        Initialize AssetResolver.

        Args:
            project_dir: Absolute path to project directory (e.g., /path/to/projects/my-project)
        """
        self.project_dir = Path(project_dir).resolve()
        self.project_root = self.project_dir.parent.parent  # Go up to automation-video root

    def resolve_voice_path(self) -> str:
        """
        Resolve voice.mp3 path (always in same folder as project).

        Returns:
            Relative path: "voice.mp3"
        """
        return "voice.mp3"

    def resolve_resource_url(self, resource: Dict[str, Any]) -> str:
        """
        Resolve resource URL from resources.json entry.

        Priority:
        1. downloadUrls.hd (best quality)
        2. downloadUrls.sd (fallback)
        3. downloadUrl (single URL)
        4. url (view page URL - should not be used for direct playback)

        Args:
            resource: Resource dict from resources.json

        Returns:
            URL string (remote) or relative path (local)
        """
        # Try downloadUrls first
        if "downloadUrls" in resource:
            urls = resource["downloadUrls"]
            if "hd" in urls and urls["hd"]:
                return urls["hd"]
            if "sd" in urls and urls["sd"]:
                return urls["sd"]
            if "4k" in urls and urls["4k"]:
                return urls["4k"]
            if "original" in urls and urls["original"]:
                return urls["original"]
            if "large" in urls and urls["large"]:
                return urls["large"]
            if "medium" in urls and urls["medium"]:
                return urls["medium"]

        # Fallback to single downloadUrl
        if "downloadUrl" in resource and resource["downloadUrl"]:
            return resource["downloadUrl"]

        # Last resort: view page URL (warning: might not be playable)
        if "url" in resource and resource["url"]:
            return resource["url"]

        raise ValueError(f"No valid URL found in resource: {resource}")

    def sanitize_for_otio(self, path_or_url: str) -> str:
        """
        Convert any path/URL to OTIO-compatible format with relative paths.

        Args:
            path_or_url: URL or file path

        Returns:
            Sanitized path/URL for OTIO media_reference
        """
        # Remote URLs - keep as-is
        if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
            return path_or_url

        # Absolute file:// URLs - convert to relative
        if path_or_url.startswith('file://'):
            abs_path = path_or_url[7:]  # Remove file://
            return self._make_relative(abs_path)

        # Absolute paths starting with /
        if path_or_url.startswith('/'):
            return self._make_relative(path_or_url)

        # Already relative - keep as-is
        return path_or_url

    def _make_relative(self, abs_path: str) -> str:
        """
        Convert absolute path to relative path from project directory.

        Args:
            abs_path: Absolute file path

        Returns:
            Relative path from project directory
        """
        abs_path_obj = Path(abs_path)

        # If path is inside project directory, return relative to project
        try:
            rel_to_project = abs_path_obj.relative_to(self.project_dir)
            return str(rel_to_project)
        except ValueError:
            pass

        # If path is in public folder, return relative from project to public
        if '/public/' in abs_path or '\\public\\' in abs_path:
            # Find public folder relative to project
            try:
                # Assume public is at project_root/public
                public_path = self.project_root / 'public'
                rel_to_public = abs_path_obj.relative_to(public_path)
                # From projects/{name}/ to public/ is ../../public/
                return f"../../public/{rel_to_public}"
            except ValueError:
                pass

        # Fallback: just use basename if in same project
        return abs_path_obj.name

    def resolve_music_from_resources(self, resources: Dict[str, Any]) -> Optional[str]:
        """
        Extract and resolve music URL from resources.json.

        Supports multiple formats:
        - Format 1 (nested): resources.music[].results[].downloadUrl
        - Format 2 (flat): resources.music[].downloadUrl
        - Format 3 (direct): resources.music[].url

        Args:
            resources: Parsed resources.json content

        Returns:
            Music URL/path or None if not found
        """
        music_list = resources.get("resources", {}).get("music", [])

        if not music_list or len(music_list) == 0:
            return None

        # Take first music entry
        first_music = music_list[0]

        # Format 1: Nested results array (from find-resources.js)
        if "results" in first_music and len(first_music["results"]) > 0:
            music_resource = first_music["results"][0]
            return self.resolve_resource_url(music_resource)

        # Format 2: Direct downloadUrl on music entry (from add-music script)
        if "downloadUrl" in first_music and first_music["downloadUrl"]:
            return first_music["downloadUrl"]

        # Format 3: Direct url field
        if "url" in first_music and first_music["url"]:
            return first_music["url"]

        # Format 4: sourceUrl (original remote URL)
        if "sourceUrl" in first_music and first_music["sourceUrl"]:
            return first_music["sourceUrl"]

        return None

    def resolve_video_from_scene(self, scene_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Find and resolve video URL for a specific scene ID.

        Args:
            scene_id: Scene identifier (e.g., "hook", "item1")
            resources: Parsed resources.json content

        Returns:
            Video URL/path or None if not found
        """
        videos = resources.get("resources", {}).get("videos", [])

        # Find matching scene
        for video_entry in videos:
            if video_entry.get("sceneId") == scene_id:
                results = video_entry.get("results", [])
                if results and len(results) > 0:
                    return self.resolve_resource_url(results[0])

        return None

    def resolve_image_from_scene(self, scene_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Find and resolve image URL for a specific scene ID.

        Args:
            scene_id: Scene identifier
            resources: Parsed resources.json content

        Returns:
            Image URL/path or None if not found
        """
        images = resources.get("resources", {}).get("images", [])

        for image_entry in images:
            if image_entry.get("sceneId") == scene_id:
                results = image_entry.get("results", [])
                if results and len(results) > 0:
                    return self.resolve_resource_url(results[0])

        return None
