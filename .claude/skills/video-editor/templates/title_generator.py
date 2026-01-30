"""Title track generation from script.json titles section."""
from typing import Dict, List, Any
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator


class TitleGenerator:
    """Generates titles track from script.json titles list."""

    def __init__(self, fps: int = 30):
        """
        Initialize TitleGenerator.

        Args:
            fps: Frames per second
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)

    def generate_track(
        self,
        script: Dict[str, Any]
    ) -> otio.schema.Track:
        """
        Generate titles track from script.json titles.

        Args:
            script: Parsed script.json with 'titles' list

        Returns:
            OTIO Track with title clips
        """
        track = otio.schema.Track(name="Titles", kind=otio.schema.TrackKind.Video)

        titles = script.get('titles', [])
        if not titles:
            return track

        # Sort titles by startTime to identify gaps/overlaps
        titles.sort(key=lambda x: x.get('startTime', 0))

        # Create clip for each title
        for title_data in titles:
            clip = self._create_title_clip(title_data)
            if clip:
                track.append(clip)

        return track

    def _create_title_clip(
        self,
        title_data: Dict[str, Any]
    ) -> otio.schema.Clip:
        """
        Create title clip for a title entry.

        Args:
            title_data: Title entry from script.json titles list

        Returns:
            OTIO Clip with remotion_component metadata
        """
        title_type = title_data.get('type', 'LayerTitle')
        start_sec = title_data.get('startTime', 0)
        duration_sec = title_data.get('duration', 5)
        props = title_data.get('props', {})
        id = title_data.get('id', 'title')

        # Create media reference (missing for component)
        media_ref = otio.schema.MissingReference()

        # Create source range
        source_range = self.timing.create_time_range(start_sec, duration_sec)

        # Create clip
        clip = otio.schema.Clip(
            name=f"Title: {id}",
            media_reference=media_ref,
            source_range=source_range
        )

        # Add Remotion component metadata
        clip.metadata['remotion_component'] = title_type
        clip.metadata['props'] = props

        return clip
