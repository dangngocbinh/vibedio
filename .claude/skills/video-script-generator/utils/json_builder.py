"""
JSON BUILDER
Build final JSON output theo schema chuẩn
"""

from typing import Dict, List, Optional
from datetime import datetime
import json

class JSONBuilder:
    def __init__(self):
        self.schema_version = "1.0"
    
    def build_project_json(
        self,
        topic: str,
        video_type: str,
        duration: int,
        scenes: List[Dict],
        script_text: str,
        metadata: Optional[Dict] = None,
        quality_metrics: Optional[Dict] = None
    ) -> Dict:
        """
        Build complete project JSON
        """
        # Clean project name from topic
        project_name = self._clean_project_name(topic)
        
        # Calculate word count
        word_count = len(script_text.split())
        estimated_duration = self._estimate_duration(word_count, video_type)
        reading_speed = int(word_count * 60 / duration) if duration > 0 else 0
        
        # Build metadata section
        metadata_section = self._build_metadata(
            project_name,
            video_type,
            duration,
            metadata or {}
        )
        
        # Build script section
        script_section = {
            'fullText': script_text,
            'wordCount': word_count,
            'estimatedDuration': estimated_duration,
            'readingSpeed': reading_speed
        }
        
        # Build scenes with visual suggestions
        scenes_section = self._build_scenes(scenes)
        
        # Build voice configuration
        voice_section = self._build_voice_config(video_type, metadata or {})
        
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
            'scenes': scenes_section,
            'voice': voice_section,
            'music': music_section,
            'subtitle': subtitle_section,
            'qualityMetrics': quality_section
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
        """Build voice configuration"""
        # Voice suggestions by video type
        voice_configs = {
            'facts': {
                'provider': 'elevenlabs',
                'voiceId': 'vietnamese-male-professional',
                'speed': 1.0,
                'notes': 'Male voice, professional tone, clear enunciation'
            },
            'listicle': {
                'provider': 'elevenlabs',
                'voiceId': 'vietnamese-male-energetic',
                'speed': 1.05,
                'notes': 'Energetic male voice, upbeat tone'
            },
            'motivation': {
                'provider': 'elevenlabs',
                'voiceId': 'vietnamese-male-deep',
                'speed': 0.95,
                'notes': 'Deep male voice, dramatic tone, slower pace'
            },
            'story': {
                'provider': 'elevenlabs',
                'voiceId': 'vietnamese-male-storyteller',
                'speed': 1.0,
                'notes': 'Storytelling voice, emotional range'
            }
        }
        
        return voice_configs.get(video_type, voice_configs['facts'])
    
    def _build_music_config(self, video_type: str) -> Dict:
        """Build music configuration"""
        music_configs = {
            'facts': {
                'mood': 'calm',
                'volume': 0.15,
                'fadeIn': 2,
                'fadeOut': 3,
                'suggestions': ['ambient-calm-1', 'minimal-background-2']
            },
            'listicle': {
                'mood': 'upbeat',
                'volume': 0.15,
                'fadeIn': 1,
                'fadeOut': 2,
                'suggestions': ['upbeat-corporate-1', 'energetic-pop-2']
            },
            'motivation': {
                'mood': 'epic',
                'volume': 0.20,
                'fadeIn': 3,
                'fadeOut': 4,
                'suggestions': ['epic-cinematic-1', 'motivational-strings-2']
            },
            'story': {
                'mood': 'dramatic',
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
        required_keys = ['metadata', 'script', 'scenes', 'voice', 'music', 'subtitle']
        missing = [key for key in required_keys if key not in data]
        
        if missing:
            return {
                'valid': False,
                'errors': [f"Missing required key: {key}" for key in missing]
            }
        
        # Validate scenes
        scenes = data.get('scenes', [])
        if not scenes:
            return {
                'valid': False,
                'errors': ['No scenes defined']
            }
        
        # Check scene structure
        scene_errors = []
        for i, scene in enumerate(scenes):
            required_scene_keys = ['id', 'startTime', 'duration', 'text']
            missing_scene = [key for key in required_scene_keys if key not in scene]
            if missing_scene:
                scene_errors.append(f"Scene {i}: missing {', '.join(missing_scene)}")
        
        if scene_errors:
            return {
                'valid': False,
                'errors': scene_errors
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
