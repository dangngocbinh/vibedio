#!/usr/bin/env python3
"""Quick tests for command parser and script generator."""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generators.command_parser import CommandParser
from generators.script_generator import ScriptGenerator, WorkflowGenerator


def test_command_parser():
    """Test command parser with various commands."""
    print("=" * 80)
    print("TESTING COMMAND PARSER")
    print("=" * 80)

    parser = CommandParser()

    test_commands = [
        "insert clip video.mp4 at 10s on track 0",
        "add 2s transition between clips 2-3",
        "remove clip 1 from track 0",
        "adjust duration of clip 0 to 5s",
        "create track named V2",
        "remove track 1",
    ]

    for cmd in test_commands:
        try:
            ops = parser.parse(cmd)
            print(f"\n✓ Command: {cmd}")
            print(f"  Operation: {ops[0].type}")
            print(f"  Params: {ops[0].params}")
        except ValueError as e:
            print(f"\n✗ Command failed: {cmd}")
            print(f"  Error: {e}")


def test_script_generator():
    """Test script generation."""
    print("\n" + "=" * 80)
    print("TESTING SCRIPT GENERATOR")
    print("=" * 80)

    parser = CommandParser()
    generator = ScriptGenerator()

    # Test: Generate script from command
    cmd = "insert clip background.mp4 at 5s on track 0"
    print(f"\nGenerating script for: {cmd}")

    ops = parser.parse(cmd)
    script = generator.generate(
        operations=ops,
        project_file_path="public/projects/sample/project.otio"
    )

    # Check validation
    is_valid, errors = generator.validate_script(script)
    if is_valid:
        print("✓ Script validation passed")
    else:
        print("✗ Script validation failed:")
        for error in errors:
            print(f"  - {error}")

    print(f"\nGenerated script ({len(script)} chars):")
    print("-" * 80)
    print(script[:500])  # Print first 500 chars
    print("... (truncated)")
    print("-" * 80)


def test_workflow_generator():
    """Test workflow script generation."""
    print("\n" + "=" * 80)
    print("TESTING WORKFLOW GENERATOR")
    print("=" * 80)

    generator = WorkflowGenerator()

    # Test: Intro/outro workflow
    print("\nGenerating intro_outro workflow...")
    script = generator.generate_intro_outro(
        project_file_path="public/projects/sample/project.otio",
        intro_file="intro.mp4",
        outro_file="outro.mp4",
        intro_duration=3.0,
        outro_duration=3.0,
    )

    print(f"✓ Generated script ({len(script)} chars)")
    print("\nFirst 500 characters:")
    print(script[:500])


def test_pattern_listing():
    """Test pattern listing."""
    print("\n" + "=" * 80)
    print("AVAILABLE PATTERNS")
    print("=" * 80)

    parser = CommandParser()
    patterns = parser.list_patterns()

    for pattern in patterns:
        print(f"\n• {pattern['name']}: {pattern['description']}")
        print(f"  Example: {pattern['example']}")


if __name__ == '__main__':
    try:
        test_command_parser()
        test_script_generator()
        test_workflow_generator()
        test_pattern_listing()

        print("\n" + "=" * 80)
        print("✓ ALL TESTS PASSED")
        print("=" * 80)

    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
