"""Add sticker overlay command."""
import opentimelineio as otio
from colorama import Fore, Style
from utils.otio_handler import OtioHandler
from utils.time_converter import create_time_range


def add_sticker(
    project_name: str,
    emoji: str,
    at_second: float,
    duration: float,
    animation: str = "pop",
    position: str = "center",
    size: int = 100
) -> None:
    """
    Add Sticker overlay to timeline.

    Args:
        project_name: Project name
        emoji: Emoji or sticker text
        at_second: Start time in seconds
        duration: Duration in seconds
        animation: Animation type (pop, shake, rotate, slide-in, bounce, pulse, fade)
        position: Position (center, top, bottom, top-left, top-right, bottom-left, bottom-right)
        size: Sticker size in pixels (default: 100)
    """
    # Load OTIO
    handler = OtioHandler(project_name)
    timeline, fps = handler.load()

    # Get or create Overlays track
    overlays_track = handler.get_or_create_overlay_track(timeline)

    # Create sticker clip
    print(f"{Fore.CYAN}➕ Adding sticker: '{emoji}' at {at_second}s for {duration}s{Style.RESET_ALL}")

    # Create clip metadata for Sticker component
    clip_metadata = {
        "remotion_component": "Sticker",
        "props": {
            "emoji": emoji,
            "animation": animation,
            "position": position,
            "size": size
        }
    }

    # Create time range
    source_range = create_time_range(0, duration, fps)

    # Create clip
    sticker_clip = otio.schema.Clip(
        name=f"sticker_{emoji}_{at_second}",
        metadata=clip_metadata,
        source_range=source_range
    )

    # Find insertion point
    insert_index = 0
    current_time = 0.0

    for i, item in enumerate(overlays_track):
        if isinstance(item, otio.schema.Clip):
            if item.source_range:
                clip_duration = item.source_range.duration.value / item.source_range.duration.rate
                if current_time + clip_duration <= at_second:
                    current_time += clip_duration
                    insert_index = i + 1
                else:
                    break

    # Insert clip
    overlays_track.insert(insert_index, sticker_clip)

    print(f"{Fore.GREEN}✅ Sticker added at position {insert_index} in Overlays track{Style.RESET_ALL}")
    print(f"   Animation: {animation}")
    print(f"   Position: {position}")
    print(f"   Size: {size}px")

    # Validate and save
    handler.validate_basic(timeline)
    handler.save(timeline)

    print(f"\n{Fore.GREEN}🎉 Done! Timeline updated successfully.{Style.RESET_ALL}")
