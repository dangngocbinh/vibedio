"""Overlay editor for adding/editing overlays in existing OTIO timelines."""
from typing import Optional
import opentimelineio as otio

from utils.component_factory import ComponentFactory


class OverlayEditor:
    """Editor for adding overlays (titles, stickers, effects, CTAs) to existing timelines."""

    def __init__(self, timeline: otio.schema.Timeline, fps: int = 30):
        """
        Initialize OverlayEditor.

        Args:
            timeline: OTIO Timeline to edit
            fps: Frames per second
        """
        self.timeline = timeline
        self.fps = fps

    def add_title(
        self,
        text: str,
        at_second: float,
        duration: float,
        style: str = 'highlight',
        position: str = 'bottom',
        subtitle: str = ''
    ) -> None:
        """
        Add title overlay to timeline.

        Args:
            text: Title text
            at_second: Start time in seconds
            duration: Duration in seconds
            style: Title style
            position: Position on screen
            subtitle: Optional subtitle
        """
        overlays_track = self._get_or_create_overlay_track()

        clip = ComponentFactory.create_layer_title(
            text=text,
            start_time=at_second,
            duration=duration,
            style=style,
            position=position,
            fps=self.fps,
            subtitle=subtitle
        )

        insert_index = self._find_insert_index(overlays_track, at_second)
        overlays_track.insert(insert_index, clip)

    def add_sticker(
        self,
        emoji: str,
        at_second: float,
        duration: float,
        position: str = 'center',
        size: str = 'medium',
        animation: str = 'bounce'
    ) -> None:
        """
        Add sticker overlay to timeline.

        Args:
            emoji: Emoji or sticker content
            at_second: Start time in seconds
            duration: Duration in seconds
            position: Position on screen
            size: Sticker size
            animation: Animation type
        """
        overlays_track = self._get_or_create_overlay_track()

        clip = ComponentFactory.create_sticker(
            emoji=emoji,
            start_time=at_second,
            duration=duration,
            position=position,
            size=size,
            animation=animation,
            fps=self.fps
        )

        insert_index = self._find_insert_index(overlays_track, at_second)
        overlays_track.insert(insert_index, clip)

    def add_effect(
        self,
        effect_type: str,
        at_second: float,
        duration: float,
        intensity: float = 0.5,
        **effect_params
    ) -> None:
        """
        Add effect overlay to timeline.

        Args:
            effect_type: Effect type ('zoom', 'blur', 'shake', etc.)
            at_second: Start time in seconds
            duration: Duration in seconds
            intensity: Effect intensity (0.0 to 1.0)
            **effect_params: Additional effect parameters
        """
        overlays_track = self._get_or_create_overlay_track()

        clip = ComponentFactory.create_layer_effect(
            effect_type=effect_type,
            start_time=at_second,
            duration=duration,
            intensity=intensity,
            fps=self.fps,
            **effect_params
        )

        insert_index = self._find_insert_index(overlays_track, at_second)
        overlays_track.insert(insert_index, clip)

    def add_cta(
        self,
        text: str,
        at_second: float,
        duration: float,
        action: str = 'subscribe',
        style: str = 'default',
        position: str = 'bottom'
    ) -> None:
        """
        Add call-to-action overlay to timeline.

        Args:
            text: CTA text
            at_second: Start time in seconds
            duration: Duration in seconds
            action: Action type
            style: CTA style
            position: Position on screen
        """
        overlays_track = self._get_or_create_overlay_track()

        clip = ComponentFactory.create_cta(
            text=text,
            start_time=at_second,
            duration=duration,
            action=action,
            style=style,
            position=position,
            fps=self.fps
        )

        insert_index = self._find_insert_index(overlays_track, at_second)
        overlays_track.insert(insert_index, clip)

    def remove_overlay_at(self, at_second: float) -> bool:
        """
        Remove overlay at specific time.

        Args:
            at_second: Time in seconds

        Returns:
            True if overlay was removed, False otherwise
        """
        overlays_track = self._get_overlay_track()
        if not overlays_track:
            return False

        for i, item in enumerate(overlays_track):
            if isinstance(item, otio.schema.Clip):
                clip_start = self._get_clip_start_time(item)
                if abs(clip_start - at_second) < 0.1:  # Within 0.1 second tolerance
                    del overlays_track[i]
                    return True

        return False

    def _get_or_create_overlay_track(self) -> otio.schema.Track:
        """Get existing overlay track or create new one."""
        overlays_track = self._get_overlay_track()

        if not overlays_track:
            # Create new overlay track
            overlays_track = otio.schema.Track(name="Overlays", kind=otio.schema.TrackKind.Video)

            # Insert before captions track (if exists) or at end
            captions_index = self._find_captions_track_index()
            if captions_index is not None:
                self.timeline.tracks.insert(captions_index, overlays_track)
            else:
                self.timeline.tracks.append(overlays_track)

        return overlays_track

    def _get_overlay_track(self) -> Optional[otio.schema.Track]:
        """Get existing overlay track."""
        for track in self.timeline.tracks:
            if track.name == "Overlays":
                return track
        return None

    def _find_captions_track_index(self) -> Optional[int]:
        """Find index of captions track."""
        for i, track in enumerate(self.timeline.tracks):
            if track.name == "Captions":
                return i
        return None

    def _find_insert_index(self, track: otio.schema.Track, at_second: float) -> int:
        """
        Find correct insertion index for clip at given time.

        Args:
            track: Track to insert into
            at_second: Target time in seconds

        Returns:
            Index where clip should be inserted
        """
        for i, item in enumerate(track):
            if isinstance(item, otio.schema.Clip):
                clip_start = self._get_clip_start_time(item)
                if clip_start > at_second:
                    return i

        return len(track)  # Insert at end

    def _get_clip_start_time(self, clip: otio.schema.Clip) -> float:
        """
        Get clip start time in seconds.

        Args:
            clip: OTIO Clip

        Returns:
            Start time in seconds
        """
        # For overlay clips, use globalTimelineStart if available
        if 'globalTimelineStart' in clip.metadata:
            try:
                return float(clip.metadata['globalTimelineStart'])
            except (ValueError, TypeError):
                pass

        # Fallback to source_range start time
        if clip.source_range:
            return clip.source_range.start_time.to_seconds()

        return 0.0
