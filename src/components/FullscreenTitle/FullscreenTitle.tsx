import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Easing,
    Img,
} from 'remotion';
import { GradientPresets, PatternPresets } from './BackgroundPresets';
import { useBackgroundAnimation } from './useBackgroundAnimation'; // Import hook chuyển động

// ============ TYPES ============
// Tương đương với 'Prop Type' trong Vue
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern' | 'video-blur';
export type TextStyle = 'bold-shadow' | 'glow' | 'outline' | '3d' | 'minimal' | 'gradient-text';
export type AnimationType = 'zoom-fade' | 'slide-up-bounce' | 'reveal-left' | 'blur-in' | 'typewriter' | 'glitch' | 'split' | 'fade';
export type VerticalAlign = 'top' | 'center' | 'bottom';
export type HorizontalAlign = 'left' | 'center' | 'right';

export type FullscreenTemplate =
    | 'default' // Uses manual props
    | 'cinematic-intro' | 'tech-hub' | 'minimal-chapter' | 'bold-statement'
    | 'neon-night' | 'gradient-dream' | 'retro-pop' | 'breaking-news-full'
    | 'quote-hero' | 'split-screen'
    | 'space-odyssey' | 'luxury-gold' | 'nature-vibes' | 'cyberpunk-glitch'
    | 'vintage-film' | 'liquid-motion' | 'magazine-cover' | 'industrial-steel'
    | 'ink-wash' | 'floating-bubbles' | 'gaming-stream' | 'architect-blueprint'
    | 'comic-kaboom' | 'holographic-lens' | 'abstract-waves' | 'midnight-mystery'
    | 'paper-cutout' | 'brush-stroke' | 'strobe-light' | 'sunset-serenity'
    | 'urban-graffiti' | 'frozen-pixel' | 'royal-velvet' | 'eco-green'
    | 'data-stream' | 'pop-shock' | 'shadow-play' | 'geometric-grid'
    | 'watercolor-bleed' | 'glassmorphism-pro';

export interface FullscreenTitleProps {
    // Nội dung
    title: string;
    subtitle?: string;
    template?: FullscreenTemplate; // New prop

    // Hình nền
    backgroundType?: BackgroundType;
    backgroundValue?: string;
    backgroundOverlay?: string;

    // Kiểu chữ
    textStyle?: TextStyle;
    textColor?: string;
    accentColor?: string;
    titleSize?: number;
    subtitleSize?: number;
    fontFamily?: string;

    // Vị trí
    verticalAlign?: VerticalAlign;
    horizontalAlign?: HorizontalAlign;
    padding?: number;

    // Animation xuất hiện
    animation?: AnimationType;
    enterDuration?: number;
    exitDuration?: number;

    // Hiệu ứng phụ
    showParticles?: boolean;
    showVignette?: boolean;
    animateBackground?: boolean; // Tùy chọn chuyển động nền
}

// ============ GRADIENT BACKGROUNDS ============
// Hàm này tương đương với một 'computed property' hoặc 'method' trong Vue
const getGradientBackground = (preset: string, rotation: string = '135deg'): string => {
    // Lấy preset từ file BackgroundPresets hoặc dùng mặc định
    const presetValue = (GradientPresets as any)[preset] || GradientPresets.dark;

    // Thay thế góc xoay mặc định bằng góc xoay động nếu có
    return presetValue.replace('135deg', rotation);
};

// ============ PATTERN BACKGROUNDS ============
const getPatternBackground = (pattern: string, offset: string = '0px 0px'): React.CSSProperties => {
    const patternStyle = (PatternPresets as any)[pattern] || PatternPresets.dots;
    return {
        ...patternStyle,
        backgroundPosition: offset,
    };
};

// ============ TEXT STYLE HELPERS ============
// Hàm helper để tạo style cho chữ (giống computed style trong Vue)
const getTextStyles = (
    style: TextStyle,
    textColor: string,
    accentColor: string,
    size: number,
    fontFamily?: string
): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
        color: textColor,
        fontSize: size,
        fontWeight: 900,
        margin: 0,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        fontFamily: fontFamily || 'Inter, Montserrat, system-ui, sans-serif',
    };

    switch (style) {
        case 'bold-shadow':
            return {
                ...baseStyle,
                textShadow: `
          0 4px 8px rgba(0,0,0,0.4),
          0 8px 16px rgba(0,0,0,0.3),
          0 16px 32px rgba(0,0,0,0.2)
        `,
            };
        case 'glow':
            return {
                ...baseStyle,
                textShadow: `
          0 0 10px ${accentColor},
          0 0 20px ${accentColor},
          0 0 40px ${accentColor},
          0 0 80px ${accentColor}
        `,
            };
        case 'outline':
            return {
                ...baseStyle,
                color: 'transparent',
                WebkitTextStroke: `3px ${textColor}`,
                textShadow: 'none',
            };
        case '3d':
            return {
                ...baseStyle,
                textShadow: `
          1px 1px 0 ${accentColor},
          2px 2px 0 ${accentColor},
          3px 3px 0 ${accentColor},
          4px 4px 0 ${accentColor},
          5px 5px 0 ${accentColor},
          6px 6px 10px rgba(0,0,0,0.5)
        `,
            };
        case 'gradient-text':
            return {
                ...baseStyle,
                background: `linear-gradient(135deg, ${textColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            };
        case 'minimal':
        default:
            return baseStyle;
    }
};

// ============ ANIMATION HELPERS ============
/**
 * Hook này tính toán giá trị opacity, transform cho animation xuất hiện/biến mất.
 * Trong Vue, bạn có thể dùng <transition> hoặc CSS animations.
 * Ở đây chúng ta dùng interpolate (hàm nội suy) của Remotion để map frame hiện tại sang giá trị style.
 */
const useAnimation = (
    animation: AnimationType,
    frame: number,
    fps: number,
    durationInFrames: number,
    enterDuration: number,
    exitDuration: number
) => {
    const exitStart = durationInFrames - exitDuration;

    // Tính opacity: 0 (bắt đầu) -> 1 (hết vào) -> 1 (bắt đầu ra) -> 0 (kết thúc)
    const opacity = interpolate(
        frame,
        [0, enterDuration, exitStart, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );

    let transform = '';
    let filter = '';
    let additionalOpacity = 1;

    switch (animation) {
        case 'zoom-fade': {
            const scale = interpolate(
                frame,
                [0, enterDuration, exitStart, durationInFrames],
                [0.7, 1, 1, 1.1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.cubic) }
            );
            transform = `scale(${scale})`;
            break;
        }
        case 'slide-up-bounce': {
            // Spring giúp tạo hiệu ứng nảy (bounce) mượt mà hơn interpolate thường
            const springValue = spring({
                frame,
                fps,
                config: { damping: 10, stiffness: 100, mass: 0.5 },
            });
            const translateY = interpolate(springValue, [0, 1], [100, 0]);
            const exitY = interpolate(
                frame,
                [exitStart, durationInFrames],
                [0, -50],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            transform = `translateY(${frame < exitStart ? translateY : exitY}px)`;
            break;
        }
        case 'reveal-left': {
            const translateX = interpolate(
                frame,
                [0, enterDuration],
                [-100, 0],
                { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
            );
            const exitX = interpolate(
                frame,
                [exitStart, durationInFrames],
                [0, 100],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            transform = `translateX(${frame < exitStart ? translateX : exitX}px)`;
            break;
        }
        case 'blur-in': {
            const blurAmount = interpolate(
                frame,
                [0, enterDuration, exitStart, durationInFrames],
                [20, 0, 0, 10],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
            );
            filter = `blur(${blurAmount}px)`;
            break;
        }
        case 'glitch': {
            // Hiệu ứng rung nhẹ (nếu frames nhỏ hơn lúc vào)
            const glitchOffset = Math.sin(frame * 0.5) * (frame < enterDuration ? 5 : 0);
            const skew = Math.sin(frame * 0.3) * (frame < enterDuration ? 2 : 0);
            transform = `translateX(${glitchOffset}px) skewX(${skew}deg)`;
            break;
        }
        case 'split': {
            const splitAmount = interpolate(
                frame,
                [0, enterDuration * 0.5, enterDuration],
                [50, 50, 0],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
            );
            transform = `translateY(${splitAmount > 0 ? splitAmount : 0}px)`;
            break;
        }
        case 'fade':
        default:
            transform = '';
    }

    return { opacity: opacity * additionalOpacity, transform, filter };
};

// ============ TYPEWRITER HOOK ============
// Hiệu ứng "đánh máy" (gõ chữ từng chữ một)
const useTypewriter = (
    text: string,
    frame: number,
    startFrame: number,
    charsPerFrame: number = 0.8
): string => {
    const elapsed = Math.max(0, frame - startFrame);
    const charCount = Math.floor(elapsed * charsPerFrame);
    return text.slice(0, Math.min(charCount, text.length));
};

// ============ PARTICLES COMPONENT ============
// Tương đương một Component con trong Vue
const Particles: React.FC<{ color: string }> = ({ color }) => {
    const frame = useCurrentFrame(); // Hook lấy frame hiện tại (giống reactive ref liên tục update)
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: (i * 137) % 100,
        y: (i * 73) % 100,
        size: 2 + (i % 4),
        speed: 0.5 + (i % 3) * 0.3,
    }));

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {particles.map((p) => {
                // Tính toán vị trí Y thay đổi theo frame (giúp hạt bay lên/xuống)
                const y = (p.y + frame * p.speed * 0.1) % 120 - 10;
                const opacity = interpolate(y, [0, 50, 100], [0, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                return (
                    <div
                        key={p.id}
                        style={{
                            position: 'absolute',
                            left: `${p.x}%`,
                            top: `${y}%`,
                            width: p.size,
                            height: p.size,
                            borderRadius: '50%',
                            backgroundColor: color,
                            opacity,
                        }}
                    />
                );
            })}
        </div>
    );
};

// ============ VIGNETTE COMPONENT ============
const Vignette: React.FC = () => (
    <div
        style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
        }}
    />
);

// ============ MAIN COMPONENT ============
/**
 * Component chính - FullscreenTitle
 * Trong React, tất cả logic nằm trong function trước return.
 * Trong Vue, nó tương ứng với block <script setup>.
 */
export const FullscreenTitle: React.FC<FullscreenTitleProps> = ({
    title,
    subtitle,
    template = 'default', // Default to manual props
    backgroundType = 'gradient',
    backgroundValue = 'dark',
    backgroundOverlay,
    textStyle = 'bold-shadow',
    textColor = '#ffffff',
    accentColor = '#00d4ff',
    titleSize = 96,
    subtitleSize = 36,
    fontFamily = 'Inter, Montserrat, system-ui, sans-serif',
    verticalAlign = 'center',
    horizontalAlign = 'center',
    padding = 60,
    animation = 'zoom-fade',
    enterDuration: enterDurationProp,
    exitDuration: exitDurationProp,
    showParticles = false,
    showVignette = true,
    animateBackground = true,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames, width } = useVideoConfig();

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

    // 1. Tính toán Responsive (Tương tự computed property trong Vue)
    const scaleFactor = width / 1920; // Giả sử thiết kế gốc là 1080p
    const scaledTitleSize = titleSize * scaleFactor;
    const scaledSubtitleSize = subtitleSize * scaleFactor;
    const scaledPadding = padding * scaleFactor;

    // 2. Chuyển động Background (Hiệu ứng premium)
    const { gradientShift, patternOffset, scale: bgScale } = useBackgroundAnimation(animateBackground);

    // 3. Thời gian Animation
    const enterDuration = enterDurationProp ?? Math.round(fps * 0.6);
    const exitDuration = exitDurationProp ?? Math.round(fps * 0.4);

    // 4. Lấy các giá trị animation (opacity, transform)
    const { opacity, transform, filter } = useAnimation(
        animation,
        frame,
        fps,
        durationInFrames,
        enterDuration,
        exitDuration
    );

    // 5. Hiệu ứng Typewriter (nếu chế độ animation là typewriter)
    const isTypewriter = animation === 'typewriter';
    const displayTitle = isTypewriter ? useTypewriter(title, frame, 0, 0.8) : title;
    const displaySubtitle = isTypewriter && subtitle
        ? useTypewriter(subtitle, frame, Math.ceil(title.length / 0.8) + 10, 0.6)
        : subtitle;

    // 6. Tính toán Styles cho Background
    let backgroundStyles: React.CSSProperties = {
        transition: 'background 0.3s ease',
    };

    switch (backgroundType) {
        case 'solid':
            backgroundStyles = { backgroundColor: backgroundValue };
            break;
        case 'gradient':
            backgroundStyles = {
                background: getGradientBackground(backgroundValue || 'dark', gradientShift)
            };
            break;
        case 'pattern':
            backgroundStyles = getPatternBackground(backgroundValue || 'dots', patternOffset);
            break;
        case 'image':
            // Nếu là ảnh, chúng ta dùng component <Img /> phía dưới để tối ưu hiệu năng Remotion
            break;
        case 'video-blur':
            backgroundStyles = {
                backdropFilter: `blur(${backgroundValue?.replace('blur-', '') || '20'}px)`,
            };
            break;
    }

    // 7. Căn chỉnh Alignment (Layout)
    const alignmentStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
        alignItems: horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'right' ? 'flex-end' : 'center',
        textAlign: horizontalAlign as React.CSSProperties['textAlign'],
        padding: scaledPadding,
    };

    // 8. Lấy styles cho Text (Default mode)
    const titleStyles = getTextStyles(textStyle, textColor, accentColor, scaledTitleSize, fontFamily);

    // 9. Template Renderer (Override default layout if template is chosen)
    const renderContent = () => {
        if (template === 'default') {
            return (
                <div
                    style={{
                        opacity,
                        transform,
                        filter: filter || undefined,
                        maxWidth: '94%',
                        ...alignmentStyles as any, // Layout styles
                    }}
                >
                    <h1 style={titleStyles}>
                        {displayTitle}
                        {isTypewriter && displayTitle.length < title.length && (
                            <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
                        )}
                    </h1>
                    {subtitle && (
                        <p
                            style={{
                                color: accentColor,
                                fontSize: scaledSubtitleSize,
                                fontWeight: 600,
                                marginTop: scaledSubtitleSize * 0.5,
                                marginBottom: 0,
                                fontFamily,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                opacity: isTypewriter && displaySubtitle === '' ? 0 : 0.9,
                            }}
                        >
                            {displaySubtitle || subtitle}
                        </p>
                    )}
                </div>
            );
        }

        // --- NAMED TEMPLATES ---

        switch (template) {
            case 'cinematic-intro':
                return (
                    <div style={{ opacity, transform: `scale(${interpolate(frame, [0, durationInFrames], [1, 1.1])})`, textAlign: 'center', color: '#fff', fontFamily }}>
                        <div style={{ letterSpacing: '10px', fontSize: scaledSubtitleSize * 0.8, color: '#aaa', marginBottom: 20 }}>PRESENTS</div>
                        <h1 style={{ fontSize: scaledTitleSize * 1.2, fontWeight: 300, letterSpacing: '20px', textTransform: 'uppercase', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>{displayTitle}</h1>
                        <div style={{ width: 100, height: 2, background: '#fff', margin: '30px auto' }} />
                        <p style={{ fontSize: scaledSubtitleSize, color: '#ccc', letterSpacing: '5px' }}>{subtitle}</p>
                    </div>
                );

            case 'tech-hub':
                return (
                    <div style={{ opacity, fontFamily: fontFamily || 'monospace', color: '#00ff00', textAlign: 'left', paddingLeft: 100 }}>
                        <div style={{ borderLeft: '5px solid #00ff00', paddingLeft: 30 }}>
                            <div style={{ fontSize: 20, marginBottom: 10 }}>&gt; SYSTEM_BOOT_SEQUENCE</div>
                            <h1 style={{ fontSize: scaledTitleSize, margin: 0, textShadow: '2px 2px 0 #003300' }}>{displayTitle}_</h1>
                            <p style={{ fontSize: scaledSubtitleSize, color: '#00cc00', marginTop: 10 }}>// {subtitle}</p>
                        </div>
                    </div>
                );

            case 'minimal-chapter':
                return (
                    <div style={{ opacity, transform: `translateY(${interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp' })}px)`, textAlign: 'center', color: '#000' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 2, margin: 0, fontWeight: 900, letterSpacing: '-5px' }}>{title.split(' ')[0]}</h1>
                        <h1 style={{ fontSize: scaledTitleSize, margin: 0, fontWeight: 300 }}>{title.split(' ').slice(1).join(' ')}</h1>
                        {subtitle && <p style={{ fontSize: scaledSubtitleSize, fontStyle: 'italic', marginTop: 20, color: '#555' }}>— {subtitle} —</p>}
                    </div>
                );

            case 'bold-statement':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff', transform: `scale(${interpolate(frame, [0, durationInFrames], [0.95, 1])})` }}>
                        <div style={{ background: '#fff', color: '#000', padding: '10px 30px', display: 'inline-block', fontWeight: 'bold', fontSize: 20, marginBottom: 20 }}>ATTENTION</div>
                        <h1 style={{ fontSize: scaledTitleSize * 1.3, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, fontWeight: 700, color: '#ffeb3b', marginTop: 20 }}>{subtitle}</p>
                    </div>
                );

            case 'neon-night':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{
                            fontSize: scaledTitleSize,
                            fontWeight: 900,
                            color: '#fff',
                            textShadow: '0 0 10px #f0f, 0 0 20px #f0f, 0 0 40px #f0f',
                            border: '4px solid #f0f',
                            padding: '20px 60px',
                            boxShadow: '0 0 20px #f0f, inset 0 0 20px #f0f',
                            margin: 0
                        }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#0ff', textShadow: '0 0 10px #0ff', marginTop: 30, letterSpacing: 5 }}>{subtitle}</p>
                    </div>
                );

            case 'gradient-dream':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: scaledTitleSize * 1.2,
                            fontWeight: 900,
                            background: 'linear-gradient(to right, #ff9a9e, #fecfef, #99f2c8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0,
                            paddingBottom: 20 // avoid clip
                        }}>{displayTitle}</h1>
                        <p style={{ color: '#fff', fontSize: scaledSubtitleSize, opacity: 0.8 }}>{subtitle}</p>
                    </div>
                );

            case 'retro-pop':
                return (
                    <div style={{ opacity, transform: `rotate(-5deg)`, textAlign: 'center' }}>
                        <div style={{ background: '#ff0', border: '8px solid #000', padding: '20px 50px', boxShadow: '20px 20px 0 #000' }}>
                            <h1 style={{ fontSize: scaledTitleSize, color: '#000', fontWeight: 900, margin: 0 }}>{displayTitle}</h1>
                        </div>
                        <div style={{ background: '#f0f', border: '5px solid #000', padding: '10px 30px', display: 'inline-block', marginTop: 20, transform: 'rotate(8deg) translateX(30px)' }}>
                            <p style={{ fontSize: scaledSubtitleSize, color: '#fff', fontWeight: 'bold', margin: 0 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'breaking-news-full':
                return (
                    <div style={{ opacity, width: '100%' }}>
                        <div style={{ height: 200, background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h1 style={{ fontSize: scaledTitleSize, color: '#fff', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{displayTitle}</h1>
                        </div>
                        <div style={{ background: '#fff', padding: '20px 0', textAlign: 'center', width: '100%' }}>
                            <p style={{ fontSize: scaledSubtitleSize, color: '#c0392b', fontWeight: 'bold', margin: 0, letterSpacing: 2 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'quote-hero':
                return (
                    <div style={{ opacity, textAlign: 'center', maxWidth: '80%' }}>
                        <div style={{ fontSize: 150, color: accentColor, lineHeight: 0.5, fontFamily: 'serif' }}>"</div>
                        <h1 style={{ fontSize: scaledTitleSize * 0.8, fontStyle: 'italic', fontFamily: 'serif', color: '#fff', margin: '30px 0' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: accentColor, fontWeight: 'bold' }}>— {subtitle}</p>
                    </div>
                );

            case 'split-screen':
                return (
                    <div style={{ opacity, display: 'flex', width: '100%', height: '100%' }}>
                        <div style={{ flex: 1, background: textColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 40 }}>
                            <h1 style={{ color: backgroundValue === 'dark' ? '#000' : backgroundValue, fontSize: scaledTitleSize, margin: 0, textAlign: 'right' }}>{displayTitle}</h1>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 40 }}>
                            <p style={{ color: textColor, fontSize: scaledSubtitleSize, fontWeight: 'bold', width: '60%' }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'space-odyssey':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.5, letterSpacing: 25, fontWeight: 100, textTransform: 'uppercase', textShadow: '0 0 30px rgba(255,255,255,0.8)', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, letterSpacing: 10, opacity: 0.7, marginTop: 40 }}>{subtitle}</p>
                    </div>
                );

            case 'luxury-gold':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: scaledTitleSize,
                            fontWeight: 900,
                            background: 'linear-gradient(45deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textTransform: 'uppercase',
                            margin: 0,
                            letterSpacing: 5
                        }}>{displayTitle}</h1>
                        <div style={{ height: 1, width: 200, background: '#bf953f', margin: '20px auto' }} />
                        <p style={{ color: '#bf953f', fontSize: scaledSubtitleSize, letterSpacing: 10, textTransform: 'uppercase' }}>{subtitle}</p>
                    </div>
                );

            case 'nature-vibes':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#2d5a27' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontFamily: 'serif', fontStyle: 'italic', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, letterSpacing: 5, color: '#4a7c44', marginTop: 10 }}>{subtitle}</p>
                    </div>
                );

            case 'cyberpunk-glitch':
                return (
                    <div style={{ opacity, color: '#fff', transform: `skewX(${Math.sin(frame * 0.5) * 5}deg)` }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 950, textShadow: '3px 0 #ff00ff, -3px 0 #00ffff', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, background: '#ff00ff', color: '#fff', padding: '5px 15px', display: 'inline-block', marginTop: 10, fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );

            case 'vintage-film':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#4a3728', filter: 'sepia(1) contrast(1.2)' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontFamily: 'serif', textTransform: 'uppercase', borderBottom: '4px double #4a3728', display: 'inline-block', padding: '0 20px' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, marginTop: 20, fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );

            case 'liquid-motion':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.3, fontWeight: 900, color: '#fff', mixBlendMode: 'difference' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#fff', opacity: 0.8, letterSpacing: 8 }}>{subtitle}</p>
                    </div>
                );

            case 'magazine-cover':
                return (
                    <div style={{ opacity, padding: 80, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 2.5, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.8, margin: 0, letterSpacing: -10 }}>{title.split(' ')[0]}</h1>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 300, textTransform: 'uppercase', margin: 0 }}>{title.split(' ').slice(1).join(' ')}</h1>
                        <div style={{ marginTop: 'auto', borderTop: '10px solid #fff', paddingTop: 20 }}>
                            <p style={{ fontSize: scaledSubtitleSize * 1.5, fontWeight: 900, margin: 0 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'industrial-steel':
                return (
                    <div style={{ opacity, color: '#e0e0e0', textAlign: 'left', border: '2px solid #666', padding: 40, background: 'rgba(0,0,0,0.3)' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -2, margin: 0 }}>{displayTitle}</h1>
                        <div style={{ height: 10, width: 100, background: accentColor, marginTop: 10 }} />
                        <p style={{ fontSize: scaledSubtitleSize, color: '#aaa', marginTop: 20, fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );

            case 'ink-wash':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#000' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.2, fontFamily: 'serif', margin: 0, filter: 'blur(0.5px)' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, borderTop: '1px solid #000', display: 'inline-block', marginTop: 10, paddingTop: 5 }}>{subtitle}</p>
                    </div>
                );

            case 'floating-bubbles':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 300, letterSpacing: 10 }}>{displayTitle}</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', opacity: 0.5 }} />)}
                        </div>
                        <p style={{ fontSize: scaledSubtitleSize, marginTop: 20, opacity: 0.8 }}>{subtitle}</p>
                    </div>
                );

            case 'gaming-stream':
                return (
                    <div style={{ opacity, color: '#fff', width: '90%', height: '80%', border: '4px solid #ff0055', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px #ff0055' }}>
                        <div style={{ position: 'absolute', top: -20, left: 40, background: '#ff0055', padding: '5px 20px', fontWeight: 'bold' }}>LIVE NOW</div>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, fontStyle: 'italic', margin: 0, textShadow: '4px 4px 0 #000' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#00ffff', fontWeight: 'bold', marginTop: 10 }}>{subtitle}</p>
                    </div>
                );

            case 'architect-blueprint':
                return (
                    <div style={{ opacity, color: '#fff', fontFamily: 'monospace', textAlign: 'left', padding: 100, border: '1px solid rgba(255,255,255,0.3)' }}>
                        <div style={{ fontSize: 14, marginBottom: 40 }}>DWG_NO: 404-B / SCALE: 1:100</div>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 100, textTransform: 'uppercase', margin: 0 }}>{displayTitle}</h1>
                        <div style={{ height: 1, width: '100%', background: 'rgba(255,255,255,0.5)', margin: '20px 0' }} />
                        <p style={{ fontSize: scaledSubtitleSize }}>{subtitle}</p>
                    </div>
                );

            case 'comic-kaboom':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <div style={{ background: '#ffcc00', padding: '30px 60px', border: '10px solid #000', borderRadius: '50px', transform: `rotate(${Math.sin(frame * 0.2) * 5}deg)` }}>
                            <h1 style={{ fontSize: scaledTitleSize * 1.5, color: '#000', fontWeight: 950, margin: 0, WebkitTextStroke: '2px #fff' }}>{displayTitle}!!</h1>
                        </div>
                        <div style={{ background: '#ff3300', color: '#fff', padding: '10px 40px', border: '6px solid #000', display: 'inline-block', marginTop: -20, transform: 'rotate(-5deg) translateX(-40px)', fontWeight: 'bold', fontSize: scaledSubtitleSize }}>{subtitle}</div>
                    </div>
                );

            case 'holographic-lens':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff', filter: 'contrast(1.5) brightness(1.2)' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, background: 'linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'none', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, marginTop: 20, letterSpacing: 5, opacity: 0.6 }}>{subtitle}</p>
                    </div>
                );

            case 'abstract-waves':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, margin: 0, transform: `translateY(${Math.sin(frame * 0.1) * 10}px)` }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, marginTop: 20, background: 'rgba(255,255,255,0.2)', padding: '5px 20px', borderRadius: 20 }}>{subtitle}</p>
                    </div>
                );

            case 'midnight-mystery':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 100, letterSpacing: 15, textShadow: '0 0 15px rgba(255,255,255,0.5)', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, fontStyle: 'italic', opacity: 0.5, marginTop: 30 }}>{subtitle}</p>
                    </div>
                );

            case 'paper-cutout':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, color: '#ff5722', textShadow: '5px 5px 0 #bf360c, 10px 10px 20px rgba(0,0,0,0.3)', margin: 0 }}>{displayTitle}</h1>
                        <h1 style={{ fontSize: scaledSubtitleSize * 1.5, fontWeight: 900, color: '#ffccbc', marginTop: 10 }}>{subtitle}</h1>
                    </div>
                );

            case 'brush-stroke':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <div style={{ background: '#000', padding: '20px 60px', transform: 'rotate(-2deg)', boxShadow: '10px 10px 0 rgba(0,0,0,0.1)' }}>
                            <h1 style={{ fontSize: scaledTitleSize, fontFamily: 'serif', margin: 0 }}>{displayTitle}</h1>
                        </div>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#333', marginTop: 20, fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );

            case 'strobe-light':
                return (
                    <div style={{ opacity: frame % 4 < 2 ? 1 : 0.7, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.8, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, fontWeight: 900, background: '#fff', color: '#000', padding: '5px 20px', display: 'inline-block', marginTop: 10 }}>{subtitle}</p>
                    </div>
                );

            case 'sunset-serenity':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 200, letterSpacing: 5, margin: 0 }}>{displayTitle}</h1>
                        <div style={{ height: 2, width: 300, background: 'linear-gradient(90deg, transparent, #fff, transparent)', margin: '20px auto' }} />
                        <p style={{ fontSize: scaledSubtitleSize, fontStyle: 'italic' }}>{subtitle}</p>
                    </div>
                );

            case 'urban-graffiti':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff', transform: 'rotate(-3deg)' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.4, fontWeight: 950, textShadow: '5px 5px 0 #ff0055, -5px -5px 0 #00ffff', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize * 1.5, fontFamily: 'cursive', color: '#ffea00', marginTop: 10 }}>{subtitle}</p>
                    </div>
                );

            case 'frozen-pixel':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#00ffff' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, textShadow: '0 0 20px #00ffff', border: '6px solid #00ffff', padding: 20, display: 'inline-block' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#fff', marginTop: 20, fontStyle: 'italic' }}>{subtitle}</p>
                    </div>
                );

            case 'royal-velvet':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#ffd700' }}>
                        <h1 style={{ fontSize: scaledTitleSize, fontFamily: 'serif', textTransform: 'uppercase', letterSpacing: 10, margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#fff', marginTop: 20, letterSpacing: 5, opacity: 0.8 }}>{subtitle}</p>
                    </div>
                );

            case 'eco-green':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <div style={{ border: '4px solid #fff', borderRadius: '100px 0 100px 0', padding: '40px 80px' }}>
                            <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, margin: 0 }}>{displayTitle}</h1>
                            <p style={{ fontSize: scaledSubtitleSize, color: '#8bc34a', marginTop: 10, fontWeight: 'bold' }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'data-stream':
                return (
                    <div style={{ opacity, textAlign: 'left', color: '#00ff00', fontFamily: 'monospace', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ overflow: 'hidden', height: scaledTitleSize * 1.5 }}>
                            <h1 style={{ fontSize: scaledTitleSize, margin: 0 }}>{displayTitle}</h1>
                            <h1 style={{ fontSize: scaledTitleSize, margin: 0, opacity: 0.3 }}>{displayTitle}</h1>
                        </div>
                        <p style={{ fontSize: 24, background: '#00ff00', color: '#000', padding: '2px 10px', marginTop: 20 }}>DATA_ID: {subtitle}</p>
                    </div>
                );

            case 'pop-shock':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <div style={{ background: '#ffeb3b', padding: '20px 40px', transform: 'rotate(-2deg) skewX(-10deg)', border: '10px solid #000' }}>
                            <h1 style={{ fontSize: scaledTitleSize, color: '#000', fontWeight: 950, margin: 0 }}>{displayTitle}</h1>
                        </div>
                        <div style={{ background: '#e91e63', color: '#fff', padding: '10px 30px', border: '6px solid #000', display: 'inline-block', marginTop: -10, transform: 'rotate(5deg) translateX(40px)' }}>
                            <p style={{ fontSize: scaledSubtitleSize, fontWeight: 900, margin: 0 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'shadow-play':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.4, fontWeight: 900, color: 'rgba(0,0,0,0.8)', textShadow: '0 0 1px rgba(255,255,255,0.5)', margin: 0 }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#fff', marginTop: 10 }}>{subtitle}</p>
                    </div>
                );

            case 'geometric-grid':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <div style={{ border: '1px solid #fff', padding: 60, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -10, left: -10, width: 20, height: 20, border: '1px solid #fff' }} />
                            <div style={{ position: 'absolute', bottom: -10, right: -10, width: 20, height: 20, border: '1px solid #fff' }} />
                            <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, margin: 0 }}>{displayTitle}</h1>
                            <p style={{ fontSize: scaledSubtitleSize, color: '#aaa', marginTop: 20 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            case 'watercolor-bleed':
                return (
                    <div style={{ opacity, textAlign: 'center', color: '#fff' }}>
                        <h1 style={{ fontSize: scaledTitleSize * 1.2, fontWeight: 100, margin: 0, textShadow: '0 0 20px rgba(255,100,100,0.5)' }}>{displayTitle}</h1>
                        <p style={{ fontSize: scaledSubtitleSize, color: '#ffccbc', marginTop: 10, fontStyle: 'italic' }}>{subtitle}</p>
                    </div>
                );

            case 'glassmorphism-pro':
                return (
                    <div style={{ opacity, textAlign: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30, padding: '60px 100px', boxShadow: '0 25px 45px rgba(0,0,0,0.2)' }}>
                            <h1 style={{ fontSize: scaledTitleSize, fontWeight: 900, color: '#fff', margin: 0 }}>{displayTitle}</h1>
                            <p style={{ fontSize: scaledSubtitleSize, color: 'rgba(255,255,255,0.7)', marginTop: 20, letterSpacing: 5 }}>{subtitle}</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };
    return (
        <AbsoluteFill style={{ zIndex: 1000, fontFamily }}>
            {/* Lớp Hình nền (Background Layer) */}
            <AbsoluteFill style={{
                ...backgroundStyles,
                transform: `scale(${bgScale})`, // Áp dụng thu phóng nhẹ cho background
            }} />

            {/* Box hiển thị ảnh nếu type là image */}
            {backgroundType === 'image' && backgroundValue && (
                <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
                    <Img
                        src={backgroundValue}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </AbsoluteFill>
            )}

            {/* Lớp phủ mờ (Overlay) */}
            {backgroundOverlay && (
                <AbsoluteFill style={{ backgroundColor: backgroundOverlay }} />
            )}

            {/* Hiệu ứng mờ biên (Vignette) */}
            {showVignette && <Vignette />}

            {/* Các hạt lung linh (Particles) */}
            {showParticles && <Particles color={accentColor} />}

            {/* Lớp nội dung chính (Content Layer) */}
            {/* Lớp nội dung chính (Content Layer) */}
            <AbsoluteFill style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
                alignItems: horizontalAlign === 'left' ? 'flex-start' : horizontalAlign === 'right' ? 'flex-end' : 'center',
                padding: scaledPadding,
                width: '100%',
                height: '100%'
            }}>
                {renderContent()}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

export default FullscreenTitle;
