import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
  Composition,
  staticFile,
} from 'remotion';
import { AnimatedImage } from '../components/AnimatedImage';
import { TikTokCaption } from '../components/TikTokCaption';
import { Subtitle } from '../components/Subtitle';
import {
  VideoConfig,
  SceneAnalysis,
  AudioTimestamp,
  ImageSearchResult,
} from '../types';

export interface VideoCompositionProps {
  config: VideoConfig;
  sceneAnalysis: SceneAnalysis;
  audioTimestamp: AudioTimestamp;
  selectedImages: ImageSearchResult[];
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  config,
  sceneAnalysis,
  audioTimestamp,
  selectedImages,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Audio Layer */}
      {audioTimestamp.audioUrl && (
        <Audio src={audioTimestamp.audioUrl} />
      )}

      {/* Image Sequences with Animations */}
      {sceneAnalysis.scenes.map((scene, index) => {
        const startFrame = Math.floor(scene.startTime * fps);
        const durationInFrames = Math.floor((scene.endTime - scene.startTime) * fps);
        const image = selectedImages[index];

        if (!image) return null;

        return (
          <Sequence
            key={`scene-${index}`}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <AnimatedImage
              src={image.url}
              animation={scene.suggestedAnimation}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}

      {/* TikTok-style Captions */}
      {audioTimestamp.words.length > 0 && (
        <TikTokCaption words={audioTimestamp.words} style={config.captionStyle} />
      )}

      {/* Subtitle Layer (optional - can be toggled) */}
      {/* Uncomment below to show traditional subtitles */}
      {/*
      {sceneAnalysis.scenes.map((scene, index) => (
        <Subtitle
          key={`subtitle-${index}`}
          text={scene.text}
          startTime={scene.startTime}
          endTime={scene.endTime}
        />
      ))}
      */}
    </AbsoluteFill>
  );
};

// Default props for Remotion Studio
export const defaultVideoConfig: VideoConfig = {
  text: 'Welcome to our amazing video creator! This tool automatically generates beautiful videos with voice-over, dynamic images, and captions.',
  ttsProvider: 'elevenlabs',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  animationStyle: 'dynamic',
  captionStyle: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 48,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    highlightColor: '#FFD700',
    strokeColor: '#000000',
    strokeWidth: 2,
  },
  transitionType: 'auto',
};

export const defaultSceneAnalysis: SceneAnalysis = {
  tone: 'energetic',
  keywords: ['video', 'creator', 'amazing', 'dynamic'],
  duration: 30,
  scenes: [
    {
      text: 'Welcome to our amazing video creator!',
      keywords: ['welcome', 'video', 'creator'],
      startTime: 0,
      endTime: 5,
      imageQuery: 'modern technology workspace',
      suggestedAnimation: {
        type: 'zoom-in',
        duration: 5,
        intensity: 0.3,
      },
    },
    {
      text: 'This tool automatically generates beautiful videos',
      keywords: ['automatic', 'beautiful', 'videos'],
      startTime: 5,
      endTime: 10,
      imageQuery: 'creative video production',
      suggestedAnimation: {
        type: 'pan-right',
        duration: 5,
        intensity: 0.25,
      },
    },
    {
      text: 'with voice-over, dynamic images, and captions.',
      keywords: ['voice-over', 'images', 'captions'],
      startTime: 10,
      endTime: 15,
      imageQuery: 'professional microphone recording',
      suggestedAnimation: {
        type: 'ken-burns',
        duration: 5,
        intensity: 0.35,
      },
    },
  ],
};

export const defaultAudioTimestamp: AudioTimestamp = {
  words: [
    { word: 'Welcome', start: 0, end: 0.5, confidence: 1 },
    { word: 'to', start: 0.5, end: 0.7, confidence: 1 },
    { word: 'our', start: 0.7, end: 0.9, confidence: 1 },
    { word: 'amazing', start: 0.9, end: 1.4, confidence: 1 },
    { word: 'video', start: 1.4, end: 1.8, confidence: 1 },
    { word: 'creator', start: 1.8, end: 2.3, confidence: 1 },
  ],
  duration: 15,
  audioUrl: staticFile('audio/sample.mp3'),
};

export const defaultSelectedImages: ImageSearchResult[] = [
  {
    url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=200',
    source: 'unsplash',
    photographer: 'Sample Artist',
    relevanceScore: 0.9,
  },
];
