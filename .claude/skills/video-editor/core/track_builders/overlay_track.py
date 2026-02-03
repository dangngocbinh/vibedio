"""Overlay track builder - auto-generates overlays from script config."""
from typing import Dict, Any, Optional
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator


class OverlayTrackBuilder:
    """Builds overlay track with auto-generated title overlays and legacy overlays."""

    def __init__(self, fps: int = 30):
        """
        Initialize OverlayTrackBuilder.

        Args:
            fps: Frames per second
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)

    def build(self, script: Dict[str, Any]) -> otio.schema.Track:
        """
        Build overlay track with auto-generated overlays.

        Args:
            script: Parsed script.json

        Returns:
            OTIO Track with overlay clips
        """
        track = otio.schema.Track(name="Overlays", kind=otio.schema.TrackKind.Video)

        # Check if script uses sections (new format) or scenes (legacy)
        if 'sections' in script:
            self._build_from_sections(track, script)
        else:
            self._build_from_scenes(track, script)

        # Add legacy overlays if present
        self._add_legacy_overlays(track, script)

        return track

    def _build_from_sections(self, track: otio.schema.Track, script: Dict[str, Any]) -> None:
        """Build overlays from sections - simple timing like Caption track."""
        sections = script.get('sections', [])
        
        for s_idx, section in enumerate(sections):
            # Handle Section Title Card as overlay (if enabled and asOverlay=true)
            title_card_config = section.get('titleCard', {})
            if title_card_config.get('enabled', False) and title_card_config.get('asOverlay', False):
                # Section title overlay - use section timing
                start_time = section.get('startTime', 0.0)
                duration = title_card_config.get('duration', 2.0)
                
                overlay_clip = self._create_section_overlay(
                    section, 
                    title_card_config, 
                    start_time
                )
                if overlay_clip:
                    track.append(overlay_clip)
            
            # Process scene overlays
            scenes = section.get('scenes', [])
            for scene in scenes:
                overlay_config = scene.get('titleOverlay', {})
                if not overlay_config.get('enabled', False):
                    continue
                
                # Get scene timing (like Caption does with phrase timing)
                start_time = scene.get('startTime')
                if start_time is None:
                    continue  # Skip if no timing info
                
                # Calculate duration from endTime or use scene duration
                if 'endTime' in scene and 'startTime' in scene:
                    duration = scene['endTime'] - scene['startTime']
                else:
                    duration = scene.get('duration', 5.0)
                
                if duration < 0.1:
                    duration = 0.1
                
                # Create overlay clip at exact scene timing
                overlay_clip = self._create_title_overlay(
                    scene, 
                    overlay_config, 
                    start_time,
                    duration
                )
                if overlay_clip:
                    track.append(overlay_clip)

    def _build_from_scenes(self, track: otio.schema.Track, script: Dict[str, Any]) -> None:
        """Build overlays from legacy scenes - simple timing like Caption track."""
        scenes = script.get('scenes', [])

        for scene in scenes:
            overlay_config = scene.get('titleOverlay', {})
            if not overlay_config.get('enabled', False):
                continue
            
            # Get scene timing (like Caption)
            start_time = scene.get('startTime')
            if start_time is None:
                continue  # Skip if no timing
            
            # Calculate duration
            if 'endTime' in scene and 'startTime' in scene:
                duration = scene['endTime'] - scene['startTime']
            else:
                duration = scene.get('duration', 5.0)
            
            if duration < 0.1:
                duration = 0.1
            
            # Create overlay at exact scene timing
            overlay_clip = self._create_title_overlay(
                scene, 
                overlay_config, 
                start_time,
                duration
            )
            if overlay_clip:
                track.append(overlay_clip)

    def _create_section_overlay(
        self,
        section: Dict[str, Any],
        config: Dict[str, Any],
        start_time: float
    ) -> Optional[otio.schema.Clip]:
        """
        Create section title overlay (not fullscreen).

        Args:
            section: Section dict
            config: Title card configuration
            start_time: Start time in seconds

        Returns:
            OTIO Clip or None
        """
        text = config.get('text', section.get('title', ''))
        duration = config.get('duration', 2.0)
        style = config.get('style', 'default')
        position = config.get('position', 'center')

        if not text:
            return None

        media_ref = otio.schema.MissingReference()
        # Use absolute timing like Caption does
        source_range = self.timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Section Overlay: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LayerTitle'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'title': text,
            'position': position,
            'style': style,
            'subtitle': config.get('subtitle', ''),
        }

        return clip

    def _create_title_overlay(
        self,
        scene: Dict[str, Any],
        overlay_config: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> Optional[otio.schema.Clip]:
        """
        Create LayerTitle overlay from scene.titleOverlay config.

        Args:
            scene: Scene dict
            overlay_config: titleOverlay configuration
            start_time: Start time in seconds (absolute timeline position)
            duration: Duration in seconds

        Returns:
            OTIO Clip or None
        """
        text = overlay_config.get('text', '')
        style = overlay_config.get('style', 'highlight')
        position = overlay_config.get('position', 'bottom')

        if not text:
            return None

        media_ref = otio.schema.MissingReference()
        # Use absolute timing like Caption does
        source_range = self.timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Title: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LayerTitle'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'title': text,
            'position': position,
            'style': style,
        }

        return clip

    def _add_legacy_overlays(self, track: otio.schema.Track, script: Dict[str, Any]) -> None:
        """
        Add legacy overlays from script.overlays array (if present).

        Args:
            track: Track to add overlays to
            script: Parsed script.json
        """
        legacy_overlays = script.get('overlays', [])

        for overlay in legacy_overlays:
            overlay_type = overlay.get('type', 'text')
            start_time = overlay.get('startTime', 0.0)
            duration = overlay.get('duration', 3.0)

            clip = None

            if overlay_type == 'text' or overlay_type == 'title':
                clip = self._create_legacy_text_overlay(overlay, start_time, duration)
            elif overlay_type == 'sticker' or overlay_type == 'emoji':
                clip = self._create_legacy_sticker_overlay(overlay, start_time, duration)
            elif overlay_type == 'cta':
                clip = self._create_legacy_cta_overlay(overlay, start_time, duration)

            if clip:
                track.append(clip)

    def _create_legacy_text_overlay(
        self,
        overlay: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> Optional[otio.schema.Clip]:
        """Create legacy text overlay."""
        text = overlay.get('text', '')
        if not text:
            return None

        media_ref = otio.schema.MissingReference()
        source_range = self.timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Overlay: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LayerTitle'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'title': text,
            'position': overlay.get('position', 'center'),
            'style': overlay.get('style', 'default'),
        }

        return clip

    def _create_legacy_sticker_overlay(
        self,
        overlay: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> Optional[otio.schema.Clip]:
        """Create legacy sticker overlay."""
        emoji = overlay.get('emoji', overlay.get('content', ''))
        if not emoji:
            return None

        media_ref = otio.schema.MissingReference()
        source_range = self.timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Sticker: {emoji}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'Sticker'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'emoji': emoji,
            'position': overlay.get('position', 'center'),
            'size': overlay.get('size', 'medium'),
            'animation': overlay.get('animation', 'bounce'),
        }

        return clip

    def _create_legacy_cta_overlay(
        self,
        overlay: Dict[str, Any],
        start_time: float,
        duration: float
    ) -> Optional[otio.schema.Clip]:
        """Create legacy CTA overlay."""
        text = overlay.get('text', '')
        if not text:
            return None

        media_ref = otio.schema.MissingReference()
        source_range = self.timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"CTA: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'CallToAction'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'text': text,
            'action': overlay.get('action', 'subscribe'),
            'style': overlay.get('style', 'default'),
        }

        return clip
