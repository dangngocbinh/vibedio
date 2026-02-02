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
from utils.short_layout_helper import ShortLayoutHelper


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
        metadata = script.get('metadata', {})

        # Step 1: Sync scenes with voice timing
        scene_timings = self.voice_sync.map_scenes_to_voice(scenes, voice_data)

        # Step 2: Get effect suggestions for all scenes
        effect_suggestions = self.effect_suggester.suggest_all_effects(scenes)

        # Step 3: Get transition suggestions
        transition_suggestions = self.effect_suggester.suggest_all_transitions(scenes)

        # Step 4: Calculate total duration from voice
        total_duration = self.voice_sync.get_total_voice_duration(voice_data)
        if total_duration == 0:
            total_duration = metadata.get('duration', 60)

        # Add padding to allow music/video to fade out naturally
        total_duration += self.OUTRO_PADDING

        # Check if Short layout system needed (9:16 with landscape input)
        should_create_bg = ShortLayoutHelper.should_create_background_track(metadata, resources)

        # Track 0: Background (for Short format with landscape content)
        if should_create_bg:
            background_track = self._create_background_track(
                scenes=scenes,
                metadata=metadata,
                resources=resources,
                scene_timings=scene_timings
            )
            timeline.tracks.append(background_track)

        # Track 1 (or 0 if no background): Images with effects (synced to voice)
        image_track = self._create_image_track_synced(
            scenes=scenes,
            resources=resources,
            scene_timings=scene_timings,
            effect_suggestions=effect_suggestions,
            transition_suggestions=transition_suggestions,
            metadata=metadata
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
        voice_config = script.get('voice', {})
        has_voice = voice_config.get('enabled', True) and voice_data.get('text')
        
        if has_voice:
            voice_track = self.create_audio_track("Voice")
            
            # [RULE] Voice always starts from beginning (0.0) unless explicitly configured mechanism exists
            # User request: "nếu chèn voice ko hỏi chèn ở đâu thì hãy hiểu là chèn từ đầu nhé"
            # User request: "TIMELINE GIAY THỨ HAI MỚI XUẤT HIỆN VOICE NHÉ" -> offset configurable via script
            voice_offset = voice_config.get('startOffset', 0.0)
            
            # Previous logic attempted to auto-calculate offset based on intro scenes, 
            # but this caused confusion and mismatch ("bị bậy"). 
            # We disable it to strictly follow "start from 0" rule unless manually overridden.
            
            if voice_offset > 0:
                gap = otio.schema.Gap(source_range=self.timing.create_time_range(0, voice_offset))
                voice_track.append(gap)
                
            voice_clip = self.create_voice_clip(voice_data, total_duration)
            # Shift voice clip in OtioPlayer
            voice_clip.metadata['globalTimelineStart'] = str(voice_offset)
            voice_track.append(voice_clip)
            timeline.tracks.append(voice_track)

        # Track 4: Background Music (optional)
        music_config = script.get('music', {})
        music_track = self._create_music_track(resources, total_duration, music_config)
        if music_track:
            timeline.tracks.append(music_track)

        if has_voice:
            # [SMART SYNC] Calculate voice_offset from script
            # If startOffset is set, it becomes the AUTHORITY for the Intro Duration
            voice_offset = script.get('voice', {}).get('startOffset', 0.0)
            
            # If we have an offset AND the first scene is a title/intro
            # We automatically snap the intro duration to match the offset
            # This saves the user from manually syncing them
            if voice_offset > 0 and len(scenes) > 0:
                first_scene = scenes[0]
                if first_scene.get('type') == 'title':
                    print(f"⚡️ [Smart Sync] Auto-adjusting Intro Duration to {voice_offset}s to match Voice Offset")
                    first_scene['duration'] = voice_offset
                    # Update local timing map if needed (though visual track is generated later)

            # Apply layout preset positioning for Short videos
            if ShortLayoutHelper.is_short_format(metadata):
                layout_preset = metadata.get('layoutPreset', 'balanced')
                caption_position = ShortLayoutHelper.get_title_position_for_preset(layout_preset, 'captions')

                # Override subtitle position in script if not explicitly set
                if 'subtitle' not in script:
                    script['subtitle'] = {}
                if 'position' not in script.get('subtitle', {}):
                    script['subtitle']['position'] = caption_position

            subtitle_gen = SubtitleGenerator(self.fps)
            # Pass offset to generator so it shifts timestamps internally
            subtitle_track = subtitle_gen.generate_track(
                voice_data, script, max_words_per_phrase=5, offset=voice_offset
            )

            # NOTE: We do NOT insert a Gap here anymore.
            # The SubtitleGenerator has shifted the timestamps, so SubtitleTrack.tsx will
            # automatically create the necessary gaps based on the shifted start times.

            timeline.tracks.append(subtitle_track)

    def _create_background_track(
        self,
        scenes: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        resources: Dict[str, Any],
        scene_timings: Dict[str, VoiceTiming]
    ) -> otio.schema.Track:
        """
        Create background track (Track 0) for Short format videos.

        Only created for 9:16 videos with landscape content.

        Args:
            scenes: List of scenes from script.json
            metadata: Metadata from script.json
            resources: Parsed resources.json
            scene_timings: Voice timing for each scene

        Returns:
            OTIO Track with background clips
        """
        track = self.create_video_track("Background")

        bg_type = metadata.get('backgroundType', 'auto')

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')

            # Get voice-synced timing
            timing = scene_timings.get(scene_id)
            if not timing:
                duration = scene.get('duration', 5)
            else:
                duration = timing.duration

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
            elif scene_bg_type in ('blur-original', 'gradient'):
                # For images, gradient is better default than blur
                # Try to get main content URL for blur
                image_url = self._get_scene_image_url(scene_id, scene, resources)
                if image_url and scene_bg_type == 'blur-original':
                    bg_url = image_url
                # else gradient will be created via component

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
                # Fallback: gradient or solid color background
                component_name = bg_props_info['component']
                bg_clip = self.create_component_clip(
                    component_name=component_name,
                    duration_sec=duration,
                    props=bg_props_info['props'],
                    clip_name=f"Background {scene_id}"
                )
                track.append(bg_clip)

        return track

    def _create_image_track_synced(
        self,
        scenes: List[Dict[str, Any]],
        resources: Dict[str, Any],
        scene_timings: Dict[str, VoiceTiming],
        effect_suggestions: Dict[str, EffectSuggestion],
        transition_suggestions: Dict[str, TransitionSuggestion],
        metadata: Optional[Dict[str, Any]] = None
    ) -> otio.schema.Track:
        """
        Create image track with voice-synced timing and effects.

        Args:
            scenes: List of scenes from script.json
            resources: Parsed resources.json
            scene_timings: Voice timing for each scene
            effect_suggestions: Suggested effects per scene
            transition_suggestions: Suggested transitions per scene
            metadata: Optional metadata from script.json (for content positioning)

        Returns:
            OTIO Track with image clips and transitions
        """
        track = self.create_video_track("Images")

        # Get content positioning mode for Short videos
        content_positioning = None
        if metadata and ShortLayoutHelper.is_short_format(metadata):
            content_positioning = metadata.get('contentPositioning', 'centered')

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
                effect=effect,
                content_positioning=content_positioning
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

    def _get_scene_image_url(
        self,
        scene_id: str,
        scene: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> Optional[str]:
        """
        Get image URL for a scene (helper for background track).

        Args:
            scene_id: Scene identifier
            scene: Scene dict from script
            resources: Parsed resources.json

        Returns:
            Image URL or None
        """
        image_url = None

        # Extract resourceType preference from scene
        visual = scene.get('visualSuggestion', {})
        prefer_type = visual.get('resourceType', 'auto')

        if self.asset_resolver:
            # First try direct image (respecting preference)
            image_url = self.asset_resolver.resolve_image_from_scene(scene_id, resources, prefer_type)

            # If no image, try video (respecting preference)
            if not image_url:
                image_url = self.asset_resolver.resolve_video_from_scene(scene_id, resources, prefer_type)

        # Fallback to visual suggestion
        if not image_url:
            visual = scene.get('visualSuggestion', {})
            if visual.get('type') == 'ai-generated':
                image_url = f"generated/{scene_id}.png"

        return image_url

    def _create_scene_image_clip(
        self,
        scene_id: str,
        scene: Dict[str, Any],
        resources: Dict[str, Any],
        duration: float,
        effect: EffectSuggestion,
        content_positioning: Optional[str] = None
    ) -> Optional[otio.schema.Clip]:
        """
        Create image clip for a scene with effect metadata.

        Args:
            scene_id: Scene identifier
            scene: Scene dict from script
            resources: Parsed resources.json
            duration: Clip duration in seconds
            effect: Effect suggestion for this scene
            content_positioning: Optional positioning mode for Short videos

        Returns:
            OTIO Clip with effect metadata or None
        """
        # Try to get image from resources
        image_url = self._get_scene_image_url(scene_id, scene, resources)

        if not image_url:
            # Check if this is a title scene
            if scene.get('type') == 'title':
                return self.create_component_clip(
                    component_name=scene.get('title_type', 'FullscreenTitle'),
                    duration_sec=duration,
                    props=scene.get('props', {}),
                    clip_name=f"{scene_id} Title"
                )
            
            # Create placeholder clip
            return self._create_placeholder_clip(scene_id, duration, effect)

        # Create image clip with effect
        effect_params = self.effect_suggester.get_effect_params(effect)

        clip = self.create_image_clip_with_effect(
            url=image_url,
            name=f"{scene_id} Image",
            duration_sec=duration,
            effect=effect.effect,
            effect_params=effect_params
        )

        # [FEATURE] Apply content positioning for Short videos
        if content_positioning:
            positioning_props = ShortLayoutHelper.get_content_positioning_props(
                content_positioning,
                duration
            )
            # Merge positioning props into clip metadata
            if not clip.metadata:
                clip.metadata = {}
            if 'props' not in clip.metadata:
                clip.metadata['props'] = {}
            clip.metadata['props'].update(positioning_props)

        # [FEATURE] Apply custom volume if specified in scene (e.g. mute specific scene)
        if 'videoVolume' in scene:
            clip.metadata['video_volume'] = str(scene['videoVolume'])

        return clip

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
        # Get volume from music config, default to 0.08 (8%)
        volume = 0.08
        fade_in = 2.0
        fade_out = 3.0
        if music_config:
            volume = music_config.get('volume', 0.08)
            fade_in = music_config.get('fadeIn', 2.0)
            fade_out = music_config.get('fadeOut', 3.0)

        music_clip = self.create_music_clip(resources, duration, fade_in_sec=fade_in, fade_out_sec=fade_out, volume=volume)

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
