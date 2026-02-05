"""
Project Initializer
===================
Initialize video project with resources probing and script.json creation.
"""

import json
import subprocess
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime


class ProjectInitializer:
    """
    Initialize video project:
    - Create project directory
    - Probe video/audio/image resources using ffprobe
    - Create initial script.json with metadata + fullText + userResources
    """

    def __init__(self):
        """Initialize ProjectInitializer."""
        # Mood detection keywords (Vietnamese + English)
        self.mood_keywords = {
            'epic': ['chiến', 'đấu', 'mạnh mẽ', 'anh hùng', 'vĩ đại', 'epic', 'powerful', 'battle', 'fight', 'warrior', 'hero'],
            'happy': ['vui', 'hạnh phúc', 'yêu', 'thích', 'tuyệt vời', 'happy', 'joy', 'love', 'fun', 'excited', 'amazing', 'great'],
            'sad': ['buồn', 'đau', 'khóc', 'mất', 'nhớ', 'sad', 'pain', 'cry', 'loss', 'miss', 'lonely', 'heartbreak'],
            'calm': ['bình yên', 'thư giãn', 'nhẹ nhàng', 'yên tĩnh', 'calm', 'peaceful', 'relax', 'gentle', 'soft', 'quiet', 'meditation'],
            'inspiring': ['động lực', 'truyền cảm hứng', 'thành công', 'mục tiêu', 'inspiring', 'motivation', 'success', 'goal', 'dream', 'achieve'],
            'mysterious': ['bí ẩn', 'kỳ lạ', 'sự thật', 'khám phá', 'mystery', 'strange', 'secret', 'discover', 'unknown', 'curious'],
            'energetic': ['năng lượng', 'sôi động', 'phấn khích', 'nhanh', 'energetic', 'dynamic', 'fast', 'active', 'upbeat', 'pumped'],
            'romantic': ['lãng mạn', 'tình yêu', 'cặp đôi', 'hẹn hò', 'romantic', 'love', 'couple', 'date', 'heart', 'wedding'],
            'dramatic': ['kịch tính', 'căng thẳng', 'hồi hộp', 'bất ngờ', 'dramatic', 'tense', 'suspense', 'twist', 'shocking'],
            'corporate': ['công ty', 'doanh nghiệp', 'chuyên nghiệp', 'business', 'corporate', 'professional', 'company', 'startup', 'enterprise']
        }

    @staticmethod
    def check_ffprobe() -> bool:
        """Check if ffprobe is installed."""
        return shutil.which('ffprobe') is not None

    @staticmethod
    def probe_video_metadata(file_path: str) -> Dict[str, Any]:
        """
        Probe video/audio file using ffprobe.

        Args:
            file_path: Path to video/audio file

        Returns:
            {
                'type': 'video' | 'audio',
                'duration': float,
                'resolution': str (video only),
                'width': int (video only),
                'height': int (video only),
                'hasAudio': bool,
                'videoCodec': str (video only),
                'audioCodec': str,
                'fileSize': int
            }
        """
        if not ProjectInitializer.check_ffprobe():
            raise RuntimeError("ffprobe not found. Install: brew install ffmpeg")

        file_path_obj = Path(file_path).expanduser().resolve()
        if not file_path_obj.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Run ffprobe
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            str(file_path_obj)
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
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

        format_info = data.get('format', {})
        duration = float(format_info.get('duration', 0))
        file_size = int(format_info.get('size', 0))

        # Determine type
        is_video = video_stream is not None

        if is_video:
            width = int(video_stream.get('width', 0))
            height = int(video_stream.get('height', 0))
            resolution = f"{width}x{height}"

            fps_str = video_stream.get('r_frame_rate', '30/1')
            if '/' in fps_str:
                num, denom = fps_str.split('/')
                fps = float(num) / float(denom) if float(denom) != 0 else 30.0
            else:
                fps = float(fps_str)

            video_codec = video_stream.get('codec_name', 'unknown')

            return {
                'type': 'video',
                'duration': duration,
                'resolution': resolution,
                'width': width,
                'height': height,
                'fps': fps,
                'hasAudio': audio_stream is not None,
                'videoCodec': video_codec,
                'audioCodec': audio_stream.get('codec_name') if audio_stream else None,
                'fileSize': file_size
            }
        else:
            # Audio only
            return {
                'type': 'audio',
                'duration': duration,
                'hasAudio': True,
                'audioCodec': audio_stream.get('codec_name') if audio_stream else 'unknown',
                'fileSize': file_size
            }

    @staticmethod
    def probe_image_metadata(file_path: str) -> Dict[str, Any]:
        """
        Probe image file using ffprobe.

        Args:
            file_path: Path to image file

        Returns:
            {
                'type': 'image',
                'width': int,
                'height': int,
                'resolution': str,
                'fileSize': int
            }
        """
        if not ProjectInitializer.check_ffprobe():
            raise RuntimeError("ffprobe not found. Install: brew install ffmpeg")

        file_path_obj = Path(file_path).expanduser().resolve()
        if not file_path_obj.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Run ffprobe
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            str(file_path_obj)
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffprobe failed: {e.stderr}")

        # Parse video stream (images are detected as video streams)
        video_stream = next(
            (s for s in data.get('streams', []) if s['codec_type'] == 'video'),
            None
        )

        if not video_stream:
            raise RuntimeError("Not a valid image file")

        width = int(video_stream.get('width', 0))
        height = int(video_stream.get('height', 0))
        resolution = f"{width}x{height}"

        format_info = data.get('format', {})
        file_size = int(format_info.get('size', 0))

        return {
            'type': 'image',
            'width': width,
            'height': height,
            'resolution': resolution,
            'fileSize': file_size
        }

    def _analyze_music_mood(self, full_text: str, description: str) -> str:
        """
        Analyze script content to determine appropriate music mood.

        Args:
            full_text: Full script/narration text
            description: Video description

        Returns:
            Mood string: 'calm', 'epic', 'happy', 'sad', 'inspiring', etc.
        """
        # Combine text for analysis
        combined_text = f"{description} {full_text}".lower()

        # Count keyword matches for each mood
        mood_scores = {}
        for mood, keywords in self.mood_keywords.items():
            score = sum(1 for keyword in keywords if keyword.lower() in combined_text)
            if score > 0:
                mood_scores[mood] = score

        # Return highest scoring mood, or 'calm' as default
        if mood_scores:
            return max(mood_scores, key=mood_scores.get)
        return 'calm'

    def _generate_music_query(self, full_text: str, description: str) -> str:
        """
        Generate music search query based on script content.

        Args:
            full_text: Full script/narration text
            description: Video description

        Returns:
            Search query string for music API
        """
        mood = self._analyze_music_mood(full_text, description)

        # Mood to query mapping
        mood_queries = {
            'epic': 'epic cinematic orchestral',
            'happy': 'upbeat happy cheerful',
            'sad': 'emotional piano melancholy',
            'calm': 'calm ambient peaceful',
            'inspiring': 'motivational inspiring uplifting',
            'mysterious': 'mysterious dark ambient',
            'energetic': 'energetic upbeat electronic',
            'romantic': 'romantic piano love',
            'dramatic': 'dramatic tension cinematic',
            'corporate': 'corporate upbeat professional'
        }

        return mood_queries.get(mood, 'background ambient calm')

    def create_initial_script(
        self,
        project_dir: str,
        description: str,
        full_text: str,
        ratio: str = '9:16',
        resources: List[str] = None,
        project_name: str = None
    ) -> Dict[str, Any]:
        """
        Create initial script.json for unified video type.

        Args:
            project_dir: Project directory path (will be created if not exists)
            description: Video description from user
            full_text: Full narration text (voiceover)
            ratio: Aspect ratio (9:16, 16:9, 1:1, 4:5)
            resources: List of resource file paths (video, audio, image)
            project_name: Optional project name (defaults to dir name)

        Returns:
            Dict with script data + summary
        """
        # 1. Create project directory
        project_path = Path(project_dir).expanduser().resolve()
        project_path.mkdir(parents=True, exist_ok=True)

        # 2. Determine project name
        if not project_name:
            project_name = project_path.name

        # 3. Probe resources
        user_resources = []
        if resources:
            for resource_path in resources:
                resource_file = Path(resource_path).expanduser().resolve()

                if not resource_file.exists():
                    print(f"⚠️  Warning: Resource not found: {resource_path}")
                    continue

                # Detect type by extension
                ext = resource_file.suffix.lower()

                try:
                    if ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.mp3', '.wav', '.m4a']:
                        # Video or audio
                        metadata = self.probe_video_metadata(str(resource_file))

                        user_resources.append({
                            'path': str(resource_file),
                            'type': metadata['type'],
                            'duration': metadata.get('duration'),
                            'resolution': metadata.get('resolution'),
                            'width': metadata.get('width'),
                            'height': metadata.get('height'),
                            'hasAudio': metadata.get('hasAudio', False),
                            'assignedToScene': None,
                            'trim': None
                        })

                    elif ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                        # Image
                        metadata = self.probe_image_metadata(str(resource_file))

                        user_resources.append({
                            'path': str(resource_file),
                            'type': 'image',
                            'width': metadata['width'],
                            'height': metadata['height'],
                            'resolution': metadata['resolution'],
                            'assignedToScene': None
                        })

                    else:
                        print(f"⚠️  Warning: Unsupported file type: {ext}")

                except Exception as e:
                    print(f"⚠️  Warning: Failed to probe {resource_path}: {e}")

        # 4. Calculate ratio dimensions
        ratio_dimensions = {
            "9:16": (1080, 1920),
            "16:9": (1920, 1080),
            "1:1": (1080, 1080),
            "4:5": (1080, 1350)
        }
        width, height = ratio_dimensions.get(ratio, (1080, 1920))

        # 5. Build script.json
        # Safeguard: Log warning if full_text looks like a path
        if full_text and (full_text.startswith('public/projects/') or full_text.endswith('.txt')):
             print(f"⚠️  Warning: full_text looks like a file path: {full_text}")
             print("   This might lead to 'path as text' issues.")

        script_data = {
            'metadata': {
                'projectName': project_name,
                'videoType': 'unified',
                'description': description,
                'duration': None,  # Will be set after sync
                'ratio': ratio,
                'width': width,
                'height': height,
                'platform': 'shorts',
                'createdAt': datetime.now().isoformat()
            },
            'script': {
                'fullText': full_text,
                'wordCount': len(full_text.split()),
                'estimatedDuration': None  # Will be calculated after voice generation
            },
            'userResources': user_resources,
            'sections': [],  # Empty initially, will be populated by add-section
            'voice': {
                'provider': None,  # Will be set during voice generation
                'voiceId': None,
                'speed': 1.0,
                'audioPath': None
            },
            'music': {
                'mood': self._analyze_music_mood(full_text, description),
                'query': self._generate_music_query(full_text, description),
                'volume': 0.15,
                'fadeIn': 2,
                'fadeOut': 3
            },
            'subtitle': {
                'enabled': True,
                'theme': 'gold-bold',
                'position': 'bottom'
            }
        }

        # 6. Save script.json
        script_file = project_path / 'script.json'
        with open(script_file, 'w', encoding='utf-8') as f:
            json.dump(script_data, f, indent=2, ensure_ascii=False)

        # 7. Generate summary
        summary = {
            'scriptPath': str(script_file),
            'projectName': project_name,
            'ratio': ratio,
            'fullTextLength': len(full_text),
            'wordCount': script_data['script']['wordCount'],
            'userResourcesCount': len(user_resources),
            'userResources': [
                {
                    'path': r['path'],
                    'type': r['type'],
                    'duration': r.get('duration'),
                    'resolution': r.get('resolution')
                }
                for r in user_resources
            ]
        }

        return summary


# CLI for testing
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 5:
        print("Usage:")
        print("  python project_initializer.py <project_dir> <description> <full_text> <ratio> [resource1] [resource2] ...")
        print()
        print("Example:")
        print('  python project_initializer.py ~/projects/test "Test video" "Hello world" 9:16 ~/video.mp4')
        sys.exit(1)

    project_dir = sys.argv[1]
    description = sys.argv[2]
    full_text = sys.argv[3]
    ratio = sys.argv[4]
    resources = sys.argv[5:] if len(sys.argv) > 5 else []

    initializer = ProjectInitializer()

    try:
        summary = initializer.create_initial_script(
            project_dir=project_dir,
            description=description,
            full_text=full_text,
            ratio=ratio,
            resources=resources
        )

        print("✅ Project initialized successfully!")
        print(f"   Script: {summary['scriptPath']}")
        print(f"   Project: {summary['projectName']}")
        print(f"   Ratio: {summary['ratio']}")
        print(f"   Word count: {summary['wordCount']}")
        print(f"   Resources: {summary['userResourcesCount']}")

        if summary['userResources']:
            print("\n📦 User Resources:")
            for res in summary['userResources']:
                print(f"   - {res['type']}: {res['path']}")
                if res.get('duration'):
                    print(f"     Duration: {res['duration']}s")
                if res.get('resolution'):
                    print(f"     Resolution: {res['resolution']}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
