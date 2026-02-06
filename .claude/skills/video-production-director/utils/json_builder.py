"""
JSON BUILDER
Build final JSON output theo schema chuẩn
"""

from typing import Dict, List, Optional
from datetime import datetime
import json
import os
from pathlib import Path

# Load .env file from project root
try:
    from dotenv import load_dotenv
    # Find project root: utils/ -> video-script-generator/ -> skills/ -> .claude/ -> project/
    current_dir = Path(__file__).resolve().parent  # utils/
    skill_root = current_dir.parent  # video-script-generator/
    skills_dir = skill_root.parent  # skills/
    claude_dir = skills_dir.parent  # .claude/
    project_root = claude_dir.parent  # project root
    env_path = project_root / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    # dotenv not installed, skip
    pass

class JSONBuilder:
    def __init__(self):
        self.schema_version = "1.0"

    # ============================================================================
    # UNIFIED METHODS (New unified video type)
    # ============================================================================

    def build_unified_json(
        self,
        topic: str,
        description: str,
        full_text: str,
        ratio: str = '9:16',
        user_resources: List[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Build JSON for unified video type (new architecture).

        Unified type uses sections/scenes structure without video_type-specific configs.

        Args:
            topic: Video topic (used as projectName)
            description: User description
            full_text: Full narration text
            ratio: Aspect ratio (9:16, 16:9, 1:1, 4:5)
            user_resources: List of user resource dicts from project_initializer
            metadata: Optional extra metadata

        Returns:
            Complete script.json dict for unified type
        """
        metadata_dict = metadata or {}

        # Clean project name
        project_name = self._clean_project_name(topic)

        # Calculate dimensions
        ratio_dimensions = {
            "9:16": (1080, 1920),
            "16:9": (1920, 1080),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350)
        }
        width, height = ratio_dimensions.get(ratio, (1080, 1920))

        # Build metadata
        metadata_section = {
            'projectName': project_name,
            'videoType': 'unified',
            'description': description,
            'duration': None,  # Will be set after sync
            'ratio': ratio,
            'width': width,
            'height': height,
            'platform': metadata_dict.get('platform', 'shorts'),
            'createdAt': datetime.now().isoformat()
        }

        # Build script section
        script_section = {
            'fullText': full_text,
            'wordCount': len(full_text.split()),
            'estimatedDuration': None  # Will be calculated after voice
        }

        # Voice config (unified - single default, provider auto-detected)
        voice_section = self._build_unified_voice_config(metadata_dict)

        # Music config (unified - single default)
        music_section = {
            'enabled': True,
            'mood': metadata_dict.get('musicMood', 'calm'),
            'query': metadata_dict.get('musicQuery', 'calm background music'),
            'volume': metadata_dict.get('musicVolume', 0.15),
            'fadeIn': 2,
            'fadeOut': 3
        }

        # Subtitle config (unified - single default)
        subtitle_section = {
            'enabled': True,
            'style': 'highlight-word',
            'position': 'center',
            'font': 'Montserrat',
            'fontSize': 48,
            'highlightColor': '#FFD700'
        }

        return {
            'metadata': metadata_section,
            'script': script_section,
            'userResources': user_resources or [],
            'sections': [],  # Empty initially, populated by CLI add-section
            'voice': voice_section,
            'music': music_section,
            'subtitle': subtitle_section
        }

    def _build_unified_voice_config(self, metadata: Dict) -> Dict:
        """
        Build voice config for unified type with smart provider selection.

        Priority: Gemini > ElevenLabs > Vbee > OpenAI
        """
        import os

        # Check available providers
        has_gemini = bool(os.getenv('GEMINI_API_KEY'))
        has_elevenlabs = bool(os.getenv('ELEVENLABS_API_KEY'))
        has_vbee = bool(os.getenv('VBEE_API_KEY'))

        # Select provider
        if has_gemini:
            provider = 'gemini'
            voice_id = 'Charon'  # Default Gemini voice (deep, professional)
        elif has_elevenlabs:
            provider = 'elevenlabs'
            voice_id = 'pNInz6obpgDQGcFmaJgB'  # Adam
        elif has_vbee:
            provider = 'vbee'
            voice_id = 'hn_male_manh_dung_news_48k-h'
        else:
            provider = 'openai'
            voice_id = 'onyx'

        voice_config = {
            'provider': provider,
            'voiceId': voice_id,
            'speed': 1.0
        }

        # Add audioPath if provided
        if 'audioPath' in metadata:
            voice_config['audioPath'] = metadata['audioPath']

        return voice_config

    def add_section_to_script(self, script_data: Dict, section: Dict) -> Dict:
        """
        Add section to script.json.

        Args:
            script_data: Loaded script.json dict
            section: Section dict with id, name, startTime, endTime, duration, pace, scenes

        Returns:
            Updated script_data
        """
        if 'sections' not in script_data:
            script_data['sections'] = []

        script_data['sections'].append(section)

        # Update total duration if needed
        last_section_end = max(s.get('endTime', 0) for s in script_data['sections'])
        if script_data['metadata']['duration'] is None or last_section_end > script_data['metadata']['duration']:
            script_data['metadata']['duration'] = last_section_end

        return script_data

    def add_scenes_to_section(self, script_data: Dict, section_id: str, scenes: List[Dict]) -> Dict:
        """
        Add scenes to a specific section.

        Args:
            script_data: Loaded script.json dict
            section_id: Section ID to add scenes to
            scenes: List of scene dicts

        Returns:
            Updated script_data

        Raises:
            ValueError: If section not found
        """
        # Find section
        section = None
        for s in script_data.get('sections', []):
            if s['id'] == section_id:
                section = s
                break

        if not section:
            raise ValueError(f"Section not found: {section_id}")

        # Add scenes
        if 'scenes' not in section:
            section['scenes'] = []

        section['scenes'].extend(scenes)

        # Update section timing
        if scenes:
            section['startTime'] = min(scene.get('startTime', 0) for scene in section['scenes'])
            section['endTime'] = max(scene.get('endTime', 0) for scene in section['scenes'])
            section['duration'] = section['endTime'] - section['startTime']

        return script_data

    def update_scene(self, script_data: Dict, scene_id: str, updates: Dict) -> Dict:
        """
        Update a specific scene in script.json.

        Args:
            script_data: Loaded script.json dict
            scene_id: Scene ID to update
            updates: Dict of fields to update

        Returns:
            Updated script_data

        Raises:
            ValueError: If scene not found
        """
        # Find scene
        found = False
        for section in script_data.get('sections', []):
            for scene in section.get('scenes', []):
                if scene['id'] == scene_id:
                    # Update scene
                    scene.update(updates)
                    found = True
                    break
            if found:
                break

        if not found:
            raise ValueError(f"Scene not found: {scene_id}")

        return script_data
    
    def build_project_json(
        self,
        topic: str = None,
        video_type: str = 'facts',
        duration: int = None,
        scenes: List[Dict] = None,
        sections: List[Dict] = None,
        script_text: str = '',
        metadata: Optional[Dict] = None,
        quality_metrics: Optional[Dict] = None,
        # NEW: Multi-video-edit specific params
        source_videos: Optional[List[Dict]] = None,
        transcript: Optional[Dict] = None
    ) -> Dict:
        """
        Build complete project JSON
        
        Supports both:
        1. Traditional video types (facts, listicle, etc.) - AI-generated content
        2. Multi-video-edit - User-provided videos with AI analysis
        
        For multi-video-edit:
          - source_videos: List of {id, path, duration, audioPath, hasAudio, metadata}
          - transcript: {fullText, timestamps, language, provider}
          - scenes: List with titleCard, brollSuggestions, sourceVideoId
        """
        metadata_dict = metadata or {}
        
        # Multi-video-edit mode
        if video_type == 'multi-video-edit':
            return self._build_multi_video_edit_json(
                topic=topic or metadata_dict.get('projectName', 'untitled'),
                source_videos=source_videos or [],
                transcript=transcript or {},
                scenes=scenes or [],
                metadata=metadata_dict
            )
        
        # Traditional mode (AI-generated content)
        # Clean project name from topic
        project_name = self._clean_project_name(topic)
        
        # Calculate word count
        word_count = len(script_text.split())
        estimated_duration = self._estimate_duration(word_count, video_type)
        reading_speed = int(word_count * 60 / duration) if duration and duration > 0 else 0
        
        # Build metadata section
        metadata_section = self._build_metadata(
            project_name,
            video_type,
            duration,
            metadata_dict
        )
        
        # Build script section
        script_section = {
            'fullText': script_text,
            'wordCount': word_count,
            'estimatedDuration': estimated_duration,
            'readingSpeed': reading_speed
        }
        
        # Build sections or scenes
        if sections:
            sections_data = self._build_sections(sections)
        else:
            # Legacy: wrap scenes in default section
            sections_data = self._wrap_scenes_in_section(scenes or [], duration)
        
        # Build voice configuration
        voice_section = self._build_voice_config(video_type, metadata_dict)
        
        # Build music configuration
        music_section = self._build_music_config(video_type)
        
        # Build subtitle configuration
        subtitle_section = self._build_subtitle_config(video_type)
        
        # Build quality metrics
        quality_section = quality_metrics or self._default_quality_metrics()
        
        # Assemble final JSON
        return {
            'metadata': metadata_section,
            'script': script_section,
            'sections': sections_data,
            'voice': voice_section,
            'music': music_section,
            'subtitle': subtitle_section,
            'qualityMetrics': quality_section
        }
    
    def _build_multi_video_edit_json(
        self,
        topic: str,
        source_videos: List[Dict],
        transcript: Dict,
        scenes: List[Dict],
        metadata: Dict
    ) -> Dict:
        """
        Build JSON for multi-video-edit type
        
        Schema includes:
        - sourceVideos array
        - transcript with timestamps + sourceVideoId
        - scenes with titleCard + brollSuggestions
        - voice = null (use source audio)
        - music with lower volume
        """
        # Calculate total duration from source videos
        total_duration = sum(v.get('duration', 0) for v in source_videos) if source_videos else None
        
        # Build metadata
        ratio = metadata.get('ratio', '9:16')
        ratio_dimensions = {
            "9:16": (1080, 1920),
            "16:9": (1920, 1080),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350)
        }
        width, height = ratio_dimensions.get(ratio, (1080, 1920))
        
        metadata_section = {
            'projectName': topic,
            'videoType': 'multi-video-edit',
            'duration': total_duration,
            'ratio': ratio,
            'width': width,
            'height': height,
            'platform': metadata.get('platform', 'shorts'),
            'targetAudience': metadata.get('targetAudience', ''),
            'createdAt': datetime.now().isoformat()
        }
        
        # Transcript section
        transcript_section = {
            'fullText': transcript.get('fullText', ''),
            'language': transcript.get('language', 'vi'),
            'timestamps': transcript.get('timestamps', []),
            'provider': transcript.get('provider'),
            'transcribedAt': transcript.get('transcribedAt')
        }
        
        # Scenes (keep as-is, with titleCard and brollSuggestions)
        scenes_section = scenes
        
        # Subtitle config
        subtitle_section = {
            'style': 'highlight-word',
            'position': 'center',
            'font': 'Montserrat',
            'highlightColor': '#FFD700'
        }
        
        # Voice = null for multi-video-edit
        voice_section = {
            'provider': None,
            'voiceId': None
        }
        
        # Music with lower volume
        music_section = {
            'enabled': True,
            'query': metadata.get('musicQuery', 'background calm gentle'),
            'mood': metadata.get('musicMood', 'calm'),
            'genre': metadata.get('musicGenre', 'ambient'),
            'volume': 0.08,  # Lower because of source audio
            'fadeIn': 2.0,
            'fadeOut': 2.0
        }
        
        # Assemble
        return {
            'metadata': metadata_section,
            'sourceVideos': source_videos,
            'transcript': transcript_section,
            'scenes': scenes_section,
            'subtitle': subtitle_section,
            'voice': voice_section,
            'music': music_section
        }

    
    def _clean_project_name(self, topic: str) -> str:
        """Clean topic để làm project name"""
        # Remove special chars, keep Vietnamese
        cleaned = topic.strip()
        # Limit length
        if len(cleaned) > 60:
            cleaned = cleaned[:60] + "..."
        return cleaned
    
    def _estimate_duration(self, word_count: int, video_type: str) -> int:
        """Estimate duration from word count"""
        wpm = {
            'facts': 140,
            'listicle': 145,
            'motivation': 115,
            'story': 140
        }.get(video_type, 140)
        
        return int(word_count * 60 / wpm)
    
    def _build_metadata(
        self,
        project_name: str,
        video_type: str,
        duration: int,
        extra_metadata: Dict
    ) -> Dict:
        """Build metadata section"""
        return {
            'projectName': project_name,
            'videoType': video_type,
            'duration': duration,
            'ratio': extra_metadata.get('ratio', '9:16'),
            'targetAudience': extra_metadata.get('targetAudience', 'General'),
            'platform': extra_metadata.get('platform', 'shorts'),
            'createdAt': datetime.now().isoformat(),
            'version': self.schema_version
        }
    
    def _build_scenes(self, scenes: List[Dict]) -> List[Dict]:
        """Build scenes section with full details"""
        result = []

        for scene in scenes:
            scene_data = {
                'id': scene['id'],
                'startTime': scene['startTime'],
                'endTime': scene.get('endTime', scene['startTime'] + scene.get('duration', 0.0)),
                'duration': scene['duration'],
                'text': scene.get('text', ''),
                'voiceNotes': scene.get('voiceNotes', 'Normal pace')
            }

            # Add visual suggestion
            if 'visualSuggestion' in scene:
                scene_data['visualSuggestion'] = scene['visualSuggestion']
            else:
                # Generate default
                scene_data['visualSuggestion'] = self._default_visual_suggestion(scene)

            result.append(scene_data)

        return result

    def _build_sections(self, sections: List[Dict]) -> List[Dict]:
        """Build sections with scenes"""
        result = []

        for section in sections:
            section_data = {
                'id': section.get('id', 'section'),
                'name': section.get('name', ''),
                'startTime': section.get('startTime', 0.0),
                'endTime': section.get('endTime', 0.0),
                'duration': section.get('duration', 0.0),
                'pace': section.get('pace', 'medium'),
                'scenes': []
            }

            # Build scenes within section
            for scene in section.get('scenes', []):
                scene_data = {
                    'id': scene.get('id', 'scene'),
                    'startTime': scene.get('startTime', 0.0),
                    'endTime': scene.get('endTime', 0.0),
                    'duration': scene.get('duration', 5.0),
                    'text': scene.get('text', ''),
                    'voiceNotes': scene.get('voiceNotes', 'Normal pace'),
                    'visualDescription': scene.get('visualDescription', ''),
                    'resourceCandidates': scene.get('resourceCandidates', []),
                    'selectedResourceId': scene.get('selectedResourceId', None)
                }

                # Add visual suggestion
                if 'visualSuggestion' in scene:
                    scene_data['visualSuggestion'] = scene['visualSuggestion']
                else:
                    scene_data['visualSuggestion'] = self._default_visual_suggestion(scene)

                # Add scene type if specified
                if 'type' in scene:
                    scene_data['type'] = scene['type']

                # Add overlays if specified
                if 'overlays' in scene:
                    scene_data['overlays'] = scene['overlays']

                section_data['scenes'].append(scene_data)

            result.append(section_data)

        return result

    def _wrap_scenes_in_section(self, scenes: List[Dict], duration: int) -> List[Dict]:
        """Wrap flat scenes list in a default section for backward compatibility"""
        if not scenes:
            return []

        # Calculate section timing from scenes
        start_time = scenes[0].get('startTime', 0.0) if scenes else 0.0
        end_time = duration or (scenes[-1].get('startTime', 0.0) + scenes[-1].get('duration', 0.0) if scenes else 0.0)

        # Build scenes
        built_scenes = self._build_scenes(scenes)

        return [{
            'id': 'main',
            'name': 'Main Content',
            'startTime': start_time,
            'endTime': end_time,
            'duration': end_time - start_time,
            'pace': 'medium',
            'scenes': built_scenes
        }]
    
    def _default_visual_suggestion(self, scene: Dict) -> Dict:
        """Generate default visual suggestion nếu chưa có"""
        scene_type = scene.get('type', 'body')
        
        defaults = {
            'hook': {
                'type': 'stock',
                'query': 'attention grabbing moment',
                'style': 'zoom-in'
            },
            'body': {
                'type': 'stock',
                'query': 'professional modern',
                'style': 'ken-burns'
            },
            'cta': {
                'type': 'stock',
                'query': 'call to action subscribe',
                'style': 'fade'
            }
        }
        
        return defaults.get(scene_type, defaults['body'])
    
    def _build_voice_config(self, video_type: str, metadata: Dict) -> Dict:
        """
        Build voice configuration with smart provider selection
        
        Priority (for Vietnamese):
        1. Gemini (if GEMINI_API_KEY) - Most natural, free
        2. ElevenLabs (if ELEVENLABS_API_KEY) - Multilingual
        3. Vbee (if VBEE_API_KEY) - Vietnamese specialist
        4. OpenAI - Fallback
        """
        import os
        
        # Check available providers from env
        has_gemini = bool(os.getenv('GEMINI_API_KEY'))
        has_elevenlabs = bool(os.getenv('ELEVENLABS_API_KEY'))
        has_vbee = bool(os.getenv('VBEE_API_KEY'))
        
        # Select provider based on priority
        if has_gemini:
            provider = 'gemini'
        elif has_elevenlabs:
            provider = 'elevenlabs'
        elif has_vbee:
            provider = 'vbee'
        else:
            provider = 'openai'
        
        # Voice configurations by provider and video type
        voice_configs = {
            'gemini': {
                'facts': {
                    'provider': 'gemini',
                    'voiceId': 'Charon',  # Deep, authoritative, informative
                    'speed': 1.0,
                    'styleInstruction': 'Rõ ràng – chuyên nghiệp – tự tin',
                    'notes': 'Gemini voice, professional tone for facts'
                },
                'listicle': {
                    'provider': 'gemini',
                    'voiceId': 'Puck',  # Energetic, mischievous, YouTuber vibe
                    'speed': 1.05,
                    'styleInstruction': 'Năng động – nhiệt tình – sôi nổi',
                    'notes': 'Gemini voice, energetic tone for listicle'
                },
                'motivation': {
                    'provider': 'gemini',
                    'voiceId': 'Aoede',  # Expressive, emotional, storytelling
                    'speed': 0.95,
                    'styleInstruction': 'Trầm – ấm – chậm – truyền cảm hứng',
                    'notes': 'Gemini voice, inspiring tone for motivation'
                },
                'story': {
                    'provider': 'gemini',
                    'voiceId': 'Aoede',  # Breezy, expressive
                    'speed': 1.0,
                    'styleInstruction': 'Kể chuyện – cảm xúc – hấp dẫn',
                    'notes': 'Gemini voice, storytelling tone'
                }
            },
            'elevenlabs': {
                'facts': {
                    'provider': 'elevenlabs',
                    'voiceId': 'pNInz6obpgDQGcFmaJgB',  # Adam - Deep, authoritative
                    'speed': 1.0,
                    'notes': 'ElevenLabs multilingual voice, professional'
                },
                'listicle': {
                    'provider': 'elevenlabs',
                    'voiceId': 'ErXwobaYiN019PkySvjV',  # Antoni - Energetic
                    'speed': 1.05,
                    'notes': 'ElevenLabs multilingual voice, energetic'
                },
                'motivation': {
                    'provider': 'elevenlabs',
                    'voiceId': 'VR6AewLTigWG4xSOukaG',  # Arnold - Strong, inspiring
                    'speed': 0.95,
                    'notes': 'ElevenLabs multilingual voice, inspiring'
                },
                'story': {
                    'provider': 'elevenlabs',
                    'voiceId': 'pNInz6obpgDQGcFmaJgB',  # Adam - Storytelling
                    'speed': 1.0,
                    'notes': 'ElevenLabs multilingual voice, storytelling'
                }
            },
            'vbee': {
                'facts': {
                    'provider': 'vbee',
                    'voiceId': 'hn_male_manh_dung_news_48k-h',  # Standard news voice
                    'speed': 1.0,
                    'notes': 'Vbee Vietnamese news voice'
                },
                'listicle': {
                    'provider': 'vbee',
                    'voiceId': 'hn_male_manh_dung_news_48k-h',
                    'speed': 1.05,
                    'notes': 'Vbee Vietnamese news voice'
                },
                'motivation': {
                    'provider': 'vbee',
                    'voiceId': 'hn_male_manh_dung_news_48k-h',
                    'speed': 0.95,
                    'notes': 'Vbee Vietnamese news voice'
                },
                'story': {
                    'provider': 'vbee',
                    'voiceId': 'hn_male_manh_dung_news_48k-h',
                    'speed': 1.0,
                    'notes': 'Vbee Vietnamese news voice'
                }
            },
            'openai': {
                'facts': {
                    'provider': 'openai',
                    'voiceId': 'onyx',  # Deep, serious
                    'speed': 1.0,
                    'notes': 'OpenAI voice, professional tone'
                },
                'listicle': {
                    'provider': 'openai',
                    'voiceId': 'nova',  # Energetic, friendly
                    'speed': 1.05,
                    'notes': 'OpenAI voice, energetic tone'
                },
                'motivation': {
                    'provider': 'openai',
                    'voiceId': 'echo',  # Warm, soft
                    'speed': 0.95,
                    'notes': 'OpenAI voice, inspiring tone'
                },
                'story': {
                    'provider': 'openai',
                    'voiceId': 'fable',  # Narrative, British
                    'speed': 1.0,
                    'notes': 'OpenAI voice, storytelling tone'
                }
            }
        }
        
        # Get config for selected provider and video type
        provider_configs = voice_configs.get(provider, voice_configs['openai'])
        voice_config = provider_configs.get(video_type, provider_configs['facts']).copy()
        
        # Add audioPath if provided in metadata
        if 'audioPath' in metadata:
            voice_config['audioPath'] = metadata['audioPath']
        elif 'audioFile' in metadata:
            voice_config['audioPath'] = metadata['audioFile']
            
        return voice_config
    
    def _build_music_config(self, video_type: str) -> Dict:
        """Build music configuration"""
        music_configs = {
            'facts': {
                'mood': 'calm',
                'query': 'calm ambient background music',
                'volume': 0.15,
                'fadeIn': 2,
                'fadeOut': 3,
                'suggestions': ['ambient-calm-1', 'minimal-background-2']
            },
            'listicle': {
                'mood': 'upbeat',
                'query': 'upbeat energetic background music',
                'volume': 0.15,
                'fadeIn': 1,
                'fadeOut': 2,
                'suggestions': ['upbeat-corporate-1', 'energetic-pop-2']
            },
            'motivation': {
                'mood': 'epic',
                'query': 'epic cinematic motivational music',
                'volume': 0.20,
                'fadeIn': 3,
                'fadeOut': 4,
                'suggestions': ['epic-cinematic-1', 'motivational-strings-2']
            },
            'story': {
                'mood': 'dramatic',
                'query': 'dramatic storytelling background music',
                'volume': 0.18,
                'fadeIn': 2,
                'fadeOut': 3,
                'suggestions': ['storytelling-ambient-1', 'emotional-piano-2']
            }
        }
        
        return music_configs.get(video_type, music_configs['facts'])
    
    def _build_subtitle_config(self, video_type: str) -> Dict:
        """Build subtitle configuration"""
        subtitle_configs = {
            'facts': {
                'enabled': True,
                'style': 'highlight-word',
                'position': 'center',
                'font': 'Montserrat',
                'fontSize': 48,
                'highlightColor': '#FFD700',
                'backgroundColor': 'transparent',
                'outline': True,
                'outlineColor': '#000000',
                'outlineWidth': 2
            },
            'listicle': {
                'enabled': True,
                'style': 'karaoke',
                'position': 'center',
                'font': 'Poppins',
                'fontSize': 52,
                'highlightColor': '#FF6B6B',
                'backgroundColor': 'rgba(0,0,0,0.7)',
                'outline': False
            },
            'motivation': {
                'enabled': True,
                'style': 'minimal',
                'position': 'center',
                'font': 'Playfair Display',
                'fontSize': 56,
                'highlightColor': '#FFFFFF',
                'backgroundColor': 'transparent',
                'outline': True,
                'outlineColor': '#000000',
                'outlineWidth': 3
            },
            'story': {
                'enabled': True,
                'style': 'highlight-word',
                'position': 'bottom',
                'font': 'Roboto',
                'fontSize': 44,
                'highlightColor': '#4ECDC4',
                'backgroundColor': 'rgba(0,0,0,0.5)',
                'outline': False
            }
        }
        
        return subtitle_configs.get(video_type, subtitle_configs['facts'])
    
    def _default_quality_metrics(self) -> Dict:
        """Default quality metrics nếu chưa run checker"""
        return {
            'hookStrength': 0,
            'pacingScore': 0,
            'engagementPotential': 'unknown',
            'suggestions': ['Run quality check to get detailed metrics']
        }
    
    def to_json_string(self, data: Dict, indent: int = 2) -> str:
        """Convert dict to formatted JSON string"""
        return json.dumps(data, indent=indent, ensure_ascii=False)
    
    def save_to_file(self, data: Dict, filepath: str):
        """Save JSON to file"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def validate_schema(self, data: Dict) -> Dict:
        """Validate JSON against schema requirements"""
        required_keys = ['metadata', 'script', 'sections', 'voice', 'music', 'subtitle']
        missing = [key for key in required_keys if key not in data]

        if missing:
            return {
                'valid': False,
                'errors': [f"Missing required key: {key}" for key in missing]
            }

        # Check video type
        video_type = data.get('metadata', {}).get('videoType', 'unknown')

        # For unified type, sections can be empty (initial state)
        if video_type == 'unified':
            sections = data.get('sections', [])
            if sections:
                # If sections exist, validate structure
                section_errors = []
                for i, section in enumerate(sections):
                    required_section_keys = ['id', 'name']
                    missing_section = [key for key in required_section_keys if key not in section]
                    if missing_section:
                        section_errors.append(f"Section {i}: missing {', '.join(missing_section)}")
                        continue

                    # Validate scenes within section (can be empty)
                    scenes = section.get('scenes', [])
                    for j, scene in enumerate(scenes):
                        required_scene_keys = ['id', 'text']
                        missing_scene = [key for key in required_scene_keys if key not in scene]
                        if missing_scene:
                            section_errors.append(f"Section {i}, Scene {j}: missing {', '.join(missing_scene)}")

                if section_errors:
                    return {
                        'valid': False,
                        'errors': section_errors
                    }

            return {
                'valid': True,
                'message': 'Schema validation passed (unified type)'
            }

        # For legacy types (facts, listicle, etc.)
        sections = data.get('sections', [])
        if not sections:
            return {
                'valid': False,
                'errors': ['No sections defined']
            }

        # Check section structure
        section_errors = []
        for i, section in enumerate(sections):
            required_section_keys = ['id', 'scenes']
            missing_section = [key for key in required_section_keys if key not in section]
            if missing_section:
                section_errors.append(f"Section {i}: missing {', '.join(missing_section)}")
                continue

            # Validate scenes within section
            scenes = section.get('scenes', [])
            for j, scene in enumerate(scenes):
                required_scene_keys = ['id', 'duration', 'text']
                missing_scene = [key for key in required_scene_keys if key not in scene]
                if missing_scene:
                    section_errors.append(f"Section {i}, Scene {j}: missing {', '.join(missing_scene)}")

        if section_errors:
            return {
                'valid': False,
                'errors': section_errors
            }

        return {
            'valid': True,
            'message': 'Schema validation passed'
        }


# Example usage
if __name__ == '__main__':
    builder = JSONBuilder()
    
    # Example scenes
    scenes = [
        {
            'id': 'hook',
            'type': 'hook',
            'startTime': 0,
            'duration': 5,
            'text': 'Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?',
            'voiceNotes': 'Đọc chậm, nhấn mạnh'
        },
        {
            'id': 'problem',
            'type': 'body',
            'startTime': 5,
            'duration': 15,
            'text': 'Giấc ngủ không chỉ tính bằng giờ...',
            'voiceNotes': 'Normal pace'
        }
    ]
    
    # Build JSON
    project = builder.build_project_json(
        topic="Tại sao bạn mệt dù ngủ đủ 8 tiếng",
        video_type="facts",
        duration=60,
        scenes=scenes,
        script_text="Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt? Giấc ngủ không chỉ tính bằng giờ...",
        metadata={'platform': 'tiktok', 'targetAudience': 'Dân văn phòng 25-35'}
    )
    
    # Validate
    validation = builder.validate_schema(project)
    print(f"Validation: {validation}")
    
    # Output
    print("\nGenerated JSON:")
    print(builder.to_json_string(project))
