"""Inspect OTIO timeline structure - view tracks, clips, and metadata."""

import opentimelineio as otio
from pathlib import Path
from typing import Dict, List, Any


class TimelineInspector:
    """Inspect and analyze OTIO timeline structure."""

    def __init__(self, project_file: str):
        """
        Initialize timeline inspector.

        Args:
            project_file: Path to project.otio file
        """
        self.project_file = project_file
        self.timeline = None

        # Load timeline
        if not Path(project_file).exists():
            raise FileNotFoundError(f"Project file not found: {project_file}")

        self.timeline = otio.adapters.read_from_file(project_file)

    def get_timeline_info(self) -> Dict[str, Any]:
        """Get overall timeline metadata."""
        return {
            'name': self.timeline.name,
            'duration_seconds': self.timeline.duration().to_seconds() if self.timeline.duration() else 0,
            'track_count': len(self.timeline.tracks),
            'metadata': dict(self.timeline.metadata) if self.timeline.metadata else {}
        }

    def get_track_info(self, track_index: int) -> Dict[str, Any]:
        """Get info about specific track."""
        if track_index >= len(self.timeline.tracks):
            raise IndexError(f"Track {track_index} out of range")

        track = self.timeline.tracks[track_index]

        clips = []
        for i, item in enumerate(track):
            clips.append({
                'index': i,
                'type': type(item).__name__,
                'name': item.name if hasattr(item, 'name') else 'Unknown',
                'duration_seconds': item.duration().to_seconds() if hasattr(item, 'duration') else 0,
            })

        return {
            'index': track_index,
            'name': track.name,
            'kind': str(track.kind) if hasattr(track, 'kind') else 'Video',
            'item_count': len(track),
            'items': clips
        }

    def get_all_tracks(self) -> List[Dict[str, Any]]:
        """Get info about all tracks."""
        tracks = []
        for i in range(len(self.timeline.tracks)):
            tracks.append(self.get_track_info(i))
        return tracks

    def print_timeline_summary(self):
        """Print human-readable timeline summary."""
        info = self.get_timeline_info()

        print("=" * 80)
        print(f"Timeline: {info['name']}")
        print("=" * 80)
        print(f"Duration: {info['duration_seconds']:.1f}s")
        print(f"Tracks: {info['track_count']}")
        print()

        for track_info in self.get_all_tracks():
            print(f"Track {track_info['index']}: {track_info['name']}")
            print(f"  Kind: {track_info['kind']}")
            print(f"  Items: {track_info['item_count']}")

            if track_info['items']:
                for item in track_info['items']:
                    print(f"    [{item['index']}] {item['name']:<30} {item['type']:<12} ({item['duration_seconds']:.2f}s)")
            else:
                print("    (empty)")

            print()

    def get_clip_at_index(self, track_index: int, clip_index: int) -> Dict[str, Any]:
        """Get detailed info about specific clip."""
        track = self.timeline.tracks[track_index]

        if clip_index >= len(track):
            raise IndexError(f"Clip {clip_index} not in track {track_index}")

        item = track[clip_index]

        info = {
            'track_index': track_index,
            'clip_index': clip_index,
            'name': item.name if hasattr(item, 'name') else 'Unknown',
            'type': type(item).__name__,
            'duration_seconds': item.duration().to_seconds() if hasattr(item, 'duration') else 0,
        }

        # Get source info if it's a clip
        if isinstance(item, otio.schema.Clip):
            if item.media_reference:
                info['media_reference'] = str(item.media_reference.target_url) if hasattr(item.media_reference, 'target_url') else str(item.media_reference)
            if item.source_range:
                info['source_duration_seconds'] = item.source_range.duration.to_seconds()

        return info

    def find_clip_by_name(self, name: str) -> List[Dict[str, Any]]:
        """Find clips by name across all tracks."""
        results = []

        for track_idx, track in enumerate(self.timeline.tracks):
            for clip_idx, item in enumerate(track):
                if hasattr(item, 'name') and name.lower() in item.name.lower():
                    results.append({
                        'track_index': track_idx,
                        'track_name': track.name,
                        'clip_index': clip_idx,
                        'clip_name': item.name,
                        'type': type(item).__name__,
                    })

        return results

    def get_gaps(self) -> List[Dict[str, Any]]:
        """Find all gaps in timeline."""
        gaps = []

        for track_idx, track in enumerate(self.timeline.tracks):
            for clip_idx, item in enumerate(track):
                if isinstance(item, otio.schema.Gap):
                    gaps.append({
                        'track_index': track_idx,
                        'track_name': track.name,
                        'gap_index': clip_idx,
                        'duration_seconds': item.duration().to_seconds(),
                    })

        return gaps

    def get_transitions(self) -> List[Dict[str, Any]]:
        """Find all transitions in timeline."""
        transitions = []

        for track_idx, track in enumerate(self.timeline.tracks):
            for clip_idx, item in enumerate(track):
                if isinstance(item, otio.schema.Transition):
                    transitions.append({
                        'track_index': track_idx,
                        'track_name': track.name,
                        'transition_index': clip_idx,
                        'type': str(item.transition_type) if hasattr(item, 'transition_type') else 'Unknown',
                        'duration_seconds': item.duration().to_seconds() if hasattr(item, 'duration') else 0,
                    })

        return transitions

    def export_as_dict(self) -> Dict[str, Any]:
        """Export entire timeline as dictionary."""
        return {
            'timeline': self.get_timeline_info(),
            'tracks': self.get_all_tracks(),
            'gaps': self.get_gaps(),
            'transitions': self.get_transitions(),
        }

    def print_detailed_info(self, track_index: int = 0):
        """Print detailed info about specific track."""
        track_info = self.get_track_info(track_index)

        print(f"\nTrack {track_index}: {track_info['name']} ({track_info['kind']})")
        print("-" * 80)
        print(f"Items: {track_info['item_count']}\n")

        if not track_info['items']:
            print("(empty)")
            return

        # Print with better formatting
        for item in track_info['items']:
            print(f"[{item['index']}] {item['name']}")
            print(f"    Type: {item['type']}")
            print(f"    Duration: {item['duration_seconds']:.2f}s")
            print()
