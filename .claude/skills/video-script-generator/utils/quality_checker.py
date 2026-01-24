"""
QUALITY CHECKER
Đánh giá chất lượng script: hook strength, pacing, engagement potential
"""

from typing import Dict, List
import re

class QualityChecker:
    def __init__(self):
        self.power_words_vi = [
            'bí mật', 'đừng', 'tại sao', 'không ai', 'shocking',
            'cảnh báo', 'nguy hiểm', 'sai lầm', 'bất ngờ',
            'không bao giờ', 'luôn luôn', 'tuyệt đối', 'quan trọng'
        ]
        
        self.negative_words_vi = [
            'đừng', 'sai lầm', 'cảnh báo', 'nguy hiểm', 'tránh',
            'không nên', 'thất bại', 'lỗi', 'xấu', 'tệ'
        ]
        
        self.engagement_words_vi = [
            'bạn', 'chúng ta', 'mình', 'như thế nào', 'làm sao',
            'có phải', 'đúng không', 'thử xem'
        ]
    
    def calculate_hook_strength(self, hook_text: str) -> Dict:
        """
        Tính độ mạnh của hook (0-10)
        Criteria:
        - Có số liệu/stats: +2
        - Có power words: +2
        - Có câu hỏi: +2
        - Độ dài phù hợp (20-60 chars): +2
        - Có negative/warning: +2
        """
        score = 0
        reasons = []
        
        # Check số liệu
        if re.search(r'\d+', hook_text):
            score += 2
            reasons.append("✓ Có số liệu/thống kê")
        else:
            reasons.append("✗ Thiếu số liệu (có thể thêm %/số cụ thể)")
        
        # Check power words
        if any(word in hook_text.lower() for word in self.power_words_vi):
            score += 2
            reasons.append("✓ Có power words")
        else:
            reasons.append("✗ Thiếu power words (bí mật, tại sao, không ai...)")
        
        # Check câu hỏi
        if '?' in hook_text:
            score += 2
            reasons.append("✓ Có câu hỏi (tạo curiosity)")
        else:
            reasons.append("✗ Không có câu hỏi")
        
        # Check độ dài
        char_count = len(hook_text)
        if 20 <= char_count <= 60:
            score += 2
            reasons.append(f"✓ Độ dài OK ({char_count} chars)")
        elif char_count < 20:
            reasons.append(f"✗ Quá ngắn ({char_count} chars, nên 20-60)")
        else:
            reasons.append(f"✗ Quá dài ({char_count} chars, nên 20-60)")
        
        # Check negative/warning
        if any(word in hook_text.lower() for word in self.negative_words_vi):
            score += 2
            reasons.append("✓ Có element negative/warning (attention-grabbing)")
        else:
            reasons.append("✗ Có thể thêm warning/negative để mạnh hơn")
        
        # Bonus: engagement words (trực tiếp với viewer)
        if any(word in hook_text.lower() for word in self.engagement_words_vi):
            score += 0.5
            reasons.append("✓ Bonus: Có engagement words (bạn, mình...)")
        
        return {
            'score': min(score, 10),
            'rating': self._get_rating(score),
            'reasons': reasons,
            'suggestions': self._suggest_hook_improvements(hook_text, score)
        }
    
    def _get_rating(self, score: float) -> str:
        """Convert score to rating"""
        if score >= 8:
            return "Excellent"
        elif score >= 6:
            return "Good"
        elif score >= 4:
            return "Average"
        else:
            return "Needs Improvement"
    
    def _suggest_hook_improvements(self, hook_text: str, current_score: float) -> List[str]:
        """Suggest cách improve hook"""
        suggestions = []
        
        if current_score < 8:
            if not re.search(r'\d+', hook_text):
                suggestions.append("Thêm số liệu cụ thể (VD: '80% người...', '5 triệu người...')")
            
            if '?' not in hook_text:
                suggestions.append("Đổi sang câu hỏi để tạo curiosity")
            
            if not any(word in hook_text.lower() for word in self.negative_words_vi):
                suggestions.append("Thêm element warning/negative (VD: 'Đừng...', 'Sai lầm...')")
        
        return suggestions
    
    def calculate_pacing_score(self, scenes: List[Dict], target_duration: int) -> Dict:
        """
        Tính pacing score (0-10)
        Check:
        - Hook duration: 3-7s
        - Body scenes: 8-20s each
        - CTA duration: 5-10s
        - Total duration match target (±3s)
        """
        score = 10
        issues = []
        
        # Ideal durations by scene type
        ideal_ranges = {
            'hook': (3, 7),
            'body': (8, 20),
            'cta': (5, 10)
        }
        
        for scene in scenes:
            scene_type = scene.get('type', 'body')
            duration = scene['duration']
            min_dur, max_dur = ideal_ranges.get(scene_type, (5, 15))
            
            if not (min_dur <= duration <= max_dur):
                score -= 1
                issues.append(
                    f"{scene['id']}: {duration}s (nên {min_dur}-{max_dur}s)"
                )
        
        # Check total duration
        total_duration = sum(s['duration'] for s in scenes)
        diff = abs(total_duration - target_duration)
        
        if diff > 3:
            score -= 2
            issues.append(
                f"Total duration off by {diff}s ({total_duration}s vs {target_duration}s)"
            )
        
        # Check scene count (không quá ít, không quá nhiều)
        scene_count = len(scenes)
        if scene_count < 3:
            score -= 1
            issues.append(f"Too few scenes ({scene_count}), video might feel monotonous")
        elif scene_count > 10:
            score -= 1
            issues.append(f"Too many scenes ({scene_count}), might feel rushed")
        
        return {
            'score': max(score, 0),
            'rating': self._get_rating(score),
            'issues': issues,
            'suggestions': self._suggest_pacing_improvements(scenes, issues)
        }
    
    def _suggest_pacing_improvements(self, scenes: List[Dict], issues: List[str]) -> List[str]:
        """Suggest cách improve pacing"""
        suggestions = []
        
        if not issues:
            return ["Pacing is good!"]
        
        # Analyze issues
        for issue in issues:
            if 'hook' in issue.lower() and 'nên' in issue:
                suggestions.append("Rút ngắn/kéo dài hook để fit 3-7s sweet spot")
            elif 'cta' in issue.lower():
                suggestions.append("Adjust CTA duration (5-10s is ideal)")
            elif 'total duration' in issue.lower():
                suggestions.append("Re-balance scene durations để fit target")
        
        return suggestions
    
    def check_word_count(self, text: str, duration: int, video_type: str) -> Dict:
        """
        Check word count vs duration
        Returns: is_valid, message, suggestions
        """
        words = len(text.split())
        
        # WPM by video type
        wpm_targets = {
            'facts': (130, 150),
            'listicle': (140, 160),
            'motivation': (100, 130),
            'story': (130, 160)
        }
        
        wpm_min, wpm_max = wpm_targets.get(video_type, (130, 150))
        
        # Calculate ideal word count
        ideal_min = int(duration * wpm_min / 60)
        ideal_max = int(duration * wpm_max / 60)
        
        # Check
        if ideal_min <= words <= ideal_max:
            return {
                'valid': True,
                'message': f"Word count OK: {words} words ({int(words*60/duration)} wpm)",
                'suggestions': []
            }
        elif words < ideal_min:
            shortage = ideal_min - words
            return {
                'valid': False,
                'message': f"Quá ngắn: {words} words (nên {ideal_min}-{ideal_max})",
                'suggestions': [
                    f"Thêm ~{shortage} từ",
                    "Expand explanations trong body",
                    "Add thêm context hoặc examples"
                ]
            }
        else:  # words > ideal_max
            excess = words - ideal_max
            return {
                'valid': False,
                'message': f"Quá dài: {words} words (nên {ideal_min}-{ideal_max})",
                'suggestions': [
                    f"Cắt ~{excess} từ",
                    "Tighten hook và CTA",
                    "Remove filler words",
                    "Hoặc tăng duration thêm {int(excess*60/wpm_max)}s"
                ]
            }
    
    def calculate_engagement_potential(self, script: str, hook_score: float, pacing_score: float) -> Dict:
        """
        Estimate engagement potential
        Factors:
        - Hook strength: 40%
        - Pacing: 30%
        - Engagement elements: 30%
        """
        # Check engagement elements
        engagement_score = 0
        elements_found = []
        
        # Questions
        question_count = script.count('?')
        if question_count >= 1:
            engagement_score += 3
            elements_found.append(f"{question_count} questions")
        
        # Direct address (bạn, mình, chúng ta)
        if any(word in script.lower() for word in self.engagement_words_vi):
            engagement_score += 3
            elements_found.append("Direct address to viewer")
        
        # Story elements (người, họ, cô ấy, anh ấy)
        story_words = ['người', 'họ', 'cô ấy', 'anh ấy', 'tôi']
        if any(word in script.lower() for word in story_words):
            engagement_score += 2
            elements_found.append("Story elements")
        
        # Numbers/stats
        number_count = len(re.findall(r'\d+', script))
        if number_count >= 2:
            engagement_score += 2
            elements_found.append(f"{number_count} numbers/stats")
        
        # Normalize to 0-10
        engagement_score = min(engagement_score, 10)
        
        # Weighted average
        final_score = (
            hook_score * 0.4 +
            pacing_score * 0.3 +
            engagement_score * 0.3
        )
        
        # Predict potential
        if final_score >= 8:
            potential = "High"
        elif final_score >= 6:
            potential = "Medium"
        else:
            potential = "Low"
        
        return {
            'score': round(final_score, 1),
            'potential': potential,
            'factors': {
                'hookStrength': hook_score,
                'pacing': pacing_score,
                'engagementElements': engagement_score
            },
            'elementsFound': elements_found
        }
    
    def full_quality_check(self, script_data: Dict) -> Dict:
        """
        Run tất cả quality checks
        Input: script_data with scenes, metadata
        Output: comprehensive quality report
        """
        scenes = script_data.get('scenes', [])
        full_text = script_data.get('script', {}).get('fullText', '')
        video_type = script_data.get('metadata', {}).get('videoType', 'facts')
        duration = script_data.get('metadata', {}).get('duration', 60)
        
        # Get hook scene
        hook_scene = next((s for s in scenes if s['type'] == 'hook'), None)
        hook_text = hook_scene['text'] if hook_scene else ''
        
        # Run checks
        hook_check = self.calculate_hook_strength(hook_text)
        pacing_check = self.calculate_pacing_score(scenes, duration)
        word_check = self.check_word_count(full_text, duration, video_type)
        engagement = self.calculate_engagement_potential(
            full_text,
            hook_check['score'],
            pacing_check['score']
        )
        
        return {
            'hook': hook_check,
            'pacing': pacing_check,
            'wordCount': word_check,
            'engagement': engagement,
            'overallRating': self._calculate_overall_rating(
                hook_check['score'],
                pacing_check['score'],
                word_check['valid'],
                engagement['score']
            )
        }
    
    def _calculate_overall_rating(self, hook: float, pacing: float, word_valid: bool, engagement: float) -> str:
        """Calculate overall quality rating"""
        if not word_valid:
            return "Needs Word Count Adjustment"
        
        avg_score = (hook + pacing + engagement) / 3
        
        if avg_score >= 8:
            return "Excellent - Ready to Produce"
        elif avg_score >= 6:
            return "Good - Minor improvements recommended"
        elif avg_score >= 4:
            return "Average - Several improvements needed"
        else:
            return "Needs Major Revision"


# Example usage
if __name__ == '__main__':
    checker = QualityChecker()
    
    # Test hook
    hook1 = "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?"
    result1 = checker.calculate_hook_strength(hook1)
    print(f"Hook 1: {result1['score']}/10 - {result1['rating']}")
    for reason in result1['reasons']:
        print(f"  {reason}")
    
    print("\n" + "="*50 + "\n")
    
    # Test hook 2 with stats
    hook2 = "80% người ngủ 8 tiếng vẫn mệt. Đừng mắc sai lầm này!"
    result2 = checker.calculate_hook_strength(hook2)
    print(f"Hook 2: {result2['score']}/10 - {result2['rating']}")
    for reason in result2['reasons']:
        print(f"  {reason}")
