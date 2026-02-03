import { useState, useEffect } from 'react'
import { useProject } from './hooks/useProject'
import { useAudio } from './hooks/useAudio'
import { useResources } from './hooks/useResources'
import { Header } from './components/Header'
import { AudioPlayer } from './components/AudioPlayer'
import { ProjectList } from './components/ProjectList'
import { VoiceSettings } from './components/VoiceSettings'
import { SceneEditor } from './components/SceneEditor'
import { SceneOverview } from './components/SceneOverview'
import { MusicSettings } from './components/MusicSettings'
import { CaptionSettings } from './components/CaptionSettings'
import { Lightbox } from './components/Lightbox'

function App() {
    const [expandAllVisuals, setExpandAllVisuals] = useState(true)
    const [viewMode, setViewMode] = useState<'overview' | 'detail'>('detail')

    // Project management
    const {
        projectTitle,
        setProjectTitle,
        scriptData,
        setScriptData,
        resourcesData,
        filteredProjects,
        showProjectList,
        isLoadingProjects,
        searchQuery,
        setSearchQuery,
        loadProject,
        goBackToProjectList,
        reloadResources
    } = useProject()

    // Audio management
    const audioUrl = scriptData?.voice?.audioPath
        ? `/projects/${new URLSearchParams(window.location.search).get('project')}/${scriptData.voice.audioPath}`
        : null

    const {
        isPlaying,
        currentTime,
        duration,
        waveformRef,
        playFromTime,
        togglePlayPause
    } = useAudio(audioUrl)

    // Resource management
    const {
        sceneResourceIndex,
        setSceneResourceIndex,
        lightboxMedia,
        setLightboxMedia,
        getSceneResources
    } = useResources(resourcesData)

    // Manual save functionality
    const saveScript = async () => {
        console.log('💾 Save button clicked')
        const projectSlug = new URLSearchParams(window.location.search).get('project')

        console.log('Project:', projectSlug)
        console.log('Script Data exists:', !!scriptData)

        if (!projectSlug || !scriptData) {
            console.warn('Missing project or script data')
            return
        }

        try {
            console.log('Sending save request...')
            const response = await fetch('/api/save-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectSlug,
                    scriptData
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Save failed')
            }

            alert('✅ Đã lưu thành công!')
        } catch (error) {
            console.error('Save error:', error)
            alert('❌ Lỗi khi lưu file!')
        }
    }

    // Keyboard shortcut for save (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                saveScript()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [scriptData])

    // Toggle all visual settings
    const toggleAllVisuals = () => {
        const newState = !expandAllVisuals
        setExpandAllVisuals(newState)

        const allDetails = document.querySelectorAll('details.visual-config')
        allDetails.forEach(detail => {
            if (newState) {
                detail.setAttribute('open', '')
            } else {
                detail.removeAttribute('open')
            }
        })
    }

    // Show project list view
    if (showProjectList) {
        return (
            <ProjectList
                projects={filteredProjects}
                isLoading={isLoadingProjects}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectProject={loadProject}
            />
        )
    }

    const projectSlug = new URLSearchParams(window.location.search).get('project')

    return (
        <div className="bg-gray-50 text-gray-900 h-screen flex flex-col overflow-hidden font-sans">
            <Header
                projectTitle={projectTitle}
                onTitleChange={setProjectTitle}
                onBack={goBackToProjectList}
                scriptData={scriptData}
                expandAllVisuals={expandAllVisuals}
                onToggleVisuals={toggleAllVisuals}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSave={saveScript}
            />



            <AudioPlayer
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={togglePlayPause}
                waveformRef={waveformRef}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-12 pb-24">
                    {/* Notice Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500 rounded-full p-2 shrink-0">
                                <span className="material-symbols-outlined text-white text-[20px]">info</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                                    <span>💬 Cần thay đổi kịch bản?</span>
                                </h3>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Bạn có thể chat với <strong>Dio Director</strong> để đồng bộ lại timeline, tùy chỉnh kịch bản,
                                    thay đổi voice provider, hoặc regenerate resources. Chỉ cần nói với Dio những gì bạn muốn thay đổi!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Voice Settings - Only show in detail mode */}
                    {viewMode === 'detail' && <VoiceSettings voiceConfig={scriptData?.voice} />}

                    {/* Scene Editor/Overview */}
                    {scriptData?.sections && (
                        viewMode === 'overview' ? (
                            <SceneOverview
                                sections={scriptData.sections}
                                onPlayScene={playFromTime}
                                onSceneClick={(sectionIdx, sceneIdx) => {
                                    // Switch to detail mode when clicking a scene
                                    setViewMode('detail')
                                    // Optional: scroll to the scene (can be enhanced later)
                                }}
                            />
                        ) : (
                            <SceneEditor
                                sections={scriptData.sections}
                                scriptData={scriptData}
                                onPlayScene={playFromTime}
                                onUpdateScript={setScriptData}
                                getSceneResources={getSceneResources}
                                sceneResourceIndex={sceneResourceIndex}
                                onResourceIndexChange={(sceneId, index) =>
                                    setSceneResourceIndex(prev => ({ ...prev, [sceneId]: index }))
                                }
                                onLightboxOpen={(url, type, title) =>
                                    setLightboxMedia({ url, type, title })
                                }
                                onReloadResources={reloadResources}
                            />
                        )
                    )}

                    {/* Background Music Settings - Only show in detail mode */}
                    {viewMode === 'detail' && (
                        <MusicSettings
                            scriptData={scriptData}
                            projectSlug={projectSlug}
                            onUpdate={setScriptData}
                        />
                    )}

                    {/* Caption Settings - Only show in detail mode */}
                    {viewMode === 'detail' && (
                        <CaptionSettings
                            scriptData={scriptData}
                            onUpdate={setScriptData}
                        />
                    )}

                    {/* Add New Section Button */}
                    <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">post_add</span>
                        Add New Section
                    </button>
                </div>
            </main>

            {/* Lightbox Modal */}
            <Lightbox media={lightboxMedia} onClose={() => setLightboxMedia(null)} />
        </div>
    )
}

export default App
