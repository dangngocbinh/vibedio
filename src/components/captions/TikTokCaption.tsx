import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { CaptionWord, CaptionStyle } from '../../types';
import { CAPTION_THEMES, CaptionTheme, getTheme } from './caption-themes';
import { useResponsiveScale } from '../../utils/useResponsiveScale';

// Load font once globally
if (typeof document !== 'undefined' && !document.getElementById('caption-fonts')) {
    const fontStyle = document.createElement('style');
    fontStyle.id = 'caption-fonts';
    fontStyle.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Inter:wght@400;700&display=swap');`;
    document.head.appendChild(fontStyle);
}

interface TikTokCaptionProps {
    words: CaptionWord[];
    style?: CaptionStyle | string;
    startOffset?: number;
    // Theme support
    theme?: string;  // Theme name like 'gold-bold', 'clean-minimal', etc.
    // Direct props from OTIO (flat structure)
    position?: 'top' | 'center' | 'bottom' | 'bottom-high';
    font?: string;
    highlightColor?: string;
    fontSize?: number;
    letterSpacing?: string | number;  // Add letterSpacing prop
    frame?: number; // Override frame behavior for manual control
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
    letterSpacing: directLetterSpacing,
    frame: overrideFrame,
}) => {
    const currentFrame = useCurrentFrame();
    const frame = overrideFrame !== undefined ? overrideFrame : currentFrame;
    const { fps } = useVideoConfig();
    const currentTime = (frame / fps) + startOffset;

    const { scalePixel, scaleFontSize, isPortrait, uniformScale } = useResponsiveScale();

    // Memoize theme and effective style (only recalculate when theme props change)
    const { theme, effectiveStyle } = useMemo(() => {
        const selectedTheme: CaptionTheme = themeName ? getTheme(themeName) : CAPTION_THEMES['clean-minimal'];
        const rawStyle = (typeof style === 'object' ? style : {}) as any || {};

        // Scale font size responsively
        const baseFontSize = directFontSize || rawStyle.fontSize || selectedTheme.style.fontSize;
        const scaledFontSize = scaleFontSize(baseFontSize);

        return {
            theme: selectedTheme,
            effectiveStyle: {
                fontFamily: directFont || rawStyle.fontFamily || "Montserrat",
                fontSize: scaledFontSize,
                fontWeight: selectedTheme.style.fontWeight,
                textTransform: selectedTheme.style.textTransform || 'none',
                letterSpacing: directLetterSpacing || rawStyle.letterSpacing || selectedTheme.style.letterSpacing || 0,
                textColor: rawStyle.color || selectedTheme.style.textColor,
                activeColor: directHighlightColor || rawStyle.highlightColor || selectedTheme.style.activeColor,
                strokeColor: selectedTheme.style.strokeColor || '#000000',
                strokeWidth: selectedTheme.style.strokeWidth || 0,
                shadowColor: selectedTheme.style.shadowColor || 'rgba(0,0,0,0.5)',
                activeBgColor: selectedTheme.style.activeBgColor,
                activeBorderRadius: selectedTheme.style.activeBorderRadius || 8,
                activePadding: selectedTheme.style.activePadding || '4px 12px',
                containerBg: selectedTheme.style.containerBg,
                containerPadding: selectedTheme.style.containerPadding || '8px 16px',
                containerBorderRadius: selectedTheme.style.containerBorderRadius || 0,
                position: directPosition || rawStyle.position || 'bottom',
            }
        };
    }, [themeName, style, directFont, directFontSize, directLetterSpacing, directHighlightColor, directPosition, scaleFontSize]);

    // Memoize position style (never changes during render)
    const positionStyle = useMemo((): React.CSSProperties => {
        const layoutMode = isPortrait ? 'portrait' : 'landscape';

        switch (effectiveStyle.position) {
            case 'top':
                return { top: isPortrait ? '10%' : '15%', justifyContent: 'flex-start' };
            case 'center':
                return { top: '50%', transform: 'translateY(-50%)', justifyContent: 'center' };
            case 'bottom-high':
                return { bottom: isPortrait ? '25%' : '20%', justifyContent: 'flex-end' };
            case 'bottom':
            default:
                return { bottom: isPortrait ? '12%' : '8%', justifyContent: 'flex-end' };
        }
    }, [effectiveStyle.position, isPortrait]);

    // Memoize text shadows (expensive to calculate)
    const { normalShadow, activeShadow } = useMemo(() => {
        const shadows: string[] = [];
        const strokeW = effectiveStyle.strokeWidth;
        const strokeC = effectiveStyle.strokeColor;

        // Optimized stroke generation
        if (strokeW > 0) {
            const step = Math.max(1, Math.floor(strokeW / 2)); // Reduce shadow count for performance
            for (let x = -strokeW; x <= strokeW; x += step) {
                for (let y = -strokeW; y <= strokeW; y += step) {
                    if (x !== 0 || y !== 0) {
                        shadows.push(`${x}px ${y}px 0 ${strokeC}`);
                    }
                }
            }
        }

        // Drop shadow
        const baseShadow = [...shadows, `3px 3px 6px ${effectiveStyle.shadowColor}`].join(', ');

        // Neon glow for active
        let glowShadow = baseShadow;
        if (themeName === 'neon-glow') {
            const glowColor = effectiveStyle.activeColor;
            glowShadow = [...shadows, `0 0 10px ${glowColor}`, `0 0 20px ${glowColor}`, `0 0 40px ${glowColor}`].join(', ');
        }

        return { normalShadow: baseShadow, activeShadow: glowShadow };
    }, [effectiveStyle.strokeWidth, effectiveStyle.strokeColor, effectiveStyle.shadowColor, effectiveStyle.activeColor, themeName]);

    // Find active word and display window (MUST be after all hooks)
    const { activeWordIndex, displayWords, startIndex } = useMemo(() => {
        const wordsPerLine = isPortrait ? 3 : 4; // Fewer words on vertical screens
        const activeIdx = words.findIndex(
            (word) => currentTime >= word.start && currentTime <= word.end
        );

        if (activeIdx === -1) {
            return { activeWordIndex: -1, displayWords: [], startIndex: 0 };
        }

        const start = Math.max(0, activeIdx - Math.floor(wordsPerLine / 2));
        const end = Math.min(words.length, start + wordsPerLine);

        return {
            activeWordIndex: activeIdx,
            displayWords: words.slice(start, end),
            startIndex: start
        };
    }, [words, currentTime, isPortrait]);

    // Early return AFTER all hooks
    if (activeWordIndex === -1) {
        return null;
    }

    // Simplified animation calculation (called per word, so keep it lean)
    const getWordAnimation = (word: CaptionWord, isActive: boolean) => {
        if (!isActive) {
            return { scale: 1, translateY: 0, opacity: 0.7 };
        }

        const animDuration = theme.animation.duration || 0.1;
        const progress = Math.min((currentTime - word.start) / animDuration, 1);

        switch (theme.animation.type) {
            case 'scale':
                return {
                    scale: interpolate(progress, [0, 0.5, 1], [1, theme.animation.scaleAmount || 1.15, theme.animation.scaleAmount || 1.15], { extrapolateRight: 'clamp' }),
                    translateY: 0,
                    opacity: 1
                };

            case 'drop':
                return {
                    scale: 1,
                    translateY: interpolate(progress, [0, 1], [-(theme.animation.dropDistance || 50), 0], { extrapolateRight: 'clamp' }),
                    opacity: interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
                };

            case 'bounce':
                const springValue = spring({
                    frame: (currentTime - word.start) * fps,
                    fps,
                    config: { damping: 10, stiffness: 200 },
                });
                return {
                    scale: 1 + (theme.animation.scaleAmount || 1.2 - 1) * springValue,
                    translateY: 0,
                    opacity: 1
                };

            case 'fade':
                return {
                    scale: 1,
                    translateY: 0,
                    opacity: interpolate(progress, [0, 1], [0.5, 1], { extrapolateRight: 'clamp' })
                };

            case 'none':
            default:
                return { scale: 1, translateY: 0, opacity: 1 };
        }
    };

    return (
        <AbsoluteFill
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                ...positionStyle,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: isPortrait ? '95%' : '80%',
                    maxWidth: scalePixel(1000),
                    gap: scalePixel(16),
                    textAlign: 'center',
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
                    const { scale, translateY, opacity } = getWordAnimation(word, isActive);

                    const wordStyle: React.CSSProperties = {
                        fontFamily: effectiveStyle.fontFamily,
                        fontSize: effectiveStyle.fontSize,
                        fontWeight: effectiveStyle.fontWeight,
                        textTransform: effectiveStyle.textTransform as any,
                        letterSpacing: effectiveStyle.letterSpacing,
                        color: isActive ? effectiveStyle.activeColor : effectiveStyle.textColor,
                        textShadow: isActive ? activeShadow : normalShadow,
                        transform: `scale(${scale}) translateY(${translateY}px)`,
                        opacity,
                        textAlign: 'center',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        ...(isActive && effectiveStyle.activeBgColor && {
                            backgroundColor: effectiveStyle.activeBgColor,
                            padding: effectiveStyle.activePadding,
                            borderRadius: effectiveStyle.activeBorderRadius,
                        }),
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
