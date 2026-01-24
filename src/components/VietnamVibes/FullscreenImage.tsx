import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

// VUE COMPONENT COMPARISON:
// In Vue, this would be a single-file component (.vue)
// <template>
//   <div class="absolute-fill">
//     <img :src="src" class="w-full h-full object-cover" />
//   </div>
// </template>

interface FullscreenImageProps {
    src: string;
    style?: React.CSSProperties; // Add support for custom styles (e.g. masks)
}

// In React, functional components are just functions that return JSX.
// Props are equivalent to `defineProps` in Vue 3 <script setup>.
export const FullscreenImage: React.FC<FullscreenImageProps> = ({ src, style }) => {
    // AbsoluteFill is a Remotion helper component, similar to a div with
    // position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    return (
        <AbsoluteFill style={style}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </AbsoluteFill>
    );
};
