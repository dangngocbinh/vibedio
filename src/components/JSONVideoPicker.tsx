import React, { useState, useEffect } from 'react';
import { AbsoluteFill, Sequence, Audio, useVideoConfig, staticFile, continueRender, delayRender, getInputProps } from 'remotion';
import { AnimatedImage } from './AnimatedImage';
import { VideoMedia } from './VideoMedia';
import { Watermark } from './Watermark';
import { TikTokCaption } from './TikTokCaption';
import {
  VideoConfig,
  SceneAnalysis,
  AudioTimestamp,
  ImageSearchResult,
  MediaAsset,
} from '../types';

interface VideoData {
  config: VideoConfig;
  sceneAnalysis: SceneAnalysis;
  audioTimestamp: AudioTimestamp;
  selectedImages?: ImageSearchResult[]; // Legacy support
  mediaAssets?: MediaAsset[]; // New: support both images and videos
}

/**
 * Helper to calculate total duration from JSON data
 */
export const calculateVideoDuration = (data: any): number => {
  // 1. Try explicit duration from analysis or audio
  const explicitDuration = data.sceneAnalysis?.duration || data.audioTimestamp?.duration;
  if (explicitDuration) return explicitDuration;

  // 2. Calculate from scenes (max endTime)
  if (data.sceneAnalysis?.scenes && data.sceneAnalysis.scenes.length > 0) {
    const maxSceneEnd = Math.max(
      ...data.sceneAnalysis.scenes.map((s: any) => s.endTime || 0)
    );
    if (maxSceneEnd > 0) return maxSceneEnd;
  }

  // 3. Fallback
  return 30;
};


export interface JSONVideoPickerProps {
  jsonUrl?: string;
}

/**
 * UI Component to pick and preview JSON-based videos in Remotion Studio
 */
export const JSONVideoPicker: React.FC<JSONVideoPickerProps> = (props) => {
  const inputProps = getInputProps() as JSONVideoPickerProps;
  const initialFile = props.jsonUrl || inputProps.jsonUrl || '';

  const { fps } = useVideoConfig();
  const [selectedFile, setSelectedFile] = useState<string>(initialFile);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [handle] = useState(() => delayRender());
  const [renderStarted, setRenderStarted] = useState(false);

  // Scan for available JSON files in public/generated
  useEffect(() => {
    const scanFiles = async () => {
      try {
        // Try to fetch manifest file first
        try {
          const manifestResponse = await fetch(staticFile('generated/manifest.json'));
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            if (manifest.files && Array.isArray(manifest.files)) {
              setAvailableFiles(manifest.files);
              // Don't auto-select file - let user choose
              return;
            }
          }
        } catch (e) {
          // Manifest doesn't exist, fall back to common patterns
        }

        // Fallback: try common file patterns
        const potentialFiles = [
          'generated/example-video.json',
          'generated/test-video-1.json',
          'generated/test-video-2.json',
        ];

        const existingFiles: string[] = [];

        for (const file of potentialFiles) {
          try {
            const response = await fetch(staticFile(file), { method: 'HEAD' });
            if (response.ok) {
              existingFiles.push(file);
            }
          } catch (e) {
            // File doesn't exist, skip
          }
        }

        setAvailableFiles(existingFiles);
        // Don't auto-select - let user choose
      } catch (err) {
        console.error('Error scanning files:', err);
      }
    };

    scanFiles();
  }, []);

  // Update selectedFile when jsonUrl prop changes
  useEffect(() => {
    const newFile = props.jsonUrl || inputProps.jsonUrl || '';
    console.log('[JSONVideoPicker] Props changed:', { newFile, selectedFile, propsJsonUrl: props.jsonUrl, inputPropsJsonUrl: inputProps.jsonUrl });
    if (newFile && newFile !== selectedFile) {
      console.log('[JSONVideoPicker] Updating selectedFile to:', newFile);
      setSelectedFile(newFile);
      setVideoData(null); // Reset video data to trigger reload
      setError(''); // Clear any previous errors
    }
  }, [props.jsonUrl, inputProps.jsonUrl, selectedFile]);

  // Load video data when file is selected
  useEffect(() => {
    if (!selectedFile) {
      if (!renderStarted) {
        continueRender(handle);
        setRenderStarted(true);
      }
      return;
    }

    setLoading(true);
    setError('');

    // Determine if we should use staticFile or direct fetch
    const fetchUrl = isHttpUrl(selectedFile) ? selectedFile : staticFile(selectedFile);

    fetch(fetchUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: VideoData) => {
        setVideoData(data);
        setLoading(false);
        if (!renderStarted) {
          continueRender(handle);
          setRenderStarted(true);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        if (!renderStarted) {
          continueRender(handle);
          setRenderStarted(true);
        }
      });
  }, [selectedFile, handle, renderStarted]);

  // Manual file path or URL input
  const [customPath, setCustomPath] = useState('');

  const handleCustomPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPath.trim()) {
      setSelectedFile(customPath.trim());
    }
  };

  // Check if path is HTTP URL
  const isHttpUrl = (path: string) => {
    return path.startsWith('http://') || path.startsWith('https://');
  };

  // Render UI when no video data or showing file picker
  if (!videoData || error) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a1a', overflow: 'auto' }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '40px 30px',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>
            🎬 JSON Video Picker
          </h1>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px', fontSize: '16px' }}>
            Load JSON từ URL hoặc chọn file local
          </p>

          {/* Quick Action: Load JSON URL - FEATURED */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#0066ff22',
            border: '2px solid #0066ff',
            borderRadius: '12px'
          }}>
            <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '12px', color: '#66b3ff' }}>
              🌐 Nhập JSON URL từ Internet
            </h2>
            <form onSubmit={handleCustomPathSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="https://your-api.com/video.json"
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  fontSize: '15px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '2px solid #0066ff',
                  borderRadius: '8px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#0066ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
              >
                🚀 Load
              </button>
            </form>
            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '10px', marginBottom: 0 }}>
              💡 Ví dụ: <code style={{ color: '#0f0' }}>https://api.example.com/videos/123.json</code>
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            margin: '20px 0',
            color: '#666',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ── HOẶC ──
          </div>

          {/* Available Files */}
          {availableFiles.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                📁 Files có sẵn:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availableFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: selectedFile === file ? '#0066ff' : '#2a2a2a',
                      color: '#fff',
                      border: selectedFile === file ? '2px solid #0088ff' : '1px solid #444',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {selectedFile === file ? '✅ ' : ''}{file}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Status Messages */}
          {loading && (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#ffaa00',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '16px',
                textAlign: 'center',
              }}
            >
              ⏳ Loading video data...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '20px',
                backgroundColor: '#ff4444',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              <strong>❌ Error:</strong> {error}
              <br />
              <br />
              <strong>💡 Hướng dẫn:</strong>
              <ol style={{ marginTop: '10px', marginLeft: '20px' }}>
                <li>Generate JSON: <code>node test-generate.js "Your text"</code></li>
                <li>File sẽ được lưu trong: <code>public/generated/</code></li>
                <li>Refresh trang này và chọn file</li>
              </ol>
            </div>
          )}

          {/* Instructions */}
          <div
            style={{
              padding: '20px',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>📋 Hướng dẫn nhanh:</h3>
            <ol style={{ marginLeft: '20px', paddingLeft: 0 }}>
              <li>
                <strong>Tạo JSON data:</strong>
                <code
                  style={{
                    display: 'block',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '4px',
                    marginTop: '6px',
                    fontSize: '12px',
                  }}
                >
                  node test-generate.js "Nội dung video..."
                </code>
              </li>
              <li style={{ marginTop: '12px' }}>
                <strong>Chọn file JSON từ list trên</strong>
              </li>
              <li style={{ marginTop: '12px' }}>
                <strong>Video sẽ tự động load và preview!</strong>
              </li>
            </ol>
          </div>

          {/* Current Selection Info */}
          {selectedFile && !error && !loading && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#0066ff22',
                border: '1px solid #0066ff',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              📌 Đang load: <strong>{selectedFile}</strong>
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Render actual video when data is loaded
  const { config, sceneAnalysis, audioTimestamp, selectedImages, mediaAssets } = videoData;

  // Use mediaAssets if available, fallback to selectedImages (legacy)
  const assets: MediaAsset[] = mediaAssets || (selectedImages?.map((img) => ({
    type: 'image' as const,
    url: img.url,
    thumbnailUrl: img.thumbnailUrl,
    source: img.source,
    photographer: img.photographer,
    relevanceScore: img.relevanceScore,
  })) || []);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Audio Layer */}
      {audioTimestamp.audioUrl && <Audio src={audioTimestamp.audioUrl} />}

      {/* Media Sequences (Images or Videos) with Animations */}
      {sceneAnalysis.scenes.map((scene, index) => {
        const startFrame = Math.floor(scene.startTime * fps);
        const durationInFrames = Math.floor((scene.endTime - scene.startTime) * fps);
        const media = assets[index];

        if (!media) return null;

        return (
          <Sequence
            key={`scene-${index}`}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <VideoMedia
              media={media}
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

      {/* Watermark */}
      {config.watermark && <Watermark config={config.watermark} />}

      {/* Video Info Overlay (top-left corner, subtle) */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      >
        📁 {selectedFile}
      </div>
    </AbsoluteFill>
  );
};
