"""
Video Processing Utilities
===========================

Xử lý video files: extract metadata, extract audio
Requires: ffmpeg, ffprobe (install: brew install ffmpeg)

Author: Multi-Video-Edit Feature
Created: 2026-01-28
"""

import subprocess
import json
import shutil
from pathlib import Path
from typing import Dict, Optional


class VideoProcessor:
    """
    Video processing utilities using FFmpeg/FFprobe
    
    Features:
    - Check if ffmpeg/ffprobe installed
    - Extract video metadata (duration, resolution, fps, hasAudio)
    - Extract audio from video to MP3
    """
    
    @staticmethod
    def check_dependencies() -> Dict[str, bool]:
        """
        Check if ffmpeg and ffprobe are installed
        
        Returns:
            {
                'ffmpeg': True/False,
                'ffprobe': True/False,
                'all_installed': True/False
            }
        """
        ffmpeg_ok = shutil.which('ffmpeg') is not None
        ffprobe_ok = shutil.which('ffprobe') is not None
        
        return {
            'ffmpeg': ffmpeg_ok,
            'ffprobe': ffprobe_ok,
            'all_installed': ffmpeg_ok and ffprobe_ok
        }
    
    @staticmethod
    def get_installation_instruction() -> str:
        """Return installation instruction for macOS"""
        return """
FFmpeg is not installed. Please install it:

macOS:
    brew install ffmpeg

Linux (Ubuntu/Debian):
    sudo apt-get install ffmpeg

Linux (CentOS/RHEL):
    sudo yum install ffmpeg

After installation, restart your terminal and try again.
"""
    
    @staticmethod
    def get_video_metadata(video_path: str) -> Dict:
        """
        Extract video metadata using ffprobe
        
        Args:
            video_path: Path to video file (absolute or relative)
        
        Returns:
            {
                'duration': float,          # Duration in seconds
                'resolution': str,          # e.g. "1920x1080"
                'width': int,
                'height': int,
                'fps': float,               # Frames per second
                'hasAudio': bool,
                'videoCodec': str,          # e.g. "h264"
                'audioCodec': str|None,     # e.g. "aac" or None
                'fileSize': int             # File size in bytes
            }
        
        Raises:
            RuntimeError: If ffprobe not found
            FileNotFoundError: If video file not found
            subprocess.CalledProcessError: If ffprobe fails
        """
        # Check dependencies
        deps = VideoProcessor.check_dependencies()
        if not deps['ffprobe']:
            raise RuntimeError(
                "ffprobe not found. " + 
                VideoProcessor.get_installation_instruction()
            )
        
        # Check file exists
        video_path_obj = Path(video_path).expanduser().resolve()
        if not video_path_obj.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Run ffprobe
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            str(video_path_obj)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            data = json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffprobe failed: {e.stderr}")
        
        # Parse streams
        video_stream = next(
            (s for s in data.get('streams', []) if s['codec_type'] == 'video'),
            None
        )
        audio_stream = next(
            (s for s in data.get('streams', []) if s['codec_type'] == 'audio'),
            None
        )
        
        # Extract metadata
        format_info = data.get('format', {})
        duration = float(format_info.get('duration', 0))
        file_size = int(format_info.get('size', 0))
        
        if video_stream:
            width = int(video_stream.get('width', 0))
            height = int(video_stream.get('height', 0))
            resolution = f"{width}x{height}"
            
            # Parse FPS (frame rate)
            fps_str = video_stream.get('r_frame_rate', '30/1')
            if '/' in fps_str:
                num, denom = fps_str.split('/')
                fps = float(num) / float(denom)
            else:
                fps = float(fps_str)
            
            video_codec = video_stream.get('codec_name', 'unknown')
        else:
            width = height = 0
            resolution = "0x0"
            fps = 0.0
            video_codec = None
        
        audio_codec = audio_stream.get('codec_name') if audio_stream else None
        
        return {
            'duration': duration,
            'resolution': resolution,
            'width': width,
            'height': height,
            'fps': fps,
            'hasAudio': audio_stream is not None,
            'videoCodec': video_codec,
            'audioCodec': audio_codec,
            'fileSize': file_size
        }
    
    @staticmethod
    def extract_audio(
        video_path: str,
        output_audio_path: str,
        quality: int = 2  # 0-9, lower is better
    ) -> Path:
        """
        Extract audio from video to MP3 file
        
        Args:
            video_path: Path to source video
            output_audio_path: Path to output MP3 file
            quality: MP3 quality (0-9, 2 = ~190kbps, good balance)
        
        Returns:
            Path object of created audio file
        
        Raises:
            RuntimeError: If ffmpeg not found or extraction fails
            FileNotFoundError: If video file not found
        """
        # Check dependencies
        deps = VideoProcessor.check_dependencies()
        if not deps['ffmpeg']:
            raise RuntimeError(
                "ffmpeg not found. " + 
                VideoProcessor.get_installation_instruction()
            )
        
        # Check video exists
        video_path_obj = Path(video_path).expanduser().resolve()
        if not video_path_obj.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Create output directory if needed
        output_path_obj = Path(output_audio_path).expanduser().resolve()
        output_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        # Run ffmpeg
        cmd = [
            'ffmpeg',
            '-i', str(video_path_obj),
            '-vn',  # No video
            '-acodec', 'libmp3lame',
            '-q:a', str(quality),  # Quality
            '-y',  # Overwrite output file
            str(output_path_obj)
        ]
        
        try:
            subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg audio extraction failed: {e.stderr}")
        
        return output_path_obj


# CLI for testing
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Check dependencies: python video_processor.py check")
        print("  Get metadata:       python video_processor.py metadata <video_path>")
        print("  Extract audio:      python video_processor.py extract <video_path> <output.mp3>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'check':
        deps = VideoProcessor.check_dependencies()
        print(f"FFmpeg installed: {deps['ffmpeg']}")
        print(f"FFprobe installed: {deps['ffprobe']}")
        if not deps['all_installed']:
            print(VideoProcessor.get_installation_instruction())
            sys.exit(1)
        else:
            print("✅ All dependencies installed!")
    
    elif command == 'metadata':
        if len(sys.argv) < 3:
            print("Error: Video path required")
            sys.exit(1)
        
        video_path = sys.argv[2]
        try:
            metadata = VideoProcessor.get_video_metadata(video_path)
            print(json.dumps(metadata, indent=2))
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
    
    elif command == 'extract':
        if len(sys.argv) < 4:
            print("Error: Video path and output path required")
            sys.exit(1)
        
        video_path = sys.argv[2]
        output_path = sys.argv[3]
        
        try:
            result = VideoProcessor.extract_audio(video_path, output_path)
            print(f"✅ Audio extracted to: {result}")
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
