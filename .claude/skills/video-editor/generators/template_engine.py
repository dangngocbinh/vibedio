"""Generate Python code from editing operations using templates."""

from typing import Dict, Any, List
from pathlib import Path


class TemplateEngine:
    """Template engine for generating Python code from operations."""

    def __init__(self):
        """Initialize template engine."""
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, str]:
        """Load all operation templates."""
        return {
            'insert_clip': self._insert_clip_template,
            'remove_clip': self._remove_clip_template,
            'replace_clip': self._replace_clip_template,
            'add_transition': self._add_transition_template,
            'remove_transition': self._remove_transition_template,
            'adjust_duration': self._adjust_duration_template,
            'shift_clips': self._shift_clips_template,
            'create_track': self._create_track_template,
            'remove_track': self._remove_track_template,
            'merge_tracks': self._merge_tracks_template,
        }

    def render(self, operation: 'Operation') -> str:
        """
        Render operation into Python code.

        Args:
            operation: Operation object with type and params

        Returns:
            Python code as string
        """
        if operation.type not in self.templates:
            raise ValueError(f"Unknown operation type: {operation.type}")

        template_func = self.templates[operation.type]
        return template_func(operation.params)

    # ============================================================================
    # CLIP OPERATION TEMPLATES
    # ============================================================================

    @staticmethod
    def _insert_clip_template(params: Dict[str, Any]) -> str:
        """Template for inserting clip at specific time."""
        file_path = params.get('file', 'video.mp4')
        time_sec = params.get('time', 0.0)
        track = params.get('track', 0)
        duration = params.get('duration', 5.0)

        return f'''# Insert clip at {time_sec}s on track {track}
track = get_track_by_name_or_index(timeline, {repr(track)})
clip = otio.schema.Clip(
    name="Inserted Clip",
    media_reference=otio.schema.ExternalReference(target_url="{file_path}"),
    source_range=otio.opentime.TimeRange(
        start_time=otio.opentime.from_seconds(0),
        duration=otio.opentime.from_seconds({duration})
    )
)
# Find insertion point at time {time_sec}s
insert_index = find_clip_index_at_time(track, {time_sec})
track.insert(insert_index, clip)
print(f"✓ Inserted clip at {{insert_index}}")
'''

    @staticmethod
    def _remove_clip_template(params: Dict[str, Any]) -> str:
        """Template for removing clip."""
        clip_id = params.get('clip_id', 0)
        track = params.get('track', 0)
        ripple = params.get('ripple', False)

        ripple_note = " (with ripple)" if ripple else ""
        code = f'''# Remove clip {clip_id} from track {track}{ripple_note}
track = get_track_by_name_or_index(timeline, {repr(track)})
'''

        if ripple:
            code += f'''# Ripple delete (clips after will shift)
if {clip_id} < len(track):
    removed = track.pop({clip_id})
    print(f"✓ Removed clip (ripple): {{removed.name}}")
else:
    print(f"✗ Clip index {clip_id} out of range")
'''
        else:
            code += f'''# Regular delete (leave gap)
if {clip_id} < len(track):
    removed = track.pop({clip_id})
    gap = otio.schema.Gap(duration=removed.source_range.duration)
    track.insert({clip_id}, gap)
    print(f"✓ Removed clip: {{removed.name}} (gap inserted)")
else:
    print(f"✗ Clip index {clip_id} out of range")
'''
        return code

    @staticmethod
    def _replace_clip_template(params: Dict[str, Any]) -> str:
        """Template for replacing clip."""
        clip_id = params.get('clip_id', 0)
        new_file = params.get('new_file', 'new.mp4')
        duration = params.get('duration', 5.0)

        return f'''# Replace clip {clip_id} with {new_file}
# Find clip across all tracks
replaced = False
for track in timeline.tracks:
    if {clip_id} < len(track):
        old_clip = track[{clip_id}]
        if hasattr(old_clip, 'media_reference'):
            duration = old_clip.source_range.duration.to_seconds() if hasattr(old_clip, 'source_range') else {duration}
            new_clip = otio.schema.Clip(
                name="Replaced Clip",
                media_reference=otio.schema.ExternalReference(target_url="{new_file}"),
                source_range=otio.opentime.TimeRange(
                    start_time=otio.opentime.from_seconds(0),
                    duration=otio.opentime.from_seconds(duration)
                )
            )
            track[{clip_id}] = new_clip
            print(f"✓ Replaced clip {{old_clip.name}} with {new_file}")
            replaced = True
            break

if not replaced:
    print(f"✗ Could not find clip {clip_id}")
'''

    # ============================================================================
    # TRANSITION OPERATION TEMPLATES
    # ============================================================================

    @staticmethod
    def _add_transition_template(params: Dict[str, Any]) -> str:
        """Template for adding transition between clips."""
        duration = params.get('duration', 1.0)
        start_clip = params.get('start_clip', 0)
        end_clip = params.get('end_clip', 1)
        track = params.get('track', 0)

        return f'''# Add {duration}s transition between clips {start_clip}-{end_clip} on track {track}
track = get_track_by_name_or_index(timeline, {repr(track)})

if {end_clip} < len(track):
    transition = otio.schema.Transition(
        transition_type=otio.schema.TransitionTypes.SMPTE_Dissolve,
        in_offset=otio.opentime.from_seconds({duration / 2}),
        out_offset=otio.opentime.from_seconds({duration / 2})
    )
    track.insert({end_clip}, transition)
    print(f"✓ Added {duration}s transition between clips {start_clip}-{end_clip}")
else:
    print(f"✗ Clip index {end_clip} out of range")
'''

    @staticmethod
    def _remove_transition_template(params: Dict[str, Any]) -> str:
        """Template for removing transition."""
        start_clip = params.get('start_clip', 0)
        end_clip = params.get('end_clip', 1)
        track = params.get('track', 0)

        return f'''# Remove transition between clips {start_clip}-{end_clip}
track = get_track_by_name_or_index(timeline, {repr(track)})

# Find and remove transition between clips
for i, item in enumerate(track):
    if isinstance(item, otio.schema.Transition):
        # Remove transition
        removed = track.pop(i)
        print(f"✓ Removed transition at index {{i}}")
        break
else:
    print("✗ No transition found between clips {start_clip}-{end_clip}")
'''

    # ============================================================================
    # TIMING OPERATION TEMPLATES
    # ============================================================================

    @staticmethod
    def _adjust_duration_template(params: Dict[str, Any]) -> str:
        """Template for adjusting clip duration."""
        clip_id = params.get('clip_id', 0)
        new_duration = params.get('new_duration', 5.0)
        track = params.get('track', 0)

        return f'''# Adjust duration of clip {clip_id} to {new_duration}s
track = get_track_by_name_or_index(timeline, {repr(track)})

if {clip_id} < len(track):
    clip = track[{clip_id}]
    if hasattr(clip, 'source_range'):
        old_duration = clip.source_range.duration.to_seconds()
        clip.source_range = otio.opentime.TimeRange(
            start_time=clip.source_range.start_time,
            duration=otio.opentime.from_seconds({new_duration})
        )
        print(f"✓ Adjusted clip duration from {{old_duration:.1f}}s to {new_duration}s")
    else:
        print(f"✗ Clip {{clip.name}} has no source range")
else:
    print(f"✗ Clip index {clip_id} out of range")
'''

    @staticmethod
    def _shift_clips_template(params: Dict[str, Any]) -> str:
        """Template for shifting clips in timeline."""
        start_clip = params.get('start_clip', 0)
        offset = params.get('offset', 1.0)
        track = params.get('track', 0)

        direction = "forward" if offset >= 0 else "backward"
        return f'''# Shift clips starting from {start_clip} by {offset}s {direction}
track = get_track_by_name_or_index(timeline, {repr(track)})

# Note: This is a conceptual operation.
# Actual implementation depends on timeline structure.
# Consider using ripple edit or creating new gaps.
print(f"⚠ Shift operation requires custom implementation")
print(f"  Would shift {{len(track) - {start_clip}}} clips by {offset}s")
'''

    # ============================================================================
    # TRACK OPERATION TEMPLATES
    # ============================================================================

    @staticmethod
    def _create_track_template(params: Dict[str, Any]) -> str:
        """Template for creating new track."""
        name = params.get('name', 'V2')

        return f'''# Create new video track
new_track = otio.schema.Track(
    name="{name}",
    kind=otio.schema.TrackKind.Video
)
timeline.tracks.append(new_track)
print(f"✓ Created new track: {name}")
'''

    @staticmethod
    def _remove_track_template(params: Dict[str, Any]) -> str:
        """Template for removing track."""
        track = params.get('track', 1)

        return f'''# Remove track {track}
if {track} < len(timeline.tracks):
    removed = timeline.tracks.pop({track})
    print(f"✓ Removed track: {{removed.name}}")
else:
    print(f"✗ Track index {track} out of range")
'''

    @staticmethod
    def _merge_tracks_template(params: Dict[str, Any]) -> str:
        """Template for merging tracks."""
        source_track = params.get('source_track', 1)
        target_track = params.get('target_track', 0)

        return f'''# Merge track {source_track} into track {target_track}
source = get_track_by_name_or_index(timeline, {repr(source_track)})
target = get_track_by_name_or_index(timeline, {repr(target_track)})

# Move all clips from source to target
for item in list(source):
    source.remove(item)
    target.append(item)

# Remove empty source track
timeline.tracks.remove(source)
print(f"✓ Merged track {{source.name}} into {{target.name}}")
'''

    # ============================================================================
    # HELPER FUNCTIONS
    # ============================================================================

    @staticmethod
    def get_helper_functions() -> str:
        """Get all helper functions needed in generated scripts."""
        return '''def get_track_by_name_or_index(timeline, track):
    """Get track by name or index (0-based)."""
    if isinstance(track, int):
        if track < len(timeline.tracks):
            return timeline.tracks[track]
        raise IndexError(f"Track index {track} out of range")
    for t in timeline.tracks:
        if t.name == track:
            return t
    raise ValueError(f"Track not found: {track}")


def find_clip_index_at_time(track, time_sec: float) -> int:
    """Find clip index at specific time position (in seconds)."""
    current_time = 0.0
    for i, item in enumerate(track):
        if current_time >= time_sec:
            return i
        if hasattr(item, 'duration'):
            current_time += item.duration().to_seconds()
    return len(track)


def create_clip_from_url(url: str, name: str, duration_sec: float):
    """Create OTIO clip from URL."""
    return otio.schema.Clip(
        name=name,
        media_reference=otio.schema.ExternalReference(target_url=url),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.from_seconds(0),
            duration=otio.opentime.from_seconds(duration_sec)
        )
    )
'''
