import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring } from 'remotion';

export const CartoonCharacter: React.FC = () => {
    const frame = useCurrentFrame();
    const fps = 30;
    const durationInFrames = 240; // 8 seconds

    // Bounce animation (gentle up/down loop)
    const bounceProgress = Math.sin((frame / fps) * Math.PI * 2 * 0.5); // half cycle per second
    const bounceY = interpolate(
        bounceProgress,
        [-1, 0, 1],
        [5, 0, 5], // move up 5% then down 5%
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Eye blink (every ~2 seconds, blink lasts ~5 frames)
    const blinkCycle = 60; // frames per blink cycle (2 seconds)
    const blinkPhase = frame % blinkCycle;
    const eyeScaleY = interpolate(
        blinkPhase,
        [0, 2, 5, 7, blinkCycle],
        [1, 0.1, 0.1, 1, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
    );

    // Smile appears after 2 seconds (frame >= 60)
    const smileOpacity = interpolate(
        frame,
        [60, 70],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
    );

    // Character color palette
    const bodyColor = '#ffcc80'; // warm pastel orange
    const eyeColor = '#ffffff';
    const pupilColor = '#333333';
    const smileColor = '#ff7043';

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #ffe5b4 0%, #fff5e1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Character container */}
            <div
                style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    transform: `translateY(${bounceY}%)`,
                }}
            >
                {/* Body (circle) */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: bodyColor,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                    }}
                />

                {/* Eyes */}
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: '35%',
                            left: i === 0 ? '30%' : '70%',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: eyeColor,
                            overflow: 'hidden',
                            transform: `scaleY(${eyeScaleY})`,
                            transformOrigin: 'center center',
                        }}
                    >
                        {/* Pupil */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: pupilColor,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </div>
                ))}

                {/* Smile (arc) */}
                <svg
                    viewBox="0 0 100 50"
                    style={{
                        position: 'absolute',
                        bottom: '25%',
                        left: '50%',
                        width: '80px',
                        height: '40px',
                        transform: 'translateX(-50%)',
                        opacity: smileOpacity,
                    }}
                >
                    <path
                        d="M10,30 Q50,60 90,30"
                        stroke={smileColor}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </AbsoluteFill>
    );
};
