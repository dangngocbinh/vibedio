import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, Video, useVideoConfig, staticFile, useCurrentFrame, interpolate, random, delayRender, continueRender, Series } from 'remotion';
import { SubtitleTrack } from '../components/captions/SubtitleTrack';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { PersistentTitle } from '../user-components/VietnamVibes/PersistentTitle';
import { FloatingEffect } from '../user-components/VietnamVibes/FloatingEffect';
import { StarParticles } from '../components/effects/StarParticles';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { fetchProjects, loadProject, ProjectItem } from '../utils/project-loader';
import { TikTokCaption } from '../components/captions/TikTokCaption';
import { ImageWithEffect } from '../components/effects/ImageWithEffect';
import { LayerTitle } from '../components/titles/LayerTitle';
import { FullscreenTitle } from '../components/FullscreenTitle/FullscreenTitle';
import { TitleCard } from '../components/title-cards/TitleCard';
import { LowerThird } from '../components/titles/LowerThird';
import { CallToAction } from '../components/CallToAction/CallToAction';
import { Sticker } from '../components/titles/Sticker';
import { LayerEffect } from '../components/effects/LayerEffect';
import { VideoWithEffects } from '../components/VideoWithEffects';


// Helpers cho Transition
const FadePresentation: React.FC<any> = ({ children, presentationProgress }) => {
    return (
        <AbsoluteFill>
            <AbsoluteFill style={{ opacity: 1 - presentationProgress }}>
                {children[0]}
            </AbsoluteFill>
            <AbsoluteFill style={{ opacity: presentationProgress }}>
                {children[1]}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

const ZoomOutPresentation: React.FC<any> = ({ children, presentationProgress }) => {
    return (
        <AbsoluteFill>
            <AbsoluteFill style={{
                opacity: interpolate(presentationProgress, [0, 0.5], [1, 0]),
                transform: `scale(${interpolate(presentationProgress, [0, 1], [1, 0.8])})`
            }}>
                {children[0]}
            </AbsoluteFill>
            <AbsoluteFill style={{
                opacity: interpolate(presentationProgress, [0.5, 1], [0, 1]),
                transform: `scale(${interpolate(presentationProgress, [0, 1], [1.2, 1])})`
            }}>
                {children[1]}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

const fadeTransition = () => ({
    component: FadePresentation,
    props: {},
});

const zoomOutTransition = () => ({
    component: ZoomOutPresentation,
    props: {},
});

// --- Types for OTIO JSON (Simplified) ---

interface RationalTime {
    rate: number;
    value: number;
}

interface TimeRange {
    start_time: RationalTime;
    duration: RationalTime;
}

export interface Item {
    OTIO_SCHEMA: string;
    name: string;
    source_range?: TimeRange;
    media_references?: Record<string, { target_url: string }>;
    children?: Item[];
    kind?: string;
    tracks?: Item;
    metadata?: Record<string, any>;
    in_offset?: RationalTime;
    out_offset?: RationalTime;
    transition_type?: string;
    active_media_reference_key?: string;
}

export interface OtioPlayerProps {
    timeline?: Item; // Nhận toàn bộ object json timeline (fallback)
    projectId?: string; // [Vue: props definition]
}

// [Vue: props definition] -> In React, props are defined as an interface and passed as the first argument to the component function.
// In Vue, you would define `props: { timeline: Object, projectId: String }` in options API or `defineProps<{...}>()` in script setup.

// Hàm tính tổng thời lượng timeline (max duration của các track)
// [Vue comparison] - Đây là utility function thuần, giống như một composable helper trong Vue
// Nhưng không dùng reactivity vì chỉ tính toán thuần túy
export const calculateTotalDuration = (timeline: Item, fps: number): number => {
    const tracks = timeline.tracks?.children || [];
    let maxDuration = 0;

    tracks.forEach((track: Item) => {
        const items = track.children || [];
        let trackDuration = 0;

        // Iterate through items (clips and transitions)
        // Transitions overlap with clips, so we need to handle them specially
        items.forEach((item: Item) => {
            if (item.OTIO_SCHEMA?.startsWith('Transition')) {
                // Transitions overlap with adjacent clips, so we subtract their duration
                const transitionDur = item.in_offset && item.out_offset
                    ? (item.in_offset.value / item.in_offset.rate) + (item.out_offset.value / item.out_offset.rate)
                    : 0;
                trackDuration -= transitionDur;
            } else if (item.source_range?.duration) {
                // Regular clip - add its duration
                const dur = item.source_range.duration;
                const seconds = dur.value / dur.rate;
                trackDuration += seconds;
            }
        });

        // Convert to frames
        const trackFrames = Math.round(trackDuration * fps);
        if (trackFrames > maxDuration) {
            maxDuration = trackFrames;
        }
    });

    // Fallback to 30 seconds if no valid duration found
    return maxDuration > 0 ? maxDuration : 30 * fps;
};

// Hàm helper để convert RationalTime sang frame number của Remotion
export const toFrames = (time: RationalTime, compositionFps: number) => {
    const seconds = time.value / time.rate;
    return Math.round(seconds * compositionFps);
};

// Helper function sanitize URLs
// Helper function sanitize URLs
export const sanitizeUrl = (url?: string, projectId?: string) => {
    if (!url) return url;

    // Handle file:// protocol
    if (url.startsWith('file://')) {
        const publicIndex = url.indexOf('/public/');
        if (publicIndex !== -1) {
            const relativePath = url.substring(publicIndex + 8);
            return staticFile(relativePath);
        }
    }

    // Handle paths starting with /audio/ (Specific fix for SFX)
    if (url.startsWith('/audio/')) {
        return staticFile(url.substring(1));
    }

    // Handle relative paths (not http/https/data)
    if (!url.match(/^(https?:|data:|file:|\/)/)) {
        if (projectId) {
            // Check if it's already properly prefixed to avoid double-prefixing if logic changes
            if (!url.startsWith(`projects/${projectId}`)) {
                return staticFile(`projects/${projectId}/${url}`);
            }
        }
    }

    return url;
};

export const OtioClip: React.FC<{
    clip: Item;
    fps: number;
    clipIndex: number;
    trackKind?: string; // Thêm prop trackKind
    startFrame?: number;
    projectId?: string;
}> = ({ clip, fps, clipIndex, trackKind, startFrame = 0, projectId }) => {
    const [hasError, setHasError] = React.useState(false);
    // [Vue: React.useState] -> Equivalent to `const hasError = ref(false)` in Vue 3 Composition API.
    // `setHasError` is the setter function. In Vue you would just assign `hasError.value = true`.

    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();
    const isVertical = height > width;

    // Debug log for first clip only to reduce noise
    if (clipIndex === 0 && frame < 5) {
        console.log(`[OtioPlayer Debug] Clip 0 Mode: Width=${width}, Height=${height}, isVertical=${isVertical}`);
    }

    // Handle Gap (Silence)
    if (clip.OTIO_SCHEMA?.startsWith('Gap')) {
        return null;
    }

    const durationStruct = clip.source_range?.duration;
    if (!durationStruct) return null;

    const durationFrames = toFrames(durationStruct, fps);

    // [Fix] Skip clips with 0 or negative duration to avoid Remotion error
    if (durationFrames <= 0) {
        console.warn(`[OtioClip] Clip "${clip.name}" has ${durationFrames} duration, skipping`);
        return null;
    }

    // [Fix] Calculate startFrom (offset inside the media file)
    const startTimeStruct = clip.source_range?.start_time;
    const startFromFrames = startTimeStruct ? toFrames(startTimeStruct, fps) : 0;

    // Lấy URL media
    // @ts-ignore
    const mediaRefKey = clip.active_media_reference_key || 'DEFAULT_MEDIA';
    const mediaRef = clip.media_references?.[mediaRefKey];
    const rawSrc = mediaRef?.target_url;
    const src = sanitizeUrl(rawSrc, projectId);

    if (trackKind === 'Audio') {
        console.log(`[OtioClip Debug] Clip: ${clip.name}, RawSrc: ${rawSrc}, FinalSrc: ${src}, StartFrom: ${startFromFrames}, Duration: ${durationFrames}`);
    }

    // if (!src) return null; // Logic gốc là return null, nhưng ta muốn debug xem clip nào lỗi hoặc missing
    // Với text clip hoặc generated clip, có thể ko có src.

    if (hasError) {
        return (
            <Sequence from={startFrame} durationInFrames={durationFrames} name={`Error: ${clip.name} `}>
                <AbsoluteFill style={{ backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', border: '1px solid red' }}>
                    <h2 style={{ color: 'red', fontSize: 20 }}>Media Invalid</h2>
                    <p style={{ color: '#aaa', fontSize: 12 }}>{clip.name}</p>
                </AbsoluteFill>
            </Sequence>
        );
    }

    // Determine media type logic
    const isVideoTrack = trackKind === 'Video';
    const isAudioTrack = trackKind === 'Audio';

    const isImage = src && /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(src);
    const isVideo = src && isVideoTrack && !isImage;
    const isAudio = isAudioTrack;

    // Audio Fade Logic
    let baseVolume = 1;
    if (clip.metadata?.volume !== undefined) {
        baseVolume = parseFloat(clip.metadata.volume);
    }

    let audioVolume = baseVolume;
    if (isAudio && clip.metadata?.audio_fade_in) {
        const fadeSec = parseFloat(clip.metadata.audio_fade_in);
        const fadeFrames = fadeSec * fps;
        if (fadeFrames > 0) {
            const fadeMultiplier = interpolate(frame, [0, fadeFrames], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
            });
            audioVolume = baseVolume * fadeMultiplier;
        }
    }

    if (isAudio && clip.metadata?.audio_fade_out) {
        const fadeSec = parseFloat(clip.metadata.audio_fade_out);
        const fadeFrames = fadeSec * fps;
        if (fadeFrames > 0) {
            const endFrame = durationFrames;
            const startFadeFrame = durationFrames - fadeFrames;
            const fadeMultiplier = interpolate(frame, [startFadeFrame, endFrame], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
            });
            // Multiply the existing volume (which might have fade in applied)
            audioVolume = audioVolume * fadeMultiplier;
        }
    }

    // Opacity (fade in/out cho tất cả) - Safe interpolation
    let opacity = 1;
    const enterDuration = clip.metadata?.fade_in_duration ? parseFloat(clip.metadata.fade_in_duration) * fps : 0;
    const exitDuration = clip.metadata?.fade_out_duration ? parseFloat(clip.metadata.fade_out_duration) * fps : 0;
    const exitStart = durationFrames - exitDuration;

    if (enterDuration > 0 || exitDuration > 0) {
        const ranges = [0];
        const values = [0];
        if (enterDuration > 0) {
            ranges.push(enterDuration);
            values.push(1);
        } else {
            values[0] = 1;
        }
        if (exitDuration > 0) {
            ranges.push(exitStart);
            values.push(1);
            ranges.push(durationFrames);
            values.push(0);
        } else {
            ranges.push(durationFrames);
            values.push(1);
        }

        if (ranges.length > 1 && ranges[ranges.length - 1] > ranges[0]) {
            opacity = interpolate(frame, ranges, values, { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
        }
    }

    // Style Metadata Handling
    const customStyle: React.CSSProperties = clip.metadata?.style || {};

    // Logic default objectFit: Nếu là video dọc (height > width), mặc định là contain để không bị cover mất nội dung
    const defaultObjectFit = height > width ? 'contain' : 'cover';

    return (
        <Sequence
            key={clip.name || clipIndex}
            from={startFrame}
            durationInFrames={durationFrames}
            name={clip.name}
        >
            <AbsoluteFill style={customStyle}>
                {clip.metadata?.remotion_component === 'VideoWithEffects' ? (
                    <VideoWithEffects
                        src={src!}
                        {...(clip.metadata.props || {})}
                    />
                ) : isImage ? (
                    <ImageWithEffect
                        src={src!}
                        effect={clip.metadata?.effect}
                        effectParams={{
                            ...(clip.metadata?.effect_params || {}),
                            fit: isVertical ? 'blur-bg' : 'cover'
                        }}
                        durationInFrames={durationFrames}
                        objectFit={(clip.metadata?.objectFit as any) || (clip.metadata?.style?.objectFit as any) || defaultObjectFit}
                        onError={() => { console.error(`Failed to load image: ${src}`); setHasError(true); }}
                    />
                ) : isAudio ? (
                    <Audio
                        src={src!}
                        volume={audioVolume}
                        startFrom={startFromFrames}
                        onError={(e) => { console.error(`Audio error`, e); setHasError(true); }}
                    />
                ) : isVideo ? (
                    isVertical ? (
                        // Vertical Mode: ALWAYS use Blur Background approach
                        // - If video is 9:16, 'contain' will make it fill the screen (hiding the blur bg) -> correct.
                        // - If video is 16:9, 'contain' will show full content with blur bars -> correct.
                        <AbsoluteFill>
                            {/* Background Layer (Blurred & Zoomed) */}
                            <AbsoluteFill style={{ overflow: 'hidden', zIndex: 0 }}>
                                <Video
                                    src={src!}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover', // Always cover for background
                                        filter: 'blur(30px) brightness(0.6)', // Darker & more blurred
                                        transform: 'scale(1.2)', // Zoom in more to hide edges
                                    }}
                                    volume={0}
                                    startFrom={startFromFrames}
                                    onError={(e) => { console.error(`Video BG error: ${src} `, e); }}
                                />
                            </AbsoluteFill>

                            {/* Foreground Layer (Active Video) */}
                            <AbsoluteFill style={{
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Video
                                    src={src!}
                                    style={{
                                        // Respect overrides if present, otherwise default to full size
                                        width: clip.metadata?.props?.maxWidth || '100%',
                                        height: clip.metadata?.props?.maxHeight || '100%',
                                        objectFit: 'contain', // CRITICAL: This ensures no cropping
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', // Nice shadow
                                        ...clip.metadata?.props?.style
                                    }}
                                    volume={clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume}
                                    muted={(clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume) === 0}
                                    startFrom={startFromFrames}
                                    onError={(e) => { console.error(`Video FG error: ${src} `, e); setHasError(true); }}
                                />
                            </AbsoluteFill>
                        </AbsoluteFill>
                    ) : (
                        // Horizontal/Square Mode: Default Cover
                        <Video
                            src={src!}
                            style={{
                                width: clip.metadata?.props?.maxWidth || '100%',
                                height: clip.metadata?.props?.maxHeight || '100%',
                                objectFit: clip.metadata?.props?.objectFit || clip.metadata?.props?.scaleMode || defaultObjectFit,
                                ...clip.metadata?.props?.style
                            }}
                            volume={clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume}
                            muted={(clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume) === 0}
                            startFrom={startFromFrames}
                            onError={(e) => { console.error(`Video error: ${src} `, e); setHasError(true); }}
                        />
                    )
                ) : (
                    // Fallback for missing media or just text placeholders
                    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                        {/* Nếu không có src, có thể là placeholder clip */}
                    </AbsoluteFill>
                )}
            </AbsoluteFill>
        </Sequence>
    );
};

const getTransitionPresentation = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case 'slide': return slide({ direction: 'from-left' });
        case 'wipe': return wipe({ direction: 'from-left' });
        case 'flip': return flip({ direction: 'from-left' });
        case 'clockwipe': return clockWipe({ width: 10, height: 10 });
        case 'zoomout':
        case 'zoom': return zoomOutTransition();
        case 'fade': default: return fade();
    }
};

const AudioShaker: React.FC<{
    audioSrc: string;
    fps: number;
    style?: React.CSSProperties;
    children: React.ReactNode;
}> = ({ audioSrc, fps, style, children }) => {
    const frame = useCurrentFrame();
    const audioData = useAudioData(audioSrc);

    // Fallback shake (always active, breathing/drifting)
    let shakeX = Math.sin(frame / 10) * 2;
    let shakeY = Math.cos(frame / 15) * 2;

    if (audioData) {
        const visualization = visualizeAudio({
            fps,
            frame,
            audioData,
            numberOfSamples: 64,
        });
        const volume = visualization.reduce((a, b) => a + b, 0) / visualization.length;

        // Super sensitive: Map 0-0.05 to 0-30px shake
        const audioShake = interpolate(volume, [0, 0.05], [0, 30], { extrapolateRight: 'clamp' });

        if (audioShake > 0) {
            shakeX += (random(frame) - 0.5) * audioShake;
            shakeY += (random(frame + 1) - 0.5) * audioShake;
        }
    }

    return (
        <AbsoluteFill
            style={{
                ...style,
                transform: `translate(${shakeX}px, ${shakeY}px)`,
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

// Detect overlay component tracks: Video tracks where ALL clips have remotion_component metadata.
// This covers "Captions", "Title Cards", "Subtitles", and any future overlay tracks.
const isOverlayComponentTrack = (track: Item): boolean => {
    if (track.name === 'Title Cards') return false; // Force Title Cards to use TransitionSeries (Sequential)

    const clips = (track.children || []).filter(
        (item: Item) => !item.OTIO_SCHEMA?.startsWith('Transition') && !item.OTIO_SCHEMA?.startsWith('Gap')
    );
    if (clips.length === 0) return false;
    return clips.every((clip: Item) => clip.metadata?.remotion_component);
};

const TrackRenderer: React.FC<{ track: Item, fps: number, projectId?: string, trackIndex: number }> = ({ track, fps, projectId, trackIndex }) => {
    const clips = track.children || [];
    const trackKind = track.kind; // 'Video' or 'Audio'
    // Check if this is an overlay track (Video kind but uses absolute positioning, not TransitionSeries)
    const isOverlayTrack = track.kind === 'Video' && (
        isOverlayComponentTrack(track) ||
        track.name === 'Captions' ||
        track.name?.includes('Subtitles') ||
        track.name?.includes('Title Overlays') ||
        track.name?.includes('LayerEffects')
    );

    // Main Video track uses TransitionSeries
    const isVideoTrack = trackKind === 'Video' && !isOverlayTrack;

    // Track-level Style: Ensure physical stacking for overlay tracks
    const trackStyle: React.CSSProperties = {
        ...(track.metadata?.style || {}),
        zIndex: trackIndex * 100
    };

    // Audio Reactivity (only relevant for Video tracks)
    const audioReactive = track.metadata?.audioReactive;
    let audioSrc = track.metadata?.audioSrc;
    audioSrc = sanitizeUrl(audioSrc, projectId); // Can be undefined

    if (isVideoTrack) {
        const children = (
            <TransitionSeries>
                {clips.map((item: Item, itemIndex: number) => {
                    if (item.OTIO_SCHEMA.startsWith('Transition')) {
                        const type = item.transition_type || item.metadata?.transition_type || 'Fade';
                        let frames = 30;
                        if (item.in_offset && item.out_offset) {
                            const inFrames = toFrames(item.in_offset, fps);
                            const outFrames = toFrames(item.out_offset, fps);
                            frames = inFrames + outFrames;
                        }
                        return (
                            <TransitionSeries.Transition
                                key={`trans-${itemIndex}`}
                                presentation={getTransitionPresentation(type) as any}
                                timing={linearTiming({ durationInFrames: frames })}
                            />
                        );
                    }
                    if (item.metadata?.remotion_component === 'PersistentTitle') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <PersistentTitle {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }
                    if (item.metadata?.remotion_component === 'FloatingEffect') {
                        const props = item.metadata.props || {};
                        if (props.audioSrc) props.audioSrc = sanitizeUrl(props.audioSrc, projectId);

                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <FloatingEffect {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }
                    if (item.metadata?.remotion_component === 'StarParticles') {
                        const props = item.metadata.props || {};
                        if (props.audioSrc) props.audioSrc = sanitizeUrl(props.audioSrc, projectId);

                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <StarParticles {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }
                    if (item.metadata?.remotion_component === 'LayerTitle') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <LayerTitle {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'FullscreenTitle') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 150;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <FullscreenTitle {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'TitleCard') {
                        const props = item.metadata.props || {};
                        if (props.backgroundImage) {
                            props.backgroundImage = sanitizeUrl(props.backgroundImage, projectId);
                        }
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 90;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <TitleCard {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'LowerThird') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <LowerThird {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'CallToAction') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <CallToAction {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'Sticker') {
                        const props = item.metadata.props || {};
                        if (props.src) {
                            props.src = sanitizeUrl(props.src, projectId);
                        }
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <Sticker {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'LayerEffect') {
                        const props = item.metadata.props || {};
                        if (props.src) {
                            props.src = sanitizeUrl(props.src, projectId);
                        }
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <LayerEffect {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    if (item.metadata?.remotion_component === 'TikTokCaption') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        // For TransitionSeries, we don't need manual startOffset as frame is relative 0..duration
                        // and our Python logic creates relative timestamps for segments.
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <TikTokCaption {...props} startOffset={0} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    const clip = item;
                    const durationStruct = clip.source_range?.duration;
                    const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 0;

                    if (durationFrames <= 0) return null;

                    return (
                        <TransitionSeries.Sequence key={clip.name || itemIndex} durationInFrames={durationFrames}>
                            <OtioClip
                                clip={clip}
                                fps={fps}
                                clipIndex={itemIndex}
                                trackKind={trackKind}
                                startFrame={0}
                                projectId={projectId}
                            />
                        </TransitionSeries.Sequence>
                    );
                })}
            </TransitionSeries>
        );

        if (audioReactive && audioSrc) {
            return (
                <AudioShaker audioSrc={audioSrc} fps={fps} style={trackStyle}>
                    {children}
                </AudioShaker>
            );
        }

        return (
            <AbsoluteFill style={trackStyle}>
                {children}
            </AbsoluteFill>
        );
    }

    // Overlay/Subtitle Track (Use Series for single-track visualization)
    // Overlay/Subtitle Track (Consolidated Single Track Visualization)
    // "Clean Timeline" Mode: Renders all items on this track within a single AbsoluteFill.
    // This prevents the "waterfall" effect in Remotion Studio where each clip gets its own row.
    // Overlay/Subtitle Track (Series Visualization)
    // Uses Remotion <Series> to arrange clips sequentially on a single track.
    // This provides distinct visual blocks in the Timeline (unlike AbsoluteFill) 
    // and prevents the "waterfall" effect (unlike multiple Sequences).
    if (isOverlayTrack) {
        return (
            <AbsoluteFill style={{ ...trackStyle, pointerEvents: 'none' }}>
                <SubtitleTrack
                    clips={clips}
                    fps={fps}
                    projectId={projectId || ''}
                    trackKind={trackKind || 'Subtitle'}
                />
            </AbsoluteFill>
        );
    }



    // 1. Calculate start frames and sort clips




    // Audio Track (Absolute Positioning - Waterfall is fine for audio usually)
    return (
        <AbsoluteFill>
            {clips.map((clip: Item, clipIndex: number) => {
                // Calculate Start Frame
                let startFrame = 0;

                if (clip.metadata?.globalTimelineStart !== undefined) {
                    startFrame = Math.round(parseFloat(clip.metadata.globalTimelineStart) * fps);
                } else if (clip.source_range?.start_time) {
                    startFrame = toFrames(clip.source_range.start_time, fps);
                } else {
                    const preClips = clips.slice(0, clipIndex);
                    const startSeconds = preClips.reduce((acc: number, c: Item) => {
                        const dur = c.source_range?.duration;
                        return acc + (dur ? dur.value / dur.rate : 0);
                    }, 0);
                    startFrame = Math.round(startSeconds * fps);
                }

                // Audio doesn't use TikTokCaption/TitleCard usually, but keep generic logic if needed

                // Handle LayerTitle overlay components
                if (clip.metadata?.remotion_component === 'LayerTitle') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] LayerTitle "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <LayerTitle {...props} />
                        </Sequence>
                    );
                }

                // Handle FullscreenTitle overlay components
                if (clip.metadata?.remotion_component === 'FullscreenTitle') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 150;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] FullscreenTitle "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <FullscreenTitle {...props} />
                        </Sequence>
                    );
                }

                // Handle LowerThird overlay components
                if (clip.metadata?.remotion_component === 'LowerThird') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] LowerThird "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <LowerThird {...props} />
                        </Sequence>
                    );
                }

                // Handle CallToAction overlay components
                if (clip.metadata?.remotion_component === 'CallToAction') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] CallToAction "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <CallToAction {...props} />
                        </Sequence>
                    );
                }

                // Handle Sticker overlay components
                if (clip.metadata?.remotion_component === 'Sticker') {
                    const props = clip.metadata.props || {};
                    if (props.src) {
                        props.src = sanitizeUrl(props.src, projectId);
                    }
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] Sticker "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <Sticker {...props} />
                        </Sequence>
                    );
                }

                // Handle LayerEffect overlay components
                if (clip.metadata?.remotion_component === 'LayerEffect') {
                    const props = clip.metadata.props || {};
                    if (props.src) {
                        props.src = sanitizeUrl(props.src, projectId);
                    }
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] LayerEffect "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <LayerEffect {...props} />
                        </Sequence>
                    );
                }

                if (clip.OTIO_SCHEMA?.startsWith('Gap')) {
                    return null;
                }

                // Default clip rendering
                return (
                    <OtioClip
                        key={clip.name || clipIndex}
                        clip={clip}
                        startFrame={startFrame}
                        fps={fps}
                        clipIndex={clipIndex}
                        trackKind={trackKind}
                        projectId={projectId}
                    />
                );
            })}
        </AbsoluteFill>
    );
}

export const OtioPlayer: React.FC<OtioPlayerProps> = ({ timeline: defaultTimeline, projectId }) => {
    const { fps } = useVideoConfig(); // Lấy fps từ config của project

    // State for dynamic loading
    const [handle] = useState(() => delayRender());
    const [activeTimeline, setActiveTimeline] = useState<Item | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Ref to hold the current active timeline for comparison in the polling closure
    const activeTimelineRef = useRef<Item | null>(null);

    // Update ref whenever state changes
    useEffect(() => {
        activeTimelineRef.current = activeTimeline;
    }, [activeTimeline]);

    // [Vue: useEffect] -> Similar to `onMounted` combined with `watch`.
    // It runs when the component mounts and whenever the dependencies in the array [projectId, defaultTimeline] change.
    useEffect(() => {
        let isMounted = true;
        const POLLING_INTERVAL = 2000; // Poll every 2 seconds

        const load = async (ignoreCache = false) => {
            try {
                let tl: Item | null = null;
                if (projectId) {
                    const list = await fetchProjects();
                    const project = list.find(p => p.id === projectId);

                    if (project) {
                        tl = await loadProject(project, ignoreCache);
                    } else {
                        console.warn("OtioPlayer: Project ID not found in list");
                        tl = defaultTimeline || null;
                    }
                } else {
                    const list = await fetchProjects();
                    if (list.length > 0) {
                        const latest = list[0];
                        tl = await loadProject(latest, ignoreCache);
                    } else {
                        tl = defaultTimeline || null;
                    }
                }

                if (isMounted) {
                    if (ignoreCache && tl && activeTimelineRef.current) {
                        // Compare to avoid unnecessary re-renders
                        // We use the ref here to access the latest state without triggering the effect to re-run
                        if (JSON.stringify(tl) !== JSON.stringify(activeTimelineRef.current)) {
                            console.log("[OtioPlayer] Changes detected, reloading timeline...");
                            setActiveTimeline(tl);
                        }
                    } else {
                        // Initial load or first valid data
                        if (ignoreCache && !activeTimelineRef.current) {
                            setActiveTimeline(tl);
                        } else if (!ignoreCache) {
                            setActiveTimeline(tl);
                        }
                    }
                }
            } catch (err) {
                console.error("OtioPlayer: Failed to load project", err);
                if (isMounted && !activeTimelineRef.current) {
                    setActiveTimeline(defaultTimeline || null);
                }
            } finally {
                if (isMounted) {
                    setIsLoaded(true);
                    continueRender(handle);
                }
            }
        };

        // Initial load
        load(false);

        // Polling interval
        const intervalId = setInterval(() => {
            load(true);
        }, POLLING_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [projectId, defaultTimeline, handle]); // Removed activeTimeline from dependencies

    // Render Logic
    if (!isLoaded && !activeTimeline) {
        return <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ color: 'white' }}>Loading Project...</h1>
        </AbsoluteFill>;
    }

    const timelineToRender = activeTimeline || defaultTimeline;

    if (!timelineToRender) {
        return <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ color: 'gray' }}>No Project Loaded</h1>
        </AbsoluteFill>;
    }

    const tracksStack = timelineToRender.tracks;
    const tracks = tracksStack?.children || [];

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {tracks.map((track: Item, trackIndex: number) => (
                <TrackRenderer key={track.name || trackIndex} track={track} fps={fps} projectId={projectId} trackIndex={trackIndex} />
            ))}

        </AbsoluteFill>
    );
};
