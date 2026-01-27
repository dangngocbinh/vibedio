import React, { useState } from 'react';
import { PlayerPreview } from './PlayerPreview';
import './HomePage.css';

// Composition metadata
export interface CompositionMetadata {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    defaultProps?: any;
}

export const compositions: CompositionMetadata[] = [
    {
        id: 'OtioTimeline',
        name: 'Otio Timeline (Portrait 9:16)',
        description: 'OTIO project player - TikTok/Shorts/Reels format',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 900,
    },
    {
        id: 'OtioTimelineLandscape',
        name: 'Otio Timeline (Landscape 16:9)',
        description: 'OTIO project player - YouTube format',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 900,
    },
    {
        id: 'OtioTimelineSquare',
        name: 'Otio Timeline (Square 1:1)',
        description: 'OTIO project player - Instagram format',
        width: 1080,
        height: 1080,
        fps: 30,
        durationInFrames: 900,
    },
    {
        id: 'OtioTimeline4x5',
        name: 'Otio Timeline (Portrait 4:5)',
        description: 'OTIO project player - Instagram/Facebook Feed',
        width: 1080,
        height: 1350,
        fps: 30,
        durationInFrames: 900,
    },
    {
        id: 'JSONVideo',
        name: 'JSON Video (Portrait)',
        description: 'TikTok/Reels format - Load video from JSON data',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 450,
        defaultProps: { jsonPath: 'generated/example-video.json' }
    },
    {
        id: 'JSONVideoLandscape',
        name: 'JSON Video (Landscape)',
        description: 'YouTube format - Load video from JSON data',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 450,
        defaultProps: { jsonPath: 'generated/example-video.json' }
    },
    {
        id: 'JSONVideoSquare',
        name: 'JSON Video (Square)',
        description: 'Instagram format - Load video from JSON data',
        width: 1080,
        height: 1080,
        fps: 30,
        durationInFrames: 450,
        defaultProps: { jsonPath: 'generated/example-video.json' }
    },
    {
        id: 'LogoReveal2',
        name: 'Logo Reveal Pro',
        description: 'Professional logo animation with particles',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 120,
        defaultProps: { brandText: 'YOUR BRAND', tagline: 'Excellence in Motion' }
    },
    {
        id: 'LogoReveal',
        name: 'Logo Reveal',
        description: 'Particle convergence animation',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 120
    },
    {
        id: 'NeonCountdown',
        name: 'Neon Countdown',
        description: 'Vibrant neon countdown animation',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 150
    },
    {
        id: 'NetworkVisualization',
        name: 'Network Visualization',
        description: 'Organic network growth animation',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 210
    },
    {
        id: 'CartoonCharacter',
        name: 'Cartoon Character',
        description: 'Friendly bouncing character',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 240
    },
    {
        id: 'AnimationShowcase',
        name: 'Animation Showcase',
        description: 'Showcase of all animation effects',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 750
    }
];

export const HomePage: React.FC = () => {
    const [selectedComposition, setSelectedComposition] = useState<CompositionMetadata | null>(null);

    const getAspectRatioLabel = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.01) return 'Landscape 16:9';
        if (Math.abs(ratio - 9 / 16) < 0.01) return 'Portrait 9:16';
        if (Math.abs(ratio - 1) < 0.01) return 'Square 1:1';
        if (Math.abs(ratio - 4 / 5) < 0.01) return 'Portrait 4:5';
        if (width > height) return 'Landscape';
        if (width === height) return 'Square';
        return 'Portrait';
    };

    const getDuration = (frames: number, fps: number): string => {
        return (frames / fps).toFixed(1) + 's';
    };

    return (
        <div className="home-page">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <span className="logo-icon">▶</span>
                        Remotion Preview
                    </div>
                    <a href="http://localhost:3000" className="studio-btn" target="_blank" rel="noopener noreferrer">
                        Open Studio
                    </a>
                </div>
            </header>

            {/* Main Content */}
            <main className="container">
                <h1 className="title">Video Composition Gallery</h1>
                <p className="subtitle">Preview your Remotion compositions instantly - no studio required</p>

                {/* Compositions Grid */}
                <div className="compositions-grid">
                    {compositions.map((comp) => (
                        <div
                            key={comp.id}
                            className="composition-card"
                            onClick={() => setSelectedComposition(comp)}
                        >
                            <h3 className="composition-name">{comp.name}</h3>
                            <div className="composition-info">
                                <span className="info-badge">{comp.width}x{comp.height}</span>
                                <span className="info-badge">{getAspectRatioLabel(comp.width, comp.height)}</span>
                                <span className="info-badge">{getDuration(comp.durationInFrames, comp.fps)}</span>
                                <span className="info-badge">{comp.fps} FPS</span>
                            </div>
                            <p className="composition-description">{comp.description}</p>
                            <button className="play-btn">
                                ▶ Preview
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            {/* Player Modal */}
            {selectedComposition && (
                <PlayerPreview
                    composition={selectedComposition}
                    onClose={() => setSelectedComposition(null)}
                />
            )}
        </div>
    );
};
