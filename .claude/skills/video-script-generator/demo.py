#!/usr/bin/env python3
"""
DEMO: Video Script Generator Skill
Minh họa cách sử dụng toàn bộ components để tạo script JSON
"""

import sys
import json
from utils.script_generator import ScriptGenerator
from utils.quality_checker import QualityChecker
from utils.json_builder import JSONBuilder

def demo_facts_video():
    """Demo tạo Facts video về sleep cycle"""
    print("="*60)
    print("DEMO: FACTS VIDEO - Sleep Cycle")
    print("="*60)
    
    # Initialize components
    gen = ScriptGenerator()
    checker = QualityChecker()
    builder = JSONBuilder()
    
    # 1. Generate structure
    print("\n1. Generating scene structure...")
    scenes = gen.generate_structure('facts', 60)
    
    for scene in scenes:
        print(f"  {scene['id']}: {scene['startTime']}s - {scene['startTime']+scene['duration']}s")
    
    # 2. Fill in content (normally từ AI/user input)
    print("\n2. Filling content...")
    scenes[0]['text'] = "Bạn ngủ đủ 8 tiếng mà sáng dậy vẫn mệt?"
    scenes[1]['text'] = "Giấc ngủ không chỉ tính bằng giờ. Nó tính bằng chu kỳ 90 phút."
    scenes[2]['text'] = "Thức dậy giữa chu kỳ = mệt mỏi cả ngày."
    scenes[3]['text'] = "Ngủ 6 tiếng hoặc 7.5 tiếng sẽ tốt hơn 8 tiếng."
    scenes[4]['text'] = "Follow để biết thêm mẹo ngủ ngon."
    
    # Add visual suggestions
    for scene in scenes:
        scene['visualSuggestion'] = gen.suggest_visuals(scene['id'], scene['text'])
    
    # 3. Build full script
    full_script = " ".join([s['text'] for s in scenes])
    print(f"  Full script: {len(full_script.split())} words")
    
    # 4. Quality check
    print("\n3. Quality checking...")
    hook_check = checker.calculate_hook_strength(scenes[0]['text'])
    print(f"  Hook strength: {hook_check['score']}/10 - {hook_check['rating']}")
    
    pacing_check = checker.calculate_pacing_score(scenes, 60)
    print(f"  Pacing score: {pacing_check['score']}/10 - {pacing_check['rating']}")
    
    word_check = checker.check_word_count(full_script, 60, 'facts')
    print(f"  Word count: {word_check['message']}")
    
    # 5. Build final JSON
    print("\n4. Building JSON...")
    
    quality_metrics = {
        'hookStrength': hook_check['score'],
        'pacingScore': pacing_check['score'],
        'engagementPotential': 'medium',
        'suggestions': hook_check.get('suggestions', []) + pacing_check.get('suggestions', [])
    }
    
    project_json = builder.build_project_json(
        topic="Tại sao bạn mệt dù ngủ đủ 8 tiếng",
        video_type="facts",
        duration=60,
        scenes=scenes,
        script_text=full_script,
        metadata={
            'platform': 'shorts',
            'targetAudience': 'Dân văn phòng 25-35'
        },
        quality_metrics=quality_metrics
    )
    
    # 6. Validate
    validation = builder.validate_schema(project_json)
    print(f"  Validation: {validation['valid']}")
    if not validation['valid']:
        print(f"  Errors: {validation['errors']}")
    
    # 7. Output
    print("\n5. Final JSON:")
    print("-"*60)
    print(builder.to_json_string(project_json, indent=2))
    print("-"*60)
    
    return project_json


def demo_listicle_video():
    """Demo tạo Listicle video"""
    print("\n" + "="*60)
    print("DEMO: LISTICLE VIDEO - Morning Habits")
    print("="*60)
    
    gen = ScriptGenerator()
    checker = QualityChecker()
    builder = JSONBuilder()
    
    # Generate structure
    print("\n1. Generating listicle structure (5 items)...")
    scenes = gen.generate_structure('listicle', 60)
    
    # Fill content
    print("\n2. Filling content...")
    scenes[0]['text'] = "Người thành công không có nhiều thời gian hơn bạn."
    scenes[1]['text'] = "Số 1: Dậy sớm trước 6h. Não hoạt động tốt nhất 2 tiếng đầu."
    scenes[2]['text'] = "Số 2: Không check điện thoại ngay."
    scenes[3]['text'] = "Số 3: Tập thể dục 15 phút."
    scenes[4]['text'] = "Số 4: Ăn sáng có protein."
    scenes[5]['text'] = "Số 5: Viết 3 việc quan trọng nhất."
    scenes[6]['text'] = "Bạn đã có thói quen nào? Comment bên dưới!"
    
    for scene in scenes:
        scene['visualSuggestion'] = gen.suggest_visuals(scene['id'], scene['text'])
    
    full_script = " ".join([s['text'] for s in scenes])
    
    # Quality check
    print("\n3. Quality checking...")
    hook_check = checker.calculate_hook_strength(scenes[0]['text'])
    print(f"  Hook: {hook_check['score']}/10")
    print(f"  Suggestions: {hook_check.get('suggestions', [])}")
    
    # Build JSON
    print("\n4. Building JSON...")
    project_json = builder.build_project_json(
        topic="5 thói quen buổi sáng của người thành công",
        video_type="listicle",
        duration=60,
        scenes=scenes,
        script_text=full_script
    )
    
    print(f"  ✓ Generated {len(scenes)} scenes")
    print(f"  ✓ Total {len(full_script.split())} words")
    
    return project_json


def compare_hooks():
    """Demo so sánh các hooks khác nhau"""
    print("\n" + "="*60)
    print("DEMO: HOOK COMPARISON")
    print("="*60)
    
    checker = QualityChecker()
    
    hooks = [
        "Bạn ngủ 8 tiếng vẫn mệt?",
        "80% người ngủ 8 tiếng vẫn mệt. Đừng mắc sai lầm này!",
        "Tại sao bạn mệt dù ngủ đủ giấc?",
        "Ngủ 8 tiếng vẫn mệt? Khoa học giải thích!"
    ]
    
    print("\nTesting 4 different hooks:\n")
    
    for i, hook in enumerate(hooks, 1):
        result = checker.calculate_hook_strength(hook)
        print(f"{i}. \"{hook}\"")
        print(f"   Score: {result['score']}/10 - {result['rating']}")
        print(f"   Top suggestion: {result['suggestions'][0] if result['suggestions'] else 'None'}")
        print()


if __name__ == '__main__':
    # Run demos
    print("\n🎬 VIDEO SCRIPT GENERATOR - DEMO\n")
    
    # Demo 1: Facts video
    facts_project = demo_facts_video()
    
    # Demo 2: Listicle video
    listicle_project = demo_listicle_video()
    
    # Demo 3: Hook comparison
    compare_hooks()
    
    print("\n" + "="*60)
    print("✅ DEMO COMPLETE")
    print("="*60)
    print("\nNext steps:")
    print("1. Use these JSON outputs for video generation")
    print("2. Iterate on scripts by adjusting content")
    print("3. Pass to video-generator skill")
    print()
