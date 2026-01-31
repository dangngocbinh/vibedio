"""Time conversion utilities."""
import opentimelineio as otio


def seconds_to_frames(seconds: float, fps: int = 30) -> int:
    """
    Convert seconds to frame count.

    Args:
        seconds: Time in seconds
        fps: Frames per second (default: 30)

    Returns:
        Frame count (int)
    """
    return int(seconds * fps)


def seconds_to_rational_time(seconds: float, fps: int = 30) -> otio.opentime.RationalTime:
    """
    Convert seconds to OTIO RationalTime.

    Args:
        seconds: Time in seconds
        fps: Frames per second (default: 30)

    Returns:
        RationalTime object
    """
    frames = seconds_to_frames(seconds, fps)
    return otio.opentime.RationalTime(value=frames, rate=fps)


def frames_to_seconds(frames: int, fps: int = 30) -> float:
    """
    Convert frames to seconds.

    Args:
        frames: Frame count
        fps: Frames per second (default: 30)

    Returns:
        Time in seconds (float)
    """
    return frames / fps


def rational_time_to_seconds(rt: otio.opentime.RationalTime) -> float:
    """
    Convert OTIO RationalTime to seconds.

    Args:
        rt: RationalTime object

    Returns:
        Time in seconds (float)
    """
    return rt.value / rt.rate


def create_time_range(start_seconds: float, duration_seconds: float, fps: int = 30) -> otio.opentime.TimeRange:
    """
    Create OTIO TimeRange from start and duration in seconds.

    Args:
        start_seconds: Start time in seconds
        duration_seconds: Duration in seconds
        fps: Frames per second (default: 30)

    Returns:
        TimeRange object
    """
    start_time = seconds_to_rational_time(start_seconds, fps)
    duration = seconds_to_rational_time(duration_seconds, fps)

    return otio.opentime.TimeRange(
        start_time=start_time,
        duration=duration
    )
