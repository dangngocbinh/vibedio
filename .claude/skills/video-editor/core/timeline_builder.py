"""Unified timeline builder - orchestrates all track builders to create complete timeline."""
from pathlib import Path
from typing import Dict, Any, Optional
import opentimelineio as otio

from utils.json_loader import InputLoader
from core.asset_resolver import AssetResolver
from core.track_builders import (
    VisualTrackBuilder,
    OverlayTrackBuilder,
    AudioTracksBuilder,
    SubtitleTrackBuilder
)
from utils.otio_validator import OtioValidator


class TimelineBuilder:
    """Unified builder that creates timeline for all video types without strategy pattern."""

    def __init__(self, project_dir: str, fps: int = 30):
        """
        Initialize TimelineBuilder.

        Args:
            project_dir: Path to project directory
            fps: Frames per second
        """
        self.project_dir = Path(project_dir)
        self.fps = fps
        self.loader = InputLoader(str(project_dir))
        self.asset_resolver = AssetResolver(str(project_dir))
        self.validator = OtioValidator()

        # Input data (loaded by load_inputs)
        self.script: Optional[Dict[str, Any]] = None
        self.voice_data: Optional[Dict[str, Any]] = None
        self.resources: Optional[Dict[str, Any]] = None

    def load_inputs(self) -> None:
        """Load and validate all input files (script.json, voice.json, resources.json)."""
        self.script, self.voice_data, self.resources = self.loader.load_all()

    def build(self) -> otio.schema.Timeline:
        """
        Build complete timeline with all tracks.

        Returns:
            OTIO Timeline object

        Raises:
            ValueError: If inputs not loaded
        """
        if not self.script:
            raise ValueError("Inputs not loaded. Call load_inputs() first.")

        # Create timeline
        project_name = self.get_project_name()
        timeline = otio.schema.Timeline(name=project_name)

        # Add timeline metadata
        metadata = self.script.get('metadata', {})
        timeline.metadata['ratio'] = metadata.get('ratio', '16:9')
        timeline.metadata['width'] = metadata.get('width', 1920)
        timeline.metadata['height'] = metadata.get('height', 1080)
        timeline.metadata['fps'] = self.fps
        timeline.metadata['duration'] = metadata.get('duration', 0)
        timeline.metadata['videoType'] = metadata.get('videoType', 'unified')

        # Build tracks in order (bottom to top)
        duration = metadata.get('duration', 0)

        # 1. Main Visual Track (scene clips + title cards)
        visual_builder = VisualTrackBuilder(
            fps=self.fps,
            project_dir=str(self.project_dir),
            asset_resolver=self.asset_resolver
        )
        visual_track = visual_builder.build(self.script, self.resources)
        timeline.tracks.append(visual_track)

        # 2. Overlay Track (auto-generated + legacy overlays)
        overlay_builder = OverlayTrackBuilder(fps=self.fps)
        overlay_track = overlay_builder.build(self.script)
        if overlay_track and len(overlay_track) > 0:
            timeline.tracks.append(overlay_track)

        # 3. Voice Track (if enabled)
        voice_enabled = self.script.get('voice', {}).get('enabled', True)
        if voice_enabled and self.voice_data:
            audio_builder = AudioTracksBuilder(
                fps=self.fps,
                project_dir=str(self.project_dir),
                asset_resolver=self.asset_resolver
            )
            voice_track = audio_builder.build_voice_track(
                voice_data=self.voice_data,
                duration=duration,
                volume=1.0
            )
            if voice_track:
                timeline.tracks.append(voice_track)

        # 4. Music Track (if music available)
        music_config = self.script.get('music', {})
        music_enabled = (
            music_config.get('importedMusicPath') or 
            music_config.get('selectedMusicId') or
            music_config.get('enabled', False)
        )
        
        if music_enabled:
            audio_builder = AudioTracksBuilder(
                fps=self.fps,
                project_dir=str(self.project_dir),
                asset_resolver=self.asset_resolver
            )
            music_track = audio_builder.build_music_track(
                script=self.script,
                resources=self.resources,
                duration=duration
            )
            if music_track:
                timeline.tracks.append(music_track)

        # 5. Captions Track (if voice enabled and timestamps available)
        if voice_enabled and self.voice_data and self.voice_data.get('timestamps'):
            subtitle_builder = SubtitleTrackBuilder(fps=self.fps)
            captions_track = subtitle_builder.build(
                voice_data=self.voice_data,
                script=self.script,
                max_words_per_phrase=5,
                offset=0.0
            )
            if captions_track:
                timeline.tracks.append(captions_track)

        return timeline

    def save(self, output_path: Optional[str] = None) -> str:
        """
        Build and save timeline to OTIO file.

        Args:
            output_path: Output file path (default: project_dir/project.otio)

        Returns:
            Saved file path

        Raises:
            ValueError: If timeline validation fails
        """
        # Build timeline
        timeline = self.build()

        # Validate timeline
        validation_result = self.validator.validate_timeline(timeline)
        if not validation_result['valid']:
            errors = '\n'.join(f"  - {err}" for err in validation_result['errors'])
            raise ValueError(f"Timeline validation failed:\n{errors}")

        # Determine output path
        if not output_path:
            output_path = str(self.project_dir / 'project.otio')

        # Save to file
        otio.adapters.write_to_file(timeline, output_path)

        return output_path

    def get_project_name(self) -> str:
        """Get project name from script metadata."""
        if self.script:
            return self.script.get('metadata', {}).get('projectName', 'untitled')
        return 'untitled'

    def get_video_type(self) -> str:
        """Get video type from script metadata."""
        if self.script:
            return self.script.get('metadata', {}).get('videoType', 'unified')
        return 'unified'

    def get_duration(self) -> float:
        """Get total duration from script metadata."""
        if self.script:
            return self.script.get('metadata', {}).get('duration', 0.0)
        return 0.0

    def get_aspect_ratio(self) -> str:
        """Get aspect ratio from script metadata."""
        if self.script:
            return self.script.get('metadata', {}).get('ratio', '16:9')
        return '16:9'
