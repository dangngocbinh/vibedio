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
        Resolve voice audio path (voice.mp3, voice.m4a, etc.).
        
        Returns:
            Relative path to the voice file
        """
        # Check common extensions
        for ext in ['.mp3', '.m4a', '.wav', '.ogg']:
            if (self.project_dir / f"voice{ext}").exists():
                return f"voice{ext}"
                
        # Fallback to .mp3 as default
        return "voice.mp3"

    def resolve_resource_url(self, resource: Dict[str, Any]) -> str:
        """
        Resolve resource URL from resources.json entry.

        Priority:
        1. localPath (downloaded file - top priority for performance/stability)
        2. downloadUrls.hd (remote fallback)
        ...
        """
        # [NEW] Prefer local downloaded file if available
        if "localPath" in resource and resource["localPath"]:
            return self.sanitize_for_otio(resource["localPath"])

        # Try downloadUrls if local file missing or not downloaded
        if "downloadUrls" in resource:
            urls = resource["downloadUrls"]
            # Check all quality levels
            for quality in ["hd", "sd", "4k", "original", "large", "medium"]:
                if quality in urls and urls[quality]:
                    return urls[quality]

        # Fallback to single downloadUrl
        if "downloadUrl" in resource and resource["downloadUrl"]:
            return resource["downloadUrl"]

        # [REFINED] Only fallback to page URL if it's not a restricted/unplayable one (like Pexels page)
        if "url" in resource and resource["url"]:
            url = resource["url"]
            # Skip Pexels/Pixabay view pages as they don't work in Remotion for direct playback
            if "pexels.com/video/" in url or "pixabay.com/videos/" in url:
                pass 
            else:
                return url

        return "" # Return empty instead of raising error to allow the caller to try next result

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

        # Absolute paths starting with / (Unix) or Drive Letter (Windows)
        import re
        if path_or_url.startswith('/') or re.match(r'^[a-zA-Z]:\\', path_or_url):
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
        # Normalize paths for Windows comparison (casing and separators)
        abs_path_norm = os.path.normpath(abs_path)
        project_dir_norm = os.path.normpath(str(self.project_dir))
        
        # Check if abs_path is inside project_dir
        if abs_path_norm.lower().startswith(project_dir_norm.lower()):
            rel_path = os.path.relpath(abs_path_norm, project_dir_norm)
            return rel_path.replace('\\', '/')

        # Handle 'public' folder assets
        # project_dir is e.g. D:\path\to\app\public\projects\my-project
        # app_root should be D:\path\to\app
        app_root = self.project_dir.parent.parent.parent
        app_root_norm = os.path.normpath(str(app_root))

        if abs_path_norm.lower().startswith(app_root_norm.lower()):
            rel_to_root = os.path.relpath(abs_path_norm, app_root_norm)
            # Find the distance from project_dir to app_root (should be 3 levels: projects/{name} -> projects -> public -> root)
            # So the relative path from project_dir to root is ../../../
            return "../../../" + rel_to_root.replace('\\', '/')

        # Fallback: just use basename
        return os.path.basename(abs_path_norm)

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

    def resolve_pinned_from_scene(self, scene_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Find and resolve pinned resource (user-provided) for a specific scene ID.

        Pinned resources take highest priority - they are user-provided local files or URLs
        that should be used directly without searching APIs.

        Args:
            scene_id: Scene identifier (e.g., "hook", "item1")
            resources: Parsed resources.json content

        Returns:
            Pinned asset URL/path or None if not found
        """
        pinned_list = resources.get("resources", {}).get("pinnedResources", [])

        for pinned_entry in pinned_list:
            if pinned_entry.get("sceneId") == scene_id:
                results = pinned_entry.get("results", [])
                if results and len(results) > 0:
                    result = results[0]
                    # Prefer relativePath (portable), then localPath, then url
                    if result.get("relativePath"):
                        return result["relativePath"]
                    if result.get("localPath"):
                        return self.sanitize_for_otio(result["localPath"])
                    if result.get("url"):
                        return result["url"]

        return None

    def resolve_video_from_scene(self, scene_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Find and resolve video URL for a specific scene ID.

        Checks pinned resources first, then falls back to API-fetched videos.

        Args:
            scene_id: Scene identifier (e.g., "hook", "item1")
            resources: Parsed resources.json content

        Returns:
            Video URL/path or None if not found
        """
        # Check pinned resources FIRST (user-provided assets take priority)
        pinned = self.resolve_pinned_from_scene(scene_id, resources)
        if pinned:
            return pinned

        videos = resources.get("resources", {}).get("videos", [])

        # Find matching scene
        for video_entry in videos:
            if video_entry.get("sceneId") == scene_id:
                results = video_entry.get("results", [])
                
                # FIRST PASS: Look for any result with a localPath (downloaded)
                for result in results:
                    if result.get("localPath"):
                        return self.sanitize_for_otio(result["localPath"])
                
                # SECOND PASS: Look for any result with a playable downloadUrl
                for result in results:
                    url = self.resolve_resource_url(result)
                    if url and not (url.startswith('http') and "pexels.com/video/" in url):
                        return url

        return None

    def resolve_image_from_scene(self, scene_id: str, resources: Dict[str, Any]) -> Optional[str]:
        """
        Find and resolve image URL for a specific scene ID.

        Checks pinned resources first, then falls back to API-fetched images.

        Args:
            scene_id: Scene identifier
            resources: Parsed resources.json content

        Returns:
            Image URL/path or None if not found
        """
        # Check pinned resources FIRST (user-provided assets take priority)
        pinned = self.resolve_pinned_from_scene(scene_id, resources)
        if pinned:
            return pinned

        images = resources.get("resources", {}).get("images", [])
        generated = resources.get("resources", {}).get("generatedImages", [])
        
        # Combine lists to search
        all_images = images + generated

        for image_entry in all_images:
            if image_entry.get("sceneId") == scene_id:
                results = image_entry.get("results", [])
                
                # FIRST PASS: Look for local file
                for result in results:
                    if result.get("localPath"):
                        return self.sanitize_for_otio(result["localPath"])
                
                # SECOND PASS: Look for playable URL
                for result in results:
                    url = self.resolve_resource_url(result)
                    if url:
                        return url

        return None
