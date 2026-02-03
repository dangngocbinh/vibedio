import React, { useState } from 'react';
import { Img, useVideoConfig } from 'remotion';
import { WatermarkConfig } from '../../types';
import { useResponsiveScale } from '../../utils/useResponsiveScale';

interface WatermarkProps {
  config: WatermarkConfig;
}

/**
 * Watermark component that displays a logo from HTTP URL
 * Supports multiple positions and customizable size/opacity
 */
export const Watermark: React.FC<WatermarkProps> = ({ config }) => {
  const { width, height } = useVideoConfig();
  const { scalePixel } = useResponsiveScale();
  const [imageError, setImageError] = useState(false);

  const getPosition = (): React.CSSProperties => {
    const { position, padding } = config;
    const scaledPadding = scalePixel(padding);

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
    };

    switch (position) {
      case 'top-left':
        return {
          ...baseStyle,
          top: scaledPadding,
          left: scaledPadding,
        };

      case 'top-right':
        return {
          ...baseStyle,
          top: scaledPadding,
          right: scaledPadding,
        };

      case 'bottom-left':
        return {
          ...baseStyle,
          bottom: scaledPadding,
          left: scaledPadding,
        };

      case 'bottom-right':
        return {
          ...baseStyle,
          bottom: scaledPadding,
          right: scaledPadding,
        };

      case 'center':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };

      default:
        return {
          ...baseStyle,
          bottom: scaledPadding,
          right: scaledPadding,
        };
    }
  };

  const logoStyle: React.CSSProperties = {
    ...getPosition(),
    width: scalePixel(config.size),
    height: 'auto',
    opacity: config.opacity,
    objectFit: 'contain',
    pointerEvents: 'none',
    zIndex: 100,
  };

  // If image failed to load, don't render anything
  if (imageError) {
    console.warn('Watermark logo failed to load:', config.logoUrl);
    return null;
  }

  // Try to load the image, handle errors gracefully
  return (
    <Img
      src={config.logoUrl}
      style={logoStyle}
      onError={() => setImageError(true)}
    />
  );
};

/**
 * Default watermark config
 */
export const defaultWatermarkConfig: WatermarkConfig = {
  logoUrl: 'https://via.placeholder.com/150x50/000000/FFFFFF?text=LOGO',
  position: 'bottom-right',
  size: 120,
  opacity: 0.7,
  padding: 30,
};
