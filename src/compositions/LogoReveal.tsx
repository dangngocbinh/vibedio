import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    interpolate,
    Easing,
    spring,
    useVideoConfig,
} from 'remotion';
import { noise3D } from '@remotion/noise';

const PARTICLE_COUNT = 150;

export const LogoReveal: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Generate deterministic random properties for particles
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            // Random initial position (scattered)
            startX: (noise3D('startX', i, 0, 0) * 0.5 + 0.5) * 100,
            startY: (noise3D('startY', i, 0, 0) * 0.5 + 0.5) * 100,
            // Random size
            size: Math.random() * 6 + 2,
            // Random delay for convergence
            delay: Math.random() * 15,
            // Color variation
            color: i % 2 === 0 ? '#ffffff' : '#a0c4ff',
        }));
    }, []);

    // 1. Particle Convergence Animation (0 - 50 frames)
    const renderParticles = () => {
        return particles.map((p) => {
            const convergenceFrame = 45;
            const progress = spring({
                frame: frame - p.delay,
                fps,
                config: {
                    damping: 12,
                    stiffness: 100,
                },
            });

            // Target position: forming a hexagon shape in the center
            // For simplicity, we first converge everything to exact center
            // then offset them to form a hexagon rim
            const angle = (p.id / PARTICLE_COUNT) * Math.PI * 2;
            const radius = 10; // 10% of screen

            // Target HEXAGON calculation
            // A simple way is to use a slightly modified circle or specific points
            const targetX = 50 + Math.cos(angle) * radius * (0.8 + Math.sin(angle * 6) * 0.1);
            const targetY = 50 + Math.sin(angle) * radius * (0.8 + Math.sin(angle * 6) * 0.1);

            const currentX = interpolate(progress, [0, 1], [p.startX, targetX]);
            const currentY = interpolate(progress, [0, 1], [p.startY, targetY]);

            const opacity = interpolate(progress, [0, 0.2, 0.9, 1], [0, 1, 1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });

            return (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${currentX}%`,
                        top: `${currentY}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: frame < 55 ? opacity : 0,
                        boxShadow: `0 0 10px ${p.color}`,
                    }}
                />
            );
        });
    };

    // 2. Flash Effect (around frame 45-60)
    const flashOpacity = interpolate(frame, [45, 48, 58], [0, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // 3. Logo Shape Appearance (after flash)
    const logoProgress = spring({
        frame: frame - 48,
        fps,
        config: {
            stiffness: 100,
        },
    });

    // 4. Text Appearance
    const textOpacity = interpolate(frame, [55, 75], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const textTranslateY = interpolate(frame, [55, 75], [20, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
    });

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #1a0b3b 0%, #003366 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Background Glow */}
            <div
                style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Scattered Particles Converging */}
            {renderParticles()}

            {/* Hexagon Logo Shape */}
            <div
                style={{
                    opacity: frame > 48 ? 1 : 0,
                    transform: `scale(${logoProgress}) rotate(${logoProgress * 60}deg)`,
                    width: '200px',
                    height: '200px',
                    backgroundColor: 'transparent',
                    border: '8px solid white',
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
                    position: 'absolute',
                    top: '35%', // Reserve safe zones, center logo around 35-50%
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Inner accent ring */}
                <div style={{
                    width: '140px',
                    height: '140px',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                }} />
            </div>

            {/* Text Reveal */}
            <div
                style={{
                    opacity: textOpacity,
                    transform: `translateY(${textTranslateY}px)`,
                    position: 'absolute',
                    top: '60%', // Centering text below the logo
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '80px',
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '12px',
                        textTransform: 'uppercase',
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    YOUR BRAND
                </h1>
                <div style={{
                    width: interpolate(frame, [65, 85], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) + 'px',
                    height: '4px',
                    background: 'white',
                    margin: '20px auto',
                    opacity: 0.8
                }} />
            </div>

            {/* Flash Whiteout */}
            <AbsoluteFill
                style={{
                    backgroundColor: 'white',
                    opacity: flashOpacity,
                    pointerEvents: 'none',
                }}
            />
        </AbsoluteFill>
    );
};
