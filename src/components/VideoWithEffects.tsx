/**
 * VideoWithEffects Component
 *
 * Renders a video/image with visual effects (blur, brightness, opacity, scaling).
 * Used for background tracks in Short video layouts.
 */

import { Img, Video, staticFile } from 'remotion';
import { CSSProperties } from 'react';

export interface VideoWithEffectsProps {
  src: string;
  blur?: number;
  brightness?: number;
  opacity?: number;
  scaleMode?: 'cover' | 'contain' | 'fill';
  width?: number;
  height?: number;
}

export const VideoWithEffects: React.FC<VideoWithEffectsProps> = ({
  src,
  blur = 0,
  brightness = 1,
  opacity = 1,
  scaleMode = 'cover',
  width,
  height,
}) => {
  const isVideo = src.match(/\.(mp4|mov|webm|avi)$/i);
  const isRemote = src.startsWith('http://') || src.startsWith('https://');
  const isAlreadyStatic = src.startsWith('/static-');

  // Resolve path: remote URLs use as-is, already-static paths use as-is, local paths use staticFile()
  const resolvedSrc = isRemote || isAlreadyStatic ? src : staticFile(src);

  // Debug log
  console.log('[VideoWithEffects] Rendering:', { src, blur, brightness, opacity, scaleMode, resolvedSrc });

  const style: CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    objectFit: scaleMode,
    filter: `blur(${blur}px) brightness(${brightness})`,
    opacity,
  };

  if (isVideo) {
    return (
      <Video
        src={resolvedSrc}
        style={style}
        muted
        loop
      />
    );
  }

  return (
    <Img
      src={resolvedSrc}
      style={style}
    />
  );
};
