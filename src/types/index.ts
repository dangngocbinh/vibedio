export interface VideoConfig {
  text: string;
  ttsProvider: 'elevenlabs' | 'google' | 'azure';
  voiceId?: string;
  animationStyle: 'cinematic' | 'dynamic' | 'minimal';
  captionStyle: CaptionStyle;
  transitionType: 'fade' | 'slide' | 'zoom' | 'auto';
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
