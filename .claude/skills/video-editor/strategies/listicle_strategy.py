"""Listicle video strategy (numbered list format)."""
from typing import Dict, Any, List
import opentimelineio as otio

from strategies.base_strategy import BaseStrategy
from templates.subtitle_generator import SubtitleGenerator


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
        duration = script.get('metadata', {}).get('duration', 60)

        # Track 1: B-Roll Video
        video_track = self._create_broll_track(scenes, resources)
        timeline.tracks.append(video_track)

        # Track 2: Item Number Graphics
        graphics_track = self._create_graphics_track(scenes)
        timeline.tracks.append(graphics_track)

        # Track 3: Subtitles
        subtitle_gen = SubtitleGenerator(self.fps)
        subtitle_track = subtitle_gen.generate_track(voice_data, script, max_words_per_phrase=5)
        timeline.tracks.append(subtitle_track)

        # Track 4: Voice
        voice_track = self._create_voice_track(voice_data, duration)
        timeline.tracks.append(voice_track)

        # Track 5: Background Music
        music_track = self._create_music_track(resources, duration)
        if music_track:
            timeline.tracks.append(music_track)

    def _create_broll_track(
        self,
        scenes: List[Dict[str, Any]],
        resources: Dict[str, Any]
    ) -> otio.schema.Track:
        """
        Create B-Roll video track with scenes and transitions.

        Args:
            scenes: List of scenes from script.json
            resources: Parsed resources.json

        Returns:
            OTIO Track with video clips and transitions
        """
        track = self.create_video_track("B-Roll")

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', '')
            duration = scene.get('duration', 5)

            # Create clip from resources
            clip = self.create_clip_from_resource(scene_id, resources, duration)

            if clip:
                track.append(clip)

                # Add fade transition between items (but not after hook or before CTA)
                is_item = scene_id.startswith('item')
                is_not_last_item = i < len(scenes) - 2  # Not second-to-last (before CTA)

                if is_item and is_not_last_item:
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
        duration: float
    ) -> otio.schema.Track:
        """
        Create background music track.

        Args:
            resources: Parsed resources.json
            duration: Duration in seconds

        Returns:
            OTIO Track with music clip or None if no music found
        """
        # Create music clip with 2s fade-in
        music_clip = self.create_music_clip(resources, duration, fade_in_sec=2.0)

        if not music_clip:
            return None

        track = self.create_audio_track("Background Music")
        track.append(music_clip)

        return track
