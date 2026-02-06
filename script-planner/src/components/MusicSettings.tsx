import { useRef, useState, useEffect, useMemo } from 'react'
import type { MusicConfig, ScriptData } from '../types'

interface MusicSettingsProps {
    scriptData: ScriptData | null
    projectSlug: string | null
    onUpdate: (updatedData: ScriptData) => void
}

export const MusicSettings = ({ scriptData, projectSlug, onUpdate }: MusicSettingsProps) => {
    const [isMusicPlaying, setIsMusicPlaying] = useState(false)
    const [musicProgress, setMusicProgress] = useState(0)
    const [musicDuration, setMusicDuration] = useState(0)
    const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0)
    const [hasInitializedIndex, setHasInitializedIndex] = useState(false)
    const musicAudioRef = useRef<HTMLAudioElement>(null)

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === Infinity) return '00:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const musicCandidates = scriptData?.music?.candidates || []
    // const selectedMusicId = scriptData?.music?.selectedMusicId
    const importedMusicPath = scriptData?.music?.importedMusicPath

    // Get current music source (memoized to detect changes)
    const currentMusicSource = useMemo(() => {
        if (importedMusicPath && projectSlug) {
            return `/projects/${projectSlug}/${importedMusicPath}`
        }

        if (musicCandidates.length > 0) {
            const candidate = musicCandidates[currentCandidateIndex]

            // Priority 1: Use localPath if available (already downloaded)
            if (candidate?.localPath && projectSlug) {
                return `/projects/${projectSlug}/${candidate.localPath}`
            }

            // Priority 2: Stream from downloadUrl if no localPath (not downloaded yet)
            if (candidate?.downloadUrl) {
                // Use proxy endpoint to avoid CORS issues and enable caching
                const encodedUrl = encodeURIComponent(candidate.downloadUrl)
                return `/api/music-proxy?url=${encodedUrl}&projectSlug=${projectSlug}&musicId=${candidate.id}`
            }
        }

        return null
    }, [importedMusicPath, projectSlug, musicCandidates, currentCandidateIndex])

    // Sync currentCandidateIndex with selectedMusicId from scriptData on mount/load
    useEffect(() => {
        const selectedId = scriptData?.music?.selectedMusicId
        if (selectedId && musicCandidates.length > 0 && !hasInitializedIndex) {
            const index = musicCandidates.findIndex(c => c.id === selectedId)
            if (index !== -1) {
                setCurrentCandidateIndex(index)
                setHasInitializedIndex(true)
            }
        }
    }, [scriptData?.music?.selectedMusicId, musicCandidates, hasInitializedIndex])

    // Reset initialization flag if candidates change significantly
    useEffect(() => {
        setHasInitializedIndex(false)
    }, [musicCandidates.length])

    // Debug: Log music source changes
    useEffect(() => {
        console.log('[MusicSettings] Music source changed:', {
            currentMusicSource,
            currentCandidateIndex,
            candidate: musicCandidates[currentCandidateIndex],
            importedMusicPath
        })
    }, [currentMusicSource, currentCandidateIndex, musicCandidates, importedMusicPath])

    // Auto-play when changing track
    useEffect(() => {
        const audio = musicAudioRef.current
        if (!audio || !currentMusicSource) return

        const handleLoadedData = () => {
            audio.currentTime = 0
            audio.play().catch(() => {
                // Ignore autoplay errors (browser restrictions)
            })
        }

        audio.addEventListener('loadeddata', handleLoadedData)
        audio.load() // Trigger load

        return () => {
            audio.removeEventListener('loadeddata', handleLoadedData)
        }
    }, [currentMusicSource])

    // Sync volume to audio element
    useEffect(() => {
        if (musicAudioRef.current && scriptData?.music?.volume !== undefined) {
            musicAudioRef.current.volume = scriptData.music.volume
        }
    }, [scriptData?.music?.volume])

    const updateMusic = (updates: Partial<MusicConfig>) => {
        if (!scriptData) return
        const newScript = { ...scriptData }
        if (!newScript.music) {
            newScript.music = { enabled: true, volume: 0.2, fadeIn: 2, fadeOut: 2 }
        }
        // Ensure enabled is present if not already there
        if (newScript.music.enabled === undefined) {
            newScript.music.enabled = true
        }
        newScript.music = { ...newScript.music, ...updates }
        onUpdate(newScript)
    }

    const clearMusicSelection = async () => {
        if (!confirm('Clear music selection? This will remove the selected music and any downloaded files.')) {
            return
        }

        // Clear selection in script
        updateMusic({
            selectedMusicId: undefined,
            importedMusicPath: undefined,
            title: undefined
        })

        // Stop playing
        if (musicAudioRef.current) {
            musicAudioRef.current.pause()
            setIsMusicPlaying(false)
        }

        // Call API to clear downloads
        if (projectSlug) {
            try {
                await fetch('/api/clear-music-downloads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectSlug })
                })
            } catch (error) {
                console.error('Failed to clear music downloads:', error)
            }
        }
    }

    const handleSlideToTrack = (newIndex: number) => {
        setCurrentCandidateIndex(newIndex)

        // Auto-select the new track
        const newCandidate = musicCandidates[newIndex]
        if (newCandidate) {
            updateMusic({
                selectedMusicId: newCandidate.id,
                title: newCandidate.title
            })
        }
    }

    const currentCandidate = musicCandidates[currentCandidateIndex]
    const hasImported = !!importedMusicPath

    return (
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-cyan-600 text-[24px]">music_note</span>
                        <h2 className="text-lg font-bold text-gray-800">Background Music</h2>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Enable Music</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={scriptData?.music?.enabled ?? true}
                                onChange={(e) => updateMusic({ enabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Music Candidates Carousel with Integrated Player */}
                {musicCandidates.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <span className="material-symbols-outlined text-[18px] text-cyan-500">library_music</span>
                                Music Candidates ({musicCandidates.length})
                            </label>
                            {hasImported && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    ✓ Imported
                                </span>
                            )}
                        </div>

                        <div className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200 p-6 shadow-sm">
                            {/* Navigation Arrows */}
                            {musicCandidates.length > 1 && (
                                <>
                                    <button
                                        onClick={() => handleSlideToTrack((currentCandidateIndex - 1 + musicCandidates.length) % musicCandidates.length)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-cyan-50 hover:scale-110 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[24px] text-cyan-600">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={() => handleSlideToTrack((currentCandidateIndex + 1) % musicCandidates.length)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-cyan-50 hover:scale-110 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[24px] text-cyan-600">chevron_right</span>
                                    </button>
                                </>
                            )}

                            {/* Current Track with Player */}
                            <div className="flex items-center gap-6 px-8">
                                {/* Album Art */}
                                <div className="size-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                                    <span className="material-symbols-outlined text-[48px]">audio_file</span>
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xl text-gray-900 truncate mb-1">
                                        {currentCandidate?.title || 'Unknown Track'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                        {currentCandidate?.genre && (
                                            <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                                                {currentCandidate.genre}
                                            </span>
                                        )}
                                        {currentCandidate?.duration && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                {Math.floor(currentCandidate.duration / 60)}:{String(currentCandidate.duration % 60).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {currentCandidate?.tags && currentCandidate.tags.length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            {currentCandidate.tags.slice(0, 4).map((tag, i) => (
                                                <span key={i} className="bg-white/60 text-cyan-700 px-2 py-0.5 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Player Controls */}
                                {currentMusicSource && (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <audio
                                            ref={musicAudioRef}
                                            src={currentMusicSource}
                                            onPlay={() => setIsMusicPlaying(true)}
                                            onPause={() => setIsMusicPlaying(false)}
                                            onTimeUpdate={(e) => setMusicProgress(e.currentTarget.currentTime)}
                                            onLoadedMetadata={(e) => setMusicDuration(e.currentTarget.duration)}
                                            onEnded={() => setIsMusicPlaying(false)}
                                            className="hidden"
                                        />

                                        {/* Play Button + Visualizer */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => isMusicPlaying ? musicAudioRef.current?.pause() : musicAudioRef.current?.play()}
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-[28px]">
                                                    {isMusicPlaying ? 'pause' : 'play_arrow'}
                                                </span>
                                            </button>

                                            {/* Visualizer */}
                                            <div className="flex items-end gap-[2px] h-10 flex-1">
                                                {[...Array(12)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 rounded-t bg-cyan-600 transition-all duration-100"
                                                        style={{
                                                            height: isMusicPlaying ? `${30 + Math.random() * 70}%` : '30%',
                                                            opacity: (musicProgress / (musicDuration || 1)) > (i / 12) ? 1 : 0.25
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Progress Slider */}
                                        <div className="space-y-1">
                                            <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden group cursor-pointer">
                                                {/* Progress Bar */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                                                    style={{ width: `${(musicProgress / (musicDuration || 1)) * 100}%` }}
                                                ></div>

                                                {/* Seek Slider */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={musicDuration || 100}
                                                    step="0.1"
                                                    value={musicProgress}
                                                    onChange={(e) => {
                                                        const newTime = parseFloat(e.target.value)
                                                        if (musicAudioRef.current) {
                                                            musicAudioRef.current.currentTime = newTime
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>

                                            {/* Time Display */}
                                            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                                <span>{formatTime(musicProgress)}</span>
                                                <span>{formatTime(musicDuration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Clear Button */}
                                <button
                                    onClick={clearMusicSelection}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1 shrink-0"
                                    title="Clear selection"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                    Clear
                                </button>
                            </div>

                            {/* Progress Dots */}
                            {musicCandidates.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {musicCandidates.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSlideToTrack(idx)}
                                            className={`h-2 rounded-full transition-all ${idx === currentCandidateIndex
                                                ? 'w-8 bg-cyan-600'
                                                : 'w-2 bg-cyan-300 hover:bg-cyan-400'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Description & Search Tags */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <span className="material-symbols-outlined text-[18px] text-purple-500">auto_awesome</span>
                            Music Mood
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-sm"
                            placeholder="e.g., Sad, Epic, Happy..."
                            value={scriptData?.music?.mood || ''}
                            onChange={(e) => updateMusic({ mood: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <span className="material-symbols-outlined text-[18px] text-blue-500">search</span>
                            Search Query
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-sm"
                            placeholder="e.g., emotional piano, cinematic strings..."
                            value={scriptData?.music?.query || ''}
                            onChange={(e) => updateMusic({ query: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <span className="material-symbols-outlined text-[18px] text-purple-500">description</span>
                        AI Music Description
                    </label>
                    <textarea
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-sm min-h-[80px]"
                        placeholder="Describe the mood, instruments, or style you want for the music..."
                        value={scriptData?.music?.description || ''}
                        onChange={(e) => updateMusic({ description: e.target.value })}
                    />
                </div>

                {/* Volume & Fade Controls */}
                <div className="grid grid-cols-2 gap-8">
                    {/* Volume Control */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                            MASTER VOLUME
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                className="text-gray-400 hover:text-cyan-600 transition-colors"
                                onClick={() => {
                                    const currentVolume = scriptData?.music?.volume || 0
                                    updateMusic({ volume: currentVolume === 0 ? 0.2 : 0 })
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    {(scriptData?.music?.volume || 0) === 0 ? 'volume_off' :
                                        (scriptData?.music?.volume || 0) < 0.5 ? 'volume_down' : 'volume_up'}
                                </span>
                            </button>
                            <div className="relative flex-1 h-2 bg-gray-100 rounded-full group cursor-pointer">
                                <div
                                    className="absolute top-0 left-0 h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${(scriptData?.music?.volume || 0) * 100}%` }}
                                ></div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    value={scriptData?.music?.volume || 0.2}
                                    onChange={(e) => updateMusic({ volume: parseFloat(e.target.value) })}
                                />
                            </div>
                            <span className="text-xs font-mono font-medium text-gray-600 w-8 text-right">
                                {Math.round((scriptData?.music?.volume || 0) * 100)}%
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                            Recommended: 10-20% for background music.
                        </p>
                    </div>

                    {/* Fade Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Fade In (s)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-cyan-500 outline-none text-sm"
                                    value={scriptData?.music?.fadeIn || 0}
                                    onChange={(e) => updateMusic({ fadeIn: parseFloat(e.target.value) })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">s</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Fade Out (s)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-cyan-500 outline-none text-sm"
                                    value={scriptData?.music?.fadeOut || 0}
                                    onChange={(e) => updateMusic({ fadeOut: parseFloat(e.target.value) })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
