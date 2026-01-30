
import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { MediaAsset, AnimationType } from '../../types';

interface AnimatedImageProps {
  src: string;
  animation: AnimationType;
  durationInFrames: number;
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  animation,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const getTransform = (): string => {
    const { type, intensity } = animation;

    switch (type) {
      case 'zoom-in': {
        const scale = interpolate(progress, [0, 1], [1, 1 + intensity]);
        return `scale(${scale})`;
      }

      case 'zoom-out': {
        const scale = interpolate(progress, [0, 1], [1 + intensity, 1]);
        return `scale(${scale})`;
      }

      case 'pan-left': {
        const translateX = interpolate(progress, [0, 1], [0, -intensity * 100]);
        const scale = 1 + intensity * 0.5; // Slight zoom to avoid edges
        return `translateX(${translateX} %) scale(${scale})`;
      }

      case 'pan-right': {
        const translateX = interpolate(progress, [0, 1], [0, intensity * 100]);
        const scale = 1 + intensity * 0.5;
        return `translateX(${translateX} %) scale(${scale})`;
      }

      case 'ken-burns': {
        // Ken Burns effect: zoom + pan
        const scale = interpolate(progress, [0, 1], [1, 1 + intensity]);
        const translateX = interpolate(progress, [0, 1], [0, intensity * 50]);
        const translateY = interpolate(progress, [0, 1], [0, -intensity * 30]);
        return `scale(${scale}) translate(${translateX} %, ${translateY} %)`;
      }

      default:
        return 'scale(1)';
    }
  };

  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        opacity,
      }}
    >
      <AbsoluteFill
        style={{
          overflow: 'hidden',
        }}
      >
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: getTransform(),
            transformOrigin: 'center center',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
