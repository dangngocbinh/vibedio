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

export const loadProject = async (project: ProjectItem, ignoreCache: boolean = false): Promise<any> => {
    // Navigate to public/projects folder using staticFile to get correct URL (works in Studio with hashed paths)
    const projectBase = staticFile(project.path);

    // If OTIO exists, prefer it? Or if script exists, prefer script?
    // The user said "dùng cơ chế này" implying the new mechanism (script based likely, or whichever is available).
    // But OtioPlayer expects OTIO. If there is a native OTIO file, we should probably use it.
    // However, the example `5-sai-lam` has script.json but NO otio file.

    const cacheBuster = ignoreCache ? `?t=${Date.now()}` : '';

    if (project.hasOtio && project.otioFile) {
        const res = await fetch(`${projectBase}/${project.otioFile}${cacheBuster}`);
        const otio = await res.json();

        // Also load script/resources if available so we can force local media URLs
        // for smoother preview/render and avoid invalid page URLs in OTIO.
        let script: any = null;
        let resources: any = null;
        try {
            const scriptRes = await fetch(`${projectBase}/script.json${cacheBuster}`);
            if (scriptRes.ok) script = await scriptRes.json();
        } catch {
            // best-effort only
        }
        try {
            const resourcesRes = await fetch(`${projectBase}/resources.json${cacheBuster}`);
            if (resourcesRes.ok) resources = await resourcesRes.json();
        } catch {
            // best-effort only
        }

        return fixOtioPaths(otio, projectBase, script, resources);
    }

    if (project.hasScript) {
        // Load script.json and resources.json
        const scriptRes = await fetch(`${projectBase}/script.json${cacheBuster}`);
        const resourcesRes = await fetch(`${projectBase}/resources.json${cacheBuster}`);

        if (!scriptRes.ok) throw new Error('Failed to load script.json');
        const script = await scriptRes.json();
        const resources = resourcesRes.ok ? await resourcesRes.json() : null;

        return convertScriptToOtio(script, resources, projectBase);
    }

    throw new Error('No valid project file found');
};

const isExternalUrl = (value?: string) => !!value && /^(https?:|data:|blob:|file:)/i.test(value);

const normalizeRelativePath = (value: string) => value.replace(/\\/g, '/').replace(/^\/+/, '');

const toProjectMediaUrl = (basePath: string, maybePath?: string): string | null => {
    if (!maybePath) return null;
    const normalized = maybePath.replace(/\\/g, '/');

    if (isExternalUrl(normalized)) {
        return normalized;
    }

    // absolute local path containing /public/projects/...
    const fromPublic = normalized.match(/public\/projects\/(.+)/i);
    if (fromPublic) {
        return staticFile(`projects/${normalizeRelativePath(fromPublic[1])}`);
    }

    // already project-relative path
    return `${basePath}/${normalizeRelativePath(normalized)}`;
};

const flattenScenes = (script: any): any[] => {
    if (!script) return [];
    if (Array.isArray(script.scenes)) return script.scenes;
    if (Array.isArray(script.sections)) {
        return script.sections.flatMap((section: any) => section?.scenes || []);
    }
    return [];
};

const pickLocalPathFromResource = (resource: any): string | null => {
    if (!resource) return null;
    if (typeof resource.localPath === 'string' && resource.localPath.trim()) {
        const local = resource.localPath.trim();
        // Ignore obviously invalid downloaded extension
        if (!/\.dat($|\?)/i.test(local)) return local;
    }
    return null;
};

const pickRemoteMediaUrlFromResource = (resource: any): string | null => {
    if (!resource) return null;

    const candidates = [
        resource.downloadUrl,
        resource.downloadUrls?.['4k'],
        resource.downloadUrls?.hd,
        resource.downloadUrls?.large,
        resource.downloadUrls?.medium,
        resource.downloadUrls?.original,
        resource.downloadUrls?.sd,
        resource.url
    ].filter(Boolean) as string[];

    const mediaLike = candidates.find((u) => /\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(u));
    if (mediaLike) return mediaLike;

    // Last resort: keep only real file links, avoid HTML page links (pexels.com/video/...).
    const notPageUrl = candidates.find((u) => !/pexels\.com\/(video|photo)\//i.test(u));
    return notPageUrl || null;
};

const buildLocalResourcesByScene = (resources: any): Record<string, any[]> => {
    const byScene: Record<string, any[]> = {};
    if (!resources?.resources) return byScene;
    const categories = ['videos', 'images', 'generatedImages', 'pinnedResources'];
    categories.forEach((cat) => {
        const entries = resources.resources?.[cat] || [];
        entries.forEach((entry: any) => {
            if (!entry?.sceneId || !Array.isArray(entry.results)) return;
            if (!byScene[entry.sceneId]) byScene[entry.sceneId] = [];
            byScene[entry.sceneId].push(...entry.results);
        });
    });
    return byScene;
};

const buildScenePreferredMediaUrls = (script: any, resources: any, basePath: string): string[] => {
    const scenes = flattenScenes(script);
    const localByScene = buildLocalResourcesByScene(resources);

    return scenes.map((scene: any) => {
        const selectedIds = Array.isArray(scene?.selectedResourceIds) && scene.selectedResourceIds.length > 0
            ? scene.selectedResourceIds
            : (scene?.selectedResourceId ? [scene.selectedResourceId] : []);

        const sceneCandidates = Array.isArray(scene?.resourceCandidates) ? scene.resourceCandidates : [];
        const mergedCandidates = [...sceneCandidates, ...(localByScene[scene?.id] || [])];

        const selectedCandidate = selectedIds.length > 0
            ? mergedCandidates.find((r: any) => selectedIds.includes(r?.id))
            : null;

        const selectedLocal = pickLocalPathFromResource(selectedCandidate);
        if (selectedLocal) return toProjectMediaUrl(basePath, selectedLocal);

        const firstLocal = mergedCandidates
            .map((r: any) => pickLocalPathFromResource(r))
            .find((p: string | null) => !!p);
        if (firstLocal) return toProjectMediaUrl(basePath, firstLocal);

        const selectedRemote = pickRemoteMediaUrlFromResource(selectedCandidate);
        if (selectedRemote) return selectedRemote;

        const firstRemote = mergedCandidates
            .map((r: any) => pickRemoteMediaUrlFromResource(r))
            .find((p: string | null) => !!p);
        if (firstRemote) return firstRemote;

        return null;
    }).filter(Boolean) as string[];
};

const forceLocalMediaOnMainVideoTrack = (otio: any, basePath: string, script: any, resources: any) => {
    const preferredUrls = buildScenePreferredMediaUrls(script, resources, basePath);
    if (preferredUrls.length === 0) return;

    const tracks = otio?.tracks?.children || [];
    for (const track of tracks) {
        if (track?.kind !== 'Video') continue;
        const clips = (track.children || []).filter((item: any) => item?.OTIO_SCHEMA?.startsWith('Clip'));
        if (clips.length === 0) continue;

        const isOverlayTrack = clips.every((clip: any) => !!clip?.metadata?.remotion_component);
        if (isOverlayTrack) continue;

        let clipIndex = 0;
        for (const item of (track.children || [])) {
            if (!item?.OTIO_SCHEMA?.startsWith('Clip')) continue;
            const preferredLocal = preferredUrls[clipIndex];
            clipIndex += 1;
            if (!preferredLocal) continue;

            const mediaRefKey = item.active_media_reference_key || 'DEFAULT_MEDIA';
            if (!item.media_references) item.media_references = {};
            if (!item.media_references[mediaRefKey]) {
                item.media_references[mediaRefKey] = {
                    OTIO_SCHEMA: 'ExternalReference.1',
                    target_url: preferredLocal
                };
            } else {
                item.media_references[mediaRefKey].target_url = preferredLocal;
            }
        }
        // Only force on the first primary video track
        break;
    }
};

const fixOtioPaths = (item: any, basePath: string, script?: any, resources?: any): any => {
    if (!item) return item;

    // Fix media references in current item
    if (item.media_references) {
        Object.keys(item.media_references).forEach(key => {
            const ref = item.media_references[key];
            if (ref && ref.target_url) {
                const rawUrl = String(ref.target_url);
                const normalized = rawUrl.replace(/\\/g, '/');
                if (!isExternalUrl(normalized)) {
                    ref.target_url = `${basePath}/${normalizeRelativePath(normalized)}`;
                } else {
                    ref.target_url = normalized;
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

    // Apply local-media override once at timeline root.
    if (item.OTIO_SCHEMA?.startsWith('Timeline')) {
        forceLocalMediaOnMainVideoTrack(item, basePath, script, resources);
    }

    return item;
};

const convertScriptToOtio = (script: any, resources: any, projectBase: string) => {
    const fps = 30;
    const scenes = flattenScenes(script);

    // Read aspect ratio from script metadata
    const ratio = script.metadata?.ratio || DEFAULT_ASPECT_RATIO;
    const aspectConfig = getAspectRatio(ratio);

    // Map resources by sceneId
    const localByScene = buildLocalResourcesByScene(resources);

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

        // Prefer local media from selected/manual resources, fallback to fetched remote URL, then placeholder.
        const selectedIds = Array.isArray(scene?.selectedResourceIds) && scene.selectedResourceIds.length > 0
            ? scene.selectedResourceIds
            : (scene?.selectedResourceId ? [scene.selectedResourceId] : []);
        const sceneCandidates = Array.isArray(scene?.resourceCandidates) ? scene.resourceCandidates : [];
        const mergedCandidates = [...sceneCandidates, ...(localByScene[scene?.id] || [])];

        const selectedCandidate = selectedIds.length > 0
            ? mergedCandidates.find((r: any) => selectedIds.includes(r?.id))
            : null;

        const selectedLocal = pickLocalPathFromResource(selectedCandidate);
        const firstLocal = mergedCandidates
            .map((r: any) => pickLocalPathFromResource(r))
            .find((p: string | null) => !!p);

        let mediaUrl = selectedLocal
            ? toProjectMediaUrl(projectBase, selectedLocal)
            : (firstLocal ? toProjectMediaUrl(projectBase, firstLocal) : null);

        if (!mediaUrl) {
            const fallbackRemote = selectedCandidate?.downloadUrl ||
                selectedCandidate?.downloadUrls?.hd ||
                selectedCandidate?.downloadUrls?.large ||
                selectedCandidate?.downloadUrls?.medium ||
                selectedCandidate?.url;
            mediaUrl = fallbackRemote || `https://placehold.co/${aspectConfig.width}x${aspectConfig.height}?text=${encodeURIComponent(scene.id)}`;
        }

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
