import { useState, useRef, useEffect } from 'react'
import type { Section, ScriptData, ResourceCandidate } from '../types'
import { formatTime } from '../utils/formatters'
import { MediaLayerModal } from './MediaLayerModal'

interface SceneEditorProps {
    sections: Section[]
    scriptData: ScriptData | null
    onPlayScene: (time: number) => void
    onUpdateScript: (updatedData: ScriptData) => void
    getSceneResources: (sceneId: string) => ResourceCandidate[]
    sceneResourceIndex: Record<string, number>
    onResourceIndexChange: (sceneId: string, index: number) => void
    onLightboxOpen?: (url: string, type: 'image' | 'video', title?: string) => void
    onReloadResources: () => Promise<void>
}

export const SceneEditor = ({
    sections,
    scriptData,
    onPlayScene,
    onUpdateScript,
    getSceneResources,
    sceneResourceIndex,
    onResourceIndexChange,
    onReloadResources
}: SceneEditorProps) => {
    console.log('[SceneEditor] Rendered with sections:', sections?.length)
    const [dragOverScene, setDragOverScene] = useState<string | null>(null)
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
    const hasInitializedIndexes = useRef(false)
    const [mediaModalOpen, setMediaModalOpen] = useState<string | null>(null) // sceneId of open modal

    // Initialize sceneResourceIndex based on selectedResourceId from script.json
    // Only run once when project first loads
    useEffect(() => {
        if (!scriptData?.sections || hasInitializedIndexes.current) return

        const newIndex: Record<string, number> = {}

        scriptData.sections.forEach(section => {
            section.scenes?.forEach(scene => {
                if (scene.selectedResourceId) {
                    // Get all resources for this scene
                    const fetchedResources = getSceneResources(scene.id)
                    const manualResources = scene.resourceCandidates || []
                    // Use same logic as render: prioritize manual resources
                    const resources = manualResources.length > 0 ? manualResources : fetchedResources

                    // Find the index of the selected resource
                    const selectedIndex = resources.findIndex(r => r.id === scene.selectedResourceId)

                    // Only set if found, otherwise default to 0
                    if (selectedIndex !== -1) {
                        newIndex[scene.id] = selectedIndex
                    }
                }
            })
        })

        // Update the index if we found any selected resources
        if (Object.keys(newIndex).length > 0) {
            Object.entries(newIndex).forEach(([sceneId, index]) => {
                onResourceIndexChange(sceneId, index)
            })
        }

        hasInitializedIndexes.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptData?.metadata?.projectName])




    const clearResource = async (sceneId: string) => {
        if (!scriptData) return

        if (!window.confirm("The current media are not suitable? Clear them to find new ones with a new visual description.")) {
            return
        }

        // Reset the resource index FIRST to ensure UI updates immediately
        onResourceIndexChange(sceneId, 0)

        // Clear script.json (selectedResourceId and resourceCandidates)
        const newScript = { ...scriptData }
        newScript.sections?.forEach(sect =>
            sect.scenes?.forEach(s => {
                if (s.id === sceneId) {
                    s.selectedResourceId = undefined
                    s.selectedResourceIds = []
                    s.resourceCandidates = []
                }
            })
        )
        onUpdateScript(newScript)

        // Also clear fetched resources from resources.json
        const projectSlug = new URLSearchParams(window.location.search).get('project')
        if (projectSlug) {
            try {
                const response = await fetch('/api/clear-scene-resources', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectSlug,
                        sceneId
                    })
                })

                if (response.ok) {
                    // Reload resources to update UI
                    await onReloadResources()
                    console.log('✅ Resources cleared and reloaded for scene:', sceneId)
                } else {
                    console.error('Failed to clear fetched resources')
                }
            } catch (error) {
                console.error('Error clearing fetched resources:', error)
            }
        }
    }

    const updateSection = (idx: number, updates: Partial<Section>) => {
        if (!scriptData || !scriptData.sections) return
        const newScript = { ...scriptData }
        newScript.sections = [...newScript.sections!]
        newScript.sections[idx] = { ...newScript.sections[idx], ...updates }
        onUpdateScript(newScript)
    }

    const updateScene = (sectionIdx: number, sceneIdx: number, updates: any) => {
        if (!scriptData || !scriptData.sections) return
        const newScript = { ...scriptData }
        newScript.sections = [...newScript.sections!]

        const section = { ...newScript.sections[sectionIdx] }
        newScript.sections[sectionIdx] = section

        if (section.scenes) {
            section.scenes = [...section.scenes]
            section.scenes[sceneIdx] = { ...section.scenes[sceneIdx], ...updates }
        }

        onUpdateScript(newScript)
    }

    const handleFileSelect = async (sceneId: string, file: File) => {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
            alert('Please select an image or video file')
            return
        }

        try {
            // Get project slug from URL
            const projectSlug = new URLSearchParams(window.location.search).get('project')
            if (!projectSlug) {
                alert('No project selected')
                return
            }

            // Create FormData for upload
            const formData = new FormData()
            // IMPORTANT: projectSlug must be appended BEFORE file for Multer to access it in storage destination
            formData.append('projectSlug', projectSlug)
            formData.append('file', file)

            // Upload file to server
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Upload failed')
            }

            const result = await response.json()

            // Create a new resource with the server path
            const newResource: ResourceCandidate = {
                id: `uploaded-${Date.now()}`,
                type: isImage ? 'image' : 'video',
                source: 'local',
                localPath: result.path,
                title: file.name,
                width: 0,
                height: 0
            }

            // Add to scene's resourceCandidates
            if (!scriptData) return
            const newScript = { ...scriptData }
            newScript.sections = newScript.sections?.map(sect => ({
                ...sect,
                scenes: sect.scenes?.map(s => {
                    if (s.id === sceneId) {
                        return {
                            ...s,
                            resourceCandidates: [...(s.resourceCandidates || []), newResource],
                            selectedResourceId: newResource.id
                        }
                    }
                    return s
                })
            }))
            onUpdateScript(newScript)
        } catch (error) {
            console.error('Upload error:', error)
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const handleFileDrop = async (sceneId: string, file: File) => {
        await handleFileSelect(sceneId, file)
    }

    return (
        <>
            {sections.length > 0 ? (
                sections.map((section, sectionIdx) => (
                    <div key={section.id} className="flex flex-col gap-4">
                        {/* Sticky Section Header */}
                        <div className="sticky top-0 z-10 bg-gray-50 py-3 -mx-8 px-8 flex items-center justify-between border-b border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-lg font-bold text-gray-500 whitespace-nowrap">Section {sectionIdx + 1}:</span>
                                <input
                                    className="text-lg font-bold text-gray-800 bg-transparent border-none p-1 focus:ring-0 w-full placeholder-gray-400 rounded editable-input"
                                    type="text"
                                    value={section.name || ''}
                                    onChange={(e) => updateSection(sectionIdx, { name: e.target.value })}
                                />
                            </div>
                            {/* Timing - Compact by default, expand on hover */}
                            <div className="group/timing relative">
                                {/* Simple badge (default) */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-gray-600 font-mono text-xs font-semibold border border-gray-300 shadow-sm group-hover/timing:opacity-0 transition-opacity">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                                </div>
                                {/* Editable inputs (on hover) */}
                                <div className="absolute right-0 top-0 flex items-center gap-2 opacity-0 group-hover/timing:opacity-100 transition-opacity pointer-events-none group-hover/timing:pointer-events-auto">
                                    <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-16 px-2 py-1 text-xs font-mono font-semibold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                                        defaultValue={(section.startTime || 0).toFixed(2)}
                                        onBlur={(e) => updateSection(sectionIdx, { startTime: parseFloat(e.target.value) })}
                                        placeholder="Start"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-16 px-2 py-1 text-xs font-mono font-semibold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
                                        defaultValue={(section.endTime || 0).toFixed(2)}
                                        onBlur={(e) => updateSection(sectionIdx, { endTime: parseFloat(e.target.value) })}
                                        placeholder="End"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">
                                        ({((section.endTime || 0) - (section.startTime || 0)).toFixed(2)}s)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Scenes */}
                        {section.scenes && section.scenes.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                                {section.scenes.map((scene, sceneIdx) => {
                                    const fetchedResources = getSceneResources(scene.id)
                                    const manualResources = scene.resourceCandidates || []
                                    // If manual resources exist, only use those. Otherwise use fetched resources.
                                    const resources = manualResources.length > 0 ? manualResources : fetchedResources
                                    const currentIndex = sceneResourceIndex[scene.id] || 0
                                    const currentResource = resources[currentIndex]
                                    const selectedId = scene.selectedResourceId
                                    const projectSlug = new URLSearchParams(window.location.search).get('project')

                                    // Debug logging
                                    console.log(`[Scene ${scene.id}] Debug:`, {
                                        resourcesCount: resources.length,
                                        currentIndex,
                                        hasCurrentResource: !!currentResource,
                                        currentResourceId: currentResource?.id,
                                        selectedId,
                                        sceneResourceIndex: sceneResourceIndex[scene.id]
                                    })

                                    // Auto-set selectedResourceId if resources exist but no selection
                                    // This ensures preview shows immediately on first render
                                    // Only if NO selection exists at all
                                    if (resources.length > 0 && !selectedId && (!scene.selectedResourceIds || scene.selectedResourceIds.length === 0) && currentResource) {
                                        console.log(`[Scene ${scene.id}] Auto-setting selectedResourceId to:`, currentResource.id)
                                        // Use setTimeout to avoid updating state during render
                                        setTimeout(() => {
                                            const updates: any = {
                                                selectedResourceId: currentResource.id,
                                                selectedResourceIds: [currentResource.id]
                                            }
                                            updateScene(sectionIdx, sceneIdx, updates)
                                        }, 0)
                                    }

                                    const toggleSelection = (e: React.MouseEvent, resId: string) => {
                                        e.stopPropagation()
                                        let newIds = scene.selectedResourceIds ? [...scene.selectedResourceIds] : []

                                        // Migration: if empty but singular exists, start with it
                                        if (newIds.length === 0 && scene.selectedResourceId) {
                                            newIds.push(scene.selectedResourceId)
                                        }

                                        if (newIds.includes(resId)) {
                                            newIds = newIds.filter(id => id !== resId)
                                        } else {
                                            newIds.push(resId)
                                        }

                                        const updates: any = {
                                            selectedResourceIds: newIds,
                                            // Always keep singular in sync with first item for compat
                                            selectedResourceId: newIds.length > 0 ? newIds[0] : undefined
                                        }
                                        updateScene(sectionIdx, sceneIdx, updates)
                                    }

                                    const selectionOrder = scene.selectedResourceIds?.indexOf(currentResource?.id || '') ?? -1
                                    const isSelected = selectionOrder !== -1

                                    return (
                                        <div key={sceneIdx} className="p-5 hover:bg-gray-50/50 transition-colors group">
                                            <div className="flex flex-col gap-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono font-bold shrink-0">
                                                        {String(sceneIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <button
                                                        onClick={() => onPlayScene(scene.startTime)}
                                                        className="text-gray-300 hover:text-primary focus:outline-none transition-colors shrink-0"
                                                        title="Play Scene Audio"
                                                    >
                                                        <span className="material-symbols-outlined text-[22px]">play_circle</span>
                                                    </button>
                                                    <input
                                                        className="font-semibold text-gray-900 text-base bg-transparent border-none p-1 -ml-1 focus:ring-0 w-full rounded editable-input placeholder-gray-400 outline-none"
                                                        type="text"
                                                        value={scene.id || ''}
                                                        onChange={(e) => updateScene(sectionIdx, sceneIdx, { id: e.target.value })}
                                                    />
                                                    {/* Compact timing with hover-to-edit */}
                                                    <div className="group/scene-time relative shrink-0">
                                                        {/* Simple badge */}
                                                        <button className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 hover:border-primary/30 transition-all group-hover/scene-time:opacity-0">
                                                            {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                                                        </button>
                                                        {/* Editable inputs (on hover) */}
                                                        <div className="absolute right-0 top-0 flex items-center gap-1.5 opacity-0 group-hover/scene-time:opacity-100 transition-opacity pointer-events-none group-hover/scene-time:pointer-events-auto">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-14 px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-center shadow-sm"
                                                                defaultValue={(scene.startTime || 0).toFixed(2)}
                                                                onBlur={(e) => updateScene(sectionIdx, sceneIdx, { startTime: parseFloat(e.target.value) })}
                                                                placeholder="Start"
                                                            />
                                                            <span className="text-gray-300">-</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-14 px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-center shadow-sm"
                                                                defaultValue={(scene.endTime || (scene.startTime + scene.duration) || 0).toFixed(2)}
                                                                onBlur={(e) => updateScene(sectionIdx, sceneIdx, { endTime: parseFloat(e.target.value) })}
                                                                placeholder="End"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Voice Text */}
                                                {scene.text && (
                                                    <details className="group/voice open:bg-gray-50 rounded-lg border border-transparent open:border-gray-200 transition-all -mx-2 px-2">
                                                        <summary className="flex items-center gap-2 py-2 cursor-pointer text-sm select-none rounded hover:bg-gray-100 transition-colors">
                                                            <span className="material-symbols-outlined text-gray-400 text-[18px]">graphic_eq</span>
                                                            <span className="font-bold text-gray-600 text-xs uppercase tracking-wide min-w-fit">Voice Text</span>
                                                            <span className="text-gray-400 font-normal truncate group-open/voice:hidden ml-1">
                                                                {scene.text.substring(0, 60)}...
                                                            </span>
                                                            <div className="ml-auto opacity-0 group-hover/voice:opacity-100 group-open/voice:opacity-100 transition-opacity">
                                                                <span className="material-symbols-outlined text-gray-400 text-[18px] group-open/voice:rotate-180 transition-transform">expand_more</span>
                                                            </div>
                                                        </summary>
                                                        <div className="px-1 pb-3 pt-0">
                                                            <textarea
                                                                className="w-full text-sm text-gray-600 bg-transparent border-none p-2 focus:ring-0 resize-none rounded leading-relaxed placeholder-gray-400 focus:bg-white outline-none"
                                                                rows={3}
                                                                value={scene.text || ''}
                                                                onChange={(e) => updateScene(sectionIdx, sceneIdx, { text: e.target.value })}
                                                            ></textarea>
                                                            {scene.voiceNotes && (
                                                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                                    <strong>Voice Notes:</strong> {scene.voiceNotes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </details>
                                                )}

                                                {/* Visual Description */}
                                                <div className="flex gap-6 items-start">
                                                    <div className="flex-1 relative group/prompt">
                                                        <label className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2">
                                                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                                            Visual Description
                                                        </label>
                                                        <div className="relative">
                                                            <textarea
                                                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all placeholder-gray-400 resize-none leading-relaxed outline-none"
                                                                placeholder="Describe the scene in ENGLISH (for searchable) for AI to find matching media..."
                                                                rows={4}
                                                                value={scene.visualDescription || ''}
                                                                onChange={(e) => {
                                                                    const newDescription = e.target.value
                                                                    const updates: any = { visualDescription: newDescription }

                                                                    // Auto-update visualSuggestion.query if it exists
                                                                    if (scene.visualSuggestion) {
                                                                        updates.visualSuggestion = {
                                                                            ...scene.visualSuggestion,
                                                                            query: newDescription
                                                                        }
                                                                    }

                                                                    // Auto-update all visuals[].query if visuals array exists
                                                                    if (scene.visuals && scene.visuals.length > 0) {
                                                                        updates.visuals = scene.visuals.map(visual => ({
                                                                            ...visual,
                                                                            query: newDescription
                                                                        }))
                                                                    }

                                                                    updateScene(sectionIdx, sceneIdx, updates)
                                                                }}
                                                            ></textarea>
                                                            {scene.visualSuggestion && (
                                                                <details open className="mt-3 group/visual-config visual-config">
                                                                    <summary className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors select-none">
                                                                        <span className="material-symbols-outlined text-[16px] text-gray-400">tune</span>
                                                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Visual Settings</span>
                                                                        <span className="ml-auto text-[10px] text-gray-400 font-mono">
                                                                            {scene.visualSuggestion.type} · {scene.visualSuggestion.style}
                                                                        </span>
                                                                        <span className="material-symbols-outlined text-[18px] text-gray-400 group-open/visual-config:rotate-180 transition-transform">expand_more</span>
                                                                    </summary>
                                                                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
                                                                                <select
                                                                                    className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                                    value={scene.visualSuggestion?.type || 'stock'}
                                                                                    onChange={(e) => updateScene(sectionIdx, sceneIdx, { visualSuggestion: { ...scene.visualSuggestion, type: e.target.value } })}
                                                                                >
                                                                                    <option value="stock">Stock</option>
                                                                                    <option value="generated">AI Generated</option>
                                                                                    <option value="pinned">Pinned</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Query</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                                    value={scene.visualSuggestion?.query || ''}
                                                                                    onChange={(e) => updateScene(sectionIdx, sceneIdx, { visualSuggestion: { ...scene.visualSuggestion, query: e.target.value } })}
                                                                                    placeholder="Search query..."
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Style</label>
                                                                            <select
                                                                                className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                                value={scene.visualSuggestion?.style || 'none'}
                                                                                onChange={(e) => updateScene(sectionIdx, sceneIdx, { visualSuggestion: { ...scene.visualSuggestion, style: e.target.value } })}
                                                                            >
                                                                                <option value="zoom-in">Zoom In</option>
                                                                                <option value="zoom-out">Zoom Out</option>
                                                                                <option value="ken-burns">Ken Burns</option>
                                                                                <option value="fade">Fade</option>
                                                                                <option value="slide">Slide</option>
                                                                                <option value="none">None</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 w-36 flex flex-col gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide h-[18px] flex items-end">Preview</span>
                                                        <div
                                                            className={`w-full aspect-square rounded-lg bg-gray-100 border-2 overflow-hidden relative group/media shadow-sm transition-all ${dragOverScene === scene.id
                                                                ? 'border-primary border-dashed bg-primary/10'
                                                                : 'border-gray-200'
                                                                }`}
                                                            onDragOver={(e) => {
                                                                e.preventDefault()
                                                                setDragOverScene(scene.id)
                                                            }}
                                                            onDragLeave={() => setDragOverScene(null)}
                                                            onDrop={(e) => {
                                                                e.preventDefault()
                                                                setDragOverScene(null)
                                                                const file = e.dataTransfer.files[0]
                                                                if (file) handleFileDrop(scene.id, file)
                                                            }}
                                                        >
                                                            {/* Hidden File Input */}
                                                            <input
                                                                ref={(el) => {
                                                                    fileInputRefs.current[scene.id] = el
                                                                }}
                                                                type="file"
                                                                accept="image/*,video/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) {
                                                                        handleFileSelect(scene.id, file)
                                                                        e.target.value = '' // Reset input
                                                                    }
                                                                }}
                                                            />

                                                            {/* Hover Action Buttons */}
                                                            <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover/media:opacity-100 transition-opacity">
                                                                {/* Change/Upload Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        fileInputRefs.current[scene.id]?.click()
                                                                    }}
                                                                    className="bg-primary hover:bg-primary/90 text-white rounded-full size-7 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all"
                                                                    title="Upload media (Drag & Drop)"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                                                </button>

                                                                {/* Select Toggle Button */}
                                                                {resources.length > 0 && currentResource && (
                                                                    <button
                                                                        onClick={(e) => toggleSelection(e, currentResource.id)}
                                                                        className={`rounded-full size-7 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all ${isSelected
                                                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                            : 'bg-white hover:bg-gray-100 text-gray-400'
                                                                            }`}
                                                                        title={isSelected ? "Deselect" : "Select this resource"}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">
                                                                            {isSelected ? 'check' : 'add'}
                                                                        </span>
                                                                    </button>
                                                                )}

                                                                {/* Clear Button */}
                                                                {(scene.selectedResourceId || (scene.selectedResourceIds && scene.selectedResourceIds.length > 0)) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            clearResource(scene.id)
                                                                        }}
                                                                        className="bg-red-500 hover:bg-red-600 text-white rounded-full size-7 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all"
                                                                        title="Clear all media"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {resources.length > 0 ? (
                                                                <>
                                                                    {(() => {
                                                                        // Use currentResource or fallback to first resource
                                                                        const displayResource = currentResource || resources[0]

                                                                        console.log(`[Scene ${scene.id}] Preview render:`, {
                                                                            hasDisplayResource: !!displayResource,
                                                                            displayResourceId: displayResource?.id,
                                                                            displayResourceType: displayResource?.type,
                                                                            localPath: displayResource?.localPath,
                                                                            downloadUrl: displayResource?.downloadUrl,
                                                                            downloadUrls: displayResource?.downloadUrls,
                                                                            hasDownloadUrls: !!displayResource?.downloadUrls
                                                                        })

                                                                        if (!displayResource) {
                                                                            console.log(`[Scene ${scene.id}] No displayResource - returning null`)
                                                                            return null
                                                                        }

                                                                        // Handle both localPath and remote URLs
                                                                        let rawPath = displayResource.localPath || displayResource.downloadUrl

                                                                        // Fallback to downloadUrls object (for fetched resources)
                                                                        if (!rawPath && displayResource.downloadUrls) {
                                                                            rawPath = displayResource.downloadUrls['4k'] ||
                                                                                displayResource.downloadUrls.hd ||
                                                                                displayResource.downloadUrls.large ||
                                                                                displayResource.downloadUrls.medium ||
                                                                                displayResource.downloadUrls.original ||
                                                                                displayResource.downloadUrls.sd
                                                                        }

                                                                        // Last resort: use Pexels page URL (not ideal but better than nothing)
                                                                        if (!rawPath && displayResource.url) {
                                                                            rawPath = displayResource.url
                                                                        }

                                                                        // Use resource.type instead of file extension
                                                                        const isImage = displayResource.type === 'image'

                                                                        // Build resource path
                                                                        let resourcePath: string
                                                                        if (!rawPath) {
                                                                            // No path available - show placeholder
                                                                            resourcePath = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo media%3C/text%3E%3C/svg%3E'
                                                                        } else if (rawPath.startsWith('http') || rawPath.startsWith('blob:')) {
                                                                            // Already a full URL
                                                                            resourcePath = rawPath
                                                                        } else if (rawPath.startsWith('/Users/') || rawPath.startsWith('/home/')) {
                                                                            // Absolute path - extract relative portion after 'public/projects/'
                                                                            const match = rawPath.match(/public\/projects\/(.+)/)
                                                                            if (match) {
                                                                                resourcePath = `/projects/${match[1]}`
                                                                            } else {
                                                                                // Fallback: try to extract filename
                                                                                const filename = rawPath.split('/').pop()
                                                                                resourcePath = `/projects/${projectSlug}/uploads/${filename}`
                                                                            }
                                                                        } else {
                                                                            // Relative path
                                                                            resourcePath = `/projects/${projectSlug}/${rawPath}`
                                                                        }

                                                                        console.log(`[Scene ${scene.id}] Preview path:`, {
                                                                            rawPath,
                                                                            resourcePath,
                                                                            isImage
                                                                        })

                                                                        return (
                                                                            <div
                                                                                className="w-full h-full cursor-pointer relative group/media-container"
                                                                                onClick={() => {
                                                                                    // Open media layer modal instead of lightbox
                                                                                    setMediaModalOpen(scene.id)
                                                                                }}
                                                                            >
                                                                                {/* Drag Overlay */}
                                                                                {dragOverScene === scene.id && (
                                                                                    <div className="absolute inset-0 z-20 bg-primary/20 backdrop-blur-sm flex items-center justify-center border-2 border-primary border-dashed rounded">
                                                                                        <div className="text-center">
                                                                                            <span className="material-symbols-outlined text-5xl text-primary animate-bounce block mb-2">upload</span>
                                                                                            <p className="text-primary font-bold text-sm">Drop to replace</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Media Content - Show 3D fan stack if multiple selected */}
                                                                                {(() => {
                                                                                    const selectedIds = scene.selectedResourceIds || 
                                                                                        (scene.selectedResourceId ? [scene.selectedResourceId] : [])
                                                                                    
                                                                                    // If multiple layers selected, show them in card stack (like playing cards)
                                                                                    if (selectedIds.length > 1) {
                                                                                        const selectedResources = selectedIds
                                                                                            .map(id => resources.find(r => r.id === id))
                                                                                            .filter(Boolean) as ResourceCandidate[]
                                                                                        
                                                                                        return (
                                                                                            <div className="w-full h-full relative flex items-center justify-center">
                                                                                                {selectedResources.map((res, idx) => {
                                                                                                    const isImg = res.type === 'image'
                                                                                                    let rawPath = res.localPath || res.downloadUrl
                                                                                                    
                                                                                                    if (!rawPath && res.downloadUrls) {
                                                                                                        rawPath = res.downloadUrls['4k'] ||
                                                                                                            res.downloadUrls.hd ||
                                                                                                            res.downloadUrls.large ||
                                                                                                            res.downloadUrls.medium ||
                                                                                                            res.downloadUrls.original ||
                                                                                                            res.downloadUrls.sd
                                                                                                    }
                                                                                                    
                                                                                                    if (!rawPath && res.url) {
                                                                                                        rawPath = res.url
                                                                                                    }
                                                                                                    
                                                                                                    let resPath: string
                                                                                                    if (!rawPath) {
                                                                                                        resPath = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
                                                                                                    } else if (rawPath.startsWith('http') || rawPath.startsWith('blob:')) {
                                                                                                        resPath = rawPath
                                                                                                    } else if (rawPath.startsWith('/Users/') || rawPath.startsWith('/home/')) {
                                                                                                        const match = rawPath.match(/public\/projects\/(.+)/)
                                                                                                        if (match) {
                                                                                                            resPath = `/projects/${match[1]}`
                                                                                                        } else {
                                                                                                            const filename = rawPath.split('/').pop()
                                                                                                            resPath = `/projects/${projectSlug}/uploads/${filename}`
                                                                                                        }
                                                                                                    } else {
                                                                                                        resPath = `/projects/${projectSlug}/${rawPath}`
                                                                                                    }
                                                                                                    
                                                                                                    // Calculate card stack offset (like playing cards)
                                                                                                    const totalVisible = selectedResources.length
                                                                                                    const offsetX = idx * 25 // Horizontal offset (stagger right)
                                                                                                    const offsetY = idx * 25 // Vertical offset (stagger down)
                                                                                                    
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={res.id}
                                                                                                            className="absolute rounded-lg overflow-hidden shadow-xl border-2 border-white transition-all duration-300 ease-out"
                                                                                                            style={{
                                                                                                                width: '75%',
                                                                                                                height: '75%',
                                                                                                                left: `${offsetX}px`,
                                                                                                                top: `${offsetY}px`,
                                                                                                                zIndex: totalVisible - idx,
                                                                                                                boxShadow: `${idx * 3}px ${idx * 3}px ${10 + idx * 5}px rgba(0,0,0,${0.2 + idx * 0.05})`
                                                                                                            }}
                                                                                                        >
                                                                                                            {isImg ? (
                                                                                                                <img
                                                                                                                    src={resPath}
                                                                                                                    alt={res.title || 'Layer'}
                                                                                                                    className="w-full h-full object-cover"
                                                                                                                />
                                                                                                            ) : (
                                                                                                                <video
                                                                                                                    src={resPath}
                                                                                                                    className="w-full h-full object-cover"
                                                                                                                    muted
                                                                                                                    loop
                                                                                                                />
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        )
                                                                                    }
                                                                                    
                                                                                    // Single media - show normally
                                                                                    return isImage ? (
                                                                                        <img
                                                                                            src={resourcePath}
                                                                                            alt={displayResource.title || 'Preview'}
                                                                                            className="w-full h-full object-cover"
                                                                                            onError={(e) => {
                                                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E?%3C/text%3E%3C/svg%3E'
                                                                                            }}
                                                                                        />
                                                                                    ) : (
                                                                                        <video
                                                                                            src={resourcePath}
                                                                                            className="w-full h-full object-cover"
                                                                                            muted
                                                                                            loop
                                                                                            onMouseEnter={(e) => e.currentTarget.play()}
                                                                                            onMouseLeave={(e) => e.currentTarget.pause()}
                                                                                        />
                                                                                    )
                                                                                })()}

                                                                                {/* Counter & Type Badge */}
                                                                                {resources.length > 0 && (
                                                                                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 z-10">
                                                                                        {resources.length > 1 && (
                                                                                            <div className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono backdrop-blur-sm">
                                                                                                {currentIndex + 1}/{resources.length}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm flex items-center gap-0.5 ml-auto">
                                                                                            <span className="material-symbols-outlined text-[10px]">
                                                                                                {isImage ? 'image' : 'videocam'}
                                                                                            </span>
                                                                                            {isImage ? 'IMG' : 'VID'}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })()}
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                                                    <div className="text-center p-2">
                                                                        {dragOverScene === scene.id ? (
                                                                            <>
                                                                                <span className="material-symbols-outlined text-4xl mb-1 block text-primary animate-bounce">upload</span>
                                                                                <p className="text-primary font-medium">Drop file here</p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span className="material-symbols-outlined text-3xl mb-1 block opacity-30">add_photo_alternate</span>
                                                                                <p className="opacity-50">No media</p>
                                                                                <p className="text-[9px] opacity-30 mt-1">Drag & drop file</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <button className="w-full py-3 text-sm font-medium text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border-t border-gray-50">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Add Scene to {section.name}
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-6xl mb-4">description</span>
                    <p>No script data loaded.</p>
                </div>
            )}

            {/* Media Layer Modal */}
            {mediaModalOpen && (() => {
                console.log('[SceneEditor] Opening modal for scene:', mediaModalOpen)
                const projectSlug = new URLSearchParams(window.location.search).get('project')
                
                // Find the scene
                let targetScene: any = null
                let targetSectionIdx = -1
                let targetSceneIdx = -1
                
                scriptData?.sections?.forEach((section, sectionIdx) => {
                    section.scenes?.forEach((scene, sceneIdx) => {
                        if (scene.id === mediaModalOpen) {
                            targetScene = scene
                            targetSectionIdx = sectionIdx
                            targetSceneIdx = sceneIdx
                        }
                    })
                })

                if (!targetScene) return null

                const fetchedResources = getSceneResources(targetScene.id)
                const manualResources = targetScene.resourceCandidates || []
                const resources = manualResources.length > 0 ? manualResources : fetchedResources
                const selectedIds = targetScene.selectedResourceIds || 
                    (targetScene.selectedResourceId ? [targetScene.selectedResourceId] : [])

                return (
                    <MediaLayerModal
                        isOpen={true}
                        onClose={() => setMediaModalOpen(null)}
                        sceneId={targetScene.id}
                        sceneName={targetScene.name || targetScene.id}
                        resources={resources}
                        selectedResourceIds={selectedIds}
                        onUpdateSelection={(newIds) => {
                            updateScene(targetSectionIdx, targetSceneIdx, {
                                selectedResourceIds: newIds,
                                selectedResourceId: newIds.length > 0 ? newIds[0] : undefined
                            })
                        }}
                        onUploadFile={async (file) => {
                            await handleFileSelect(targetScene.id, file)
                        }}
                        projectSlug={projectSlug}
                    />
                )
            })()}
        </>
    )
}
