
import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

// --- Colors & Styles ---
// Define colors as constants for easy reuse
const COLORS = {
    spinner: '#E67E50', // Orange/Coral
    text: '#1F2937',    // Dark gray for text
    background: '#F5F5F5', // Light gray background
};

// Font style object
const FONT_STYLE: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 32,
    color: COLORS.text,
    textAlign: 'center',
    position: 'absolute',
    width: 300,
};

/**
 * ProcessFlow Component
 * 
 * Vue Developer Note:
 * - In React, we use functional components that return JSX (similar to Vue's template).
 * - Props are passed as arguments to the function.
 * - 'useCurrentFrame' is a hook that gives us the current frame number, reactive like a computed property.
 * - 'useVideoConfig' gives us the composition settings (fps, duration, etc.).
 */
export const ProcessFlow: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // --- Animation Timing Config ---
    // We define these start times to easily adjust the choreography
    const SPINNER_DURATION = 30;
    const LINES_START = 25;
    const TEXT_START = 55;

    // --- 1. Spinner Animation ---

    // Calculate rotation using spring physics for natural movement
    // Spring is like a physics simulation. 'frame' is the current time.
    const spinnerRotation = spring({
        frame: frame, // Start immediately at frame 0
        fps,
        config: {
            damping: 12, // Friction (higher = less bounce)
            stiffness: 100, // Tension (higher = faster snap)
        },
        durationInFrames: SPINNER_DURATION,
    });

    // Map the spring value (0 to 1) to rotation degrees (0 to 360)
    // interpolate is like a linear scale mapper found in many animation libraries
    const rotationDegrees = interpolate(spinnerRotation, [0, 1], [0, 360]);

    // Spinner scale (pop in effect)
    const spinnerScale = spring({
        frame: frame,
        fps,
        config: { damping: 10 },
    });


    // --- 2. Lines Animation ---

    // This spring starts later (at LINES_START)
    const linesProgress = spring({
        frame: frame - LINES_START, // Delay the start by offsetting the frame
        fps,
        config: {
            damping: 14,
            stiffness: 80,
        },
    });


    // --- 3. Text Animations (Staggered) ---

    // Helper to create staggered text fades
    const createTextFade = (delayFrames: number) => {
        return interpolate(
            frame - (TEXT_START + delayFrames),
            [0, 15], // Fade in over 15 frames
            [0, 1],  // Opacity from 0 to 1
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } // Clamp values so they don't go outside 0-1
        );
    };

    const opacityLeft = createTextFade(0);
    const opacityCenter = createTextFade(10);
    const opacityRight = createTextFade(20);

    // --- Layout Calculations ---
    // Center point
    const cx = width / 2;
    const cy = height / 2 - 100; // Move up a bit to make room for lines

    // Line dimensions
    const lineLength = 200;

    // Calculate interaction points for the Y shape
    // Center line goes straight down
    const centerLineEnd = { x: cx, y: cy + lineLength };

    // Left line goes 45 deg down-left
    // cos(45) = sin(45) ~= 0.707
    const leftLineEnd = {
        x: cx - lineLength * 0.707,
        y: cy + lineLength * 0.707
    };

    // Right line goes 45 deg down-right
    const rightLineEnd = {
        x: cx + lineLength * 0.707,
        y: cy + lineLength * 0.707
    };

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.background }}>

            {/* 
        SVG Layer for Lines
        We use an SVG overlay for drawing the lines cleanly.
      */}
            <svg
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                {/* We use 'strokeDasharray' and 'strokeDashoffset' trick to animate drawing lines. 
            However, simpler here is just scaling lines from start point.
            Let's use simple line elements with calculate positions.
        */}

                {/* Left Line */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={interpolate(linesProgress, [0, 1], [cx, leftLineEnd.x])}
                    y2={interpolate(linesProgress, [0, 1], [cy, leftLineEnd.y])}
                    stroke="black"
                    strokeWidth={4}
                    strokeLinecap="round"
                    opacity={linesProgress} // Fade in as it grows
                />

                {/* Center Line */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={interpolate(linesProgress, [0, 1], [cx, centerLineEnd.x])}
                    y2={interpolate(linesProgress, [0, 1], [cy, centerLineEnd.y])}
                    stroke="black"
                    strokeWidth={4}
                    strokeLinecap="round"
                    opacity={linesProgress}
                />

                {/* Right Line */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={interpolate(linesProgress, [0, 1], [cx, rightLineEnd.x])}
                    y2={interpolate(linesProgress, [0, 1], [cy, rightLineEnd.y])}
                    stroke="black"
                    strokeWidth={4}
                    strokeLinecap="round"
                    opacity={linesProgress}
                />
            </svg>


            {/* 
        Spinner Icon 
        Centered at (cx, cy)
      */}
            <div
                style={{
                    position: 'absolute',
                    left: cx,
                    top: cy,
                    transform: `translate(-50%, -50%) rotate(${rotationDegrees}deg) scale(${spinnerScale})`,
                }}
            >
                {/* Simple CSS Spinner created with border radius */}
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: `8px solid ${COLORS.spinner}`,
                        borderTopColor: 'transparent', // Makes it look like a spinner
                        // Add a little glow
                        boxShadow: `0 0 20px ${COLORS.spinner}40`,
                    }}
                />
            </div>


            {/* 
        Text Labels 
        Positioned relative to the end of the lines
      */}

            {/* Left Text */}
            <div
                style={{
                    ...FONT_STYLE,
                    left: leftLineEnd.x - 150, // Center text horizontally on the point
                    top: leftLineEnd.y + 20,   // Below the point
                    opacity: opacityLeft,
                    transform: `translateY(${interpolate(opacityLeft, [0, 1], [20, 0])}px)`, // Slide up slightly
                }}
            >
                figure out the 'How'
            </div>

            {/* Center Text */}
            <div
                style={{
                    ...FONT_STYLE,
                    left: centerLineEnd.x - 150,
                    top: centerLineEnd.y + 20,
                    opacity: opacityCenter,
                    transform: `translateY(${interpolate(opacityCenter, [0, 1], [20, 0])}px)`,
                }}
            >
                writes all the code
            </div>

            {/* Right Text */}
            <div
                style={{
                    ...FONT_STYLE,
                    left: rightLineEnd.x - 150,
                    top: rightLineEnd.y + 20,
                    opacity: opacityRight,
                    transform: `translateY(${interpolate(opacityRight, [0, 1], [20, 0])}px)`,
                }}
            >
                corrects itself when it
            </div>

        </AbsoluteFill>
    );
};
