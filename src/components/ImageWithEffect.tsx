import React from 'react';
import { Img, useCurrentFrame, interpolate, random } from 'remotion';

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
    };
    durationInFrames: number;
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
    onError
}) => {
    // [Vue: useCurrentFrame()] -> Hook này giống như một computed property trong Vue
    // Nó tự động update khi frame thay đổi (reactive)
    const frame = useCurrentFrame();

    // Default params
    const {
        direction = 'random',
        easing = 'ease-in-out',
        intensity = 0.5
    } = effectParams;

    // Nếu không có effect hoặc effect không được hỗ trợ, render image bình thường
    if (!effect || (effect !== 'zoom-in' && effect !== 'ken-burns')) {
        return (
            <Img
                src={src}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={onError}
            />
        );
    }

    // Tính progress (0 -> 1) dựa trên frame hiện tại và tổng duration
    // [Vue comparison] - Đây giống như một computed property trong Vue
    // computed(() => frame / durationInFrames)
    const progress = interpolate(
        frame,
        [0, durationInFrames],
        [0, 1],
        { extrapolateRight: 'clamp' } // Đảm bảo không vượt quá 1
    );

    // Xác định hướng di chuyển (cho ken-burns effect)
    // [Vue: random seed] - random() trong Remotion có seed theo frame nên consistent
    // Khác với Math.random() trong Vue sẽ thay đổi mỗi lần re-render
    let actualDirection = direction;
    if (direction === 'random') {
        // Chọn random direction nhưng consistent cho cùng một clip
        const seed = random(src); // Dùng src làm seed để consistent
        const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];
        actualDirection = directions[Math.floor(seed * directions.length)];
    }

    // Tính scale (phóng to/nhỏ)
    // intensity càng cao thì zoom càng mạnh
    let scale = 1;

    if (effect === 'zoom-in') {
        // Zoom in: bắt đầu từ 1.0, kết thúc ở 1.0 + (intensity * 0.3)
        // Ví dụ: intensity = 0.7 -> scale từ 1.0 đến 1.21
        scale = interpolate(
            progress,
            [0, 1],
            [1, 1 + (intensity * 0.3)],
            { extrapolateRight: 'clamp' }
        );
    } else if (effect === 'ken-burns') {
        // Ken Burns: zoom nhẹ hơn, khoảng 1.0 -> 1.15
        scale = interpolate(
            progress,
            [0, 1],
            [1, 1 + (intensity * 0.15)],
            { extrapolateRight: 'clamp' }
        );
    }

    // Tính translateX và translateY (cho ken-burns effect - di chuyển camera)
    let translateX = 0;
    let translateY = 0;

    if (effect === 'ken-burns') {
        // Di chuyển tối đa 5% của kích thước (nhân với intensity)
        const maxMove = 5 * intensity;

        switch (actualDirection) {
            case 'left':
                // Di chuyển từ phải sang trái (camera pan left)
                translateX = interpolate(progress, [0, 1], [maxMove, -maxMove]);
                break;
            case 'right':
                // Di chuyển từ trái sang phải
                translateX = interpolate(progress, [0, 1], [-maxMove, maxMove]);
                break;
            case 'up':
                // Di chuyển từ dưới lên trên
                translateY = interpolate(progress, [0, 1], [maxMove, -maxMove]);
                break;
            case 'down':
                // Di chuyển từ trên xuống dưới
                translateY = interpolate(progress, [0, 1], [-maxMove, maxMove]);
                break;
        }
    }

    // Apply CSS transform
    // [Vue: :style binding] -> Trong Vue bạn sẽ dùng :style="{ transform: ... }"
    // React dùng inline style object
    const transformStyle = `
        scale(${scale}) 
        translate(${translateX}%, ${translateY}%)
    `.trim();

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden', // Quan trọng: ẩn phần ảnh bị zoom ra ngoài
                position: 'relative'
            }}
        >
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    // [Vue: CSS transform] -> Giống như :style="{ transform: ... }" trong Vue
                    transform: transformStyle,
                    // Thêm transition mượt mà (optional, Remotion đã smooth theo frame)
                    transformOrigin: 'center center'
                }}
                onError={onError}
            />
        </div>
    );
};
