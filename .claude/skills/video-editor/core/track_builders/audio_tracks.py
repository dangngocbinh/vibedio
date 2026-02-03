"""Audio tracks builder - creates voice and music tracks."""
from typing import Dict, Any, Optional
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator
from core.asset_resolver import AssetResolver


class AudioTracksBuilder:
    """Builds audio tracks for voice and background music."""

    def __init__(self, fps: int = 30, project_dir: str = "", asset_resolver: Optional[AssetResolver] = None):
        """
        Initialize AudioTracksBuilder.

        Args:
            fps: Frames per second
            project_dir: Project directory path
            asset_resolver: Asset resolver instance (optional)
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)
        self.asset_resolver = asset_resolver or AssetResolver(project_dir) if project_dir else None

    def build_voice_track(
        self,
        voice_data: Dict[str, Any],
        duration: float,
        volume: float = 1.0
    ) -> Optional[otio.schema.Track]:
        """
        Build voice track from voice.json.

        Args:
            voice_data: Parsed voice.json
            duration: Duration in seconds
            volume: Audio volume (0.0 to 1.0)

        Returns:
            OTIO Track with voice clip or None if voice disabled
        """
        if not voice_data:
            return None

        track = otio.schema.Track(name="Voice", kind=otio.schema.TrackKind.Audio)

        # Get voice file path
        if self.asset_resolver:
            voice_url = self.asset_resolver.resolve_voice_path(voice_data)
        else:
            voice_url = voice_data.get('audioFile', 'voice.mp3')

        # Create voice clip
        clip = self._create_audio_clip(
            url=voice_url,
            name="Voiceover",
            duration=duration,
            volume=volume
        )

        if clip:
            track.append(clip)

        return track

    def build_music_track(
        self,
        script: Dict[str, Any],
        resources: Dict[str, Any],
        duration: float
    ) -> Optional[otio.schema.Track]:
        """
        Build background music track.

        Args:
            script: Parsed script.json
            resources: Parsed resources.json
            duration: Duration in seconds

        Returns:
            OTIO Track with music clip or None if music disabled
        """
        music_config = script.get('music', {})
        
        # Auto-enable music if importedMusicPath or selectedMusicId exists
        # or if explicitly enabled
        has_music = (
            music_config.get('importedMusicPath') or 
            music_config.get('selectedMusicId') or
            music_config.get('enabled', False)
        )
        
        if not has_music:
            return None

        track = otio.schema.Track(name="Background Music", kind=otio.schema.TrackKind.Audio)

        # Get music file path
        if self.asset_resolver:
            music_url = self.asset_resolver.resolve_music_from_script(script)
            if not music_url:
                music_url = self.asset_resolver.resolve_music_from_resources(resources)
        else:
            music_url = music_config.get('importedMusicPath')

        if not music_url:
            return None

        # Get music settings
        volume = music_config.get('volume', 0.08)
        fade_in = music_config.get('fadeIn', 2.0)
        fade_out = music_config.get('fadeOut', 2.0)

        # Create music clip
        clip = self._create_audio_clip(
            url=music_url,
            name="Background Music",
            duration=duration,
            volume=volume
        )

        if clip:
            # Add fade metadata
            clip.metadata['audio_fade_in'] = str(fade_in)
            clip.metadata['audio_fade_out'] = str(fade_out)
            track.append(clip)

        return track

    def _create_audio_clip(
        self,
        url: str,
        name: str,
        duration: float,
        volume: float = 1.0
    ) -> Optional[otio.schema.Clip]:
        """
        Create audio clip.

        Args:
            url: Audio file URL/path
            name: Clip name
            duration: Duration in seconds
            volume: Audio volume (0.0 to 1.0)

        Returns:
            OTIO Clip or None
        """
        if not url:
            return None

        media_ref = otio.schema.ExternalReference(target_url=url)
        source_range = self.timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=name,
            media_reference=media_ref,
            source_range=source_range
        )

        # Add volume metadata
        clip.metadata['volume'] = str(volume)

        return clip
