import React, { useMemo } from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { TikTokCaption } from './TikTokCaption';
import { TitleCard } from '../title-cards/TitleCard';
import { LayerTitle } from '../titles/LayerTitle';
import { FullscreenTitle } from '../FullscreenTitle/FullscreenTitle';
import { Sticker } from '../titles/Sticker';
import { LayerEffect } from '../effects/LayerEffect';
import { LowerThird } from '../titles/LowerThird';
import { CallToAction } from '../CallToAction/CallToAction';
import { StarParticles } from '../effects/StarParticles';
import { OtioClip, sanitizeUrl, toFrames, Item } from '../../compositions/OtioPlayer';

interface SubtitleTrackProps {
    clips: Item[];
    fps: number;
    projectId: string; // Ensure string is passed
    trackKind: string; // Ensure string is passed
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ clips, fps, projectId, trackKind }) => {
    // Calculate layout with gaps for Series
    const seriesItems = useMemo(() => {
        // 1. Sort clips by start time
        const sorted = clips.map((clip, index) => {
            let startFrame = 0;
            // logic to determine startFrame (same as before)
            if (clip.metadata?.globalTimelineStart !== undefined) {
                startFrame = Math.round(parseFloat(clip.metadata.globalTimelineStart) * fps);
            } else if (clip.source_range?.start_time) {
                startFrame = toFrames(clip.source_range.start_time, fps);
            } else {
                // Fallback: we can't easily fallback in a map without state, 
                // but typically subtitles have timestamps. 
                // If not, we might sort by index assuming generic order, but let's assume timestamps exist.
                startFrame = 0;
            }

            // Duration
            const durationStruct = clip.source_range?.duration;
            const durationFrames = durationStruct ? toFrames(durationStruct, fps) : 0;

            return { clip, startFrame, durationFrames, index };
        }).sort((a, b) => a.startFrame - b.startFrame);

        // 2. Build Series structure
        // We accumulate React Nodes. 
        // We cannot use simple .map() because we introduce gaps.
        const items: React.ReactNode[] = [];
        let currentCursor = 0;

        sorted.forEach((item, i) => {
            const gap = item.startFrame - currentCursor;

            // If positive Gaps: Add a Spacer sequence
            if (gap > 0) {
                items.push(
                    <Series.Sequence key={`gap-${i}`} durationInFrames={gap}>
                        {/* Empty Spacer */}
                        <AbsoluteFill />
                    </Series.Sequence>
                );
                currentCursor += gap;
            }

            // Handle Negative Gap (Overlap):
            // If overlap, we advance cursor but we cannot "fix" the overlap visually without multi-track.
            // But we are in Single Track Mode. 
            // We just skip the overlap part or render it anyway?
            // Series sequences are strictly sequential.
            // If we add a sequence, it starts AFTER the previous one.
            // So essentially:
            // start_actual_in_timeline = currentCursor
            // wanted_start = item.startFrame
            // diff = wanted - current
            // If diff < 0, it means we are late. The clip will start LATER than intended.
            // That's acceptable for avoiding waterfall.

            if (item.durationFrames > 0) {
                // Determine startOffset. 
                // Since this Sequence starts at 'currentCursor' (which is ideally 'item.startFrame'),
                // startFrame = currentCursor
                // startOffset = currentCursor / fps
                const actualStartFrame = currentCursor;
                const startOffsetSeconds = actualStartFrame / fps;

                items.push(
                    <Series.Sequence key={`clip-${item.index}`} durationInFrames={item.durationFrames} layout="none">
                        <AbsoluteFill style={{ pointerEvents: 'none' }}>
                            {(() => {
                                // 1. TikTokCaption
                                if (item.clip.metadata?.remotion_component === 'TikTokCaption') {
                                    const props = item.clip.metadata.props || {};
                                    // Pass actual start offset
                                    return <TikTokCaption {...props} startOffset={startOffsetSeconds} />;
                                }

                                // 2. TitleCard
                                if (item.clip.metadata?.remotion_component === 'TitleCard') {
                                    const props = item.clip.metadata.props || {};
                                    if (props.backgroundImage) {
                                        props.backgroundImage = sanitizeUrl(props.backgroundImage, projectId);
                                    }
                                    return <TitleCard {...props} />;
                                }

                                // 3. LayerTitle (Overlay)
                                if (item.clip.metadata?.remotion_component === 'LayerTitle' || item.clip.metadata?.remotion_component === 'BrollTitle') {
                                    const props = item.clip.metadata.props || {};
                                    return <LayerTitle {...props} />;
                                }


                                // 4. FullscreenTitle
                                if (item.clip.metadata?.remotion_component === 'FullscreenTitle') {
                                    const props = item.clip.metadata.props || {};
                                    return <FullscreenTitle {...props} />;
                                }

                                // 5. Sticker
                                if (item.clip.metadata?.remotion_component === 'Sticker') {
                                    const props = item.clip.metadata.props || {};
                                    if (props.src) {
                                        props.src = sanitizeUrl(props.src, projectId);
                                    }
                                    return <Sticker {...props} />;
                                }

                                // 6. LayerEffect
                                if (item.clip.metadata?.remotion_component === 'LayerEffect') {
                                    const props = item.clip.metadata.props || {};
                                    if (props.src) {
                                        props.src = sanitizeUrl(props.src, projectId);
                                    }
                                    return <LayerEffect {...props} />;
                                }

                                // 7. LowerThird
                                if (item.clip.metadata?.remotion_component === 'LowerThird') {
                                    const props = item.clip.metadata.props || {};
                                    return <LowerThird {...props} />;
                                }

                                // 8. CallToAction
                                if (item.clip.metadata?.remotion_component === 'CallToAction') {
                                    const props = item.clip.metadata.props || {};
                                    return <CallToAction {...props} />;
                                }

                                // 9. StarParticles
                                if (item.clip.metadata?.remotion_component === 'StarParticles') {
                                    const props = item.clip.metadata.props || {};
                                    return <StarParticles {...props} />;
                                }

                                // 5. Fallback
                                return (
                                    <OtioClip
                                        clip={item.clip}
                                        fps={fps}
                                        clipIndex={item.index}
                                        trackKind={trackKind}
                                        projectId={projectId}
                                        startFrame={0}
                                    />
                                );
                            })()}
                        </AbsoluteFill>
                    </Series.Sequence>
                );
                // Advance cursor
                currentCursor += item.durationFrames;
            }
        });

        // Add trailing filler if needed? No, track ends when clips end.
        return items;
    }, [clips, fps, projectId, trackKind]);

    return (
        <Series>
            {seriesItems}
        </Series>
    );
};
