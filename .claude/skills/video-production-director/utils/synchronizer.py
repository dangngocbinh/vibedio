import json
import re
from rapidfuzz import fuzz
from typing import Dict, List, Optional, Any

class ScriptSynchronizer:
    def __init__(self):
        pass

    # ============================================================================
    # FUZZY MATCHING METHODS (New: RapidFuzz-based timing resolution)
    # ============================================================================

    def find_time_range_fuzzy(
        self,
        scene_text: str,
        word_timestamps: List[Dict],
        search_start: int = 0,
        threshold: int = 75
    ) -> Optional[Dict[str, Any]]:
        """
        Find time range for scene_text using fuzzy matching with sliding window.

        Uses RapidFuzz (Levenshtein distance) to handle ASR errors.

        Args:
            scene_text: Text to search for
            word_timestamps: List of word timestamp dicts [{word, start, end}, ...]
            search_start: Index to start searching from
            threshold: Minimum similarity score (0-100, default 75)

        Returns:
            {
                'startTime': float,
                'endTime': float,
                'duration': float,
                'startIndex': int,
                'endIndex': int,
                'score': int
            }
            or None if no match found above threshold
        """
        if not scene_text or not word_timestamps:
            return None

        # Clean and tokenize scene text
        scene_words = scene_text.split()
        window_size = len(scene_words)

        # Add extra words to window to handle ASR errors
        window_extra = min(3, max(1, window_size // 4))

        best_score = 0
        best_range = None

        # Slide window across timestamps
        for i in range(search_start, len(word_timestamps) - window_size + 1):
            # Try multiple window sizes (exact, +1, +2, +3)
            for extra in range(0, window_extra + 1):
                end_idx = min(i + window_size + extra, len(word_timestamps))
                candidate = word_timestamps[i:end_idx]

                # Build candidate text from timestamps
                candidate_text = " ".join([w.get('word', '') for w in candidate])

                # Calculate fuzzy match score
                score = fuzz.ratio(scene_text.lower(), candidate_text.lower())

                if score > best_score:
                    best_score = score
                    best_range = {
                        'startTime': candidate[0].get('start', 0),
                        'endTime': candidate[-1].get('end', 0),
                        'startIndex': i,
                        'endIndex': end_idx,
                        'score': score
                    }

        # Check if best score meets threshold
        if best_range and best_score >= threshold:
            best_range['duration'] = best_range['endTime'] - best_range['startTime']
            return best_range

        return None

    def resolve_timing(
        self,
        text: str,
        voice_data: Dict,
        search_start: int = 0,
        threshold: int = 75
    ) -> Optional[Dict[str, Any]]:
        """
        Public wrapper for timing resolution using fuzzy matching.

        Args:
            text: Text to resolve timing for
            voice_data: Voice data dict with timestamps
            search_start: Index to start searching from
            threshold: Minimum similarity score

        Returns:
            {startTime, endTime, duration, score} or None
        """
        timestamps = voice_data.get('timestamps', [])
        if not timestamps:
            return None

        result = self.find_time_range_fuzzy(text, timestamps, search_start, threshold)

        if result:
            return {
                'startTime': result['startTime'],
                'endTime': result['endTime'],
                'duration': result['duration'],
                'score': result['score']
            }

        return None

    # ============================================================================
    # AUTO SEGMENTATION (Updated to remove video_type dependency)
    # ============================================================================

    def auto_segment_from_voice(self, voice_data, user_scenes=None, video_type='facts'):
        """
        Tự động phân đoạn scenes từ voice timestamps.

        Args:
            voice_data: Dict chứa timestamps và fullText
            user_scenes: Optional list of user-defined scenes với text (ưu tiên nếu có)
            video_type: Loại video để tạo structure phù hợp

        Returns:
            List of scenes với startTime, endTime, duration, text
        """
        timestamps = voice_data.get("timestamps", [])
        if not timestamps:
            raise ValueError("Voice data has no timestamps!")

        # Nếu có kịch bản người dùng, ưu tiên map với timestamps
        if user_scenes and len(user_scenes) > 0:
            return self._map_user_scenes_to_voice(user_scenes, timestamps)

        # Nếu không có, tự động phân đoạn dựa trên punctuation và pauses
        return self._auto_segment_by_pauses(timestamps, video_type)

    def _map_user_scenes_to_voice(self, user_scenes, timestamps):
        """
        Map kịch bản người dùng (có text) với voice timestamps.
        """
        scenes = []
        current_ts_index = 0

        print(f"🔄 Mapping {len(user_scenes)} user scenes to voice timestamps...")

        for i, scene in enumerate(user_scenes):
            text = scene.get("text", "")
            if not text:
                continue

            start, end, next_index = self.find_time_range(text, timestamps, current_ts_index)

            # Correction logic
            if i == 0:
                start = 0.0

            if start < (scenes[-1]["endTime"] if scenes else 0):
                start = scenes[-1]["endTime"] if scenes else 0

            duration = end - start

            # Sanity check
            if duration < 0.2:
                word_count = len(text.split())
                duration = word_count * 0.4
                end = start + duration

            scene_data = {
                "id": scene.get("id", f"scene-{i+1}"),
                "text": text,
                "startTime": round(start, 2),
                "endTime": round(end, 2),
                "duration": round(duration, 2)
            }

            # Preserve other fields from user scene
            if "visualSuggestion" in scene:
                scene_data["visualSuggestion"] = scene["visualSuggestion"]
            if "voiceNotes" in scene:
                scene_data["voiceNotes"] = scene["voiceNotes"]

            scenes.append(scene_data)

            if next_index > current_ts_index:
                current_ts_index = next_index

        return scenes

    def _auto_segment_by_pauses(self, timestamps, video_type):
        """
        Tự động phân đoạn scenes dựa trên pauses trong voice.

        Strategy:
        1. Detect long pauses (>0.5s) giữa các từ
        2. Group words thành scenes
        3. Tạo scenes theo structure của video_type
        """
        scenes = []
        current_segment = []
        segment_start = 0.0
        prev_end = 0.0

        PAUSE_THRESHOLD = 0.5  # 0.5 giây

        print(f"🔄 Auto-segmenting {len(timestamps)} timestamps by pauses...")

        for i, ts in enumerate(timestamps):
            word = ts.get("word", "")
            start = ts.get("start", 0)
            end = ts.get("end", 0)

            # Detect pause
            pause_duration = start - prev_end if prev_end > 0 else 0

            # Nếu có pause dài HOẶC gặp dấu câu kết thúc
            is_sentence_end = word.strip()[-1] in ['.', '!', '?'] if word.strip() else False

            if (pause_duration > PAUSE_THRESHOLD or is_sentence_end) and current_segment:
                # Save current segment as a scene
                segment_text = " ".join([t["word"] for t in current_segment])
                segment_end = current_segment[-1]["end"]
                duration = segment_end - segment_start

                scene_id = f"scene-{len(scenes) + 1}"
                scenes.append({
                    "id": scene_id,
                    "text": segment_text,
                    "startTime": round(segment_start, 2),
                    "endTime": round(segment_end, 2),
                    "duration": round(duration, 2)
                })

                # Reset
                current_segment = []
                segment_start = start

            current_segment.append(ts)
            prev_end = end

        # Flush remaining segment
        if current_segment:
            segment_text = " ".join([t["word"] for t in current_segment])
            segment_end = current_segment[-1]["end"]
            duration = segment_end - segment_start

            scenes.append({
                "id": f"scene-{len(scenes) + 1}",
                "text": segment_text,
                "startTime": round(segment_start, 2),
                "endTime": round(segment_end, 2),
                "duration": round(duration, 2)
            })

        print(f"✅ Created {len(scenes)} scenes from voice timestamps")
        return scenes

    def clean_text(self, text):
        """Normalize text for comparison: lowercase, remove punctuation."""
        return re.sub(r'[^\w\s]', '', text.lower()).split()

    def find_time_range(self, text_segment, timestamps, search_start_index=0):
        """
        Finds the start and end timestamps for a text segment within the voice timestamp list.
        """
        words = self.clean_text(text_segment)
        if not words:
            return 0, 0, search_start_index
        
        start_time = 0
        end_time = 0
        current_index = search_start_index
        
        # 1. Find Start Word
        first_word = words[0]
        match_start_index = -1
        
        # Search window optimization: Look ahead reasonable amount, but fallback to full search if needed
        # We start searching from where we left off (search_start_index)
        for i in range(search_start_index, len(timestamps)):
            ts_word = self.clean_text(timestamps[i]["word"])[0] if self.clean_text(timestamps[i]["word"]) else ""
            if ts_word == first_word:
                start_time = timestamps[i]["start"]
                match_start_index = i
                break
        
        if match_start_index == -1:
            # print(f"⚠️ Warning: Could not find start word '{first_word}'. Using previous end time.")
            return 0, 0, search_start_index

        # 2. Find End Word
        last_word = words[-1]
        match_end_index = -1
        
        # Estimated search position: start + length of words (fuzzy)
        # We look around the expected position
        expected_end_idx = match_start_index + len(words) - 1
        search_window_start = max(match_start_index, expected_end_idx - 5)
        search_window_end = min(len(timestamps), expected_end_idx + 15) # look ahead a bit more
        
        # Priority search in window
        for i in range(search_window_start, search_window_end):
            ts_word = self.clean_text(timestamps[i]["word"])[0] if self.clean_text(timestamps[i]["word"]) else ""
            if ts_word == last_word:
                end_time = timestamps[i]["end"]
                match_end_index = i
                # Optimized: Stop at first plausible match to avoid jumping too far? 
                # Actually for end word, we might want the /last/ match if words repeat? 
                # But here we assume linear progression.
                break
        
        # Fallback if not found in window: Search until end (careful of overlapping future scenes)
        if match_end_index == -1:
             for i in range(search_window_end, len(timestamps)):
                ts_word = self.clean_text(timestamps[i]["word"])[0] if self.clean_text(timestamps[i]["word"]) else ""
                if ts_word == last_word:
                    end_time = timestamps[i]["end"]
                    match_end_index = i
                    break
        
        # Last resort: just add time based on length if end word not found
        if match_end_index == -1:
            # print(f"⚠️ Warning: End word '{last_word}' not found given context. Estimating.")
            # Use the time of the last matched word index or match_start + len
            safe_idx = min(len(timestamps) - 1, match_start_index + len(words))
            end_time = timestamps[safe_idx]["end"]
            match_end_index = safe_idx

        # Return next start index (one after end)
        return start_time, end_time, match_end_index + 1

    def sync_script(self, script_data, voice_data):
        """
        Updates script_data with timings from voice_data.
        Supports both sections[] and scenes[] (legacy) structure.
        """
        timestamps = voice_data.get("timestamps", [])
        if not timestamps:
            raise ValueError("Voice data has no timestamps!")

        # Check if using sections or scenes (legacy)
        if 'sections' in script_data:
            sections = script_data['sections']
            total_scenes = sum(len(s.get('scenes', [])) for s in sections)
            print(f"🔄 Syncing {len(sections)} sections ({total_scenes} scenes) with {len(timestamps)} voice timestamps...")

            current_ts_index = 0
            prev_end_time = 0.0

            for section in sections:
                section_start = prev_end_time
                scenes = section.get('scenes', [])

                for i, scene in enumerate(scenes):
                    text = scene.get("text", "")
                    if not text:
                        continue

                    start, end, next_index = self.find_time_range(text, timestamps, current_ts_index)

                    # Correction logic
                    if start < prev_end_time:
                        start = prev_end_time

                    duration = end - start

                    if duration < 0.2:
                        word_count = len(text.split())
                        estimated_dur = word_count * 0.4
                        duration = estimated_dur
                        end = start + duration

                    # Update Scene
                    scene["startTime"] = round(start, 2)
                    scene["endTime"] = round(end, 2)
                    scene["duration"] = round(duration, 2)

                    prev_end_time = end
                    if next_index > current_ts_index:
                        current_ts_index = next_index

                # Update section timing
                section['startTime'] = round(section_start, 2)
                section['endTime'] = round(prev_end_time, 2)
                section['duration'] = round(prev_end_time - section_start, 2)

        else:
            # Legacy scenes structure
            scenes = script_data.get("scenes", [])
            current_ts_index = 0
            prev_end_time = 0.0

            print(f"🔄 Syncing {len(scenes)} scenes with {len(timestamps)} voice timestamps...")

            for i, scene in enumerate(scenes):
                text = scene.get("text", "")
                if not text:
                    continue

                start, end, next_index = self.find_time_range(text, timestamps, current_ts_index)

                if i == 0:
                    start = 0.0

                if start < prev_end_time:
                    start = prev_end_time

                duration = end - start

                if duration < 0.2:
                    word_count = len(text.split())
                    estimated_dur = word_count * 0.4
                    duration = estimated_dur
                    end = start + duration

                scene["startTime"] = round(start, 2)
                scene["endTime"] = round(end, 2)
                scene["duration"] = round(duration, 2)

                prev_end_time = end
                if next_index > current_ts_index:
                    current_ts_index = next_index

        # Update Total Metadata
        total_duration = round(prev_end_time, 2)
        script_data["metadata"]["duration"] = total_duration
        if "script" in script_data:
            script_data["script"]["estimatedDuration"] = total_duration

        return script_data
