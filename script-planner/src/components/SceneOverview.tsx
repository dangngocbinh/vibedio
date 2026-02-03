import type { Section } from '../types'
import { formatTime } from '../utils/formatters'

interface SceneOverviewProps {
    sections: Section[]
    onPlayScene: (time: number) => void
    onSceneClick?: (sectionIdx: number, sceneIdx: number) => void
}

export const SceneOverview = ({ sections, onPlayScene, onSceneClick }: SceneOverviewProps) => {
    return (
        <div className="space-y-4">
            {sections.length > 0 ? (
                sections.map((section, sectionIdx) => (
                    <div key={section.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-bold">
                                        {String(sectionIdx + 1).padStart(2, '0')}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{section.name}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px] text-gray-500">movie</span>
                                        <span className="text-sm font-semibold text-gray-700">
                                            {section.scenes?.length || 0} scenes
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 shadow-sm font-mono text-sm font-semibold text-gray-700">
                                        <span className="material-symbols-outlined text-[16px] text-gray-500">schedule</span>
                                        {formatTime(section.startTime)} - {formatTime(section.endTime)}
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({((section.endTime || 0) - (section.startTime || 0)).toFixed(1)}s)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scenes List */}
                        {section.scenes && section.scenes.length > 0 && (
                            <div className="divide-y divide-gray-100">
                                {section.scenes.map((scene, sceneIdx) => (
                                    <div
                                        key={scene.id}
                                        className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => onSceneClick?.(sectionIdx, sceneIdx)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Scene Number & Play Button */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="bg-gray-100 text-gray-600 rounded px-2 py-1 text-xs font-mono font-bold min-w-[32px] text-center">
                                                    {String(sceneIdx + 1).padStart(2, '0')}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onPlayScene(scene.startTime)
                                                    }}
                                                    className="text-gray-300 hover:text-primary focus:outline-none transition-colors"
                                                    title="Play Scene Audio"
                                                >
                                                    <span className="material-symbols-outlined text-[24px]">play_circle</span>
                                                </button>
                                            </div>

                                            {/* Scene Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Scene ID & Timing */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-gray-900 text-sm">{scene.id}</h4>
                                                    <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                                        {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                                                        <span className="text-gray-300 ml-1">
                                                            ({((scene.endTime || 0) - (scene.startTime || 0)).toFixed(1)}s)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Voice Text Preview */}
                                                {scene.text && (
                                                    <div className="mb-2">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="material-symbols-outlined text-[14px] text-gray-400">graphic_eq</span>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Voice Text</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                            {scene.text}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Visual Description Preview */}
                                                {scene.visualDescription && (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Visual</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 line-clamp-1 italic">
                                                            {scene.visualDescription}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow Icon */}
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
        </div>
    )
}
