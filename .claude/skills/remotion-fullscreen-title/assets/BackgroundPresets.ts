import { FullscreenTitleProps } from './FullscreenTitle';

// ============ GRADIENT PRESETS ============
export const GradientPresets = {
  // Warm tones
  sunset: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff416c 50%, #8b5cf6 100%)',
  fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 50%, #ffd700 100%)',
  gold: 'linear-gradient(135deg, #f7971e 0%, #ffd200 50%, #f5af19 100%)',
  peach: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',

  // Cool tones
  ocean: 'linear-gradient(135deg, #667eea 0%, #00d4ff 50%, #0891b2 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  teal: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
  arctic: 'linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)',

  // Nature
  forest: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #0d9488 100%)',
  green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  nature: 'linear-gradient(135deg, #0f9b0f 0%, #000000 100%)',

  // Dark themes
  night: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  dark: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  midnight: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
  charcoal: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)',

  // Light themes
  light: 'linear-gradient(135deg, #fafafa 0%, #e5e7eb 50%, #d1d5db 100%)',
  cream: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
  silver: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',

  // Vibrant
  neon: 'linear-gradient(135deg, #f953c6 0%, #b91d73 25%, #00d4ff 75%, #7c3aed 100%)',
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)',
  pink: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  rainbow: 'linear-gradient(135deg, #ff0000 0%, #ff7f00 16%, #ffff00 33%, #00ff00 50%, #0000ff 66%, #8b00ff 83%, #ff00ff 100%)',
  synthwave: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
  cyber: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)',

  // Special
  red: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 50%, #dc2626 100%)',
  youtube: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
  instagram: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
  tiktok: 'linear-gradient(135deg, #69C9D0 0%, #EE1D52 50%, #000000 100%)',
} as const;

// ============ PATTERN PRESETS ============
export const PatternPresets = {
  dots: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  dotsLarge: {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px)',
    backgroundSize: '40px 40px',
  },
  lines: {
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
  },
  linesHorizontal: {
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)',
  },
  grid: {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  },
  gridSmall: {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
  },
  checkerboard: {
    backgroundImage: `
      linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)
    `,
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
  },
  waves: {
    backgroundImage: `repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255,255,255,0.03) 10px)`,
    backgroundSize: '20px 20px',
  },
} as const;

// ============ COLOR SCHEMES ============
export const ColorSchemes = {
  // Dark themes
  dark: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'dark',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
  },
  darkRed: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'red',
    textColor: '#ffffff',
    accentColor: '#ff6b6b',
  },
  darkGold: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'gold',
    textColor: '#1a1a2e',
    accentColor: '#8b4513',
  },

  // Light themes
  light: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'light',
    textColor: '#1a1a2e',
    accentColor: '#0066ff',
  },
  cream: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'cream',
    textColor: '#2d2d2d',
    accentColor: '#8b4513',
  },

  // Brand colors
  youtube: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'youtube',
    textColor: '#ffffff',
    accentColor: '#ffffff',
  },
  tiktok: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'tiktok',
    textColor: '#ffffff',
    accentColor: '#69C9D0',
  },
  instagram: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'instagram',
    textColor: '#ffffff',
    accentColor: '#ffffff',
  },

  // Vibrant
  neon: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'neon',
    textColor: '#ffffff',
    accentColor: '#00ff88',
  },
  synthwave: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'synthwave',
    textColor: '#ffffff',
    accentColor: '#ff00ff',
  },
  sunset: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'sunset',
    textColor: '#ffffff',
    accentColor: '#ffd700',
  },
  ocean: {
    backgroundType: 'gradient' as const,
    backgroundValue: 'ocean',
    textColor: '#ffffff',
    accentColor: '#00ffff',
  },
} as const;

// ============ TITLE PRESETS ============
export const TitlePresets: Record<string, Partial<FullscreenTitleProps>> = {
  // Intro styles
  introEpic: {
    backgroundType: 'gradient',
    backgroundValue: 'night',
    textStyle: 'bold-shadow',
    animation: 'zoom-fade',
    titleSize: 120,
    subtitleSize: 42,
    showVignette: true,
    showParticles: true,
  },
  introMinimal: {
    backgroundType: 'solid',
    backgroundValue: '#000000',
    textStyle: 'minimal',
    textColor: '#ffffff',
    animation: 'fade',
    titleSize: 72,
    subtitleSize: 28,
    showVignette: false,
  },
  introNeon: {
    backgroundType: 'gradient',
    backgroundValue: 'neon',
    textStyle: 'glow',
    accentColor: '#00ff88',
    animation: 'glitch',
    titleSize: 96,
    showParticles: true,
  },

  // Chapter dividers
  chapter: {
    backgroundType: 'gradient',
    backgroundValue: 'dark',
    textStyle: 'bold-shadow',
    animation: 'blur-in',
    titleSize: 80,
    subtitleSize: 32,
    showVignette: true,
  },
  chapterClean: {
    backgroundType: 'solid',
    backgroundValue: '#1a1a2e',
    textStyle: 'outline',
    textColor: '#ffffff',
    animation: 'reveal-left',
    titleSize: 72,
    subtitleSize: 28,
  },

  // Quote/Statement
  quote: {
    backgroundType: 'gradient',
    backgroundValue: 'sunset',
    textStyle: 'minimal',
    animation: 'typewriter',
    titleSize: 64,
    verticalAlign: 'center',
    showVignette: true,
  },

  // Outro
  outro: {
    backgroundType: 'gradient',
    backgroundValue: 'night',
    textStyle: '3d',
    animation: 'slide-up-bounce',
    titleSize: 96,
    subtitleSize: 36,
    showParticles: true,
  },

  // Gaming/Tech
  gaming: {
    backgroundType: 'gradient',
    backgroundValue: 'cyber',
    textStyle: 'glow',
    accentColor: '#00ff00',
    animation: 'glitch',
    titleSize: 100,
    showParticles: true,
  },

  // Corporate/Professional
  corporate: {
    backgroundType: 'gradient',
    backgroundValue: 'midnight',
    textStyle: 'minimal',
    textColor: '#ffffff',
    accentColor: '#00a8e8',
    animation: 'fade',
    titleSize: 72,
    subtitleSize: 28,
    showVignette: true,
  },

  // YouTube style
  youtubeHook: {
    backgroundType: 'gradient',
    backgroundValue: 'fire',
    textStyle: 'bold-shadow',
    textColor: '#ffffff',
    animation: 'zoom-fade',
    titleSize: 110,
    subtitleSize: 40,
    showVignette: true,
  },

  // Facts/Listicle
  factNumber: {
    backgroundType: 'gradient',
    backgroundValue: 'purple',
    textStyle: '3d',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    animation: 'slide-up-bounce',
    titleSize: 200,
    subtitleSize: 48,
  },
};

// ============ HELPER FUNCTIONS ============
export const createFullscreenTitle = (
  preset: keyof typeof TitlePresets,
  overrides?: Partial<FullscreenTitleProps>
): Partial<FullscreenTitleProps> => {
  return {
    ...TitlePresets[preset],
    ...overrides,
  };
};

export const getGradient = (name: keyof typeof GradientPresets): string => {
  return GradientPresets[name];
};

export const getColorScheme = (name: keyof typeof ColorSchemes) => {
  return ColorSchemes[name];
};

export default { GradientPresets, PatternPresets, ColorSchemes, TitlePresets };
