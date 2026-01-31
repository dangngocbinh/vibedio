"""Image slide video strategy with voice sync.

Creates videos from AI-generated or stock images with:
- Voice-synced timing (images match spoken content)
- AI-suggested effects (zoom, ken-burns, slide, etc.)
- AI-suggested transitions (crossfade, cut, dissolve)
- TikTok-style highlight captions
"""
from typing import Dict, Any, List, Optional
import opentimelineio as otio

from strategies.base_strategy import BaseStrategy
from templates.subtitle_generator import SubtitleGenerator
from templates.title_generator import TitleGenerator
from utils.voice_timing_sync import VoiceTimingSync, VoiceTiming
from utils.effect_suggester import EffectSuggester, EffectSuggestion, TransitionSuggestion


class ImageSlideStrategy(BaseStrategy):
    """
    Strategy for image-based videos with voice synchronization.

    Creates videos where:
    - Each scene has one image with motion effect
    - Image timing is synced with voice timestamps
    - Transitions are AI-suggested based on content
    - Captions follow TikTok highlight style

    Track structure:
    1. Image Track - Images with effects (zoom, ken-burns, slide)
    2. Subtitle Track - TikTok highlight captions
    3. Voice Track - Voiceover audio
    4. Music Track - Background music (optional)

    Example use cases:
    - Fact videos with AI-generated illustrations
    - Story videos with scene images
    - Educational content with visual aids
    """
    
    # 3 seconds padding at the end to prevent abrupt cut
    OUTRO_PADDING: float = 3.0


    def __init__(self, fps: int = 30, project_dir: str = ""):
        """
        Initialize ImageSlideStrategy.

        Args:
            fps: Frames per second
            project_dir: Project directory path for asset resolution
        """
        super().__init__(fps, project_dir)
        self.voice_sync = VoiceTimingSync()
        self.effect_suggester = EffectSuggester()

    def populate_tracks(
        self,
        timeline: otio.schema.Timeline,
        script: Dict[str, Any],
        voice_data: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> None:
        """
        Populate timeline with image slide track structure.

        Args:
            timeline: OTIO Timeline to populate
            script: Parsed script.json
            voice_data: Parsed voice.json
            resources: Parsed resources.json
        """
        scenes = script.get('scenes', [])

        # Step 1: Sync scenes with voice timing
        scene_timings = self.voice_sync.map_scenes_to_voice(scenes, voice_data)

        # Step 2: Get effect suggestions for all scenes
        effect_suggestions = self.effect_suggester.suggest_all_effects(scenes)

        # Step 3: Get transition suggestions
        transition_suggestions = self.effect_suggester.suggest_all_transitions(scenes)

        # Step 4: Calculate total duration from voice
        total_duration = self.voice_sync.get_total_voice_duration(voice_data)
        if total_duration == 0:
            total_duration = script.get('metadata', {}).get('duration', 60)
        
        # Add padding to allow music/video to fade out naturally
        total_duration += self.OUTRO_PADDING

        # Track 1: Images with effects (synced to voice)
        image_track = self._create_image_track_synced(
            scenes=scenes,
            resources=resources,
            scene_timings=scene_timings,
            effect_suggestions=effect_suggestions,
            transition_suggestions=transition_suggestions
        )
        
        # [FIX] Compensate for transition overlaps to match total duration
        self._adjust_track_for_transitions(image_track, total_duration)
        
        timeline.tracks.append(image_track)

        # Track 2: Custom Titles (FullscreenTitle, LayerTitle)
        title_gen = TitleGenerator(self.fps)
        titles_track = title_gen.generate_track(script)
        if len(titles_track) > 0:
            timeline.tracks.append(titles_track)

        # Track 3: Voice
        voice_track = self._create_voice_track(voice_data, total_duration)
        timeline.tracks.append(voice_track)

        # Track 4: Background Music (optional)
        music_config = script.get('music', {})
        music_track = self._create_music_track(resources, total_duration, music_config)
        if music_track:
            timeline.tracks.append(music_track)

        # Track 5: Subtitles (TikTok highlight style) - LAST
        subtitle_gen = SubtitleGenerator(self.fps)
        subtitle_track = subtitle_gen.generate_track(
            voice_data, script, max_words_per_phrase=5
        )
        timeline.tracks.append(subtitle_track)
        subtitle_gen = SubtitleGenerator(self.fps)
        subtitle_track = subtitle_gen.generate_track(
            voice_data, script, max_words_per_phrase=5
        )
        timeline.tracks.append(subtitle_track)

        # Track 2: Custom Titles (FullscreenTitle, LayerTitle)
        title_gen = TitleGenerator(self.fps)
        titles_track = title_gen.generate_track(script)
        if len(titles_track) > 0:
            timeline.tracks.append(titles_track)

        # Track 3: Voice
        voice_track = self._create_voice_track(voice_data, total_duration)
        timeline.tracks.append(voice_track)

        # Track 4: Background Music (optional)
        music_config = script.get('music', {})
        music_track = self._create_music_track(resources, total_duration, music_config)
        if music_track:
            timeline.tracks.append(music_track)

        # Track 5: Subtitles (TikTok highlight style) - LAST
        subtitle_gen = SubtitleGenerator(self.fps)
        subtitle_track = subtitle_gen.generate_track(
            voice_data, script, max_words_per_phrase=5
        )
        timeline.tracks.append(subtitle_track)
    def _create_image_track_synced(
        self,
        scenes: List[Dict[str, Any]],
        resources: Dict[str, Any],
        scene_timings: Dict[str, VoiceTiming],
        effect_suggestions: Dict[str, EffectSuggestion],
        transition_suggestions: Dict[str, TransitionSuggestion]
    ) -> otio.schema.Track:
        """
        Create image track with voice-synced timing and effects.

        Args:
            scenes: List of scenes from script.json
            resources: Parsed resources.json
            scene_timings: Voice timing for each scene
            effect_suggestions: Suggested effects per scene
            transition_suggestions: Suggested transitions per scene

        Returns:
            OTIO Track with image clips and transitions
        """
        track = self.create_video_track("Images")

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')

            # Get voice-synced timing
            timing = scene_timings.get(scene_id)
            if not timing:
                # Fallback to script timing
                duration = scene.get('duration', 5)
            else:
                duration = timing.duration
            
            # Extend last scene to match total duration padding
            if i == len(scenes) - 1:
                duration += self.OUTRO_PADDING

            # Get effect suggestion
            effect = effect_suggestions.get(scene_id, self.effect_suggester.DEFAULT_EFFECT)

            # Create image clip with effect
            clip = self._create_scene_image_clip(
                scene_id=scene_id,
                scene=scene,
                resources=resources,
                duration=duration,
                effect=effect
            )

            if clip:
                track.append(clip)

                # Add transition if not last scene
                if i < len(scenes) - 1:
                    transition_suggestion = transition_suggestions.get(scene_id)
                    if transition_suggestion and transition_suggestion.transition != 'none':
                        transition = self.create_transition(
                            transition_type=transition_suggestion.transition,
                            duration_sec=transition_suggestion.duration
                        )
                        if transition:
                            track.append(transition)

        return track

    def _create_scene_image_clip(
        self,
        scene_id: str,
        scene: Dict[str, Any],
        resources: Dict[str, Any],
        duration: float,
        effect: EffectSuggestion
    ) -> Optional[otio.schema.Clip]:
        """
        Create image clip for a scene with effect metadata.

        Args:
            scene_id: Scene identifier
            scene: Scene dict from script
            resources: Parsed resources.json
            duration: Clip duration in seconds
            effect: Effect suggestion for this scene

        Returns:
            OTIO Clip with effect metadata or None
        """
        # Try to get image from resources
        image_url = None

        if self.asset_resolver:
            # First try direct image
            image_url = self.asset_resolver.resolve_image_from_scene(scene_id, resources)

            # If no image, try video (will be treated as image/still)
            if not image_url:
                image_url = self.asset_resolver.resolve_video_from_scene(scene_id, resources)

        # Fallback to visual suggestion if specified
        if not image_url:
            visual = scene.get('visualSuggestion', {})
            if visual.get('type') == 'ai-generated':
                # Placeholder - image should have been generated already
                image_url = f"generated/{scene_id}.png"

        if not image_url:
            # Create placeholder clip
            return self._create_placeholder_clip(scene_id, duration, effect)

        # Create image clip with effect
        effect_params = self.effect_suggester.get_effect_params(effect)

        return self.create_image_clip_with_effect(
            url=image_url,
            name=f"{scene_id} Image",
            duration_sec=duration,
            effect=effect.effect,
            effect_params=effect_params
        )

    def _create_placeholder_clip(
        self,
        scene_id: str,
        duration: float,
        effect: EffectSuggestion
    ) -> otio.schema.Clip:
        """
        Create placeholder clip when no image is available.

        Args:
            scene_id: Scene identifier
            duration: Clip duration
            effect: Effect suggestion

        Returns:
            OTIO Clip with placeholder component
        """
        return self.create_component_clip(
            component_name='ImagePlaceholder',
            duration_sec=duration,
            props={
                'scene_id': scene_id,
                'message': f'Image missing for {scene_id}',
                'effect': effect.effect,
                'effect_params': self.effect_suggester.get_effect_params(effect)
            },
            clip_name=f"{scene_id} Placeholder"
        )

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

        voice_clip = self.create_voice_clip(voice_data, duration)
        track.append(voice_clip)

        return track

    def _create_music_track(
        self,
        resources: Dict[str, Any],
        duration: float,
        music_config: Optional[Dict[str, Any]] = None
    ) -> Optional[otio.schema.Track]:
        """
        Create background music track.

        Args:
            resources: Parsed resources.json
            duration: Duration in seconds
            music_config: Optional music config from script.json (contains volume, fadeIn, fadeOut)

        Returns:
            OTIO Track with music clip or None if no music found
        """
        # Get volume from music config, default to 0.2 (20%)
        volume = 0.2
        fade_in = 2.0
        if music_config:
            volume = music_config.get('volume', 0.2)
            fade_in = music_config.get('fadeIn', 2.0)

        music_clip = self.create_music_clip(resources, duration, fade_in_sec=fade_in, volume=volume)

        if not music_clip:
            return None

        track = self.create_audio_track("Background Music")
        track.append(music_clip)

        return track

    def _adjust_track_for_transitions(
        self,
        track: otio.schema.Track,
        target_duration: float
    ) -> None:
        """
        Adjust clip durations to compensate for transition overlaps.
        
        Transitions overlap with adjacent clips, reducing the total timeline duration.
        This method scales clip durations proportionally to match the target duration.
        
        Args:
            track: Image track to adjust
            target_duration: Target duration in seconds (from audio)
        """
        # Calculate current net duration (accounting for transition overlaps)
        clips = []
        current_duration = 0.0
        
        for item in track:
            if isinstance(item, otio.schema.Clip):
                clips.append(item)
                dur_sec = item.source_range.duration.value / self.fps
                current_duration += dur_sec
            elif isinstance(item, otio.schema.Transition):
                # Transitions overlap - subtract from total
                in_off = item.in_offset.value / self.fps
                out_off = item.out_offset.value / self.fps
                current_duration -= (in_off + out_off)
        
        if not clips or current_duration <= 0:
            return
        
        # Calculate scale factor
        scale = target_duration / current_duration
        
        # Only adjust if there's a significant difference (> 0.5s)
        diff = abs(target_duration - current_duration)
        if diff < 0.5:
            return
        
        # Apply scaling to all clips
        for clip in clips:
            old_frames = clip.source_range.duration.value
            new_frames = round(old_frames * scale)
            
            clip.source_range = otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(0, self.fps),
                duration=otio.opentime.RationalTime(new_frames, self.fps)
            )

    def get_strategy_info(self) -> Dict[str, Any]:
        """
        Get information about this strategy.

        Returns:
            Dict with strategy metadata
        """
        return {
            'name': 'ImageSlideStrategy',
            'video_type': 'image-slide',
            'description': 'Image-based video with voice sync and AI effects',
            'features': [
                'Voice-synced image timing',
                'AI-suggested effects (zoom, ken-burns, slide)',
                'AI-suggested transitions',
                'TikTok highlight captions'
            ],
            'track_structure': [
                'Images (with effects)',
                'Subtitles (TikTok style)',
                'Voice',
                'Background Music (optional)'
            ]
        }
