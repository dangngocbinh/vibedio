import React from 'react';
import { Composition } from 'remotion';
import { z } from 'zod';
import {
  VideoComposition,
  defaultVideoConfig,
  defaultSceneAnalysis,
  defaultAudioTimestamp,
  defaultSelectedImages,
} from './compositions/VideoComposition';
import { ShowcaseComposition } from './compositions/ShowcaseComposition';

// Zod schema for props validation in Remotion Studio
const captionStyleSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number().min(24).max(120),
  color: z.string(),
  backgroundColor: z.string(),
  position: z.enum(['top', 'center', 'bottom']),
  highlightColor: z.string(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
});

const videoConfigSchema = z.object({
  text: z.string(),
  ttsProvider: z.enum(['elevenlabs', 'google', 'azure']),
  voiceId: z.string().optional(),
  animationStyle: z.enum(['cinematic', 'dynamic', 'minimal']),
  captionStyle: captionStyleSchema,
  transitionType: z.enum(['fade', 'slide', 'zoom', 'auto']),
});

const animationTypeSchema = z.object({
  type: z.enum(['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'ken-burns']),
  duration: z.number(),
  intensity: z.number(),
});

const sceneSchema = z.object({
  text: z.string(),
  keywords: z.array(z.string()),
  startTime: z.number(),
  endTime: z.number(),
  suggestedAnimation: animationTypeSchema,
  imageQuery: z.string(),
});

const sceneAnalysisSchema = z.object({
  scenes: z.array(sceneSchema),
  keywords: z.array(z.string()),
  tone: z.string(),
  duration: z.number(),
});

const captionWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
});

const audioTimestampSchema = z.object({
  words: z.array(captionWordSchema),
  duration: z.number(),
  audioUrl: z.string(),
});

const imageSearchResultSchema = z.object({
  url: z.string(),
  thumbnailUrl: z.string(),
  source: z.enum(['unsplash', 'pexels', 'pixabay']),
  photographer: z.string(),
  relevanceScore: z.number(),
});

// Main composition schema
const compositionSchema = z.object({
  config: videoConfigSchema,
  sceneAnalysis: sceneAnalysisSchema,
  audioTimestamp: audioTimestampSchema,
  selectedImages: z.array(imageSearchResultSchema),
});

export const RemotionRoot: React.FC = () => {
  const totalDuration = defaultSceneAnalysis.duration;
  const fps = 30;
  const durationInFrames = Math.ceil(totalDuration * fps);

  return (
    <>
      <Composition
        id="AutoVideo"
        component={VideoComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          config: defaultVideoConfig,
          sceneAnalysis: defaultSceneAnalysis,
          audioTimestamp: defaultAudioTimestamp,
          selectedImages: defaultSelectedImages,
        }}
        schema={compositionSchema}
      />

      {/* Additional composition for landscape format */}
      <Composition
        id="AutoVideoLandscape"
        component={VideoComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          config: defaultVideoConfig,
          sceneAnalysis: defaultSceneAnalysis,
          audioTimestamp: defaultAudioTimestamp,
          selectedImages: defaultSelectedImages,
        }}
        schema={compositionSchema}
      />

      {/* Square format for Instagram */}
      <Composition
        id="AutoVideoSquare"
        component={VideoComposition}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1080}
        defaultProps={{
          config: defaultVideoConfig,
          sceneAnalysis: defaultSceneAnalysis,
          audioTimestamp: defaultAudioTimestamp,
          selectedImages: defaultSelectedImages,
        }}
        schema={compositionSchema}
      />

      {/* Showcase all animation effects */}
      <Composition
        id="AnimationShowcase"
        component={ShowcaseComposition}
        durationInFrames={25 * fps}
        fps={fps}
        width={1080}
        height={1920}
      />
    </>
  );
};
