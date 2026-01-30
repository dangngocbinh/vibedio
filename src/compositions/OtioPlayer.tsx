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
import { StarParticles } from '../components/StarParticles';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { fetchProjects, loadProject, ProjectItem } from '../utils/project-loader';
import { TikTokCaption } from '../components/TikTokCaption';
import { ImageWithEffect } from '../components/ImageWithEffect';
import { BrollTitle } from '../components/BrollTitle';
import { TitleCard } from '../components/TitleCard';


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
const toFrames = (time: RationalTime, compositionFps: number) => {
    const seconds = time.value / time.rate;
    return Math.round(seconds * compositionFps);
};

// Helper function sanitize URLs
// Helper function sanitize URLs
const sanitizeUrl = (url?: string, projectId?: string) => {
    if (!url) return url;

    // Handle file:// protocol
    if (url.startsWith('file://')) {
        const publicIndex = url.indexOf('/public/');
        if (publicIndex !== -1) {
            const relativePath = url.substring(publicIndex + 8);
            return staticFile(relativePath);
        }
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

const OtioClip: React.FC<{
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

    const frame = useCurrentFrame();
    // [Vue: Custom Hook] -> Similar to a composable function `useCurrentFrame()` in Vue.

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
        const fadeMultiplier = interpolate(frame, [0, fadeFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
        });
        audioVolume = baseVolume * fadeMultiplier;
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
                    <ImageWithEffect
                        src={src!}
                        effect={clip.metadata?.effect}
                        effectParams={clip.metadata?.effect_params}
                        durationInFrames={durationFrames}
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
                    <Video
                        src={src!}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        volume={clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume}
                        muted={(clip.metadata?.video_volume !== undefined ? parseFloat(clip.metadata.video_volume) : audioVolume) === 0}
                        startFrom={startFromFrames}
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

// Detect overlay component tracks: Video tracks where ALL clips have remotion_component metadata.
// This covers "Captions", "Title Cards", "Subtitles", and any future overlay tracks.
const isOverlayComponentTrack = (track: Item): boolean => {
    if (track.name === 'Title Cards') return false; // Force Title Cards to use TransitionSeries (Sequential)
    if (track.name === 'Captions') return false; // Force Captions to use TransitionSeries (Sequential)

    const clips = (track.children || []).filter(
        (item: Item) => !item.OTIO_SCHEMA?.startsWith('Transition') && !item.OTIO_SCHEMA?.startsWith('Gap')
    );
    if (clips.length === 0) return false;
    return clips.every((clip: Item) => clip.metadata?.remotion_component);
};

const TrackRenderer: React.FC<{ track: Item, fps: number, projectId?: string }> = ({ track, fps, projectId }) => {
    const clips = track.children || [];
    const trackKind = track.kind; // 'Video' or 'Audio'
    // Check if this is an overlay track (Video kind but uses absolute positioning, not TransitionSeries)
    const isOverlayTrack = track.kind === 'Video' && (
        isOverlayComponentTrack(track) ||
        track.name?.includes('Subtitles') ||
        track.name?.includes('Title Overlays')
    );

    // Main Video track uses TransitionSeries
    const isVideoTrack = trackKind === 'Video' && !isOverlayTrack;

    // Track-level Style
    const trackStyle: React.CSSProperties = track.metadata?.style || {};

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
                    if (item.metadata?.remotion_component === 'BrollTitle') {
                        const props = item.metadata.props || {};
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <BrollTitle {...props} />
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

                    if (item.metadata?.remotion_component === 'ImagePlaceholder') {
                        const props = item.metadata.props || {};
                        const message = props.message || 'Image Missing';
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <AbsoluteFill style={{
                                    backgroundColor: '#222',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '4px dashed #555'
                                }}>
                                    <div style={{
                                        color: '#888',
                                        fontSize: 32,
                                        fontFamily: 'monospace',
                                        padding: 40,
                                        textAlign: 'center',
                                        maxWidth: '80%'
                                    }}>
                                        ⚠️ {message}
                                    </div>
                                </AbsoluteFill>
                            </TransitionSeries.Sequence>
                        );
                    }

                    // Text Overlay (for title cards with text content)
                    if (item.metadata?.text_content || item.metadata?.overlayType === 'title') {
                        const textContent = item.metadata.text_content || item.metadata.textContent || '';
                        const durationStruct = item.source_range?.duration;
                        const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;
                        return (
                            <TransitionSeries.Sequence key={item.name || itemIndex} durationInFrames={durationFrames}>
                                <AbsoluteFill style={{
                                    backgroundColor: '#000000',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        fontSize: '72px',
                                        fontWeight: 'bold',
                                        color: '#FFFFFF',
                                        textAlign: 'center',
                                        fontFamily: 'Georgia, serif',
                                        textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                                        padding: '40px',
                                        lineHeight: '1.4',
                                        letterSpacing: '2px'
                                    }}>
                                        {textContent}
                                    </div>
                                </AbsoluteFill>
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

    // Audio Track OR Overlay/Subtitle Track (Absolute Positioning)
    return (
        <AbsoluteFill>
            {clips.map((clip: Item, clipIndex: number) => {
                // Calculate Start Frame: Prefer globalTimelineStart metadata, then source_range.start_time
                let startFrame = 0;

                if (clip.metadata?.globalTimelineStart !== undefined) {
                    startFrame = Math.round(parseFloat(clip.metadata.globalTimelineStart) * fps);
                } else if (clip.source_range?.start_time) {
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

                // Handle TikTokCaption overlay component
                if (clip.metadata?.remotion_component === 'TikTokCaption') {
                    const props = clip.metadata.props || {};
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 120;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] TikTokCaption "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

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

                // Handle TitleCard overlay component
                if (clip.metadata?.remotion_component === 'TitleCard') {
                    const props = clip.metadata.props || {};
                    if (props.backgroundImage) {
                        props.backgroundImage = sanitizeUrl(props.backgroundImage, projectId);
                    }
                    const durationStruct = clip.source_range?.duration;
                    let durationFrames = durationStruct ? toFrames(durationStruct, fps) : 90;

                    if (durationFrames <= 0) {
                        console.warn(`[OtioPlayer] TitleCard "${clip.name}" has 0 duration, skipping`);
                        return null;
                    }

                    return (
                        <Sequence
                            key={clip.name || clipIndex}
                            from={startFrame}
                            durationInFrames={durationFrames}
                        >
                            <TitleCard {...props} />
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
                        projectId={projectId}
                    />
                );
            })}
        </AbsoluteFill >
    );
}

export const OtioPlayer: React.FC<OtioPlayerProps> = ({ timeline: defaultTimeline, projectId }) => {
    const { fps } = useVideoConfig(); // Lấy fps từ config của project

    // State for dynamic loading
    const [handle] = useState(() => delayRender());
    const [activeTimeline, setActiveTimeline] = useState<Item | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);



    // [Vue: useEffect] -> Similar to `onMounted` combined with `watch`.
    // It runs when the component mounts and whenever the dependencies in the array [projectId, defaultTimeline] change.
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
                <TrackRenderer key={track.name || trackIndex} track={track} fps={fps} projectId={projectId} />
            ))}
        </AbsoluteFill>
    );
};
