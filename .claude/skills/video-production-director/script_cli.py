#!/usr/bin/env python3
"""
Video Script Generator CLI (Unified Architecture)
==================================================
CLI tools for unified video script workflow.

Commands:
  init            - Initialize project with resources
  read            - Read script (summary or detail)
  add-section     - Add section to script
  add-scenes      - Add scenes to section
  update-scene    - Update specific scene
  rebuild-section - Rebuild scenes in section
  sync            - Sync timing with voice
  merge-resources - Merge resources into script
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

from utils.project_initializer import ProjectInitializer
from utils.json_builder import JSONBuilder

from utils.synchronizer import ScriptSynchronizer
import os

def _resolve_text(text_arg: str, cwd: Optional[str] = None) -> str:
    """
    Resolve text argument.
    If text_arg is a valid file path, read content from file.
    Otherwise return text_arg as is.
    
    Args:
        text_arg: The text content OR a path to a text file.
        cwd: Optional directory to resolve relative paths against.
    """
    if not text_arg:
        return ""
        
    path_obj = Path(text_arg)
    
    # Try relative to cwd if provided
    if cwd and not path_obj.is_absolute():
        potential_path = Path(cwd) / text_arg
        if potential_path.is_file():
            path_obj = potential_path

    # If it's a file, read it
    if path_obj.is_file():
        try:
            with open(path_obj, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception as e:
            print(f"⚠️  Could not read file {path_obj}: {e}")
            raise

    # Safeguard: if it looks like a project path or has a text extension but wasn't found
    likely_path = (
        text_arg.startswith('public/projects/') or 
        text_arg.endswith('.txt') or 
        text_arg.endswith('.md') or
        '/' in text_arg or
        '\\' in text_arg
    )
    
    if likely_path and not path_obj.exists():
        raise ValueError(f"Input '{text_arg}' looks like a file path but file was not found. "
                         f"Please provide valid text content or a valid file path.")
        
    return text_arg


# ============================================================================
# COMMAND: init
# ============================================================================

def cmd_init(args):
    """Initialize project with metadata + resources."""
    print(f"🎬 Initializing project: {args.project}")

    # Parse resources
    resources = args.resources if args.resources else []

    # Initialize
    initializer = ProjectInitializer()

    try:
        summary = initializer.create_initial_script(
            project_dir=args.project,
            description=args.description,
            full_text=_resolve_text(args.text, cwd=args.project),
            ratio=args.ratio,
            resources=resources
        )

        print(f"\n✅ Project initialized!")
        print(f"   📄 Script: {summary['scriptPath']}")
        print(f"   📝 Project: {summary['projectName']}")
        print(f"   📐 Ratio: {summary['ratio']}")
        print(f"   📊 Words: {summary['wordCount']}")
        print(f"   📦 Resources: {summary['userResourcesCount']}")

        if summary['userResources']:
            print(f"\n📦 User Resources:")
            for res in summary['userResources']:
                print(f"   - {res['type']}: {Path(res['path']).name}")
                if res.get('duration'):
                    print(f"     ⏱️  Duration: {res['duration']:.1f}s")
                if res.get('resolution'):
                    print(f"     📐 Resolution: {res['resolution']}")
        
        # Save raw script file if provided
        if args.text and os.path.exists(args.text) and os.path.isfile(args.text):
            try:
                import shutil
                project_path = Path(args.project)
                dest_path = project_path / 'raw_script.txt'

                # Check if source and destination are the same file
                if os.path.abspath(args.text) != os.path.abspath(str(dest_path)):
                    shutil.copy2(args.text, dest_path)
                    print(f"   📄 Raw Script Saved: {dest_path}")
                else:
                    print(f"   📄 Raw Script: {dest_path} (already exists)")
            except Exception as e:
                print(f"⚠️  Could not save raw script: {e}")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: read
# ============================================================================

def cmd_read(args):
    """Read script (summary or detail)."""
    try:
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Read specific scene
        if args.scene:
            return _read_scene(script, args.scene)

        # Read specific section
        if args.section:
            return _read_section(script, args.section)

        # Read summary (default)
        return _read_summary(script)

    except FileNotFoundError:
        print(f"❌ Script not found: {args.script}")
        return 1
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def _read_summary(script: Dict) -> int:
    """Print script summary."""
    metadata = script['metadata']
    script_data = script['script']
    sections = script.get('sections', [])
    resources = script.get('userResources', [])

    print(f"\n📋 Project: {metadata['projectName']}")
    print(f"   📝 Description: {metadata.get('description', 'N/A')}")
    print(f"   ⏱️  Duration: {metadata.get('duration', 'N/A')}s")
    print(f"   📐 Ratio: {metadata['ratio']}")

    # Voice
    voice = script.get('voice', {})
    music = script.get('music', {})
    print(f"   🎙️  Voice: {voice.get('provider', 'N/A')}/{voice.get('voiceId', 'N/A')}")
    print(f"   🎵 Music: {music.get('mood', 'N/A')}")

    # Sections
    print(f"\n📌 Sections ({len(sections)}):")
    for section in sections:
        scene_count = len(section.get('scenes', []))
        start = section.get('startTime', 0)
        end = section.get('endTime', 0)
        duration = section.get('duration', 0)

        print(f"   [{section['id']}] {section.get('name', 'Untitled')}")
        print(f"      ⏱️  {start:.1f}s → {end:.1f}s ({duration:.1f}s) | 🎬 {scene_count} scenes")

    # Resources
    if resources:
        print(f"\n📦 User Resources ({len(resources)}):")
        for res in resources:
            assigned = res.get('assignedToScene', 'N/A')
            print(f"   - {res['type']}: {Path(res['path']).name}")
            if res.get('duration'):
                print(f"     ⏱️  Duration: {res['duration']:.1f}s")
            print(f"     → Assigned: {assigned}")

    return 0


def _read_section(script: Dict, section_id: str) -> int:
    """Print section detail."""
    section = None
    for s in script.get('sections', []):
        if s['id'] == section_id:
            section = s
            break

    if not section:
        print(f"❌ Section not found: {section_id}")
        return 1

    print(f"\n📌 Section: [{section['id']}] {section.get('name', 'Untitled')}")
    print(f"   ⏱️  {section.get('startTime', 0):.1f}s → {section.get('endTime', 0):.1f}s ({section.get('duration', 0):.1f}s)")
    print(f"   🎬 Pace: {section.get('pace', 'medium')}")

    # Title card
    title_card = section.get('titleCard', {})
    if title_card.get('enabled'):
        print(f"   🎨 Title Card: \"{title_card.get('text', '')}\"")

    # Scenes
    scenes = section.get('scenes', [])
    print(f"\n🎬 Scenes ({len(scenes)}):")
    for scene in scenes:
        print(f"\n   [{scene['id']}]")
        print(f"      ⏱️  {scene.get('startTime', 0):.1f}s → {scene.get('endTime', 0):.1f}s ({scene.get('duration', 0):.1f}s)")
        print(f"      💬 Text: \"{scene.get('text', '')[:60]}...\"")
        print(f"      🎤 Voice: {scene.get('voiceNotes', 'N/A')}")

        # Visuals
        visuals = scene.get('visuals', [])
        if visuals:
            print(f"      🎨 Visuals ({len(visuals)}):")
            for i, visual in enumerate(visuals, 1):
                v_type = visual.get('type', 'unknown')
                query = visual.get('query', visual.get('path', 'N/A'))
                print(f"         {i}. {v_type}: {query}")

    return 0


def _read_scene(script: Dict, scene_id: str) -> int:
    """Print scene detail."""
    scene = None
    for section in script.get('sections', []):
        for s in section.get('scenes', []):
            if s['id'] == scene_id:
                scene = s
                break
        if scene:
            break

    if not scene:
        print(f"❌ Scene not found: {scene_id}")
        return 1

    print(f"\n🎬 Scene: [{scene['id']}]")
    print(f"   ⏱️  {scene.get('startTime', 0):.1f}s → {scene.get('endTime', 0):.1f}s ({scene.get('duration', 0):.1f}s)")
    print(f"   💬 Text: \"{scene.get('text', '')}\"")
    print(f"   🎤 Voice Notes: {scene.get('voiceNotes', 'N/A')}")
    print(f"   📝 Visual Description: {scene.get('visualDescription', 'N/A')}")

    # Visuals
    visuals = scene.get('visuals', [])
    if visuals:
        print(f"\n🎨 Visuals ({len(visuals)}):")
        for i, visual in enumerate(visuals, 1):
            print(f"   {i}. Type: {visual.get('type', 'unknown')}")
            print(f"      Query/Path: {visual.get('query', visual.get('path', 'N/A'))}")
            print(f"      Style: {visual.get('style', 'N/A')}")
            if 'duration' in visual:
                print(f"      Duration: {visual['duration']:.1f}s")

    # Title overlay
    title_overlay = scene.get('titleOverlay', {})
    if title_overlay.get('enabled'):
        print(f"\n🎨 Title Overlay: \"{title_overlay.get('text', '')}\"")
        print(f"   Position: {title_overlay.get('position', 'N/A')}")

    return 0


# ============================================================================
# COMMAND: add-section
# ============================================================================

def cmd_add_section(args):
    """Add section to script."""
    print(f"📌 Adding section: {args.id}")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Load voice
        with open(args.voice, 'r', encoding='utf-8') as f:
            voice = json.load(f)

        # Resolve timing using fuzzy matching
        synchronizer = ScriptSynchronizer()
        resolved_text = _resolve_text(args.text, cwd=os.path.dirname(args.script))
        timing = synchronizer.resolve_timing(resolved_text, voice, threshold=75)

        if not timing:
            print(f"⚠️  Warning: Could not resolve timing for section text. Using defaults.")
            timing = {
                'startTime': 0.0,
                'endTime': len(resolved_text.split()) * 0.4,
                'duration': len(resolved_text.split()) * 0.4,
                'score': 0
            }
        else:
            print(f"   ✓ Timing resolved (score: {timing['score']})")

        # Build section
        section = {
            'id': args.id,
            'name': args.name,
            'startTime': timing['startTime'],
            'endTime': timing['endTime'],
            'duration': timing['duration'],
            'pace': args.pace,
            'scenes': []
        }

        # Add to script
        builder = JSONBuilder()
        script = builder.add_section_to_script(script, section)

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Section added!")
        print(f"   ID: {section['id']}")
        print(f"   Name: {section['name']}")
        print(f"   ⏱️  {section['startTime']:.1f}s → {section['endTime']:.1f}s ({section['duration']:.1f}s)")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: add-scenes
# ============================================================================

def cmd_add_scenes(args):
    """Add scenes to section."""
    print(f"🎬 Adding scenes to section: {args.section}")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Load voice
        with open(args.voice, 'r', encoding='utf-8') as f:
            voice = json.load(f)

        # Load scenes definition
        with open(args.scenes_file, 'r', encoding='utf-8') as f:
            scenes_def = json.load(f)

        # Resolve timing for each scene
        synchronizer = ScriptSynchronizer()
        resolved_scenes = []

        for scene in scenes_def:
            text = scene.get('text', '')
            if not text:
                print(f"⚠️  Warning: Scene {scene.get('id', 'unknown')} has no text. Skipping.")
                continue

            timing = synchronizer.resolve_timing(text, voice, threshold=75)

            if not timing:
                print(f"⚠️  Warning: Could not resolve timing for scene {scene['id']}. Using defaults.")
                timing = {
                    'startTime': 0.0,
                    'endTime': len(text.split()) * 0.4,
                    'duration': len(text.split()) * 0.4,
                    'score': 0
                }
            else:
                print(f"   ✓ {scene['id']}: {timing['startTime']:.1f}s → {timing['endTime']:.1f}s (score: {timing['score']})")

            # Build scene
            resolved_scene = {
                'id': scene['id'],
                'startTime': timing['startTime'],
                'endTime': timing['endTime'],
                'duration': timing['duration'],
                'text': text,
                'voiceNotes': scene.get('voiceNotes', 'Normal pace'),
                'visualDescription': scene.get('visualDescription', ''),
                'visuals': scene.get('visuals', []),
                'titleOverlay': scene.get('titleOverlay', {'enabled': False}),
                'resourceCandidates': scene.get('resourceCandidates', []),
                'selectedResourceId': scene.get('selectedResourceId', None)
            }

            resolved_scenes.append(resolved_scene)

        # Add scenes to section
        builder = JSONBuilder()
        script = builder.add_scenes_to_section(script, args.section, resolved_scenes)

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ {len(resolved_scenes)} scenes added to section {args.section}!")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: update-scene
# ============================================================================

def cmd_update_scene(args):
    """Update specific scene."""
    print(f"🎬 Updating scene: {args.scene}")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Build updates dict
        updates = {}

        if args.visual_type:
            visual = {'type': args.visual_type}
            if args.visual_path:
                visual['path'] = args.visual_path
            if args.visual_query:
                visual['query'] = args.visual_query
            if args.visual_style:
                visual['style'] = args.visual_style

            updates['visuals'] = [visual]
        
        if args.text:
            updates['text'] = _resolve_text(args.text, cwd=os.path.dirname(args.script))

        if args.voice_notes:
            updates['voiceNotes'] = args.voice_notes

        # Update scene
        builder = JSONBuilder()
        script = builder.update_scene(script, args.scene, updates)

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"✅ Scene {args.scene} updated!")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: rebuild-section
# ============================================================================

def cmd_rebuild_section(args):
    """Rebuild scenes in section."""
    print(f"🔄 Rebuilding section: {args.section}")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Find section
        section = None
        for s in script.get('sections', []):
            if s['id'] == args.section:
                section = s
                break

        if not section:
            raise ValueError(f"Section not found: {args.section}")

        # Load voice
        with open(args.voice, 'r', encoding='utf-8') as f:
            voice = json.load(f)

        # Load new scenes definition
        with open(args.scenes_file, 'r', encoding='utf-8') as f:
            scenes_def = json.load(f)

        # Resolve timing for each scene
        synchronizer = ScriptSynchronizer()
        resolved_scenes = []

        for scene in scenes_def:
            text = scene.get('text', '')
            if not text:
                continue

            timing = synchronizer.resolve_timing(text, voice, threshold=75)

            if not timing:
                timing = {
                    'startTime': 0.0,
                    'endTime': len(text.split()) * 0.4,
                    'duration': len(text.split()) * 0.4,
                    'score': 0
                }

            resolved_scene = {
                'id': scene['id'],
                'startTime': timing['startTime'],
                'endTime': timing['endTime'],
                'duration': timing['duration'],
                'text': text,
                'voiceNotes': scene.get('voiceNotes', 'Normal pace'),
                'visualDescription': scene.get('visualDescription', ''),
                'visuals': scene.get('visuals', []),
                'titleOverlay': scene.get('titleOverlay', {'enabled': False}),
                'resourceCandidates': scene.get('resourceCandidates', []),
                'selectedResourceId': scene.get('selectedResourceId', None)
            }

            resolved_scenes.append(resolved_scene)

        # Replace scenes in section
        section['scenes'] = resolved_scenes

        # Update section timing
        if resolved_scenes:
            section['startTime'] = min(s.get('startTime', 0) for s in resolved_scenes)
            section['endTime'] = max(s.get('endTime', 0) for s in resolved_scenes)
            section['duration'] = section['endTime'] - section['startTime']

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Section {args.section} rebuilt with {len(resolved_scenes)} scenes!")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: sync
# ============================================================================

def cmd_sync(args):
    """Sync all timing with voice."""
    print(f"🔄 Syncing script with voice...")

    try:
        # Load files
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        with open(args.voice, 'r', encoding='utf-8') as f:
            voice = json.load(f)

        # Run sync
        synchronizer = ScriptSynchronizer()
        updated_script = synchronizer.sync_script(script, voice)

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(updated_script, f, indent=2, ensure_ascii=False)

        duration = updated_script['metadata']['duration']
        print(f"\n✅ Synced successfully!")
        print(f"   Total Duration: {duration}s")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: merge-resources
# ============================================================================

def cmd_merge_resources(args):
    """Merge resources.json into script.json."""
    print(f"📦 Merging resources...")

    try:
        # Find script.json and resources.json in project dir
        project_path = Path(args.project_dir)
        script_file = project_path / 'script.json'
        resources_file = project_path / 'resources.json'

        if not script_file.exists():
            raise FileNotFoundError(f"script.json not found in {args.project_dir}")

        if not resources_file.exists():
            raise FileNotFoundError(f"resources.json not found in {args.project_dir}")

        # Load files
        with open(script_file, 'r', encoding='utf-8') as f:
            script = json.load(f)

        with open(resources_file, 'r', encoding='utf-8') as f:
            resources = json.load(f)


        # Merge logic: Update resourceCandidates for each scene
        merged_count = 0

        # Helper function to convert absolute path to relative
        def to_relative_path(abs_path: str, base_dir: Path) -> str:
            """Convert absolute path to relative path from project directory"""
            if not abs_path:
                return abs_path
            try:
                abs_path_obj = Path(abs_path)
                if abs_path_obj.is_absolute():
                    # Resolve base_dir to absolute path
                    base_dir_resolved = base_dir.resolve()
                    return str(abs_path_obj.relative_to(base_dir_resolved))
                return abs_path
            except (ValueError, Exception):
                # If path is not under base_dir or any error, return as-is
                return abs_path

        for section in script.get('sections', []):
            for scene in section.get('scenes', []):
                scene_id = scene['id']

                # Find resources for this scene
                candidates = []

                # Search in videos
                for video_group in resources.get('resources', {}).get('videos', []):
                    if video_group.get('sceneId') == scene_id:
                        for result in video_group.get('results', []):
                            if result.get('localPath'):
                                candidates.append({
                                    'id': result.get('id'),
                                    'type': 'video',
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(result['localPath'], project_path),
                                    'duration': result.get('duration'),
                                    'resolution': f"{result.get('width', 0)}x{result.get('height', 0)}"
                                })

                # Search in images
                for image_group in resources.get('resources', {}).get('images', []):
                    if image_group.get('sceneId') == scene_id:
                        for result in image_group.get('results', []):
                            if result.get('localPath'):
                                candidates.append({
                                    'id': result.get('id'),
                                    'type': 'image',
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(result['localPath'], project_path),
                                    'resolution': f"{result.get('width', 0)}x{result.get('height', 0)}"
                                })

                if candidates:
                    scene['resourceCandidates'] = candidates
                    merged_count += 1

        # Merge music resources
        music_merged = 0
        music_resources = resources.get('resources', {}).get('music', [])
        
        if music_resources and 'music' in script:
            # Collect all music candidates
            music_candidates = []
            
            for music_group in music_resources:
                for result in music_group.get('results', []):
                    if result.get('localPath') or result.get('downloadUrl'):
                        music_candidates.append({
                            'id': result.get('id'),
                            'title': result.get('title', 'Unknown'),
                            'url': result.get('url'),
                            'localPath': to_relative_path(result.get('localPath'), project_path) if result.get('localPath') else None,
                            'downloadUrl': result.get('downloadUrl'),
                            'duration': result.get('duration'),
                            'genre': result.get('genre'),
                            'tags': result.get('tags', [])
                        })
            
            if music_candidates:
                script['music']['candidates'] = music_candidates
                music_merged = len(music_candidates)

        # Save updated script
        with open(script_file, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Resources merged!")
        print(f"   Updated {merged_count} scenes with resource candidates")
        if music_merged > 0:
            print(f"   Added {music_merged} music candidates")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: update-voice
# ============================================================================

def cmd_update_voice(args):
    """Update voice configuration in script."""
    print(f"🎙️  Updating voice config...")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Ensure voice dict exists
        if 'voice' not in script:
            script['voice'] = {}

        # Update fields
        if args.provider:
            script['voice']['provider'] = args.provider
        if args.voice_id:
            script['voice']['voiceId'] = args.voice_id
        if args.speed:
            script['voice']['speed'] = float(args.speed)
        if args.audio_path:
            script['voice']['audioPath'] = args.audio_path

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Voice config updated!")
        print(f"   Provider: {script['voice'].get('provider', 'N/A')}")
        print(f"   Voice ID: {script['voice'].get('voiceId', 'N/A')}")
        print(f"   Audio Path: {script['voice'].get('audioPath', 'N/A')}")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Video Script Generator CLI (Unified)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # ========== init ==========
    init_parser = subparsers.add_parser('init', help='Initialize project')
    init_parser.add_argument('--project', required=True, help='Project directory')
    init_parser.add_argument('--description', required=True, help='Video description')
    init_parser.add_argument('--text', required=True, help='Full narration text')
    init_parser.add_argument('--ratio', default='9:16', help='Aspect ratio (9:16, 16:9, 1:1, 4:5)')
    init_parser.add_argument('--resources', nargs='*', help='Resource file paths (video, audio, image)')

    # ========== read ==========
    read_parser = subparsers.add_parser('read', help='Read script')
    read_parser.add_argument('--script', required=True, help='Path to script.json')
    read_parser.add_argument('--section', help='Section ID to read in detail')
    read_parser.add_argument('--scene', help='Scene ID to read in detail')

    # ========== add-section ==========
    add_section_parser = subparsers.add_parser('add-section', help='Add section')
    add_section_parser.add_argument('--script', required=True, help='Path to script.json')
    add_section_parser.add_argument('--voice', required=True, help='Path to voice.json')
    add_section_parser.add_argument('--id', required=True, help='Section ID')
    add_section_parser.add_argument('--name', required=True, help='Section name')
    add_section_parser.add_argument('--text', required=True, help='Section text')
    add_section_parser.add_argument('--pace', default='medium', help='Pace (slow, medium, fast)')

    # ========== add-scenes ==========
    add_scenes_parser = subparsers.add_parser('add-scenes', help='Add scenes to section')
    add_scenes_parser.add_argument('--script', required=True, help='Path to script.json')
    add_scenes_parser.add_argument('--voice', required=True, help='Path to voice.json')
    add_scenes_parser.add_argument('--section', required=True, help='Section ID')
    add_scenes_parser.add_argument('--scenes-file', required=True, help='Path to scenes definition JSON')

    # ========== update-scene ==========
    update_scene_parser = subparsers.add_parser('update-scene', help='Update scene')
    update_scene_parser.add_argument('--script', required=True, help='Path to script.json')
    update_scene_parser.add_argument('--scene', required=True, help='Scene ID')
    update_scene_parser.add_argument('--visual-type', help='Visual type (stock, pinned, ai-generated)')
    update_scene_parser.add_argument('--visual-path', help='Visual file path (for pinned)')
    update_scene_parser.add_argument('--visual-query', help='Visual search query (for stock/ai)')
    update_scene_parser.add_argument('--visual-style', help='Visual style (zoom-in, ken-burns, slide)')
    update_scene_parser.add_argument('--text', help='Scene text')
    update_scene_parser.add_argument('--voice-notes', help='Voice notes')

    # ========== rebuild-section ==========
    rebuild_section_parser = subparsers.add_parser('rebuild-section', help='Rebuild section scenes')
    rebuild_section_parser.add_argument('--script', required=True, help='Path to script.json')
    rebuild_section_parser.add_argument('--voice', required=True, help='Path to voice.json')
    rebuild_section_parser.add_argument('--section', required=True, help='Section ID')
    rebuild_section_parser.add_argument('--scenes-file', required=True, help='Path to new scenes definition JSON')

    # ========== sync ==========
    sync_parser = subparsers.add_parser('sync', help='Sync timing with voice')
    sync_parser.add_argument('--script', required=True, help='Path to script.json')
    sync_parser.add_argument('--voice', required=True, help='Path to voice.json')

    # ========== merge-resources ==========
    merge_parser = subparsers.add_parser('merge-resources', help='Merge resources.json into script.json')
    merge_parser.add_argument('--project-dir', required=True, help='Project directory path')

    # ========== update-voice ==========
    update_voice_parser = subparsers.add_parser('update-voice', help='Update voice config')
    update_voice_parser.add_argument('--script', required=True, help='Path to script.json')
    update_voice_parser.add_argument('--provider', help='Voice provider')
    update_voice_parser.add_argument('--voice-id', help='Voice ID')
    update_voice_parser.add_argument('--speed', help='Voice speed')
    update_voice_parser.add_argument('--audio-path', help='Audio file path relative to project')

    # Parse args
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Route to command handlers
    commands = {
        'init': cmd_init,
        'read': cmd_read,
        'add-section': cmd_add_section,
        'add-scenes': cmd_add_scenes,
        'update-scene': cmd_update_scene,
        'rebuild-section': cmd_rebuild_section,
        'sync': cmd_sync,
        'merge-resources': cmd_merge_resources,
        'update-voice': cmd_update_voice
    }

    handler = commands.get(args.command)
    if handler:
        return handler(args)
    else:
        print(f"❌ Unknown command: {args.command}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
