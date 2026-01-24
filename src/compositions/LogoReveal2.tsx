import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    interpolate,
    Easing,
    spring,
    useVideoConfig,
    Img,
} from 'remotion';
import { noise3D } from '@remotion/noise';

interface LogoReveal2Props {
    logoUrl?: string;
    brandText?: string;
    tagline?: string;
}

const PARTICLE_COUNT = 200;

export const LogoReveal2: React.FC<LogoReveal2Props> = ({
    logoUrl = 'https://via.placeholder.com/400x400/6366f1/ffffff?text=LOGO',
    brandText = 'YOUR BRAND',
    tagline = 'Excellence in Motion',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Generate deterministic particles with 3D depth
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const radius = 60 + (noise3D('radius', i, 0, 0) * 20);

            return {
                id: i,
                // Start positions - scattered in a circle pattern
                startX: 50 + Math.cos(angle) * radius,
                startY: 50 + Math.sin(angle) * radius,
                // Depth (z-axis simulation)
                depth: noise3D('depth', i, 0, 0) * 0.5 + 0.5,
                // Size variation
                size: 2 + (i % 5),
                // Color variation
                hue: (i / PARTICLE_COUNT) * 60 + 200, // Blue to purple range
                // Delay for staggered animation
                delay: (i / PARTICLE_COUNT) * 20,
            };
        });
    }, []);

    // Phase 1: Particle Implosion (frames 0-60)
    const renderParticles = () => {
        return particles.map((p) => {
            // Spring animation for organic movement
            const convergenceProgress = spring({
                frame: frame - p.delay,
                fps,
                config: {
                    damping: 20,
                    stiffness: 80,
                    mass: 0.5,
                },
            });

            // Current position interpolation
            const currentX = interpolate(
                convergenceProgress,
                [0, 1],
                [p.startX, 50],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            const currentY = interpolate(
                convergenceProgress,
                [0, 1],
                [p.startY, 50],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            // Opacity lifecycle
            const opacity = interpolate(
                frame,
                [p.delay, p.delay + 5, 50, 60],
                [0, 1, 1, 0],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            // Scale based on depth
            const scale = 0.5 + p.depth * 1.5;

            // Glow intensity with pulse
            const pulseGlow = Math.sin(frame * 0.1 + p.id) * 0.3 + 0.7;

            if (frame < 5 + p.delay || frame > 65) return null;

            return (
                <div
                    key={`particle-${p.id}`}
                    style={{
                        position: 'absolute',
                        left: `${currentX}%`,
                        top: `${currentY}%`,
                        width: `${p.size * scale}px`,
                        height: `${p.size * scale}px`,
                        borderRadius: '50%',
                        background: `hsl(${p.hue}, 100%, 70%)`,
                        transform: 'translate(-50%, -50%)',
                        opacity: opacity * p.depth,
                        boxShadow: `0 0 ${15 * pulseGlow * p.depth}px hsl(${p.hue}, 100%, 70%)`,
                        filter: `blur(${(1 - p.depth) * 1}px)`,
                    }}
                />
            );
        });
    };

    // Phase 2: White Flash (frames 55-65)
    const flashOpacity = interpolate(
        frame,
        [55, 58, 62, 65],
        [0, 1, 0.3, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Phase 3: Logo Reveal with Cinematic Effects (frames 60-120)
    const logoScale = spring({
        frame: frame - 60,
        fps,
        config: {
            damping: 15,
            stiffness: 60,
        },
    });

    const logoOpacity = interpolate(
        frame,
        [60, 75],
        [0, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.quad),
        }
    );

    const logoRotation = interpolate(
        frame,
        [60, 85],
        [180, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
        }
    );

    // Lens flare effect
    const lensFlareOpacity = interpolate(
        frame,
        [58, 62, 70],
        [0, 0.8, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Phase 4: Text Reveal (frames 80-120)
    const textOpacity = interpolate(
        frame,
        [80, 95],
        [0, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.quad),
        }
    );

    const textTranslateY = interpolate(
        frame,
        [80, 95],
        [30, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.back(1.2)),
        }
    );

    const taglineOpacity = interpolate(
        frame,
        [95, 110],
        [0, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Light rays emanating from center
    const renderLightRays = () => {
        return [...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360;
            const rayOpacity = interpolate(
                frame,
                [55, 65, 75],
                [0, 0.3, 0],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            return (
                <div
                    key={`ray-${i}`}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '6px',
                        height: '60%',
                        background: `linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent)`,
                        transformOrigin: 'top center',
                        transform: `translate(-50%, 0) rotate(${angle}deg)`,
                        opacity: rayOpacity,
                        filter: 'blur(2px)',
                    }}
                />
            );
        });
    };

    // Orbiting particles around logo
    const renderOrbitingParticles = () => {
        if (frame < 70) return null;

        return [...Array(8)].map((_, i) => {
            const angle = (frame * 2 + i * 45) % 360;
            const radius = 25;
            const orbitOpacity = interpolate(
                frame,
                [70, 85],
                [0, 0.6],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            return (
                <div
                    key={`orbit-${i}`}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '35%',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: `hsl(${220 + i * 15}, 100%, 70%)`,
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${radius}%)`,
                        opacity: orbitOpacity,
                        boxShadow: `0 0 15px hsl(${220 + i * 15}, 100%, 70%)`,
                    }}
                />
            );
        });
    };

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Animated background grid */}
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                    opacity: interpolate(frame, [0, 30], [0, 0.3], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                    }),
                    transform: `scale(${1 + frame * 0.005}) rotate(${frame * 0.1}deg)`,
                }}
            />

            {/* Ambient glow sphere */}
            <div
                style={{
                    position: 'absolute',
                    top: '35%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                    opacity: interpolate(frame, [0, 40], [0, 1], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                    }),
                }}
            />

            {/* Light rays */}
            {renderLightRays()}

            {/* Converging particles */}
            {renderParticles()}

            {/* Lens flare effect */}
            <div
                style={{
                    position: 'absolute',
                    top: '35%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '1000px',
                    height: '1000px',
                    background: 'radial-gradient(circle, white 0%, transparent 50%)',
                    opacity: lensFlareOpacity,
                    pointerEvents: 'none',
                }}
            />

            {/* Logo container with 3D effects */}
            <div
                style={{
                    position: 'absolute',
                    top: '35%',
                    left: '50%',
                    transform: `
            translate(-50%, -50%)
            scale(${logoScale})
            rotateY(${logoRotation}deg)
          `,
                    opacity: logoOpacity,
                }}
            >
                {/* Outer glow ring */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '280px',
                        height: '280px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: `
              0 0 40px rgba(99, 102, 241, 0.6),
              inset 0 0 40px rgba(99, 102, 241, 0.3)
            `,
                    }}
                />

                {/* Logo image */}
                <div
                    style={{
                        position: 'relative',
                        width: '250px',
                        height: '250px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 80px rgba(99, 102, 241, 0.4)
            `,
                        border: '3px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <Img
                        src={logoUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>

                {/* Orbiting particles */}
                {renderOrbitingParticles()}
            </div>

            {/* Brand text */}
            <div
                style={{
                    position: 'absolute',
                    top: '62%',
                    left: '50%',
                    transform: `translate(-50%, ${textTranslateY}px)`,
                    opacity: textOpacity,
                    textAlign: 'center',
                    width: '90%',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '96px',
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '8px',
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', sans-serif",
                        textShadow: `
              0 0 30px rgba(99, 102, 241, 0.8),
              0 0 60px rgba(99, 102, 241, 0.5),
              0 4px 8px rgba(0, 0, 0, 0.5)
            `,
                        background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    {brandText}
                </h1>

                {/* Underline decoration */}
                <div
                    style={{
                        width: `${interpolate(frame, [85, 100], [0, 200], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                        })}px`,
                        height: '4px',
                        background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                        margin: '24px auto',
                        borderRadius: '2px',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.8)',
                    }}
                />

                {/* Tagline */}
                <p
                    style={{
                        margin: '20px 0 0 0',
                        fontSize: '32px',
                        fontWeight: 400,
                        color: '#cbd5e1',
                        letterSpacing: '4px',
                        fontFamily: "'Inter', sans-serif",
                        opacity: taglineOpacity,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {tagline}
                </p>
            </div>

            {/* White flash overlay */}
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
