"""List clips command."""
from colorama import Fore, Style
from utils.otio_handler import OtioHandler


def list_clips(project_name: str, track_name: str = None) -> None:
    """
    List all tracks or clips in a specific track.

    Args:
        project_name: Project name
        track_name: Track name to list clips from (if None, list all tracks)
    """
    # Load OTIO
    handler = OtioHandler(project_name)
    timeline, fps = handler.load()

    if track_name:
        # List clips in specific track
        handler.list_clips_in_track(timeline, track_name)
    else:
        # List all tracks
        handler.list_tracks(timeline)

    print(f"\n{Fore.CYAN}💡 Tip: Use --track 'TrackName' to see clips in a specific track{Style.RESET_ALL}")
