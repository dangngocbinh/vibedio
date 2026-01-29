import { useCurrentFrame, interpolate } from 'remotion';

/**
 * Hook để tạo các hiệu ứng chuyển động nhẹ nhàng cho background
 * Giúp background không bị tĩnh, tạo cảm giác cao cấp (Premium feel)
 */
export const useBackgroundAnimation = (enabled: boolean = true) => {
    const frame = useCurrentFrame();

    if (!enabled) {
        return {
            gradientShift: '135deg',
            patternOffset: '0px 0px',
            scale: 1,
        };
    }

    // Xoay nhẹ gradient theo thời gian
    const rotation = interpolate(
        (frame % 300),
        [0, 300],
        [135, 145],
        { extrapolateRight: 'clamp' }
    );

    // Di chuyển pattern nhẹ nhàng (parallax effect)
    const offsetX = (frame * 0.2) % 40;
    const offsetY = (frame * 0.1) % 40;

    // Thu phóng nhẹ (breathe effect)
    const scale = interpolate(
        Math.sin(frame * 0.02),
        [-1, 1],
        [1, 1.05]
    );

    return {
        gradientShift: `${rotation}deg`,
        patternOffset: `${offsetX}px ${offsetY}px`,
        scale,
    };
};
