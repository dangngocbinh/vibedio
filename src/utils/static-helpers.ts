import { staticFile } from 'remotion';

/**
 * Helper functions for handling static files in Remotion
 */

/**
 * Get audio file path using staticFile() for Remotion compatibility
 * @param filename - File name relative to public/ directory
 */
export const getAudioFile = (filename: string): string => {
  // Remove 'public/' prefix if present
  const cleanPath = filename.replace(/^public\//, '');
  return staticFile(cleanPath);
};

/**
 * Get image file path using staticFile() for Remotion compatibility
 * @param filename - File name relative to public/ directory
 */
export const getImageFile = (filename: string): string => {
  const cleanPath = filename.replace(/^public\//, '');
  return staticFile(cleanPath);
};

/**
 * Get video file path using staticFile() for Remotion compatibility
 * @param filename - File name relative to public/ directory
 */
export const getVideoFile = (filename: string): string => {
  const cleanPath = filename.replace(/^public\//, '');
  return staticFile(cleanPath);
};

/**
 * Check if a path is already a static file URL or external URL
 */
export const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Get proper file path - use staticFile for local, keep URL for external
 */
export const getProperFilePath = (path: string): string => {
  if (isExternalUrl(path)) {
    return path;
  }
  return staticFile(path.replace(/^public\//, ''));
};
