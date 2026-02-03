import opentimelineio as otio
import os
import sys
from typing import Dict, Any, List, Tuple


class OtioValidator:
    """Enhanced OTIO validator with comprehensive checks for Remotion compatibility."""

    def validate_timeline(self, timeline: otio.schema.Timeline) -> Dict[str, Any]:
        """
        Validate timeline object.

        Args:
            timeline: OTIO Timeline to validate

        Returns:
            Dict with 'valid' (bool), 'errors' (list), 'warnings' (list)
        """
        errors = []
        warnings = []

        # Check track structure
        track_errors, track_warnings = self._validate_track_structure(timeline)
        errors.extend(track_errors)
        warnings.extend(track_warnings)

        # Check each track
        for track_index, track in enumerate(timeline.tracks):
            track_errors, track_warnings = self._validate_track(track, track_index)
            errors.extend(track_errors)
            warnings.extend(track_warnings)

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }

    def _validate_track_structure(
        self,
        timeline: otio.schema.Timeline
    ) -> Tuple[List[str], List[str]]:
        """Validate overall track structure."""
        errors = []
        warnings = []

        if not timeline.tracks:
            errors.append("Timeline has no tracks")
            return errors, warnings

        # Check for captions track position
        captions_track_index = None
        for i, track in enumerate(timeline.tracks):
            if track.name == "Captions":
                captions_track_index = i
                break

        if captions_track_index is not None:
            # Captions should be last track
            if captions_track_index != len(timeline.tracks) - 1:
                warnings.append(
                    f"Captions track should be last (currently at index {captions_track_index}, "
                    f"total tracks: {len(timeline.tracks)})"
                )

        return errors, warnings

    def _validate_track(
        self,
        track: otio.schema.Track,
        track_index: int
    ) -> Tuple[List[str], List[str]]:
        """Validate a single track."""
        errors = []
        warnings = []

        items = list(track)

        for i, item in enumerate(items):
            # Check for consecutive transitions
            if i < len(items) - 1:
                next_item = items[i+1]
                if isinstance(item, otio.schema.Transition) and isinstance(next_item, otio.schema.Transition):
                    errors.append(
                        f"Track '{track.name}': Consecutive transitions at index {i} and {i+1}"
                    )

            # Validate transition duration
            if isinstance(item, otio.schema.Transition):
                trans_errors = self._validate_transition(item, items, i, track.name)
                errors.extend(trans_errors)

            # Validate clip
            if isinstance(item, otio.schema.Clip):
                clip_errors, clip_warnings = self._validate_clip(item, track.name)
                errors.extend(clip_errors)
                warnings.extend(clip_warnings)

        # Check for overlapping clips (in same track)
        overlap_errors = self._check_overlapping_clips(items, track.name)
        errors.extend(overlap_errors)

        return errors, warnings

    def _validate_transition(
        self,
        transition: otio.schema.Transition,
        items: List,
        index: int,
        track_name: str
    ) -> List[str]:
        """Validate transition duration against adjacent clips."""
        errors = []

        trans_frames = transition.in_offset.value + transition.out_offset.value

        # Check previous clip
        if index > 0 and isinstance(items[index - 1], otio.schema.Clip):
            clip_frames = items[index - 1].duration().value
            if trans_frames > clip_frames:
                errors.append(
                    f"Track '{track_name}': Transition at index {index} ({trans_frames}f) "
                    f"is longer than previous clip ({clip_frames}f)"
                )

        # Check next clip
        if index < len(items) - 1 and isinstance(items[index + 1], otio.schema.Clip):
            clip_frames = items[index + 1].duration().value
            if trans_frames > clip_frames:
                errors.append(
                    f"Track '{track_name}': Transition at index {index} ({trans_frames}f) "
                    f"is longer than next clip ({clip_frames}f)"
                )

        return errors

    def _validate_clip(
        self,
        clip: otio.schema.Clip,
        track_name: str
    ) -> Tuple[List[str], List[str]]:
        """Validate clip for common issues."""
        errors = []
        warnings = []

        # Check for absolute paths
        if hasattr(clip, 'media_reference') and clip.media_reference:
            if hasattr(clip.media_reference, 'target_url'):
                url = clip.media_reference.target_url
                if url:
                    import re
                    if url.startswith('/') or re.match(r'^[a-zA-Z]:\\', url):
                        if not url.startswith('file://'):
                            errors.append(
                                f"Track '{track_name}': Clip '{clip.name}' has absolute path: "
                                f"{url[:50]}... (Browser cannot load)"
                            )

        # Check component clips have required metadata
        if isinstance(clip.media_reference, otio.schema.MissingReference):
            # This is likely a component clip (LayerTitle, Sticker, etc.)
            if 'remotion_component' not in clip.metadata:
                warnings.append(
                    f"Track '{track_name}': Component clip '{clip.name}' missing "
                    f"'remotion_component' metadata"
                )

            # Check for required props
            if 'remotion_component' in clip.metadata:
                component = clip.metadata['remotion_component']
                if 'props' not in clip.metadata:
                    warnings.append(
                        f"Track '{track_name}': Component '{component}' clip '{clip.name}' "
                        f"missing 'props' metadata"
                    )

        return errors, warnings

    def _check_overlapping_clips(
        self,
        items: List,
        track_name: str
    ) -> List[str]:
        """Check for overlapping clips in the same track."""
        errors = []

        # Build list of clips with their time ranges
        clips_with_times = []
        current_time = 0.0

        for item in items:
            if isinstance(item, otio.schema.Clip):
                duration = item.duration().to_seconds()
                clips_with_times.append({
                    'clip': item,
                    'start': current_time,
                    'end': current_time + duration
                })
                current_time += duration
            elif isinstance(item, otio.schema.Transition):
                # Transitions overlap adjacent clips by design, skip
                pass

        # Check for overlaps (excluding transitions)
        for i in range(len(clips_with_times) - 1):
            clip1 = clips_with_times[i]
            clip2 = clips_with_times[i + 1]

            # Check if clip2 starts before clip1 ends (excluding transition overlaps)
            # Allow small tolerance for floating point errors
            if clip2['start'] < clip1['end'] - 0.01:
                errors.append(
                    f"Track '{track_name}': Overlapping clips detected - "
                    f"'{clip1['clip'].name}' and '{clip2['clip'].name}'"
                )

        return errors


def validate_otio(file_path):
    """
    Validates an OTIO file for common Remotion compatibility issues:
    1. Consecutive transitions (Not allowed in TransitionSeries)
    2. Transition duration > Clip duration (Crash in Remotion)
    3. Absolute paths in media references (Browser cannot load)
    4. Empty tracks or malformed structure
    5. Captions track is last
    6. Component clips have required metadata
    """
    print(f"Validating {file_path}...")
    try:
        timeline = otio.adapters.read_from_file(file_path)
    except Exception as e:
        return False, f"Failed to read OTIO file: {e}"

    validator = OtioValidator()
    result = validator.validate_timeline(timeline)

    if not result['valid']:
        return False, "\n".join(result['errors'])

    if result['warnings']:
        print("Warnings:\n" + "\n".join(result['warnings']))

    return True, "Validation successful"

def safe_save_otio(timeline, target_path):
    """
    Saves timeline to a temp file, validates it, and only then overwrites the target.
    """
    temp_path = target_path + ".tmp.otio"
    try:
        otio.adapters.write_to_file(timeline, temp_path)
        is_valid, message = validate_otio(temp_path)
        
        if is_valid:
            os.replace(temp_path, target_path)
            print(f"Successfully validated and saved to {target_path}")
            return True
        else:
            print(f"Validation FAILED! File not saved to {target_path}")
            print(f"Errors:\n{message}")
            if os.path.exists(temp_path):
                print(f"Check temporary file for debugging: {temp_path}")
            return False
    except Exception as e:
        print(f"Error during safe save: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validator.py <path_to_otio>")
    else:
        valid, msg = validate_otio(sys.argv[1])
        print(msg)
        sys.exit(0 if valid else 1)
