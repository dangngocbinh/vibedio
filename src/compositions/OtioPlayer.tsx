import React, { useEffect, useState, useCallback } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, Video, useVideoConfig, staticFile, useCurrentFrame, interpolate, random, delayRender, continueRender } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { OpeningTitle } from '../components/OpeningTitle';
import { PersistentTitle } from '../components/VietnamVibes/PersistentTitle';
import { FloatingEffect } from '../components/VietnamVibes/FloatingEffect';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { fetchProjects, loadProject, ProjectItem } from '../utils/project-loader';
import { TikTokCaption } from '../components/TikTokCaption';

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

const fadeTransition = () => ({
    component: FadePresentation,
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

interface Item {
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
    projectId?: string;
}

// Hàm tính tổng thời lượng timeline (max duration của các track)
export const calculateTotalDuration = (timeline: Item, fps: number): number => {
    const tracks = timeline.tracks?.children || [];
    let maxDuration = 0;

    tracks.forEach((track: Item) => {
        const clips = track.children || [];
        // Tính tổng duration của track này (giả sử clips nối tiếp)
        const trackSeconds = clips.reduce((acc: number, clip: Item) => {
            const dur = clip.source_range?.duration;
            return acc + (dur ? dur.value / dur.rate : 0);
        }, 0);

        // Convert sang frames
        const trackFrames = Math.round(trackSeconds * fps);
        if (trackFrames > maxDuration) maxDuration = trackFrames;
    });

    return maxDuration || 30 * fps;
};

// Hàm helper để convert RationalTime sang frame number của Remotion
const toFrames = (time: RationalTime, compositionFps: number) => {
    const seconds = time.value / time.rate;
    return Math.round(seconds * compositionFps);
};

// Helper function sanitize URLs
const sanitizeUrl = (url?: string) => {
    if (url && url.startsWith('file://')) {
        const publicIndex = url.indexOf('/public/');
        if (publicIndex !== -1) {
            const relativePath = url.substring(publicIndex + 8);
            return staticFile(relativePath);
        }
    }
    return url;
};

const OtioClip: React.FC<{
    clip: Item;
    fps: number;
    clipIndex: number;
    trackKind?: string; // Thêm prop trackKind
    startFrame?: number;
}> = ({ clip, fps, clipIndex, trackKind, startFrame = 0 }) => {
    const [hasError, setHasError] = React.useState(false);
    const frame = useCurrentFrame();

    // Handle Gap (Silence)
    if (clip.OTIO_SCHEMA?.startsWith('Gap')) {
        return null;
    }

    const durationStruct = clip.source_range?.duration;
    if (!durationStruct) return null;

    const durationFrames = toFrames(durationStruct, fps);

    // Lấy URL media
    // @ts-ignore
    const mediaRefKey = clip.active_media_reference_key || 'DEFAULT_MEDIA';
    const mediaRef = clip.media_references?.[mediaRefKey];
    const rawSrc = mediaRef?.target_url;
    const src = sanitizeUrl(rawSrc);

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
    let audioVolume = 1;
    if (isAudio && clip.metadata?.audio_fade_in) {
        const fadeSec = parseFloat(clip.metadata.audio_fade_in);
        const fadeFrames = fadeSec * fps;
        audioVolume = interpolate(frame, [0, fadeFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
        });
    }

    // Style Metadata Handling
    const customStyle: React.CSSProperties = clip.metadata?.style || {};

    return (
        <Sequence
            key={clip.name || clipIndex}
            from={startFrame}
            durationInFrames={durationFrames}
            name={clip.name}
        >
            <AbsoluteFill style={customStyle}>
                {isImage ? (
                    <Img
                        src={src!}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => { console.error(`Failed to load image: ${src} `); setHasError(true); }}
                    />
                ) : isAudio ? (
                    <Audio
                        src={src!}
                        volume={audioVolume}
                        onError={(e) => { console.error(`Audio error`, e); setHasError(true); }}
                    />
                ) : isVideo ? (
                    <Video
                        src={src!}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { console.error(`Video error: ${src} `, e); setHasError(true); }}
                    />
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

const TrackRenderer: React.FC<{ track: Item, fps: number }> = ({ track, fps }) => {
    const clips = track.children || [];
    const trackKind = track.kind; // 'Video' or 'Audio'

    // Check if this is a Subtitle track (which is technically Video kind but acts as overlay)
    const isSubtitleTrack = track.kind === 'Video' && track.name?.includes('Subtitles');
    // Main Video track uses TransitionSeries
    const isVideoTrack = trackKind === 'Video' && !isSubtitleTrack;

    // Track-level Style
    const trackStyle: React.CSSProperties = track.metadata?.style || {};

    // Audio Reactivity (only relevant for Video tracks)
    const audioReactive = track.metadata?.audioReactive;
    let audioSrc = track.metadata?.audioSrc;
    audioSrc = sanitizeUrl(audioSrc); // Can be undefined

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
                    if (item.metadata?.remotion_component === 'OpeningTitle') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <OpeningTitle {...props} />
                            </TransitionSeries.Sequence>
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
                        if (props.audioSrc) props.audioSrc = sanitizeUrl(props.audioSrc);

                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <FloatingEffect {...props} />
                            </TransitionSeries.Sequence>
                        );
                    }

                    // Note: TikTokCaption in Video track is skipped here, handled in Subtitle track logic

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

    // Audio Track OR Overlay/Subtitle Track (Absolute Positioning)
    return (
        <AbsoluteFill>
            {clips.map((clip: Item, clipIndex: number) => {
                // Calculate Start Frame: Prefer source_range.start_time (global) if available
                let startFrame = 0;

                if (clip.source_range?.start_time) {
                    // Use explicit start time from OTIO if it looks like a timeline position
                    startFrame = toFrames(clip.source_range.start_time, fps);
                } else {
                    // Fallback to accumulation (flawed for gaps but works for simple stacks)
                    const preClips = clips.slice(0, clipIndex);
                    const startSeconds = preClips.reduce((acc: number, c: Item) => {
                        const dur = c.source_range?.duration;
                        return acc + (dur ? dur.value / dur.rate : 0);
                    }, 0);
                    startFrame = Math.round(startSeconds * fps);
                }

                const startOffsetSeconds = startFrame / fps;

                // Handle Subtitle Components explicitly in this track type
                if (clip.metadata?.remotion_component === 'TikTokCaption') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <TikTokCaption {...props} startOffset={startOffsetSeconds} />
                        </Sequence>
                    );
                }

                return (
                    <OtioClip
                        key={clip.name || clipIndex}
                        clip={clip}
                        startFrame={startFrame}
                        fps={fps}
                        clipIndex={clipIndex}
                        trackKind={trackKind}
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

    useEffect(() => {
        const load = async () => {
            try {
                if (projectId) {
                    const list = await fetchProjects();
                    const project = list.find(p => p.id === projectId);

                    if (project) {
                        const tl = await loadProject(project);
                        setActiveTimeline(tl);
                    } else {
                        console.warn("OtioPlayer: Project ID not found in list");
                        setActiveTimeline(defaultTimeline || null);
                    }
                } else {
                    const list = await fetchProjects();
                    if (list.length > 0) {
                        const latest = list[0];
                        const tl = await loadProject(latest);
                        setActiveTimeline(tl);
                    } else {
                        setActiveTimeline(defaultTimeline || null);
                    }
                }
            } catch (err) {
                console.error("OtioPlayer: Failed to load project", err);
                setActiveTimeline(defaultTimeline || null);
            } finally {
                setIsLoaded(true);
                continueRender(handle);
            }
        };
        load();
    }, [projectId, defaultTimeline, handle]);

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
                <TrackRenderer key={track.name || trackIndex} track={track} fps={fps} />
            ))}
        </AbsoluteFill>
    );
};
