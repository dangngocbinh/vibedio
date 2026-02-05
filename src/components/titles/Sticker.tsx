import React, { useMemo } from 'react';
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
export type StickerStyle =
    | 'center'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-left'
    | 'top-right'
    | 'random'
    | 'custom';

export type StickerAnimation =
    | 'pop'
    | 'fade'
    | 'shake'
    | 'rotate'
    | 'slide-up'
    | 'slide-down'
    | 'elastic';

// ============ TEMPLATES ============
const stickerTemplates: Record<string, string> = {
    // --- LOTTIE ANIMATED (NEW 60+) ---
    // Using Noto Emoji Lottie (Stable & High Quality)
    'lottie-heart-eyes': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/lottie.json',
    'lottie-laughing': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/lottie.json',
    'lottie-party': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/lottie.json',
    'lottie-rocket': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/lottie.json',
    'lottie-fire': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json',
    'lottie-stars': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/lottie.json',
    'lottie-thinking': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/lottie.json',
    'lottie-mind-blown': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/lottie.json',
    'lottie-sweat': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f605/lottie.json',
    'lottie-cool': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/lottie.json',
    'lottie-cry': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/lottie.json',
    'lottie-angry': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/lottie.json',
    'lottie-hug': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/lottie.json',
    'lottie-sleep': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/lottie.json',
    'lottie-wink': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/lottie.json',
    'lottie-kiss': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/lottie.json',
    'lottie-fear': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/lottie.json',
    'lottie-shush': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92b/lottie.json',
    'lottie-drool': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f924/lottie.json',
    'lottie-money': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f911/lottie.json',
    'lottie-nerd': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f913/lottie.json',
    'lottie-ghost': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/lottie.json',
    'lottie-alien': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/lottie.json',
    'lottie-robot': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/lottie.json',
    'lottie-cat': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63a/lottie.json',
    'lottie-dog': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/lottie.json',
    'lottie-unicorn': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/lottie.json',
    'lottie-target': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/lottie.json',
    'lottie-bulb': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/lottie.json',
    'lottie-medal': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/lottie.json',
    'lottie-trophy': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/lottie.json',
    'lottie-clapper': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/lottie.json',
    'lottie-controller': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/lottie.json',
    'lottie-pizza': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/lottie.json',
    'lottie-burger': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f354/lottie.json',
    'lottie-coffee': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/lottie.json',
    'lottie-cake': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f382/lottie.json',
    'lottie-balloon': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f388/lottie.json',
    'lottie-gift': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f381/lottie.json',
    'lottie-sun': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2600_fe0f/lottie.json',
    'lottie-moon': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f319/lottie.json',
    'lottie-rainbow': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f308/lottie.json',
    'lottie-sparkles': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/lottie.json',
    'lottie-check': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/lottie.json',
    'lottie-cross': 'https://fonts.gstatic.com/s/e/notoemoji/latest/274c/lottie.json',
    'lottie-warning': 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a0_fe0f/lottie.json',
    'lottie-hundred': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/lottie.json',
    'lottie-thumbs-up': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/lottie.json',
    'lottie-thumbs-down': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e/lottie.json',
    'lottie-clap': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/lottie.json',
    'lottie-peace': 'https://fonts.gstatic.com/s/e/notoemoji/latest/270c_fe0f/lottie.json',
    'lottie-ok': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44c/lottie.json',
    'lottie-muscle': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/lottie.json',
    'lottie-wave': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/lottie.json',
    'lottie-pray': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/lottie.json',
    'lottie-heart-red': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json',
    'lottie-heart-broken': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/lottie.json',
    'lottie-heart-blue': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f499/lottie.json',
    'lottie-crown': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/lottie.json',
    'lottie-gem': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/lottie.json',
    'lottie-diamond': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a0/lottie.json',

    // --- STATIC WEBP (OLD) ---
    // --- FACES & EMOTIONS ---
    'face-heart-eyes': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp',
    'face-laughing': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp',
    'face-wow': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/512.webp',
    'face-crying': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/512.webp',
    'face-angry': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.webp',
    'face-cool': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp',
    'face-thinking': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp',
    'face-mind-blown': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp',
    'face-partying': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp',
    'face-sweating': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f605/512.webp',
    'face-clown': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f921/512.webp',
    'face-scared': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/512.webp',
    'face-sleepy': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/512.webp',
    'face-devil': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47f/512.webp',
    'face-ghost': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.webp',

    // --- HEARTS & LOVE ---
    'heart-red': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp',
    'heart-broken': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/512.webp',
    'heart-fire': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f_200d_1f525/512.webp',
    'heart-sparkle': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.webp',
    'heart-blue': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f499/512.webp',

    // --- SOCIAL & REACTION ---
    'like-thumb': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp',
    'dislike-thumb': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e/512.webp',
    'clap': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp',
    'fire': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp',
    'hundred': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp',
    'check-mark': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.webp',
    'warning': 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a0_fe0f/512.webp',
    'money-bag': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b0/512.webp',
    'rocket': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp',
    'trophy': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.webp',

    // --- NATURE & WEATHER ---
    'sun': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2600_fe0f/512.webp',
    'moon': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f319/512.webp',
    'cloud-rain': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f327_fe0f/512.webp',
    'lightning': 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.webp',
    'rainbow': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f308/512.webp',
    'sparkles': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp',
    'flower-cherry': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f338/512.webp',
    'tree-palm': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f334/512.webp',

    // --- CELEBRATION & FOOD ---
    'pizza': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/512.webp',
    'burger': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f354/512.webp',
    'coffee': 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.webp',
    'beer': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f37a/512.webp',
    'cake': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f382/512.webp',
    'confetti-ball': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f38a/512.webp',
    'balloon': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f388/512.webp',
    'gift': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f381/512.webp',

    // --- SYMBOLS & OBJECTS ---
    'target': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.webp',
    'bulb': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/512.webp',
    'magnifier': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f50d/512.webp',
    'controller': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.webp',
    'megaphone': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4e3/512.webp',
    'medal-gold': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/512.webp',

    // --- ANIMALS ---
    'cat-smile': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63a/512.webp',
    'dog-face': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/512.webp',
    'unicorn': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.webp',
    'alien': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.webp',
    'robot': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.webp',
    'monkey-no-see': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp',
    'monkey-no-hear': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.webp',
    'monkey-no-speak': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.webp',

    // --- HANDS & GESTURES ---
    'hand-peace': 'https://fonts.gstatic.com/s/e/notoemoji/latest/270c_fe0f/512.webp',
    'hand-rock': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f918/512.webp',
    'hand-ok': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44c/512.webp',
    'hand-muscle': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.webp',
    'hand-wave': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp',
    'hand-pray': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp',
    'hand-pointed-up': 'https://fonts.gstatic.com/s/e/notoemoji/latest/261d_fe0f/512.webp',
    'hand-fist': 'https://fonts.gstatic.com/s/e/notoemoji/latest/270a/512.webp',

    // --- ACTIVITIES & SPORT ---
    'gold-cup': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.webp',
    'soccer-ball': 'https://fonts.gstatic.com/s/e/notoemoji/latest/26bd/512.webp',
    'basketball': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c0/512.webp',
    'video-game': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.webp',
    'microphone': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a4/512.webp',
    'painting': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a8/512.webp',
    'movie-clapper': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/512.webp',

    // --- RANDOM & CUTE ---
    'sparkling-heart': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.webp',
    'lucky-cat': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63a/512.webp',
    'potted-plant': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fab4/512.webp',
    'diamond': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.webp',
    'bomb': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a3/512.webp',
    'poop': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a9/512.webp',
    'money-wings': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b8/512.webp',
    'gem-stone': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.webp',

    // --- MORE FACES ---
    'face-zipper': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f910/512.webp',
    'face-nerd': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f913/512.webp',
    'face-mask': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f637/512.webp',
    'face-shush': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92b/512.webp',
    'face-drool': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f924/512.webp',
    'face-lying': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f925/512.webp',
    'face-vomit': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92e/512.webp',
    'face-money': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f911/512.webp',
    'skull': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.webp',
    'zombie': 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9df/512.webp',
};

export interface StickerProps {
    src?: string;                // URL hoặc đường dẫn local
    emoji?: string;             // Emoji character hoặc template name
    template?: string;          // Tên mẫu (like, heart, fire...)
    style?: StickerStyle;       // Vị trí định sẵn
    top?: number | string;      // Vị trí tùy chỉnh (nếu style='custom')
    left?: number | string;     // Vị trí tùy chỉnh (nếu style='custom')
    right?: number | string;    // Vị trí tùy chỉnh (nếu style='custom')
    bottom?: number | string;   // Vị trí tùy chỉnh (nếu style='custom')
    width?: number | string;    // Chiều rộng (mặc định: auto hoặc 300px)
    height?: number | string;   // Chiều cao (mặc định: auto)
    animation?: StickerAnimation; // Hiệu ứng xuất hiện
    enterDuration?: number;     // Thời gian animation vào (frames)
    exitDuration?: number;      // Thời gian animation ra (frames)
    rotation?: number;          // Góc xoay tĩnh (độ)
    scale?: number;             // Tỉ lệ scale gốc (mặc định: 1)
}

// ============ UTILS ============
// Hàm tính vị trí ngẫu nhiên cho style='random'
const getRandomPosition = (seed: string) => {
    const rTop = random(`top-${seed}`) * 60 + 20; // 20% -> 80%
    const rLeft = random(`left-${seed}`) * 60 + 20; // 20% -> 80%
    const rRotation = random(`rot-${seed}`) * 30 - 15; // -15 -> 15 deg
    return { top: `${rTop}%`, left: `${rLeft}%`, rotation: rRotation };
};

// ============ ANIMATION HELPERS ============
const useStickerAnimation = (
    animation: StickerAnimation,
    frame: number,
    fps: number,
    durationInFrames: number,
    enterDuration: number,
    exitDuration: number
) => {
    const exitStart = durationInFrames - exitDuration;

    // Opacity (fade in/out cho tất cả) - Safe interpolation
    let opacity = 1;
    if (enterDuration > 0 || exitDuration > 0) {
        const ranges = [0];
        const values = [0];
        if (enterDuration > 0) {
            ranges.push(enterDuration);
            values.push(1);
        } else {
            values[0] = 1;
        }
        if (exitDuration > 0) {
            ranges.push(exitStart);
            values.push(1);
            ranges.push(durationInFrames);
            values.push(0);
        } else {
            ranges.push(durationInFrames);
            values.push(1);
        }

        if (ranges.length > 1 && ranges[ranges.length - 1] > ranges[0]) {
            opacity = interpolate(frame, ranges, values, { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        }
    }

    let transform = '';

    switch (animation) {
        case 'pop': {
            const scale = spring({
                frame,
                fps,
                config: { stiffness: 200, damping: 10 },
                durationInFrames: enterDuration
            });
            const exitScale = interpolate(
                frame,
                [exitStart, durationInFrames],
                [1, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            // Sử dụng scale cho enter, exitScale cho exit
            const currentScale = frame < exitStart ? scale : exitScale;
            transform = `scale(${currentScale})`;
            break;
        }
        case 'slide-up': {
            const translateY = interpolate(
                frame,
                [0, enterDuration],
                [100, 0],
                { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
            );
            const exitY = interpolate(
                frame,
                [exitStart, durationInFrames],
                [0, 100],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            transform = `translateY(${frame < exitStart ? translateY : exitY}%)`;
            break;
        }
        case 'slide-down': {
            const translateY = interpolate(
                frame,
                [0, enterDuration],
                [-100, 0],
                { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
            );
            const exitY = interpolate(
                frame,
                [exitStart, durationInFrames],
                [0, -100],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            transform = `translateY(${frame < exitStart ? translateY : exitY}%)`;
            break;
        }
        case 'rotate': {
            const rot = interpolate(
                frame,
                [0, enterDuration],
                [-180, 0],
                { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5)) }
            );
            const scale = interpolate(frame, [0, enterDuration], [0, 1], { extrapolateRight: 'clamp' });
            transform = `rotate(${rot}deg) scale(${scale})`;
            if (frame >= exitStart) {
                const exitScale = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
                transform = `scale(${exitScale})`;
            }
            break;
        }
        case 'elastic': {
            const scale = spring({
                frame,
                fps,
                config: { stiffness: 300, damping: 10, mass: 0.5 },
            });
            const exitScale = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateRight: 'clamp' });
            transform = `scale(${frame < exitStart ? scale : exitScale})`;
            break;
        }
        case 'shake': {
            const shake = Math.sin(frame * 0.5) * 10 * (1 - frame / durationInFrames); // Giảm dần độ rung
            const scale = interpolate(frame, [0, enterDuration], [0, 1], { extrapolateRight: 'clamp' });

            transform = `rotate(${shake}deg) scale(${frame < exitStart ? scale : interpolate(frame, [exitStart, durationInFrames], [1, 0])})`;
            break;
        }
        case 'fade':
        default:
            transform = 'scale(1)'; // Placeholder
            break;
    }

    return { opacity, transform };
};

// ============ MAIN COMPONENT ============
export const Sticker: React.FC<StickerProps> = ({
    src: srcProp,
    emoji,
    template,
    style = 'random',
    top,
    left,
    right,
    bottom,
    width = 300,
    height,
    animation = 'pop',
    enterDuration: enterDurationProp,
    exitDuration: exitDurationProp,
    rotation = 0,
    scale: baseScale = 1,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const { scalePixel, uniformScale, isPortrait } = useResponsiveScale();

    // Scale width/height responsively
    const scaledWidth = typeof width === 'number' ? scalePixel(width) : width;
    const scaledHeight = typeof height === 'number' ? scalePixel(height) : height;

    // mapping emoji shortcut to template name
    const emojiMap: Record<string, string> = {
        '🎬': 'lottie-clapper',
        '🎬\ufe0f': 'lottie-clapper',
        '✨': 'lottie-sparkles',
        '✨\ufe0f': 'lottie-sparkles',
        '🎥': 'lottie-clapper', // Fallback
        '🔥': 'lottie-fire',
        '❤️': 'lottie-heart-red',
        '🚀': 'lottie-rocket',
        '💡': 'lottie-bulb',
        '✅': 'lottie-check',
        '❌': 'lottie-cross',
        '⚠️': 'lottie-warning',
        '💯': 'lottie-hundred',
    };

    // Resolve template priority: 
    // 1. template prop
    // 2. emoji mapping if it's a known char
    // 3. emoji if it's already a template name (like 'lottie-clapper')
    const effectiveTemplate = template || emojiMap[emoji || ''] || (emoji && stickerTemplates[emoji] ? emoji : null);

    // Resolve source
    const src = effectiveTemplate ? stickerTemplates[effectiveTemplate] : srcProp;

    // Animation timings
    const enterDuration = enterDurationProp ?? Math.round(fps * 0.5);
    const exitDuration = exitDurationProp ?? Math.round(fps * 0.3);

    // Get animation
    const { opacity, transform: animTransform } = useStickerAnimation(
        animation,
        frame,
        fps,
        durationInFrames,
        enterDuration,
        exitDuration
    );

    // Determine positions
    let posStyle: React.CSSProperties = { position: 'absolute' };
    let baseRotation = rotation;

    const seedVal = src || emoji || 'default';

    if (style === 'random') {
        const randomPos = getRandomPosition(seedVal);
        posStyle.top = randomPos.top;
        posStyle.left = randomPos.left;
        baseRotation += randomPos.rotation;
    } else if (style === 'custom') {
        if (top !== undefined) posStyle.top = top;
        if (left !== undefined) posStyle.left = left;
        if (right !== undefined) posStyle.right = right;
        if (bottom !== undefined) posStyle.bottom = bottom;
    } else {
        // Preset styles with responsive scaling
        switch (style) {
            case 'center':
                posStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                break;
            case 'bottom-left':
                posStyle = { bottom: scalePixel(50), left: scalePixel(50) };
                break;
            case 'bottom-right':
                posStyle = { bottom: scalePixel(50), right: scalePixel(50) };
                break;
            case 'top-left':
                posStyle = { top: scalePixel(50), left: scalePixel(50) };
                break;
            case 'top-right':
                posStyle = { top: scalePixel(50), right: scalePixel(50) };
                break;
        }
    }

    // Combine transforms
    const combinedTransform = [
        posStyle.transform,
        `rotate(${baseRotation}deg)`,
        `scale(${baseScale})`,
        animTransform
    ].filter(Boolean).join(' ');

    const isLottie = src?.toLowerCase().endsWith('.json');
    const [lottieData, setLottieData] = React.useState<LottieAnimationData | null>(null);
    const [fetchError, setFetchError] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (isLottie && src) {
            setFetchError(false);
            console.log(`[Sticker Debug] Fetching Lottie for: ${effectiveTemplate} from ${src}`);
            fetch(src)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log(`[Sticker Debug] Lottie loaded: ${effectiveTemplate}`);
                    setLottieData(data);
                })
                .catch(err => {
                    console.error(`[Sticker Debug] Failed to load lottie: ${src}`, err);
                    setFetchError(true);
                });
        }
    }, [src, isLottie, effectiveTemplate]);

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    ...posStyle,
                    width: scaledWidth,
                    height: scaledHeight ?? 'auto',
                    opacity,
                    transform: combinedTransform,
                    transformOrigin: 'center center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 200,
                }}
            >
                {isLottie && !fetchError ? (
                    lottieData ? (
                        <Lottie
                            animationData={lottieData}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    ) : (
                        // Placeholder while loading or showing the emoji character
                        <div style={{
                            fontSize: typeof width === 'number' ? scalePixel(width * 0.8) : '100px',
                            filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))'
                        }}>
                            {emoji}
                        </div>
                    )
                ) : src && !isLottie ? (
                    <Img
                        src={src}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))'
                        }}
                    />
                ) : emoji ? (
                    <div style={{
                        fontSize: typeof width === 'number' ? scalePixel(width * 0.8) : '100px',
                        filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.3))'
                    }}>
                        {emoji}
                    </div>
                ) : (
                    <Img
                        src={stickerTemplates['face-laughing']}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};
