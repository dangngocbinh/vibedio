import React from 'react';
import { Composition, CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';
import {
  VideoComposition,
  defaultVideoConfig,
  defaultSceneAnalysis,
  defaultAudioTimestamp,
  defaultSelectedImages,
} from './compositions/VideoComposition';
import { ShowcaseComposition } from './compositions/ShowcaseComposition';
import { VideoGeneratorUI } from './components/VideoGeneratorUI';
import { OpeningTitle } from './components/OpeningTitle';
import { JSONVideoComposition, JSONVideoCompositionProps } from './compositions/JSONVideoComposition';
import { JSONVideoPicker, JSONVideoPickerProps, calculateVideoDuration } from './components/JSONVideoPicker';
import { NeonCountdown } from './compositions/NeonCountdown';
import { NetworkVisualization } from './compositions/NetworkVisualization';
import { LogoReveal } from './compositions/LogoReveal';
import { LogoReveal2 } from './compositions/LogoReveal2';
import { CartoonCharacter } from './compositions/CartoonCharacter';
import { HomePage } from './components/HomePage';
import { ProcessFlow } from './compositions/ProcessFlow';
import { OtioPlayer, calculateTotalDuration } from './compositions/OtioPlayer';
// @ts-ignore
import projectsList from './generated/projects.json';
import { loadProject } from './utils/project-loader';

const projectIds = projectsList.length > 0
  ? projectsList.map((p: any) => p.id)
  : ['default'];

const OtioSchema = z.object({
  projectId: z.enum(projectIds as [string, ...string[]]),
});

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
  audioUrl: z.string().optional(),
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

const jsonVideoPickerSchema = z.object({
  jsonUrl: z.string().describe('URL or path to JSON video data'),
});

const logoReveal2Schema = z.object({
  logoUrl: z.string().describe('URL to logo image').optional(),
  brandText: z.string().describe('Brand name text').optional(),
  tagline: z.string().describe('Tagline text').optional(),
});

/**
 * Metadata calculation function for JSON-based videos
 * Fetches JSON and determines the correct duration
 */
// Metadata calculation function (Hàm tính toán metadata cho video từ JSON)
const calculateJSONVideoMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;

  // Lấy đường dẫn JSON từ props (Support cả 2 kiểu props)
  const pathOrUrl = (props as any).jsonUrl || (props as any).jsonPath;

  // Nếu không có path, trả về duration mặc định 30s
  if (!pathOrUrl) {
    return { durationInFrames: 30 * fps };
  }

  try {
    // Xử lý đường dẫn file
    let fetchUrl = pathOrUrl;
    if (!pathOrUrl.startsWith('http')) {
      // Nếu là file local trong thư mục public, thêm dấu / ở đầu để fetch từ root server
      fetchUrl = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    }

    // Thực hiện gọi request để lấy file JSON
    // Note for Vue dev: fetch works similarly in React/Remotion as in vanilla JS/Vue
    const response = await fetch(fetchUrl);

    // Check if response is valid (Kiểm tra response có OK không)
    if (!response.ok) {
      // Nếu file không tìm thấy (404), throw error để catch block xử lý
      throw new Error(`Failed to fetch JSON: ${response.status} ${response.statusText}`);
    }

    // Check content type (Kiểm tra xem có phải JSON không)
    // Sometimes servers return HTML (404 page) instead of JSON, which causes syntax errors
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      // Nếu server trả về HTML thay vì JSON (thường là trang lỗi 404), ta throw error
      throw new Error(`Expected JSON but got ${contentType}. URL: ${fetchUrl}`);
    }

    const data = await response.json();
    const durationInSeconds = calculateVideoDuration(data);

    // Trả về duration tính bằng frames (giây * fps)
    return {
      durationInFrames: Math.ceil(durationInSeconds * fps),
    };
  } catch (err) {
    // Log lỗi chi tiết để debug
    console.warn(`[calculateMetadata] Error loading video config from ${pathOrUrl}. Defaulting to 30s.`, err);
    // Fallback: Nếu lỗi thì video vẫn chạy nhưng với duration mặc định (Fail-safe)
    return { durationInFrames: 30 * fps };
  }
};

export const RemotionRoot: React.FC = () => {
  const totalDuration = defaultSceneAnalysis.duration;
  const fps = 30;
  const durationInFrames = Math.ceil(totalDuration * fps);

  // Calculate OTIO duration
  // Default duration used if no metadata is calculated
  const defaultTimelineDuration = 30 * fps;

  return (
    <>
      <Composition
        id="OpeningTitleDemo"
        component={OpeningTitle}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "CINEMATIC EXPERIENCE",
          subtitle: "Powered by Remotion & Agentic AI"
        }}
      />
      <Composition
        id="OtioTimeline"
        component={OtioPlayer}
        durationInFrames={defaultTimelineDuration}
        fps={fps}
        width={1920}
        height={1080}
        schema={OtioSchema}
        defaultProps={{
          // @ts-ignore
          projectId: projectIds[0]
        }}
        calculateMetadata={async ({ props }) => {
          console.log('[OtioTimeline] Starting calculateMetadata with props:', props);
          if (props.projectId) {
            const project = projectsList.find((p: any) => p.id === props.projectId);
            console.log('[OtioTimeline] Found project:', project);
            if (project) {
              try {
                const tl = await loadProject(project);
                console.log('[OtioTimeline] Loaded timeline:', tl);
                console.log('[OtioTimeline] Timeline tracks:', tl?.tracks);
                console.log('[OtioTimeline] Timeline tracks children:', tl?.tracks?.children);
                const dur = calculateTotalDuration(tl, fps);
                console.log('[OtioTimeline] Calculated duration:', dur);
                if (dur > 0) {
                  return { durationInFrames: dur };
                }
              } catch (e) {
                console.error("[OtioTimeline] Failed to calc duration", e);
              }
            }
          }
          return { durationInFrames: defaultTimelineDuration };
        }}
      />

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
      {/* Video Generator UI */}
      <Composition
        id="VideoGenerator"
        component={VideoGeneratorUI}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Neon Countdown - 5 seconds with vibrant neon effects */}
      <Composition
        id="NeonCountdown"
        component={NeonCountdown}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Network Visualization - 7 seconds organic network growth */}
      <Composition
        id="NetworkVisualization"
        component={NetworkVisualization}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Logo Reveal - 4 seconds particle convergence */}
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Logo Reveal 2 - Ultra-professional with custom logo support */}
      <Composition
        id="LogoReveal2"
        component={LogoReveal2}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        schema={logoReveal2Schema}
        defaultProps={{ brandText: 'YOUR BRAND', tagline: 'Excellence in Motion' }}
      />
      {/* Cartoon Character - 8 seconds friendly bounce */}
      <Composition
        id="CartoonCharacter"
        component={CartoonCharacter}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* JSON Video Picker with UI - Portrait (RECOMMENDED!) */}
      <Composition
        id="JSONVideoPicker"
        component={JSONVideoPicker}
        fps={fps}
        width={1080}
        height={1920}
        schema={jsonVideoPickerSchema}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{ jsonUrl: 'https://tmpspace.b-cdn.net/example-video-with-watermark.json' }}
      />
      {/* JSON Video Picker - Landscape */}
      <Composition
        id="JSONVideoPickerLandscape"
        component={JSONVideoPicker}
        fps={fps}
        width={1920}
        height={1080}
        schema={jsonVideoPickerSchema}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{ jsonUrl: 'https://tmpspace.b-cdn.net/example-video-with-watermark.json' }}
      />
      {/* JSON Video Picker - Square */}
      <Composition
        id="JSONVideoPickerSquare"
        component={JSONVideoPicker}
        fps={fps}
        width={1080}
        height={1080}
        schema={jsonVideoPickerSchema}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{ jsonUrl: 'https://tmpspace.b-cdn.net/my-custom-video.json' }}
      />
      {/* JSON-Driven Video - Portrait (TikTok/Reels) */}
      <Composition
        id="JSONVideo"
        component={JSONVideoComposition}
        fps={fps}
        width={1080}
        height={1920}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{
          jsonPath: 'generated/video-data-1769272784944.json',
        }}
        schema={z.object({
          jsonPath: z
            .string()
            .describe('Path to JSON file in /public folder (e.g., "generated/my-video.json")'),
        })}
      />
      {/* JSON-Driven Video - Landscape (YouTube) */}
      <Composition
        id="JSONVideoLandscape"
        component={JSONVideoComposition}
        fps={fps}
        width={1920}
        height={1080}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{
          jsonPath: 'generated/video-data-1769272784944.json',
        }}
        schema={z.object({
          jsonPath: z
            .string()
            .describe('Path to JSON file in /public folder (e.g., "generated/my-video.json")'),
        })}
      />
      {/* JSON-Driven Video - Square (Instagram) */}
      <Composition
        id="JSONVideoSquare"
        component={JSONVideoComposition}
        fps={fps}
        width={1080}
        height={1080}
        calculateMetadata={calculateJSONVideoMetadata}
        defaultProps={{
          jsonPath: 'generated/video-data-1769272784944.json',
        }}
        schema={z.object({
          jsonPath: z
            .string()
            .describe('Path to JSON file in /public folder (e.g., "generated/my-video.json")'),
        })}
      />
      {/* Home Page - Interactive Player Preview */}
      <Composition
        id="HomePage"
        component={HomePage}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Process Flow Animation */}
      <Composition
        id="ProcessFlow"
        component={ProcessFlow}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
