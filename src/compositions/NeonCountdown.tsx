import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { noise3D } from '@remotion/noise';
import * as d3 from 'd3';

export const NeonCountdown: React.FC = () => {
    const frame = useCurrentFrame();
    const fps = 30;

    // Each number shows for 1 second (30 frames)
    const numberDuration = fps;
    const numbers = [5, 4, 3, 2, 1];

    // Determine which number to show
    const currentNumberIndex = Math.floor(frame / numberDuration);
    const currentNumber = numbers[currentNumberIndex];

    // Frame within current number's duration (0-29)
    const localFrame = frame % numberDuration;

    // Don't render if we're past all numbers
    if (currentNumberIndex >= numbers.length) {
        return (
            <AbsoluteFill
                style={{
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)',
                }}
            />
        );
    }

    // Animation phases with enhanced easing
    // 0-10 frames: Scale up and fade in with elastic effect
    // 10-20 frames: Hold at full scale with organic pulse
    // 20-30 frames: Fade out with smooth deceleration

    // Enhanced scale animation with overshoot
    const scale = interpolate(
        localFrame,
        [0, 8, 12, 20, 29],
        [0.3, 1.25, 1.0, 1.05, 0.85],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }
    );

    // Opacity animation with smooth curves
    const opacity = interpolate(
        localFrame,
        [0, 6, 22, 29],
        [0, 1, 1, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }
    );

    // Organic pulse using Perlin noise
    const noiseFactor = noise3D('glow', frame * 0.05, currentNumberIndex, 0);
    const glowIntensity = interpolate(
        localFrame,
        [8, 15, 22],
        [1, 1.8, 1.2],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.sin),
        }
    ) * (1 + noiseFactor * 0.3);

    // Advanced color palette with D3 interpolation
    const colorSchemes = [
        { primary: '#00ffff', secondary: '#0080ff', accent: '#00ff80' }, // Cyan
        { primary: '#ff00ff', secondary: '#ff0080', accent: '#ff80ff' }, // Magenta
        { primary: '#ffff00', secondary: '#ff8000', accent: '#80ff00' }, // Yellow
        { primary: '#00ff00', secondary: '#00ff80', accent: '#80ff80' }, // Green
        { primary: '#ff0080', secondary: '#ff00ff', accent: '#ff8080' }, // Pink
    ];

    const currentScheme = colorSchemes[currentNumberIndex];
    const { primary: primaryColor, secondary: secondaryColor, accent: accentColor } = currentScheme;

    // Background particles with 3D depth effect
    const particleRotation = interpolate(
        frame,
        [0, 150],
        [0, 360],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Chromatic aberration offset
    const chromaticOffset = interpolate(
        localFrame,
        [0, 10, 20, 29],
        [0, 3, 2, 5],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Rotation with noise
    const rotationNoise = noise3D('rotation', frame * 0.02, currentNumberIndex, 0);
    const rotation = rotationNoise * 5;

    // Background gradient animation
    const bgGradientAngle = interpolate(
        frame,
        [0, 150],
        [135, 225],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    return (
        <AbsoluteFill
            style={{
                background: `linear-gradient(${bgGradientAngle}deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a1a 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Enhanced 3D particle field with depth */}
            <div
                style={{
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    top: '-50%',
                    left: '-50%',
                    transform: `rotate(${particleRotation}deg)`,
                    opacity: 0.15,
                }}
            >
                {[...Array(40)].map((_, i) => {
                    const angle = (i / 40) * 360;
                    const distance = 35 + (i % 5) * 8;
                    const size = 2 + (i % 4);
                    const depth = Math.sin((frame + i * 10) * 0.1) * 0.5 + 0.5;
                    const particleColor = i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : accentColor;

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: `${size}px`,
                                height: `${size}px`,
                                borderRadius: '50%',
                                background: particleColor,
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${distance}%)`,
                                boxShadow: `0 0 ${15 * depth}px ${particleColor}`,
                                opacity: depth,
                            }}
                        />
                    );
                })}
            </div>

            {/* Energy rings with noise-based animation */}
            {[...Array(5)].map((_, i) => {
                const ringScale = 0.6 + i * 0.15;
                const ringNoise = noise3D('ring', frame * 0.03, i, currentNumberIndex);
                const ringOpacity = (0.1 - i * 0.015) * opacity * (1 + ringNoise * 0.5);

                return (
                    <div
                        key={`ring-${i}`}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${scale * ringScale}) rotate(${rotation * (i + 1)}deg)`,
                            opacity: ringOpacity,
                            width: '500px',
                            height: '500px',
                            borderRadius: '50%',
                            border: `${2 + i}px solid ${i % 2 === 0 ? primaryColor : accentColor}`,
                            boxShadow: `
                0 0 ${40 * glowIntensity}px ${primaryColor},
                inset 0 0 ${40 * glowIntensity}px ${primaryColor}
              `,
                        }}
                    />
                );
            })}

            {/* Chromatic aberration effect - Red channel */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${-chromaticOffset}px, ${-chromaticOffset}px) scale(${scale}) rotate(${rotation}deg)`,
                    opacity: opacity * 0.5,
                    mixBlendMode: 'screen',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '280px',
                        fontWeight: 900,
                        fontFamily: "'Inter', 'Arial Black', sans-serif",
                        color: '#ff0000',
                        textAlign: 'center',
                        lineHeight: 1,
                        WebkitTextStroke: `1px #ff0000`,
                        letterSpacing: '-0.02em',
                        filter: 'blur(1px)',
                    }}
                >
                    {currentNumber}
                </h1>
            </div>

            {/* Chromatic aberration effect - Blue channel */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${chromaticOffset}px, ${chromaticOffset}px) scale(${scale}) rotate(${rotation}deg)`,
                    opacity: opacity * 0.5,
                    mixBlendMode: 'screen',
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '280px',
                        fontWeight: 900,
                        fontFamily: "'Inter', 'Arial Black', sans-serif",
                        color: '#0000ff',
                        textAlign: 'center',
                        lineHeight: 1,
                        WebkitTextStroke: `1px #0000ff`,
                        letterSpacing: '-0.02em',
                        filter: 'blur(1px)',
                    }}
                >
                    {currentNumber}
                </h1>
            </div>

            {/* Main number with enhanced neon glow */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                    opacity,
                    filter: `drop-shadow(0 0 ${20 * glowIntensity}px ${primaryColor})`,
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: '280px',
                        fontWeight: 900,
                        fontFamily: "'Inter', 'Arial Black', sans-serif",
                        color: primaryColor,
                        textAlign: 'center',
                        lineHeight: 1,
                        textShadow: `
              0 0 ${10 * glowIntensity}px ${primaryColor},
              0 0 ${20 * glowIntensity}px ${primaryColor},
              0 0 ${40 * glowIntensity}px ${primaryColor},
              0 0 ${60 * glowIntensity}px ${secondaryColor},
              0 0 ${100 * glowIntensity}px ${secondaryColor},
              0 0 ${140 * glowIntensity}px ${accentColor},
              0 0 ${180 * glowIntensity}px ${accentColor}
            `,
                        WebkitTextStroke: `3px ${secondaryColor}`,
                        letterSpacing: '-0.02em',
                    }}
                >
                    {currentNumber}
                </h1>
            </div>

            {/* Light rays emanating from center */}
            {[...Array(12)].map((_, i) => {
                const rayAngle = (i / 12) * 360;
                const rayLength = interpolate(
                    localFrame,
                    [0, 10, 20, 29],
                    [0, 100, 80, 0],
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
                            width: '4px',
                            height: `${rayLength}%`,
                            background: `linear-gradient(to bottom, ${primaryColor}, transparent)`,
                            transform: `translate(-50%, -100%) rotate(${rayAngle}deg)`,
                            transformOrigin: 'bottom center',
                            opacity: opacity * 0.3,
                            boxShadow: `0 0 20px ${primaryColor}`,
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};
