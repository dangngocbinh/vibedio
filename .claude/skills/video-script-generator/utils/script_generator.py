"""
VIDEO SCRIPT GENERATOR
Core logic để generate script từ templates
"""

from typing import Dict, List, Optional
import re

class ScriptGenerator:
    def __init__(self):
        self.templates = {
            'facts': {
                'structure': ['hook', 'problem', 'insight', 'solution', 'cta'],
                'timing': [5, 15, 15, 15, 10],  # seconds
                'wpm': 140  # words per minute
            },
            'listicle': {
                'structure': ['hook', 'item1', 'item2', 'item3', 'item4', 'item5', 'cta'],
                'timing': [5, 10, 10, 10, 10, 10, 5],
                'wpm': 145
            },
            'motivation': {
                'structure': ['quote', 'story', 'lesson', 'cta'],
                'timing': [10, 20, 20, 10],
                'wpm': 115  # slower for dramatic effect
            },
            'story': {
                'structure': ['hook', 'setup', 'build', 'climax', 'cta'],
                'timing': [5, 15, 20, 15, 5],
                'wpm': 140
            }
        }
        
        self.hook_formulas = {
            'facts': [
                "Bạn {action} mà vẫn {unexpected_result}?",
                "{X}% người {mistake} mà không biết {truth}",
                "Tại sao {surprising_fact}?",
                "Không phải {common_belief}. Sự thật là {truth}",
            ],
            'listicle': [
                "{X} điều {target_audience} cần biết về {topic}",
                "Top {X} {things} mà {expert} làm",
                "{X} sai lầm khi {activity}",
                "{X} bí mật về {topic} không ai nói bạn",
            ],
            'motivation': [
                '"{powerful_quote}"',
                "Người {successful_person} từng nói: {quote}",
                "{unexpected_wisdom}",
            ],
            'story': [
                "Người này {extreme_outcome}. Chuyện gì đã xảy ra?",
                "{person} làm {surprising_thing} và kết quả...",
                "Không ai ngờ rằng {unexpected_twist}...",
            ]
        }
    
    def calculate_word_target(self, duration: int, video_type: str) -> tuple:
        """Tính số từ cần thiết cho duration"""
        wpm = self.templates[video_type]['wpm']
        target = int(duration * wpm / 60)
        return (int(target * 0.9), int(target * 1.1))  # ±10%
    
    def generate_structure(self, video_type: str, duration: int) -> List[Dict]:
        """Generate cấu trúc scenes với timing"""
        template = self.templates[video_type]
        structure = template['structure']
        default_timing = template['timing']
        
        # Scale timing nếu duration khác 60s
        scale_factor = duration / sum(default_timing)
        
        scenes = []
        current_time = 0
        
        for i, section in enumerate(structure):
            scene_duration = int(default_timing[i] * scale_factor)
            scenes.append({
                'id': section,
                'type': self._get_scene_type(section),
                'startTime': current_time,
                'duration': scene_duration,
                'text': '',  # Will be filled by content
                'voiceNotes': self._get_voice_notes(section)
            })
            current_time += scene_duration
        
        return scenes
    
    def _get_scene_type(self, section: str) -> str:
        """Map section name to scene type"""
        if 'hook' in section or 'quote' in section:
            return 'hook'
        elif 'cta' in section:
            return 'cta'
        else:
            return 'body'
    
    def _get_voice_notes(self, section: str) -> str:
        """Gợi ý cách đọc cho từng section"""
        notes = {
            'hook': 'Đọc chậm, nhấn mạnh, tạo suspense',
            'quote': 'Dramatic, có pause sau quote',
            'problem': 'Tone đồng cảm, relatable',
            'insight': 'Explain rõ ràng, moderate pace',
            'solution': 'Energetic, confident tone',
            'story': 'Storytelling pace, emotional',
            'lesson': 'Thoughtful, slower pace',
            'cta': 'Clear, direct, không rush',
            'item': 'Consistent pace, số thứ tự rõ ràng'
        }
        
        for key, note in notes.items():
            if key in section:
                return note
        return 'Moderate pace, clear enunciation'
    
    def suggest_visuals(self, section: str, content: str) -> Dict:
        """Suggest visual cho scene dựa trên content"""
        # Keywords cho stock footage
        stock_keywords = {
            'hook': ['shocked expression', 'dramatic reveal', 'attention'],
            'problem': ['frustrated person', 'confusion', 'struggle'],
            'solution': ['success moment', 'happy person', 'achievement'],
            'cta': ['follow gesture', 'like button', 'subscribe'],
            'sleep': ['sleeping person', 'bedroom', 'alarm clock'],
            'work': ['office desk', 'typing keyboard', 'working'],
            'success': ['celebrating', 'winner', 'achievement'],
            'time': ['clock', 'calendar', 'watch'],
        }
        
        # Extract keywords from content
        content_lower = content.lower()
        matched_keywords = []
        
        for topic, keywords in stock_keywords.items():
            if topic in content_lower or topic in section:
                matched_keywords.extend(keywords)
        
        # Default nếu không match
        if not matched_keywords:
            matched_keywords = ['professional', 'modern', 'clean']
        
        # Animation style dựa trên scene type
        animation_styles = {
            'hook': 'zoom-in',
            'body': 'ken-burns',
            'cta': 'fade'
        }
        
        scene_type = self._get_scene_type(section)
        
        return {
            'type': 'stock',  # hoặc 'ai-generated'
            'query': ' '.join(matched_keywords[:3]),  # Top 3 keywords
            'style': animation_styles.get(scene_type, 'fade')
        }
    
    def generate_hook_options(self, video_type: str, topic: str, count: int = 3) -> List[str]:
        """Generate multiple hook options"""
        formulas = self.hook_formulas.get(video_type, self.hook_formulas['facts'])
        
        # Placeholder - trong thực tế sẽ dùng AI để fill placeholders
        # Đây chỉ là structure
        return [
            f"Hook option {i+1} dựa trên formula: {formula}"
            for i, formula in enumerate(formulas[:count])
        ]
    
    def validate_script(self, scenes: List[Dict], target_duration: int) -> Dict:
        """Validate script structure"""
        total_duration = sum(s['duration'] for s in scenes)
        total_words = sum(len(s.get('text', '').split()) for s in scenes)
        
        issues = []
        
        # Check duration
        if abs(total_duration - target_duration) > 3:
            issues.append(f"Duration mismatch: {total_duration}s vs {target_duration}s")
        
        # Check nếu có text trống
        empty_scenes = [s['id'] for s in scenes if not s.get('text', '').strip()]
        if empty_scenes:
            issues.append(f"Empty scenes: {', '.join(empty_scenes)}")
        
        # Check hook length
        hook_scene = next((s for s in scenes if s['type'] == 'hook'), None)
        if hook_scene and (hook_scene['duration'] < 3 or hook_scene['duration'] > 7):
            issues.append(f"Hook duration should be 3-7s, got {hook_scene['duration']}s")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'stats': {
                'totalDuration': total_duration,
                'totalWords': total_words,
                'sceneCount': len(scenes)
            }
        }


# Example usage
if __name__ == '__main__':
    gen = ScriptGenerator()
    
    # Generate structure for Facts video 60s
    scenes = gen.generate_structure('facts', 60)
    print("Generated scenes structure:")
    for scene in scenes:
        print(f"  {scene['id']}: {scene['startTime']}s-{scene['startTime']+scene['duration']}s")
    
    # Calculate word target
    min_words, max_words = gen.calculate_word_target(60, 'facts')
    print(f"\nWord target: {min_words}-{max_words} words")
    
    # Validate
    validation = gen.validate_script(scenes, 60)
    print(f"\nValidation: {validation}")
