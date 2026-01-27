/**
 * TikTok Caption Themes
 *
 * Each theme defines visual style and animation for captions.
 * Choose theme based on content mood/style.
 */

export interface CaptionTheme {
    name: string;
    description: string;
    keywords: string[]; // Keywords to auto-match content
    style: {
        // Container
        containerBg?: string;
        containerPadding?: string;
        containerBorderRadius?: number;

        // Text base
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        textTransform?: 'none' | 'uppercase' | 'lowercase';
        letterSpacing?: number;

        // Colors
        textColor: string;           // Inactive words
        activeColor: string;         // Active word
        strokeColor?: string;        // Text stroke/outline
        strokeWidth?: number;
        shadowColor?: string;

        // Active word special styling
        activeBgColor?: string;      // Background for active word
        activeBorderRadius?: number;
        activePadding?: string;
    };
    animation: {
        type: 'scale' | 'drop' | 'fade' | 'bounce' | 'none';
        scaleAmount?: number;        // For scale animation
        dropDistance?: number;       // For drop animation
        duration?: number;           // Animation duration in seconds
    };
}

export const CAPTION_THEMES: Record<string, CaptionTheme> = {
    /**
     * Clean Minimal - White pill background, black text, gray active
     * Good for: Educational, professional, clean aesthetic
     */
    'clean-minimal': {
        name: 'Clean Minimal',
        description: 'White rounded background, black text, subtle gray highlight. Professional and readable.',
        keywords: ['educational', 'professional', 'clean', 'minimal', 'tutorial', 'explainer'],
        style: {
            containerBg: 'rgba(255, 255, 255, 0.95)',
            containerPadding: '12px 24px',
            containerBorderRadius: 30,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 42,
            fontWeight: 700,
            textTransform: 'lowercase',
            textColor: '#1a1a1a',
            activeColor: '#9ca3af',  // Gray for active
            strokeWidth: 0,
        },
        animation: {
            type: 'fade',
            duration: 0.1,
        },
    },

    /**
     * Gold Bold - Yellow text with thick black stroke
     * Good for: Attention-grabbing, news, facts, Vietnamese content
     */
    'gold-bold': {
        name: 'Gold Bold',
        description: 'Bold yellow text with thick black outline. High contrast, attention-grabbing.',
        keywords: ['attention', 'news', 'facts', 'shocking', 'vietnamese', 'bold', 'drama'],
        style: {
            fontFamily: 'Montserrat, Impact, sans-serif',
            fontSize: 72,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            textColor: '#FFD700',
            activeColor: '#FFFFFF',
            strokeColor: '#000000',
            strokeWidth: 8,
            shadowColor: 'rgba(0,0,0,0.8)',
        },
        animation: {
            type: 'scale',
            scaleAmount: 1.15,
            duration: 0.08,
        },
    },

    /**
     * Drop Green - Words drop down, active word is green
     * Good for: Dynamic, energetic, action content
     */
    'drop-green': {
        name: 'Drop Green',
        description: 'Words drop into place with green highlight on active word. Dynamic and energetic.',
        keywords: ['dynamic', 'action', 'energetic', 'sports', 'gaming', 'fast'],
        style: {
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 64,
            fontWeight: 800,
            textTransform: 'uppercase',
            textColor: '#1a1a1a',
            activeColor: '#22c55e',  // Green
            strokeColor: '#000000',
            strokeWidth: 4,
            shadowColor: 'rgba(0,0,0,0.6)',
        },
        animation: {
            type: 'drop',
            dropDistance: 50,
            duration: 0.15,
        },
    },

    /**
     * Red Box - Active word has red background box
     * Good for: Important points, calls to action, warnings
     */
    'red-box': {
        name: 'Red Box Highlight',
        description: 'Active word highlighted with red background box. Great for emphasis.',
        keywords: ['important', 'warning', 'cta', 'emphasis', 'urgent', 'key-points'],
        style: {
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 48,
            fontWeight: 700,
            textTransform: 'uppercase',
            textColor: '#FFFFFF',
            activeColor: '#FFFFFF',
            activeBgColor: '#dc2626',  // Red background
            activeBorderRadius: 6,
            activePadding: '4px 12px',
            strokeColor: '#000000',
            strokeWidth: 3,
        },
        animation: {
            type: 'scale',
            scaleAmount: 1.1,
            duration: 0.1,
        },
    },

    /**
     * Impact Yellow - Large yellow text, maximum impact
     * Good for: Hooks, viral content, shocking reveals
     */
    'impact-yellow': {
        name: 'Impact Yellow',
        description: 'Maximum impact with large yellow text and heavy stroke. Perfect for hooks.',
        keywords: ['hook', 'viral', 'shocking', 'reveal', 'impact', 'wow'],
        style: {
            fontFamily: 'Impact, Montserrat, sans-serif',
            fontSize: 80,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 1,
            textColor: '#FCD34D',  // Yellow
            activeColor: '#FFFFFF',
            strokeColor: '#000000',
            strokeWidth: 10,
            shadowColor: 'rgba(0,0,0,0.9)',
        },
        animation: {
            type: 'bounce',
            scaleAmount: 1.2,
            duration: 0.12,
        },
    },

    /**
     * Neon Glow - Glowing text effect
     * Good for: Night scenes, tech, futuristic
     */
    'neon-glow': {
        name: 'Neon Glow',
        description: 'Glowing neon text effect. Great for tech and night content.',
        keywords: ['tech', 'futuristic', 'night', 'neon', 'cyber', 'gaming'],
        style: {
            fontFamily: 'Orbitron, Montserrat, sans-serif',
            fontSize: 56,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            textColor: '#06b6d4',    // Cyan
            activeColor: '#f0abfc',  // Pink glow
            strokeWidth: 0,
            shadowColor: 'cyan',
        },
        animation: {
            type: 'scale',
            scaleAmount: 1.1,
            duration: 0.1,
        },
    },

    /**
     * Story Elegant - Soft, elegant style for stories
     * Good for: Stories, emotional content, narrative
     */
    'story-elegant': {
        name: 'Story Elegant',
        description: 'Soft, elegant style perfect for storytelling and emotional content.',
        keywords: ['story', 'emotional', 'narrative', 'calm', 'art', 'poetry', 'gentle'],
        style: {
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 52,
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: 1,
            textColor: '#FFFFFF',
            activeColor: '#fbbf24',  // Warm gold
            strokeColor: '#000000',
            strokeWidth: 2,
            shadowColor: 'rgba(0,0,0,0.5)',
        },
        animation: {
            type: 'fade',
            duration: 0.2,
        },
    },

    /**
     * Minimal Dark - Simple dark text
     * Good for: Minimalist, aesthetic, art content
     */
    'minimal-dark': {
        name: 'Minimal Dark',
        description: 'Simple dark text with subtle highlight. Clean and aesthetic.',
        keywords: ['minimal', 'aesthetic', 'art', 'simple', 'design'],
        style: {
            fontFamily: 'Helvetica Neue, Arial, sans-serif',
            fontSize: 48,
            fontWeight: 600,
            textTransform: 'none',
            textColor: '#374151',
            activeColor: '#111827',
            strokeWidth: 0,
            shadowColor: 'rgba(255,255,255,0.3)',
        },
        animation: {
            type: 'fade',
            duration: 0.15,
        },
    },
};

/**
 * Get theme by name or auto-select based on keywords
 */
export function getTheme(nameOrKeywords: string | string[]): CaptionTheme {
    // Direct name match
    if (typeof nameOrKeywords === 'string' && CAPTION_THEMES[nameOrKeywords]) {
        return CAPTION_THEMES[nameOrKeywords];
    }

    // Keyword matching
    const keywords = Array.isArray(nameOrKeywords) ? nameOrKeywords : [nameOrKeywords];
    let bestMatch: CaptionTheme | null = null;
    let bestScore = 0;

    for (const theme of Object.values(CAPTION_THEMES)) {
        const score = keywords.filter(kw =>
            theme.keywords.some(tk => tk.includes(kw.toLowerCase()) || kw.toLowerCase().includes(tk))
        ).length;

        if (score > bestScore) {
            bestScore = score;
            bestMatch = theme;
        }
    }

    // Default to gold-bold if no match
    return bestMatch || CAPTION_THEMES['gold-bold'];
}

/**
 * Get all theme names for selection
 */
export function getThemeNames(): string[] {
    return Object.keys(CAPTION_THEMES);
}

/**
 * Get theme descriptions for UI
 */
export function getThemeList(): Array<{ name: string; description: string }> {
    return Object.entries(CAPTION_THEMES).map(([key, theme]) => ({
        name: key,
        description: theme.description,
    }));
}

export default CAPTION_THEMES;
