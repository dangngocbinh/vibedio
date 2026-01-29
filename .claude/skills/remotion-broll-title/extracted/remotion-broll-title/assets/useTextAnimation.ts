import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// ============ TYPEWRITER HOOK ============
export const useTypewriter = (
  text: string,
  options?: {
    startFrame?: number;
    charsPerSecond?: number;
    showCursor?: boolean;
  }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const {
    startFrame = 0,
    charsPerSecond = 20,
    showCursor = true,
  } = options ?? {};
  
  const charsPerFrame = charsPerSecond / fps;
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.floor(elapsed * charsPerFrame);
  const displayText = text.slice(0, Math.min(charCount, text.length));
  const isComplete = charCount >= text.length;
  const cursorVisible = showCursor && !isComplete && frame % Math.round(fps / 2) < fps / 4;
  
  return {
    displayText,
    isComplete,
    cursorVisible,
    cursor: cursorVisible ? '|' : '',
    progress: Math.min(charCount / text.length, 1),
  };
};

// ============ WORD-BY-WORD REVEAL ============
export const useWordReveal = (
  text: string,
  options?: {
    startFrame?: number;
    wordsPerSecond?: number;
  }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const {
    startFrame = 0,
    wordsPerSecond = 3,
  } = options ?? {};
  
  const words = text.split(' ');
  const wordsPerFrame = wordsPerSecond / fps;
  const elapsed = Math.max(0, frame - startFrame);
  const wordCount = Math.floor(elapsed * wordsPerFrame);
  const visibleWords = words.slice(0, Math.min(wordCount, words.length));
  
  return {
    displayText: visibleWords.join(' '),
    visibleCount: visibleWords.length,
    totalWords: words.length,
    isComplete: wordCount >= words.length,
    progress: Math.min(wordCount / words.length, 1),
  };
};

// ============ CHARACTER STAGGER ANIMATION ============
export const useCharacterStagger = (
  text: string,
  options?: {
    startFrame?: number;
    staggerFrames?: number;
    animationType?: 'fade' | 'slide' | 'scale';
  }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const {
    startFrame = 0,
    staggerFrames = 2,
    animationType = 'fade',
  } = options ?? {};
  
  const characters = text.split('');
  
  const getCharacterStyle = (charIndex: number): React.CSSProperties => {
    const charStartFrame = startFrame + charIndex * staggerFrames;
    const progress = interpolate(
      frame,
      [charStartFrame, charStartFrame + fps * 0.3],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    
    switch (animationType) {
      case 'slide':
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * 20}px)`,
          display: 'inline-block',
        };
      case 'scale':
        return {
          opacity: progress,
          transform: `scale(${0.5 + progress * 0.5})`,
          display: 'inline-block',
        };
      case 'fade':
      default:
        return {
          opacity: progress,
          display: 'inline-block',
        };
    }
  };
  
  return {
    characters,
    getCharacterStyle,
    isComplete: frame >= startFrame + characters.length * staggerFrames + fps * 0.3,
  };
};

// ============ COUNTING NUMBER ANIMATION ============
export const useCountUp = (
  targetNumber: number,
  options?: {
    startFrame?: number;
    duration?: number; // in seconds
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const {
    startFrame = 0,
    duration = 1,
    prefix = '',
    suffix = '',
    decimals = 0,
  } = options ?? {};
  
  const durationInFrames = duration * fps;
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  // Eased progress for smoother counting
  const easedProgress = 1 - Math.pow(1 - progress, 3);
  const currentNumber = targetNumber * easedProgress;
  const displayNumber = currentNumber.toFixed(decimals);
  
  return {
    displayText: `${prefix}${displayNumber}${suffix}`,
    currentNumber,
    progress,
    isComplete: progress >= 1,
  };
};

// ============ SPRING TEXT ANIMATION ============
export const useSpringText = (
  options?: {
    delay?: number;
    damping?: number;
    mass?: number;
    stiffness?: number;
  }
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const {
    delay = 0,
    damping = 12,
    mass = 0.5,
    stiffness = 100,
  } = options ?? {};
  
  const springValue = spring({
    frame: frame - delay,
    fps,
    config: {
      damping,
      mass,
      stiffness,
    },
  });
  
  return {
    opacity: springValue,
    scale: 0.8 + springValue * 0.2,
    translateY: (1 - springValue) * 30,
    style: {
      opacity: springValue,
      transform: `translateY(${(1 - springValue) * 30}px) scale(${0.8 + springValue * 0.2})`,
    } as React.CSSProperties,
  };
};

// ============ USAGE EXAMPLES ============
/*
// Typewriter effect
const { displayText, cursor, isComplete } = useTypewriter('Hello World', {
  charsPerSecond: 15,
});

// Word reveal
const { displayText, progress } = useWordReveal('This is a sentence', {
  wordsPerSecond: 2,
});

// Character stagger
const { characters, getCharacterStyle } = useCharacterStagger('TITLE', {
  staggerFrames: 3,
  animationType: 'slide',
});

// In JSX:
{characters.map((char, i) => (
  <span key={i} style={getCharacterStyle(i)}>{char}</span>
))}

// Count up
const { displayText } = useCountUp(1000000, {
  prefix: '$',
  decimals: 0,
  duration: 2,
});

// Spring animation
const { style } = useSpringText({ delay: 10 });
<div style={style}>Animated Text</div>
*/

export default {
  useTypewriter,
  useWordReveal,
  useCharacterStagger,
  useCountUp,
  useSpringText,
};
