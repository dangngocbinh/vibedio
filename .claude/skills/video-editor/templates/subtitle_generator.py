"""Subtitle track generation from voice timestamps."""
from typing import Dict, List, Any
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator


class SubtitleGenerator:
    """Generates subtitle track from voice.json timestamps."""

    def __init__(self, fps: int = 30):
        """
        Initialize SubtitleGenerator.

        Args:
            fps: Frames per second
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)

    def generate_track(
        self,
        voice_data: Dict[str, Any],
        script: Dict[str, Any],
        max_words_per_phrase: int = 5,
        offset: float = 0.0
    ) -> otio.schema.Track:
        """
        Generate subtitle track with word-level timing.

        Args:
            voice_data: Parsed voice.json with timestamps
            script: Parsed script.json for subtitle style config
            max_words_per_phrase: Maximum words per subtitle phrase (default: 5)
            offset: Time offset in seconds to shift all subtitles (sync with voice offset)

        Returns:
            OTIO Track with subtitle clips
        """
        track = otio.schema.Track(name="Captions", kind=otio.schema.TrackKind.Video)

        timestamps = voice_data.get('timestamps', [])
        if not timestamps:
            return track

        # Group words into phrases (using original relative timestamps)
        phrases = self._group_into_phrases(timestamps, max_words_per_phrase)

        # Get subtitle style from script
        subtitle_style = script.get('subtitle', {})

        # Create clip for each phrase with offset applied
        for phrase in phrases:
            # Apply offset to phrase timing and internal words
            phrase['start'] += offset
            phrase['end'] += offset
            for word in phrase['words']:
                word['start'] += offset
                word['end'] += offset
                
            clip = self._create_subtitle_clip(phrase, subtitle_style)
            track.append(clip)

        return track

    def _group_into_phrases(
        self,
        timestamps: List[Dict[str, Any]],
        max_words: int
    ) -> List[Dict[str, Any]]:
        """
        Group words into readable phrases.

        Groups based on:
        1. Pause duration (>0.5s pause = new phrase)
        2. Max words per phrase limit
        3. Punctuation breaks

        Args:
            timestamps: List of word timestamp dicts
            max_words: Maximum words per phrase

        Returns:
            List of phrase dicts with {text, words, start, end}
        """
        if not timestamps:
            return []

        phrases = []
        current_words = []
        phrase_start = timestamps[0]['start']

        for i, word_data in enumerate(timestamps):
            current_words.append(word_data)

            # Check if we should break into new phrase
            should_break = False

            # Break if max words reached
            if len(current_words) >= max_words:
                should_break = True

            # Break on long pause (if not last word)
            if i < len(timestamps) - 1:
                next_word = timestamps[i + 1]
                pause_duration = next_word['start'] - word_data['end']
                if pause_duration > 0.5:
                    should_break = True

            # Break on punctuation
            word_text = word_data['word']
            if word_text.endswith(('.', '!', '?', ',')):
                should_break = True

            # Last word always breaks
            if i == len(timestamps) - 1:
                should_break = True

            # Create phrase if break condition met
            if should_break and current_words:
                phrase_end = current_words[-1]['end']
                phrase_text = ' '.join(w['word'] for w in current_words)

                phrases.append({
                    'text': phrase_text,
                    'words': current_words.copy(),
                    'start': phrase_start,
                    'end': phrase_end,
                    'duration': phrase_end - phrase_start
                })

                # Reset for next phrase
                current_words = []
                if i < len(timestamps) - 1:
                    phrase_start = timestamps[i + 1]['start']

        return phrases

    def _create_subtitle_clip(
        self,
        phrase: Dict[str, Any],
        subtitle_style: Dict[str, Any]
    ) -> otio.schema.Clip:
        """
        Create subtitle clip for a phrase.

        Args:
            phrase: Phrase dict with text, words, start, end
            subtitle_style: Subtitle style config from script.json

        Returns:
            OTIO Clip with TikTokCaption metadata
        """
        # Create media reference (missing for component)
        media_ref = otio.schema.MissingReference()

        # Create source range
        start_sec = phrase['start']
        duration_sec = phrase['duration']
        source_range = self.timing.create_time_range(start_sec, duration_sec)

        # Create clip
        clip = otio.schema.Clip(
            name=f"Sub: {phrase['text'][:20]}...",
            media_reference=media_ref,
            source_range=source_range
        )

        # Add Remotion component metadata
        clip.metadata['remotion_component'] = 'TikTokCaption'
        clip.metadata['props'] = {
            'text': phrase['text'],
            'words': phrase['words'],
            'theme': subtitle_style.get('theme', 'gold-bold'),  # Default theme
            'position': subtitle_style.get('position', 'bottom'),  # Default to bottom for TikTok style
            'font': subtitle_style.get('font'),  # Let theme handle default
            'highlightColor': subtitle_style.get('highlightColor'),  # Let theme handle default
        }

        return clip

    def calculate_subtitle_coverage(
        self,
        voice_data: Dict[str, Any],
        expected_duration: float
    ) -> float:
        """
        Calculate what percentage of video has subtitles.

        Args:
            voice_data: Parsed voice.json
            expected_duration: Expected total duration in seconds

        Returns:
            Coverage percentage (0.0 - 1.0)
        """
        timestamps = voice_data.get('timestamps', [])
        if not timestamps or expected_duration == 0:
            return 0.0

        # Calculate total subtitle duration
        first_word_start = timestamps[0]['start']
        last_word_end = timestamps[-1]['end']
        subtitle_duration = last_word_end - first_word_start

        return subtitle_duration / expected_duration
