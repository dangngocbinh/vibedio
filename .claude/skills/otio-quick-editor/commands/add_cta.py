"""Add Call to Action command."""
import opentimelineio as otio
from colorama import Fore, Style
from utils.otio_handler import OtioHandler
from utils.time_converter import create_time_range


def add_cta(
    project_name: str,
    title: str,
    subtitle: str = None,
    template: str = "classic-youtube",
    at_second: float = 0.0,
    duration: float = 5.0,
    primary_color: str = "#ff0000",
    secondary_color: str = "#ffffff",
    text_color: str = "#000000",
    font_size: int = 32,
    avatar: str = None
) -> None:
    """
    Add CallToAction overlay to timeline.

    Args:
        project_name: Project name
        title: Main text (e.g., "Subscribe", "Shop Now")
        subtitle: Sub text (e.g., "1M Subscribers", "Limited Time")
        template: CTA template type
        at_second: Start time in seconds
        duration: Duration in seconds
        primary_color: Main brand color
        secondary_color: Accent/Background color
        text_color: Text color
        font_size: Font size in pixels
        avatar: URL for the avatar image
    """
    # Load OTIO
    handler = OtioHandler(project_name)
    timeline, fps = handler.load()

    # Get or create Overlays track
    overlays_track = handler.get_or_create_overlay_track(timeline)

    # Create CTA clip
    print(f"{Fore.CYAN}➕ Adding CTA: '{title}' ({template}) at {at_second}s for {duration}s{Style.RESET_ALL}")

    # Create clip metadata for CallToAction component
    clip_metadata = {
        "remotion_component": "CallToAction",
        "globalTimelineStart": str(at_second),
        "props": {
            "title": title,
            "subtitle": subtitle,
            "template": template,
            "primaryColor": primary_color,
            "secondaryColor": secondary_color,
            "textColor": text_color,
            "fontSize": font_size,
            "avatar": avatar
        }
    }

    # Create time range
    source_range = create_time_range(0, duration, fps)

    # Create clip
    cta_clip = otio.schema.Clip(
        name=f"cta_{template}_{at_second}",
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
    overlays_track.insert(insert_index, cta_clip)

    print(f"{Fore.GREEN}✅ CTA added at position {insert_index} in Overlays track{Style.RESET_ALL}")
    print(f"   Template: {template}")
    print(f"   Title: {title}")

    # Validate and save
    handler.validate_basic(timeline)
    handler.save(timeline)

    print(f"\n{Fore.GREEN}🎉 Done! Timeline updated successfully.{Style.RESET_ALL}")
