import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
  staticFile,
  continueRender,
  delayRender,
} from 'remotion';
import { AnimatedImage } from '../components/AnimatedImage';
import { TikTokCaption } from '../components/TikTokCaption';
import {
  VideoConfig,
  SceneAnalysis,
  AudioTimestamp,
  ImageSearchResult,
} from '../types';

export interface JSONVideoCompositionProps {
  /**
   * Path to JSON file in /public folder
   * Example: "generated/my-video.json" will load from /public/generated/my-video.json
   */
  jsonPath?: string;
}

interface VideoData {
  config: VideoConfig;
  sceneAnalysis: SceneAnalysis;
  audioTimestamp: AudioTimestamp;
  selectedImages: ImageSearchResult[];
}

/**
 * Video composition that loads data from JSON file
 * Usage:
 * 1. Generate JSON with: node test-generate.js "Your text"
 * 2. Place JSON in /public/generated/
 * 3. Set jsonPath prop to the filename
 * 4. Preview & render!
 */
export const JSONVideoComposition: React.FC<JSONVideoCompositionProps> = ({ jsonPath = 'generated/example-video.json' }) => {
  const { fps } = useVideoConfig();
  const [data, setData] = useState<VideoData | null>(null);
  const [handle] = useState(() => delayRender());

  useEffect(() => {
    // Fetch JSON data
    fetch(staticFile(jsonPath))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load JSON: ${res.statusText}`);
        }
        return res.json();
      })
      .then((jsonData: VideoData) => {
        setData(jsonData);
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Error loading JSON:', err);
        // Set default fallback data
        setData({
          config: {
            text: 'Error loading video data',
            ttsProvider: 'elevenlabs',
            animationStyle: 'dynamic',
            captionStyle: {
              fontFamily: 'Inter, Arial, sans-serif',
              fontSize: 48,
              color: '#FFFFFF',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              position: 'bottom',
              highlightColor: '#FFD700',
            },
            transitionType: 'auto',
          },
          sceneAnalysis: {
            tone: 'neutral',
            keywords: [],
            duration: 5,
            scenes: [],
          },
          audioTimestamp: {
            words: [],
            duration: 5,
            audioUrl: '',
          },
          selectedImages: [],
        });
        continueRender(handle);
      });
  }, [jsonPath, handle]);

  if (!data) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontSize: 24,
        }}
      >
        Loading JSON data...
      </AbsoluteFill>
    );
  }

  const { config, sceneAnalysis, audioTimestamp, selectedImages } = data;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Audio Layer */}
      {audioTimestamp.audioUrl && <Audio src={audioTimestamp.audioUrl} />}

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
    </AbsoluteFill>
  );
};
