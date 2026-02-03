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

from core.timeline_builder import TimelineBuilder
from editors.overlay_editor import OverlayEditor


def cmd_build(args):
    """Build OTIO timeline from project files."""
    project_path = Path(args.project_dir)
    if not project_path.exists():
        print(f"Error: Project directory not found: {args.project_dir}")
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

        # Success message
        print("\nTimeline generation complete!")
        print(f"   Next: Load '{Path(saved_path).name}' in Remotion Studio")

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
            animation=args.animation
        )

        # Save timeline
        otio.adapters.write_to_file(timeline, str(otio_path))
        print(f"✅ Added sticker: {args.emoji} at {args.at_second}s")

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

Examples:
  %(prog)s build public/projects/5-sai-lam-hoc-tieng-anh
  %(prog)s build public/projects/my-video --fps 60
  %(prog)s add-title public/projects/my-video --text "Subscribe!" --at-second 5 --duration 3
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

    # Add-title command
    title_parser = subparsers.add_parser('add-title', help='Add title overlay')
    title_parser.add_argument('project_dir', help='Path to project directory')
    title_parser.add_argument('--text', required=True, help='Title text')
    title_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    title_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    title_parser.add_argument('--style', default='highlight', help='Title style (default: highlight)')
    title_parser.add_argument('--position', default='bottom', help='Position (default: bottom)')
    title_parser.add_argument('--subtitle', default='', help='Optional subtitle')

    # Add-sticker command
    sticker_parser = subparsers.add_parser('add-sticker', help='Add sticker overlay')
    sticker_parser.add_argument('project_dir', help='Path to project directory')
    sticker_parser.add_argument('--emoji', required=True, help='Emoji/sticker content')
    sticker_parser.add_argument('--at-second', type=float, required=True, help='Start time in seconds')
    sticker_parser.add_argument('--duration', type=float, required=True, help='Duration in seconds')
    sticker_parser.add_argument('--position', default='center', help='Position (default: center)')
    sticker_parser.add_argument('--size', default='medium', help='Size (default: medium)')
    sticker_parser.add_argument('--animation', default='bounce', help='Animation (default: bounce)')

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

    args = parser.parse_args()

    # Route to command handler
    if args.command == 'build':
        return cmd_build(args)
    elif args.command == 'add-title':
        return cmd_add_title(args)
    elif args.command == 'add-sticker':
        return cmd_add_sticker(args)
    elif args.command == 'add-effect':
        return cmd_add_effect(args)
    elif args.command == 'add-cta':
        return cmd_add_cta(args)
    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main())
