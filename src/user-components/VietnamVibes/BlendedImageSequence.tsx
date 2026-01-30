import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { fadingMaskStyle } from './styles';

// VUE COMPARISON:
// Props in React are typed interfaces.
interface BlendedImageSequenceProps {
    images: string[];
    durationPerImage: number; // in frames
    transitionDuration: number; // in frames
}

export const BlendedImageSequence: React.FC<BlendedImageSequenceProps> = ({
    images,
    durationPerImage,
    transitionDuration,
}) => {
    const frame = useCurrentFrame();
    // useVideoConfig give us access to context like fps, width, height.
    // Similar to inject() in Vue or accessing global $props.
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill>
            {/* VUE COMPARISON:
              React uses .map() for lists, whereas Vue uses v-for.
              <div v-for="(src, index) in images" :key="index"> ... </div>
            */}
            {images.map((src, index) => {
                // Calculate timing for this specific image
                const startFrame = index * durationPerImage;
                const endFrame = startFrame + durationPerImage;

                // VUE COMPARISON:
                // Logic inside the render function runs every render (frame).
                // In Vue, this would be a computed property or a method.

                // Fade In
                // If it's the first image, maybe we don't fade in? Or yes?
                // Let's fade in if it's not the very first frame of the video, or just cross fade.
                // For B-roll, we usually want the previous one to fade out as this one fades in.

                // We calculate opacity relative to its active window.
                // It stays visible from [startFrame] to [endFrame + transitionDuration] (overlap)

                // Simplified Logic:
                // 1. Fade In: from startFrame to startFrame + transitionDuration
                // 2. Stay Visible
                // 3. Fade Out: from endFrame to endFrame + transitionDuration

                const opacity = interpolate(
                    frame,
                    [
                        startFrame,
                        startFrame + transitionDuration,
                        endFrame,
                        endFrame + transitionDuration
                    ],
                    [0, 1, 1, 0], // Keyframes: Transparent -> Visible -> Visible -> Transparent
                    {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                    }
                );

                // If opacity is 0, don't render to save performance (optional but good practice)
                if (opacity <= 0) return null;

                return (
                    <AbsoluteFill key={index} style={{
                        ...fadingMaskStyle, // Apply the gradient mask "loang"
                    }}>
                        <Img
                            src={src}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: opacity, // Apply the cross-fade
                            }}
                        />
                    </AbsoluteFill>
                );
            })}
        </AbsoluteFill>
    );
};
