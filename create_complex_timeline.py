import opentimelineio as otio
import os

def create_vietnam_vibes_timeline(output_file="vietnam_vibes.otio"):
    fps = 30.0
    timeline = otio.schema.Timeline(name="Vietnam Vibes")
    
    # ---------------------------------------------------------
    # Track 1: Background (A-Roll)
    # ---------------------------------------------------------
    bg_track = otio.schema.Track(name="Background", kind="Video")
    
    # Placeholder Background URL
    bg_url = "https://picsum.photos/id/10/1920/1080.jpg"
    
    # Becomes the full length of the video (e.g. 5 clips * 4s = 20s)
    total_duration_frames = 5 * 120 # 600 frames
    
    bg_clip = otio.schema.Clip(
        name="SunsetBackground",
        media_reference=otio.schema.ExternalReference(target_url=bg_url),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, fps),
            duration=otio.opentime.RationalTime(total_duration_frames, fps)
        )
    )
    bg_track.append(bg_clip)
    
    # Enable Audio Reactivity for Background
    audio_url_abs = "file:///Users/binhpc/code/remotion-test/public/audio/fall-by-ashutosh.mp3"
    bg_track.metadata["audioReactive"] = True
    bg_track.metadata["audioSrc"] = audio_url_abs
    
    timeline.tracks.append(bg_track)

    # ---------------------------------------------------------
    # Track 2: Overlay B-Rolls (with Gradient Mask)
    # ---------------------------------------------------------
    overlay_track = otio.schema.Track(name="Overlay", kind="Video")
    
    b_rolls = [
        "https://picsum.photos/id/11/1920/1080.jpg",
        "https://picsum.photos/id/12/1920/1080.jpg",
        "https://picsum.photos/id/13/1920/1080.jpg",
        "https://picsum.photos/id/14/1920/1080.jpg",
        "https://picsum.photos/id/15/1920/1080.jpg",
    ]
    
    # Mask Style to be read by OtioPlayer
    # User requested B-roll only on the right side.
    # Gradient: Transparent (0% -> 50%) -> Visible (80% -> 100%)
    mask_style = {
        "maskImage": "linear-gradient(to right, transparent 0%, transparent 50%, black 80%, black 100%)",
        "WebkitMaskImage": "linear-gradient(to right, transparent 0%, transparent 50%, black 80%, black 100%)"
    }
    
    # Apply mask to the ENTIRE TRACK so transitions don't mess up the transparency
    overlay_track.metadata["style"] = mask_style

    for i, url in enumerate(b_rolls):
        clip = otio.schema.Clip(
            name=f"B-Roll {i+1}",
            media_reference=otio.schema.ExternalReference(target_url=url),
            source_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(0, fps),
                duration=otio.opentime.RationalTime(120, fps) # 4 seconds
            )
        )
        
        # No longer adding metadata["style"] to individual clips for the mask
        
        overlay_track.append(clip)
        
        # Add Transition (Cross-Dissolve) except for the last one
        if i < len(b_rolls) - 1:
            transition = otio.schema.Transition(
                transition_type="Fade",
                in_offset=otio.opentime.RationalTime(15, fps), # 0.5s overlap
                out_offset=otio.opentime.RationalTime(15, fps)
            )
            overlay_track.append(transition)

    timeline.tracks.append(overlay_track)

    # ---------------------------------------------------------
    # Track 3: Persistent Title (Custom Component)
    # ---------------------------------------------------------
    title_track = otio.schema.Track(name="Graphics", kind="Video")
    
    # We create a Gap or Clip that acts as a holder for the React Component
    # Since OtioPlayer checks `item.metadata?.remotion_component`
    
    title_clip = otio.schema.Clip(
        name="Global Title",
        media_reference=otio.schema.MissingReference(), # No media needed
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, fps),
            duration=otio.opentime.RationalTime(total_duration_frames, fps)
        )
    )
    
    title_clip.metadata["remotion_component"] = "OpeningTitle" # Reusing OpeningTitle logic in OtioPlayer
    # But wait, looking at OtioPlayer:
    # if (item.metadata?.remotion_component === 'OpeningTitle') -> renders OpeningTitle
    # We want "PersistentTitle". So we need to update OtioPlayer to support generic components or map this one.
    # For now, let's use "OpeningTitle" logic but pass our props, OR update OtioPlayer to support PersistentTitle.
    # I will update OtioPlayer next to support 'PersistentTitle'.
    
    title_clip.metadata["remotion_component"] = "PersistentTitle"
    title_clip.metadata["props"] = {
        "title": "Đường Lên Phía Trước ..."
    }
    
    title_track.append(title_clip)
    timeline.tracks.append(title_track)

    # ---------------------------------------------------------
    # Track 4: Audio (Heroic Music)
    # ---------------------------------------------------------
    audio_track = otio.schema.Track(name="Music", kind="Audio")
    
    # Using absolute path which OtioPlayer will convert to staticFile if it contains /public/
    audio_url = "file:///Users/binhpc/code/remotion-test/public/audio/fall-by-ashutosh.mp3"
    
    audio_clip = otio.schema.Clip(
        name="Background Music",
        media_reference=otio.schema.ExternalReference(target_url=audio_url),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, fps),
            duration=otio.opentime.RationalTime(total_duration_frames, fps)
        )
    )
    # Add fade in
    audio_clip.metadata["audio_fade_in"] = "2.0" # 2 seconds fade in
    
    audio_track.append(audio_clip)
    timeline.tracks.append(audio_track)
    
    # ---------------------------------------------------------
    # Track 5: Visual Effects (Floating Particles)
    # ---------------------------------------------------------
    fx_track = otio.schema.Track(name="FX", kind="Video")
    
    fx_clip = otio.schema.Clip(
        name="Floating Particles",
        media_reference=otio.schema.MissingReference(),
        source_range=otio.opentime.TimeRange(
            start_time=otio.opentime.RationalTime(0, fps),
            duration=otio.opentime.RationalTime(total_duration_frames, fps)
        )
    )
    fx_clip.metadata["remotion_component"] = "FloatingEffect"
    # Removed audioSrc so particles don't shake
    
    fx_track.append(fx_clip)
    timeline.tracks.append(fx_track)

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------
    otio.adapters.write_to_file(timeline, output_file)
    print(f"Successfully created {output_file}")

if __name__ == "__main__":
    create_vietnam_vibes_timeline()
