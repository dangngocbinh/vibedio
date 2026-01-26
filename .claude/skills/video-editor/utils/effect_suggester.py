"""Effect and transition suggestion utilities.

Rule-based suggestion for image effects and scene transitions
based on content analysis.
"""
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import re


@dataclass
class EffectSuggestion:
    """Suggested effect for an image/scene."""
    effect: str  # 'zoom-in', 'zoom-out', 'ken-burns', 'slide', 'scale', 'none'
    direction: str  # 'left', 'right', 'up', 'down', 'random'
    intensity: float  # 0.0 - 1.0 (how strong the effect is)
    reason: str  # Why this effect was chosen


@dataclass
class TransitionSuggestion:
    """Suggested transition between scenes."""
    transition: str  # 'crossfade', 'cut', 'dissolve', 'wipe', 'none'
    duration: float  # Duration in seconds
    reason: str  # Why this transition was chosen


class EffectSuggester:
    """
    Suggests effects and transitions based on content analysis.

    Uses rule-based keyword matching for fast, predictable suggestions
    without requiring external AI API calls.
    """

    # Effect rules: keyword patterns → effect type
    EFFECT_RULES = [
        # Zoom in for close-ups, faces, details
        {
            'keywords': ['face', 'portrait', 'close', 'detail', 'eye', 'hand', 'small', 'tiny', 'macro'],
            'effect': 'zoom-in',
            'intensity': 0.7,
            'reason': 'Close-up subject benefits from zoom-in'
        },
        # Zoom out for reveals, wide shots
        {
            'keywords': ['reveal', 'wide', 'full', 'whole', 'entire', 'overview'],
            'effect': 'zoom-out',
            'intensity': 0.6,
            'reason': 'Wide shot benefits from zoom-out reveal'
        },
        # Ken Burns for landscapes, scenery
        {
            'keywords': ['landscape', 'scenery', 'nature', 'mountain', 'ocean', 'sky', 'forest', 'city', 'panorama', 'view'],
            'effect': 'ken-burns',
            'intensity': 0.5,
            'reason': 'Landscape/scenery suits slow pan movement'
        },
        # Slide for action, movement
        {
            'keywords': ['action', 'move', 'fast', 'run', 'walk', 'travel', 'journey', 'path', 'road'],
            'effect': 'slide',
            'intensity': 0.6,
            'reason': 'Action content suits directional movement'
        },
        # Scale/pulse for emphasis
        {
            'keywords': ['important', 'key', 'highlight', 'focus', 'attention', 'wow', 'amazing', 'shocking'],
            'effect': 'scale',
            'intensity': 0.4,
            'reason': 'Emphasis content suits subtle scale effect'
        },
    ]

    # Transition rules: mood/content patterns → transition type
    TRANSITION_RULES = [
        # Cut for fast-paced, energetic content
        {
            'keywords': ['fast', 'quick', 'energetic', 'exciting', 'action', 'fun', 'funny', 'haha'],
            'transition': 'cut',
            'duration': 0.0,
            'reason': 'Energetic content suits sharp cuts'
        },
        # Dissolve for emotional, soft transitions
        {
            'keywords': ['emotional', 'sad', 'happy', 'love', 'memory', 'dream', 'soft', 'gentle'],
            'transition': 'dissolve',
            'duration': 0.8,
            'reason': 'Emotional content suits soft dissolve'
        },
        # Wipe for lists, sequences
        {
            'keywords': ['next', 'then', 'also', 'another', 'list', 'number', 'step'],
            'transition': 'wipe',
            'duration': 0.4,
            'reason': 'Sequential content suits wipe transition'
        },
    ]

    # Default fallbacks
    DEFAULT_EFFECT = EffectSuggestion(
        effect='ken-burns',
        direction='random',
        intensity=0.5,
        reason='Default: gentle pan movement'
    )

    DEFAULT_TRANSITION = TransitionSuggestion(
        transition='crossfade',
        duration=0.5,
        reason='Default: smooth crossfade'
    )

    # Direction patterns for slides/ken-burns
    DIRECTION_KEYWORDS = {
        'left': ['left', 'west', 'backward', 'back'],
        'right': ['right', 'east', 'forward', 'ahead'],
        'up': ['up', 'above', 'sky', 'top', 'rise'],
        'down': ['down', 'below', 'ground', 'bottom', 'fall'],
    }

    def __init__(self):
        """Initialize EffectSuggester."""
        pass

    def suggest_effect(
        self,
        scene_text: str,
        visual_query: Optional[str] = None,
        visual_type: Optional[str] = None
    ) -> EffectSuggestion:
        """
        Suggest an effect for a scene based on content.

        Args:
            scene_text: Text content of the scene
            visual_query: Image search query or prompt (optional)
            visual_type: Type of visual ('stock', 'ai-generated', etc.)

        Returns:
            EffectSuggestion with recommended effect
        """
        # Combine text sources for analysis
        combined_text = f"{scene_text} {visual_query or ''}".lower()

        # Try each rule in order
        for rule in self.EFFECT_RULES:
            if self._matches_keywords(combined_text, rule['keywords']):
                direction = self._suggest_direction(combined_text)
                return EffectSuggestion(
                    effect=rule['effect'],
                    direction=direction,
                    intensity=rule['intensity'],
                    reason=rule['reason']
                )

        # Return default
        return self.DEFAULT_EFFECT

    def suggest_transition(
        self,
        current_scene: Dict[str, Any],
        next_scene: Optional[Dict[str, Any]] = None
    ) -> TransitionSuggestion:
        """
        Suggest a transition between two scenes.

        Args:
            current_scene: Current scene dict
            next_scene: Next scene dict (None if last scene)

        Returns:
            TransitionSuggestion with recommended transition
        """
        if next_scene is None:
            # Last scene - no transition needed
            return TransitionSuggestion(
                transition='none',
                duration=0.0,
                reason='Last scene - no transition'
            )

        # Analyze both scenes
        current_text = current_scene.get('text', '').lower()
        next_text = next_scene.get('text', '').lower()
        combined = f"{current_text} {next_text}"

        # Check scene IDs for patterns
        current_id = current_scene.get('id', '')
        next_id = next_scene.get('id', '')

        # Hook to first item - use cut
        if current_id == 'hook' and next_id.startswith('item'):
            return TransitionSuggestion(
                transition='cut',
                duration=0.0,
                reason='Hook to item - sharp cut for impact'
            )

        # Last item to CTA - use dissolve
        if current_id.startswith('item') and next_id == 'cta':
            return TransitionSuggestion(
                transition='dissolve',
                duration=0.6,
                reason='Item to CTA - soft transition to call-to-action'
            )

        # Item to item - crossfade
        if current_id.startswith('item') and next_id.startswith('item'):
            return TransitionSuggestion(
                transition='crossfade',
                duration=0.4,
                reason='Item to item - consistent crossfade'
            )

        # Try keyword rules
        for rule in self.TRANSITION_RULES:
            if self._matches_keywords(combined, rule['keywords']):
                return TransitionSuggestion(
                    transition=rule['transition'],
                    duration=rule['duration'],
                    reason=rule['reason']
                )

        # Return default
        return self.DEFAULT_TRANSITION

    def suggest_all_effects(
        self,
        scenes: List[Dict[str, Any]]
    ) -> Dict[str, EffectSuggestion]:
        """
        Suggest effects for all scenes.

        Args:
            scenes: List of scene dicts

        Returns:
            Dict mapping scene_id to EffectSuggestion
        """
        result = {}

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')
            scene_text = scene.get('text', '')

            # Get visual suggestion if present
            visual = scene.get('visualSuggestion', {})
            visual_query = visual.get('query') or visual.get('prompt')
            visual_type = visual.get('type')

            result[scene_id] = self.suggest_effect(
                scene_text=scene_text,
                visual_query=visual_query,
                visual_type=visual_type
            )

        return result

    def suggest_all_transitions(
        self,
        scenes: List[Dict[str, Any]]
    ) -> Dict[str, TransitionSuggestion]:
        """
        Suggest transitions for all scene pairs.

        Args:
            scenes: List of scene dicts

        Returns:
            Dict mapping scene_id to TransitionSuggestion (for transition AFTER that scene)
        """
        result = {}

        for i, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene_{i}')
            next_scene = scenes[i + 1] if i < len(scenes) - 1 else None

            result[scene_id] = self.suggest_transition(
                current_scene=scene,
                next_scene=next_scene
            )

        return result

    def _matches_keywords(self, text: str, keywords: List[str]) -> bool:
        """
        Check if text contains any of the keywords.

        Args:
            text: Text to search (should be lowercase)
            keywords: List of keywords to match

        Returns:
            True if any keyword found
        """
        for keyword in keywords:
            if keyword in text:
                return True
        return False

    def _suggest_direction(self, text: str) -> str:
        """
        Suggest movement direction based on text content.

        Args:
            text: Text to analyze (lowercase)

        Returns:
            Direction string: 'left', 'right', 'up', 'down', or 'random'
        """
        for direction, keywords in self.DIRECTION_KEYWORDS.items():
            if self._matches_keywords(text, keywords):
                return direction

        return 'random'

    def get_effect_params(self, suggestion: EffectSuggestion) -> Dict[str, Any]:
        """
        Convert EffectSuggestion to params dict for Remotion.

        Args:
            suggestion: EffectSuggestion object

        Returns:
            Dict with effect parameters
        """
        return {
            'type': suggestion.effect,
            'direction': suggestion.direction,
            'intensity': suggestion.intensity,
            'easing': 'ease-in-out',  # Default easing
        }

    def get_transition_params(self, suggestion: TransitionSuggestion) -> Dict[str, Any]:
        """
        Convert TransitionSuggestion to params dict.

        Args:
            suggestion: TransitionSuggestion object

        Returns:
            Dict with transition parameters
        """
        return {
            'type': suggestion.transition,
            'duration': suggestion.duration,
        }
