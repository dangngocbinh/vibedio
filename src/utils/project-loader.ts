import { staticFile } from 'remotion';
// @ts-ignore
import projectsList from '../generated/projects.json';
import { getAspectRatio, DEFAULT_ASPECT_RATIO } from '../config/aspect-ratios';

export interface ProjectItem {
    id: string;
    name: string;
    path: string;
    hasScript: boolean;
    hasOtio: boolean;
    otioFile: string | null;
    ratio?: string;
    modifiedAt: string;
    timestamp: number;
}

export const fetchProjects = async (): Promise<ProjectItem[]> => {
    return projectsList as ProjectItem[];
};

export const loadProject = async (project: ProjectItem): Promise<any> => {
    // Navigate to public/projects folder using staticFile to get correct URL (works in Studio with hashed paths)
    const projectBase = staticFile(project.path);

    // If OTIO exists, prefer it? Or if script exists, prefer script?
    // The user said "dùng cơ chế này" implying the new mechanism (script based likely, or whichever is available).
    // But OtioPlayer expects OTIO. If there is a native OTIO file, we should probably use it.
    // However, the example `5-sai-lam` has script.json but NO otio file.

    if (project.hasOtio && project.otioFile) {
        const res = await fetch(`${projectBase}/${project.otioFile}`);
        const otio = await res.json();
        return fixOtioPaths(otio, projectBase);
    }

    if (project.hasScript) {
        // Load script.json and resources.json
        const scriptRes = await fetch(`${projectBase}/script.json`);
        const resourcesRes = await fetch(`${projectBase}/resources.json`);

        if (!scriptRes.ok) throw new Error('Failed to load script.json');
        const script = await scriptRes.json();
        const resources = resourcesRes.ok ? await resourcesRes.json() : null;

        return convertScriptToOtio(script, resources, projectBase);
    }

    throw new Error('No valid project file found');
};

const fixOtioPaths = (item: any, basePath: string): any => {
    if (!item) return item;

    // Fix media references in current item
    if (item.media_references) {
        Object.keys(item.media_references).forEach(key => {
            const ref = item.media_references[key];
            if (ref && ref.target_url) {
                // Check if url is relative (not http/s, not file://, not starting with /)
                const url = ref.target_url;
                if (!url.startsWith('http') && !url.startsWith('file://') && !url.startsWith('/')) {
                    ref.target_url = `${basePath}/${url}`;
                }
            }
        });
    }

    // Recursively fix children
    if (item.tracks && item.tracks.children) {
        item.tracks.children.forEach((child: any) => fixOtioPaths(child, basePath));
    }
    if (item.children) {
        item.children.forEach((child: any) => fixOtioPaths(child, basePath));
    }

    // recurse into tracks object if it exists (e.g. for Timeline)
    if (item.tracks && !item.tracks.children) {
        // actually tracks is usually a Stack with children, handled above if structure is standard
        // But checking if tracks is an object itself
        fixOtioPaths(item.tracks, basePath);
    }

    return item;
};

const convertScriptToOtio = (script: any, resources: any, projectBase: string) => {
    const fps = 30;
    const scenes = script.scenes || [];

    // Read aspect ratio from script metadata
    const ratio = script.metadata?.ratio || DEFAULT_ASPECT_RATIO;
    const aspectConfig = getAspectRatio(ratio);

    // Map resources by sceneId
    const videoResources: Record<string, string> = {};
    if (resources && resources.resources && resources.resources.videos) {
        resources.resources.videos.forEach((v: any) => {
            // Pick the first result's HD url or available url
            if (v.results && v.results.length > 0) {
                // Use downloadUrls if available, else url
                const downloadUrl = v.results[0].downloadUrls?.hd || v.results[0].url;
                if (downloadUrl) {
                    videoResources[v.sceneId] = downloadUrl;
                }
            }
        });
    }

    // Determine total duration
    // Script has metadata.duration or sum of scenes
    let totalDurationFrames = 0;
    if (scenes.length > 0) {
        const lastScene = scenes[scenes.length - 1];
        totalDurationFrames = (lastScene.startTime + lastScene.duration) * fps;
    }

    // 1. Video Track
    const videoClips = scenes.map((scene: any) => {
        const durationFrames = Math.round(scene.duration * fps);
        const startFrames = Math.round(scene.startTime * fps);

        // Find media - use aspect-ratio-aware placeholder
        const mediaUrl = videoResources[scene.id] || `https://placehold.co/${aspectConfig.width}x${aspectConfig.height}?text=${encodeURIComponent(scene.id)}`;

        return {
            "OTIO_SCHEMA": "Clip.1", // Standardize schema name
            "name": scene.id,
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "start_time": {
                    "OTIO_SCHEMA": "RationalTime.1",
                    "rate": fps,
                    "value": 0
                },
                "duration": {
                    "OTIO_SCHEMA": "RationalTime.1",
                    "rate": fps,
                    "value": durationFrames
                }
            },
            "media_references": {
                "DEFAULT_MEDIA": {
                    "OTIO_SCHEMA": "ExternalReference.1",
                    "target_url": mediaUrl
                }
            },
            "active_media_reference_key": "DEFAULT_MEDIA"
        };
    });

    // 2. Audio Track (Voice)
    // Check if voice.mp3 exists (we assume it does for generated projects)
    const voiceUrl = `${projectBase}/voice.mp3`;
    const voiceClip = {
        "OTIO_SCHEMA": "Clip.1",
        "name": "Voiceover",
        "source_range": {
            "OTIO_SCHEMA": "TimeRange.1",
            "start_time": { "OTIO_SCHEMA": "RationalTime.1", "rate": fps, "value": 0 },
            "duration": { "OTIO_SCHEMA": "RationalTime.1", "rate": fps, "value": totalDurationFrames }
        },
        "media_references": {
            "DEFAULT_MEDIA": {
                "OTIO_SCHEMA": "ExternalReference.1",
                "target_url": voiceUrl
            }
        },
        "active_media_reference_key": "DEFAULT_MEDIA"
    };

    // 3. Subtitles / Text Track (using PersistentTitle as placeholder for text)
    // Or maybe we don't render text in this simple player, but the request implies "render" what's in the project.
    // OtioPlayer supports 'PersistentTitle'.
    const textClips = scenes.map((scene: any) => {
        const durationFrames = Math.round(scene.duration * fps);

        return {
            "OTIO_SCHEMA": "Clip.1",
            "name": `Text-${scene.id}`,
            "metadata": {
                "remotion_component": "PersistentTitle",
                "props": {
                    "title": scene.text
                }
            },
            "source_range": {
                "OTIO_SCHEMA": "TimeRange.1",
                "start_time": { "OTIO_SCHEMA": "RationalTime.1", "rate": fps, "value": 0 },
                "duration": { "OTIO_SCHEMA": "RationalTime.1", "rate": fps, "value": durationFrames }
            },
            "media_references": {
                "DEFAULT_MEDIA": { "OTIO_SCHEMA": "MissingReference.1" }
            }
        };
    });

    return {
        "OTIO_SCHEMA": "Timeline.1",
        "name": script.metadata?.projectName || "Converted Project",
        "metadata": {
            "ratio": ratio,
            "width": aspectConfig.width,
            "height": aspectConfig.height,
        },
        "tracks": {
            "OTIO_SCHEMA": "Stack.1",
            "children": [
                {
                    "OTIO_SCHEMA": "Track.1",
                    "name": "Video",
                    "kind": "Video",
                    "children": videoClips
                },
                {
                    "OTIO_SCHEMA": "Track.1",
                    "name": "Audio",
                    "kind": "Audio",
                    "children": [voiceClip]
                },
                {
                    "OTIO_SCHEMA": "Track.1",
                    "name": "Text",
                    "kind": "Video",
                    "children": textClips
                }
            ]
        }
    };
};
