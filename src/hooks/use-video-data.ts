import { useState, useEffect } from 'react';
import { GeneratedVideoData } from '../utils/video-generator';

/**
 * Hook to load video data from JSON file
 * Useful for previewing generated videos in Remotion Studio
 */
export function useVideoData(jsonPath?: string): GeneratedVideoData | null {
  const [data, setData] = useState<GeneratedVideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!jsonPath) return;

    setLoading(true);
    fetch(jsonPath)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [jsonPath]);

  return data;
}

/**
 * Hook to generate video data on-the-fly (requires API calls)
 * WARNING: This will make API calls every time the component re-renders
 * Use with caution in Remotion Studio
 */
export function useGenerateVideo(text: string, enabled: boolean = false) {
  const [data, setData] = useState<GeneratedVideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !text) return;

    // This would require dynamic imports and API calls
    // For now, just return null
    console.warn(
      'useGenerateVideo: Live generation in browser not recommended. Use CLI tool instead.'
    );
  }, [text, enabled]);

  return { data, loading, error };
}
