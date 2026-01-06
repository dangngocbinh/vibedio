import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { AnimatedImage } from '../components/AnimatedImage';
import { TikTokCaption } from '../components/TikTokCaption';

/**
 * Showcase composition to demonstrate all animation effects
 * This is useful for previewing different animation styles
 */
export const ShowcaseComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  const sceneDuration = 5; // 5 seconds per scene
  const sceneDurationFrames = sceneDuration * fps;

  const showcaseScenes = [
    {
      name: 'Zoom In',
      animation: { type: 'zoom-in' as const, duration: sceneDuration, intensity: 0.4 },
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      words: [
        { word: 'Zoom', start: 0, end: 0.5, confidence: 1 },
        { word: 'In', start: 0.5, end: 1, confidence: 1 },
        { word: 'Effect', start: 1, end: 1.8, confidence: 1 },
      ],
    },
    {
      name: 'Zoom Out',
      animation: { type: 'zoom-out' as const, duration: sceneDuration, intensity: 0.4 },
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
      words: [
        { word: 'Zoom', start: 5, end: 5.5, confidence: 1 },
        { word: 'Out', start: 5.5, end: 6, confidence: 1 },
        { word: 'Effect', start: 6, end: 6.8, confidence: 1 },
      ],
    },
    {
      name: 'Pan Left',
      animation: { type: 'pan-left' as const, duration: sceneDuration, intensity: 0.3 },
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      words: [
        { word: 'Pan', start: 10, end: 10.5, confidence: 1 },
        { word: 'Left', start: 10.5, end: 11, confidence: 1 },
        { word: 'Effect', start: 11, end: 11.8, confidence: 1 },
      ],
    },
    {
      name: 'Pan Right',
      animation: { type: 'pan-right' as const, duration: sceneDuration, intensity: 0.3 },
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      words: [
        { word: 'Pan', start: 15, end: 15.5, confidence: 1 },
        { word: 'Right', start: 15.5, end: 16, confidence: 1 },
        { word: 'Effect', start: 16, end: 16.8, confidence: 1 },
      ],
    },
    {
      name: 'Ken Burns',
      animation: { type: 'ken-burns' as const, duration: sceneDuration, intensity: 0.35 },
      image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5',
      words: [
        { word: 'Ken', start: 20, end: 20.4, confidence: 1 },
        { word: 'Burns', start: 20.4, end: 21, confidence: 1 },
        { word: 'Effect', start: 21, end: 21.8, confidence: 1 },
      ],
    },
  ];

  const captionStyle = {
    fontFamily: 'Arial Black, sans-serif',
    fontSize: 56,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    position: 'bottom' as const,
    highlightColor: '#FFD700',
    strokeColor: '#000000',
    strokeWidth: 3,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {showcaseScenes.map((scene, index) => {
        const startFrame = index * sceneDurationFrames;

        return (
          <React.Fragment key={`scene-${index}`}>
            {/* Image with Animation */}
            <Sequence from={startFrame} durationInFrames={sceneDurationFrames}>
              <AnimatedImage
                src={scene.image}
                animation={scene.animation}
                durationInFrames={sceneDurationFrames}
              />
            </Sequence>

            {/* Caption for this scene */}
            <Sequence from={startFrame} durationInFrames={sceneDurationFrames}>
              <TikTokCaption words={scene.words} style={captionStyle} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
