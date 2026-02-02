import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    Easing,
    Img,
    staticFile
} from 'remotion';
import { useResponsiveScale } from '../../utils/useResponsiveScale';

// ============ TYPES ============
export type CallToActionTemplate =
    // ... (Original 40) ...
    | 'classic-youtube' | 'minimal-subscribe' | 'social-instagram' | 'social-tiktok' | 'social-facebook'
    | 'social-twitter' | 'notification-bell' | 'channel-footer' | 'join-discord' | 'patreon-support'
    | 'swipe-up' | 'app-store' | 'play-store' | 'website-visit' | 'shop-now' | 'discount-badge'
    | 'newsletter-signup' | 'like-comment-share' | 'qrcode-scan' | 'location-pin'
    | 'generic-blue' | 'generic-gradient' | 'generic-outline' | 'generic-3d' | 'marketing-pill'
    | 'neon-pulse' | 'cyberpunk-glitch' | 'retro-pixel' | 'hand-drawn' | 'speech-bubble'
    | 'glassmorphism' | 'modern-float' | 'corner-ribbon' | 'search-bar' | 'loading-complete'
    | 'mouse-cursor' | 'finger-tap' | 'live-badge' | 'upcoming-event' | 'review-stars'
    // ... New 80 Templates ...
    // E-commerce & Sales (10)
    | 'flash-sale' | 'add-to-cart' | 'limited-time' | 'free-shipping' | 'buy-one-get-one'
    | 'promo-code' | 'seasonal-sale' | 'best-seller' | 'new-arrival' | 'pre-order'
    // Tech & SaaS (10)
    | 'start-free-trial' | 'download-now' | 'book-demo' | 'api-access' | 'cloud-upload'
    | 'security-verified' | 'dark-mode-toggle' | 'ai-feature' | 'software-update' | 'code-snippet'
    // Health & Wellness (10)
    | 'book-appointment' | 'telehealth-call' | 'healthy-choice' | 'workout-join' | 'meditation-start'
    | 'nutrition-facts' | 'organic-badge' | 'medical-trust' | 'fitness-goal' | 'pharmacy-delivery'
    // Education & Knowledge (10)
    | 'enroll-now' | 'download-ebook' | 'webinar-register' | 'course-certificate' | 'study-group'
    | 'library-access' | 'lesson-start' | 'quiz-time' | 'teacher-approved' | 'student-discount'
    // Finance & Crypto (10)
    | 'crypto-buy' | 'stock-market-up' | 'secure-payment' | 'wallet-connect' | 'invest-now'
    | 'credit-card-apply' | 'savings-piggy' | 'chart-growth' | 'bitcoin-accept' | 'insurance-protect'
    // Real Estate & Home (10)
    | 'open-house' | 'sold-badge' | 'virtual-tour' | 'mortgage-calc' | 'dream-home'
    | 'rent-now' | 'agent-contact' | 'property-feature' | 'key-handover' | 'interior-design'
    // Travel & Hospitality (10)
    | 'book-flight' | 'hotel-checkin' | 'destination-pin' | 'holiday-package' | 'passport-stamp'
    | 'travel-guide' | 'luggage-tag' | 'explore-world' | 'beach-vibes' | 'mountain-hike'
    // Food & Dining (10)
    | 'order-delivery' | 'menu-view' | 'chef-recommend' | 'spicy-warning' | 'vegan-badge'
    | 'coffee-break' | 'recipe-save' | 'table-reserve' | 'fast-food-combo' | 'fresh-ingredients';

export interface CallToActionProps {
    title: string;          // Main text (e.g., "Subscribe", "Shop Now")
    subtitle?: string;      // Sub text (e.g., "1M Subscribers", "Limited Time")
    template?: CallToActionTemplate;
    primaryColor?: string;  // Main brand color
    secondaryColor?: string; // Accent/Background color
    textColor?: string;     // Text color
    fontSize?: number;
    fontFamily?: string;    // Font family (e.g., 'Inter', 'Roboto')
    avatar?: string;        // URL for the avatar image
}

// ============ COMPONENT ============
export const CallToAction: React.FC<CallToActionProps> = ({
    title,
    subtitle,
    template = 'classic-youtube',
    primaryColor = '#ff0000', // Default red for YT
    secondaryColor = '#ffffff',
    textColor = '#000000',
    fontSize = 32,
    fontFamily,
    avatar,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const { uniformScale, isPortrait, isSquare, scaleFontSize } = useResponsiveScale();

    // Responsive scale factor for CTA elements
    const responsiveMultiplier = uniformScale;

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

    // Standard Entrance/Exit
    const entrance = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.back(1.5)),
    });

    const exit = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const baseScale = entrance * exit;
    // Apply responsive multiplier to the scale factor
    const scale = baseScale * 1.6 * responsiveMultiplier;
    const opacity = interpolate(baseScale, [0, 0.2, 1], [0, 1, 1]);

    const renderTemplate = () => {
        switch (template) {
            // --- SOCIAL & PLATFORMS ---
            case 'classic-youtube':
                return (
                    <div style={{
                        display: 'flex', alignItems: 'center', backgroundColor: '#fff',
                        padding: '15px 40px', borderRadius: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        transform: `scale(${scale})`
                    }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', marginRight: 20,
                            backgroundImage: avatar ? `url(${avatar})` : 'linear-gradient(135deg, #eee 25%, transparent 25%), linear-gradient(225deg, #eee 25%, transparent 25%), linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(315deg, #eee 25%, transparent 25%)',
                            backgroundPosition: avatar ? 'center' : '10px 0, 10px 0, 0 0, 0 0',
                            backgroundSize: avatar ? 'cover' : '20px 20px',
                            backgroundColor: '#e5e5f7'
                        }}>
                            {/* Avatar */}
                        </div>
                        <div style={{ marginRight: 30 }}>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.8, fontWeight: 'bold' }}>Your Channel</h1>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5, color: '#606060' }}>{subtitle || '1.2M Subscribers'}</p>
                        </div>
                        <div style={{ backgroundColor: '#cc0000', color: '#fff', padding: '10px 25px', borderRadius: 4, fontWeight: 'bold', fontSize: fontSize * 0.6, letterSpacing: 1 }}>
                            {title || 'SUBSCRIBE'}
                        </div>
                    </div>
                );
            case 'minimal-subscribe':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '15px 40px', borderRadius: 30, display: 'flex', alignItems: 'center' }}>
                        <h1 style={{ margin: 0, fontSize, fontWeight: 'bold', letterSpacing: -1 }}>{title || 'SUBSCRIBE'}</h1>
                        {subtitle && <span style={{ marginLeft: 15, opacity: 0.7, fontSize: fontSize * 0.6 }}>|  {subtitle}</span>}
                    </div>
                );
            case 'social-instagram':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', background: 'white', padding: '10px 30px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', marginRight: 15 }}>IG</div>
                        <div>
                            <p style={{ margin: 0, fontSize: fontSize * 0.5, fontWeight: 'bold' }}>@{subtitle || 'username'}</p>
                            <h1 style={{ margin: 0, fontSize: fontSize, color: '#262626' }}>{title || 'Follow'}</h1>
                        </div>
                    </div>
                );
            case 'social-tiktok':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '15px 35px', borderRadius: 8, border: '1px solid #333' }}>
                        <h1 style={{ margin: 0, fontSize, fontWeight: 'bold', textShadow: '2px 2px 0 #00f2ea, -2px -2px 0 #ff0050' }}>{title || 'Follow'}</h1>
                        <p style={{ margin: '5px 0 0', fontSize: fontSize * 0.5, opacity: 0.8 }}>TikTok: {subtitle || '@username'}</p>
                    </div>
                );
            case 'social-facebook':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#1877f2', color: '#fff', padding: '15px 35px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                        <div style={{ marginRight: 15, fontSize: fontSize * 0.8, fontWeight: 'bold' }}>f</div>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.8 }}>{title || 'Like us on Facebook'}</h1>
                    </div>
                );
            case 'social-twitter':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '15px 35px', borderRadius: 50, border: '1px solid #333' }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.8 }}>𝕏 {title || 'Follow'}</h1>
                        <p style={{ margin: '5px 0 0', fontSize: fontSize * 0.4, color: '#71767b' }}>{subtitle || '@handle'}</p>
                    </div>
                );
            case 'notification-bell':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: '15px 30px', borderRadius: 30, display: 'flex', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: fontSize, marginRight: 15, transform: `rotate(${Math.sin(frame / 2) * 15}deg)` }}>🔔</div>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.7, color: '#333' }}>{title || 'Turn on Notifications'}</h1>
                    </div>
                );
            case 'channel-footer':
                return (
                    <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, opacity, backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 50, height: 50, backgroundColor: '#ddd', borderRadius: '50%', marginRight: 15 }}></div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: fontSize * 0.8, color: '#fff' }}>Channel Name</h1>
                                <p style={{ margin: 0, fontSize: fontSize * 0.5, color: '#aaa' }}>{subtitle || 'Recommended for you'}</p>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#fff', color: '#000', padding: '10px 30px', borderRadius: 30, fontWeight: 'bold' }}>{title || 'Subscribe'}</div>
                    </div>
                );
            case 'join-discord':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#5865F2', color: '#fff', padding: '15px 40px', borderRadius: 8, textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.9 }}>{title || 'Join our Discord'}</h1>
                        <p style={{ margin: '5px 0 0', fontSize: fontSize * 0.5, opacity: 0.8 }}>{subtitle || 'Community Hub'}</p>
                    </div>
                );
            case 'patreon-support':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#ff424d', color: '#fff', padding: '15px 40px', borderRadius: 50, fontWeight: 'bold' }}>
                        {title || 'Support on Patreon'}
                    </div>
                );

            // --- ACTIONS & COMMERCIAL ---
            case 'swipe-up':
                return (
                    <div style={{ position: 'absolute', bottom: 100, opacity, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderTop: `4px solid ${primaryColor}`, borderLeft: `4px solid ${primaryColor}`, transform: `rotate(45deg) translateY(${Math.sin(frame / 5) * 10}px)` }}></div>
                        <h1 style={{ marginTop: 20, fontSize, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: 10 }}>{title || 'Swipe Up'}</h1>
                    </div>
                );
            case 'app-store':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', border: '1px solid #fff', padding: '10px 25px', borderRadius: 10, display: 'flex', alignItems: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 30, marginRight: 15 }}></div>
                        <div>
                            <div style={{ fontSize: 10 }}>Download on the</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold' }}>App Store</div>
                        </div>
                    </div>
                );
            case 'play-store':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', border: '1px solid #fff', padding: '10px 25px', borderRadius: 10, display: 'flex', alignItems: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 24, marginRight: 15 }}>▶️</div>
                        <div>
                            <div style={{ fontSize: 10 }}>GET IT ON</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold' }}>Google Play</div>
                        </div>
                    </div>
                );
            case 'website-visit':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: '5px 20px', borderRadius: 50, border: `2px solid ${primaryColor}`, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: primaryColor, fontWeight: 'bold', marginRight: 10 }}>🌎</span>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.7, color: '#333', fontFamily: 'monospace' }}>{title || 'www.website.com'}</h1>
                    </div>
                );
            case 'shop-now':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: primaryColor, color: '#fff', padding: '15px 40px', borderRadius: 0, display: 'flex', alignItems: 'center', letterSpacing: 2 }}>
                        <span style={{ marginRight: 15 }}>🛍️</span> {title || 'SHOP NOW'}
                    </div>
                );
            case 'discount-badge':
                return (
                    <div style={{ transform: `scale(${scale}) rotate(${Math.sin(frame / 10) * 5}deg)`, backgroundColor: '#ffeb3b', color: '#f44336', width: 150, height: 150, borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', border: '4px dashed #f44336' }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 1.5, fontWeight: '900', lineHeight: 1 }}>{title || '50%'}</h1>
                        <h2 style={{ margin: 0, fontSize: fontSize * 0.6, fontWeight: 'bold' }}>OFF</h2>
                    </div>
                );
            case 'newsletter-signup':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: 10, borderRadius: 8, display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <div style={{ backgroundColor: '#f1f1f1', padding: '10px 20px', borderRadius: 4, color: '#999', marginRight: 10, minWidth: 200 }}>{subtitle || 'Enter your email...'}</div>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '10px 20px', borderRadius: 4, fontWeight: 'bold' }}>{title || 'Sign Up'}</div>
                    </div>
                );
            case 'like-comment-share':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '15px 30px', borderRadius: 30, display: 'flex', gap: 30 }}>
                        <span style={{ fontWeight: 'bold' }}>👍 Like</span>
                        <span style={{ fontWeight: 'bold' }}>💬 Comment</span>
                        <span style={{ fontWeight: 'bold' }}>↗️ Share</span>
                    </div>
                );
            case 'qrcode-scan':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: 15, borderRadius: 10, textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 100, height: 100, backgroundColor: '#000', margin: '0 auto 10px', backgroundImage: 'radial-gradient(white 30%, transparent 31%)', backgroundSize: '10px 10px' }}></div>
                        <div style={{ fontWeight: 'bold', fontSize: 12 }}>{title || 'SCAN ME'}</div>
                    </div>
                );
            case 'location-pin':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 50, color: primaryColor, transform: 'translateY(-10px)' }}>📍</div>
                        <div style={{ backgroundColor: '#fff', padding: '10px 20px', borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.7 }}>{title || 'Visit Us'}</h1>
                            <p style={{ margin: 0, fontSize: 10, color: '#666' }}>{subtitle || '123 Main St, City'}</p>
                        </div>
                    </div>
                );

            // --- GENERIC BUTTONS ---
            case 'generic-blue':
                return (<div style={{ transform: `scale(${scale})`, backgroundColor: '#007bff', color: '#fff', padding: '15px 50px', borderRadius: 8, fontSize: fontSize, fontWeight: 'bold' }}>{title || 'Button'}</div>);
            case 'generic-gradient':
                return (<div style={{ transform: `scale(${scale})`, background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)', color: '#fff', padding: '15px 50px', borderRadius: 30, fontSize: fontSize, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,201,255,0.4)' }}>{title || 'Get Started'}</div>);
            case 'generic-outline':
                return (<div style={{ transform: `scale(${scale})`, border: `3px solid ${primaryColor || '#fff'}`, color: primaryColor || '#fff', padding: '12px 45px', borderRadius: 4, fontSize: fontSize, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.2)' }}>{title || 'Learn More'}</div>);
            case 'generic-3d':
                return (<div style={{ transform: `scale(${scale})`, backgroundColor: '#ffcc00', color: '#000', padding: '15px 50px', borderRadius: 8, fontSize: fontSize, fontWeight: '900', borderBottom: '6px solid #c7a000', borderRight: '6px solid #c7a000' }}>{title || 'CLICK ME'}</div>);
            case 'marketing-pill':
                return (<div style={{ transform: `scale(${scale})`, backgroundColor: primaryColor, color: '#fff', padding: '10px 20px', borderRadius: 50, fontSize: fontSize * 0.7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{title || 'Special Offer'} ›</div>);

            // --- EFFECTS & STYLES ---
            case 'neon-pulse':
                return (
                    <div style={{ transform: `scale(${scale})`, border: `2px solid ${primaryColor || '#0ff'}`, padding: '20px 60px', borderRadius: 4, boxShadow: `0 0 15px ${primaryColor || '#0ff'}, inset 0 0 15px ${primaryColor || '#0ff'}` }}>
                        <h1 style={{ margin: 0, color: '#fff', textShadow: `0 0 10px ${primaryColor || '#0ff'}`, fontSize }}>{title || 'NEON TEXT'}</h1>
                    </div>
                );
            case 'cyberpunk-glitch':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#f0f', padding: '15px 30px', clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', borderLeft: '5px solid #0ff' }}>
                        <h1 style={{ margin: 0, fontSize: fontSize, fontFamily: 'monospace', textTransform: 'uppercase' }}>{title || 'SYSTEM_OVERRIDE'}</h1>
                    </div>
                );
            case 'retro-pixel':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', border: '4px solid #fff', padding: '15px 20px', imageRendering: 'pixelated' }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.8, color: '#0f0', fontFamily: 'monospace' }}>{`> ${title || 'START GAME'}`}</h1>
                    </div>
                );
            case 'hand-drawn':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '3px solid #000', borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px', padding: '15px 40px', backgroundColor: '#fff', color: '#000' }}>
                        <h1 style={{ margin: 0, fontSize, fontFamily: 'cursive' }}>{title || 'Check this out!'}</h1>
                    </div>
                );
            case 'speech-bubble':
                return (
                    <div style={{ transform: `scale(${scale})`, position: 'relative', backgroundColor: '#fff', color: '#000', padding: '20px 40px', borderRadius: 20 }}>
                        <h1 style={{ margin: 0, fontSize, fontWeight: 'bold' }}>{title || 'Say Hello!'}</h1>
                        <div style={{ position: 'absolute', bottom: -10, left: 30, width: 20, height: 20, backgroundColor: '#fff', transform: 'rotate(45deg)' }}></div>
                    </div>
                );
            case 'glassmorphism':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '20px 50px', borderRadius: 16 }}>
                        <h1 style={{ margin: 0, color: '#fff', fontSize }}>{title || 'Glass Effect'}</h1>
                    </div>
                );
            case 'modern-float':
                return (
                    <div style={{ transform: `scale(${scale}) translateY(${Math.sin(frame / 20) * 10}px)`, backgroundColor: '#fff', padding: '20px 50px', borderRadius: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                        <h1 style={{ margin: 0, color: '#333', fontSize }}>{title || 'Floating Button'}</h1>
                    </div>
                );
            case 'corner-ribbon':
                return (
                    <div style={{ position: 'absolute', top: 50, right: 0, backgroundColor: primaryColor, color: '#fff', padding: '10px 60px', transform: 'rotate(45deg) translate(30px, -30px)', opacity }}>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.6, fontWeight: 'bold', textTransform: 'uppercase' }}>{title || 'NEW'}</h1>
                    </div>
                );
            case 'search-bar':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', borderRadius: 50, padding: '10px 20px', display: 'flex', alignItems: 'center', width: 300, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <span style={{ marginRight: 10, color: '#999' }}>🔍</span>
                        <div style={{ color: '#333' }}>{title || 'Search keyword...'}</div>
                    </div>
                );
            case 'loading-complete':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#111', padding: 20, borderRadius: 8, color: '#fff', textAlign: 'center' }}>
                        <div style={{ width: 200, height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#0f0' }}></div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: fontSize * 0.5 }}>{title || 'DOWNLOAD COMPLETE'}</h1>
                    </div>
                );

            // --- INTERACTIVE & MISC ---
            case 'mouse-cursor':
                return (
                    <div style={{ transform: `scale(${scale})`, position: 'relative' }}>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '15px 40px', borderRadius: 4 }}>{title || 'Click Here'}</div>
                        <div style={{ position: 'absolute', bottom: -20, right: -20, fontSize: 30, transform: `translate(${(Math.sin(frame / 10) + 1) * 10}px, ${(Math.cos(frame / 10) + 1) * 10}px)` }}>🖱️</div>
                    </div>
                );
            case 'finger-tap':
                return (
                    <div style={{ transform: `scale(${scale})`, position: 'relative' }}>
                        <div style={{ border: `2px solid ${primaryColor}`, color: primaryColor, padding: '15px 40px', borderRadius: 30, fontWeight: 'bold' }}>{title || 'Tap to Open'}</div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', fontSize: 40, transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 3) * 0.2})`, opacity: 0.5 }}>👆</div>
                    </div>
                );
            case 'live-badge':
                return (
                    <div style={{ opacity: scale, backgroundColor: '#ff0000', color: '#fff', padding: '5px 15px', borderRadius: 4, fontWeight: 'bold', fontSize: fontSize * 0.6, letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, backgroundColor: '#fff', borderRadius: '50%', marginRight: 8, opacity: Math.sin(frame / 5) > 0 ? 1 : 0.4 }}></div>
                        {title || 'LIVE NOW'}
                    </div>
                );
            case 'upcoming-event':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', display: 'flex', borderRadius: 8, overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: 10 }}>DEC</div>
                            <div style={{ fontSize: 24, fontWeight: 'bold' }}>25</div>
                        </div>
                        <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
                            <h1 style={{ margin: 0, fontSize: fontSize * 0.6, color: '#333' }}>{title || 'Upcoming Stream'}</h1>
                        </div>
                    </div>
                );
            case 'review-stars':
                return (
                    <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
                        <div style={{ color: '#ffcc00', fontSize: 30, letterSpacing: 5 }}>★★★★★</div>
                        <h1 style={{ margin: '5px 0 0', fontSize: fontSize * 0.6, color: '#fff' }}>{title || 'Rate Us 5 Stars'}</h1>
                    </div>
                );

            // --- E-COMMERCE & SALES (10) ---
            case 'flash-sale':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'linear-gradient(45deg, #ff0000, #ff8800)', color: '#fff', padding: '15px 40px', clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)', fontWeight: '900', fontSize: fontSize * 0.8 }}>
                        ⚡ {title || 'FLASH SALE'} ⚡
                    </div>
                );
            case 'add-to-cart':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#4CAF50', color: '#fff', padding: '10px 30px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: fontSize, marginRight: 10 }}>🛒</span>
                        <b>{title || 'ADD TO CART'}</b>
                    </div>
                );
            case 'limited-time':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '3px solid #fff', color: '#fff', padding: '10px 20px', borderRadius: 4, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, letterSpacing: 2 }}>LIMITED OFFER</div>
                        <div style={{ fontSize: fontSize, fontWeight: 'bold' }}>{title || 'ENDS SOON'}</div>
                    </div>
                );
            case 'free-shipping':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#333', color: '#fff', padding: '5px 20px', borderRadius: 30, display: 'flex', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ marginRight: 5 }}>🚚</span> Free Shipping
                    </div>
                );
            case 'buy-one-get-one':
                return (
                    <div style={{ backgroundColor: '#E91E63', color: '#fff', padding: '15px', borderRadius: '50%', width: 100, height: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '3px dashed #fff', transform: `rotate(-10deg) scale(${scale})` }}>
                        <div style={{ fontSize: 24, fontWeight: '900' }}>BOGO</div>
                        <div style={{ fontSize: 10 }}>FREE</div>
                    </div>
                );
            case 'promo-code':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#eee', border: '2px dashed #999', padding: '10px 30px', borderRadius: 4, fontFamily: 'monospace', color: '#333', fontWeight: 'bold' }}>
                        CODE: {title || 'SAVE20'}
                    </div>
                );
            case 'seasonal-sale':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundImage: 'linear-gradient(to right, #DA22FF, #9733EE)', color: '#fff', padding: '10px 40px', borderRadius: 50, boxShadow: '0 5px 15px rgba(218, 34, 255, 0.4)' }}>
                        {title || 'SPRING SALE'}
                    </div>
                );
            case 'best-seller':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FFD700', color: '#000', padding: '5px 15px', borderRadius: 4, fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 5 }}>⭐</span> #{title || '1 Best Seller'}
                    </div>
                );
            case 'new-arrival':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#111', color: '#fff', padding: '10px 30px', borderTop: '4px solid #fff' }}>
                        {title || 'NEW DROP'}
                    </div>
                );
            case 'pre-order':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'transparent', border: `2px solid ${primaryColor}`, color: primaryColor, padding: '10px 30px', borderRadius: 30, fontWeight: 'bold' }}>
                        PRE-ORDER NOW
                    </div>
                );

            // --- TECH & SAAS (10) ---
            case 'start-free-trial':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: primaryColor, color: '#fff', padding: '15px 40px', borderRadius: 4, fontWeight: 'bold', fontSize: fontSize * 0.7 }}>
                        {title || 'Start Free Trial'} ›
                    </div>
                );
            case 'download-now':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#333', color: '#fff', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: 20, marginRight: 10 }}>⬇</div>
                        <div>
                            <div style={{ fontSize: 10, color: '#aaa' }}>Version 2.0</div>
                            <div style={{ fontWeight: 'bold' }}>Download</div>
                        </div>
                    </div>
                );
            case 'book-demo':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', border: `2px solid ${primaryColor}`, color: primaryColor, padding: '10px 30px', borderRadius: 4, fontWeight: 'bold' }}>
                        📅 Book a Demo
                    </div>
                );
            case 'api-access':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#1e1e1e', color: '#00ff00', padding: '10px 20px', fontFamily: 'monospace', borderRadius: 4, border: '1px solid #333' }}>
                        &lt;API_KEY /&gt;
                    </div>
                );
            case 'cloud-upload':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 40, color: primaryColor, transform: `translateY(${Math.sin(frame / 10) * -5}px)` }}>☁️</div>
                        <div style={{ fontSize: 12 }}>Syncing...</div>
                    </div>
                );
            case 'security-verified':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '5px 15px', borderRadius: 20, display: 'flex', alignItems: 'center', fontSize: 12, border: '1px solid #2e7d32' }}>
                        🔒 Verified Secure
                    </div>
                );
            case 'dark-mode-toggle':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#333', padding: 5, borderRadius: 20, width: 60, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%' }}></div>
                    </div>
                );
            case 'ai-feature':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '10px 25px', borderRadius: 30, display: 'flex', alignItems: 'center' }}>
                        ✨ AI Powered
                    </div>
                );
            case 'software-update':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', padding: '10px 20px', borderRadius: 8, color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                        🆕 Update Available
                    </div>
                );
            case 'code-snippet':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#282c34', color: '#abb2bf', padding: '10px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
                        npm install vibes
                    </div>
                );

            // --- HEALTH & WELLNESS (10) ---
            case 'book-appointment':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#009688', color: '#fff', padding: '15px 30px', borderRadius: 4, fontWeight: 'bold' }}>
                        ✚ Book Appointment
                    </div>
                );
            case 'telehealth-call':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '10px 20px', borderRadius: 30, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: 10, height: 10, backgroundColor: '#4CAF50', borderRadius: '50%', marginRight: 10 }}></div>
                        <div style={{ color: '#333' }}>Dr. Online</div>
                    </div>
                );
            case 'healthy-choice':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '2px solid #8BC34A', color: '#8BC34A', padding: '10px 25px', borderRadius: 50, fontWeight: 'bold', backgroundColor: '#fff' }}>
                        🥗 Healthy Choice
                    </div>
                );
            case 'workout-join':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#f44336', color: '#fff', padding: '10px 40px', borderRadius: 0, fontWeight: '900', fontStyle: 'italic' }}>
                        JOIN CHALLENGE
                    </div>
                );
            case 'meditation-start':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#E1BEE7', color: '#4A148C', padding: '15px 30px', borderRadius: 30, fontFamily: 'serif' }}>
                        🧘 Begin Journey
                    </div>
                );
            case 'nutrition-facts':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '2px solid #000', backgroundColor: '#fff', color: '#000', padding: 5, width: 100, fontSize: 10 }}>
                        <div style={{ borderBottom: '4px solid #000', fontWeight: '900', fontSize: 14 }}>Nutrition</div>
                        <div>Calories 200</div>
                    </div>
                );
            case 'organic-badge':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#558B2F', color: '#fff', width: 80, height: 80, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid #fff' }}>
                        100% Organic
                    </div>
                );
            case 'medical-trust':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#2196F3' }}>
                        <div style={{ fontSize: 30 }}>🛡️</div>
                        <div style={{ backgroundColor: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>FDA Approved</div>
                    </div>
                );
            case 'fitness-goal':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '10px 20px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 100, height: 6, backgroundColor: '#333', borderRadius: 3, marginRight: 10 }}>
                            <div style={{ width: '80%', height: '100%', backgroundColor: '#FFC107', borderRadius: 3 }}></div>
                        </div>
                        80%
                    </div>
                );
            case 'pharmacy-delivery':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: '5px 15px', borderRadius: 20, boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 20, marginRight: 5 }}>💊</span> 2h Delivery
                    </div>
                );

            // --- EDUCATION & KNOWLEDGE (10) ---
            case 'enroll-now':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FF5722', color: '#fff', padding: '15px 40px', borderRadius: 4, fontWeight: 'bold', boxShadow: '0 4px 0 #E64A19' }}>
                        ENROLL NOW
                    </div>
                );
            case 'download-ebook':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
                        <div style={{ width: 30, height: 40, backgroundColor: '#3F51B5', marginRight: 10 }}></div>
                        <div>
                            <div style={{ fontSize: 10, color: '#666' }}>Free PDF</div>
                            <div style={{ fontWeight: 'bold', fontSize: 12 }}>Download Guide</div>
                        </div>
                    </div>
                );
            case 'webinar-register':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#673AB7', color: '#fff', padding: '10px 30px', borderRadius: 4 }}>
                        🎥 Register for Webinar
                    </div>
                );
            case 'course-certificate':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '4px double #FFD700', padding: '10px 20px', backgroundColor: '#fffcf5', color: '#333', fontFamily: 'serif' }}>
                        Certified Digital Marketer
                    </div>
                );
            case 'study-group':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', padding: 5 }}>
                        {[1, 2, 3].map(i => <div key={i} style={{ width: 30, height: 30, backgroundColor: '#ddd', borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -10 : 0 }}></div>)}
                        <div style={{ marginLeft: 10, display: 'flex', alignItems: 'center', color: '#fff', fontWeight: 'bold' }}>+500 Students</div>
                    </div>
                );
            case 'library-access':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#795548', color: '#fff', padding: '10px 20px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                        📚 Access Library
                    </div>
                );
            case 'lesson-start':
                return (
                    <div style={{ transform: `scale(${scale})`, width: 60, height: 60, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '15px solid #000' }}></div>
                    </div>
                );
            case 'quiz-time':
                return (
                    <div style={{ backgroundColor: '#FFAB00', color: '#fff', padding: '10px 30px', borderRadius: 20, fontWeight: 'bold', transform: `rotate(${Math.sin(frame / 5) * 5}deg) scale(${scale})` }}>
                        ? TAKE QUIZ
                    </div>
                );
            case 'teacher-approved':
                return (
                    <div style={{ width: 80, height: 80, border: '3px solid #F44336', borderRadius: '50%', color: '#F44336', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', transform: `rotate(-20deg) scale(${scale})`, opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.8)' }}>
                        A+
                    </div>
                );
            case 'student-discount':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '5px 15px', borderRadius: 4 }}>
                        🎓 20% Student Off
                    </div>
                );

            // --- FINANCE & CRYPTO (10) ---
            case 'crypto-buy':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'linear-gradient(to right, #F7931A, #F7931A)', color: '#fff', padding: '10px 30px', borderRadius: 30, fontWeight: 'bold' }}>
                        ₿ Buy Bitcoin
                    </div>
                );
            case 'stock-market-up':
                return (
                    <div style={{ transform: `scale(${scale})`, color: '#4CAF50', backgroundColor: '#e8f5e9', padding: '10px 20px', borderRadius: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        AAPL ▲ 2.5%
                    </div>
                );
            case 'secure-payment':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '1px solid #ccc', backgroundColor: '#fff', padding: '5px 15px', borderRadius: 4, display: 'flex', alignItems: 'center', color: '#555' }}>
                        🔒 100% Secure Checkout
                    </div>
                );
            case 'wallet-connect':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#3f51b5', color: '#fff', padding: '10px 25px', borderRadius: 20 }}>
                        Connect Wallet
                    </div>
                );
            case 'invest-now':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#00695C', color: '#fff', padding: '15px 40px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
                        Start Investing
                    </div>
                );
            case 'credit-card-apply':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'linear-gradient(45deg, #111, #444)', color: '#fff', width: 140, height: 80, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 10 }}>PLATINUM</div>
                        <div style={{ fontSize: 10 }}>•••• •••• •••• 1234</div>
                    </div>
                );
            case 'savings-piggy':
                return (
                    <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
                        <div style={{ fontSize: 40 }}>🐷</div>
                        <div style={{ backgroundColor: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', marginTop: -10 }}>Save Money</div>
                    </div>
                );
            case 'chart-growth':
                return (
                    <div style={{ transform: `scale(${scale})`, width: 100, height: 60, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
                        <div style={{ width: '20%', height: '40%', backgroundColor: '#81C784' }}></div>
                        <div style={{ width: '20%', height: '60%', backgroundColor: '#66BB6A' }}></div>
                        <div style={{ width: '20%', height: '80%', backgroundColor: '#43A047' }}></div>
                        <div style={{ width: '20%', height: '100%', backgroundColor: '#2E7D32' }}></div>
                    </div>
                );
            case 'bitcoin-accept':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: '5px 15px', borderRadius: 4, display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <span style={{ color: '#F7931A', fontWeight: 'bold', marginRight: 5 }}>₿</span> Accepted Here
                    </div>
                );
            case 'insurance-protect':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', backgroundColor: '#E0F2F1', color: '#00695C', padding: '10px 20px', borderRadius: 30 }}>
                        ☔ Get Protected
                    </div>
                );

            // --- REAL ESTATE & HOME (10) ---
            case 'open-house':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '15px 30px', border: '1px solid #fff' }}>
                        🏠 OPEN HOUSE SUNDAY
                    </div>
                );
            case 'sold-badge':
                return (
                    <div style={{ backgroundColor: '#D32F2F', color: '#fff', padding: '10px 40px', transform: `rotate(-15deg) scale(${scale})`, fontWeight: 'bold', fontSize: 24, border: '4px solid #fff' }}>
                        SOLD
                    </div>
                );
            case 'virtual-tour':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '10px 20px', borderRadius: 30, backdropFilter: 'blur(5px)' }}>
                        Example 360° Virtual Tour
                    </div>
                );
            case 'mortgage-calc':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        🧮 Calculate Mortgage
                    </div>
                );
            case 'dream-home':
                return (
                    <div style={{ transform: `scale(${scale})`, fontFamily: 'serif', fontStyle: 'italic', color: '#fff', fontSize: fontSize * 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        Your Dream Home Awaits
                    </div>
                );
            case 'rent-now':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FF9800', color: '#fff', padding: '10px 30px', borderRadius: 4, fontWeight: 'bold' }}>
                        FOR RENT
                    </div>
                );
            case 'agent-contact':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 50, boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 40, height: 40, backgroundColor: '#ccc', borderRadius: '50%', marginRight: 10 }}></div>
                        <div style={{ marginRight: 15 }}>
                            <div style={{ fontSize: 10, color: '#999' }}>Realtor</div>
                            <div style={{ fontWeight: 'bold' }}>Call Sarah</div>
                        </div>
                        <div style={{ backgroundColor: '#25D366', color: '#fff', width: 30, height: 30, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>📞</div>
                    </div>
                );
            case 'property-feature':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: '5px 15px', borderRadius: 20, display: 'flex', gap: 10 }}>
                        <span>3 🛏</span>
                        <span>2 🛁</span>
                        <span>1500 sqft</span>
                    </div>
                );
            case 'key-handover':
                return (
                    <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
                        <div style={{ fontSize: 40 }}>🗝️</div>
                        <div style={{ backgroundColor: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 10 }}>Move-in Ready</div>
                    </div>
                );
            case 'interior-design':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '1px solid #fff', padding: '10px 30px', color: '#fff', textTransform: 'uppercase', letterSpacing: 2 }}>
                        Interior Design
                    </div>
                );

            // --- TRAVEL & HOSPITALITY (10) ---
            case 'book-flight':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#2196F3', color: '#fff', padding: '10px 30px', borderRadius: 30, display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 10, fontSize: 20 }}>✈️</span> Book Flight
                    </div>
                );
            case 'hotel-checkin':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#333', color: '#D4AF37', padding: '15px 40px', fontFamily: 'serif', letterSpacing: 1 }}>
                        Reserve Suite
                    </div>
                );
            case 'destination-pin':
                return (
                    <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ padding: '5px 15px', backgroundColor: '#fff', borderRadius: 4, fontWeight: 'bold', marginBottom: 5 }}>PARIS</div>
                        <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '15px solid #fff' }}></div>
                    </div>
                );
            case 'holiday-package':
                return (
                    <div style={{ transform: `scale(${scale})`, background: 'linear-gradient(to bottom, #29B6F6, #0288D1)', color: '#fff', padding: '20px', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 10 }}>SUMMER DEAL</div>
                        <div style={{ fontSize: 24, fontWeight: 'bold' }}>$499</div>
                        <div style={{ fontSize: 10 }}>ALL INCLUSIVE</div>
                    </div>
                );
            case 'passport-stamp':
                return (
                    <div style={{ width: 100, height: 100, border: '4px double #d32f2f', borderRadius: '50%', color: '#d32f2f', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `rotate(-15deg) scale(${scale})`, fontWeight: 'bold', opacity: 0.8 }}>
                        APPROVED
                    </div>
                );
            case 'travel-guide':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FF5722', color: '#fff', padding: '10px 20px', borderRadius: 4 }}>
                        📖 Get Travel Guide
                    </div>
                );
            case 'luggage-tag':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FFC107', color: '#000', padding: '10px 20px', borderRadius: '5px 5px 0 0', position: 'relative' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#000', position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' }}></div>
                        <div style={{ marginTop: 10, fontWeight: 'bold' }}>LUGGAGE</div>
                    </div>
                );
            case 'explore-world':
                return (
                    <div style={{ transform: `scale(${scale})`, fontSize: fontSize * 1.5, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', letterSpacing: 5 }}>
                        EXPLORE
                    </div>
                );
            case 'beach-vibes':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: 'rgba(255,255,255,0.8)', color: '#009688', padding: '10px 30px', borderRadius: 50, fontFamily: 'cursive' }}>
                        Choose your Vibes 🌴
                    </div>
                );
            case 'mountain-hike':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '2px solid #fff', padding: '10px 20px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        ⛰ Hiking Adventure
                    </div>
                );

            // --- FOOD & DINING (10) ---
            case 'order-delivery':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FF5722', color: '#fff', padding: '10px 30px', borderRadius: 30, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                        🛵 Order Now
                    </div>
                );
            case 'menu-view':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#fff', color: '#000', padding: '10px 25px', border: '1px solid #000', borderRadius: 4 }}>
                        📜 View Menu
                    </div>
                );
            case 'chef-recommend':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#000', color: '#fff', padding: '5px 15px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                        👨‍🍳 Chef's Choice
                    </div>
                );
            case 'spicy-warning':
                return (
                    <div style={{ transform: `scale(${scale})`, color: '#F44336', backgroundColor: '#fff', padding: '5px 15px', borderRadius: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        🌶️🌶️🌶️ SPICY
                    </div>
                );
            case 'vegan-badge':
                return (
                    <div style={{ transform: `scale(${scale})`, width: 60, height: 60, backgroundColor: '#4CAF50', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 10, fontWeight: 'bold', border: '2px solid #fff' }}>
                        VEGAN
                    </div>
                );
            case 'coffee-break':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#795548', color: '#fff', padding: '10px 20px', borderRadius: 50, display: 'flex', alignItems: 'center' }}>
                        ☕ Coffee Time
                    </div>
                );
            case 'recipe-save':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '1px dashed #000', backgroundColor: '#fff8e1', padding: '10px 20px', color: '#333' }}>
                        ✂ Save Recipe
                    </div>
                );
            case 'table-reserve':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#D32F2F', color: '#fff', padding: '10px 30px', borderRadius: 4 }}>
                        🍽️ Reserve Table
                    </div>
                );
            case 'fast-food-combo':
                return (
                    <div style={{ transform: `scale(${scale})`, backgroundColor: '#FBC02D', color: '#D32F2F', padding: '10px 20px', borderRadius: 10, fontWeight: '900', border: '2px solid #D32F2F' }}>
                        COMBO MEAL $5
                    </div>
                );
            case 'fresh-ingredients':
                return (
                    <div style={{ transform: `scale(${scale})`, border: '1px solid #fff', padding: '5px 15px', borderRadius: 20, color: '#fff', display: 'flex', alignItems: 'center' }}>
                        🥬 Fresh Ingredients
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: isPortrait ? 'flex-end' : 'center',
            paddingBottom: isPortrait ? '10%' : 0,
            zIndex: 1000,
            fontFamily,
        }}>
            {/* Content is already scaled via the scale variable in each template */}
            {renderTemplate()}
        </AbsoluteFill>
    );
};
