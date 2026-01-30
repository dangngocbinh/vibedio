import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface SubtitleProps {
  text: string;
  startTime: number;
  endTime: number;
  style?: React.CSSProperties;
}

export const Subtitle: React.FC<SubtitleProps> = ({ text, startTime, endTime, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  if (currentTime < startTime || currentTime > endTime) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '50px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          maxWidth: '80%',
          lineHeight: 1.4,
          ...style,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
