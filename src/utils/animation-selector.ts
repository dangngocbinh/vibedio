import { AnimationType } from '../types';

/**
 * Smart animation selection based on content and style
 */
export class AnimationSelector {
  /**
   * Select animation based on keywords and tone
   */
  selectAnimation(
    keywords: string[],
    tone: string,
    style: 'cinematic' | 'dynamic' | 'minimal',
    duration: number
  ): AnimationType {
    // Intensity based on style
    const intensityMap = {
      cinematic: 0.2, // Subtle
      dynamic: 0.4, // Strong
      minimal: 0.15, // Very subtle
    };

    const intensity = intensityMap[style] || 0.3;

    // Choose animation type based on keywords
    const keywordsLower = keywords.map((k) => k.toLowerCase());

    // Action words suggest pan
    const actionWords = ['move', 'go', 'run', 'walk', 'travel', 'journey'];
    if (keywordsLower.some((k) => actionWords.some((a) => k.includes(a)))) {
      return {
        type: Math.random() > 0.5 ? 'pan-left' : 'pan-right',
        duration,
        intensity,
      };
    }

    // Focus/attention words suggest zoom-in
    const focusWords = ['focus', 'look', 'see', 'watch', 'discover', 'find'];
    if (keywordsLower.some((k) => focusWords.some((f) => k.includes(f)))) {
      return {
        type: 'zoom-in',
        duration,
        intensity: intensity * 1.2,
      };
    }

    // Big picture words suggest zoom-out
    const wideWords = ['world', 'global', 'overall', 'entire', 'whole'];
    if (keywordsLower.some((k) => wideWords.some((w) => k.includes(w)))) {
      return {
        type: 'zoom-out',
        duration,
        intensity,
      };
    }

    // Energetic tone uses ken-burns
    if (tone === 'energetic' && style === 'dynamic') {
      return {
        type: 'ken-burns',
        duration,
        intensity: intensity * 1.3,
      };
    }

    // Default: alternate between zoom and pan
    const randomChoice = Math.random();
    if (randomChoice < 0.4) {
      return { type: 'zoom-in', duration, intensity };
    } else if (randomChoice < 0.7) {
      return { type: 'ken-burns', duration, intensity };
    } else {
      return {
        type: Math.random() > 0.5 ? 'pan-left' : 'pan-right',
        duration,
        intensity,
      };
    }
  }

  /**
   * Ensure variety in animations - no two consecutive same animations
   */
  ensureVariety(animations: AnimationType[]): AnimationType[] {
    const result = [...animations];

    for (let i = 1; i < result.length; i++) {
      if (result[i].type === result[i - 1].type) {
        // Change to different animation
        const alternatives: AnimationType['type'][] = [
          'zoom-in',
          'zoom-out',
          'pan-left',
          'pan-right',
          'ken-burns',
        ];

        const filtered = alternatives.filter((a) => a !== result[i - 1].type);
        const randomType = filtered[Math.floor(Math.random() * filtered.length)];

        result[i] = {
          ...result[i],
          type: randomType,
        };
      }
    }

    return result;
  }
}

export const animationSelector = new AnimationSelector();
