"""Component factory for creating Remotion component clips with consistent metadata."""
from typing import Dict, Any, Optional
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator


class ComponentFactory:
    """Static factory methods for creating component clips with consistent metadata structure."""

    @staticmethod
    def create_layer_title(
        text: str,
        start_time: float,
        duration: float,
        style: str = 'highlight',
        position: str = 'bottom',
        fps: int = 30,
        subtitle: str = ''
    ) -> otio.schema.Clip:
        """
        Create LayerTitle overlay clip.

        Args:
            text: Title text
            start_time: Start time in seconds (globalTimelineStart)
            duration: Duration in seconds
            style: Title style ('highlight', 'bold', 'clean', etc.)
            position: Position on screen ('top', 'center', 'bottom')
            fps: Frames per second
            subtitle: Optional subtitle text

        Returns:
            OTIO Clip with LayerTitle metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Title: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LayerTitle'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'title': text,
            'position': position,
            'style': style,
        }

        if subtitle:
            clip.metadata['props']['subtitle'] = subtitle

        return clip

    @staticmethod
    def create_lower_third(
        title: str,
        start_time: float,
        duration: float,
        template: str = 'modern-skew',
        subtitle: str = '',
        primary_color: str = '#3498db',
        secondary_color: str = '#ffffff',
        text_color: str = '#2c3e50',
        fps: int = 30
    ) -> otio.schema.Clip:
        """
        Create LowerThird overlay clip.

        Args:
            title: Main title text
            start_time: Start time in seconds
            duration: Duration in seconds
            template: Template name
            subtitle: Optional subtitle text
            primary_color: Primary color hex
            secondary_color: Secondary color hex
            text_color: Text color hex
            fps: Frames per second

        Returns:
            OTIO Clip with LowerThird metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"LowerThird: {title[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LowerThird'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'title': title,
            'template': template,
            'primaryColor': primary_color,
            'secondaryColor': secondary_color,
            'textColor': text_color,
        }

        if subtitle:
            clip.metadata['props']['subtitle'] = subtitle

        return clip

    @staticmethod
    def create_section_title_card(
        text: str,
        duration: float,
        style: str = 'default',
        subtitle: str = '',
        fps: int = 30
    ) -> otio.schema.Clip:
        """
        Create SectionTitleCard fullscreen title card.

        Args:
            text: Title text
            duration: Duration in seconds
            style: Card style ('default', 'bold', 'minimal', etc.)
            subtitle: Optional subtitle text
            fps: Frames per second

        Returns:
            OTIO Clip with SectionTitleCard metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=f"Title Card: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'SectionTitleCard'
        clip.metadata['props'] = {
            'text': text,
            'style': style,
        }

        if subtitle:
            clip.metadata['props']['subtitle'] = subtitle

        return clip

    @staticmethod
    def create_sticker(
        emoji: str,
        start_time: float,
        duration: float,
        position: str = 'center',
        size: str = 'medium',
        animation: str = 'bounce',
        fps: int = 30
    ) -> otio.schema.Clip:
        """
        Create Sticker overlay clip.

        Args:
            emoji: Emoji or sticker content
            start_time: Start time in seconds (globalTimelineStart)
            duration: Duration in seconds
            position: Position on screen ('top-left', 'top-right', 'center', etc.)
            size: Sticker size ('small', 'medium', 'large')
            animation: Animation type ('bounce', 'spin', 'fade', 'none')
            fps: Frames per second

        Returns:
            OTIO Clip with Sticker metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Sticker: {emoji}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'Sticker'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'emoji': emoji,
            'position': position,
            'size': size,
            'animation': animation,
        }

        return clip

    @staticmethod
    def create_cta(
        text: str,
        start_time: float,
        duration: float,
        action: str = 'subscribe',
        style: str = 'default',
        position: str = 'bottom',
        fps: int = 30
    ) -> otio.schema.Clip:
        """
        Create CallToAction overlay clip.

        Args:
            text: CTA text
            start_time: Start time in seconds (globalTimelineStart)
            duration: Duration in seconds
            action: Action type ('subscribe', 'like', 'follow', 'visit', etc.)
            style: CTA style ('default', 'bold', 'animated')
            position: Position on screen ('top', 'center', 'bottom')
            fps: Frames per second

        Returns:
            OTIO Clip with CallToAction metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"CTA: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'CallToAction'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'text': text,
            'action': action,
            'style': style,
            'position': position,
        }

        return clip

    @staticmethod
    def create_layer_effect(
        effect_type: str,
        start_time: float,
        duration: float,
        intensity: float = 0.5,
        fps: int = 30,
        **effect_params
    ) -> otio.schema.Clip:
        """
        Create LayerEffect overlay clip.

        Args:
            effect_type: Effect type ('zoom', 'blur', 'shake', 'flash', etc.)
            start_time: Start time in seconds (globalTimelineStart)
            duration: Duration in seconds
            intensity: Effect intensity (0.0 to 1.0)
            fps: Frames per second
            **effect_params: Additional effect parameters

        Returns:
            OTIO Clip with LayerEffect metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Effect: {effect_type}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['remotion_component'] = 'LayerEffect'
        clip.metadata['globalTimelineStart'] = str(start_time)
        clip.metadata['props'] = {
            'effect': effect_type,
            'intensity': intensity,
            **effect_params
        }

        return clip

    @staticmethod
    def create_caption(
        text: str,
        words: list,
        start_time: float,
        duration: float,
        theme: str = 'clean-minimal',
        position: str = 'bottom',
        fps: int = 30,
        font: Optional[str] = None,
        highlight_color: Optional[str] = None
    ) -> otio.schema.Clip:
        """
        Create TikTokCaption subtitle clip.

        Args:
            text: Caption text
            words: List of word timestamp dicts
            start_time: Start time in seconds
            duration: Duration in seconds
            theme: Caption theme ('clean-minimal', 'bold', 'neon', etc.)
            position: Position on screen ('top', 'center', 'bottom')
            fps: Frames per second
            font: Optional font override
            highlight_color: Optional highlight color override

        Returns:
            OTIO Clip with TikTokCaption metadata
        """
        timing = TimingCalculator(fps)
        media_ref = otio.schema.MissingReference()
        source_range = timing.create_time_range(start_time, duration)

        clip = otio.schema.Clip(
            name=f"Sub: {text[:20]}...",
            media_reference=media_ref,
            source_range=source_range
        )

        props = {
            'text': text,
            'words': words,
            'theme': theme,
            'position': position,
        }

        if font:
            props['font'] = font
        if highlight_color:
            props['highlightColor'] = highlight_color

        clip.metadata['remotion_component'] = 'TikTokCaption'
        clip.metadata['props'] = props

        return clip
