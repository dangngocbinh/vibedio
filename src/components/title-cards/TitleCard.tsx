import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring, Img } from 'remotion';

export interface TitleCardProps {
    text: string;
    style?: 'minimal' | 'bold' | 'cinematic';
    position?: 'overlay' | 'top' | 'center' | 'bottom';
    sceneType?: string;
    backgroundImage?: string;
}

const STYLE_CONFIGS = {
    minimal: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#FFFFFF',
        underlineColor: '#FFFFFF',
        fontSize: 72,
        fontWeight: 700 as const,
    },
    bold: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        textColor: '#FFD700',
        underlineColor: '#FFD700',
        fontSize: 84,
        fontWeight: 800 as const,
    },
    cinematic: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        textColor: '#FFFFFF',
        underlineColor: '#E0E0E0',
        fontSize: 78,
        fontWeight: 600 as const,
    },
};

const getPositionStyle = (position: string): React.CSSProperties => {
    switch (position) {
        case 'top':
            return { justifyContent: 'flex-start', paddingTop: 120 };
        case 'bottom':
            return { justifyContent: 'flex-end', paddingBottom: 120 };
        case 'center':
            return { justifyContent: 'center' };
        case 'overlay':
        default:
            return { justifyContent: 'center' };
    }
};

export const TitleCard: React.FC<TitleCardProps> = ({
    text,
    style = 'minimal',
    position = 'overlay',
    sceneType,
    backgroundImage,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const config = STYLE_CONFIGS[style] || STYLE_CONFIGS.minimal;
    const positionStyle = getPositionStyle(position);

    const fadeInEnd = Math.min(15, durationInFrames / 4);
    const fadeOutStart = Math.max(durationInFrames - 15, durationInFrames * 0.75);

    const opacity = interpolate(
        frame,
        [0, fadeInEnd, fadeOutStart, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    const slideUp = spring({
        frame,
        fps,
        config: { damping: 15, stiffness: 120, mass: 0.8 },
    });
    const translateY = interpolate(slideUp, [0, 1], [40, 0]);

    const underlineProgress = spring({
        frame: Math.max(0, frame - 8),
        fps,
        config: { damping: 20, stiffness: 100, mass: 0.6 },
    });
    const underlineWidth = interpolate(underlineProgress, [0, 1], [0, 100]);

    // Background Image Zoom Effect (Slow Ken Burns)
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.1]);

    return (
        <AbsoluteFill style={{ opacity }}>
            {backgroundImage && (
                <AbsoluteFill>
                    <Img
                        src={backgroundImage}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: `scale(${scale})`
                        }}
                    />
                    {/* Dark Overlay for text readability */}
                    <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </AbsoluteFill>
            )}

            <AbsoluteFill
                style={{
                    ...positionStyle,
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        transform: `translateY(${translateY}px)`,
                        backgroundColor: config.backgroundColor,
                        padding: '24px 48px',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        backdropFilter: backgroundImage ? 'blur(10px)' : undefined,
                    }}
                >
                    <div
                        style={{
                            color: config.textColor,
                            fontSize: config.fontSize,
                            fontWeight: config.fontWeight,
                            fontFamily: 'Inter, Montserrat, sans-serif',
                            letterSpacing: 2,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                        }}
                    >
                        {text}
                    </div>
                    <div
                        style={{
                            height: 3,
                            width: `${underlineWidth}%`,
                            backgroundColor: config.underlineColor,
                            borderRadius: 2,
                            opacity: 0.8,
                        }}
                    />
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
