import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CaptionWord, CaptionStyle } from '../types';

interface TikTokCaptionProps {
  words: CaptionWord[];
  style: CaptionStyle;
}

export const TikTokCaption: React.FC<TikTokCaptionProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find currently active words (show 3-5 words at a time)
  const wordsPerLine = 4;
  const activeWordIndex = words.findIndex(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  if (activeWordIndex === -1) return null;

  // Get context words around the active word
  const startIndex = Math.max(0, activeWordIndex - Math.floor(wordsPerLine / 2));
  const endIndex = Math.min(words.length, startIndex + wordsPerLine);
  const displayWords = words.slice(startIndex, endIndex);

  const getPositionStyle = (): React.CSSProperties => {
    switch (style.position) {
      case 'top':
        return {
          top: '15%',
          justifyContent: 'flex-start',
        };
      case 'center':
        return {
          top: '50%',
          transform: 'translateY(-50%)',
          justifyContent: 'center',
        };
      case 'bottom':
        return {
          bottom: '15%',
          justifyContent: 'flex-end',
        };
      default:
        return {
          bottom: '15%',
          justifyContent: 'flex-end',
        };
    }
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...getPositionStyle(),
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '90%',
          gap: '8px',
        }}
      >
        {displayWords.map((word, index) => {
          const wordIndex = startIndex + index;
          const isActive = wordIndex === activeWordIndex;

          // Scale animation for active word using interpolate (no CSS transitions)
          // Ensure input range is strictly increasing
          const wordDuration = word.end - word.start;
          const scaleInDuration = Math.min(0.1, wordDuration * 0.3);
          const scaleOutDuration = Math.min(0.1, wordDuration * 0.3);

          const scale = isActive
            ? interpolate(
                currentTime,
                [
                  word.start,
                  word.start + scaleInDuration,
                  Math.max(word.start + scaleInDuration + 0.01, word.end - scaleOutDuration),
                  word.end,
                ],
                [1, 1.15, 1.15, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              )
            : 1;

          // Smooth opacity transition for active state
          const opacityDuration = Math.min(0.05, wordDuration * 0.2);
          const opacity = isActive
            ? interpolate(
                currentTime,
                [word.start, word.start + opacityDuration],
                [0.8, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              )
            : 0.8;

          return (
            <div
              key={`${word.word}-${wordIndex}`}
              style={{
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: 'bold',
                color: isActive ? style.highlightColor : style.color,
                backgroundColor: style.backgroundColor,
                padding: '8px 16px',
                borderRadius: '8px',
                transform: `scale(${scale})`,
                opacity,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: style.strokeColor
                  ? `
                    -${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
                    ${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
                    -${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor},
                    ${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor}
                  `
                  : 'none',
                boxShadow: isActive
                  ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                  : '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {word.word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
