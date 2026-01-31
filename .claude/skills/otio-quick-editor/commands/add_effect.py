"""Add layer effect command."""
import opentimelineio as otio
from colorama import Fore, Style
from utils.otio_handler import OtioHandler
from utils.time_converter import create_time_range


def add_effect(
    project_name: str,
    effect_type: str,
    at_second: float,
    duration: float,
    intensity: float = 0.5
) -> None:
    """
    Add LayerEffect overlay to timeline.

    Args:
        project_name: Project name
        effect_type: Effect type (neon-circles, hud-overlay, radar, scan-lines, glitch, particles, vhs)
        at_second: Start time in seconds
        duration: Duration in seconds
        intensity: Effect intensity 0.0-1.0 (default: 0.5)
    """
    # Load OTIO
    handler = OtioHandler(project_name)
    timeline, fps = handler.load()

    # Get or create Overlays track
    overlays_track = handler.get_or_create_overlay_track(timeline)

    # Create effect clip
    print(f"{Fore.CYAN}➕ Adding effect: '{effect_type}' at {at_second}s for {duration}s{Style.RESET_ALL}")

    # Create clip metadata for LayerEffect component
    clip_metadata = {
        "remotion_component": "LayerEffect",
        "globalTimelineStart": str(at_second),
        "props": {
            "effectType": effect_type,
            "intensity": intensity
        }
    }

    # Create time range
    source_range = create_time_range(0, duration, fps)

    # Create clip
    effect_clip = otio.schema.Clip(
        name=f"effect_{effect_type}_{at_second}",
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
    overlays_track.insert(insert_index, effect_clip)

    print(f"{Fore.GREEN}✅ Effect added at position {insert_index} in Overlays track{Style.RESET_ALL}")
    print(f"   Type: {effect_type}")
    print(f"   Intensity: {intensity}")

    # Validate and save
    handler.validate_basic(timeline)
    handler.save(timeline)

    print(f"\n{Fore.GREEN}🎉 Done! Timeline updated successfully.{Style.RESET_ALL}")
