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

    def resolve_voice_path(self, voice_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Resolve voice audio path (voice.mp3, voice.m4a, etc.).
        
        Args:
            voice_data: Optional parsed voice.json content
            
        Returns:
            Relative path to the voice file
        """
        # 1. Check audioFile in voice_data
        if voice_data and "audioFile" in voice_data:
            audio_file = voice_data["audioFile"]
            # Check if file exists relative to project dir
            if (self.project_dir / audio_file).exists():
                return audio_file
                
        # 2. Check common extensions in root
        for ext in ['.mp3', '.m4a', '.wav', '.ogg']:
            if (self.project_dir / f"voice{ext}").exists():
                return f"voice{ext}"
                
        # 3. Fallback to .mp3 as default
        return "voice.mp3"

    def resolve_resource_url(self, resource: Dict[str, Any]) -> str:
        """
        Resolve resource URL from resources.json entry.

        Priority (ưu tiên local trước):
        1. importedPath (đã import về local) - VALIDATE EXISTS
        2. relativePath (relative path trong project) - VALIDATE EXISTS
        3. localPath (downloaded file) - VALIDATE EXISTS
        4. downloadUrls.hd/sd/4k (remote CDN)
        5. downloadUrl (single remote URL)
        6. url (page URL - chỉ nếu là direct media URL)
        """
        # 1. Check local paths FIRST - với validation
        for key in ["importedPath", "relativePath", "localPath"]:
            if resource.get(key):
                full_path = self._resolve_full_path(resource[key])
                if full_path.exists():
                    return self.sanitize_for_otio(resource[key])
                else:
                    # Log warning nếu path không tồn tại
                    print(f"⚠️ {key} not found: {resource[key]}")

        # 2. Fallback to remote URLs
        if "downloadUrls" in resource:
            for quality in ["hd", "sd", "4k", "original", "large", "medium"]:
                if resource["downloadUrls"].get(quality):
                    return resource["downloadUrls"][quality]

        if resource.get("downloadUrl"):
            return resource["downloadUrl"]

        # 3. Last resort: url (nếu là direct media URL)
        if resource.get("url") and self._is_direct_media_url(resource["url"]):
            return resource["url"]

        return ""  # Empty = no valid URL found

    def _resolve_full_path(self, path_str: str) -> Path:
        """Resolve relative path to full path for existence check."""
        if path_str.startswith('/'):
            return Path(path_str)
        if path_str.startswith('..'):
            return (self.project_dir / path_str).resolve()
        return self.project_dir / path_str

    def _is_direct_media_url(self, url: str) -> bool:
        """Check if URL is direct media (not a page view)."""
        # Reject page URLs
        if "pexels.com/video/" in url or "pixabay.com/videos/" in url:
            return False
        if "pexels.com/photo/" in url or "pixabay.com/photos/" in url:
            return False
        # Accept direct CDN URLs
        if any(cdn in url for cdn in ["cdn.pexels.com", "cdn.pixabay.com", "vimeo.com", "player.vimeo.com"]):
            return True
        # Accept URLs ending with media extensions
        media_extensions = ['.mp4', '.mov', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.gif']
        if any(url.lower().endswith(ext) for ext in media_extensions):
            return True
        return False  # Conservative: reject unknown URLs

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

    def resolve_music_from_script(self, script: Dict[str, Any]) -> Optional[str]:
        """
        Extract and resolve music URL from script.json music config.

        Args:
            script: Parsed script.json content

        Returns:
            Music URL/path or None if not found
        """
        music_config = script.get('music', {})
        
        # Priority 1: importedMusicPath (user imported music)
        if music_config.get('importedMusicPath'):
            return self.sanitize_for_otio(music_config['importedMusicPath'])
        
        # Priority 2: selectedMusicId -> find in candidates
        selected_id = music_config.get('selectedMusicId')
        if selected_id:
            candidates = music_config.get('candidates', [])
            for candidate in candidates:
                if candidate.get('id') == selected_id:
                    # Try localPath first, then downloadUrl
                    if candidate.get('localPath'):
                        return self.sanitize_for_otio(candidate['localPath'])
                    if candidate.get('downloadUrl'):
                        return candidate['downloadUrl']
        
        return None

    def resolve_music_from_resources(self, resources: Dict[str, Any]) -> Optional[str]:
        """
        Extract and resolve music URL from resources.json.

        Priority order (similar to resolve_resource_url):
        1. importedPath (imported local file) - VALIDATE EXISTS
        2. localPath (downloaded file) - VALIDATE EXISTS
        3. downloadUrl (remote URL)
        4. url (page URL)

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
            # Use resolve_resource_url for consistent priority handling
            return self.resolve_resource_url(music_resource)

        # Format 2: Check importedPath on music entry (from import)
        if first_music.get("importedPath"):
            full_path = self._resolve_full_path(first_music["importedPath"])
            if full_path.exists():
                return self.sanitize_for_otio(first_music["importedPath"])
            else:
                print(f"⚠️ Music importedPath not found: {first_music['importedPath']}")

        # Format 3: Check localPath on music entry
        if first_music.get("localPath"):
            full_path = self._resolve_full_path(first_music["localPath"])
            if full_path.exists():
                return self.sanitize_for_otio(first_music["localPath"])
            else:
                print(f"⚠️ Music localPath not found: {first_music['localPath']}")

        # Format 4: Direct downloadUrl on music entry (from add-music script)
        if "downloadUrl" in first_music and first_music["downloadUrl"]:
            return first_music["downloadUrl"]

        # Format 5: Direct url field
        if "url" in first_music and first_music["url"]:
            return first_music["url"]

        # Format 6: sourceUrl (original remote URL)
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

    def resolve_video_from_scene(self, scene_id: str, resources: Dict[str, Any], prefer_type: str = 'auto') -> Optional[str]:
        """
        Find and resolve video URL for a specific scene ID.

        Checks pinned resources first, then falls back to API-fetched videos.

        Args:
            scene_id: Scene identifier (e.g., "hook", "item1")
            resources: Parsed resources.json content
            prefer_type: Preferred resource type ('video', 'image', or 'auto')

        Returns:
            Video URL/path or None if not found
        """
        # Skip if preference is image-only
        if prefer_type == 'image':
            return None

        # Check pinned resources FIRST (user-provided assets take priority)
        pinned = self.resolve_pinned_from_scene(scene_id, resources)
        if pinned:
            return pinned

        videos = resources.get("resources", {}).get("videos", [])

        # Find matching scene
        for video_entry in videos:
            if video_entry.get("sceneId") == scene_id:
                results = video_entry.get("results", [])
                
                # FIRST PASS: Look for any result with an imported/relative path
                for key in ["importedPath", "relativePath"]:
                    for result in results:
                        if result.get(key):
                            return self.sanitize_for_otio(result[key])

                # SECOND PASS: Look for any result with a localPath (downloaded)
                for result in results:
                    if result.get("localPath"):
                        return self.sanitize_for_otio(result["localPath"])
                
                # SECOND PASS: Look for any result with a playable downloadUrl
                for result in results:
                    url = self.resolve_resource_url(result)
                    if url and not (url.startswith('http') and "pexels.com/video/" in url):
                        return url

        return None

    def resolve_image_from_scene(self, scene_id: str, resources: Dict[str, Any], prefer_type: str = 'auto') -> Optional[str]:
        """
        Find and resolve image URL for a specific scene ID.

        Checks pinned resources first, then falls back to API-fetched images.

        Args:
            scene_id: Scene identifier
            resources: Parsed resources.json content
            prefer_type: Preferred resource type ('video', 'image', or 'auto')

        Returns:
            Image URL/path or None if not found
        """
        # Skip if preference is video-only
        if prefer_type == 'video':
            return None

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
                
                # FIRST PASS: Look for any result with an imported/relative path
                for key in ["importedPath", "relativePath"]:
                    for result in results:
                        if result.get(key):
                            return self.sanitize_for_otio(result[key])

                # SECOND PASS: Look for local file
                for result in results:
                    if result.get("localPath"):
                        return self.sanitize_for_otio(result["localPath"])
                
                # SECOND PASS: Look for playable URL
                for result in results:
                    url = self.resolve_resource_url(result)
                    if url:
                        return url

        return None
