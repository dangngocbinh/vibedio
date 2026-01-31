#!/usr/bin/env python3
"""
OTIO Script Generator CLI

Auto-generate Python scripts for video editing from natural language commands.

Usage:
    # Generate script from command
    python generators/cli.py generate "insert clip video.mp4 at 10s on track 0" \\
        --project public/projects/my-video/project.otio

    # Generate and view
    python generators/cli.py generate "add 2s transition between clips 2-3" \\
        --project public/projects/my-video/project.otio --output edit.py

    # Generate from workflow
    python generators/cli.py workflow intro_outro \\
        --intro intro.mp4 --outro outro.mp4 \\
        --project public/projects/my-video/project.otio

    # List available patterns
    python generators/cli.py patterns

    # Get help for specific operation
    python generators/cli.py help insert
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from generators.command_parser import CommandParser
from generators.script_generator import ScriptGenerator, WorkflowGenerator
from generators.timeline_inspector import TimelineInspector


def generate_from_command(args):
    """Generate script from natural language command."""
    try:
        parser = CommandParser()
        operations = parser.parse(args.editing_command)

        print(f"✓ Parsed command: {args.editing_command}")
        print(f"  Operation: {operations[0].type}")
        print(f"  Parameters: {operations[0].params}")

        # Generate script
        generator = ScriptGenerator()
        script = generator.generate(
            operations=operations,
            project_file_path=args.project
        )

        # Validate
        is_valid, errors = generator.validate_script(script)
        if not is_valid:
            print("\n✗ Generated script has validation errors:")
            for error in errors:
                print(f"  - {error}")
            return 1

        print("✓ Script validation passed")

        # Output
        if args.output:
            Path(args.output).write_text(script)
            print(f"✓ Script saved to: {args.output}")
        else:
            print("\n" + "=" * 80)
            print(script)
            print("=" * 80)

        if args.execute:
            print("\n⚠ Execution mode - running script...")
            try:
                exec(script)
                print("✓ Script executed successfully")
            except Exception as e:
                print(f"✗ Execution error: {e}")
                return 1

        return 0

    except ValueError as e:
        print(f"✗ Parse error: {e}")
        return 1
    except Exception as e:
        print(f"✗ Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def generate_from_workflow(args):
    """Generate script from workflow template."""
    try:
        generator = WorkflowGenerator()

        if args.workflow == 'intro_outro':
            if not args.intro or not args.outro:
                print("✗ intro_outro workflow requires --intro and --outro")
                return 1

            print(f"✓ Generating intro_outro workflow...")
            print(f"  Intro: {args.intro}")
            print(f"  Outro: {args.outro}")

            script = generator.generate_intro_outro(
                project_file_path=args.project,
                intro_file=args.intro,
                outro_file=args.outro,
                intro_duration=args.intro_duration or 3.0,
                outro_duration=args.outro_duration or 3.0,
            )

        elif args.workflow == 'watermark':
            if not args.watermark:
                print("✗ watermark workflow requires --watermark")
                return 1

            print(f"✓ Generating watermark workflow...")
            print(f"  File: {args.watermark}")
            print(f"  Position: {args.position or 'bottom-right'}")

            script = generator.generate_watermark(
                project_file_path=args.project,
                watermark_file=args.watermark,
                position=args.position or 'bottom-right',
                duration=args.duration or 30.0,
            )

        elif args.workflow == 'ripple_edit':
            if args.clip_id is None:
                print("✗ ripple_edit workflow requires --clip-id")
                return 1

            print(f"✓ Generating ripple_edit workflow...")
            print(f"  Clip: {args.clip_id}")
            print(f"  Track: {args.track or 0}")

            script = generator.generate_ripple_edit(
                project_file_path=args.project,
                clip_index=args.clip_id,
                track_index=args.track or 0,
            )

        else:
            print(f"✗ Unknown workflow: {args.workflow}")
            print(f"   Available: intro_outro, watermark, ripple_edit")
            return 1

        print("✓ Script generated successfully")

        # Output
        if args.output:
            Path(args.output).write_text(script)
            print(f"✓ Script saved to: {args.output}")
        else:
            print("\n" + "=" * 80)
            print(script)
            print("=" * 80)

        if args.execute:
            print("\n⚠ Execution mode - running script...")
            try:
                exec(script)
                print("✓ Script executed successfully")
            except Exception as e:
                print(f"✗ Execution error: {e}")
                return 1

        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def list_patterns(args):
    """List available command patterns."""
    parser = CommandParser()
    patterns = parser.list_patterns()

    print("Available Command Patterns:")
    print("=" * 80)

    for pattern in patterns:
        print(f"\n{pattern['name'].upper()}")
        print(f"  {pattern['description']}")
        print(f"  Example: {pattern['example']}")

    print("\n" + "=" * 80)
    print(f"Total: {len(patterns)} patterns available")
    return 0


def get_help(args):
    """Get help for specific operation."""
    parser = CommandParser()
    operation = args.operation if hasattr(args, 'operation') else None

    help_text = parser.get_pattern_help(operation)
    if help_text:
        print(help_text)
        return 0
    else:
        print(f"✗ No help available for: {operation}")
        return 1


def inspect_timeline(args):
    """Inspect timeline structure."""
    try:
        inspector = TimelineInspector(args.project)

        if args.track is not None:
            # Show detailed track info
            inspector.print_detailed_info(args.track)
        else:
            # Show summary
            inspector.print_timeline_summary()

        # Show gaps if requested
        if args.show_gaps:
            gaps = inspector.get_gaps()
            if gaps:
                print("\nGaps in timeline:")
                for gap in gaps:
                    print(f"  Track {gap['track_index']} ({gap['track_name']}): {gap['duration_seconds']:.2f}s")
            else:
                print("\nNo gaps found")

        # Show transitions if requested
        if args.show_transitions:
            transitions = inspector.get_transitions()
            if transitions:
                print("\nTransitions in timeline:")
                for trans in transitions:
                    print(f"  Track {trans['track_index']} ({trans['track_name']}): {trans['type']} ({trans['duration_seconds']:.2f}s)")
            else:
                print("\nNo transitions found")

        # Find clip by name if requested
        if args.find:
            results = inspector.find_clip_by_name(args.find)
            if results:
                print(f"\nClips matching '{args.find}':")
                for result in results:
                    print(f"  Track {result['track_index']} ({result['track_name']}) -> Clip {result['clip_index']} ({result['clip_name']})")
            else:
                print(f"\nNo clips found matching '{args.find}'")

        return 0

    except Exception as e:
        print(f"✗ Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='OTIO Script Generator - Auto-generate editing scripts',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate from command
  %(prog)s generate "insert clip video.mp4 at 10s on track 0" \\
    --project public/projects/my-video/project.otio

  # Generate from workflow
  %(prog)s workflow intro_outro \\
    --intro intro.mp4 --outro outro.mp4 \\
    --project public/projects/my-video/project.otio \\
    --output workflow.py

  # List patterns
  %(prog)s patterns
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # GENERATE command
    gen_parser = subparsers.add_parser('generate', help='Generate script from command')
    gen_parser.add_argument('editing_command', help='Editing command (e.g., "insert clip video.mp4 at 10s")')
    gen_parser.add_argument(
        '--project', '-p',
        required=True,
        help='Path to project.otio file'
    )
    gen_parser.add_argument(
        '--output', '-o',
        help='Output script path (default: print to stdout)'
    )
    gen_parser.add_argument(
        '--execute', '-x',
        action='store_true',
        help='Execute generated script immediately'
    )
    gen_parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )

    # WORKFLOW command
    wf_parser = subparsers.add_parser('workflow', help='Generate script from workflow template')
    wf_parser.add_argument('workflow', help='Workflow type (intro_outro, watermark, ripple_edit)')
    wf_parser.add_argument(
        '--project', '-p',
        required=True,
        help='Path to project.otio file'
    )
    wf_parser.add_argument('--intro', help='Path to intro video (for intro_outro)')
    wf_parser.add_argument('--outro', help='Path to outro video (for intro_outro)')
    wf_parser.add_argument('--intro-duration', type=float, help='Intro duration in seconds')
    wf_parser.add_argument('--outro-duration', type=float, help='Outro duration in seconds')
    wf_parser.add_argument('--watermark', help='Path to watermark file (for watermark)')
    wf_parser.add_argument('--position', help='Watermark position (for watermark)')
    wf_parser.add_argument('--duration', type=float, help='Duration in seconds (for watermark)')
    wf_parser.add_argument('--clip-id', type=int, help='Clip ID (for ripple_edit)')
    wf_parser.add_argument('--track', type=int, help='Track index (for ripple_edit)')
    wf_parser.add_argument(
        '--output', '-o',
        help='Output script path (default: print to stdout)'
    )
    wf_parser.add_argument(
        '--execute', '-x',
        action='store_true',
        help='Execute generated script immediately'
    )
    wf_parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )

    # PATTERNS command
    pat_parser = subparsers.add_parser('patterns', help='List available command patterns')

    # HELP command
    help_parser = subparsers.add_parser('help', help='Get help for specific operation')
    help_parser.add_argument('operation', nargs='?', help='Operation name')

    # INSPECT command
    inspect_parser = subparsers.add_parser('inspect', help='Inspect timeline structure')
    inspect_parser.add_argument(
        '--project', '-p',
        required=True,
        help='Path to project.otio file'
    )
    inspect_parser.add_argument(
        '--track', '-t',
        type=int,
        help='Show detailed info for specific track (0-based index)'
    )
    inspect_parser.add_argument(
        '--find',
        help='Find clips by name'
    )
    inspect_parser.add_argument(
        '--show-gaps',
        action='store_true',
        help='Show all gaps in timeline'
    )
    inspect_parser.add_argument(
        '--show-transitions',
        action='store_true',
        help='Show all transitions in timeline'
    )
    inspect_parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    if args.command == 'generate':
        return generate_from_command(args)
    elif args.command == 'workflow':
        return generate_from_workflow(args)
    elif args.command == 'patterns':
        return list_patterns(args)
    elif args.command == 'help':
        return get_help(args)
    elif args.command == 'inspect':
        return inspect_timeline(args)
    else:
        parser.print_help()
        return 0


if __name__ == '__main__':
    sys.exit(main())
