export interface VideoConfig {
  text: string;
  ttsProvider: 'elevenlabs' | 'google' | 'azure';
  voiceId?: string;
  animationStyle: 'cinematic' | 'dynamic' | 'minimal';
  captionStyle: CaptionStyle;
  transitionType: 'fade' | 'slide' | 'zoom' | 'auto';
  watermark?: WatermarkConfig;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  highlightColor: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface SceneAnalysis {
  scenes: Scene[];
  keywords: string[];
  tone: 'professional' | 'casual' | 'energetic' | 'calm';
  duration: number;
}

export interface Scene {
  text: string;
  keywords: string[];
  startTime: number;
  endTime: number;
  suggestedAnimation: AnimationType;
  imageQuery: string;
}

export interface AnimationType {
  type: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'ken-burns';
  duration: number;
  intensity: number;
}

export interface ImageSearchResult {
  url: string;
  thumbnailUrl: string;
  source: 'unsplash' | 'pexels' | 'pixabay';
  photographer: string;
  relevanceScore: number;
}

// New: Support both image and video media
export interface MediaAsset {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  source?: string;
  photographer?: string;
  relevanceScore?: number;
  // Video-specific properties
  duration?: number; // Video duration in seconds
  startOffset?: number; // Start time to trim from (seconds)
  endOffset?: number; // End time to trim to (seconds)
}

export interface WatermarkConfig {
  logoUrl: string; // HTTP URL to logo image
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: number; // Size in pixels (width)
  opacity: number; // 0-1
  padding: number; // Padding from edges in pixels
}

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface AudioTimestamp {
  words: CaptionWord[];
  duration: number;
  audioUrl: string;
}
