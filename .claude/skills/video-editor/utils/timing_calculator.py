"""Timing and frame calculation utilities."""
import opentimelineio as otio
from typing import Dict, List, Tuple


class TimingCalculator:
    """Handles all time-related calculations for OTIO timelines."""

    def __init__(self, fps: int = 30):
        """
        Initialize TimingCalculator.

        Args:
            fps: Frames per second (default: 30)
        """
        self.fps = fps

    def seconds_to_frames(self, seconds: float) -> int:
        """
        Convert seconds to frame count.

        Args:
            seconds: Duration in seconds

        Returns:
            Frame count (rounded)
        """
        return round(seconds * self.fps)

    def frames_to_seconds(self, frames: int) -> float:
        """
        Convert frames to seconds.

        Args:
            frames: Frame count

        Returns:
            Duration in seconds
        """
        return frames / self.fps

    def create_rational_time(self, seconds: float) -> otio.opentime.RationalTime:
        """
        Create OTIO RationalTime from seconds.

        Args:
            seconds: Duration in seconds

        Returns:
            RationalTime object
        """
        return otio.opentime.RationalTime(
            self.seconds_to_frames(seconds),
            self.fps
        )

    def create_time_range(self, start_sec: float, duration_sec: float) -> otio.opentime.TimeRange:
        """
        Create OTIO TimeRange from start and duration in seconds.

        Args:
            start_sec: Start time in seconds
            duration_sec: Duration in seconds

        Returns:
            TimeRange object
        """
        return otio.opentime.TimeRange(
            start_time=self.create_rational_time(start_sec),
            duration=self.create_rational_time(duration_sec)
        )

    def calculate_scene_positions(self, scenes: List[Dict]) -> Dict[str, Tuple[float, float]]:
        """
        Calculate start and end times for each scene.

        Args:
            scenes: List of scene dicts from script.json

        Returns:
            Dict mapping scene_id to (start_time, end_time) in seconds
        """
        positions = {}

        for scene in scenes:
            scene_id = scene.get('id', '')
            start = scene.get('startTime', 0)
            duration = scene.get('duration', 0)
            end = start + duration

            positions[scene_id] = (start, end)

        return positions

    def calculate_total_duration(self, scenes: List[Dict]) -> float:
        """
        Calculate total duration from scenes list.

        Args:
            scenes: List of scene dicts

        Returns:
            Total duration in seconds
        """
        if not scenes:
            return 0.0

        max_end = 0.0
        for scene in scenes:
            start = scene.get('startTime', 0)
            duration = scene.get('duration', 0)
            end = start + duration
            max_end = max(max_end, end)

        return max_end

    def validate_timing_consistency(self, scenes: List[Dict], expected_duration: float) -> Tuple[bool, str]:
        """
        Validate that scene timings are consistent with expected duration.

        Args:
            scenes: List of scene dicts
            expected_duration: Expected total duration in seconds

        Returns:
            (is_valid, error_message) tuple
        """
        total = self.calculate_total_duration(scenes)

        tolerance = 3.0  # ±3 seconds tolerance
        diff = abs(total - expected_duration)

        if diff > tolerance:
            return False, f"Scene duration mismatch: {total}s (expected {expected_duration}s, diff: {diff}s)"

        return True, ""
