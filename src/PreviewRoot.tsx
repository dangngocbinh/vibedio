import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { LowerThird, LowerThirdProps } from './components/titles/LowerThird';
import { FullscreenTitle, FullscreenTitleProps } from './components/FullscreenTitle/FullscreenTitle';
import { CallToAction, CallToActionProps } from './components/CallToAction/CallToAction';
import { z } from 'zod'; // Import Zod directly

// Define Zod schemas manually matching the Props interfaces
const LowerThirdSchema = z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    template: z.string().optional() as any, // Using any for enum-like strings
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    textColor: z.string().optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
});

const FullscreenTitleSchema = z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    template: z.string().optional() as any,
    backgroundType: z.string().optional() as any,
    backgroundValue: z.string().optional(),
    textStyle: z.string().optional() as any,
    textColor: z.string().optional(),
    accentColor: z.string().optional(),
    titleSize: z.number().optional(),
    subtitleSize: z.number().optional(),
    fontFamily: z.string().optional(),
});

const CallToActionSchema = z.object({
    text: z.string(), // CTA uses 'text' not 'title' usually? Let's check CTA component
    subtext: z.string().optional(),
    type: z.string().optional() as any, // 'template' or 'type'
    primaryColor: z.string().optional(),
    buttonText: z.string().optional(),
});

// Wrapper components to provide a background for better visibility
const PreviewWrapper: React.FC<{ children: React.ReactNode, width: number, height: number }> = ({ children, width, height }) => (
    <div style={{ width, height, background: 'linear-gradient(45deg, #1a1a1a 25%, #2a2a2a 25%, #2a2a2a 50%, #1a1a1a 50%, #1a1a1a 75%, #2a2a2a 75%, #2a2a2a 100%)', backgroundSize: '40px 40px' }}>
        {children}
    </div>
);

export const PreviewRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="LowerThirdPreview"
                component={(props) => (
                    <PreviewWrapper width={1920} height={1080}>
                        <LowerThird {...props} />
                    </PreviewWrapper>
                )}
                durationInFrames={120}
                fps={30}
                width={1920}
                height={1080}
                schema={LowerThirdSchema}
                defaultProps={{
                    title: 'SAMPLE TITLE',
                    subtitle: 'Sample Subtitle',
                    template: 'modern-skew',
                }}
            />
            <Composition
                id="FullscreenTitlePreview"
                component={(props) => (
                    <PreviewWrapper width={1920} height={1080}>
                        <FullscreenTitle {...props} />
                    </PreviewWrapper>
                )}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                schema={FullscreenTitleSchema}
                defaultProps={{
                    title: 'FULLSCREEN TITLE',
                    subtitle: 'Subtitle goes here',
                    template: 'cinematic-intro',
                }}
            />
            {/* 
            <Composition
                id="CTAPreview"
                ... 
                // Will add CTA later after verifying props
            />
            */}
        </>
    );
};
