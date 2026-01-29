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

export interface FullscreenTitleProps {
  // Nội dung
  title: string;
  subtitle?: string;

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
  size: number
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    color: textColor,
    fontSize: size,
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
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
  animateBackground = true, // Mặc định bật chuyển động nền
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

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

  // 8. Lấy styles cho Text
  const titleStyles = getTextStyles(textStyle, textColor, accentColor, scaledTitleSize);

  // Phần return tương ứng với <template> trong Vue
  return (
    <AbsoluteFill style={{ zIndex: 1000 }}>
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
      <AbsoluteFill style={alignmentStyles}>
        <div
          style={{
            opacity,
            transform,
            filter: filter || undefined,
            maxWidth: '94%',
          }}
        >
          {/* Tiêu đề chính */}
          <h1
            style={{
              ...titleStyles,
              fontFamily,
            }}
          >
            {displayTitle}
            {/* Con trỏ nhấp nháy cho typewriter */}
            {isTypewriter && displayTitle.length < title.length && (
              <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>
            )}
          </h1>

          {/* Phụ đề (nếu có) */}
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default FullscreenTitle;
