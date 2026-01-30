import React from 'react';
import { Img, Video, useVideoConfig, useCurrentFrame } from 'remotion';
import { MediaAsset, AnimationType } from '../types';

interface VideoMediaProps {
  media: MediaAsset;
  animation: AnimationType;
  durationInFrames: number;
}

/**
 * Unified component that handles both image and video media
 * Supports animations for images and proper video trimming
 */
export const VideoMedia: React.FC<VideoMediaProps> = ({
  media,
  animation,
  durationInFrames,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Calculate animation progress (0 to 1)
  const progress = Math.min(frame / durationInFrames, 1);

  // Animation transforms
  const getTransform = (): React.CSSProperties => {
    const { type, intensity } = animation;

    switch (type) {
      case 'zoom-in':
        const scaleIn = 1 + progress * intensity;
        return {
          transform: `scale(${scaleIn})`,
        };

      case 'zoom-out':
        const scaleOut = 1.3 - progress * intensity;
        return {
          transform: `scale(${scaleOut})`,
        };

      case 'pan-left':
        const translateX = progress * intensity * 100;
        return {
          transform: `translateX(-${translateX}px) scale(1.2)`,
        };

      case 'pan-right':
        const translateXRight = progress * intensity * 100;
        return {
          transform: `translateX(${translateXRight}px) scale(1.2)`,
        };

      case 'ken-burns':
        const kbScale = 1 + progress * intensity;
        const kbTranslateX = progress * intensity * 50;
        const kbTranslateY = progress * intensity * 30;
        return {
          transform: `scale(${kbScale}) translate(${kbTranslateX}px, ${kbTranslateY}px)`,
        };

      default:
        return {};
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  };

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.1s ease-out',
    ...getTransform(),
  };

  // Render video
  if (media.type === 'video') {
    const startFrom = media.startOffset ? Math.floor(media.startOffset * fps) : 0;
    const endAt = media.endOffset ? Math.floor(media.endOffset * fps) : undefined;

    return (
      <div style={containerStyle}>
        <Video
          src={media.url}
          style={mediaStyle}
          startFrom={startFrom}
          endAt={endAt}
          muted={true} // Mute video since we have voice-over
          // Video will loop if shorter than scene duration
        />
      </div>
    );
  }

  // Render image with animation
  return (
    <div style={containerStyle}>
      <Img src={media.url} style={mediaStyle} />
    </div>
  );
};
