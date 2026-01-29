import { BrollTitleProps } from './BrollTitle';

// ============ COLOR SCHEMES ============
export const ColorSchemes = {
  // Dark themes
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
  },
  darkRed: {
    backgroundColor: 'rgba(30, 0, 0, 0.9)',
    textColor: '#ffffff',
    accentColor: '#ff4757',
  },
  darkGold: {
    backgroundColor: 'rgba(20, 15, 0, 0.9)',
    textColor: '#ffffff',
    accentColor: '#ffd700',
  },
  
  // Light themes
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    textColor: '#1a1a2e',
    accentColor: '#0066ff',
  },
  lightWarm: {
    backgroundColor: 'rgba(255, 250, 240, 0.95)',
    textColor: '#2d2d2d',
    accentColor: '#ff6b35',
  },
  
  // Brand colors
  youtube: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    textColor: '#ffffff',
    accentColor: '#ff0000',
  },
  tech: {
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    textColor: '#ccd6f6',
    accentColor: '#64ffda',
  },
  corporate: {
    backgroundColor: 'rgba(0, 48, 87, 0.95)',
    textColor: '#ffffff',
    accentColor: '#00a8e8',
  },
  
  // Vibrant
  neon: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    textColor: '#ffffff',
    accentColor: '#00ff88',
  },
  sunset: {
    backgroundColor: 'rgba(45, 20, 44, 0.95)',
    textColor: '#ffffff',
    accentColor: '#ff6b6b',
  },
} as const;

// ============ TITLE PRESETS ============
export const TitlePresets: Record<string, Partial<BrollTitleProps>> = {
  // Speaker/Interview
  speaker: {
    style: 'lower-third',
    animation: 'slide-up',
    ...ColorSchemes.dark,
    fontSize: 32,
    subtitleSize: 16,
  },
  
  // Chapter/Section titles
  chapter: {
    style: 'centered',
    animation: 'scale',
    ...ColorSchemes.dark,
    fontSize: 48,
    subtitleSize: 24,
    showAccentLine: false,
  },
  
  // Location tags
  location: {
    style: 'corner-badge',
    animation: 'slide-left',
    ...ColorSchemes.dark,
    fontSize: 20,
    subtitleSize: 14,
  },
  
  // Live/Status badge
  live: {
    style: 'corner-badge',
    animation: 'fade',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    fontSize: 16,
    showAccentLine: false,
  },
  
  // Quote/Testimonial
  quote: {
    style: 'centered',
    animation: 'typewriter',
    ...ColorSchemes.dark,
    fontSize: 36,
    subtitleSize: 18,
  },
  
  // Intro/Outro
  intro: {
    style: 'full-screen',
    animation: 'scale',
    ...ColorSchemes.tech,
    fontSize: 56,
    subtitleSize: 24,
  },
  
  // Corporate/Professional
  corporate: {
    style: 'lower-third',
    animation: 'slide-up',
    ...ColorSchemes.corporate,
    fontSize: 28,
    subtitleSize: 16,
  },
  
  // YouTube style
  youtubeStyle: {
    style: 'lower-third',
    animation: 'slide-up',
    ...ColorSchemes.youtube,
    fontSize: 32,
    subtitleSize: 18,
  },
};

// ============ HELPER FUNCTION ============
export const createTitle = (
  preset: keyof typeof TitlePresets,
  overrides?: Partial<BrollTitleProps>
): Partial<BrollTitleProps> => {
  return {
    ...TitlePresets[preset],
    ...overrides,
  };
};

// ============ USAGE EXAMPLE ============
/*
import { BrollTitle } from './BrollTitle';
import { TitlePresets, createTitle, ColorSchemes } from './TitlePresets';

// Use preset directly
<BrollTitle 
  title="John Doe" 
  subtitle="CEO, TechCorp"
  {...TitlePresets.speaker}
/>

// Use with overrides
<BrollTitle 
  title="Chapter 1" 
  subtitle="The Beginning"
  {...createTitle('chapter', { accentColor: '#ff6b6b' })}
/>

// Mix preset with custom colors
<BrollTitle 
  title="Ho Chi Minh City" 
  {...TitlePresets.location}
  {...ColorSchemes.sunset}
/>
*/

export default TitlePresets;
