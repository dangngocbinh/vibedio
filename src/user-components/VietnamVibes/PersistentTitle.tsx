import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

// VUE COMPARISON:
interface PersistentTitleProps {
    title: string;
}

export const PersistentTitle: React.FC<PersistentTitleProps> = ({ title }) => {
    const frame = useCurrentFrame();

    // Simple fade in at the very beginning
    const opacity = interpolate(frame, [0, 30], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'flex-start', // Top alignment
                alignItems: 'flex-start', // Left alignment
                padding: '60px',
                opacity,
            }}
        >
            {/* 
                VUE COMPARISON: 
                In Vue, styles are often in <style scoped>. 
                In Remotion/React, inline styles or CSS-in-JS libraries are common.
            */}
            <h1
                style={{
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '60px',
                    color: 'white',
                    // Text Shadow for visibility against backgrounds
                    textShadow: '0px 2px 10px rgba(0,0,0,0.5)',
                    margin: 0,
                }}
            >
                {/* 
                    "Đường Lên Phía Trước ..." 
                    User requested specific styling: "vàng/white", shadow.
                    I'll make "Phía Trước" yellow.
                 */}
                Đường Lên <span style={{ color: '#FFD700' }}>Phía Trước</span> ...
            </h1>

            {/* Subtitles or other elements could go here */}
        </AbsoluteFill>
    );
};
