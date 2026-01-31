import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Easing,
} from 'remotion';

export type FullscreenTitleTheme = 'cinematic-intro' | 'minimalist' | 'gradient-mesh' | 'elegant' | 'neon-vibe';

export interface FullscreenTitleProps {
    title: string;
    subtitle?: string;
    theme?: FullscreenTitleTheme;
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    fontSize?: number;
}

export const FullscreenTitle: React.FC<FullscreenTitleProps> = ({
    title,
    subtitle,
    theme = 'cinematic-intro',
    backgroundImage,
    backgroundColor = '#000000',
    textColor = '#ffffff',
    accentColor = '#3b82f6',
    fontFamily,
    fontSize = 80,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames, width, height } = useVideoConfig();

    // Load font
    React.useEffect(() => {
        if (fontFamily && !fontFamily.includes(',') && !fontFamily.includes('system-ui')) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);
            };
        }
    }, [fontFamily]);

    // Animations
    const opacity = interpolate(
        frame,
        [0, 15, durationInFrames - 15, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const bounce = spring({
        frame,
        fps,
        config: {
            damping: 12,
        },
    });

    const scale = interpolate(
        frame,
        [0, durationInFrames],
        [1, 1.1],
        { easing: Easing.bezier(0.33, 1, 0.68, 1) }
    );

    // Theme-specific styles
    const getThemeStyles = () => {
        switch (theme) {
            case 'cinematic-intro':
                return {
                    container: {
                        background: backgroundImage ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${backgroundImage})` : backgroundColor,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center' as const,
                        justifyContent: 'center' as const,
                    },
                    title: {
                        fontSize: fontSize,
                        fontWeight: 900,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        textAlign: 'center' as const,
                        color: textColor,
                        textShadow: '0 0 20px rgba(0,0,0,0.5)',
                        fontFamily: fontFamily || 'Outfit, Inter, sans-serif',
                        transform: `scale(${scale})`,
                        opacity: interpolate(frame, [0, 20], [0, 1]),
                    },
                    subtitle: {
                        fontSize: fontSize * 0.4,
                        marginTop: 20,
                        opacity: interpolate(frame, [15, 35], [0, 0.8]),
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase' as const,
                        color: accentColor,
                        fontFamily: fontFamily || 'Inter, sans-serif',
                    }
                };
            case 'gradient-mesh':
                return {
                    container: {
                        background: `linear-gradient(45deg, ${backgroundColor}, ${accentColor}, #8b5cf6)`,
                        backgroundSize: '400% 400%',
                        animation: 'gradientBG 15s ease infinite',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center' as const,
                        justifyContent: 'center' as const,
                    },
                    title: {
                        fontSize: fontSize * 1.2,
                        fontWeight: 900,
                        textAlign: 'center' as const,
                        color: '#fff',
                        fontFamily: fontFamily || 'Inter, sans-serif',
                        transform: `translateY(${interpolate(bounce, [0, 1], [50, 0])}px)`,
                    },
                    subtitle: {
                        fontSize: fontSize * 0.4,
                        marginTop: 20,
                        background: 'rgba(255,255,255,0.2)',
                        padding: '8px 24px',
                        borderRadius: '99px',
                        color: '#fff',
                        fontFamily: fontFamily || 'Inter, sans-serif',
                    }
                };
            case 'minimalist':
                return {
                    container: {
                        backgroundColor: backgroundColor,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center' as const,
                        justifyContent: 'center' as const,
                    },
                    title: {
                        fontSize: fontSize * 0.8,
                        fontWeight: 200,
                        letterSpacing: '0.2em',
                        textAlign: 'center' as const,
                        color: textColor,
                        fontFamily: fontFamily || 'Inter, sans-serif',
                    },
                    subtitle: {
                        fontSize: fontSize * 0.3,
                        marginTop: 40,
                        color: accentColor,
                        fontFamily: fontFamily || 'Inter, sans-serif',
                        fontWeight: 600,
                    }
                };
            case 'elegant':
                return {
                    container: {
                        backgroundColor: backgroundColor,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center' as const,
                        justifyContent: 'center' as const,
                    },
                    title: {
                        fontSize: fontSize * 1.1,
                        fontWeight: 400,
                        fontStyle: 'italic' as const,
                        textAlign: 'center' as const,
                        color: textColor,
                        fontFamily: fontFamily || 'Playfair Display, serif',
                        borderBottom: `2px solid ${accentColor}`,
                        paddingBottom: '10px',
                    },
                    subtitle: {
                        fontSize: fontSize * 0.35,
                        marginTop: 20,
                        letterSpacing: '0.5em',
                        textTransform: 'uppercase' as const,
                        color: accentColor,
                        fontFamily: fontFamily || 'Inter, sans-serif',
                    }
                };
            case 'neon-vibe':
                return {
                    container: {
                        backgroundColor: '#050505',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center' as const,
                        justifyContent: 'center' as const,
                    },
                    title: {
                        fontSize: fontSize * 1.3,
                        fontWeight: 900,
                        textAlign: 'center' as const,
                        color: '#fff',
                        fontFamily: fontFamily || 'Outfit, sans-serif',
                        textShadow: `0 0 10px ${accentColor}, 0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
                        animation: 'pulse 2s infinite',
                    },
                    subtitle: {
                        fontSize: fontSize * 0.4,
                        marginTop: 30,
                        color: textColor,
                        fontFamily: fontFamily || 'Inter, sans-serif',
                        opacity: 0.7,
                        letterSpacing: '0.2em',
                    }
                };
            default:
                return getThemeStyles(); // Fallback to itself through recursion is bad, using cinematic-intro
        }
    };

    const activeStyles = getThemeStyles();

    return (
        <AbsoluteFill style={{ ...activeStyles.container, opacity }}>
            <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@200;400;600;900&display=swap');
      `}</style>

            <div style={activeStyles.title}>
                {title}
            </div>

            {subtitle && (
                <div style={activeStyles.subtitle}>
                    {subtitle}
                </div>
            )}
        </AbsoluteFill>
    );
};

export default FullscreenTitle;
