import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    Easing,
} from 'remotion';
import { useResponsiveScale } from '../../utils/useResponsiveScale';

// ============ TYPES ============
export type LowerThirdTemplate =
    // Original 10
    | 'modern-skew' | 'glass-modern' | 'neon-glow' | 'minimal-bold' | 'gradient-wave'
    | 'corporate-clean' | 'tech-grid' | 'elegant-serif' | 'playful-round' | 'split-reveal'
    // 30 New Templates
    | 'breaking-news' | 'social-youtube' | 'social-insta' | 'gaming-glitch' | 'cyberpunk-hud'
    | 'hand-drawn' | 'brush-stroke' | 'retro-8bit' | 'classic-tv' | 'sports-ticker'
    | 'wedding-floral' | 'documentary-sidebar' | 'quote-box' | 'ribbon-tag' | 'hologram'
    | 'liquid-motion' | 'confetti' | 'border-animate' | 'shadow-stack' | 'floating-bubbles'
    | 'stencil-cut' | 'ink-bleed' | 'comic-pop' | 'industrial-steel' | 'nature-eco'
    | 'space-cosmos' | 'luxury-gold' | 'chalkboard' | 'blueprint' | 'origami';

export interface LowerThirdProps {
    title: string;
    subtitle?: string;
    template?: LowerThirdTemplate;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
}

// ============ COMPONENT ============
export const LowerThird: React.FC<LowerThirdProps> = ({
    title,
    subtitle,
    template = 'modern-skew',
    primaryColor = '#3498db',
    secondaryColor = '#ffffff',
    textColor = '#2c3e50',
    fontSize = 42,
    fontFamily,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const { scalePixel, scaleFontSize, isPortrait, isSquare, uniformScale, width } = useResponsiveScale();

    // Responsive scaled values
    const scaledFontSize = scaleFontSize(fontSize);
    const responsiveScale = uniformScale;

    React.useEffect(() => {
        if (fontFamily) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);
            };
        }
    }, [fontFamily]);

    const entrance = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
    });

    const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const opacity = entrance * exit;

    // Responsive position calculation
    const getResponsiveBottom = (baseBottom: number) => scalePixel(baseBottom);
    const getResponsiveLeft = (baseLeft: number) => scalePixel(baseLeft);
    const getResponsivePadding = (basePadding: string) => {
        // Parse padding values and scale them
        const parts = basePadding.split(' ').map(p => {
            const num = parseInt(p);
            return isNaN(num) ? p : `${scalePixel(num)}px`;
        });
        return parts.join(' ');
    };

    const renderTemplate = () => {
        const commonStyle = fontFamily ? { fontFamily } : {};
        // Apply responsive font size to all templates
        const respFontSize = scaledFontSize;
        switch (template) {
            // --- ORIGINAL 10 ---
            case 'modern-skew':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, transform: `translateX(${interpolate(entrance, [0, 1], [-50, 0])}px)`, ...commonStyle }}>
                        <div style={{ backgroundColor: secondaryColor, padding: '10px 40px 10px 20px', display: 'inline-block', transform: 'skewX(-15deg)', boxShadow: '10px 10px 30px rgba(0,0,0,0.1)' }}>
                            <h1 style={{ margin: 0, fontSize, fontWeight: 900, color: textColor, transform: 'skewX(15deg)', fontFamily: fontFamily || 'Inter, sans-serif', textTransform: 'uppercase' }}>{title}</h1>
                        </div>
                        <br />
                        {subtitle && (
                            <div style={{ backgroundColor: primaryColor, padding: '5px 30px 5px 15px', display: 'inline-block', marginTop: 5, transform: 'skewX(-15deg) translateX(20px)', width: 'fit-content' }}>
                                <p style={{ margin: 0, fontSize: fontSize * 0.6, color: '#fff', fontWeight: 600, transform: 'skewX(15deg)', fontFamily: fontFamily || 'Inter, sans-serif' }}>{subtitle}</p>
                            </div>
                        )}
                    </div>
                );
            case 'glass-modern':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: '20px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])})`, ...commonStyle }}>
                        <h1 style={{ margin: 0, fontSize, color: '#fff', fontWeight: 700 }}>{title}</h1>
                        {subtitle && <p style={{ margin: '5px 0 0', fontSize: fontSize * 0.6, color: 'rgba(255,255,255,0.9)' }}>{subtitle}</p>}
                    </div>
                );
            case 'neon-glow':
                return (
                    <div style={{ position: 'absolute', bottom: 120, left: 80, opacity, borderLeft: `6px solid ${primaryColor}`, padding: '10px 25px', backgroundColor: 'rgba(0,0,0,0.5)', boxShadow: `0 0 20px rgba(0,0,0,0.3)` }}>
                        <h1 style={{ margin: 0, fontSize, color: '#fff', textShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}` }}>{title}</h1>
                        {subtitle && <p style={{ margin: 0, fontSize: fontSize * 0.5, color: primaryColor, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 'bold' }}>{subtitle}</p>}
                    </div>
                );
            case 'minimal-bold':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, backgroundColor: 'rgba(0,0,0,0.6)', padding: '20px 40px', borderLeft: `8px solid ${primaryColor}` }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.2, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>{title}</h1>
                        <p style={{ margin: 0, fontSize: fontSize * 0.7, color: primaryColor, fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );
            case 'gradient-wave':
                return (
                    <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity }}>
                        <div style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`, padding: '15px 100px', textAlign: 'center', borderRadius: 50 }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6, color: '#fff', opacity: 0.9 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'corporate-clean':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 100, opacity, display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: '15px 30px', backdropFilter: 'blur(5px)' }}>
                        <div style={{ width: 6, height: 50, backgroundColor: primaryColor, marginRight: 20 }} />
                        <div>
                            <h1 style={{ margin: 0, fontSize, fontWeight: 300, color: '#fff' }}>{title}</h1>
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', margin: '5px 0' }} />
                            <p style={{ margin: 0, fontSize: fontSize * 0.5, color: '#eee', fontWeight: 600 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'tech-grid':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, fontFamily: 'monospace' }}>
                        <div style={{ color: primaryColor, fontSize: 12, marginBottom: 5 }}>[ SYSTEM_REPORT ]</div>
                        <h1 style={{ backgroundColor: '#000', color: primaryColor, padding: '5px 15px', margin: 0, fontSize }}>{title}</h1>
                        <div style={{ color: '#fff', fontSize: fontSize * 0.5, marginTop: 5 }}>{subtitle} <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>_</span></div>
                    </div>
                );
            case 'elegant-serif':
                return (
                    <div style={{ position: 'absolute', bottom: 120, left: '10%', right: '10%', textAlign: 'center', opacity, backgroundColor: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: 20 }}>
                        <h1 style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: fontSize * 1.2, color: '#d4af37', margin: 0 }}>{title}</h1>
                        <div style={{ width: 50, height: 1, background: '#d4af37', margin: '10px auto' }} />
                        <p style={{ letterSpacing: 4, fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{subtitle}</p>
                    </div>
                );
            case 'playful-round':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)` }}>
                        <div style={{ backgroundColor: secondaryColor, padding: '15px 30px', borderRadius: '0 30px 30px 30px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                            <h1 style={{ margin: 0, fontSize, color: textColor }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6, color: primaryColor, fontWeight: 700 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'split-reveal':
                return (
                    <div style={{ position: 'absolute', bottom: 120, left: 100, opacity, backgroundColor: 'rgba(0,0,0,0.5)', padding: '15px 30px', borderLeft: `4px solid ${primaryColor}`, minWidth: 300 }}>
                        <div style={{ overflow: 'hidden' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff', transform: `translateY(${interpolate(entrance, [0, 1], [100, 0])}%)` }}>{title}</h1>
                        </div>
                        <div style={{ height: 2, backgroundColor: primaryColor, width: interpolate(entrance, [0.3, 1], [0, 100]) + '%', margin: '5px 0' }} />
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6, color: '#eee', transform: `translateY(${interpolate(entrance, [0, 1], [-100, 0])}%)` }}>{subtitle}</p>
                        </div>
                    </div>
                );

            // --- 30 NEW TEMPLATES ---
            case 'breaking-news':
                return (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity }}>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '10px 50px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ backgroundColor: '#fff', color: primaryColor, padding: '2px 10px', fontWeight: 'bold', marginRight: 20 }}>BREAKING</div>
                            <h1 style={{ margin: 0, fontSize, fontWeight: 'bold' }}>{title}</h1>
                        </div>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', padding: '5px 50px', fontSize: fontSize * 0.6 }}>{subtitle}</div>
                    </div>
                );
            case 'social-youtube':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: 50, padding: '10px 30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 50, height: 50, backgroundColor: primaryColor, borderRadius: '50%', marginRight: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>YT</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.8, color: '#000' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5, color: '#666' }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'social-insta':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, display: 'flex', alignItems: 'center' }}>
                        <div style={{ padding: 3, background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%' }}>
                            <div style={{ width: 60, height: 60, backgroundColor: '#fff', borderRadius: '50%', border: '3px solid #000' }} />
                        </div>
                        <div style={{ marginLeft: 20, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.9, fontWeight: 'bold' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'gaming-glitch':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.5, color: '#fff', fontWeight: 950, letterSpacing: -2, textShadow: `${frame % 4 === 0 ? 3 : 0}px 0 #ff00ff, -${frame % 4 === 0 ? 3 : 0}px 0 #00ffff` }}>{title}</h1>
                        <p style={{ margin: 0, color: '#00ff00', fontSize: fontSize * 0.5, fontFamily: 'monospace' }}>{subtitle}</p>
                    </div>
                );
            case 'cyberpunk-hud':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, color: '#00ffff', fontFamily: 'monospace' }}>
                        <div style={{ border: '1px solid #00ffff', padding: 15, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -10, left: 10, backgroundColor: '#000', padding: '0 5px', fontSize: 10 }}>SCANNING...</div>
                            <h1 style={{ margin: 0, fontSize }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5 }}>{subtitle}</p>
                            <div style={{ height: 2, width: (frame % 100) + '%', backgroundColor: '#00ffff', marginTop: 10 }} />
                        </div>
                    </div>
                );
            case 'hand-drawn':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, transform: `rotate(${interpolate(entrance, [0, 1], [-5, -2])}deg)` }}>
                        <div style={{ backgroundColor: '#fff', border: '3px solid #000', padding: '10px 30px', borderRadius: '15px 50px 30px 10px' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#000', fontFamily: 'cursive' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6, color: '#333' }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'brush-stroke':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 50, opacity }}>
                        <div style={{ backgroundColor: primaryColor, padding: '10px 60px', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', transform: 'rotate(-2deg)' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff', fontWeight: 'bold' }}>{title}</h1>
                        </div>
                        <p style={{ marginLeft: 60, color: '#fff', fontSize: fontSize * 0.6, fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>{subtitle}</p>
                    </div>
                );
            case 'retro-8bit':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, imageRendering: 'pixelated' }}>
                        <div style={{ backgroundColor: '#000', border: '4px solid #fff', padding: 10 }}>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.8, color: '#0f0', fontFamily: '"Press Start 2P", cursive' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.4, color: '#fff' }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'classic-tv':
                return (
                    <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, backgroundColor: 'rgba(0,0,255,0.7)', color: '#fff', padding: '10px 50px', opacity }}>
                        <h1 style={{ margin: 0, fontSize, fontWeight: 'bold', letterSpacing: 2 }}>{title}</h1>
                        <p style={{ margin: 0, fontSize: fontSize * 0.5, textTransform: 'uppercase' }}>{subtitle}</p>
                    </div>
                );
            case 'sports-ticker':
                return (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', opacity }}>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '15px 40px', fontWeight: 'black', fontSize: 30 }}>LIVE</div>
                        <div style={{ backgroundColor: '#fff', flex: 1, padding: '15px 30px', display: 'flex', alignItems: 'center' }}>
                            <h1 style={{ margin: 0, fontSize: 35, color: '#000', fontWeight: 'bold' }}>{title}</h1>
                            <div style={{ width: 2, height: 30, backgroundColor: '#ccc', margin: '0 20px' }} />
                            <p style={{ margin: 0, fontSize: 25, color: '#666' }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'wedding-floral':
                return (
                    <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity }}>
                        <h1 style={{ fontFamily: 'serif', fontSize: fontSize * 1.5, color: '#5d4037', margin: 0, fontStyle: 'italic' }}>{title} & {subtitle}</h1>
                        <div style={{ color: '#8d6e63', fontSize: 20, letterSpacing: 5 }}>EST. 2024</div>
                    </div>
                );
            case 'documentary-sidebar':
                return (
                    <div style={{ position: 'absolute', top: '30%', left: 50, opacity }}>
                        <div style={{ width: 4, height: 100, backgroundColor: primaryColor, position: 'absolute', left: -20 }} />
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.2, color: '#fff', fontWeight: 'bold' }}>{title}</h1>
                        <p style={{ margin: 0, fontSize: fontSize * 0.6, color: '#aaa' }}>{subtitle}</p>
                    </div>
                );
            case 'quote-box':
                return (
                    <div style={{ position: 'absolute', bottom: '20%', left: '10%', right: '10%', opacity, textAlign: 'center' }}>
                        <div style={{ fontSize: 100, color: primaryColor, lineHeight: 0.1, marginBottom: 20 }}>"</div>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.8, color: '#fff', fontStyle: 'italic' }}>{title}</h1>
                        <p style={{ marginTop: 20, color: primaryColor, fontWeight: 'bold' }}>— {subtitle}</p>
                    </div>
                );
            case 'ribbon-tag':
                return (
                    <div style={{ position: 'absolute', bottom: 120, left: 0, opacity }}>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '10px 40px 10px 80px', borderRadius: '0 50px 50px 0', boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}>
                            <h1 style={{ margin: 0, fontSize, fontWeight: 'bold' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'hologram':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity: opacity * 0.7, color: '#00f2ff' }}>
                        <div style={{ borderLeft: '2px solid #00f2ff', paddingLeft: 20, backgroundImage: 'linear-gradient(rgba(0,242,255,0.1) 50%, transparent 50%)', backgroundSize: '100% 4px' }}>
                            <h1 style={{ margin: 0, fontSize, letterSpacing: 4, textTransform: 'uppercase' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.6 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'liquid-motion':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ backgroundColor: primaryColor, padding: '20px 50px', borderRadius: `${40 + Math.sin(frame / 10) * 10}% ${60 + Math.cos(frame / 10) * 10}%`, transition: 'all 0.5s' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff' }}>{title}</h1>
                            <p style={{ margin: 0, color: '#fff', opacity: 0.8 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'confetti':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        {[...Array(10)].map((_, i) => (
                            <div key={i} style={{ position: 'absolute', width: 10, height: 10, backgroundColor: i % 2 === 0 ? primaryColor : '#ff0', top: Math.random() * 100, left: Math.random() * 200, borderRadius: '50%', transform: `scale(${entrance})` }} />
                        ))}
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.5, color: '#fff', fontWeight: 'black', WebkitTextStroke: '2px #000' }}>{title}</h1>
                        <p style={{ margin: 0, fontSize: fontSize, color: '#ff0', fontWeight: 'bold' }}>{subtitle}</p>
                    </div>
                );
            case 'border-animate':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ border: '4px solid #fff', padding: '20px 40px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, border: `4px solid ${primaryColor}`, width: (frame % 100) + '%' }} />
                            <h1 style={{ margin: 0, fontSize, color: '#fff' }}>{title}</h1>
                            <p style={{ margin: 0, color: primaryColor }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'shadow-stack':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 2, color: '#fff', fontWeight: 900, textShadow: `5px 5px ${primaryColor}, 10px 10px rgba(0,0,0,0.3)` }}>{title}</h1>
                        <p style={{ margin: 0, fontSize: fontSize, color: '#fff', opacity: 0.8 }}>{subtitle}</p>
                    </div>
                );
            case 'floating-bubbles':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ backgroundColor: secondaryColor, borderRadius: 50, padding: '10px 30px' }}><h1 style={{ margin: 0, fontSize: fontSize * 0.8 }}>{title}</h1></div>
                            <div style={{ backgroundColor: primaryColor, borderRadius: 50, padding: '10px 20px', display: 'flex', alignItems: 'center', color: '#fff' }}>{subtitle}</div>
                        </div>
                    </div>
                );
            case 'stencil-cut':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ backgroundColor: '#fff', padding: '10px 30px' }}>
                            <h1 style={{
                                margin: 0,
                                fontSize,
                                fontWeight: 900,
                                color: '#000', // Chuyển sang chữ đen
                                fontFamily: 'Inter, sans-serif'
                            }}>{title}</h1>
                        </div>
                        <div style={{
                            backgroundColor: primaryColor,
                            padding: '5px 20px',
                            color: '#fff',
                            width: 'fit-content',
                            fontWeight: 'bold'
                        }}>{subtitle}</div>
                    </div>
                );
            case 'ink-bleed':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.5, color: '#fff', filter: `blur(${interpolate(entrance, [0.5, 1], [10, 0])}px)` }}>{title}</h1>
                        <p style={{ margin: 0, color: primaryColor }}>{subtitle}</p>
                    </div>
                );
            case 'comic-pop':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ backgroundColor: '#ff0', border: '5px solid #000', padding: '10px 40px', transform: 'rotate(-3deg)' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#000', fontWeight: 'black', textTransform: 'uppercase' }}>{title}!!</h1>
                        </div>
                        <div style={{ backgroundColor: '#f0f', color: '#fff', padding: '5px 20px', border: '3px solid #000', transform: 'rotate(2deg) translate(20px, -10px)', width: 'fit-content' }}>{subtitle}</div>
                    </div>
                );
            case 'industrial-steel':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ background: 'linear-gradient(#444, #222)', borderTop: '2px solid #666', borderBottom: '2px solid #000', padding: '20px 40px', borderRadius: 4 }}>
                            <h1 style={{ margin: 0, fontSize, color: '#ddd', textShadow: '0 -1px #000' }}>{title}</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5, color: primaryColor }}>ID: SYST-8829-01</p>
                        </div>
                    </div>
                );
            case 'nature-eco':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity, display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, backgroundColor: '#2d5a27', borderRadius: '50% 0 50% 0', marginRight: 15 }} />
                        <div>
                            <h1 style={{ margin: 0, fontSize, color: '#2d5a27', fontWeight: 'bold' }}>{title}</h1>
                            <p style={{ margin: 0, color: '#556b2f' }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'space-cosmos':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.3, color: '#fff', letterSpacing: 10, fontWeight: 100, textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{title}</h1>
                        <p style={{ margin: 0, color: '#888', letterSpacing: 5 }}>{subtitle}</p>
                    </div>
                );
            case 'luxury-gold':
                return (
                    <div style={{ position: 'absolute', bottom: 120, left: 80, opacity }}>
                        <h1 style={{ margin: 0, fontSize, background: 'linear-gradient(45deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'black', textTransform: 'uppercase' }}>{title}</h1>
                        <div style={{ height: 2, background: '#bf953f', width: 100 }} />
                        <p style={{ margin: 0, color: '#bf953f', letterSpacing: 3 }}>{subtitle}</p>
                    </div>
                );
            case 'chalkboard':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ backgroundColor: '#1e352f', border: '10px solid #5d4037', padding: '20px 40px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff', fontFamily: 'cursive', opacity: 0.9 }}>{title}</h1>
                            <p style={{ margin: 0, color: '#fff', opacity: 0.7 }}>{subtitle}</p>
                        </div>
                    </div>
                );
            case 'blueprint':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 50, opacity, color: '#fff', fontFamily: 'monospace' }}>
                        <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: 20, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            <h1 style={{ margin: 0, fontSize }}>{title}</h1>
                            <p style={{ margin: 0 }}>SPEC: {subtitle}</p>
                            <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 10 }}>DRAFT_V2</div>
                        </div>
                    </div>
                );
            case 'origami':
                return (
                    <div style={{ position: 'absolute', bottom: 100, left: 80, opacity }}>
                        <div style={{ backgroundColor: primaryColor, padding: '10px 40px', transform: 'skewY(-5deg)', position: 'relative' }}>
                            <h1 style={{ margin: 0, fontSize, color: '#fff' }}>{title}</h1>
                            <div style={{ position: 'absolute', left: 0, bottom: -20, borderTop: `20px solid ${primaryColor}`, borderLeft: '20px solid transparent', filter: 'brightness(0.7)' }} />
                        </div>
                        <p style={{ marginLeft: 40, marginTop: 10, color: '#fff' }}>{subtitle}</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100, fontFamily }}>
            {/* Responsive wrapper - scales content for portrait/square videos */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                transform: `scale(${responsiveScale})`,
                transformOrigin: isPortrait ? 'center bottom' : 'left bottom',
            }}>
                {renderTemplate()}
            </div>
        </AbsoluteFill>
    );
};

export default LowerThird;
