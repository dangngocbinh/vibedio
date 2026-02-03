import type { ScriptData, SubtitleConfig } from '../types'

interface CaptionSettingsProps {
    scriptData: ScriptData | null
    onUpdate: (updatedData: ScriptData) => void
}

export const CaptionSettings = ({ scriptData, onUpdate }: CaptionSettingsProps) => {
    const subtitleConfig = scriptData?.subtitle || { enabled: true }

    const updateSubtitle = (updates: Partial<SubtitleConfig>) => {
        if (!scriptData) return
        const newScript = {
            ...scriptData,
            subtitle: {
                ...subtitleConfig,
                ...updates
            }
        }
        onUpdate(newScript)
    }

    return (
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-pink-600 text-[24px]">subtitles</span>
                        <h2 className="text-lg font-bold text-gray-800">Caption Settings</h2>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Enable Captions</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={subtitleConfig.enabled}
                                onChange={(e) => updateSubtitle({ enabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </div>
                    </label>
                </div>
            </div>
            {subtitleConfig.enabled && (
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-3">Caption Style</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'highlight-word', name: 'Highlight Word', desc: 'Professional, clean aesthetic', tagClass: 'bg-white rounded-full px-4 py-1.5 shadow-sm', sampleText: <><span className="text-xs font-bold text-gray-800">Sample <span className="text-pink-600">Text</span></span></> },
                                { id: 'clean-minimal', name: 'Clean Minimal', desc: 'Simple, easy to read', tagClass: 'bg-white rounded-full px-4 py-1.5 shadow-sm', sampleText: <><span className="text-xs font-bold text-gray-800">Sample <span className="text-gray-400">Text</span></span></> },
                                { id: 'gold-bold', name: 'Gold Bold', desc: 'Attention-grabbing, high contrast', bgClass: 'bg-gray-800', sampleText: <span className="text-sm font-black uppercase" style={{ color: '#FFD700', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}>SAMPLE <span className="text-white">TEXT</span></span> },
                                { id: 'drop-green', name: 'Drop Green', desc: 'Dynamic, energetic', bgClass: 'bg-gray-700', sampleText: <span className="text-sm font-black uppercase text-gray-900" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>SAMPLE <span className="text-green-500">TEXT</span></span> },
                                { id: 'red-box', name: 'Red Box', desc: 'Emphasis, important points', bgClass: 'bg-gray-800', sampleText: <span className="text-sm font-bold uppercase text-white" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>SAMPLE <span className="bg-red-600 px-2 py-0.5 rounded">TEXT</span></span> },
                                { id: 'impact-yellow', name: 'Impact Yellow', desc: 'Maximum impact, viral', bgClass: 'bg-black', sampleText: <span className="text-base font-black uppercase" style={{ color: '#FCD34D', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.9)' }}><span className="text-white">WOW</span></span> },
                                { id: 'neon-glow', name: 'Neon Glow', desc: 'Tech, futuristic', bgClass: 'bg-gray-900', sampleText: <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#06b6d4', textShadow: '0 0 10px cyan' }}>SAMPLE <span style={{ color: '#f0abfc', textShadow: '0 0 10px #f0abfc' }}>TEXT</span></span> },
                                { id: 'story-elegant', name: 'Story Elegant', desc: 'Storytelling, emotional', bgClass: 'bg-gradient-to-br from-purple-900 to-blue-900', sampleText: <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Georgia, serif', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>Sample <span style={{ color: '#fbbf24' }}>Text</span></span> },
                                { id: 'minimal-dark', name: 'Minimal Dark', desc: 'Aesthetic, minimalist', bgClass: 'bg-white border border-gray-200', sampleText: <span className="text-sm font-semibold text-gray-600">Sample <span className="text-gray-900">Text</span></span> }
                            ].map((style) => (
                                <label key={style.id} className="relative group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="caption-style"
                                        value={style.id}
                                        className="sr-only peer"
                                        checked={subtitleConfig.style === style.id}
                                        onChange={() => updateSubtitle({ style: style.id })}
                                    />
                                    <div className="border-2 border-gray-200 rounded-lg p-4 peer-checked:border-pink-500 peer-checked:bg-pink-50/20 hover:border-gray-300 transition-all h-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-gray-800">{style.name}</span>
                                            <span className="material-symbols-outlined text-pink-500 opacity-0 peer-checked:opacity-100 transition-opacity">check_circle</span>
                                        </div>
                                        <div className={`${style.bgClass || 'bg-gray-100'} rounded-lg p-3 mb-2 flex items-center justify-center h-16`}>
                                            <div className={style.tagClass}>
                                                {style.sampleText}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500">{style.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
