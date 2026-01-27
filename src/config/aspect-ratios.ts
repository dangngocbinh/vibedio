/**
 * Centralized aspect ratio configuration for video compositions.
 *
 * All compositions and skills should reference these values
 * instead of hardcoding width/height.
 */

export interface AspectRatioConfig {
  width: number;
  height: number;
  label: string;
  /** Short label for display */
  shortLabel: string;
  /** Platforms typically using this ratio */
  platforms: string[];
}

/**
 * Supported aspect ratios with corresponding dimensions.
 *
 * Key format: "W:H" (e.g., "9:16", "16:9", "1:1", "4:5")
 */
export const ASPECT_RATIOS: Record<string, AspectRatioConfig> = {
  '9:16': {
    width: 1080,
    height: 1920,
    label: 'Portrait (TikTok/Reels)',
    shortLabel: 'Portrait',
    platforms: ['tiktok', 'reels', 'shorts'],
  },
  '16:9': {
    width: 1920,
    height: 1080,
    label: 'Landscape (YouTube)',
    shortLabel: 'Landscape',
    platforms: ['youtube'],
  },
  '1:1': {
    width: 1080,
    height: 1080,
    label: 'Square (Instagram)',
    shortLabel: 'Square',
    platforms: ['instagram'],
  },
  '4:5': {
    width: 1080,
    height: 1350,
    label: 'Portrait 4:5 (Instagram/Facebook)',
    shortLabel: 'Portrait 4:5',
    platforms: ['instagram', 'facebook'],
  },
};

/** Default aspect ratio when not specified */
export const DEFAULT_ASPECT_RATIO = '9:16';

/**
 * Get aspect ratio config from ratio string.
 * Falls back to DEFAULT_ASPECT_RATIO if not found.
 */
export const getAspectRatio = (ratio?: string): AspectRatioConfig => {
  if (ratio && ASPECT_RATIOS[ratio]) {
    return ASPECT_RATIOS[ratio];
  }
  return ASPECT_RATIOS[DEFAULT_ASPECT_RATIO];
};

/**
 * Get aspect ratio from platform name.
 * Returns the first matching ratio for the platform.
 */
export const getAspectRatioFromPlatform = (platform: string): string => {
  const platformLower = platform.toLowerCase();
  for (const [ratio, config] of Object.entries(ASPECT_RATIOS)) {
    if (config.platforms.includes(platformLower)) {
      return ratio;
    }
  }
  return DEFAULT_ASPECT_RATIO;
};

/**
 * Detect aspect ratio string from width/height.
 */
export const detectAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  if (Math.abs(ratio - 9 / 16) < 0.01) return '9:16';
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 4 / 5) < 0.01) return '4:5';
  // Fallback: return closest
  return DEFAULT_ASPECT_RATIO;
};

/** List of all supported ratio keys */
export const SUPPORTED_RATIOS = Object.keys(ASPECT_RATIOS);
