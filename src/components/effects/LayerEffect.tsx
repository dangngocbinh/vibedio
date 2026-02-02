import React, { useMemo, useEffect, useState } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Img,
    Easing,
    random,
    staticFile
} from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { useResponsiveScale } from '../../utils/useResponsiveScale';

// ============ TYPES ============
export type LayerEffectType =
    // Tech / HUD
    | 'neon-circle' | 'scan-lines' | 'techno-triangle' | 'crosshair' | 'hud-grid'
    | 'loading-ring' | 'plus-grid' | 'digital-noise' | 'radar-sweep' | 'target-scope-a'
    | 'target-scope-b' | 'cyber-frame-corners' | 'loading-dots' | 'loading-bars'
    | 'countdown-circle' | 'concentric-circles' | 'dashed-ring' | 'globe-grid' | 'dna-helix'

    // Geometric / Abstract
    | 'burst' | 'rotating-squares' | 'crossed-lines' | 'not-x' | 'zigzag-wave'
    | 'hex-hive' | 'square-tunnel' | 'floating-shapes' | 'triangle-float' | 'glitch-bars'
    | 'shockwave-ring' | 'electric-arc' | 'concentric-squares'

    // Comic / Hand-drawn
    | 'speed-lines-radial' | 'speed-lines-side' | 'comic-boom' | 'comic-speed'
    | 'hand-drawn-circle' | 'hand-drawn-arrow' | 'hand-drawn-scratch' | 'confetti-pop'

    // Nature / Organic
    | 'sound-wave' | 'particles' | 'star-field' | 'heart-beat' | 'music-notes-flow'
    | 'equalizer-circular' | 'lens-flare-sim' | 'vignette-pulse' | 'arrow-chevron-up' | 'arrow-chevron-right'

    | 'custom';

export type LayerEffectAnimation = 'fade' | 'scale' | 'rotate' | 'pulse';

export interface LayerEffectProps {
    type?: LayerEffectType;
    src?: string;

    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;

    animation?: LayerEffectAnimation;
    enterDuration?: number;
    exitDuration?: number;

    color?: string;
    secondaryColor?: string;
    scale?: number;
    rotation?: number;
    opacity?: number;
    speed?: number;
}

// ============ UTILS ============
// Reuse frame, speed, color
const useEff = (speed = 1) => {
    const frame = useCurrentFrame();
    return { frame, t: frame * speed };
}

// ============ COMPONENTS ============

// --- EXISTING RESTORED ---
const NeonCircle: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <svg
            width="100%" height="100%" viewBox="0 0 100 100"
            style={{
                transform: `rotate(${t * 2}deg)`,
                filter: `drop-shadow(0 0 8px ${color})`
            }}
        >
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
            <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="1" strokeDasharray="5 5" opacity="0.6" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
            <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="4" strokeDasharray="20 20" opacity="0.9" />
        </svg>
    );
};

const ScanLines: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', top: `${(t * 5 + i * 20) % 100}%`, left: 0, width: '100%', height: '2px', backgroundColor: color, opacity: 0.7 - (i * 0.1), boxShadow: `0 0 5px ${color}` }} />
            ))}
        </div>
    );
};

const Burst: React.FC<{ color: string; secondary: string }> = ({ color, secondary }) => {
    const frame = useCurrentFrame();
    const progress = (frame % 30) / 30;
    const scale = interpolate(progress, [0, 1], [0, 1.5]);
    const opacity = interpolate(progress, [0, 0.5, 1], [1, 0.8, 0]);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '50%', height: '50%', border: `2px solid ${color}`, transform: `scale(${scale}) rotate(45deg)`, opacity }} />
            <div style={{ position: 'absolute', width: '50%', height: '50%', border: `2px solid ${secondary}`, transform: `scale(${scale * 0.8})`, opacity }} />
        </div>
    );
};

const TechnoTriangle: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    const rotate = Math.sin(t * 0.05) * 20;
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon points="50,15 90,85 10,85" fill="none" stroke={color} strokeWidth="2" style={{ transformOrigin: 'center', transform: `rotate(${rotate}deg)` }} />
            <polygon points="50,25 80,75 20,75" fill="none" stroke={color} strokeWidth="1" opacity="0.5" style={{ transformOrigin: 'center', transform: `rotate(${-rotate * 1.5}deg)` }} />
        </svg>
    )
}

// --- NEW IMPLEMENTATIONS (Batch 1: TECH/HUD) ---
const Crosshair: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <path d="M50 10 L50 30 M50 70 L50 90 M10 50 L30 50 M70 50 L90 50" stroke={color} strokeWidth="2" />
            <circle cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth="1" strokeDasharray="10 5" style={{ transformOrigin: 'center', transform: `rotate(${t}deg)` }} />
            <circle cx="50" cy="50" r="2" fill={color} />
        </svg>
    )
}

const RadarSweep: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '50%', border: `1px solid ${color}`, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `conic-gradient(from 0deg, transparent 270deg, ${color} 360deg)`, opacity: 0.7, transform: `rotate(${t * 5}deg)`, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', background: color, borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
            {/* Random blips */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '4px', height: '4px', background: color, borderRadius: '50%', opacity: Math.sin(t * 0.2) > 0.9 ? 1 : 0 }} />
        </div>
    )
}

const TargetScopeA: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="1" strokeDasharray="40 20" style={{ transformOrigin: 'center', transform: `rotate(${t}deg)` }} />
            <path d="M50 5 L50 15 M50 85 L50 95 M5 50 L15 50 M85 50 L95 50" stroke={color} strokeWidth="3" />
            <rect x="35" y="35" width="30" height="30" fill="none" stroke={color} strokeWidth="1" />
        </svg>
    )
}

const CyberFrameCorners: React.FC<{ color: string }> = ({ color }) => {
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <path d="M10 30 L10 10 L30 10" fill="none" stroke={color} strokeWidth="3" />
            <path d="M90 30 L90 10 L70 10" fill="none" stroke={color} strokeWidth="3" />
            <path d="M10 70 L10 90 L30 90" fill="none" stroke={color} strokeWidth="3" />
            <path d="M90 70 L90 90 L70 90" fill="none" stroke={color} strokeWidth="3" />
        </svg>
    )
}

const DigitalNoise: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const frame = useCurrentFrame();
    const seed = Math.floor(frame * speed / 5);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(random(seed + i) * 100)}%`, top: `${(random(seed + i + 10) * 100)}%`, width: `${random(seed + i + 20) * 50}%`, height: '2px', backgroundColor: color, opacity: 0.8 }} />
            ))}
        </div>
    );
};

// --- BATCH 2: GEOMETRIC ---
const RotatingSquares: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'absolute', width: '60%', height: '60%', border: `2px solid ${color}`, transform: `rotate(${t}deg)` }} />
            <div style={{ position: 'absolute', width: '40%', height: '40%', border: `2px solid ${color}`, transform: `rotate(${-t * 1.5}deg)` }} />
            <div style={{ position: 'absolute', width: '20%', height: '20%', backgroundColor: color, transform: `rotate(${t * 2}deg)` }} />
        </div>
    )
}

const ConcentricCircles: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            {[1, 2, 3, 4].map(i => (
                <circle key={i} cx="50" cy="50" r={10 * i} fill="none" stroke={color} strokeWidth="1" strokeDasharray={`${15 * i} ${10}`} style={{ transformOrigin: 'center', transform: `rotate(${t * (i % 2 === 0 ? 1 : -1) / i}deg)` }} opacity={0.8} />
            ))}
        </svg>
    )
}

const DashedRing: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="4" strokeDasharray="5 15" style={{ transformOrigin: 'center', transform: `rotate(${t}deg)` }} strokeLinecap="round" />
        </svg>
    )
}

const ZigzagWave: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    const offset = (t * 2) % 100;
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 50 L10 40 L20 50 L30 40 L40 50 L50 40 L60 50 L70 40 L80 50 L90 40 L100 50" stroke={color} strokeWidth="2" fill="none" style={{ transform: `translateX(${-50 + offset}%) scaleX(2)` }} />
        </svg>
    )
}

const HexHive: React.FC<{ color: string }> = ({ color }) => {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', height: '100%', gap: '2px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ width: '23%', paddingBottom: '23%', position: 'relative', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: color, opacity: 0.2 + (i % 3) * 0.2 }} />
            ))}
        </div>
    )
}

const FloatingShapes: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t, frame } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {Array.from({ length: 6 }).map((_, i) => {
                const y = Math.sin(frame * 0.05 + i) * 15;
                return (
                    <div key={i} style={{ position: 'absolute', top: `${20 + i * 10}%`, left: `${10 + i * 15}%`, transform: `translateY(${y}px) rotate(${t + i * 20}deg)`, border: `1px solid ${color}`, width: '15px', height: '15px' }} />
                )
            })}
        </div>
    )
}

// --- BATCH 3: COMIC / HAND-DRAWN ---
const SpeedLinesRadial: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { frame } = useEff(speed);
    // Jump every 3 frames
    const seed = Math.floor(frame / 3);
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <defs>
                <mask id="centerMask">
                    <rect width="100" height="100" fill="white" />
                    <circle cx="50" cy="50" r="30" fill="black" />
                </mask>
            </defs>
            <g mask="url(#centerMask)">
                {Array.from({ length: 20 }).map((_, i) => (
                    <line key={i} x1="50" y1="50" x2={50 + Math.cos(i / 20 * Math.PI * 2) * 60} y2={50 + Math.sin(i / 20 * Math.PI * 2) * 60} stroke={color} strokeWidth={random(seed + i) * 3} opacity={random(seed + i + 1)} />
                ))}
            </g>
        </svg>
    )
}

const ComicBoom: React.FC<{ color: string; secondary: string }> = ({ color, secondary }) => {
    const { t } = useEff();
    const s = Math.min(1, t / 10); // scale up quick
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: `scale(${s})` }}>
            <path d="M50 10 L60 30 L80 20 L75 40 L90 50 L75 60 L80 80 L60 70 L50 90 L40 70 L20 80 L25 60 L10 50 L25 40 L20 20 L40 30 Z" fill={secondary} stroke={color} strokeWidth="2" />
            <text x="50" y="55" fontSize="15" fontWeight="bold" fill={color} textAnchor="middle" style={{ fontFamily: 'Impact, sans-serif' }}>BOOM!</text>
        </svg>
    )
}

const HandDrawnCircle: React.FC<{ color: string }> = ({ color }) => {
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
            <path d="M50 10 C 75 10, 90 25, 90 50 C 90 75, 75 90, 50 90 C 25 90, 10 75, 10 50 C 10 30, 20 15, 45 12" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ filter: 'url(#rough)' }} />
        </svg>
    )
}

// --- BATCH 4: NATURE / MISC ---
const SoundWave: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ width: '4px', height: `${20 + Math.abs(Math.sin(t * 0.2 + i)) * 80}%`, background: color, borderRadius: '2px' }} />
            ))}
        </div>
    )
}

const Particles: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { frame } = useEff(speed);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {Array.from({ length: 8 }).map((_, i) => {
                const y = (frame * speed * (0.5 + i * 0.1) + i * 30) % 120; // 0 to 120
                const x = (i * 12 + Math.sin(frame * 0.05 + i) * 10) % 100;
                const opacity = interpolate(y, [0, 80, 100], [0, 1, 0]);
                return (
                    <div key={i} style={{ position: 'absolute', left: `${x}%`, bottom: `${y}%`, width: `${(i % 3) + 3}px`, height: `${(i % 3) + 3}px`, borderRadius: '50%', backgroundColor: color, opacity }} />
                )
            })}
        </div>
    )
}

const LoadingDots: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, opacity: Math.sin(t * 0.2 - i) > 0 ? 1 : 0.3 }} />
            ))}
        </div>
    )
}

const ArrowChevronRight: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { t } = useEff(speed);
    return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{ borderRight: `4px solid ${color}`, borderBottom: `4px solid ${color}`, width: '20px', height: '20px', transform: 'rotate(-45deg)', opacity: (Math.floor(t * 0.2) % 3 === i) ? 1 : 0.3, margin: '-5px' }} />
            ))}
        </div>
    )
}

const GlitchBars: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
    const { frame } = useEff(speed);
    const noise = (i: number) => random(frame + i);
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: '10%', width: `${noise(i) * 100}%`, background: color, opacity: noise(i + 10) > 0.5 ? 0.8 : 0, transform: `translateX(${noise(i + 20) * 20 - 10}px)` }} />
            ))}
        </div>
    )
}

// Fallback for simple grids
const GridGen: React.FC<{ type: 'plus' | 'hud' | 'globe', color: string }> = ({ type, color }) => {
    if (type === 'plus') {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', opacity: 0.5 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ width: '30%', height: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                            <div style={{ position: 'absolute', top: '9px', width: '20px', height: '2px', background: color }} />
                            <div style={{ position: 'absolute', left: '9px', width: '2px', height: '20px', background: color }} />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    if (type === 'hud') {
        return (
            <div style={{ width: '100%', height: '100%', border: `1px solid ${color}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', opacity: 0.5 }}>
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ border: `0.5px solid ${color}`, opacity: 0.3 }} />
                ))}
            </div>
        )
    }
    return <div style={{ border: `1px solid ${color}`, width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, transparent 40%, ${color} 150%)`, opacity: 0.4 }} />
}

// ============ MAIN COMPONENT ============
export const LayerEffect: React.FC<LayerEffectProps> = ({
    type = 'custom',
    src,
    top, left, right, bottom,
    width = 300, height = 300,
    animation = 'fade',
    enterDuration: enterDurationProp,
    exitDuration: exitDurationProp,
    color = '#00d4ff',
    secondaryColor = '#ffae00',
    scale: baseScale = 1,
    rotation = 0,
    opacity: baseOpacity = 1,
    speed = 1
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const { scalePixel, uniformScale } = useResponsiveScale();

    // Scale dimensions responsively
    const scaledWidth = scalePixel(width as number);
    const scaledHeight = scalePixel(height as number);

    const enterDuration = enterDurationProp ?? 15;
    const exitDuration = exitDurationProp ?? 15;
    const exitStart = durationInFrames - exitDuration;

    // Animation
    let animOpacity = 1;
    if (enterDuration > 0 || exitDuration > 0) {
        // Safe interpolation ranges
        const ranges = [0];
        const values = [0];

        if (enterDuration > 0) {
            ranges.push(enterDuration);
            values.push(1);
        } else {
            // Start visible if no enter duration
            values[0] = 1;
        }

        if (exitDuration > 0) {
            ranges.push(exitStart);
            values.push(1);
            ranges.push(durationInFrames);
            values.push(0);
        } else {
            // Sustain visibility if no exit duration
            ranges.push(durationInFrames);
            values.push(1);
        }

        // Only interpolate if we have more than 1 point and ranges are valid
        if (ranges.length > 1 && ranges[ranges.length - 1] > ranges[0]) {
            animOpacity = interpolate(frame, ranges, values, { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        }
    }

    let animTransform = '';
    if (animation === 'scale') {
        const s = enterDuration > 0
            ? interpolate(frame, [0, enterDuration], [0, 1], { extrapolateRight: 'clamp', easing: Easing.back(1.5) })
            : 1;

        const exitS = exitDuration > 0
            ? interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
            : 1;

        animTransform = `scale(${frame < exitStart ? s : exitS})`;
    } else if (animation === 'rotate') {
        const r = enterDuration > 0
            ? interpolate(frame, [0, enterDuration], [-180, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
            : 0;
        animTransform = `rotate(${r}deg)`;
    } else if (animation === 'pulse') {
        const p = Math.sin(frame * 0.1) * 0.1 + 1;
        animTransform = `scale(${p})`;
    }

    const transform = `rotate(${rotation}deg) scale(${baseScale}) ${animTransform}`;

    // Lottie
    const isLottie = src?.toLowerCase().endsWith('.json');
    const [lottieData, setLottieData] = useState<LottieAnimationData | null>(null);
    useEffect(() => {
        if (isLottie && src) {
            fetch(src).then(res => res.json()).then(data => setLottieData(data)).catch(console.error);
        }
    }, [src, isLottie]);

    // Scale positions if they're numbers
    const scaledTop = typeof top === 'number' ? scalePixel(top) : top;
    const scaledLeft = typeof left === 'number' ? scalePixel(left) : left;
    const scaledRight = typeof right === 'number' ? scalePixel(right) : right;
    const scaledBottom = typeof bottom === 'number' ? scalePixel(bottom) : bottom;

    const posStyle: React.CSSProperties = {
        position: 'absolute',
        width: scaledWidth,
        height: scaledHeight,
        top: scaledTop ?? (scaledBottom ? undefined : '50%'),
        left: scaledLeft ?? (scaledRight ? undefined : '50%'),
        right: scaledRight,
        bottom: scaledBottom,
        transform: (!top && !bottom && !left && !right) ? `translate(-50%, -50%) ${transform}` : transform,
        opacity: baseOpacity * animOpacity,
        zIndex: 9999, pointerEvents: 'none',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    };

    const renderContent = () => {
        if (type === 'custom') {
            if (isLottie && lottieData) return <Lottie animationData={lottieData} style={{ width: '100%', height: '100%' }} />;
            if (src) return <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
            return null;
        }

        // Dispatcher
        switch (type) {
            case 'neon-circle': return <NeonCircle color={color} speed={speed} />;
            case 'scan-lines': return <ScanLines color={color} speed={speed} />;
            case 'burst': return <Burst color={color} secondary={secondaryColor} />;
            case 'techno-triangle': return <TechnoTriangle color={color} speed={speed} />;
            case 'crosshair': return <Crosshair color={color} speed={speed} />;
            case 'radar-sweep': return <RadarSweep color={color} speed={speed} />;
            case 'target-scope-a': return <TargetScopeA color={color} speed={speed} />;
            case 'cyber-frame-corners': return <CyberFrameCorners color={color} />;
            case 'digital-noise': return <DigitalNoise color={color} speed={speed} />;
            case 'rotating-squares': return <RotatingSquares color={color} speed={speed} />;
            case 'concentric-circles': return <ConcentricCircles color={color} speed={speed} />;
            case 'dashed-ring': return <DashedRing color={color} speed={speed} />;
            case 'zigzag-wave': return <ZigzagWave color={color} speed={speed} />;
            case 'hex-hive': return <HexHive color={color} />;
            case 'floating-shapes': return <FloatingShapes color={color} speed={speed} />;
            case 'speed-lines-radial': return <SpeedLinesRadial color={color} speed={speed} />;
            case 'comic-boom': return <ComicBoom color={color} secondary={secondaryColor} />;
            case 'hand-drawn-circle': return <HandDrawnCircle color={color} />;
            case 'sound-wave': return <SoundWave color={color} speed={speed} />;
            case 'particles': return <Particles color={color} speed={speed} />;
            case 'loading-dots': return <LoadingDots color={color} speed={speed} />;
            case 'arrow-chevron-right': return <ArrowChevronRight color={color} speed={speed} />;
            case 'glitch-bars': return <GlitchBars color={color} speed={speed} />;
            case 'plus-grid': return <GridGen type="plus" color={color} />;
            case 'hud-grid': return <GridGen type="hud" color={color} />;
            case 'globe-grid': return <GridGen type="globe" color={color} />;
            // Aliases or specific simple ones reuse similar components or standard SVG
            case 'shockwave-ring': return <DashedRing color={color} speed={speed * 2} />; // reuse
            case 'loading-ring': return <DashedRing color={color} speed={speed} />; // reuse
            default: return <NeonCircle color={color} speed={speed} />;
        }
    };

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div style={posStyle}>{renderContent()}</div>
        </AbsoluteFill>
    );
};
