import React from 'react';
import { Img, useCurrentFrame, interpolate, random, useVideoConfig } from 'remotion';

// [Vue: TypeScript Interface] -> Giống như định nghĩa Props trong Vue
// Trong Vue bạn có thể dùng `defineProps<ImageWithEffectProps>()`
interface ImageWithEffectProps {
    src: string;
    effect?: string; // 'zoom-in', 'ken-burns', hoặc undefined
    effectParams?: {
        direction?: 'left' | 'right' | 'up' | 'down' | 'random';
        easing?: 'ease-in-out' | 'linear' | 'ease-in' | 'ease-out';
        intensity?: number; // 0-1
        type?: string;
        fit?: 'cover' | 'contain' | 'blur-bg';
    };
    durationInFrames: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    onError?: () => void;
}

/**
 * Component để render image với animation effects
 * [Vue comparison] - Component này tương tự một SFC (Single File Component) trong Vue
 * Nhưng logic được viết trong function thay vì trong `<script setup>`
 */
export const ImageWithEffect: React.FC<ImageWithEffectProps> = ({
    src,
    effect,
    effectParams = {},
    durationInFrames,
    objectFit = 'cover',
    onError
}) => {
    // [Vue: useCurrentFrame()] -> Hook này giống như một computed property trong Vue
    // Nó tự động update khi frame thay đổi (reactive)
    const frame = useCurrentFrame();

    // Auto-detect Vertical Mode & Render Logic
    const { width, height } = useVideoConfig();
    const isVertical = height > width;

    // FORCE ENABLE Blur BG if isVertical is true
    // This allows horizontal images to look good in vertical mode without needing an explicit effect
    const { fit = 'cover' } = effectParams as any;
    const shouldUseBlurBg = isVertical || fit === 'blur-bg';

    // Default params
    const {
        direction = 'random',
        easing = 'ease-in-out',
        intensity = 0.5
    } = effectParams;

    // PRE-CALCULATE ANIMATION VALUES (Needed for both BlurBG and Normal modes)
    // Tính progress (0 -> 1) dựa trên frame hiện tại và tổng duration
    const progress = interpolate(
        frame,
        [0, durationInFrames],
        [0, 1],
        { extrapolateRight: 'clamp' } // Đảm bảo không vượt quá 1
    );

    // Xác định hướng di chuyển (cho ken-burns effect)
    let actualDirection = direction;
    if (direction === 'random') {
        const seed = random(src);
        const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
        actualDirection = directions[Math.floor(seed * directions.length)];
    }

    // Tính scale
    let scale = 1;
    if (effect === 'zoom-in') {
        scale = interpolate(progress, [0, 1], [1, 1 + (intensity * 0.3)], { extrapolateRight: 'clamp' });
    } else if (effect === 'ken-burns') {
        scale = interpolate(progress, [0, 1], [1, 1 + (intensity * 0.15)], { extrapolateRight: 'clamp' });
    }

    // Tính translate
    let translateX = 0;
    let translateY = 0;
    if (effect === 'ken-burns') {
        const maxMove = 5 * intensity;
        switch (actualDirection) {
            case 'left': translateX = interpolate(progress, [0, 1], [maxMove, -maxMove]); break;
            case 'right': translateX = interpolate(progress, [0, 1], [-maxMove, maxMove]); break;
            case 'up': translateY = interpolate(progress, [0, 1], [maxMove, -maxMove]); break;
            case 'down': translateY = interpolate(progress, [0, 1], [-maxMove, maxMove]); break;
        }
    }

    const transformStyle = `scale(${scale}) translate(${translateX}%, ${translateY}%)`.trim();

    // RENDER LOGIC PRIORITY 1: BLUR BG (For Vertical Mode)
    // This block is prioritized for ALL images in vertical mode, regardless of effect setting
    if (shouldUseBlurBg) {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                {/* Background Layer (Blurred) */}
                <div style={{
                    position: 'absolute',
                    top: -20, left: -20, right: -20, bottom: -20,
                    zIndex: 0
                }}>
                    <Img
                        src={src}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(30px) brightness(0.6)',
                            transform: 'scale(1.2)',
                        }}
                        onError={onError}
                    />
                </div>

                {/* Foreground Layer (Active Image) */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Img
                        src={src}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transform: transformStyle, // Apply animation if effect exists
                            transformOrigin: 'center center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        }}
                        onError={onError}
                    />
                </div>
            </div>
        );
    }

    // RENDER LOGIC PRIORITY 2: NO EFFECT (Normal Cover)
    // Only applied if NOT in vertical mode AND no effect is selected
    if (!effect || (effect !== 'zoom-in' && effect !== 'ken-burns')) {
        return (
            <Img
                src={src}
                style={{ width: '100%', height: '100%', objectFit }}
                onError={onError}
            />
        );
    }

    // RENDER LOGIC PRIORITY 3: HAS EFFECT (But Horizontal/Square Mode)
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit,
                    // [Vue: CSS transform] -> Giống như :style="{ transform: ... }" trong Vue
                    transform: transformStyle,
                    transformOrigin: 'center center'
                }}
                onError={onError}
            />
        </div>
    );
};
