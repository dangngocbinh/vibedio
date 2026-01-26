import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CaptionWord, CaptionStyle } from '../types';

interface TikTokCaptionProps {
  words: CaptionWord[];
  style: CaptionStyle;
  startOffset?: number;
}

export const TikTokCaption: React.FC<TikTokCaptionProps> = ({ words, style, startOffset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = (frame / fps) + startOffset;

  // Compute effective style with defaults
  // Use explicit casts or checks since 'style' prop might be a flat object from OTIO (e.g. { font: '...' } instead of { fontFamily: '...' })
  // or it might be missing properties.
  const rawStyle = style as any || {};

  const computedStyle: CaptionStyle = {
    fontFamily: rawStyle.fontFamily || rawStyle.font || 'Montserrat, sans-serif',
    fontSize: rawStyle.fontSize || 70, // Default to large size
    color: rawStyle.color || '#FFFFFF',
    backgroundColor: rawStyle.backgroundColor || 'transparent', // Transparent by default for TikTok style text-only look, or 'rgba(0,0,0,0.5)' for box
    position: rawStyle.position || 'center',
    highlightColor: rawStyle.highlightColor || '#F4D03F', // Gold/Yellow highlight
    strokeColor: rawStyle.strokeColor || '#000000',
    strokeWidth: rawStyle.strokeWidth || 6,
  };

  // Find currently active words (show 3-5 words at a time)
  const wordsPerLine = 4;
  const activeWordIndex = words.findIndex(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  // Allow showing words even if no single word is strictly "active" (e.g. between words gap)
  // Logic: find word that just ended or is about to start to keep context? 
  // For now, keep original visibility logic but maybe extend range?
  if (activeWordIndex === -1 && words.length > 0) {
    // Check if we are within range of the entire caption block?
    // For now return null to keep it simple, but we improved visibility via style.
    return null;
  }

  // Get context words around the active word
  const startIndex = Math.max(0, activeWordIndex - Math.floor(wordsPerLine / 2));
  const endIndex = Math.min(words.length, startIndex + wordsPerLine);
  const displayWords = words.slice(startIndex, endIndex);

  const getPositionStyle = (): React.CSSProperties => {
    switch (computedStyle.position) {
      case 'top':
        return {
          top: '20%',
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
          bottom: '25%', // Lift up a bit
          justifyContent: 'flex-end',
        };
      default:
        return {
          bottom: '25%',
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

          // Scale animation for active word using interpolate
          // Ensure input range is strictly increasing
          const wordDuration = Math.max(word.end - word.start, 0.01); // Minimum 10ms duration
          const safeStart = word.start;
          const safeEnd = safeStart + wordDuration; // Use calculated safe end

          const scaleInDuration = Math.min(0.05, wordDuration * 0.3);
          const scaleOutDuration = Math.min(0.05, wordDuration * 0.3);

          // Build strictly increasing input range
          const scaleT1 = safeStart;
          const scaleT2 = safeStart + scaleInDuration;
          const scaleT3 = Math.max(scaleT2 + 0.001, safeEnd - scaleOutDuration);
          const scaleT4 = Math.max(scaleT3 + 0.001, safeEnd);

          let scale = 1;
          if (isActive && scaleT1 < scaleT2 && scaleT2 < scaleT3 && scaleT3 < scaleT4) {
            scale = interpolate(
              currentTime,
              [scaleT1, scaleT2, scaleT3, scaleT4],
              [1, 1.15, 1.15, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
          }

          // Smooth opacity transition for active state
          const opacityDuration = Math.min(0.03, wordDuration * 0.2);
          const opacityT1 = safeStart;
          const opacityT2 = safeStart + Math.max(opacityDuration, 0.01);

          let opacity = 0.8;
          if (isActive && opacityT1 < opacityT2) {
            opacity = interpolate(
              currentTime,
              [opacityT1, opacityT2],
              [0.8, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
          }

          return (
            <div
              key={`${word.word}-${wordIndex}`}
              style={{
                fontFamily: computedStyle.fontFamily,
                fontSize: computedStyle.fontSize,
                fontWeight: '900', // Extra bold
                color: isActive ? computedStyle.highlightColor : computedStyle.color,
                backgroundColor: 'transparent',
                padding: '4px 8px',
                borderRadius: '8px',
                transform: `scale(${scale})`,
                opacity,
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.2,
                WebkitTextStroke: isActive ? '0px' : `${computedStyle.strokeWidth! / 2}px ${computedStyle.strokeColor}`,
                textShadow: computedStyle.strokeColor
                  ? `
                    -${computedStyle.strokeWidth}px -${computedStyle.strokeWidth}px 0 ${computedStyle.strokeColor},
                    ${computedStyle.strokeWidth}px -${computedStyle.strokeWidth}px 0 ${computedStyle.strokeColor},
                    -${computedStyle.strokeWidth}px ${computedStyle.strokeWidth}px 0 ${computedStyle.strokeColor},
                    ${computedStyle.strokeWidth}px ${computedStyle.strokeWidth}px 0 ${computedStyle.strokeColor},
                    3px 3px 5px rgba(0,0,0,0.5)
                  `
                  : 'none',
                filter: isActive ? `drop-shadow(0 0 10px ${computedStyle.highlightColor})` : 'none',
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
