"""Voice timing synchronization utilities.

Maps scene text to voice timestamps for precise audio-visual sync.
"""
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import re


@dataclass
class VoiceTiming:
    """Timing information for a scene based on voice timestamps."""
    start: float  # Start time in seconds
    end: float    # End time in seconds
    duration: float  # Duration in seconds
    word_count: int  # Number of words matched


class VoiceTimingSync:
    """
    Synchronizes scene timing with voice timestamps.

    Maps scene text to actual voice timestamps to determine
    when each scene's audio content starts and ends.
    """

    def __init__(self):
        """Initialize VoiceTimingSync."""
        pass

    def map_scenes_to_voice(
        self,
        scenes: List[Dict[str, Any]],
        voice_data: Dict[str, Any]
    ) -> Dict[str, VoiceTiming]:
        """
        Map all scenes to their voice timing.

        Processes scenes sequentially to handle duplicate words correctly.

        Args:
            scenes: List of scene dicts from script.json
            voice_data: Parsed voice.json with timestamps

        Returns:
            Dict mapping scene_id to VoiceTiming
        """
        timestamps = voice_data.get('timestamps', [])
        if not timestamps:
            # Fallback to script timing if no voice timestamps
            return self._fallback_to_script_timing(scenes)

        result = {}
        search_start_idx = 0  # Track position for sequential search

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')
            scene_text = scene.get('text', '')

            # Find timing for this scene (starting from last position)
            timing_result = self.find_scene_timing(scene_text, timestamps, search_start_idx)

            if timing_result:
                timing, last_idx = timing_result
                # Update search position for next scene
                search_start_idx = last_idx + 1

                # [FIX] Extend to next scene start OR total duration
                next_scene_start = None
                
                # Check if there's a next scene
                if i < len(scenes) - 1:
                    # Get next scene's voice start
                    next_scene_start = self._get_next_scene_voice_start_from_idx(
                        search_start_idx, timestamps
                    )
                else:
                    # Last scene: extend to total audio duration
                    total_voice_duration = self.get_total_voice_duration({'timestamps': timestamps})
                    if total_voice_duration > timing.end:
                        next_scene_start = total_voice_duration

                if next_scene_start and next_scene_start > timing.end:
                    # Extend this scene's end to next scene's start (or total duration)
                    timing = VoiceTiming(
                        start=timing.start,
                        end=next_scene_start,
                        duration=next_scene_start - timing.start,
                        word_count=timing.word_count
                    )

                result[scene_id] = timing
            else:
                # Fallback to script timing for this scene
                result[scene_id] = VoiceTiming(
                    start=scene.get('startTime', 0),
                    end=scene.get('startTime', 0) + scene.get('duration', 5),
                    duration=scene.get('duration', 5),
                    word_count=0
                )

        return result

    def _get_next_scene_voice_start_from_idx(
        self,
        start_idx: int,
        timestamps: List[Dict[str, Any]]
    ) -> Optional[float]:
        """
        Get the voice start time from a specific index.

        Args:
            start_idx: Index to get start time from
            timestamps: Voice timestamps

        Returns:
            Start time or None if index out of bounds
        """
        if start_idx >= len(timestamps):
            return None
        return timestamps[start_idx]['start']

    def find_scene_timing(
        self,
        scene_text: str,
        timestamps: List[Dict[str, Any]],
        search_start_idx: int = 0
    ) -> Optional[Tuple[VoiceTiming, int]]:
        """
        Find voice timing boundaries for a scene's text.

        Args:
            scene_text: Text content of the scene
            timestamps: List of word timestamp dicts from voice.json
            search_start_idx: Index to start searching from (for sequential scenes)

        Returns:
            Tuple of (VoiceTiming, last_index) or None if no match found
        """
        if not scene_text or not timestamps:
            return None

        # Normalize scene text
        scene_words = self._normalize_text(scene_text)
        if not scene_words:
            return None

        # Find first word of scene in timestamps (starting from search_start_idx)
        first_word = scene_words[0]
        last_word = scene_words[-1]

        first_idx = self._find_word_index(first_word, timestamps, start_from=search_start_idx)
        if first_idx is None:
            return None

        # Find last word starting from first word position
        last_idx = self._find_word_index(
            last_word, timestamps,
            start_from=first_idx,
            search_forward=True
        )

        if last_idx is None:
            # Try to estimate by counting expected words
            expected_word_count = len(scene_words)
            last_idx = min(first_idx + expected_word_count - 1, len(timestamps) - 1)

        # Get timing from timestamps
        start_time = timestamps[first_idx]['start']
        end_time = timestamps[last_idx]['end']

        return VoiceTiming(
            start=start_time,
            end=end_time,
            duration=end_time - start_time,
            word_count=last_idx - first_idx + 1
        ), last_idx

    def _normalize_text(self, text: str) -> List[str]:
        """
        Normalize text to list of lowercase words.

        Handles Vietnamese diacritics and common punctuation.

        Args:
            text: Input text

        Returns:
            List of normalized words
        """
        # Keep Vietnamese characters, remove only punctuation
        # \w includes unicode letters, but we also want to keep numbers
        text = re.sub(r'[.,!?;:"\'\(\)\[\]{}%]', '', text.lower())
        words = text.split()
        # Filter empty strings
        return [w for w in words if w]

    def _find_word_index(
        self,
        word: str,
        timestamps: List[Dict[str, Any]],
        start_from: int = 0,
        search_forward: bool = True
    ) -> Optional[int]:
        """
        Find index of a word in timestamps.

        Uses fuzzy matching to handle punctuation differences and numbers.

        Args:
            word: Word to find (normalized)
            timestamps: List of timestamp dicts
            start_from: Index to start searching from
            search_forward: If True, search forward; if False, search backward

        Returns:
            Index of word or None if not found
        """
        word_lower = word.lower()
        # Remove punctuation for comparison
        word_clean = re.sub(r'[.,!?;:"\'\(\)\[\]{}%]', '', word_lower)

        if search_forward:
            indices = range(start_from, len(timestamps))
        else:
            indices = range(start_from, -1, -1)

        for i in indices:
            ts_word = timestamps[i].get('word', '')
            if not ts_word:
                continue

            ts_word_clean = re.sub(r'[.,!?;:"\'\(\)\[\]{}%]', '', ts_word.lower())

            # Exact match
            if ts_word_clean == word_clean:
                return i

            # Partial match (prefix)
            if len(word_clean) >= 2 and len(ts_word_clean) >= 2:
                if ts_word_clean.startswith(word_clean) or word_clean.startswith(ts_word_clean):
                    return i

            # Number handling (70 matches 70%)
            if word_clean.isdigit() and ts_word_clean.isdigit():
                if word_clean == ts_word_clean:
                    return i

        return None

    def _get_next_scene_voice_start(
        self,
        current_idx: int,
        scenes: List[Dict[str, Any]],
        timestamps: List[Dict[str, Any]]
    ) -> Optional[float]:
        """
        Get the voice start time of the next scene.

        Args:
            current_idx: Index of current scene
            scenes: List of all scenes
            timestamps: Voice timestamps

        Returns:
            Start time of next scene's voice or None
        """
        if current_idx >= len(scenes) - 1:
            return None

        next_scene = scenes[current_idx + 1]
        next_text = next_scene.get('text', '')

        if not next_text:
            return None

        next_words = self._normalize_text(next_text)
        if not next_words:
            return None

        # Find first word of next scene
        first_word_idx = self._find_word_index(next_words[0], timestamps, start_from=0)

        if first_word_idx is not None:
            return timestamps[first_word_idx]['start']

        return None

    def _fallback_to_script_timing(
        self,
        scenes: List[Dict[str, Any]]
    ) -> Dict[str, VoiceTiming]:
        """
        Fallback to using script.json timing when no voice timestamps.

        Args:
            scenes: List of scene dicts

        Returns:
            Dict mapping scene_id to VoiceTiming from script
        """
        result = {}

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')
            start = scene.get('startTime', 0)
            duration = scene.get('duration', 5)

            result[scene_id] = VoiceTiming(
                start=start,
                end=start + duration,
                duration=duration,
                word_count=0
            )

        return result

    def get_total_voice_duration(
        self,
        voice_data: Dict[str, Any]
    ) -> float:
        """
        Get total duration from voice timestamps.

        Args:
            voice_data: Parsed voice.json

        Returns:
            Total duration in seconds
        """
        timestamps = voice_data.get('timestamps', [])
        if not timestamps:
            return 0.0

        # Find last word's end time
        return timestamps[-1].get('end', 0.0)

    def validate_sync(
        self,
        scene_timings: Dict[str, VoiceTiming],
        expected_duration: float,
        tolerance: float = 3.0
    ) -> Tuple[bool, str]:
        """
        Validate that synced timings are reasonable.

        Args:
            scene_timings: Mapped scene timings
            expected_duration: Expected total duration
            tolerance: Acceptable difference in seconds

        Returns:
            (is_valid, message) tuple
        """
        if not scene_timings:
            return False, "No scene timings found"

        # Get max end time
        max_end = max(t.end for t in scene_timings.values())

        diff = abs(max_end - expected_duration)
        if diff > tolerance:
            return False, f"Duration mismatch: {max_end:.1f}s vs expected {expected_duration:.1f}s"

        return True, f"Sync OK: {len(scene_timings)} scenes, {max_end:.1f}s total"
