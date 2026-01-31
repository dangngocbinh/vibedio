"""Add title overlay command."""
import opentimelineio as otio
from colorama import Fore, Style
from utils.otio_handler import OtioHandler
from utils.time_converter import create_time_range


def add_title(
    project_name: str,
    text: str,
    at_second: float,
    duration: float,
    style: str = "default",
    position: str = "center",
    font_size: int = 48,
    color: str = "#FFFFFF"
) -> None:
    """
    Add LayerTitle overlay to timeline.

    Args:
        project_name: Project name
        text: Title text
        at_second: Start time in seconds
        duration: Duration in seconds
        style: Title style (default, neon-glow, retro, minimal, bold, handwritten)
        position: Position (center, top, bottom, left, right, top-left, etc.)
        font_size: Font size in pixels (default: 48)
        color: Text color hex (default: #FFFFFF)
    """
    # Load OTIO
    handler = OtioHandler(project_name)
    timeline, fps = handler.load()

    # Get or create Overlays track
    overlays_track = handler.get_or_create_overlay_track(timeline)

    # Create title clip
    print(f"{Fore.CYAN}➕ Adding title: '{text}' at {at_second}s for {duration}s{Style.RESET_ALL}")

    # Create clip metadata for LayerTitle component
    clip_metadata = {
        "remotion_component": "LayerTitle",
        "globalTimelineStart": str(at_second),
        "props": {
            "title": text,
            "style": style,
            "position": position,
            "fontSize": font_size,
            "color": color
        }
    }

    # Create time range
    source_range = create_time_range(0, duration, fps)

    # Create clip
    title_clip = otio.schema.Clip(
        name=f"title_{text[:20]}",  # Limit name length
        metadata=clip_metadata,
        source_range=source_range
    )

    # Find insertion point in track
    # We need to insert at the correct position based on at_second
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
    overlays_track.insert(insert_index, title_clip)

    print(f"{Fore.GREEN}✅ Title added at position {insert_index} in Overlays track{Style.RESET_ALL}")
    print(f"   Style: {style}")
    print(f"   Position: {position}")
    print(f"   Color: {color}")

    # Validate and save
    handler.validate_basic(timeline)
    handler.save(timeline)

    print(f"\n{Fore.GREEN}🎉 Done! Timeline updated successfully.{Style.RESET_ALL}")
