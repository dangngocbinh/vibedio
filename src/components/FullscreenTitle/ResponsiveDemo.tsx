import React from 'react';
import { Composition } from 'remotion';
import { FullscreenTitle } from './FullscreenTitle';

/**
 * Demo compositions để test responsive của FullscreenTitle
 * với các tỷ lệ khung hình khác nhau
 */

const DEMO_TITLE = "RESPONSIVE TITLE TEST";
const DEMO_SUBTITLE = "Kiểm tra hiển thị ở nhiều tỷ lệ khung hình";

export const FullscreenTitleResponsiveDemo: React.FC = () => {
    return (
        <>
            {/* 9:16 - Vertical (TikTok/Reels/Shorts) */}
            <Composition
                id="FullscreenTitle-9x16"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'default',
                    backgroundType: 'gradient',
                    backgroundValue: 'dark',
                    textStyle: 'bold-shadow',
                    animation: 'zoom-fade',
                }}
            />

            {/* 4:5 - Instagram Post */}
            <Composition
                id="FullscreenTitle-4x5"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1350}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'default',
                    backgroundType: 'gradient',
                    backgroundValue: 'purple',
                    textStyle: 'glow',
                    animation: 'slide-up-bounce',
                }}
            />

            {/* 1:1 - Square (Instagram/Facebook) */}
            <Composition
                id="FullscreenTitle-1x1"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1080}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'default',
                    backgroundType: 'gradient',
                    backgroundValue: 'ocean',
                    textStyle: 'gradient-text',
                    animation: 'reveal-left',
                }}
            />

            {/* 16:9 - Horizontal (YouTube/TV) */}
            <Composition
                id="FullscreenTitle-16x9"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'default',
                    backgroundType: 'gradient',
                    backgroundValue: 'sunset',
                    textStyle: '3d',
                    animation: 'blur-in',
                }}
            />

            {/* Template Demo - 9:16 với template khác nhau */}
            <Composition
                id="FullscreenTitle-Template-CinematicIntro-9x16"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'cinematic-intro',
                }}
            />

            <Composition
                id="FullscreenTitle-Template-NeonNight-9x16"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'neon-night',
                }}
            />

            <Composition
                id="FullscreenTitle-Template-GlassmorphismPro-1x1"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1080}
                defaultProps={{
                    title: DEMO_TITLE,
                    subtitle: DEMO_SUBTITLE,
                    template: 'glassmorphism-pro',
                }}
            />

            {/* Long Text Test - 9:16 */}
            <Composition
                id="FullscreenTitle-LongText-9x16"
                component={FullscreenTitle}
                durationInFrames={150}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: "TIÊU ĐỀ DÀI ĐỂ KIỂM TRA TỰ ĐỘNG XUỐNG DÒNG",
                    subtitle: "Subtitle cũng dài để test responsive và word wrap",
                    template: 'default',
                    backgroundType: 'gradient',
                    backgroundValue: 'dark',
                }}
            />
        </>
    );
};

export default FullscreenTitleResponsiveDemo;
