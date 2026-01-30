"""JSON input loading and validation."""
import json
from pathlib import Path
from typing import Dict, Tuple, Optional


class InputLoader:
    """Loads and validates input JSON files from project directory."""

    def __init__(self, project_dir: str):
        """
        Initialize InputLoader.

        Args:
            project_dir: Path to project directory containing JSON files
        """
        self.project_dir = Path(project_dir)

        if not self.project_dir.exists():
            raise FileNotFoundError(f"Project directory not found: {project_dir}")

    def load_all(self) -> Tuple[Dict, Dict, Dict]:
        """
        Load all three required JSON files.

        Returns:
            (script, voice, resources) tuple

        Raises:
            FileNotFoundError: If required files are missing
            json.JSONDecodeError: If JSON parsing fails
            ValueError: If validation fails
        """
        script = self._load_json('script.json', required=True)
        voice = self._load_json('voice.json', required=True)
        resources = self._load_json('resources.json', required=True)

        # Validate schema
        self._validate_script(script)
        self._validate_voice(voice)
        self._validate_resources(resources)

        return script, voice, resources

    def _load_json(self, filename: str, required: bool = True) -> Optional[Dict]:
        """
        Load and parse a JSON file.

        Args:
            filename: Name of JSON file
            required: Whether file is required

        Returns:
            Parsed JSON dict or None if not found and not required

        Raises:
            FileNotFoundError: If required file is missing
            json.JSONDecodeError: If JSON is invalid
        """
        file_path = self.project_dir / filename

        if not file_path.exists():
            if required:
                raise FileNotFoundError(f"Required file not found: {file_path}")
            return None

        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _validate_script(self, data: Dict) -> None:
        """
        Validate script.json schema.

        Args:
            data: Parsed script.json

        Raises:
            ValueError: If required fields are missing
        """
        # Strict requirements - must always have these
        required_base = ['metadata', 'scenes']

        # Conditional requirements based on video type
        video_type = data.get('metadata', {}).get('videoType', 'unknown')

        # All other fields are optional and will be auto-populated with defaults
        optional_with_defaults = {
            'script': {'fullText': '', 'wordCount': 0, 'estimatedDuration': 0, 'readingSpeed': 150},
            'voice': {'provider': None, 'voiceId': None},
            'music': {'enabled': False, 'query': '', 'mood': 'neutral', 'genre': 'background', 'volume': 0.5, 'fadeIn': 1.0, 'fadeOut': 1.0},
            'subtitle': {'style': 'default', 'position': 'center', 'font': 'Arial', 'highlightColor': '#FFEB3B'}
        }

        # Validate base required fields
        for field in required_base:
            if field not in data:
                raise ValueError(
                    f"❌ script.json missing required field: '{field}'\n"
                    f"   Required fields: {required_base}\n"
                    f"   See: .claude/skills/video-editor/SCHEMA.md for details"
                )

        # Auto-populate optional fields with sensible defaults
        for field, default_value in optional_with_defaults.items():
            if field not in data:
                data[field] = default_value
                print(f"⚠️  Auto-populated missing field '{field}' with defaults")

        # Validate metadata
        metadata = data['metadata']
        if 'videoType' not in metadata:
            raise ValueError(
                "❌ script.json metadata missing 'videoType'\n"
                "   Valid types: facts, listicle, motivation, story, image-slide\n"
                "   Example: {\"metadata\": {\"videoType\": \"image-slide\"}}"
            )

        if 'duration' not in metadata:
            raise ValueError(
                "❌ script.json metadata missing 'duration'\n"
                "   Must specify total video duration in seconds\n"
                "   Example: {\"metadata\": {\"duration\": 300}}"
            )

        # Auto-populate optional metadata fields with sensible defaults
        if 'width' not in metadata:
            metadata['width'] = 1920
        if 'height' not in metadata:
            metadata['height'] = 1080
        if 'ratio' not in metadata:
            metadata['ratio'] = '16:9'

        # Validate scenes
        scenes = data['scenes']
        if not isinstance(scenes, list) or len(scenes) == 0:
            raise ValueError("script.json must have at least one scene")

        # Validate each scene has required fields
        for i, scene in enumerate(scenes):
            if 'id' not in scene:
                raise ValueError(f"Scene {i} missing 'id'")
            if 'duration' not in scene:
                raise ValueError(f"Scene {i} missing 'duration'")

    def _validate_voice(self, data: Dict) -> None:
        """
        Validate voice.json schema.

        Args:
            data: Parsed voice.json

        Raises:
            ValueError: If required fields are missing
        """
        if 'text' not in data:
            raise ValueError("voice.json missing 'text' field")

        if 'timestamps' not in data:
            raise ValueError("voice.json missing 'timestamps' field")

        # Validate timestamps structure
        timestamps = data['timestamps']
        if not isinstance(timestamps, list):
            raise ValueError("voice.json 'timestamps' must be an array")

        # Validate first timestamp has required fields
        if len(timestamps) > 0:
            first = timestamps[0]
            if not all(k in first for k in ['word', 'start', 'end']):
                raise ValueError("voice.json timestamp missing 'word', 'start', or 'end'")

    def _validate_resources(self, data: Dict) -> None:
        """
        Validate resources.json schema.

        Args:
            data: Parsed resources.json

        Raises:
            ValueError: If required fields are missing
        """
        if 'resources' not in data:
            raise ValueError("resources.json missing 'resources' field")

        resources = data['resources']

        # Resources should have at least one of: videos, images, music, soundEffects
        valid_types = ['videos', 'images', 'music', 'soundEffects']
        if not any(t in resources for t in valid_types):
            raise ValueError(f"resources.json must contain at least one of: {valid_types}")

    def get_project_name(self, script: Dict) -> str:
        """
        Extract project name from script metadata.

        Args:
            script: Parsed script.json

        Returns:
            Project name string
        """
        return script.get('metadata', {}).get('projectName', 'untitled')

    def get_video_type(self, script: Dict) -> str:
        """
        Extract video type from script metadata.

        Args:
            script: Parsed script.json

        Returns:
            Video type: "facts", "listicle", "motivation", or "story"
        """
        return script.get('metadata', {}).get('videoType', 'facts')

    def get_fps(self, script: Dict) -> int:
        """
        Extract FPS from script metadata or use default.

        Args:
            script: Parsed script.json

        Returns:
            FPS value (default: 30)
        """
        return script.get('metadata', {}).get('fps', 30)
