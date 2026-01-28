import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// ============ TYPES ============
export type BrollTitleStyle = 'lower-third' | 'centered' | 'corner-badge' | 'full-screen';
export type AnimationType = 'fade' | 'slide-up' | 'slide-left' | 'typewriter' | 'scale';

export interface BrollTitleProps {
  title: string;
  subtitle?: string;
  style?: BrollTitleStyle;
  animation?: AnimationType;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontSize?: number;
  subtitleSize?: number;
  enterDuration?: number;
  exitDuration?: number;
  showAccentLine?: boolean;
}

// ============ STYLE PRESETS ============
const getStylePreset = (style: BrollTitleStyle): React.CSSProperties => {
  const presets: Record<BrollTitleStyle, React.CSSProperties> = {
    'lower-third': {
      position: 'absolute',
      bottom: 80,
      left: 60,
      maxWidth: '60%',
    },
    'centered': {
      position: 'absolute',
      top: '50%',
      left: '5%',
      right: '5%',
      transform: 'translateY(-50%)',
      display: 'flex',
      justifyContent: 'center',
    },
    'corner-badge': {
      position: 'absolute',
      top: 40,
      right: 40,
    },
    'full-screen': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
  return presets[style];
};

// ============ ANIMATION HELPERS ============
const useAnimation = (
  animation: AnimationType,
  frame: number,
  fps: number,
  durationInFrames: number,
  enterDuration: number,
  exitDuration: number
) => {
  const exitStart = durationInFrames - exitDuration;

  // Opacity (all animations have fade)
  const opacity = interpolate(
    frame,
    [0, enterDuration, exitStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  let transform = '';

  switch (animation) {
    case 'slide-up': {
      const translateY = interpolate(
        frame,
        [0, enterDuration],
        [50, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
      );
      const exitY = interpolate(
        frame,
        [exitStart, durationInFrames],
        [0, -30],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
      transform = `translateY(${frame < exitStart ? translateY : exitY}px)`;
      break;
    }
    case 'slide-left': {
      const translateX = interpolate(
        frame,
        [0, enterDuration],
        [100, 0],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
      );
      const exitX = interpolate(
        frame,
        [exitStart, durationInFrames],
        [0, -50],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
      transform = `translateX(${frame < exitStart ? translateX : exitX}px)`;
      break;
    }
    case 'scale': {
      const scale = interpolate(
        frame,
        [0, enterDuration, exitStart, durationInFrames],
        [0.8, 1, 1, 0.9],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
      );
      transform = `scale(${scale})`;
      break;
    }
    case 'fade':
    case 'typewriter':
    default:
      transform = '';
  }

  return { opacity, transform };
};

// ============ TYPEWRITER HOOK ============
const useTypewriter = (
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame: number = 0.5
): string => {
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.floor(elapsed * charsPerFrame);
  return text.slice(0, Math.min(charCount, text.length));
};

// ============ MAIN COMPONENT ============
export const BrollTitle: React.FC<BrollTitleProps> = ({
  title,
  subtitle,
  style = 'lower-third',
  animation = 'slide-up',
  backgroundColor = 'rgba(6, 182, 79, 0.85)',
  textColor = '#eb0000ff',
  accentColor = '#ffae00ff',
  fontSize = 48,
  subtitleSize = 28,
  enterDuration: enterDurationProp,
  exitDuration: exitDurationProp,
  showAccentLine = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Default durations based on fps
  const enterDuration = enterDurationProp ?? Math.round(fps * 0.4);
  const exitDuration = exitDurationProp ?? Math.round(fps * 0.3);

  // Get animation values
  const { opacity, transform } = useAnimation(
    animation,
    frame,
    fps,
    durationInFrames,
    enterDuration,
    exitDuration
  );

  // Typewriter effect
  const displayTitle = animation === 'typewriter'
    ? useTypewriter(title, frame, 0, 0.8)
    : title;
  const displaySubtitle = animation === 'typewriter' && subtitle
    ? useTypewriter(subtitle, frame, title.length / 0.8, 0.6)
    : subtitle;

  // Style preset
  const positionStyle = getStylePreset(style);

  // Container style with animation
  const containerStyle: React.CSSProperties = {
    ...positionStyle,
    opacity,
  };

  // Handle transform separately for centered style
  if (style === 'centered') {
    containerStyle.transform = `translateY(-50%) ${transform}`.trim();
  } else if (positionStyle.transform) {
    containerStyle.transform = `${positionStyle.transform} ${transform}`.trim();
  } else if (transform) {
    containerStyle.transform = transform;
  }

  // Content box style
  const contentStyle: React.CSSProperties = {
    backgroundColor,
    padding: style === 'corner-badge' ? '12px 20px' : style === 'centered' ? '40px 50px' : '16px 28px',
    borderLeft: showAccentLine && style !== 'centered' ? `4px solid ${accentColor}` : undefined,
    borderRadius: style === 'corner-badge' ? '4px' : style === 'centered' ? '16px' : undefined,
  };

  // Centered style: 40% height, centered in screen
  if (style === 'centered') {
    contentStyle.width = '100%';
    contentStyle.minHeight = '40%';
    contentStyle.display = 'flex';
    contentStyle.flexDirection = 'column';
    contentStyle.alignItems = 'center';
    contentStyle.justifyContent = 'center';
    contentStyle.textAlign = 'center';
  }

  // Full screen specific
  if (style === 'full-screen') {
    contentStyle.backgroundColor = backgroundColor;
    contentStyle.width = '100%';
    contentStyle.height = '100%';
    contentStyle.display = 'flex';
    contentStyle.flexDirection = 'column';
    contentStyle.alignItems = 'center';
    contentStyle.justifyContent = 'center';
    contentStyle.borderLeft = undefined;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
      <div style={containerStyle}>
        <div style={contentStyle}>
          <h1
            style={{
              color: textColor,
              fontSize: style === 'full-screen' ? fontSize * 1.5 : style === 'centered' ? fontSize * 1.2 : fontSize,
              fontWeight: 900,
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: style === 'full-screen' ? '0.02em' : undefined,
              lineHeight: 1.3,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {displayTitle}
            {animation === 'typewriter' && displayTitle.length < title.length && (
              <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>
            )}
          </h1>
          {subtitle && (
            <p
              style={{
                color: accentColor,
                fontSize: style === 'full-screen' ? subtitleSize * 1.3 : subtitleSize,
                fontWeight: 500,
                margin: '8px 0 0',
                fontFamily: 'Inter, system-ui, sans-serif',
                opacity: animation === 'typewriter' && displaySubtitle === '' ? 0 : 1,
              }}
            >
              {displaySubtitle || subtitle}
            </p>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default BrollTitle;
