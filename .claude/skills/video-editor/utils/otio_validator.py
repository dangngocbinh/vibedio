import opentimelineio as otio
import os
import sys

def validate_otio(file_path):
    """
    Validates an OTIO file for common Remotion compatibility issues:
    1. Consecutive transitions (Not allowed in TransitionSeries)
    2. Transition duration > Clip duration (Crash in Remotion)
    3. Absolute paths in media references (Browser cannot load)
    4. Empty tracks or malformed structure
    """
    print(f"Validating {file_path}...")
    try:
        timeline = otio.adapters.read_from_file(file_path)
    except Exception as e:
        return False, f"Failed to read OTIO file: {e}"

    errors = []
    warnings = []

    for track_index, track in enumerate(timeline.tracks):
        if track.kind != otio.schema.TrackKind.Video:
            continue
            
        items = list(track)
        for i in range(len(items)):
            item = items[i]
            
            # Rule 1: No consecutive transitions
            if i < len(items) - 1:
                next_item = items[i+1]
                if isinstance(item, otio.schema.Transition) and isinstance(next_item, otio.schema.Transition):
                    errors.append(f"Track '{track.name}': Consecutive transitions found at index {i} and {i+1}")

            # Rule 2: Transition duration must not be longer than adjacent clips
            if isinstance(item, otio.schema.Transition):
                trans_frames = item.in_offset.value + item.out_offset.value
                
                # Check previous clip
                if i > 0 and isinstance(items[i-1], otio.schema.Clip):
                    clip_frames = items[i-1].duration().value
                    if trans_frames > clip_frames:
                        errors.append(f"Track '{track.name}': Transition at index {i} ({trans_frames}f) is longer than previous clip ({clip_frames}f)")
                
                # Check next clip
                if i < len(items) - 1 and isinstance(items[i+1], otio.schema.Clip):
                    clip_frames = items[i+1].duration().value
                    if trans_frames > clip_frames:
                        errors.append(f"Track '{track.name}': Transition at index {i} ({trans_frames}f) is longer than next clip ({clip_frames}f)")
            
            # Rule 3: Check for absolute paths in media references
            if isinstance(item, otio.schema.Clip):
                if hasattr(item, 'media_reference') and item.media_reference:
                    if hasattr(item.media_reference, 'target_url'):
                        url = item.media_reference.target_url
                        # Check if it's an absolute path (starts with / or C:\ etc)
                        import re
                        if url and (url.startswith('/') or re.match(r'^[a-zA-Z]:\\', url)):
                            # Allow file:// URLs but warn about absolute paths
                            if not url.startswith('file://'):
                                errors.append(f"Track '{track.name}': Clip '{item.name}' has absolute path: {url[:50]}... (Browser cannot load)")

    if errors:
        return False, "\n".join(errors)
    
    if warnings:
        print("Warnings:\n" + "\n".join(warnings))
    
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
