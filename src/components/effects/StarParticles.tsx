import React, { useMemo } from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';

// Helper to resolve audio URL
const resolveAudioUrl = (src: string): string => {
    if (!src) return src;
    // Already absolute URL
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return src;
    }
    // Already a static file path starting with /
    if (src.startsWith('/')) {
        return src;
    }
    // Relative path - needs to be resolved via staticFile or direct path
    // For project-relative paths like "audio/background-music.mp3"
    // We assume it's relative to public folder
    return src;
};

/**
 * StarParticles Component
 *
 * Renders floating star particles with lens flare effect.
 * Stars react to music - brightness and glow pulse with the beat.
 *
 * Props:
 * - audioSrc: Audio source URL for music reactivity
 * - starCount: Number of stars (default: 50)
 * - baseOpacity: Base opacity of stars (default: 0.6)
 * - glowIntensity: How much glow increases on beat (default: 1.5)
 * - floatSpeed: Speed of floating movement (default: 1)
 * - colorTint: Color tint for stars (default: '#FFD700' gold)
 */

interface StarParticlesProps {
    audioSrc?: string;
    starCount?: number;
    baseOpacity?: number;
    glowIntensity?: number;
    floatSpeed?: number;
    colorTint?: string;
}

// Star shapes using CSS
const StarShape: React.FC<{
    size: number;
    color: string;
    opacity: number;
    glow: number;
    rays?: number;
}> = ({ size, color, opacity, glow, rays = 4 }) => {
    // Create a 4-point or 6-point star with glow
    const glowSize = size * (1 + glow * 0.5);
    const rayLength = size * 2;

    return (
        <div
            style={{
                position: 'relative',
                width: glowSize,
                height: glowSize,
                opacity,
            }}
        >
            {/* Main glow */}
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                    filter: `blur(${size * 0.3}px)`,
                    transform: `scale(${1 + glow * 0.3})`,
                }}
            />

            {/* Star rays - horizontal */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: rayLength * (1 + glow * 0.5),
                    height: size * 0.15,
                    background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                    transform: 'translate(-50%, -50%)',
                    filter: `blur(${size * 0.1}px)`,
                }}
            />

            {/* Star rays - vertical */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: size * 0.15,
                    height: rayLength * (1 + glow * 0.5),
                    background: `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)`,
                    transform: 'translate(-50%, -50%)',
                    filter: `blur(${size * 0.1}px)`,
                }}
            />

            {/* Diagonal rays for 6+ point stars */}
            {rays >= 6 && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: rayLength * 0.7 * (1 + glow * 0.4),
                            height: size * 0.12,
                            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                            transform: 'translate(-50%, -50%) rotate(45deg)',
                            filter: `blur(${size * 0.1}px)`,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: rayLength * 0.7 * (1 + glow * 0.4),
                            height: size * 0.12,
                            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                            transform: 'translate(-50%, -50%) rotate(-45deg)',
                            filter: `blur(${size * 0.1}px)`,
                        }}
                    />
                </>
            )}

            {/* Core bright point */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: size * 0.3,
                    height: size * 0.3,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 ${size * 0.5}px white, 0 0 ${size}px ${color}`,
                }}
            />
        </div>
    );
};

// Pure visual component
const StarCanvas: React.FC<{
    bloom: number;
    shake: { x: number; y: number };
    starCount: number;
    baseOpacity: number;
    glowIntensity: number;
    floatSpeed: number;
    colorTint: string;
}> = ({ bloom, shake, starCount, baseOpacity, glowIntensity, floatSpeed, colorTint }) => {
    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    // Generate stable particle data
    const stars = useMemo(() => {
        return new Array(starCount).fill(true).map((_, i) => {
            const seed = i * 7 + 42;
            return {
                x: random(seed) * width,
                y: random(seed + 1) * height,
                size: random(seed + 2) * 15 + 5, // 5-20px
                rays: random(seed + 3) > 0.5 ? 6 : 4,
                opacityBase: random(seed + 4) * 0.4 + 0.2, // 0.2-0.6
                twinkleSpeed: random(seed + 5) * 0.02 + 0.01,
                twinkleOffset: random(seed + 6) * Math.PI * 2,
                floatSpeedX: (random(seed + 7) - 0.5) * 0.3 * floatSpeed,
                floatSpeedY: random(seed + 8) * 0.2 * floatSpeed + 0.05,
                colorVariation: random(seed + 9),
            };
        });
    }, [width, height, starCount, floatSpeed]);

    return (
        <AbsoluteFill
            style={{
                pointerEvents: 'none',
                transform: `translate(${shake.x}px, ${shake.y}px)`,
                overflow: 'hidden',
            }}
        >
            {stars.map((star, i) => {
                // Twinkle animation
                const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
                const twinkleFactor = interpolate(twinkle, [-1, 1], [0.5, 1]);

                // Floating movement
                const floatY = (frame * star.floatSpeedY) % (height + 100);
                const currentY = (star.y - floatY + height + 50) % (height + 100) - 50;
                const sway = Math.sin(frame * 0.02 + star.twinkleOffset) * 30 * star.floatSpeedX;
                const currentX = star.x + sway;

                // Calculate opacity with twinkle and music bloom
                const musicBoost = interpolate(bloom, [0, 1], [1, 1.5]);
                const opacity = star.opacityBase * twinkleFactor * baseOpacity * musicBoost;

                // Music-reactive glow
                const glow = bloom * glowIntensity;

                // Color variation (warm gold to white)
                const warmth = star.colorVariation;
                const r = Math.round(255);
                const g = Math.round(215 + warmth * 40);
                const b = Math.round(warmth * 100);
                const starColor = colorTint === '#FFD700'
                    ? `rgb(${r}, ${g}, ${b})`
                    : colorTint;

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: currentX,
                            top: currentY,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <StarShape
                            size={star.size * (1 + bloom * 0.2)}
                            color={starColor}
                            opacity={opacity}
                            glow={glow}
                            rays={star.rays}
                        />
                    </div>
                );
            })}
        </AbsoluteFill>
    );
};

// Audio-reactive wrapper
const StarParticlesWithAudio: React.FC<{
    audioSrc: string;
    starCount: number;
    baseOpacity: number;
    glowIntensity: number;
    floatSpeed: number;
    colorTint: string;
}> = ({ audioSrc, starCount, baseOpacity, glowIntensity, floatSpeed, colorTint }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Debug: log the audio source being used
    React.useEffect(() => {
        console.log('[StarParticles] Audio source:', audioSrc);
    }, [audioSrc]);

    const audioData = useAudioData(audioSrc);

    let bloom = 0;
    let shake = { x: 0, y: 0 };

    if (audioData) {
        const visualization = visualizeAudio({
            fps,
            frame,
            audioData,
            numberOfSamples: 32,
        });

        // Calculate volume/intensity from audio
        const volume = visualization.reduce((a, b) => a + b, 0) / visualization.length;

        // Bass frequencies (first few samples) for bloom
        const bass = visualization.slice(0, 4).reduce((a, b) => a + b, 0) / 4;

        bloom = interpolate(bass, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

        // Subtle shake on strong beats
        const shakeIntensity = interpolate(volume, [0.1, 0.4], [0, 5], { extrapolateRight: 'clamp' });
        if (shakeIntensity > 0.5) {
            shake = {
                x: (random(frame) - 0.5) * shakeIntensity,
                y: (random(frame + 1) - 0.5) * shakeIntensity,
            };
        }
    }

    return (
        <StarCanvas
            bloom={bloom}
            shake={shake}
            starCount={starCount}
            baseOpacity={baseOpacity}
            glowIntensity={glowIntensity}
            floatSpeed={floatSpeed}
            colorTint={colorTint}
        />
    );
};

// Fallback component without audio (fake beat animation)
const StarParticlesNoAudio: React.FC<{
    starCount: number;
    baseOpacity: number;
    glowIntensity: number;
    floatSpeed: number;
    colorTint: string;
}> = ({ starCount, baseOpacity, glowIntensity, floatSpeed, colorTint }) => {
    const frame = useCurrentFrame();

    // Create a pulsing effect based on frame count (simulated beat ~100bpm)
    const beatFrame = frame % 18; // ~100bpm at 30fps
    const fakeBeat = beatFrame < 3 ? interpolate(beatFrame, [0, 3], [1, 0]) : 0;
    const bloom = fakeBeat * 0.3;

    return (
        <StarCanvas
            bloom={bloom}
            shake={{ x: 0, y: 0 }}
            starCount={starCount}
            baseOpacity={baseOpacity}
            glowIntensity={glowIntensity}
            floatSpeed={floatSpeed}
            colorTint={colorTint}
        />
    );
};

// Main export
export const StarParticles: React.FC<StarParticlesProps> = ({
    audioSrc,
    starCount = 50,
    baseOpacity = 0.6,
    glowIntensity = 1.5,
    floatSpeed = 1,
    colorTint = '#FFD700',
}) => {
    if (audioSrc) {
        return (
            <StarParticlesWithAudio
                audioSrc={audioSrc}
                starCount={starCount}
                baseOpacity={baseOpacity}
                glowIntensity={glowIntensity}
                floatSpeed={floatSpeed}
                colorTint={colorTint}
            />
        );
    }

    // Without audio - use fake beat animation
    return (
        <StarParticlesNoAudio
            starCount={starCount}
            baseOpacity={baseOpacity}
            glowIntensity={glowIntensity}
            floatSpeed={floatSpeed}
            colorTint={colorTint}
        />
    );
};

export default StarParticles;
