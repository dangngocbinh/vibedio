import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const OpeningTitle: React.FC<{
    title: string;
    subtitle?: string;
}> = ({ title, subtitle }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Helper for splitting text into words for staggered effect
    const words = title.split(' ');

    return (
        <AbsoluteFill style={{
            backgroundColor: 'black', // Or transparent if overlay? User asked for component, let's treat as fullscreen title card for now.
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Gradient */}
            <AbsoluteFill style={{
                background: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)',
                opacity: 0.8
            }} />

            {/* Main Title Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '80%',
                zIndex: 1
            }}>
                {words.map((word, i) => {
                    const delay = i * 5;
                    // Scale up and fade in spring
                    const spr = spring({
                        frame: frame - delay,
                        fps,
                        config: {
                            damping: 12, // slightly bouncy
                            stiffness: 100,
                        },
                    });

                    // Opacity fade in
                    const opacity = interpolate(spr, [0, 1], [0, 1]);

                    return (
                        <div key={i} style={{
                            transform: `scale(${spr})`,
                            opacity,
                            display: 'inline-block'
                        }}>
                            <h1 style={{
                                fontFamily: '"SF Pro Display", "Helvetica Label", sans-serif',
                                fontWeight: 800,
                                fontSize: '80px',
                                background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: 0,
                                textShadow: '0px 10px 40px rgba(0, 242, 254, 0.3)'
                            }}>
                                {word}
                            </h1>
                        </div>
                    );
                })}
            </div>

            {/* Subtitle - simple fade up */}
            {subtitle && (
                <div style={{
                    marginTop: '20px',
                    opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                    transform: `translateY(${interpolate(frame, [30, 60], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                    zIndex: 1
                }}>
                    <h2 style={{
                        fontFamily: '"SF Pro Text", sans-serif',
                        fontSize: '32px',
                        color: '#aaa',
                        fontWeight: 300,
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>
                        {subtitle}
                    </h2>
                </div>
            )}

            {/* Cinematic Particle/Glow effect (Simple CSS) */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00f2fe, transparent)',
                bottom: '20%',
                opacity: interpolate(frame, [0, 40], [0, 0.5]),
                transform: `scaleX(${interpolate(frame, [0, 100], [0, 1.5])})`
            }} />

        </AbsoluteFill>
    );
};
