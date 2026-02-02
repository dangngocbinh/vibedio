"""Listicle video strategy (numbered list format)."""
from typing import Dict, Any, List, Optional
import opentimelineio as otio

from strategies.base_strategy import BaseStrategy
from templates.subtitle_generator import SubtitleGenerator
from utils.short_layout_helper import ShortLayoutHelper


class ListicleStrategy(BaseStrategy):
    """
    Strategy for listicle videos (numbered list format).

    Track structure:
    1. B-Roll Track - Stock footage for each item
    2. Graphics Track - Item numbers (1, 2, 3...)
    3. Subtitle Track - Word-level captions
    4. Voice Track - Voiceover audio
    5. Music Track - Background music with fade-in

    Example: "5 mistakes when learning English"
    - Hook (5s) → Item 1 (10s) → Item 2 (10s) → ... → CTA (5s)
    """

    # 3 seconds padding at the end
    OUTRO_PADDING: float = 3.0

    def populate_tracks(
        self,
        timeline: otio.schema.Timeline,
        script: Dict[str, Any],
        voice_data: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> None:
        """
        Populate timeline with listicle track structure.

        Args:
            timeline: OTIO Timeline to populate
            script: Parsed script.json
            voice_data: Parsed voice.json
            resources: Parsed resources.json
        """
        scenes = script.get('scenes', [])
        metadata = script.get('metadata', {})
        duration = metadata.get('duration', 60)

        # Add padding to total duration
        duration += self.OUTRO_PADDING
        
        # Set target aspect ratio for video matching
        ratio_str = metadata.get('ratio', '16:9')
        if ':' in ratio_str:
            w, h = map(int, ratio_str.split(':'))
            self.target_aspect_ratio = w / h
        else:
            self.target_aspect_ratio = 16 / 9  # Default landscape

        # Check if Short layout system needed (9:16 with landscape input)
        should_create_bg = ShortLayoutHelper.should_create_background_track(metadata, resources)

        # Track 0: Background (for Short format with landscape content)
        if should_create_bg:
            background_track = self._create_background_track(scenes, metadata, resources)
            timeline.tracks.append(background_track)

        # Track 1 (or 0 if no background): B-Roll Video
        video_track = self._create_broll_track(scenes, resources, metadata)
        timeline.tracks.append(video_track)

        # Track 2: Item Number Graphics
        graphics_track = self._create_graphics_track(scenes)
        timeline.tracks.append(graphics_track)

        # Track 3: Overlays (Stickers, Titles)
        overlays_track = self._create_overlays_track(script)
        if overlays_track and len(overlays_track) > 0:
            timeline.tracks.append(overlays_track)

        # Track 4: Voice
        voice_config = script.get('voice', {})
        has_voice = voice_config.get('enabled', True) and voice_data.get('text')
        
        if has_voice:
            voice_track = self._create_voice_track(voice_data, duration)
            timeline.tracks.append(voice_track)

        # Track 5: Background Music
        music_config = script.get('music', {})
        if music_config.get('enabled', True):
            music_track = self._create_music_track(resources, duration, music_config)
            if music_track:
                timeline.tracks.append(music_track)

        # Track 6: Subtitles (Moved to end for overlay)
        if has_voice:
            subtitle_gen = SubtitleGenerator(self.fps)

            # Apply layout preset positioning for Short videos
            if ShortLayoutHelper.is_short_format(metadata):
                layout_preset = metadata.get('layoutPreset', 'balanced')
                caption_position = ShortLayoutHelper.get_title_position_for_preset(layout_preset, 'captions')

                # Override subtitle position in script if not explicitly set
                if 'subtitle' not in script:
                    script['subtitle'] = {}
                if 'position' not in script.get('subtitle', {}):
                    script['subtitle']['position'] = caption_position

            subtitle_track = subtitle_gen.generate_track(voice_data, script, max_words_per_phrase=5)
            timeline.tracks.append(subtitle_track)


    def _create_background_track(
        self,
        scenes: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> otio.schema.Track:
        """
        Create background track (Track 0) for Short format videos.

        Only created for 9:16 videos with landscape content.

        Args:
            scenes: List of scenes from script.json
            metadata: Metadata from script.json
            resources: Parsed resources.json

        Returns:
            OTIO Track with background clips
        """
        track = self.create_video_track("Background")

        bg_type = metadata.get('backgroundType', 'auto')

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', '')
            duration = scene.get('duration', 5)

            # Extend last scene to match total duration padding
            if i == len(scenes) - 1:
                duration += self.OUTRO_PADDING

            # Determine background type for this scene
            if bg_type == 'auto':
                scene_bg_type = ShortLayoutHelper.suggest_background_type(resources, scene_id)
            else:
                scene_bg_type = bg_type

            # Find background resource or generate
            bg_url = None
            bg_props_info = ShortLayoutHelper.get_background_props(scene_bg_type, metadata)

            if scene_bg_type == 'custom-video':
                bg_url = ShortLayoutHelper.find_background_resource(resources, scene_id, 'custom-video')
            elif scene_bg_type == 'custom-image':
                bg_url = ShortLayoutHelper.find_background_resource(resources, scene_id, 'custom-image')
            elif scene_bg_type == 'blur-original':
                # Use same source as main content (will be blurred via props)
                clip_resource = self.create_clip_from_resource(scene_id, resources, duration)
                if clip_resource and hasattr(clip_resource, 'media_reference'):
                    bg_url = clip_resource.media_reference.target_url

            # Create background clip
            if bg_url:
                bg_clip = self.create_clip_from_url(
                    url=bg_url,
                    name=f"Background {scene_id}",
                    duration_sec=duration,
                    metadata={
                        'remotion_component': bg_props_info['component'],
                        'props': bg_props_info['props']
                    }
                )
                track.append(bg_clip)
            else:
                # Fallback: solid color background
                bg_clip = self.create_component_clip(
                    component_name='SolidColor',
                    duration_sec=duration,
                    props={'color': metadata.get('backgroundColor', '#000000')},
                    clip_name=f"Background {scene_id}"
                )
                track.append(bg_clip)

        return track

    def _create_broll_track(
        self,
        scenes: List[Dict[str, Any]],
        resources: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> otio.schema.Track:
        """
        Create B-Roll video track with scenes and transitions.

        Args:
            scenes: List of scenes from script.json
            resources: Parsed resources.json
            metadata: Optional metadata from script.json (for content positioning)

        Returns:
            OTIO Track with video clips and transitions
        """
        track = self.create_video_track("B-Roll")

        # Get content positioning mode for Short videos
        content_positioning = None
        if metadata and ShortLayoutHelper.is_short_format(metadata):
            content_positioning = metadata.get('contentPositioning', 'centered')

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', '')
            duration = scene.get('duration', 5)

            # Extend last scene to match total duration padding
            if i == len(scenes) - 1:
                duration += self.OUTRO_PADDING

            # Create clips to fill duration (multiple clips if needed to avoid black screens)
            clips = self.create_clips_to_fill_duration(
                scene_id=scene_id,
                resources=resources,
                target_duration_sec=duration,
                default_clip_duration=5.0  # Assume 5s per clip if metadata unavailable
            )

            # Apply content positioning for Short videos to all clips
            if clips and content_positioning:
                positioning_props = ShortLayoutHelper.get_content_positioning_props(
                    content_positioning,
                    duration
                )
                for clip in clips:
                    # Merge positioning props into clip metadata (safe way)
                    if 'props' not in clip.metadata:
                        clip.metadata['props'] = {}
                    clip.metadata['props'].update(positioning_props)

            # Add all clips for this scene to track
            for clip in clips:
                track.append(clip)

            # Add fade transition AFTER all clips of this scene (between scenes, not between clips)
            # Only add between item scenes (not after hook or before CTA)
            is_item = scene_id.startswith('item')
            is_not_last_item = i < len(scenes) - 2  # Not second-to-last (before CTA)

            if is_item and is_not_last_item and clips:  # Only if we actually added clips
                transition = self.create_fade_transition(duration_sec=0.5)
                track.append(transition)

        return track

    def _create_graphics_track(self, scenes: List[Dict[str, Any]]) -> otio.schema.Track:
        """
        Create graphics track with item numbers.

        Args:
            scenes: List of scenes from script.json

        Returns:
            OTIO Track with ItemNumber components
        """
        track = self.create_video_track("Item Numbers")

        # Calculate cumulative time for positioning
        current_time = 0.0

        for scene in scenes:
            scene_id = scene.get('id', '')
            duration = scene.get('duration', 10)

            # Only add number graphics for item scenes
            if scene_id.startswith('item'):
                # Extract item number from scene ID (e.g., "item1" → "1")
                item_num = scene_id.replace('item', '')

                # Create component clip positioned at scene start
                clip = self.create_component_clip(
                    component_name='ItemNumber',
                    duration_sec=duration,
                    props={
                        'number': item_num,
                        'style': 'circle',  # or 'square', 'minimal'
                        'position': 'top-left'
                    },
                    clip_name=f"Number {item_num}"
                )

                # Add source_range to position at correct time
                clip.source_range = self.timing.create_time_range(current_time, duration)

                track.append(clip)

            current_time += duration

        return track

    def _create_voice_track(
        self,
        voice_data: Dict[str, Any],
        duration: float
    ) -> otio.schema.Track:
        """
        Create voice track with voiceover audio.

        Args:
            voice_data: Parsed voice.json
            duration: Expected duration in seconds

        Returns:
            OTIO Track with voice clip
        """
        track = self.create_audio_track("Voice")

        # Create voice clip
        voice_clip = self.create_voice_clip(voice_data, duration)
        track.append(voice_clip)

        return track

    def _create_music_track(
        self,
        resources: Dict[str, Any],
        duration: float,
        music_config: Optional[Dict[str, Any]] = None
    ) -> otio.schema.Track:
        """
        Create background music track.

        Args:
            resources: Parsed resources.json
            duration: Duration in seconds
            music_config: Optional music config from script.json

        Returns:
            OTIO Track with music clip or None if no music found
        """
        # Get config from script, default to sensible values
        volume = 0.08
        fade_in = 2.0
        if music_config:
            volume = music_config.get('volume', 0.08)
            fade_in = music_config.get('fadeIn', 2.0)

        # Create music clip
        music_clip = self.create_music_clip(resources, duration, fade_in_sec=fade_in, volume=volume)

        if not music_clip:
            return None

        track = self.create_audio_track("Background Music")
        track.append(music_clip)

        return track

    def _create_overlays_track(self, script: Dict[str, Any]) -> otio.schema.Track:
        """
        Create overlays track for Stickers and LayerTitles.

        Args:
            script: Parsed script.json

        Returns:
            OTIO Track with overlay components
        """
        overlays = script.get('overlays', [])
        if not overlays:
            return None

        track = self.create_video_track("Title Overlays")

        for overlay in overlays:
            comp_type = overlay.get('type', 'Sticker') # Default to Sticker
            props = overlay.get('props', {})
            start_time = overlay.get('startTime', 0)
            duration = overlay.get('duration', 3)
            
            # Map 'type' to Remotion component name
            component_name = comp_type
            if comp_type == 'Sticker':
                component_name = 'Sticker'
            elif comp_type == 'LayerTitle':
                component_name = 'LayerTitle'
            
            clip = self.create_component_clip(
                component_name=component_name,
                duration_sec=duration,
                props=props,
                clip_name=f"{component_name}"
            )

            # Set precise start time
            # For overlay tracks, we need to set the source_range (which OtioPlayer logic uses for absolute positioning??)
            # Actually, OtioPlayer logic for overlay tracks uses startFrame derived from... where?
            # It uses clip.source_range.start_time if present.
            
            # We need to ensure start_time is set on source_range of the clip??
            # No, source_range defines the "window" into the media.
            # IN OTIO, the position in the timeline is determined by the CLIP'S position in the TRACK.
            # BUT for overlay tracks (Absolute Positioning logic in OtioPlayer), we need explicit global start time.
            # OtioPlayer logic:
            # if (clip.metadata?.globalTimelineStart !== undefined) startFrame = ...
            # else if (clip.source_range?.start_time) startFrame = ...
            
            # The 'source_range.start_time' usually refers to the media start.
            # USING 'globalTimelineStart' metadata is safer for absolute positioning overlays in our custom player.
            
            clip.metadata['globalTimelineStart'] = str(start_time)

            # We also append it to track. 
            # Since OtioPlayer iterates clips in track, and uses absolute positioning based on metadata, order doesn't technically matter for timing, but matters for z-index?
            # Actually, if we just append to track, OTIO considers them sequential.
            # But OtioPlayer's "Overlay Track" logic (via isOverlayTrack) renders them using AbsoluteFill and manual startFrame.
            # So usage of 'globalTimelineStart' is key here.
            
            track.append(clip)

        return track
