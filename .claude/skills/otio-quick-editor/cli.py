#!/usr/bin/env python3
"""
OTIO Quick Editor CLI

Fast timeline editing without rebuilding entire project.
"""
import sys
import click
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

# Add current directory to path for imports
sys.path.insert(0, '.')

from commands.add_title import add_title
from commands.add_sticker import add_sticker
from commands.add_effect import add_effect
from commands.list_clips import list_clips


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """
    OTIO Quick Editor - Fast timeline editing tool.

    Examples:
      otio-quick-editor add-title --project demo --text "Subscribe!" --at-second 3 --duration 4
      otio-quick-editor add-sticker --project demo --emoji "🔥" --at-second 5 --duration 2
      otio-quick-editor list-clips --project demo --track Overlays
    """
    pass


@cli.command()
@click.option('--project', required=True, help='Project name')
@click.option('--text', required=True, help='Title text')
@click.option('--at-second', type=float, required=True, help='Start time in seconds')
@click.option('--duration', type=float, required=True, help='Duration in seconds')
@click.option('--style', default='default', help='Title style (default, neon-glow, retro, minimal, bold)')
@click.option('--position', default='center', help='Position (center, top, bottom, left, right, etc.)')
@click.option('--font-size', type=int, default=48, help='Font size in pixels')
@click.option('--color', default='#FFFFFF', help='Text color hex code')
def add_title_cmd(project, text, at_second, duration, style, position, font_size, color):
    """Add title overlay to timeline."""
    try:
        add_title(project, text, at_second, duration, style, position, font_size, color)
    except Exception as e:
        click.echo(f"{Fore.RED}❌ Error: {str(e)}{Style.RESET_ALL}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--project', required=True, help='Project name')
@click.option('--emoji', required=True, help='Emoji or sticker text')
@click.option('--at-second', type=float, required=True, help='Start time in seconds')
@click.option('--duration', type=float, required=True, help='Duration in seconds')
@click.option('--animation', default='pop', help='Animation type (pop, shake, rotate, slide-in, bounce, pulse, fade)')
@click.option('--position', default='center', help='Position (center, top, bottom, top-left, top-right, etc.)')
@click.option('--size', type=int, default=100, help='Sticker size in pixels')
def add_sticker_cmd(project, emoji, at_second, duration, animation, position, size):
    """Add sticker overlay to timeline."""
    try:
        add_sticker(project, emoji, at_second, duration, animation, position, size)
    except Exception as e:
        click.echo(f"{Fore.RED}❌ Error: {str(e)}{Style.RESET_ALL}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--project', required=True, help='Project name')
@click.option('--effect-type', required=True, help='Effect type (neon-circles, hud-overlay, radar, scan-lines, glitch)')
@click.option('--at-second', type=float, required=True, help='Start time in seconds')
@click.option('--duration', type=float, required=True, help='Duration in seconds')
@click.option('--intensity', type=float, default=0.5, help='Effect intensity 0.0-1.0')
def add_effect_cmd(project, effect_type, at_second, duration, intensity):
    """Add layer effect overlay to timeline."""
    try:
        add_effect(project, effect_type, at_second, duration, intensity)
    except Exception as e:
        click.echo(f"{Fore.RED}❌ Error: {str(e)}{Style.RESET_ALL}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--project', required=True, help='Project name')
@click.option('--track', default=None, help='Track name (optional, if not provided lists all tracks)')
def list_clips_cmd(project, track):
    """List tracks or clips in a track."""
    try:
        list_clips(project, track)
    except Exception as e:
        click.echo(f"{Fore.RED}❌ Error: {str(e)}{Style.RESET_ALL}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()
