"""OTIO file loading and saving utilities."""
import json
from pathlib import Path
from typing import Optional, Tuple
import opentimelineio as otio
from colorama import Fore, Style


class OtioHandler:
    """Handler for loading and saving OTIO timeline files."""

    def __init__(self, project_name: str, base_dir: str = None):
        """
        Initialize OtioHandler.

        Args:
            project_name: Name of the project (folder name in public/projects/)
            base_dir: Base directory containing projects (default: auto-detect)
        """
        self.project_name = project_name

        # Auto-detect base directory if not provided
        if base_dir is None:
            # Find the automation-video root directory
            current_dir = Path.cwd()
            # Try to find public/projects from current or parent directories
            for parent in [current_dir, *current_dir.parents]:
                projects_dir = parent / "public" / "projects"
                if projects_dir.exists():
                    base_dir = str(projects_dir)
                    break

            if base_dir is None:
                raise FileNotFoundError("Could not find public/projects directory")

        self.base_dir = Path(base_dir).resolve()
        self.project_dir = self.base_dir / project_name
        self.otio_path = self.project_dir / "project.otio"

    def load(self) -> Tuple[otio.schema.Timeline, int]:
        """
        Load OTIO timeline from project.otio file.

        Returns:
            Tuple of (Timeline object, fps)

        Raises:
            FileNotFoundError: If project.otio doesn't exist
            ValueError: If OTIO file is invalid
        """
        if not self.otio_path.exists():
            raise FileNotFoundError(
                f"OTIO file not found: {self.otio_path}\n"
                f"Project directory: {self.project_dir}"
            )

        print(f"{Fore.CYAN}📂 Loading OTIO from: {self.otio_path}{Style.RESET_ALL}")

        try:
            timeline = otio.adapters.read_from_file(str(self.otio_path))

            if not isinstance(timeline, otio.schema.Timeline):
                raise ValueError("Loaded object is not an OTIO Timeline")

            # Get FPS from first track (assume all tracks have same FPS)
            fps = 30  # default
            if timeline.tracks and len(timeline.tracks) > 0:
                track = timeline.tracks[0]
                if len(track) > 0:
                    first_item = track[0]
                    if hasattr(first_item, 'source_range') and first_item.source_range:
                        fps = first_item.source_range.duration.rate

            print(f"{Fore.GREEN}✅ Loaded timeline: {timeline.name} (FPS: {fps}){Style.RESET_ALL}")
            print(f"   Tracks: {len(timeline.tracks)}")

            return timeline, int(fps)

        except Exception as e:
            raise ValueError(f"Failed to load OTIO file: {str(e)}")

    def save(self, timeline: otio.schema.Timeline, backup: bool = True) -> None:
        """
        Save OTIO timeline to project.otio file.

        Args:
            timeline: Timeline object to save
            backup: Whether to create backup before saving (default: True)

        Raises:
            IOError: If save fails
        """
        # Create backup if requested
        if backup and self.otio_path.exists():
            backup_path = self.otio_path.with_suffix('.otio.backup')
            print(f"{Fore.YELLOW}💾 Creating backup: {backup_path.name}{Style.RESET_ALL}")

            with open(self.otio_path, 'r') as src:
                with open(backup_path, 'w') as dst:
                    dst.write(src.read())

        # Save timeline
        print(f"{Fore.CYAN}💾 Saving OTIO to: {self.otio_path}{Style.RESET_ALL}")

        try:
            otio.adapters.write_to_file(timeline, str(self.otio_path))
            print(f"{Fore.GREEN}✅ Saved successfully!{Style.RESET_ALL}")

        except Exception as e:
            raise IOError(f"Failed to save OTIO file: {str(e)}")

    def get_or_create_overlay_track(self, timeline: otio.schema.Timeline) -> otio.schema.Track:
        """
        Get existing Overlays track or create new one.

        Overlays track should be the last video track (renders on top).

        Args:
            timeline: Timeline object

        Returns:
            Overlays Track object
        """
        # Search for existing Overlays track
        for track in timeline.tracks:
            if track.kind == otio.schema.TrackKind.Video and track.name == "Overlays":
                print(f"{Fore.CYAN}📌 Found existing Overlays track{Style.RESET_ALL}")
                return track

        # Create new Overlays track
        print(f"{Fore.YELLOW}➕ Creating new Overlays track{Style.RESET_ALL}")
        overlays_track = otio.schema.Track(
            name="Overlays",
            kind=otio.schema.TrackKind.Video
        )

        # Add as last track (renders on top)
        timeline.tracks.append(overlays_track)

        return overlays_track

    def validate_basic(self, timeline: otio.schema.Timeline) -> bool:
        """
        Basic validation of timeline structure.

        Args:
            timeline: Timeline to validate

        Returns:
            True if valid

        Raises:
            ValueError: If validation fails
        """
        if not timeline.tracks:
            raise ValueError("Timeline has no tracks")

        # Check for subtitle track (should be last if exists)
        subtitle_track_index = None
        for i, track in enumerate(timeline.tracks):
            if track.name == "Subtitles":
                subtitle_track_index = i
                break

        # If subtitle track exists and is not last, warn
        if subtitle_track_index is not None and subtitle_track_index < len(timeline.tracks) - 1:
            print(f"{Fore.YELLOW}⚠️  Warning: Subtitles track should be last track (for rendering on top){Style.RESET_ALL}")

        return True

    def list_tracks(self, timeline: otio.schema.Timeline) -> None:
        """
        Print list of tracks in timeline.

        Args:
            timeline: Timeline object
        """
        print(f"\n{Fore.CYAN}📋 Tracks in '{timeline.name}':{Style.RESET_ALL}")
        for i, track in enumerate(timeline.tracks):
            num_clips = len([c for c in track if isinstance(c, otio.schema.Clip)])
            num_transitions = len([t for t in track if isinstance(t, otio.schema.Transition)])
            print(f"  {i+1}. {track.name} ({track.kind}) - {num_clips} clips, {num_transitions} transitions")

    def list_clips_in_track(self, timeline: otio.schema.Timeline, track_name: str) -> None:
        """
        Print list of clips in specific track.

        Args:
            timeline: Timeline object
            track_name: Name of track to list clips from
        """
        # Find track
        track = None
        for t in timeline.tracks:
            if t.name == track_name:
                track = t
                break

        if not track:
            print(f"{Fore.RED}❌ Track '{track_name}' not found{Style.RESET_ALL}")
            return

        print(f"\n{Fore.CYAN}📋 Clips in track '{track_name}':{Style.RESET_ALL}")

        clip_index = 1
        for item in track:
            if isinstance(item, otio.schema.Clip):
                # Get duration
                duration_sec = 0
                if item.source_range:
                    duration_sec = item.source_range.duration.value / item.source_range.duration.rate

                # Get component type if it's a component clip
                component_type = item.metadata.get('remotion_component', 'N/A')

                print(f"  {clip_index}. {item.name}")
                print(f"     Duration: {duration_sec:.2f}s")
                print(f"     Component: {component_type}")

                clip_index += 1
