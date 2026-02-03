"""Helper utility for Short video (9:16) layout logic."""
from typing import Dict, Any, List, Optional, Tuple


class ShortLayoutHelper:
    """
    Helper for Short video (9:16) layout logic.

    Provides utilities for:
    - Detecting landscape input content
    - Suggesting layout presets based on content
    - Suggesting background types
    - Finding background resources
    - Suggesting content positioning modes
    - Calculating safe zone positions
    - Mapping presets to title/caption positions
    """

    # Safe zone boundaries (in pixels for 1080x1920 canvas)
    SAFE_ZONES = {
        'top_danger': (0, 180),           # Platform buttons (pause, sound, menu)
        'header_safe': (180, 350),        # Main title area
        'content_zone': (350, 1400),      # Video + overlays
        'footer_safe': (1400, 1720),      # Descriptions, CTAs
        'bottom_danger': (1720, 1920),    # Progress bar
        'left_margin': 60,                # Safe left margin
        'right_margin': 160,              # Extra padding for social icons
        'right_danger': (920, 1080),      # Social icons (like/comment/share)
    }

    # Layout preset configurations
    PRESET_CONFIGS = {
        'header-footer': {
            'main_title': {'position': 'top', 'y_range': (200, 320)},
            'secondary_title': {'y_start': 400, 'y_end': 500},
            'captions': {'position': 'bottom-high', 'y_range': (900, 1300)},
            'footer': {'y_start': 1500, 'y_end': 1680},
        },
        'minimal': {
            'branding': {'corner': 'top-left', 'y': 200},
            'captions': {'position': 'bottom', 'y': 1720},
        },
        'text-heavy': {
            'main_title': {'position': 'top', 'y': 200},
            'overlays': {'stagger': True, 'y_range': (500, 1200)},
            'cta': {'y_start': 1600},
        },
        'balanced': {
            'dynamic': True  # Calculate based on content
        }
    }

    @staticmethod
    def detect_landscape_input(resources: Dict[str, Any]) -> bool:
        """
        Check if any scene uses landscape video/image.

        Args:
            resources: Parsed resources.json

        Returns:
            True if landscape content detected (aspect ratio > 1.2)
        """
        resources_data = resources.get('resources', {})

        # Check videos
        for video_entry in resources_data.get('videos', []):
            for result in video_entry.get('results', []):
                # Check if width/height info available
                width = result.get('width', 0)
                height = result.get('height', 1)
                if width and height and (width / height) > 1.2:
                    return True

        # Check images
        for image_entry in resources_data.get('images', []):
            for result in image_entry.get('results', []):
                width = result.get('width', 0)
                height = result.get('height', 1)
                if width and height and (width / height) > 1.2:
                    return True

        # Check pinned resources
        for pinned in resources_data.get('pinnedResources', []):
            width = pinned.get('width', 0)
            height = pinned.get('height', 1)
            if width and height and (width / height) > 1.2:
                return True

        # Default: assume landscape if no dimension data (conservative)
        # This triggers background track creation, which is safe
        return True

    @staticmethod
    def suggest_layout_preset(scenes: List[Dict[str, Any]], metadata: Dict[str, Any]) -> str:
        """
        Suggest layout preset based on content.

        Args:
            scenes: List of scenes from script.json
            metadata: Metadata from script.json

        Returns:
            Layout preset name: 'header-footer', 'minimal', 'text-heavy', 'balanced'
        """
        num_scenes = len(scenes)
        video_type = metadata.get('videoType', '')
        duration = metadata.get('duration', 60)

        # Rule 1: Many scenes + listicle → header-footer
        if num_scenes > 5 and video_type == 'listicle':
            return 'header-footer'

        # Rule 2: Short duration + single/few scenes → minimal
        if duration < 30 and num_scenes <= 2:
            return 'minimal'

        # Rule 3: Long text in scenes → text-heavy
        total_text_length = sum(len(scene.get('text', '')) for scene in scenes)
        avg_text_per_scene = total_text_length / max(num_scenes, 1)
        if avg_text_per_scene > 100:  # Long text per scene
            return 'text-heavy'

        # Rule 4: Default → balanced
        return 'balanced'

    @staticmethod
    def suggest_background_type(resources: Dict[str, Any], scene_id: str) -> str:
        """
        Suggest background type for a scene.

        Args:
            resources: Parsed resources.json
            scene_id: Scene identifier

        Returns:
            Background type: 'custom-video', 'custom-image', 'blur-original', 'gradient', 'auto'
        """
        resources_data = resources.get('resources', {})
        bg_resources = resources_data.get('backgroundResources', {})

        # Rule 1: If backgroundResources has video for scene → custom-video
        for bg_video in bg_resources.get('videos', []):
            if bg_video.get('sceneId') == scene_id:
                return 'custom-video'

        # Rule 2: If backgroundResources has image for scene → custom-image
        for bg_image in bg_resources.get('images', []):
            if bg_image.get('sceneId') == scene_id:
                return 'custom-image'

        # Rule 3: Check main content type
        # If main content is video → blur-original
        for video_entry in resources_data.get('videos', []):
            if video_entry.get('sceneId') == scene_id:
                return 'blur-original'

        # Rule 4: If main content is image → gradient
        for image_entry in resources_data.get('images', []):
            if image_entry.get('sceneId') == scene_id:
                return 'gradient'

        # Rule 5: Default → auto (will use blur-original fallback)
        return 'auto'

    @staticmethod
    def find_background_resource(resources: Dict[str, Any], scene_id: str, bg_type: str) -> Optional[str]:
        """
        Find background video/image for a scene.

        Args:
            resources: Parsed resources.json
            scene_id: Scene identifier
            bg_type: Background type ('custom-video' or 'custom-image')

        Returns:
            localPath or URL of background resource, or None if not found
        """
        resources_data = resources.get('resources', {})
        bg_resources = resources_data.get('backgroundResources', {})

        if bg_type == 'custom-video':
            for bg_video in bg_resources.get('videos', []):
                if bg_video.get('sceneId') == scene_id:
                    # Return localPath, relativePath, or url (in priority order)
                    return (bg_video.get('localPath') or
                            bg_video.get('relativePath') or
                            bg_video.get('url'))

        elif bg_type == 'custom-image':
            for bg_image in bg_resources.get('images', []):
                if bg_image.get('sceneId') == scene_id:
                    return (bg_image.get('localPath') or
                            bg_image.get('relativePath') or
                            bg_image.get('url'))

        return None

    @staticmethod
    def suggest_content_positioning(resources: Dict[str, Any], scene_id: str) -> str:
        """
        Suggest content positioning mode.

        Args:
            resources: Parsed resources.json
            scene_id: Scene identifier

        Returns:
            Positioning mode: 'centered', 'crop-to-fill', 'zoom', 'ken-burns'
        """
        resources_data = resources.get('resources', {})

        # Check if content is portrait or square
        for video_entry in resources_data.get('videos', []):
            if video_entry.get('sceneId') == scene_id:
                for result in video_entry.get('results', []):
                    width = result.get('width', 0)
                    height = result.get('height', 1)
                    if width and height:
                        aspect_ratio = width / height
                        # Portrait or square → crop-to-fill
                        if aspect_ratio <= 1.2:
                            return 'crop-to-fill'
                        # Landscape video → centered
                        return 'centered'

        # Check images
        for image_entry in resources_data.get('images', []):
            if image_entry.get('sceneId') == scene_id:
                for result in image_entry.get('results', []):
                    width = result.get('width', 0)
                    height = result.get('height', 1)
                    if width and height:
                        aspect_ratio = width / height
                        # Portrait or square image → crop-to-fill
                        if aspect_ratio <= 1.2:
                            return 'crop-to-fill'
                        # Landscape image → ken-burns (animated)
                        return 'ken-burns'

        # Default → centered
        return 'centered'

    @staticmethod
    def calculate_safe_positions(preset: str, canvas_height: int = 1920) -> Dict[str, Any]:
        """
        Return safe zone positions for a preset.

        Args:
            preset: Layout preset name
            canvas_height: Canvas height in pixels (default: 1920 for 9:16)

        Returns:
            Dict with position info:
            {
                'main_title': (y_start, y_end),
                'secondary_title': (y_start, y_end),
                'captions': (y_start, y_end),
                'footer': (y_start, y_end),
                'right_margin': 160,
                'left_margin': 60
            }
        """
        config = ShortLayoutHelper.PRESET_CONFIGS.get(preset, {})

        # Default positions based on safe zones
        positions = {
            'right_margin': ShortLayoutHelper.SAFE_ZONES['right_margin'],
            'left_margin': ShortLayoutHelper.SAFE_ZONES['left_margin'],
        }

        # Extract positions from config
        if 'main_title' in config:
            y_range = config['main_title'].get('y_range', (200, 320))
            positions['main_title'] = y_range

        if 'secondary_title' in config:
            y_start = config['secondary_title'].get('y_start', 400)
            y_end = config['secondary_title'].get('y_end', 500)
            positions['secondary_title'] = (y_start, y_end)

        if 'captions' in config:
            y_range = config['captions'].get('y_range', (900, 1300))
            positions['captions'] = y_range

        if 'footer' in config:
            y_start = config['footer'].get('y_start', 1500)
            y_end = config['footer'].get('y_end', 1680)
            positions['footer'] = (y_start, y_end)

        return positions

    @staticmethod
    def get_title_position_for_preset(preset: str, layer_type: str) -> str:
        """
        Map preset + layer type to caption position.

        Args:
            preset: Layout preset name
            layer_type: Layer type ('main_title', 'captions', 'footer', etc.)

        Returns:
            Caption position string: 'top', 'center', 'bottom', 'bottom-high'
        """
        config = ShortLayoutHelper.PRESET_CONFIGS.get(preset, {})

        # Get position from config
        layer_config = config.get(layer_type, {})
        position = layer_config.get('position')

        if position:
            return position

        # Fallback defaults
        if layer_type == 'main_title':
            return 'top'
        elif layer_type == 'captions':
            return 'bottom-high'  # Center-ish, common for captions
        elif layer_type == 'footer':
            return 'bottom'

        # Default
        return 'center'

    @staticmethod
    def is_short_format(metadata: Dict[str, Any]) -> bool:
        """
        Check if video is Short format (9:16).

        Args:
            metadata: Metadata from script.json

        Returns:
            True if ratio is 9:16
        """
        ratio = metadata.get('ratio', '9:16')
        return ratio == '9:16'

    @staticmethod
    def should_create_background_track(metadata: Dict[str, Any], resources: Dict[str, Any]) -> bool:
        """
        Determine if background track should be created.

        Args:
            metadata: Metadata from script.json
            resources: Parsed resources.json

        Returns:
            True if background track needed (9:16 video with landscape input)
        """
        # Only for 9:16 videos
        if not ShortLayoutHelper.is_short_format(metadata):
            return False

        # Check if landscape input detected
        has_landscape = ShortLayoutHelper.detect_landscape_input(resources)

        return has_landscape

    @staticmethod
    def get_background_props(bg_type: str, metadata: Dict[str, Any], main_content_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Get Remotion component props for background based on type.

        Args:
            bg_type: Background type
            metadata: Metadata from script.json
            main_content_url: URL of main content (for blur-original)

        Returns:
            Dict with component name and props
        """
        if bg_type == 'blur-original':
            return {
                'component': 'VideoWithEffects',
                'props': {
                    'blur': 20,
                    'opacity': 0.7,
                    'scaleMode': 'cover',
                    'brightness': 0.8
                }
            }

        elif bg_type == 'gradient':
            primary_color = metadata.get('primaryColor', '#1a1a2e')
            return {
                'component': 'GradientBackground',
                'props': {
                    'colors': [primary_color, '#16213e'],
                    'direction': 'vertical',
                    'animated': True
                }
            }

        elif bg_type == 'solid-color':
            bg_color = metadata.get('backgroundColor', '#000000')
            return {
                'component': 'SolidColor',
                'props': {
                    'color': bg_color
                }
            }

        elif bg_type in ('custom-video', 'custom-image'):
            component = 'VideoWithEffects' if bg_type == 'custom-video' else 'ImageWithEffects'
            return {
                'component': component,
                'props': {
                    'scaleMode': 'cover',
                    'opacity': 1.0
                }
            }

        # Default: blur-original
        return {
            'component': 'VideoWithEffects',
            'props': {
                'blur': 20,
                'opacity': 0.7,
                'scaleMode': 'cover',
                'brightness': 0.8
            }
        }

    @staticmethod
    def get_content_positioning_props(positioning_mode: str, scene_duration: float = 10) -> Dict[str, Any]:
        """
        Get Remotion component props for content positioning.

        Args:
            positioning_mode: Positioning mode
            scene_duration: Scene duration in seconds (for ken-burns)

        Returns:
            Dict with positioning props
        """
        if positioning_mode == 'centered':
            return {
                'objectFit': 'contain',  # CSS objectFit value
                'maxWidth': '90%',  # CSS string value
                'style': {
                    'margin': 'auto'  # Center horizontally
                }
            }

        elif positioning_mode == 'crop-to-fill':
            return {
                'objectFit': 'cover',
                'maxWidth': '100%'
            }

        elif positioning_mode == 'zoom':
            return {
                'objectFit': 'cover',
                'style': {
                    'transform': 'scale(1.2)'
                }
            }

        elif positioning_mode == 'ken-burns':
            return {
                'animation': 'ken-burns',
                'zoomFrom': 1.0,
                'zoomTo': 1.15,
                'panDuration': scene_duration
            }

        # Default: centered
        return {
            'scaleMode': 'fit',
            'maxWidth': 0.9,
            'centered': True,
            'verticalAlign': 'center'
        }
