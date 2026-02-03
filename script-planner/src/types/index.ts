/**
 * Root structure for script.json file.
 * All edits in the planner should update this structure and persist via save.
 */
export interface ScriptData {
    metadata?: {
        projectName?: string
        videoType?: string
        description?: string
        duration?: number  // Renamed from totalDuration
        ratio?: string
        width?: number
        height?: number
        platform?: string
        createdAt?: string  // Renamed from updatedAt
    }
    script?: {
        fullText?: string
        wordCount?: number
        estimatedDuration?: number
    }
    userResources?: any[]
    sections?: Section[]
    voice?: VoiceConfig
    music?: MusicConfig
    subtitle?: SubtitleConfig
}

export interface Section {
    id: string
    name: string
    startTime: number
    endTime: number
    duration: number
    pace?: string
    scenes?: Scene[]
}

/**
 * Represents a single scene within a section.
 * All fields are persisted to script.json.
 */
export interface Scene {
    /** Unique identifier for the scene */
    id: string
    /** Optional human-readable name for the scene */
    name?: string
    /** Scene type: title-card for intro/section breaks, media for content */
    type?: 'title-card' | 'media'
    /** Start time in seconds */
    startTime: number
    /** End time in seconds */
    endTime: number
    /** Duration in seconds (endTime - startTime) */
    duration: number
    /** Voice-over text for this scene */
    text?: string
    /** Additional notes for voice generation */
    voiceNotes?: string
    /** Description of visual content for AI resource search */
    visualDescription?: string
    /** Visual settings for this scene */
    visualSuggestion?: VisualSuggestion
    /** Visuals array for stock/pinned/ai-generated resources */
    visuals?: Visual[]
    /** Title card configuration (only for type='title-card') */
    titleConfig?: TitleConfig
    /** Title overlay configuration for text overlays on media */
    titleOverlay?: TitleOverlay
    /** Manually uploaded or fetched resources for this scene */
    resourceCandidates?: ResourceCandidate[]
    /** ID of the currently selected resource - MUST be set to persist selection across reloads */
    selectedResourceId?: string
    /** IDs of multiple selected resources for this scene */
    selectedResourceIds?: string[]
}

export interface VisualSuggestion {
    type?: string
    query?: string
    style?: string
}

export interface Visual {
    type?: 'stock' | 'pinned' | 'ai-generated'
    query?: string
    style?: string
}

export interface TitleConfig {
    text?: string
    subtitle?: string
    theme?: string
}

export interface TitleOverlay {
    enabled: boolean
    style?: string
    animation?: string
    text?: string
}

export interface SubtitleConfig {
    enabled: boolean
    style?: string
    position?: string
    font?: string
    fontSize?: number
    highlightColor?: string
}

export interface ResourceCandidate {
    id: string
    type: string
    source: string
    localPath?: string
    url?: string  // Pexels video/image page URL (fallback)
    downloadUrl?: string
    downloadUrls?: {
        medium?: string
        large?: string
        original?: string
        hd?: string
        sd?: string
        '4k'?: string
    }
    width?: number
    height?: number
    title?: string
}

export interface VoiceConfig {
    audioPath?: string
    provider?: string
    voiceName?: string
    voiceId?: string
    styleInstruction?: string
}

export interface MusicConfig {
    enabled?: boolean
    mood?: string
    query?: string
    volume?: number
    fadeIn?: number
    fadeOut?: number
    title?: string
    trackName?: string
    trackPath?: string
    path?: string
    description?: string
    candidates?: MusicCandidate[]
    selectedMusicId?: string
    importedMusicPath?: string
}

export interface MusicCandidate {
    id: string
    title: string
    url?: string
    localPath?: string
    downloadUrl?: string
    duration?: number
    genre?: string
    tags?: string[]
}

export interface ProjectInfo {
    name: string
    displayName: string
    updatedAt: string
    duration?: number
}

export interface ResourcesData {
    resources?: {
        images?: ResourceEntry[]
        videos?: ResourceEntry[]
        generatedImages?: ResourceEntry[]
        pinnedResources?: ResourceEntry[]
    }
}

export interface ResourceEntry {
    sceneId: string
    results?: ResourceCandidate[]
}

export interface LightboxMedia {
    url: string
    type: 'image' | 'video'
    title?: string
}
