import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { CompositionMetadata } from './HomePage';
import './PlayerPreview.css';

// Import all compositions dynamically
import { VideoComposition } from '../compositions/VideoComposition';
import { ShowcaseComposition } from '../compositions/ShowcaseComposition';
import { JSONVideoComposition } from '../compositions/JSONVideoComposition';
import { NeonCountdown } from '../compositions/NeonCountdown';
import { NetworkVisualization } from '../compositions/NetworkVisualization';
import { LogoReveal } from '../compositions/LogoReveal';
import { LogoReveal2 } from '../compositions/LogoReveal2';
import { CartoonCharacter } from '../compositions/CartoonCharacter';

interface PlayerPreviewProps {
    composition: CompositionMetadata;
    onClose: () => void;
}

// Map composition IDs to their components
const compositionComponents: Record<string, React.ComponentType<any>> = {
    AutoVideo: VideoComposition,
    AutoVideoLandscape: VideoComposition,
    AutoVideoSquare: VideoComposition,
    AnimationShowcase: ShowcaseComposition,
    JSONVideo: JSONVideoComposition,
    JSONVideoLandscape: JSONVideoComposition,
    JSONVideoSquare: JSONVideoComposition,
    NeonCountdown: NeonCountdown,
    NetworkVisualization: NetworkVisualization,
    LogoReveal: LogoReveal,
    LogoReveal2: LogoReveal2,
    CartoonCharacter: CartoonCharacter,
};

export const PlayerPreview: React.FC<PlayerPreviewProps> = ({ composition, onClose }) => {
    const playerRef = useRef<PlayerRef>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    // Get component for this composition
    const Component = compositionComponents[composition.id];

    // Calculate player dimensions to fit in viewport
    const calculatePlayerSize = useCallback(() => {
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.7;
        const aspectRatio = composition.width / composition.height;

        let width = composition.width;
        let height = composition.height;

        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return { width: Math.floor(width), height: Math.floor(height) };
    }, [composition.width, composition.height]);

    const { width: playerWidth, height: playerHeight } = calculatePlayerSize();

    // Set up event listeners for player
    useEffect(() => {
        const { current } = playerRef;
        if (!current) {
            return;
        }

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleFrameUpdate = (data: { detail: { frame: number } }) => {
            setCurrentFrame(data.detail.frame);
        };

        current.addEventListener('play', handlePlay);
        current.addEventListener('pause', handlePause);
        current.addEventListener('frameupdate', handleFrameUpdate);

        return () => {
            current.removeEventListener('play', handlePlay);
            current.removeEventListener('pause', handlePause);
            current.removeEventListener('frameupdate', handleFrameUpdate);
        };
    }, []);

    // Handle keyboard events
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === ' ') {
            e.preventDefault();
            if (playerRef.current) {
                if (isPlaying) {
                    playerRef.current.pause();
                } else {
                    playerRef.current.play();
                }
            }
        }
    }, [isPlaying, onClose]);

    // Handle background click
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Toggle play/pause
    const togglePlayback = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play();
            }
        }
    };

    // Seek to specific frame
    const handleSeek = (frame: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(frame);
        }
    };

    // Format time display
    const formatTime = (frame: number, fps: number): string => {
        const seconds = frame / fps;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!Component) {
        return (
            <div className="player-modal active" onClick={handleBackgroundClick} onKeyDown={handleKeyDown} tabIndex={0}>
                <div className="player-container">
                    <div className="player-header">
                        <div className="player-title">Composition not found</div>
                        <button className="close-btn" onClick={onClose}>✕ Close</button>
                    </div>
                    <div className="player-content">
                        <p>Component "{composition.id}" not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="player-modal active" onClick={handleBackgroundClick} onKeyDown={handleKeyDown} tabIndex={0}>
            <div className="player-container">
                {/* Header */}
                <div className="player-header">
                    <div className="player-title">{composition.name}</div>
                    <button className="close-btn" onClick={onClose}>✕ Close</button>
                </div>

                {/* Player Content */}
                <div className="player-content">
                    <Player
                        ref={playerRef}
                        component={Component}
                        durationInFrames={composition.durationInFrames}
                        fps={composition.fps}
                        compositionWidth={composition.width}
                        compositionHeight={composition.height}
                        inputProps={composition.defaultProps || {}}
                        style={{
                            width: playerWidth,
                            height: playerHeight,
                        }}
                        controls
                        autoPlay={false}
                        loop
                        clickToPlay
                        doubleClickToFullscreen
                        spaceKeyToPlayOrPause
                        showVolumeControls
                        allowFullscreen
                    />
                </div>

                {/* Custom Controls Info */}
                <div className="player-footer">
                    <div className="time-display">
                        {formatTime(currentFrame, composition.fps)} / {formatTime(composition.durationInFrames, composition.fps)}
                    </div>
                    <div className="player-info">
                        <span className="info-item">Frame: {currentFrame}/{composition.durationInFrames}</span>
                        <span className="info-item">{composition.width}×{composition.height}</span>
                        <span className="info-item">{composition.fps} FPS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
