# Advanced B-roll Title Patterns

## 1. Data-driven Titles từ JSON

```tsx
// titles.json
[
  { "from": 30, "duration": 90, "title": "John Doe", "subtitle": "CEO" },
  { "from": 150, "duration": 60, "title": "Jane Smith", "subtitle": "CTO" },
  { "from": 300, "duration": 120, "title": "Chapter 2", "style": "centered" }
]

// Video.tsx
import titlesData from './titles.json';
import { BrollTitle, BrollTitleProps } from './components/BrollTitle';

export const Video: React.FC = () => {
  return (
    <AbsoluteFill>
      <MainContent />
      {titlesData.map((item, index) => (
        <Sequence key={index} from={item.from} durationInFrames={item.duration}>
          <BrollTitle
            title={item.title}
            subtitle={item.subtitle}
            style={item.style || 'lower-third'}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

## 2. Dynamic Positioning theo Video Content

```tsx
interface DynamicTitleProps extends BrollTitleProps {
  position: { x: number; y: number };
  anchor?: 'top-left' | 'center' | 'bottom-right';
}

export const DynamicTitle: React.FC<DynamicTitleProps> = ({
  position,
  anchor = 'top-left',
  ...props
}) => {
  const anchorTransform = {
    'top-left': 'translate(0, 0)',
    'center': 'translate(-50%, -50%)',
    'bottom-right': 'translate(-100%, -100%)',
  };

  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: anchorTransform[anchor],
      }}>
        <BrollTitle {...props} />
      </div>
    </AbsoluteFill>
  );
};
```

## 3. Spring Animations với Physics

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SpringTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Enter spring
  const enterSpring = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    },
  });

  // Exit spring
  const exitSpring = spring({
    frame: frame - (durationInFrames - fps * 0.5),
    fps,
    config: {
      damping: 15,
      stiffness: 150,
    },
  });

  const isExiting = frame > durationInFrames - fps * 0.5;
  const scale = isExiting ? 1 - exitSpring * 0.3 : 0.8 + enterSpring * 0.2;
  const opacity = isExiting ? 1 - exitSpring : enterSpring;
  const y = isExiting ? exitSpring * -30 : (1 - enterSpring) * 50;

  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px) scale(${scale})`,
    }}>
      {title}
    </div>
  );
};
```

## 4. Responsive Scaling theo Video Size

```tsx
import { useVideoConfig } from 'remotion';

export const ResponsiveTitle: React.FC<BrollTitleProps> = (props) => {
  const { width, height } = useVideoConfig();
  
  // Base size at 1920x1080
  const baseWidth = 1920;
  const scaleFactor = width / baseWidth;
  
  const responsiveProps = {
    ...props,
    fontSize: (props.fontSize || 36) * scaleFactor,
    subtitleSize: (props.subtitleSize || 18) * scaleFactor,
  };

  return <BrollTitle {...responsiveProps} />;
};
```

## 5. Multi-line với Line-by-line Animation

```tsx
export const MultiLineTitle: React.FC<{
  lines: string[];
  staggerFrames?: number;
}> = ({ lines, staggerFrames = 10 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div>
      {lines.map((line, index) => {
        const lineStart = index * staggerFrames;
        const opacity = interpolate(
          frame,
          [lineStart, lineStart + fps * 0.3],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const translateY = interpolate(
          frame,
          [lineStart, lineStart + fps * 0.3],
          [20, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div key={index} style={{ opacity, transform: `translateY(${translateY}px)` }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};
```

## 6. Track Manager cho Multiple Overlays

```tsx
interface TitleTrack {
  id: string;
  from: number;
  duration: number;
  props: BrollTitleProps;
  zIndex?: number;
}

interface TrackManagerProps {
  tracks: TitleTrack[];
}

export const TrackManager: React.FC<TrackManagerProps> = ({ tracks }) => {
  // Sort by zIndex
  const sortedTracks = [...tracks].sort((a, b) => 
    (a.zIndex || 0) - (b.zIndex || 0)
  );

  return (
    <>
      {sortedTracks.map((track) => (
        <Sequence
          key={track.id}
          from={track.from}
          durationInFrames={track.duration}
        >
          <BrollTitle {...track.props} />
        </Sequence>
      ))}
    </>
  );
};

// Usage:
const tracks: TitleTrack[] = [
  {
    id: 'speaker-1',
    from: 30,
    duration: 90,
    props: { title: 'John', subtitle: 'CEO', style: 'lower-third' },
    zIndex: 1,
  },
  {
    id: 'live-badge',
    from: 0,
    duration: 300,
    props: { title: 'LIVE', style: 'corner-badge' },
    zIndex: 2,
  },
];

<TrackManager tracks={tracks} />
```

## 7. CSV Import cho Batch Titles

```tsx
import Papa from 'papaparse';

// CSV format:
// from,duration,title,subtitle,style
// 30,90,John Doe,CEO,lower-third
// 150,60,Jane Smith,CTO,lower-third

const loadTitlesFromCSV = async (csvPath: string) => {
  const response = await fetch(csvPath);
  const text = await response.text();
  const { data } = Papa.parse(text, { header: true });
  
  return data.map((row: any) => ({
    from: parseInt(row.from),
    duration: parseInt(row.duration),
    title: row.title,
    subtitle: row.subtitle,
    style: row.style,
  }));
};
```

## 8. Animated Background Effects

```tsx
export const TitleWithGlow: React.FC<BrollTitleProps> = (props) => {
  const frame = useCurrentFrame();
  const pulseOpacity = 0.5 + Math.sin(frame * 0.1) * 0.2;

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow layer */}
      <div style={{
        position: 'absolute',
        inset: -20,
        background: props.accentColor,
        filter: 'blur(30px)',
        opacity: pulseOpacity,
      }} />
      {/* Title */}
      <BrollTitle {...props} />
    </div>
  );
};
```
