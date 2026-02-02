"""Core OTIO timeline builder."""
from pathlib import Path
from typing import Dict, Any, Optional
import opentimelineio as otio

from utils.json_loader import InputLoader
from strategies.base_strategy import BaseStrategy


class OtioTimelineBuilder:
    """
    Main builder for OTIO timelines.

    Orchestrates loading inputs, selecting strategy, and building timeline.
    """

    def __init__(self, project_dir: str, fps: int = 30):
        """
        Initialize OtioTimelineBuilder.

        Args:
            project_dir: Path to project directory (contains script.json, voice.json, resources.json)
            fps: Frames per second (default: 30)
        """
        self.project_dir = Path(project_dir).resolve()
        self.fps = fps
        self.loader = InputLoader(str(self.project_dir))

        # Will be populated by load_inputs()
        self.script: Optional[Dict[str, Any]] = None
        self.voice_data: Optional[Dict[str, Any]] = None
        self.resources: Optional[Dict[str, Any]] = None
        self.timeline: Optional[otio.schema.Timeline] = None

    def load_inputs(self) -> bool:
        """
        Load and validate all input JSON files.

        Returns:
            True if successful

        Raises:
            FileNotFoundError: If required files are missing
            ValueError: If validation fails
        """
        self.script, self.voice_data, self.resources = self.loader.load_all()

        # Auto-populate Short video layout fields for 9:16 videos
        self._auto_populate_short_layout_fields()

        return True

    def _auto_populate_short_layout_fields(self) -> None:
        """
        Auto-populate layout fields for Short (9:16) videos.

        Only applies to 9:16 videos with landscape input.
        """
        from utils.short_layout_helper import ShortLayoutHelper

        if not self.script or not self.resources:
            return

        metadata = self.script.get('metadata', {})
        scenes = self.script.get('scenes', [])

        # Only for 9:16 videos
        if not ShortLayoutHelper.is_short_format(metadata):
            return

        # Check if landscape input detected
        has_landscape = ShortLayoutHelper.detect_landscape_input(self.resources)
        if not has_landscape:
            # No landscape input, no need for special layout
            return

        # Auto-suggest layoutPreset if not provided
        if 'layoutPreset' not in metadata:
            suggested_preset = ShortLayoutHelper.suggest_layout_preset(scenes, metadata)
            metadata['layoutPreset'] = suggested_preset
            print(f"  → Auto-suggested layoutPreset: {suggested_preset}")

        # Auto-suggest backgroundType if not provided
        if 'backgroundType' not in metadata:
            # Default to 'auto' which will smart-detect per scene
            metadata['backgroundType'] = 'auto'
            print(f"  → Auto-set backgroundType: auto (smart detection)")

        # Auto-suggest contentPositioning if not provided
        if 'contentPositioning' not in metadata:
            # Default to 'centered' (most common case)
            metadata['contentPositioning'] = 'centered'
            print(f"  → Auto-set contentPositioning: centered")

        # Ensure backgroundColor has default if using solid-color
        if metadata.get('backgroundType') == 'solid-color' and 'backgroundColor' not in metadata:
            metadata['backgroundColor'] = '#000000'
            print(f"  → Auto-set backgroundColor: #000000 (black)")

        # Update the script metadata
        self.script['metadata'] = metadata

    def build_timeline(self, strategy: BaseStrategy) -> otio.schema.Timeline:
        """
        Build OTIO timeline using the provided strategy.

        Args:
            strategy: Strategy instance for specific video type

        Returns:
            OTIO Timeline object

        Raises:
            RuntimeError: If inputs haven't been loaded yet
        """
        if not self.script or not self.voice_data or not self.resources:
            raise RuntimeError("Must call load_inputs() before build_timeline()")

        # Get project name from script metadata
        project_name = self.loader.get_project_name(self.script)

        # Create timeline
        timeline = otio.schema.Timeline(name=project_name)

        # Add aspect ratio metadata from script
        metadata = self.script.get('metadata', {})
        ratio = metadata.get('ratio', '9:16')
        width = metadata.get('width')
        height = metadata.get('height')

        # Auto-resolve width/height from ratio if not provided
        if not width or not height:
            width, height = self._resolve_dimensions(ratio)

        timeline.metadata['ratio'] = ratio
        timeline.metadata['width'] = width
        timeline.metadata['height'] = height

        # Delegate to strategy to populate tracks
        strategy.populate_tracks(timeline, self.script, self.voice_data, self.resources)

        # Store timeline
        self.timeline = timeline

        return timeline

    @staticmethod
    def _resolve_dimensions(ratio: str):
        """Resolve width/height from aspect ratio string."""
        RATIO_MAP = {
            '9:16': (1080, 1920),
            '16:9': (1920, 1080),
            '1:1': (1080, 1080),
            '4:5': (1080, 1350),
        }
        return RATIO_MAP.get(ratio, (1080, 1920))

    def save(self, output_path: Optional[str] = None) -> str:
        """
        Save timeline to OTIO file with validation.

        Args:
            output_path: Optional custom output path (default: project_dir/project.otio)

        Returns:
            Path to saved file

        Raises:
            RuntimeError: If timeline hasn't been built yet or validation fails
        """
        if not self.timeline:
            raise RuntimeError("Must call build_timeline() before save()")

        # Determine output path
        if output_path:
            out_path = Path(output_path)
        else:
            out_path = self.project_dir / "project.otio"

        # Use safe save with validation
        from utils.otio_validator import safe_save_otio
        
        success = safe_save_otio(self.timeline, str(out_path))
        
        if not success:
            raise RuntimeError("Timeline validation failed. Check errors above.")

        return str(out_path)

    def get_video_type(self) -> str:
        """
        Get video type from loaded script.

        Returns:
            Video type string

        Raises:
            RuntimeError: If script hasn't been loaded
        """
        if not self.script:
            raise RuntimeError("Must call load_inputs() first")

        return self.loader.get_video_type(self.script)

    def get_duration(self) -> float:
        """
        Get expected duration from script metadata.

        Returns:
            Duration in seconds

        Raises:
            RuntimeError: If script hasn't been loaded
        """
        if not self.script:
            raise RuntimeError("Must call load_inputs() first")

        return self.script.get('metadata', {}).get('duration', 60)

    def get_aspect_ratio(self) -> str:
        """
        Get aspect ratio from script metadata.

        Returns:
            Aspect ratio string (e.g., '9:16', '16:9', '1:1', '4:5')

        Raises:
            RuntimeError: If script hasn't been loaded
        """
        if not self.script:
            raise RuntimeError("Must call load_inputs() first")

        return self.script.get('metadata', {}).get('ratio', '9:16')
