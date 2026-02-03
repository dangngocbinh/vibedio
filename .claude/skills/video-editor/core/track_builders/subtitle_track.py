"""Subtitle track builder - creates captions from voice timestamps."""
from typing import Dict, Any, Optional
import opentimelineio as otio

from templates.subtitle_generator import SubtitleGenerator


class SubtitleTrackBuilder:
    """Builds subtitle/captions track from voice.json timestamps."""

    def __init__(self, fps: int = 30):
        """
        Initialize SubtitleTrackBuilder.

        Args:
            fps: Frames per second
        """
        self.fps = fps
        self.generator = SubtitleGenerator(fps=fps)

    def build(
        self,
        voice_data: Dict[str, Any],
        script: Dict[str, Any],
        max_words_per_phrase: int = 5,
        offset: float = 0.0
    ) -> Optional[otio.schema.Track]:
        """
        Build subtitle track from voice timestamps.

        Args:
            voice_data: Parsed voice.json with timestamps
            script: Parsed script.json for subtitle style config
            max_words_per_phrase: Maximum words per subtitle phrase
            offset: Time offset in seconds to shift all subtitles

        Returns:
            OTIO Track with subtitle clips or None if no voice data
        """
        if not voice_data or not voice_data.get('timestamps'):
            return None

        # Use existing SubtitleGenerator
        track = self.generator.generate_track(
            voice_data=voice_data,
            script=script,
            max_words_per_phrase=max_words_per_phrase,
            offset=offset
        )

        # Track should be named "Captions" and placed last
        return track
