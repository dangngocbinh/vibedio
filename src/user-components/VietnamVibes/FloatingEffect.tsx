import React, { useMemo } from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';

// VUE COMPARISON:
// A component to render floating particles (bokeh/fireflies).
// Light, airy feel.

interface FloatingEffectProps {
    audioSrc?: string;
}

// 1. Pure Visual Component (No Hooks specific to Audio)
const FloatingCanvas: React.FC<{ shakeX: number; shakeY: number; bloom: number }> = ({ shakeX, shakeY, bloom }) => {
    const { width, height } = useVideoConfig(); // useVideoConfig is safe
    const frame = useCurrentFrame();

    // Create stable random data for particles
    const particles = useMemo(() => {
        return new Array(30).fill(true).map((_, i) => {
            const seed = i + 100; // unique seed
            const x = random(seed) * width;
            const y = random(seed + 1) * height;
            const radius = random(seed + 2) * 10 + 2;
            const opacityMax = random(seed + 3) * 0.5 + 0.1;
            const speedY = random(seed + 4) * 0.5 + 0.2;
            const speedX = (random(seed + 5) - 0.5) * 0.5;
            const delay = random(seed + 6) * 100;

            return { x, y, radius, opacityMax, speedY, speedX, delay };
        });
    }, [height, width]);

    return (
        <AbsoluteFill style={{
            pointerEvents: 'none',
            // Apply the shake to the entire container
            transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}>
            {particles.map((p, i) => {
                const movementY = (frame * p.speedY) % (height + 100);
                const currentY = (p.y - movementY + height) % (height + 50) - 25;
                const sway = Math.sin((frame + p.delay) / 60) * 20 * p.speedX;
                const currentX = p.x + sway;

                const opacity = interpolate(
                    Math.sin((frame + p.delay) / 30),
                    [-1, 1],
                    [0.1, p.opacityMax]
                );

                // Increase size/glow on bass bloom
                const currentRadius = p.radius + bloom * 0.5;

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: currentX,
                            top: currentY,
                            width: currentRadius,
                            height: currentRadius,
                            borderRadius: '50%',
                            opacity: opacity,
                            // Enhance glow on beat
                            backgroundColor: '#503b06ff',
                            boxShadow: `0 0 ${currentRadius * 2}px rgba(184, 134, 11, ${0.4 + bloom * 0.05})`,
                            filter: 'blur(1px)',
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};

// 2. Audio Logic Component (Calls Hook)
const FloatingEffectWithAudio: React.FC<{ audioSrc: string }> = ({ audioSrc }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const audioData = useAudioData(audioSrc); // Guaranteed to have src here by conditional render in parent

    let shakeX = 0;
    let shakeY = 0;
    let bloom = 0;

    if (audioData) {
        const visualization = visualizeAudio({
            fps,
            frame,
            audioData,
            numberOfSamples: 16,
        });

        const volume = visualization.reduce((a, b) => a + b, 0) / visualization.length;
        const shakeIntensity = interpolate(volume, [0, 0.5], [0, 20], { extrapolateRight: 'clamp' });

        if (shakeIntensity > 1) {
            shakeX = (random(frame) - 0.5) * shakeIntensity;
            shakeY = (random(frame + 1) - 0.5) * shakeIntensity;
            bloom = interpolate(volume, [0.2, 0.6], [0, 10], { extrapolateRight: 'clamp' });
        }
    }

    return <FloatingCanvas shakeX={shakeX} shakeY={shakeY} bloom={bloom} />;
};

// 3. Main Export (Switcher)
export const FloatingEffect: React.FC<FloatingEffectProps> = ({ audioSrc }) => {
    // If audioSrc is present, render the component that calls the hook.
    // Otherwise render the visual component directly with 0 shake.
    if (audioSrc) {
        return <FloatingEffectWithAudio audioSrc={audioSrc} />;
    }

    return <FloatingCanvas shakeX={0} shakeY={0} bloom={0} />;
};
