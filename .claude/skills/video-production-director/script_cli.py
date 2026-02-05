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
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

from utils.project_initializer import ProjectInitializer
from utils.json_builder import JSONBuilder
from utils.synchronizer import ScriptSynchronizer
from utils.status_manager import StatusManager
import os

def _get_default_voice_id(provider: str) -> str:
    """Get default voice ID for provider."""
    defaults = {
        'openai': 'alloy',
        'elevenlabs': 'EXAVITQu4vr4xnSDxMaL',  # Default voice
        'vbee': 'hn_male_xuantin_news_48k-fhg',
        'gemini': 'en-US-Journey-D'
    }
    return defaults.get(provider, 'alloy')

def _get_voice_model(provider: str) -> str:
    """Get voice model for provider."""
    models = {
        'openai': 'tts-1',
        'elevenlabs': 'eleven_multilingual_v2',
        'vbee': 'default',
        'gemini': 'default'
    }
    return models.get(provider, 'tts-1')

def _resolve_text(text: Optional[str] = None, text_path: Optional[str] = None, cwd: Optional[str] = None) -> str:
    """
    Resolve text from either direct string or file path.
    
    Args:
        text: Direct text content.
        text_path: Path to a text file.
        cwd: Optional directory to resolve relative paths against.
    """
    # 1. If text_path is provided, prioritize it
    if text_path:
        path_obj = Path(text_path)
        if cwd and not path_obj.is_absolute():
            potential_path = Path(cwd) / text_path
            if potential_path.is_file():
                path_obj = potential_path
        
        if path_obj.is_file():
            try:
                with open(path_obj, 'r', encoding='utf-8') as f:
                    return f.read().strip()
            except Exception as e:
                print(f"⚠️  Could not read text file {path_obj}: {e}")
                raise
        else:
            raise FileNotFoundError(f"❌ Text path file not found: {text_path}")

    # 2. If direct text is provided, validate length
    if text:
        # Safety check for long strings in CLI
        if len(text) > 200:
            raise ValueError(
                f"❌ The provided text is too long ({len(text)} chars) to be passed directly via --text.\n"
                f"To avoid terminal hang and shell parsing errors, please use --text-path instead.\n"
                f"Example: --text-path \"public/projects/my-video/raw_script.txt\""
            )
        return text

    return ""


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
        full_text = _resolve_text(text=args.text, text_path=args.text_path, cwd=args.project)
        if not full_text:
            raise ValueError("❌ No text content provided. Use --text or --text-path")

        summary = initializer.create_initial_script(
            project_dir=args.project,
            description=args.description,
            full_text=full_text,
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
        # Save raw script file if provided via text or copy if provided via path
        text_source = args.text_path or args.text
        if text_source and os.path.exists(text_source) and os.path.isfile(text_source):
            try:
                import shutil
                project_path = Path(args.project)
                dest_path = project_path / 'raw_script.txt'

                # Check if source and destination are the same file
                if os.path.abspath(text_source) != os.path.abspath(str(dest_path)):
                    shutil.copy2(text_source, dest_path)
                    print(f"   📄 Raw Script Saved: {dest_path}")
                else:
                    print(f"   📄 Raw Script: {dest_path} (already exists)")
            except Exception as e:
                print(f"⚠️  Could not save raw script: {e}")
        elif args.text: # If provided as direct text, save it to raw_script.txt
            try:
                project_path = Path(args.project)
                dest_path = project_path / 'raw_script.txt'
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(args.text)
                print(f"   📄 Raw Script Saved from text: {dest_path}")
            except Exception as e:
                print(f"⚠️  Could not save raw script from text: {e}")

        # Save voice configuration
        project_path = Path(args.project)
        voice_config = {
            'provider': args.voice_provider,
            'voiceId': args.voice_id or _get_default_voice_id(args.voice_provider),
            'emotion': args.voice_emotion,
            'speed': args.voice_speed,
            'model': _get_voice_model(args.voice_provider)
        }
        voice_config_path = project_path / 'voice-config.json'
        try:
            with open(voice_config_path, 'w', encoding='utf-8') as f:
                json.dump(voice_config, f, indent=2, ensure_ascii=False)
            print(f"\n🎤 Voice Configuration:")
            print(f"   Provider: {voice_config['provider']}")
            print(f"   Voice ID: {voice_config['voiceId']}")
            print(f"   Emotion: {voice_config['emotion']}")
            print(f"   Speed: {voice_config['speed']}x")
        except Exception as e:
            print(f"⚠️  Could not save voice config: {e}")

        # Save music configuration
        music_config = {
            'genre': args.music_genre or 'upbeat',
            'mood': args.music_mood or 'energetic',
            'query': args.music_query or f"{args.music_genre or 'upbeat'} {args.music_mood or 'energetic'} background music",
            'volume': args.music_volume,
            'fadeIn': 2.0,
            'fadeOut': 3.0
        }
        music_config_path = project_path / 'music-config.json'
        try:
            with open(music_config_path, 'w', encoding='utf-8') as f:
                json.dump(music_config, f, indent=2, ensure_ascii=False)
            print(f"\n🎵 Music Configuration:")
            print(f"   Genre: {music_config['genre']}")
            print(f"   Mood: {music_config['mood']}")
            print(f"   Query: {music_config['query']}")
            print(f"   Volume: {music_config['volume']}")
        except Exception as e:
            print(f"⚠️  Could not save music config: {e}")

        # Automate project list update
        _update_project_list()

        # Update status
        status_manager = StatusManager(args.project)
        status_manager.complete_step("script_created", f"Init project: {summary['projectName']}")
        print(f"\n📊 Status: {status_manager.get_current_step_name()}")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def _update_project_list():
    """Run npm run prestart to update the project list."""
    print(f"\n🔄 Updating project list...")
    try:
        # Resolve the root directory (assuming script is in .claude/skills/video-production-director/)
        root_dir = Path(__file__).resolve().parent.parent.parent.parent
        subprocess.run(["npm", "run", "prestart"], cwd=str(root_dir), check=False)
    except Exception as e:
        print(f"⚠️  Could not update project list: {e}")


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

        # Load voice (OPTIONAL - may not exist yet in new workflow)
        voice = None
        if args.voice and os.path.exists(args.voice):
            try:
                with open(args.voice, 'r', encoding='utf-8') as f:
                    voice = json.load(f)
                print(f"   ✓ Voice file loaded: {args.voice}")
            except Exception as e:
                print(f"   ⚠️  Could not load voice file: {e}")

        # Resolve timing using fuzzy matching (ONLY if voice available)
        synchronizer = ScriptSynchronizer()
        resolved_text = _resolve_text(text=args.text, text_path=args.text_path, cwd=os.path.dirname(args.script))

        if not resolved_text:
            raise ValueError("❌ No text content provided for section. Use --text or --text-path")

        timing = None
        if voice:
            timing = synchronizer.resolve_timing(resolved_text, voice, threshold=75)
            if timing:
                print(f"   ✓ Timing resolved from voice (score: {timing['score']})")

        if not timing:
            if voice:
                print(f"⚠️  Warning: Could not resolve timing from voice. Using defaults.")
            else:
                print(f"ℹ️  No voice file provided. Using default timing (will sync later).")
            timing = {
                'startTime': 0.0,
                'endTime': len(resolved_text.split()) * 0.4,
                'duration': len(resolved_text.split()) * 0.4,
                'score': 0
            }

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

        # Update status
        project_dir = Path(args.script).parent
        status_manager = StatusManager(str(project_dir))
        status_manager.complete_step("structure_created", f"Add section: {section['id']}")

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

        # Load voice (OPTIONAL - may not exist yet in new workflow)
        voice = None
        if args.voice and os.path.exists(args.voice):
            try:
                with open(args.voice, 'r', encoding='utf-8') as f:
                    voice = json.load(f)
                print(f"   ✓ Voice file loaded: {args.voice}")
            except Exception as e:
                print(f"   ⚠️  Could not load voice file: {e}")

        # Load scenes definition
        with open(args.scenes_file, 'r', encoding='utf-8') as f:
            scenes_def = json.load(f)

        # Resolve timing for each scene (ONLY if voice available)
        synchronizer = ScriptSynchronizer()
        resolved_scenes = []

        for scene in scenes_def:
            text = scene.get('text', '')
            if not text:
                print(f"⚠️  Warning: Scene {scene.get('id', 'unknown')} has no text. Skipping.")
                continue

            timing = None
            if voice:
                timing = synchronizer.resolve_timing(text, voice, threshold=75)
                if timing:
                    print(f"   ✓ {scene['id']}: {timing['startTime']:.1f}s → {timing['endTime']:.1f}s (score: {timing['score']})")

            if not timing:
                if voice:
                    print(f"⚠️  Warning: Could not resolve timing for scene {scene['id']}. Using defaults.")
                timing = {
                    'startTime': 0.0,
                    'endTime': len(text.split()) * 0.4,
                    'duration': len(text.split()) * 0.4,
                    'score': 0
                }

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

        # Update status
        project_dir = Path(args.script).parent
        status_manager = StatusManager(str(project_dir))
        status_manager.complete_step("structure_created", f"Add {len(resolved_scenes)} scenes to {args.section}")

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
        
        if args.text or args.text_path:
            updates['text'] = _resolve_text(text=args.text, text_path=args.text_path, cwd=os.path.dirname(args.script))

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

        # Update status
        project_dir = Path(args.script).parent
        status_manager = StatusManager(str(project_dir))
        status_manager.complete_step("timing_synced", f"Sync timing: {duration}s")
        print(f"📊 Status: {status_manager.get_current_step_name()}")

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
        def to_relative_path(path_str: str, base_dir: Path) -> str:
            """Ensure path is absolute and resolved for consistent processing"""
            if not path_str:
                return path_str
            try:
                path_obj = Path(path_str)
                if not path_obj.is_absolute():
                    path_obj = (base_dir / path_obj).resolve()
                else:
                    path_obj = path_obj.resolve()
                return str(path_obj)
            except (ValueError, Exception):
                return path_str

        for section in script.get('sections', []):
            for scene in section.get('scenes', []):
                scene_id = scene['id']

                # Find resources for this scene
                candidates = []

                # Search in videos
                for video_group in resources.get('resources', {}).get('videos', []):
                    if video_group.get('sceneId') == scene_id:
                        for result in video_group.get('results', []):
                            local_path = result.get('importedPath') or result.get('localPath')
                            if local_path:
                                candidate = {
                                    'id': result.get('id'),
                                    'type': 'video',
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(local_path, project_path),
                                    'duration': result.get('duration'),
                                    'resolution': f"{result.get('width', 0)}x{result.get('height', 0)}"
                                }
                                candidates.append(candidate)
                                if result.get('selected'):
                                    scene['selectedResourceId'] = candidate['id']

                # Search in images
                for image_group in resources.get('resources', {}).get('images', []):
                    if image_group.get('sceneId') == scene_id:
                        for result in image_group.get('results', []):
                            local_path = result.get('importedPath') or result.get('localPath')
                            if local_path:
                                candidate = {
                                    'id': result.get('id'),
                                    'type': 'image',
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(local_path, project_path),
                                    'resolution': f"{result.get('width', 0)}x{result.get('height', 0)}"
                                }
                                candidates.append(candidate)
                                if result.get('selected'):
                                    scene['selectedResourceId'] = candidate['id']
                                    if 'selectedResourceIds' not in scene:
                                        scene['selectedResourceIds'] = []
                                    if candidate['id'] not in scene['selectedResourceIds']:
                                        scene['selectedResourceIds'].append(candidate['id'])

                # Search in generatedImages
                for gen_group in resources.get('resources', {}).get('generatedImages', []):
                    if gen_group.get('sceneId') == scene_id:
                        for result in gen_group.get('results', []):
                            local_path = result.get('importedPath') or result.get('localPath')
                            if local_path:
                                candidate = {
                                    'id': result.get('id'),
                                    'type': 'image',
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(local_path, project_path),
                                    'generated': True
                                }
                                candidates.append(candidate)
                                if result.get('selected'):
                                    scene['selectedResourceId'] = candidate['id']
                                    if 'selectedResourceIds' not in scene:
                                        scene['selectedResourceIds'] = []
                                    if candidate['id'] not in scene['selectedResourceIds']:
                                        scene['selectedResourceIds'].append(candidate['id'])

                # Search in pinnedResources
                for pinned_group in resources.get('resources', {}).get('pinnedResources', []):
                    if pinned_group.get('sceneId') == scene_id:
                        for result in pinned_group.get('results', []):
                            local_path = result.get('importedPath') or result.get('localPath')
                            if local_path:
                                candidate = {
                                    'id': result.get('id'),
                                    'type': result.get('mediaType', 'image'),
                                    'url': result.get('url'),
                                    'localPath': to_relative_path(local_path, project_path),
                                    'pinned': True
                                }
                                candidates.append(candidate)
                                if result.get('selected'):
                                    scene['selectedResourceId'] = candidate['id']
                                    if 'selectedResourceIds' not in scene:
                                        scene['selectedResourceIds'] = []
                                    if candidate['id'] not in scene['selectedResourceIds']:
                                        scene['selectedResourceIds'].append(candidate['id'])

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

        # Update status
        status_manager = StatusManager(args.project_dir)
        status_manager.complete_step("resources_found", f"Merged {merged_count} resources")

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


# ============================================================================
# COMMAND: status
# ============================================================================

def cmd_status(args):
    """Show project status."""
    try:
        status_manager = StatusManager(args.project)
        print(status_manager.get_status_summary())
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


# ============================================================================
# COMMAND: confirm-text
# ============================================================================

def cmd_confirm_text(args):
    """Mark text as confirmed by user (Checkpoint 1)."""
    try:
        status_manager = StatusManager(args.project)
        status_manager.complete_step("text_confirmed", "User confirmed script text")
        print(f"✅ Text confirmed!")
        print(f"📊 Status: {status_manager.get_current_step_name()}")
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


# ============================================================================
# COMMAND: rollback
# ============================================================================

def cmd_rollback(args):
    """Rollback project to a previous step."""
    try:
        status_manager = StatusManager(args.project)

        # Check for warning
        if status_manager.should_warn_rebuild(args.step):
            print(status_manager.get_rebuild_warning_message())
            if not args.force:
                print("\n❌ Cancelled. Use --force to override.")
                return 1
            print("\n⚠️ Force mode enabled. Proceeding...")

        status_manager.rollback_to_step(args.step)
        print(f"✅ Rolled back to: {args.step}")
        print(status_manager.get_status_summary())
        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
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
# COMMAND: update-music
# ============================================================================

def cmd_update_music(args):
    """Update music configuration in script."""
    print(f"🎵 Updating music config...")

    try:
        # Load script
        with open(args.script, 'r', encoding='utf-8') as f:
            script = json.load(f)

        # Ensure music dict exists
        if 'music' not in script:
            script['music'] = {}

        # Update fields
        if args.mood:
            script['music']['mood'] = args.mood
        if args.query:
            script['music']['query'] = args.query
        if args.volume is not None:
            script['music']['volume'] = args.volume
        if args.fade_in is not None:
            script['music']['fadeIn'] = args.fade_in
        if args.fade_out is not None:
            script['music']['fadeOut'] = args.fade_out

        # Save
        with open(args.script, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Music config updated!")
        print(f"   Mood: {script['music'].get('mood', 'N/A')}")
        print(f"   Query: {script['music'].get('query', 'N/A')}")
        print(f"   Volume: {script['music'].get('volume', 'N/A')}")
        print(f"   Fade In: {script['music'].get('fadeIn', 'N/A')}s")
        print(f"   Fade Out: {script['music'].get('fadeOut', 'N/A')}s")

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
    init_parser.add_argument('--text', help='Full narration text (short strings)')
    init_parser.add_argument('--text-path', help='Path to full narration text file (recommended)')
    init_parser.add_argument('--ratio', default='9:16', help='Aspect ratio (9:16, 16:9, 1:1, 4:5)')
    init_parser.add_argument('--resources', nargs='*', help='Resource file paths (video, audio, image)')

    # Voice configuration (agent should choose based on content tone)
    init_parser.add_argument('--voice-provider', default='openai',
                            help='Voice provider: openai|elevenlabs|vbee|gemini (default: openai)')
    init_parser.add_argument('--voice-id',
                            help='Voice ID (e.g., alloy, echo, nova for OpenAI)')
    init_parser.add_argument('--voice-emotion', default='neutral',
                            help='Voice emotion: neutral|happy|sad|angry|excited (default: neutral)')
    init_parser.add_argument('--voice-speed', type=float, default=1.0,
                            help='Voice speed multiplier (default: 1.0)')

    # Music configuration (agent should choose based on video mood)
    init_parser.add_argument('--music-genre',
                            help='Music genre: upbeat|cinematic|chill|corporate|dramatic')
    init_parser.add_argument('--music-mood',
                            help='Music mood: energetic|calm|inspiring|mysterious|happy')
    init_parser.add_argument('--music-query',
                            help='Music search query (custom, overrides genre/mood)')
    init_parser.add_argument('--music-volume', type=float, default=0.3,
                            help='Music volume (0.0-1.0, default: 0.3)')

    # ========== read ==========
    read_parser = subparsers.add_parser('read', help='Read script')
    read_parser.add_argument('--script', required=True, help='Path to script.json')
    read_parser.add_argument('--section', help='Section ID to read in detail')
    read_parser.add_argument('--scene', help='Scene ID to read in detail')

    # ========== add-section ==========
    add_section_parser = subparsers.add_parser('add-section', help='Add section')
    add_section_parser.add_argument('--script', required=True, help='Path to script.json')
    add_section_parser.add_argument('--voice', required=False, help='Path to voice.json (optional, for timing resolution)')
    add_section_parser.add_argument('--id', required=True, help='Section ID')
    add_section_parser.add_argument('--name', required=True, help='Section name')
    add_section_parser.add_argument('--text', help='Section text (short strings)')
    add_section_parser.add_argument('--text-path', help='Path to section text file (recommended)')
    add_section_parser.add_argument('--pace', default='medium', help='Pace (slow, medium, fast)')

    # ========== add-scenes ==========
    add_scenes_parser = subparsers.add_parser('add-scenes', help='Add scenes to section')
    add_scenes_parser.add_argument('--script', required=True, help='Path to script.json')
    add_scenes_parser.add_argument('--voice', required=False, help='Path to voice.json (optional, for timing resolution)')
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
    update_scene_parser.add_argument('--text', help='Scene text (short strings)')
    update_scene_parser.add_argument('--text-path', help='Path to scene text file')
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

    # ========== update-music ==========
    update_music_parser = subparsers.add_parser('update-music', help='Update music config')
    update_music_parser.add_argument('--script', required=True, help='Path to script.json')
    update_music_parser.add_argument('--mood', help='Music mood (calm, epic, happy, sad, inspiring, etc.)')
    update_music_parser.add_argument('--query', help='Music search query (e.g., "epic cinematic orchestral")')
    update_music_parser.add_argument('--volume', type=float, help='Music volume (0.0 - 1.0)')
    update_music_parser.add_argument('--fade-in', type=float, help='Fade in duration (seconds)')
    update_music_parser.add_argument('--fade-out', type=float, help='Fade out duration (seconds)')

    # ========== status ==========
    status_parser = subparsers.add_parser('status', help='Show project status')
    status_parser.add_argument('--project', required=True, help='Project directory')

    # ========== confirm-text ==========
    confirm_text_parser = subparsers.add_parser('confirm-text', help='Mark text as confirmed (Checkpoint 1)')
    confirm_text_parser.add_argument('--project', required=True, help='Project directory')

    # ========== rollback ==========
    rollback_parser = subparsers.add_parser('rollback', help='Rollback to a previous step')
    rollback_parser.add_argument('--project', required=True, help='Project directory')
    rollback_parser.add_argument('--step', required=True, help='Step to rollback to')
    rollback_parser.add_argument('--force', action='store_true', help='Force rollback even with OTIO edits')

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
        'update-voice': cmd_update_voice,
        'update-music': cmd_update_music,
        'status': cmd_status,
        'confirm-text': cmd_confirm_text,
        'rollback': cmd_rollback
    }

    handler = commands.get(args.command)
    if handler:
        return handler(args)
    else:
        print(f"❌ Unknown command: {args.command}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
