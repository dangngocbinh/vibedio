#!/usr/bin/env python3
"""
Video Editor CLI - Generate OTIO timelines from project files.

Usage:
    python cli.py public/projects/my-project
    python cli.py public/projects/my-project --fps 60
    python cli.py public/projects/my-project --validate-only
"""
import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from core.otio_builder import OtioTimelineBuilder


# Strategy map - will be populated as strategies are implemented
STRATEGY_MAP = {}


def import_strategies():
    """Dynamically import available strategies."""
    global STRATEGY_MAP

    try:
        from strategies.listicle_strategy import ListicleStrategy
        STRATEGY_MAP['listicle'] = ListicleStrategy
    except ImportError:
        pass

    try:
        from strategies.facts_strategy import FactsStrategy
        STRATEGY_MAP['facts'] = FactsStrategy
    except ImportError:
        pass

    try:
        from strategies.motivation_strategy import MotivationStrategy
        STRATEGY_MAP['motivation'] = MotivationStrategy
    except ImportError:
        pass

    try:
        from strategies.story_strategy import StoryStrategy
        STRATEGY_MAP['story'] = StoryStrategy
    except ImportError:
        pass

    try:
        from strategies.image_slide_strategy import ImageSlideStrategy
        STRATEGY_MAP['image-slide'] = ImageSlideStrategy
    except ImportError:
        pass

    try:
        from strategies.multi_video_edit_strategy import MultiVideoEditStrategy
        STRATEGY_MAP['multi-video-edit'] = MultiVideoEditStrategy
    except ImportError:
        pass



def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Generate OTIO timeline from project files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s public/projects/5-sai-lam-hoc-tieng-anh
  %(prog)s public/projects/5-sai-lam-hoc-tieng-anh --fps 60
  %(prog)s public/projects/5-sai-lam-hoc-tieng-anh --validate-only
  %(prog)s public/projects/5-sai-lam-hoc-tieng-anh -o custom.otio
        """
    )

    parser.add_argument(
        'project_dir',
        help='Path to project directory (contains script.json, voice.json, resources.json)'
    )

    parser.add_argument(
        '--fps',
        type=int,
        default=30,
        help='Frames per second (default: 30)'
    )

    parser.add_argument(
        '--output', '-o',
        help='Output .otio file path (default: project_dir/project.otio)'
    )

    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Only validate inputs, do not generate timeline'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Import available strategies
    import_strategies()

    # Check if project directory exists
    project_path = Path(args.project_dir)
    if not project_path.exists():
        print(f"Error: Project directory not found: {args.project_dir}")
        return 1

    try:
        # Create builder
        builder = OtioTimelineBuilder(args.project_dir, fps=args.fps)
        print(f"Project: {project_path.name}")

        # Load inputs
        builder.load_inputs()
        print(f"Loaded inputs from {args.project_dir}")

        # Determine video type and aspect ratio
        video_type = builder.get_video_type()
        duration = builder.get_duration()
        ratio = builder.get_aspect_ratio()
        print(f"Video type: {video_type} ({duration}s @ {args.fps}fps, ratio: {ratio})")

        # Validate only mode
        if args.validate_only:
            print("Validation passed!")
            return 0

        # Select strategy
        strategy_class = STRATEGY_MAP.get(video_type)
        if not strategy_class:
            available = ', '.join(STRATEGY_MAP.keys()) if STRATEGY_MAP else 'none'
            print(f"Error: Unsupported video type '{video_type}'")
            print(f"   Available types: {available}")
            print(f"   Hint: The strategy for '{video_type}' may not be implemented yet")
            return 1

        strategy = strategy_class(fps=args.fps, project_dir=args.project_dir)
        print(f"Using {strategy.__class__.__name__}")

        # Build timeline
        timeline = builder.build_timeline(strategy)
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


if __name__ == '__main__':
    sys.exit(main())
