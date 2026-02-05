"""Audio editor for adding/editing audio clips in existing OTIO timelines."""
import opentimelineio as otio
from typing import Optional

class AudioEditor:
    """Editor for adding audio clips (SFX, voiceover, music) to existing timelines."""

    def __init__(self, timeline: otio.schema.Timeline, fps: int = 30):
        """
        Initialize AudioEditor.

        Args:
            timeline: OTIO Timeline to edit
            fps: Frames per second
        """
        self.timeline = timeline
        self.fps = fps

    def add_sfx(
        self,
        url: str,
        at_second: float,
        volume: float = 1.0,
        track_name: str = "SFX"
    ) -> None:
        """
        Add sound effect to timeline.

        Args:
            url: Path to SFX file
            at_second: Start time in seconds
            volume: Volume (0.0 to 1.0)
            track_name: Name of the track to add to
        """
        # We need to Get duration of SFX. 
        # For simplicity in OTIO, we can set a long duration if we don't know it, 
        # but the player should stop when file ends. 
        # However, a better way is to set a reasonable default or let user specify.
        # Most SFX are short. Let's use 5.0s as default or try to probe.
        duration = 5.0 

        audio_track = self._get_or_create_audio_track(track_name)

        # Create media reference
        media_ref = otio.schema.ExternalReference(target_url=url)
        
        # In OTIO, for audio clips at specific time, we usually use gaps or globalTimelineStart
        # But for absolute positioning in our player, globalTimelineStart is easier.
        
        # Create timing
        from utils.timing_calculator import TimingCalculator
        timing = TimingCalculator(self.fps)
        source_range = timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=f"SFX: {url.split('/')[-1]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['globalTimelineStart'] = str(at_second)
        clip.metadata['volume'] = str(volume)

        # Insert at correct position
        insert_index = self._find_insert_index(audio_track, at_second)
        audio_track.insert(insert_index, clip)

    def _get_or_create_audio_track(self, name: str) -> otio.schema.Track:
        """Get or create an audio track by name."""
        for track in self.timeline.tracks:
            if track.name == name and track.kind == otio.schema.TrackKind.Audio:
                return track
        
        track = otio.schema.Track(name=name, kind=otio.schema.TrackKind.Audio)
        self.timeline.tracks.append(track)
        return track

    def _find_insert_index(self, track: otio.schema.Track, at_second: float) -> int:
        """Find correct insertion index for clip at given time."""
        for i, item in enumerate(track):
            if isinstance(item, otio.schema.Clip):
                clip_start = self._get_clip_start_time(item)
                if clip_start > at_second:
                    return i
        return len(track)

    def _get_clip_start_time(self, clip: otio.schema.Clip) -> float:
        """Get clip start time in seconds."""
        if 'globalTimelineStart' in clip.metadata:
            try:
                return float(clip.metadata['globalTimelineStart'])
            except (ValueError, TypeError):
                pass
        if clip.source_range:
            return clip.source_range.start_time.to_seconds()
        return 0.0
