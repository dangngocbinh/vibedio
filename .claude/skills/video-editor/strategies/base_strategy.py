"""Base strategy for video timeline generation."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import opentimelineio as otio

from core.asset_resolver import AssetResolver
from utils.timing_calculator import TimingCalculator


class BaseStrategy(ABC):
    """
    Abstract base class for all video type strategies.

    Each video type (facts, listicle, motivation, story) implements
    this interface to create different track structures.
    """

    def __init__(self, fps: int = 30, project_dir: str = ""):
        """
        Initialize BaseStrategy.

        Args:
            fps: Frames per second
            project_dir: Project directory path for asset resolution
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)
        self.asset_resolver = AssetResolver(project_dir) if project_dir else None

    @abstractmethod
    def populate_tracks(
        self,
        timeline: otio.schema.Timeline,
        script: Dict[str, Any],
        voice_data: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> None:
        """
        Populate timeline with tracks for this video type.

        This method must be implemented by each strategy subclass.

        Args:
            timeline: OTIO Timeline object to populate
            script: Parsed script.json
            voice_data: Parsed voice.json
            resources: Parsed resources.json
        """
        pass

    def create_video_track(self, name: str = "Main Video") -> otio.schema.Track:
        """
        Create a video track.

        Args:
            name: Track name

        Returns:
            OTIO Track object with kind="Video"
        """
        return otio.schema.Track(name=name, kind=otio.schema.TrackKind.Video)

    def create_audio_track(self, name: str = "Voice") -> otio.schema.Track:
        """
        Create an audio track.

        Args:
            name: Track name

        Returns:
            OTIO Track object with kind="Audio"
        """
        return otio.schema.Track(name=name, kind=otio.schema.TrackKind.Audio)

    def create_clip_from_url(
        self,
        url: str,
        name: str,
        duration_sec: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> otio.schema.Clip:
        """
        Create clip from URL with duration.

        Args:
            url: Media URL (can be remote or relative path)
            name: Clip name
            duration_sec: Duration in seconds
            metadata: Optional metadata dict

        Returns:
            OTIO Clip object
        """
        # Create media reference
        media_ref = otio.schema.ExternalReference(target_url=url)

        # Create source range
        source_range = self.timing.create_time_range(0, duration_sec)

        # Create clip
        clip = otio.schema.Clip(
            name=name,
            media_reference=media_ref,
            source_range=source_range
        )

        # Add metadata if provided
        if metadata:
            for key, value in metadata.items():
                clip.metadata[key] = value

        return clip

    def create_clip_from_resource(
        self,
        scene_id: str,
        resources: Dict[str, Any],
        duration_sec: float
    ) -> Optional[otio.schema.Clip]:
        """
        Create video clip from resources.json for a specific scene.

        Args:
            scene_id: Scene identifier (e.g., "hook", "item1")
            resources: Parsed resources.json
            duration_sec: Clip duration in seconds

        Returns:
            OTIO Clip or None if resource not found
        """
        if not self.asset_resolver:
            return None

        # Try to find video first
        video_url = self.asset_resolver.resolve_video_from_scene(scene_id, resources)

        if video_url:
            return self.create_clip_from_url(
                url=video_url,
                name=f"{scene_id} Video",
                duration_sec=duration_sec
            )

        # Fallback to image
        image_url = self.asset_resolver.resolve_image_from_scene(scene_id, resources)

        if image_url:
            return self.create_clip_from_url(
                url=image_url,
                name=f"{scene_id} Image",
                duration_sec=duration_sec
            )

        return None

    def create_component_clip(
        self,
        component_name: str,
        duration_sec: float,
        props: Dict[str, Any],
        clip_name: Optional[str] = None
    ) -> otio.schema.Clip:
        """
        Create clip for Remotion component (no media reference).

        Args:
            component_name: Remotion component name (e.g., "ItemNumber")
            duration_sec: Duration in seconds
            props: Props dict for the component
            clip_name: Optional custom clip name

        Returns:
            OTIO Clip with component metadata
        """
        # Use MissingReference for component clips
        media_ref = otio.schema.MissingReference()

        # Create source range
        source_range = self.timing.create_time_range(0, duration_sec)

        # Create clip
        clip = otio.schema.Clip(
            name=clip_name or f"{component_name} Component",
            media_reference=media_ref,
            source_range=source_range
        )

        # Add Remotion component metadata
        clip.metadata['remotion_component'] = component_name
        clip.metadata['props'] = props

        return clip

    def create_voice_clip(
        self,
        voice_data: Dict[str, Any],
        duration_sec: float,
        volume: float = 1.0
    ) -> otio.schema.Clip:
        """
        Create voice audio clip from voice.json.

        Args:
            voice_data: Parsed voice.json
            duration_sec: Duration in seconds
            volume: Audio volume (0.0 to 1.0, default 1.0 = 100%)

        Returns:
            OTIO Clip for voice audio
        """
        if self.asset_resolver:
            voice_url = self.asset_resolver.resolve_voice_path()
        else:
            voice_url = "voice.mp3"

        clip = self.create_clip_from_url(
            url=voice_url,
            name="Voiceover",
            duration_sec=duration_sec
        )

        # Add volume metadata
        clip.metadata['volume'] = str(volume)

        return clip

    def create_music_clip(
        self,
        resources: Dict[str, Any],
        duration_sec: float,
        fade_in_sec: float = 2.0,
        fade_out_sec: float = 2.0,
        volume: float = 0.2
    ) -> Optional[otio.schema.Clip]:
        """
        Create background music clip from resources.

        Args:
            resources: Parsed resources.json
            duration_sec: Duration in seconds
            fade_in_sec: Fade-in duration in seconds
            volume: Audio volume (0.0 to 1.0, default 0.2 = 20%)

        Returns:
            OTIO Clip for music or None if no music found
        """
        if not self.asset_resolver:
            return None

        music_url = self.asset_resolver.resolve_music_from_resources(resources)

        if not music_url:
            return None

        clip = self.create_clip_from_url(
            url=music_url,
            name="Background Music",
            duration_sec=duration_sec
        )

        # Add fade-in and volume metadata
        clip.metadata['audio_fade_in'] = str(fade_in_sec)
        clip.metadata['audio_fade_out'] = str(fade_out_sec)
        clip.metadata['volume'] = str(volume)

        return clip

    def create_fade_transition(self, duration_sec: float = 0.5) -> otio.schema.Transition:
        """
        Create fade transition.

        Args:
            duration_sec: Transition duration in seconds

        Returns:
            OTIO Transition object
        """
        duration_frames = self.timing.seconds_to_frames(duration_sec)
        half_duration = duration_frames // 2

        return otio.schema.Transition(
            transition_type=otio.schema.TransitionTypes.SMPTE_Dissolve,
            in_offset=otio.opentime.RationalTime(half_duration, self.fps),
            out_offset=otio.opentime.RationalTime(half_duration, self.fps)
        )

    def create_image_clip_with_effect(
        self,
        url: str,
        name: str,
        duration_sec: float,
        effect: str = 'ken-burns',
        effect_params: Optional[Dict[str, Any]] = None
    ) -> otio.schema.Clip:
        """
        Create image clip with effect metadata for Remotion.

        Args:
            url: Image URL (can be remote or relative path)
            name: Clip name
            duration_sec: Duration in seconds
            effect: Effect type ('zoom-in', 'zoom-out', 'ken-burns', 'slide', 'scale', 'none')
            effect_params: Optional effect parameters (intensity, direction, etc.)

        Returns:
            OTIO Clip with effect metadata
        """
        # Create base clip
        clip = self.create_clip_from_url(url, name, duration_sec)

        # Add effect metadata for Remotion
        clip.metadata['effect'] = effect
        clip.metadata['effect_params'] = effect_params or {
            'intensity': 0.5,
            'direction': 'random',
            'easing': 'ease-in-out'
        }

        # Mark as image clip (vs video)
        clip.metadata['media_type'] = 'image'

        return clip

    def create_transition(
        self,
        transition_type: str = 'crossfade',
        duration_sec: float = 0.5
    ) -> otio.schema.Transition:
        """
        Create transition with specified type.

        Args:
            transition_type: Type of transition ('crossfade', 'cut', 'dissolve', 'wipe', 'none')
            duration_sec: Transition duration in seconds

        Returns:
            OTIO Transition object or None for 'cut'/'none'
        """
        # Cut and none don't need actual transition objects
        if transition_type in ('cut', 'none'):
            return None

        duration_frames = self.timing.seconds_to_frames(duration_sec)
        half_duration = duration_frames // 2

        # Map transition types to OTIO types
        # Note: OTIO only supports SMPTE_Dissolve natively, we store type in metadata
        otio_type = otio.schema.TransitionTypes.SMPTE_Dissolve

        transition = otio.schema.Transition(
            transition_type=otio_type,
            in_offset=otio.opentime.RationalTime(half_duration, self.fps),
            out_offset=otio.opentime.RationalTime(half_duration, self.fps)
        )

        # Add custom metadata for Remotion to read specific transition type
        transition.metadata['transition_type'] = transition_type
        transition.metadata['duration_sec'] = duration_sec

        return transition
