# Remotion Best Practices

## Đã áp dụng trong project này

### ✅ 1. Sử dụng `staticFile()` cho local assets

**Đúng:**
```typescript
import { staticFile } from 'remotion';

const audioUrl = staticFile('audio/sample.mp3');
const imageUrl = staticFile('images/background.jpg');
```

**Sai:**
```typescript
// ❌ Không dùng đường dẫn tuyệt đối
const audioUrl = 'public/audio/sample.mp3';
const audioUrl = '/audio/sample.mp3';
```

**Lý do**: `staticFile()` đảm bảo paths hoạt động đúng trong mọi môi trường (dev, render, server).

---

### ✅ 2. KHÔNG dùng CSS transitions/animations

**Đúng:**
```typescript
// Dùng interpolate() cho mọi animation
const scale = interpolate(
  currentTime,
  [0, 1],
  [1, 1.5],
  { extrapolateRight: 'clamp' }
);

<div style={{ transform: `scale(${scale})` }}>
```

**Sai:**
```typescript
// ❌ CSS transition không hoạt động trong Remotion
<div style={{
  transform: `scale(${scale})`,
  transition: 'all 0.3s ease' // ❌ Không có hiệu ứng!
}}>
```

**Lý do**: Remotion render từng frame tĩnh, CSS transitions cần browser runtime.

---

### ✅ 3. Sử dụng hooks đúng cách

**Core hooks:**
```typescript
import { useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame(); // Frame hiện tại (0, 1, 2, ...)
const { fps, width, height, durationInFrames } = useVideoConfig();

// Convert frame → seconds
const currentTime = frame / fps;
```

**Đúng:**
```typescript
// Tính toán dựa trên frame/fps
const opacity = interpolate(frame, [0, 30], [0, 1]);
```

**Sai:**
```typescript
// ❌ Không dùng setTimeout, setInterval, requestAnimationFrame
setTimeout(() => {}, 1000); // ❌ Không hoạt động!
```

---

### ✅ 4. Cấu trúc Composition đúng

**Đúng:**
```typescript
<Composition
  id="MyVideo"
  component={MyComponent}
  durationInFrames={300}
  fps={30}
  width={1920}
  height={1080}
  schema={zodSchema} // ✅ Phải là Zod schema
  defaultProps={myProps}
/>
```

**Sai:**
```typescript
<Composition
  schema={{
    text: { type: 'string' } // ❌ Phải dùng Zod!
  }}
/>
```

---

### ✅ 5. Zod Schema cho props

**Đúng:**
```typescript
import { z } from 'zod';

const schema = z.object({
  text: z.string(),
  fontSize: z.number().min(12).max(120),
  color: z.string(),
  position: z.enum(['top', 'center', 'bottom']),
});
```

**Lý do**: Remotion Studio cần Zod schema để tạo UI controls.

---

### ✅ 6. Sequences và timeline management

**Đúng:**
```typescript
{scenes.map((scene, i) => {
  const startFrame = Math.floor(scene.startTime * fps);
  const duration = Math.floor((scene.endTime - scene.startTime) * fps);

  return (
    <Sequence
      key={`scene-${i}`}
      from={startFrame}
      durationInFrames={duration}
    >
      <SceneComponent {...scene} />
    </Sequence>
  );
})}
```

**Tips:**
- Sequences có thể overlap (layering)
- Dùng `from` để control timing
- `durationInFrames` optional nếu muốn chạy đến hết video

---

### ✅ 7. Interpolation best practices

**Extrapolation:**
```typescript
// Clamp để tránh vượt bounds
const scale = interpolate(
  progress,
  [0, 1],
  [1, 2],
  {
    extrapolateLeft: 'clamp',  // Giữ nguyên giá trị đầu nếu < 0
    extrapolateRight: 'clamp', // Giữ nguyên giá trị cuối nếu > 1
  }
);
```

**Spring animations:**
```typescript
import { spring } from 'remotion';

const scale = spring({
  frame,
  fps,
  config: {
    damping: 100,
    stiffness: 200,
    mass: 0.5,
  },
});
```

---

### ✅ 8. Performance optimization

**Image optimization:**
```typescript
// Pre-size images trước khi dùng
// Tránh dùng ảnh quá lớn (>2MB)

// Dùng Img component từ Remotion
import { Img } from 'remotion';

<Img src={staticFile('images/optimized.jpg')} />
```

**Lazy calculations:**
```typescript
// Chỉ tính khi cần
const activeWord = useMemo(() => {
  return words.find(w =>
    currentTime >= w.start && currentTime <= w.end
  );
}, [currentTime, words]);
```

---

### ✅ 9. Audio handling

**Đúng:**
```typescript
import { Audio, staticFile } from 'remotion';

<Audio
  src={staticFile('audio/voice.mp3')}
  startFrom={0}
  volume={1}
/>
```

**Multiple audio tracks:**
```typescript
<>
  <Audio src={staticFile('audio/voice.mp3')} />
  <Audio
    src={staticFile('audio/background-music.mp3')}
    volume={0.2} // Background ở volume thấp
  />
</>
```

---

### ✅ 10. Async data và delayRender()

**Khi fetch data:**
```typescript
import { continueRender, delayRender } from 'remotion';
import { useEffect, useState } from 'react';

export const MyComp: React.FC = () => {
  const [handle] = useState(() => delayRender());
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        continueRender(handle);
      });
  }, [handle]);

  if (!data) return null;

  return <div>{/* Render with data */}</div>;
};
```

**Lý do**: Remotion cần biết khi nào data ready để bắt đầu render.

---

### ✅ 11. AbsoluteFill usage

**Đúng:**
```typescript
import { AbsoluteFill } from 'remotion';

// Layer backgrounds
<AbsoluteFill style={{ backgroundColor: '#000' }}>
  <AbsoluteFill style={{ opacity: 0.5 }}>
    <Img src={background} />
  </AbsoluteFill>
  <AbsoluteFill>
    <Content />
  </AbsoluteFill>
</AbsoluteFill>
```

**Lý do**: `AbsoluteFill` = `position: absolute; top: 0; left: 0; right: 0; bottom: 0;`

---

### ✅ 12. Key props cho dynamic lists

**Đúng:**
```typescript
{words.map((word, index) => (
  <Word
    key={`${word.text}-${word.start}-${index}`} // ✅ Unique key
    {...word}
  />
))}
```

**Sai:**
```typescript
{words.map((word, index) => (
  <Word key={index} {...word} /> // ❌ Index không stable
))}
```

---

### ✅ 13. Testing trong Studio

**Development workflow:**
```bash
# 1. Start Studio
npm start

# 2. Edit code
# 3. Hot reload tự động

# 4. Test render một frame
remotion still AutoVideo out.png --frame=150

# 5. Render full video
remotion render AutoVideo out.mp4
```

---

### ✅ 14. Error handling

**Graceful fallbacks:**
```typescript
export const MyComp: React.FC<Props> = ({ imageUrl }) => {
  const [error, setError] = useState(false);

  if (error || !imageUrl) {
    return (
      <AbsoluteFill style={{ background: '#333' }}>
        <div>Fallback content</div>
      </AbsoluteFill>
    );
  }

  return (
    <Img
      src={imageUrl}
      onError={() => setError(true)}
    />
  );
};
```

---

### ✅ 15. TypeScript types

**Props typing:**
```typescript
interface MyComponentProps {
  text: string;
  duration: number;
  style: React.CSSProperties;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  text,
  duration,
  style,
}) => {
  // Type-safe!
};
```

---

## Checklist trước khi render

- [ ] Tất cả assets dùng `staticFile()`
- [ ] Không có CSS transitions
- [ ] Zod schema đúng format
- [ ] Keys unique cho lists
- [ ] Images đã optimize
- [ ] Audio volumes cân bằng
- [ ] Test ở nhiều frames khác nhau
- [ ] Props có default values hợp lý
- [ ] Error handling cho external resources
- [ ] Performance: không có heavy calculations trong render

---

## Resources

- [Remotion Docs](https://remotion.dev/docs)
- [Remotion API Reference](https://remotion.dev/docs/api)
- [Example Projects](https://github.com/remotion-dev/remotion)
- [Discord Community](https://remotion.dev/discord)

---

## Project này đã tuân thủ:

✅ staticFile() cho audio/images
✅ Không dùng CSS transitions
✅ Zod schemas cho props
✅ Proper interpolation với clamp
✅ useCurrentFrame/useVideoConfig
✅ Sequence timeline management
✅ AbsoluteFill layering
✅ TypeScript typing đầy đủ
✅ Error handling cơ bản
✅ Performance optimization

Codebase đã sẵn sàng cho production! 🚀
