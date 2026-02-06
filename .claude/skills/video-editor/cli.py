#!/usr/bin/env python3
"""
Video Editor CLI - Generate and edit OTIO timelines from project files.

Usage:
    python cli.py build public/projects/my-project
    python cli.py build public/projects/my-project --fps 60
    python cli.py add-title public/projects/my-project --text "Subscribe!" --at-second 5 --duration 3
"""
import argparse
import sys
from pathlib import Path
import opentimelineio as otio

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
# Add parent for status_manager
sys.path.insert(0, str(Path(__file__).parent.parent / "video-production-director"))

from core.timeline_builder import TimelineBuilder
from editors.overlay_editor import OverlayEditor
from editors.audio_editor import AudioEditor

# Import status manager (optional - graceful fallback if not available)
try:
    from utils.status_manager import StatusManager
    HAS_STATUS_MANAGER = True
except ImportError:
    HAS_STATUS_MANAGER = False


def _update_status_built(project_dir: str):
    """Update status to video_built."""
    if not HAS_STATUS_MANAGER:
        return
    try:
        manager = StatusManager(project_dir)
        manager.complete_step("video_built", "Build project.otio")
    except Exception:
        pass  # Silently ignore status update errors


def _mark_otio_edited(project_dir: str, action: str):
    """Mark OTIO as edited."""
    if not HAS_STATUS_MANAGER:
        return
    try:
        manager = StatusManager(project_dir)
        manager.mark_otio_edited(action)
    except Exception:
        pass  # Silently ignore status update errors


def _check_rebuild_warning(project_dir: str) -> bool:
    """
    Check if rebuild would lose OTIO edits.

    Returns:
        True if should proceed, False if user should be warned
    """
    if not HAS_STATUS_MANAGER:
        return True

    try:
        manager = StatusManager(project_dir)
        if manager.has_otio_edits():
            print(manager.get_rebuild_warning_message())
            return False
        return True
    except Exception:
        return True


def cmd_build(args):
    """Build OTIO timeline from project files."""
    project_path = Path(args.project_dir)
    if not project_path.exists():
        print(f"Error: Project directory not found: {args.project_dir}")
        return 1

    # Check if OTIO exists and has edits - warn user
    otio_path = project_path / "project.otio"
    if otio_path.exists() and not getattr(args, 'force', False):
        if not _check_rebuild_warning(args.project_dir):
            print("\n❌ Build cancelled to protect your edits.")
            print("   Use --force to override and rebuild anyway.")
            return 1

    try:
        # Create builder
        builder = TimelineBuilder(args.project_dir, fps=args.fps)
        print(f"Project: {project_path.name}")

        # Load inputs
        builder.load_inputs()
        print(f"Loaded inputs from {args.project_dir}")

        # Get project info
        video_type = builder.get_video_type()
        duration = builder.get_duration()
        ratio = builder.get_aspect_ratio()
        print(f"Video type: {video_type} ({duration}s @ {args.fps}fps, ratio: {ratio})")

        # Validate only mode
        if args.validate_only:
            print("Validation passed!")
            return 0

        # Build timeline (no strategy needed!)
        timeline = builder.build()
        track_count = len(timeline.tracks)
        print(f"Built timeline with {track_count} track(s)")

        if args.verbose:
            for i, track in enumerate(timeline.tracks):
                clip_count = len([c for c in track if hasattr(c, 'name')])
                print(f"   Track {i+1}: {track.name} ({track.kind}) - {clip_count} clip(s)")

        # Save
        output_path = args.output or str(project_path / 'project.otio')
        saved_path = builder.save(output_path)
        print(f"Saved timeline to: {saved_path}")

        # Update status
        _update_status_built(args.project_dir)

        # Success message
        print("\nTimeline generation complete!")
        
        # Auto-launch Remotion Studio
        print(f"   🚀 Launching Remotion Studio for 'project.otio'...")
        try:
            import subprocess
            # Use director.py studio command
            director_script = Path(__file__).parent.parent / "video-production-director" / "director.py"
            # Extract project name from path
            project_name = Path(args.project_dir).name
            
            subprocess.Popen(
                ["python3", str(director_script), "studio", "--project", project_name],
                start_new_session=True # Detach
            )
        except Exception as e:
             print(f"   ⚠️ Could not auto-launch Studio: {e}")
             print(f"   PLEASE RUN: python3 .claude/skills/video-production-director/director.py studio --project {project_name}")

        return 0

    except FileNotFoundError as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1

    except ValueError as e:
        print(f"Validation Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_title(args):
    """Add title overlay to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = OverlayEditor(timeline, fps=args.fps)

        # Add title
        editor.add_title(
            text=args.text,
            at_second=args.at_second,
            duration=args.duration,
            style=args.style,
            position=args.position,
            subtitle=args.subtitle
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added title: '{args.text}' at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-title '{args.text}' at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_lower_third(args):
    """Add lower-third overlay to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = OverlayEditor(timeline, fps=args.fps)

        # Add lower-third
        editor.add_lower_third(
            title=args.title,
            at_second=args.at_second,
            duration=args.duration,
            template=args.template,
            subtitle=args.subtitle,
            primary_color=args.primary_color,
            secondary_color=args.secondary_color,
            text_color=args.text_color
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added lower-third: '{args.title}' at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-lower-third '{args.title}' at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_sticker(args):
    """Add sticker overlay to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = OverlayEditor(timeline, fps=args.fps)

        # Add sticker
        editor.add_sticker(
            emoji=args.emoji,
            at_second=args.at_second,
            duration=args.duration,
            position=args.position,
            size=args.size,
            animation=args.animation,
            track_name=args.track_name
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added sticker: {args.emoji} at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-sticker {args.emoji} at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_effect(args):
    """Add effect overlay to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = OverlayEditor(timeline, fps=args.fps)

        # Add effect
        editor.add_effect(
            effect_type=args.effect_type,
            at_second=args.at_second,
            duration=args.duration,
            intensity=args.intensity
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added effect: {args.effect_type} at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-effect {args.effect_type} at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_cta(args):
    """Add CTA overlay to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = OverlayEditor(timeline, fps=args.fps)

        # Add CTA
        editor.add_cta(
            text=args.text,
            at_second=args.at_second,
            duration=args.duration,
            action=args.action,
            style=args.style,
            position=args.position
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added CTA: '{args.text}' at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-cta '{args.text}' at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def cmd_add_sfx(args):
    """Add sound effect to existing timeline."""
    otio_path = Path(args.project_dir) / "project.otio"
    if not otio_path.exists():
        print(f"Error: Timeline not found: {otio_path}")
        print("   Run 'build' command first to create timeline")
        return 1

    try:
        # Load timeline
        timeline = otio.adapters.read_from_file(str(otio_path))

        # Create editor
        editor = AudioEditor(timeline, fps=args.fps)

        # Add SFX
        editor.add_sfx(
            url=args.url,
            at_second=args.at_second,
            volume=args.volume,
            track_name=args.track_name
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added SFX: '{args.url}' at {args.at_second}s")

        # Mark OTIO as edited
        _mark_otio_edited(args.project_dir, f"add-sfx at {args.at_second}s")

        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Video Editor - Generate and edit OTIO timelines',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  build          Build OTIO timeline from project files
  add-title      Add title overlay to existing timeline
  add-sticker    Add sticker overlay to existing timeline
  add-effect     Add effect overlay to existing timeline
  add-cta        Add CTA overlay to existing timeline
  add-lower-third Add lower-third overlay to existing timeline

Examples:
  %(prog)s build public/projects/5-sai-lam-hoc-tieng-anh
  %(prog)s build public/projects/my-video --fps 60
  %(prog)s add-title public/projects/my-video --text "Subscribe!" --at-second 5 --duration 3
  %(prog)s add-lower-third public/projects/my-video --title "DIO" --subtitle "Director" --at-second 1 --duration 5
  %(prog)s add-sticker public/projects/my-video --emoji "👍" --at-second 10 --duration 2
        """
    )

    # Global arguments
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--fps', type=int, default=30, help='Frames per second (default: 30)')

    # Subcommands
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Build command
    build_parser = subparsers.add_parser('build', help='Build OTIO timeline from project files')
    build_parser.add_argument('project_dir', help='Path to project directory')
    build_parser.add_argument('--output', '-o', help='Output .otio file path')
    build_parser.add_argument('--validate-only', action='store_true', help='Only validate inputs')
    build_parser.add_argument('--force', '-f', action='store_true', help='Force rebuild even if OTIO has edits')

    # Add-title command
    title_parser = subparsers.add_parser('add-title', help='Add title overlay')
    title_parser.add_argument('project_dir', help='Path to project directory')
    title_parser.add_argument('--text', required=True, help='Title text')
    title_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    title_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    title_parser.add_argument('--style', default='highlight', help='Title style (default: highlight)')
    title_parser.add_argument('--position', default='bottom', help='Position (default: bottom)')
    title_parser.add_argument('--subtitle', default='', help='Optional subtitle')

    # Add-lower-third command
    lt_parser = subparsers.add_parser('add-lower-third', help='Add lower-third overlay')
    lt_parser.add_argument('project_dir', help='Path to project directory')
    lt_parser.add_argument('--title', required=True, help='Main title text')
    lt_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    lt_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    lt_parser.add_argument('--template', default='modern-skew', help='Template (default: modern-skew)')
    lt_parser.add_argument('--subtitle', default='', help='Optional subtitle')
    lt_parser.add_argument('--primary-color', default='#3498db', help='Primary color (hex)')
    lt_parser.add_argument('--secondary-color', default='#ffffff', help='Secondary color (hex)')
    lt_parser.add_argument('--text-color', default='#2c3e50', help='Text color (hex)')

    # Add-sticker command
    sticker_parser = subparsers.add_parser('add-sticker', help='Add sticker overlay')
    sticker_parser.add_argument('project_dir', help='Path to project directory')
    sticker_parser.add_argument('--emoji', required=True, help='Emoji/sticker content')
    sticker_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    sticker_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    sticker_parser.add_argument('--position', default='center', help='Position (default: center)')
    sticker_parser.add_argument('--size', default='medium', help='Size (default: medium)')
    sticker_parser.add_argument('--animation', default='bounce', help='Animation (default: bounce)')
    sticker_parser.add_argument('--track-name', default='Overlays', help='Track name (default: Overlays)')

    # Add-effect command
    effect_parser = subparsers.add_parser('add-effect', help='Add effect overlay')
    effect_parser.add_argument('project_dir', help='Path to project directory')
    effect_parser.add_argument('--effect-type', required=True, help='Effect type (zoom, blur, shake, etc.)')
    effect_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    effect_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    effect_parser.add_argument('--intensity', type=float, default=0.5, help='Intensity (0.0-1.0, default: 0.5)')

    # Add-cta command
    cta_parser = subparsers.add_parser('add-cta', help='Add CTA overlay')
    cta_parser.add_argument('project_dir', help='Path to project directory')
    cta_parser.add_argument('--text', required=True, help='CTA text')
    cta_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    cta_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    cta_parser.add_argument('--action', default='subscribe', help='Action type (default: subscribe)')
    cta_parser.add_argument('--style', default='default', help='CTA style (default: default)')
    cta_parser.add_argument('--position', default='bottom', help='Position (default: bottom)')

    # Add-sfx command
    sfx_parser = subparsers.add_parser('add-sfx', help='Add sound effect')
    sfx_parser.add_argument('project_dir', help='Path to project directory')
    sfx_parser.add_argument('--url', required=True, help='Path or URL to SFX file')
    sfx_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    sfx_parser.add_argument('--volume', type=float, default=1.0, help='Volume (0.0-1.0, default: 1.0)')
    sfx_parser.add_argument('--track-name', default='SFX', help='Track name (default: SFX)')

    args = parser.parse_args()

    # Route to command handler
    if args.command == 'build':
        return cmd_build(args)
    elif args.command == 'add-title':
        return cmd_add_title(args)
    elif args.command == 'add-lower-third':
        return cmd_add_lower_third(args)
    elif args.command == 'add-sticker':
        return cmd_add_sticker(args)
    elif args.command == 'add-effect':
        return cmd_add_effect(args)
    elif args.command == 'add-cta':
        return cmd_add_cta(args)
    elif args.command == 'add-sfx':
        return cmd_add_sfx(args)
    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main())
