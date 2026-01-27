import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { CaptionWord, CaptionStyle } from '../types';
import { CAPTION_THEMES, CaptionTheme, getTheme } from './caption-themes';

interface TikTokCaptionProps {
    words: CaptionWord[];
    style?: CaptionStyle | string;
    startOffset?: number;
    // Theme support
    theme?: string;  // Theme name like 'gold-bold', 'clean-minimal', etc.
    // Direct props from OTIO (flat structure)
    position?: 'top' | 'center' | 'bottom';
    font?: string;
    highlightColor?: string;
    fontSize?: number;
}

export const TikTokCaption: React.FC<TikTokCaptionProps> = ({
    words,
    style,
    startOffset = 0,
    theme: themeName,
    position: directPosition,
    font: directFont,
    highlightColor: directHighlightColor,
    fontSize: directFontSize,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTime = (frame / fps) + startOffset;

    // Get theme (default to gold-bold)
    const theme: CaptionTheme = themeName ? getTheme(themeName) : CAPTION_THEMES['gold-bold'];

    // Merge theme with direct props (direct props override theme)
    const rawStyle = (typeof style === 'object' ? style : {}) as any || {};

    const effectiveStyle = {
        fontFamily: directFont || rawStyle.fontFamily || theme.style.fontFamily,
        fontSize: directFontSize || rawStyle.fontSize || theme.style.fontSize,
        fontWeight: theme.style.fontWeight,
        textTransform: theme.style.textTransform || 'none',
        letterSpacing: theme.style.letterSpacing || 0,
        textColor: rawStyle.color || theme.style.textColor,
        activeColor: directHighlightColor || rawStyle.highlightColor || theme.style.activeColor,
        strokeColor: theme.style.strokeColor || '#000000',
        strokeWidth: theme.style.strokeWidth || 0,
        shadowColor: theme.style.shadowColor || 'rgba(0,0,0,0.5)',
        activeBgColor: theme.style.activeBgColor,
        activeBorderRadius: theme.style.activeBorderRadius || 8,
        activePadding: theme.style.activePadding || '4px 12px',
        containerBg: theme.style.containerBg,
        containerPadding: theme.style.containerPadding || '8px 16px',
        containerBorderRadius: theme.style.containerBorderRadius || 0,
        position: directPosition || rawStyle.position || 'center',
    };

    // Find currently active words
    const wordsPerLine = 4;
    const activeWordIndex = words.findIndex(
        (word) => currentTime >= word.start && currentTime <= word.end
    );

    if (activeWordIndex === -1 && words.length > 0) {
        return null;
    }

    // Get context words around the active word
    const startIndex = Math.max(0, activeWordIndex - Math.floor(wordsPerLine / 2));
    const endIndex = Math.min(words.length, startIndex + wordsPerLine);
    const displayWords = words.slice(startIndex, endIndex);

    const getPositionStyle = (): React.CSSProperties => {
        switch (effectiveStyle.position) {
            case 'top':
                return { top: '15%', justifyContent: 'flex-start' };
            case 'center':
                return { top: '50%', transform: 'translateY(-50%)', justifyContent: 'center' };
            case 'bottom':
            default:
                return { bottom: '20%', justifyContent: 'flex-end' };
        }
    };

    // Generate text shadow based on stroke
    const getTextShadow = (isActive: boolean): string => {
        const shadows: string[] = [];
        const strokeW = effectiveStyle.strokeWidth;
        const strokeC = effectiveStyle.strokeColor;

        if (strokeW > 0) {
            // Create stroke effect with multiple shadows
            for (let x = -strokeW; x <= strokeW; x++) {
                for (let y = -strokeW; y <= strokeW; y++) {
                    if (x !== 0 || y !== 0) {
                        shadows.push(`${x}px ${y}px 0 ${strokeC}`);
                    }
                }
            }
        }

        // Add drop shadow
        shadows.push(`3px 3px 6px ${effectiveStyle.shadowColor}`);

        // Neon glow effect for neon theme
        if (themeName === 'neon-glow' && isActive) {
            const glowColor = effectiveStyle.activeColor;
            shadows.push(`0 0 10px ${glowColor}`);
            shadows.push(`0 0 20px ${glowColor}`);
            shadows.push(`0 0 40px ${glowColor}`);
        }

        return shadows.join(', ');
    };

    // Animation helpers
    const getWordAnimation = (word: CaptionWord, isActive: boolean, wordIndex: number) => {
        const wordDuration = Math.max(word.end - word.start, 0.01);
        const animDuration = theme.animation.duration || 0.1;

        let scale = 1;
        let translateY = 0;
        let opacity = isActive ? 1 : 0.7;

        if (isActive) {
            const progress = Math.min((currentTime - word.start) / animDuration, 1);

            switch (theme.animation.type) {
                case 'scale':
                    const scaleAmount = theme.animation.scaleAmount || 1.15;
                    scale = interpolate(progress, [0, 0.5, 1], [1, scaleAmount, scaleAmount], {
                        extrapolateRight: 'clamp',
                    });
                    break;

                case 'drop':
                    const dropDist = theme.animation.dropDistance || 50;
                    translateY = interpolate(progress, [0, 1], [-dropDist, 0], {
                        extrapolateRight: 'clamp',
                    });
                    opacity = interpolate(progress, [0, 0.5], [0, 1], {
                        extrapolateRight: 'clamp',
                    });
                    break;

                case 'bounce':
                    const bounceScale = theme.animation.scaleAmount || 1.2;
                    const springValue = spring({
                        frame: (currentTime - word.start) * fps,
                        fps,
                        config: { damping: 10, stiffness: 200 },
                    });
                    scale = 1 + (bounceScale - 1) * springValue;
                    break;

                case 'fade':
                    opacity = interpolate(progress, [0, 1], [0.5, 1], {
                        extrapolateRight: 'clamp',
                    });
                    break;

                case 'none':
                default:
                    break;
            }
        }

        return { scale, translateY, opacity };
    };

    return (
        <AbsoluteFill
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                ...getPositionStyle(),
                pointerEvents: 'none',
            }}
        >
            {/* Container with optional background */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    maxWidth: '90%',
                    gap: '8px',
                    ...(effectiveStyle.containerBg && {
                        backgroundColor: effectiveStyle.containerBg,
                        padding: effectiveStyle.containerPadding,
                        borderRadius: effectiveStyle.containerBorderRadius,
                    }),
                }}
            >
                {displayWords.map((word, index) => {
                    const wordIndex = startIndex + index;
                    const isActive = wordIndex === activeWordIndex;
                    const { scale, translateY, opacity } = getWordAnimation(word, isActive, wordIndex);

                    // Word style
                    const wordStyle: React.CSSProperties = {
                        fontFamily: effectiveStyle.fontFamily,
                        fontSize: effectiveStyle.fontSize,
                        fontWeight: effectiveStyle.fontWeight,
                        textTransform: effectiveStyle.textTransform as any,
                        letterSpacing: effectiveStyle.letterSpacing,
                        color: isActive ? effectiveStyle.activeColor : effectiveStyle.textColor,
                        textShadow: getTextShadow(isActive),
                        transform: `scale(${scale}) translateY(${translateY}px)`,
                        opacity,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        transition: 'color 0.1s ease',
                        // Active background (for red-box style)
                        ...(isActive && effectiveStyle.activeBgColor && {
                            backgroundColor: effectiveStyle.activeBgColor,
                            padding: effectiveStyle.activePadding,
                            borderRadius: effectiveStyle.activeBorderRadius,
                        }),
                        // Non-active padding to maintain spacing
                        ...(!isActive && effectiveStyle.activeBgColor && {
                            padding: effectiveStyle.activePadding,
                        }),
                    };

                    return (
                        <span key={`${word.word}-${wordIndex}`} style={wordStyle}>
                            {word.word}
                        </span>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

export default TikTokCaption;
