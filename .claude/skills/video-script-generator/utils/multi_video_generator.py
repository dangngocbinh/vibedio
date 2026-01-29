"""
Multi-Video Edit Script Generator
=================================

Main workflow để tạo script.json cho multi-video-edit type

Features:
1. Process multiple source videos
2. Extract audio + metadata
3. Create initial script.json structure
4. AI agent (Antigravity) will analyze content and update script during conversation

Note: Content analysis is done by AI agent directly, không cần gọi external AI APIs.

Author: Multi-Video-Edit Feature
Created: 2026-01-28
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import subprocess
from .video_processor import VideoProcessor


class MultiVideoEditGenerator:
    """
    Generator cho multi-video-edit type scripts
    
    Workflow:
    1. generate_initial_script() - Tạo script.json với sourceVideos, empty transcript
    2. analyze_and_update_script() - Sau khi có transcript, AI phân tích và update
    """
    
    def __init__(self, project_dir: str):
        """
        Initialize generator
        
        Args:
            project_dir: Path to project directory (e.g. public/projects/my-edit)
        """
        self.project_dir = Path(project_dir).expanduser().resolve()
        self.project_name = self.project_dir.name
        
        # Create subfolders
        (self.project_dir / "audio").mkdir(parents=True, exist_ok=True)
        (self.project_dir / "thumbnails").mkdir(parents=True, exist_ok=True)
        (self.project_dir / "broll").mkdir(parents=True, exist_ok=True)
    
    def generate_initial_script(
        self,
        video_paths: List[str],
        ratio: str = "9:16",
        platform: str = "shorts"
    ) -> Dict:
        """
        Generate initial script.json với sourceVideos processed
        
        Args:
            video_paths: List of video file paths or URLs
            ratio: Video aspect ratio (9:16, 16:9, 1:1, 4:5)
            platform: Target platform (shorts, tiktok, youtube, reels)
        
        Returns:
            Generated script dict
        
        Steps:
        1. Check ffmpeg dependencies
        2. Process each video (metadata + audio extraction)
        3. Create script.json with empty transcript
        4. Return script + next steps instruction
        """
        # Step 1: Check dependencies
        deps = VideoProcessor.check_dependencies()
        if not deps['all_installed']:
            raise RuntimeError(
                "FFmpeg/FFprobe not installed.\n" +
                VideoProcessor.get_installation_instruction()
            )
        
        # Step 2: Process videos
        source_videos = []
        total_duration = 0
        
        for idx, video_path in enumerate(video_paths):
            video_id = f"video_{idx + 1}"
            
            print(f"Processing {video_id}: {video_path}")
            
            # Get metadata
            try:
                metadata = VideoProcessor.get_video_metadata(video_path)
            except Exception as e:
                raise RuntimeError(f"Failed to get metadata for {video_path}: {e}")
            
            # Extract audio if has audio
            audio_relative_path = None
            if metadata['hasAudio']:
                audio_output = self.project_dir / "audio" / f"{video_id}.mp3"
                print(f"  Extracting audio to {audio_output.name}...")
                
                try:
                    VideoProcessor.extract_audio(video_path, audio_output)
                    audio_relative_path = f"audio/{video_id}.mp3"
                except Exception as e:
                    print(f"  Warning: Audio extraction failed: {e}")
                    audio_relative_path = None
            
            # Add to source videos
            source_videos.append({
                "id": video_id,
                "order": idx + 1,
                "path": str(video_path),
                "duration": metadata['duration'],
                "audioPath": audio_relative_path,
                "hasAudio": metadata['hasAudio'] and audio_relative_path is not None,
                "metadata": {
                    "resolution": metadata['resolution'],
                    "fps": metadata['fps'],
                    "videoCodec": metadata['videoCodec'],
                    "audioCodec": metadata['audioCodec'],
                    "fileSize": metadata['fileSize']
                }
            })
            
            total_duration += metadata['duration']
            print(f"  ✅ Processed: {metadata['duration']:.1f}s, {metadata['resolution']}")
        
            total_duration += metadata['duration']
            print(f"  ✅ Processed: {metadata['duration']:.1f}s, {metadata['resolution']}")
        
        # Step 3: Auto-Transcribe Audio (NEW)
        print("\n🎙️  Auto-transcribing audio files...")
        full_transcript_text = []
        all_timestamps = []
        current_offset = 0.0
        
        for video in source_videos:
            if not video['hasAudio'] or not video['audioPath']:
                current_offset += video['duration']
                continue
                
            audio_abs_path = self.project_dir / video['audioPath']
            print(f"  Transcribing {video['id']}...")
            
            try:
                transcription = self._transcribe_audio_file(str(audio_abs_path))
                if transcription:
                    # Append text
                    if transcription.get('text'):
                        full_transcript_text.append(transcription['text'])
                    
                    # Shift timestamps and append
                    # Each timestamp: {word, start, end} -> shift start/end by current_offset
                    # Also add sourceVideoId
                    for ts in transcription.get('timestamps', []):
                        new_ts = ts.copy()
                        new_ts['start'] = ts['start'] + current_offset
                        new_ts['end'] = ts['end'] + current_offset
                        new_ts['sourceVideoId'] = video['id']
                        all_timestamps.append(new_ts)
                        
            except Exception as e:
                print(f"  ❌ Transcription failed for {video['id']}: {e}")
                print("  Continuing without transcript for this file.")
            
            current_offset += video['duration']

        # Step 4: Build initial script
        # Determine width/height từ ratio
        ratio_dimensions = {
            "9:16": (1080, 1920),
            "16:9": (1920, 1080),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350)
        }
        width, height = ratio_dimensions.get(ratio, (1080, 1920))
        
        script = {
            "metadata": {
                "projectName": self.project_name,
                "videoType": "multi-video-edit",
                "duration": None,  # Will be set after content analysis
                "ratio": ratio,
                "width": width,
                "height": height,
                "platform": platform,
                "targetAudience": "",
                "createdAt": datetime.now().isoformat()
            },
            
            "sourceVideos": source_videos,
            
            "transcript": {
                "fullText": " ".join(full_transcript_text),
                "language": "vi",
                "timestamps": all_timestamps,
                "provider": "auto-transcribed",
                "transcribedAt": datetime.now().isoformat()
            },
            
            "scenes": [],  # Will be filled after content analysis
            
            "subtitle": {
                "style": "highlight-word",
                "position": "center",
                "font": "Montserrat",
                "highlightColor": "#FFD700"
            },
            
            "voice": {
                "provider": None,  # No voice generation for multi-video-edit
                "voiceId": None
            },
            
            "music": {
                "enabled": True,
                "query": "background calm gentle",
                "mood": "calm",
                "genre": "ambient",
                "volume": 0.08,  # Lower because có audio gốc
                "fadeIn": 2.0,
                "fadeOut": 2.0
            }
        }
        
        # Step 4: Save script.json
        script_path = self.project_dir / "script.json"
        with open(script_path, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Initial script created: {script_path}")
        print(f"   Total duration: {total_duration:.1f}s")
        print(f"   Source videos: {len(source_videos)}")
        
        return {
            "scriptPath": str(script_path),
            "projectDir": str(self.project_dir),
            "totalDuration": total_duration,
            "sourceVideosCount": len(source_videos),
            "audioFiles": [f"{self.project_dir}/audio/{v['id']}.mp3" for v in source_videos if v.get('hasAudio')],
            "nextSteps": [
                f"✅ Audio transcribed successfully",
                f"   Total words: {len(all_timestamps)}",
                "",
                "Next: AI Agent will now analyze the content to:",
                "  • Identify structure (hook, body, outro)",
                "  • Create Title Cards",
                "  • Suggest B-roll"
            ]
        }

    def _transcribe_audio_file(self, audio_path: str) -> Optional[Dict]:
        """
        Call generate-timestamps.js to transcribe audio
        Returns: {text: str, timestamps: []}
        """
        # Resolve path to the node script
        # Assuming current file is in .agent/skills/video-script-generator/utils/
        # and script is in .agent/skills/voice-generation/scripts/
        script_path = Path(__file__).parent.parent.parent / "voice-generation" / "scripts" / "generate-timestamps.js"
        
        if not script_path.exists():
            raise FileNotFoundError(f"Transcription script not found at {script_path}")
            
        cmd = [
            "node",
            str(script_path),
            "--audio", audio_path,
            "--provider", "auto" # Use auto to fallback if needed
        ]
        
        try:
            # Run node script
            subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True
            )
            
            # The script outputs a JSON file next to the audio file
            audio_path_obj = Path(audio_path)
            json_path = audio_path_obj.parent / (audio_path_obj.stem + ".json")
            
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {
                        "text": data.get("text"),
                        "timestamps": data.get("timestamps", [])
                    }
            return None
            
        except subprocess.CalledProcessError as e:
            print(f"Node script error: {e.stderr}")
            raise RuntimeError("Transcription script failed")
    
    
    def update_transcript(
        self,
        transcript_data: Dict
    ) -> Dict:
        """
        Update script.json với transcript (WITHOUT AI analysis)
        
        AI agent sẽ tự phân tích content, method này chỉ update transcript field.
        
        Args:
            transcript_data: {
                "fullText": str,
                "timestamps": [{"word": str, "start": float, "end": float}],
                "provider": str (optional),
                "language": str (optional)
            }
        
        Returns:
            Updated script dict
        """
        # Load existing script
        script_path = self.project_dir / "script.json"
        if not script_path.exists():
            raise FileNotFoundError(f"script.json not found in {self.project_dir}")
        
        with open(script_path, 'r', encoding='utf-8') as f:
            script = json.load(f)
        
        # Update transcript only
        script['transcript']['fullText'] = transcript_data.get('fullText', '')
        script['transcript']['timestamps'] = transcript_data.get('timestamps', [])
        script['transcript']['provider'] = transcript_data.get('provider', 'manual')
        script['transcript']['language'] = transcript_data.get('language', 'vi')
        script['transcript']['transcribedAt'] = datetime.now().isoformat()
        
        # Calculate total duration
        total_duration = sum(v['duration'] for v in script['sourceVideos'])
        script['metadata']['duration'] = total_duration
        
        # Map timestamps to sourceVideoId
        video_timeline_map = self._build_video_timeline_map(script['sourceVideos'])
        
        for ts in script['transcript']['timestamps']:
            ts_time = ts.get('start', 0)
            vid_id, _ = self._find_source_video(ts_time, video_timeline_map)
            if vid_id:
                ts['sourceVideoId'] = vid_id
        
        # Save updated script
        with open(script_path, 'w', encoding='utf-8') as f:
            json.dump(script, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Transcript updated: {script_path}")
        print(f"   Total words: {len(script['transcript']['timestamps'])}")
        print(f"   Duration: {total_duration:.1f}s")
        
        return script
    
    def _build_video_timeline_map(self, source_videos: List[Dict]) -> Dict:
        """
        Build map: timeline range → videoId
        
        Returns:
            {
                "video_1": {"start": 0, "end": 15.5, "duration": 15.5},
                "video_2": {"start": 15.5, "end": 32.8, "duration": 17.3}
            }
        """
        timeline_map = {}
        position = 0
        
        for video in source_videos:
            timeline_map[video['id']] = {
                'start': position,
                'end': position + video['duration'],
                'duration': video['duration']
            }
            position += video['duration']
        
        return timeline_map
    
    def _find_source_video(
        self,
        global_time: float,
        timeline_map: Dict
    ) -> tuple[Optional[str], float]:
        """
        Find which sourceVideoId at given global time
        
        Returns:
            (videoId, local_time_in_video) or (None, 0)
        """
        for video_id, range_info in timeline_map.items():
            if range_info['start'] <= global_time < range_info['end']:
                local_time = global_time - range_info['start']
                return (video_id, local_time)
        
        return (None, 0)
    
        return ' '.join(words) if words else transcript_data.get('fullText', '')[:200]

    def find_segment_by_natural_language(
        self,
        query: str,
        transcript_data: Dict
    ) -> Optional[Dict]:
        """
        Find a video segment matching user's natural language description.
        Returns start/end times and source video ID.
        """
        query_lower = query.lower()
        full_text = transcript_data.get('fullText', '').lower()
        timestamps = transcript_data.get('timestamps', [])
        
        # 1. Exact/Partial Match in Transcript
        if query_lower in full_text:
            # Find start and end timestamp for this match
            # This is a naive implementation; for better results we'd need fuzzy search
            # finding the sequence of words.
            pass
            
        # 2. Iterate timestamps to find word sequence
        # "đoạn nói về giấc ngủ" -> match words "giấc ngủ"
        # Return the range surrounding these words
        
        matched_indices = []
        for idx, ts in enumerate(timestamps):
            if ts.get('word', '').lower() in query_lower:
                matched_indices.append(idx)
        
        if not matched_indices:
            return None
            
        # Group indices to find the most dense cluster
        # (Simplified: just take the range of matched words)
        start_idx = matched_indices[0]
        end_idx = matched_indices[-1]
        
        # Expand context slightly (e.g. sentence boundary if possible)
        start_time = timestamps[start_idx].get('start', 0)
        end_time = timestamps[end_idx].get('end', 0)
        
        # Determine source video
        # We might span multiple videos, but usually a segment is within one.
        # Let's verify sourceVideoId of start/end
        
        # We need the source videos duration map (not passed here, but we can load script)
        # Assuming transcript_data includes sourceVideoId if updated, 
        # or we rely on timestamps being global or local?
        # In this class, we use global scripts.
        
        return {
            "start": start_time,
            "end": end_time,
            "text": self._extract_text_in_range(transcript_data, start_time, end_time)
        }


# Helper functions để user dễ call
def generate_multi_video_script(
    video_paths: List[str],
    project_name: str,
    ratio: str = "9:16"
) -> Dict:
    """
    Helper function để generate initial script
    
    Args:
        video_paths: List of video file paths/URLs
        project_name: Project folder name
        ratio: Aspect ratio (9:16, 16:9, 1:1, 4:5)
    
    Returns:
        Result dict với scriptPath và nextSteps
    """
    project_dir = Path(f"public/projects/{project_name}")
    generator = MultiVideoEditGenerator(project_dir)
    
    return generator.generate_initial_script(video_paths, ratio)


def update_script_transcript(
    project_dir: str,
    transcript_data: Dict
) -> Dict:
    """
    Helper function để update script với transcript
    
    Note: Chỉ update transcript, AI agent sẽ tự phân tích content sau.
    
    Args:
        project_dir: Path to project directory
        transcript_data: Transcript với timestamps
    
    Returns:
        Updated script dict
    """
    generator = MultiVideoEditGenerator(project_dir)
    return generator.update_transcript(transcript_data)
