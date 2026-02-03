import { useVideoConfig } from 'remotion';

/**
 * Hook để tính toán scale factor responsive cho các component
 * dựa trên kích thước video hiện tại
 * 
 * @returns Object chứa các thông tin và utility functions
 */
export const useResponsiveScale = () => {
    const { width, height } = useVideoConfig();

    // Base design dimensions (reference: landscape 1920x1080)
    const BASE_WIDTH = 1920;
    const BASE_HEIGHT = 1080;

    // Calculate aspect ratios
    const aspectRatio = width / height;
    const isLandscape = aspectRatio > 1;
    const isPortrait = aspectRatio < 1;
    const isSquare = Math.abs(aspectRatio - 1) < 0.1;

    // Scale factors based on width/height proportion to base
    const widthScale = width / BASE_WIDTH;
    const heightScale = height / BASE_HEIGHT;

    // Use minimum scale to ensure content fits
    const minScale = Math.min(widthScale, heightScale);

    // Uniform scale - good for most text/buttons
    const uniformScale = minScale;

    /**
     * Scale a pixel value proportionally
     * @param baseValue - The original pixel value (designed for 1920x1080)
     * @param mode - 'width' | 'height' | 'min' | 'max'
     */
    const scalePixel = (baseValue: number, mode: 'width' | 'height' | 'min' | 'max' = 'min'): number => {
        switch (mode) {
            case 'width':
                return baseValue * widthScale;
            case 'height':
                return baseValue * heightScale;
            case 'min':
                return baseValue * minScale;
            case 'max':
                return baseValue * Math.max(widthScale, heightScale);
            default:
                return baseValue * minScale;
        }
    };

    /**
     * Scale font size responsively with aspect ratio multipliers
     */
    const scaleFontSize = (baseFontSize: number): number => {
        // Xác định loại aspect ratio
        const isVertical = aspectRatio < 0.75; // 9:16, 4:5
        const isSquareAspect = aspectRatio >= 0.75 && aspectRatio <= 1.25; // 1:1
        const isHorizontal = aspectRatio > 1.25; // 16:9

        let baseScaleFactor: number;
        let fontSizeMultiplier: number;

        if (isVertical) {
            // Vertical: Scale theo width
            baseScaleFactor = width / 1080;
            fontSizeMultiplier = aspectRatio < 0.7 ? 0.7 : 0.8; // 9:16 nhỏ hơn 4:5
        } else if (isSquareAspect) {
            // Square: Scale theo dimension nhỏ nhất
            baseScaleFactor = Math.min(width / 1080, height / 1080);
            fontSizeMultiplier = 0.85;
        } else {
            // Horizontal: Scale theo height
            baseScaleFactor = height / 1080;
            fontSizeMultiplier = 1.0;
        }

        return baseFontSize * baseScaleFactor * fontSizeMultiplier;
    };

    /**
     * Get responsive position values
     * Returns pixel values scaled to current dimensions
     */
    const getResponsivePosition = (position: {
        top?: number;
        left?: number;
        right?: number;
        bottom?: number;
    }) => {
        return {
            top: position.top !== undefined ? scalePixel(position.top) : undefined,
            left: position.left !== undefined ? scalePixel(position.left) : undefined,
            right: position.right !== undefined ? scalePixel(position.right) : undefined,
            bottom: position.bottom !== undefined ? scalePixel(position.bottom) : undefined,
        };
    };

    /**
     * Get position as percentage of video dimensions
     * More reliable for responsive layouts
     */
    const getPercentPosition = (position: {
        topPercent?: number;
        leftPercent?: number;
        rightPercent?: number;
        bottomPercent?: number;
    }) => {
        return {
            top: position.topPercent !== undefined ? `${position.topPercent}%` : undefined,
            left: position.leftPercent !== undefined ? `${position.leftPercent}%` : undefined,
            right: position.rightPercent !== undefined ? `${position.rightPercent}%` : undefined,
            bottom: position.bottomPercent !== undefined ? `${position.bottomPercent}%` : undefined,
        };
    };

    /**
     * Get layout hints for different aspect ratios
     */
    const getLayoutHints = () => {
        if (isPortrait) {
            return {
                preferVerticalStack: true,
                maxContentWidth: '95%',
                safeAreaPadding: scalePixel(40),
                recommendedPosition: 'bottom-center',
            };
        }
        if (isSquare) {
            return {
                preferVerticalStack: false,
                maxContentWidth: '90%',
                safeAreaPadding: scalePixel(60),
                recommendedPosition: 'bottom-left',
            };
        }
        // Landscape
        return {
            preferVerticalStack: false,
            maxContentWidth: '60%',
            safeAreaPadding: scalePixel(80),
            recommendedPosition: 'lower-third',
        };
    };

    return {
        // Raw config values
        width,
        height,
        aspectRatio,

        // Orientation flags
        isLandscape,
        isPortrait,
        isSquare,

        // Scale factors
        widthScale,
        heightScale,
        uniformScale,
        minScale,

        // Utility functions
        scalePixel,
        scaleFontSize,
        getResponsivePosition,
        getPercentPosition,
        getLayoutHints,
    };
};

export default useResponsiveScale;
