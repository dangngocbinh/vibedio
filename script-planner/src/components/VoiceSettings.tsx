import type { VoiceConfig } from '../types'

interface VoiceSettingsProps {
    voiceConfig?: VoiceConfig
}

export const VoiceSettings = ({ voiceConfig }: VoiceSettingsProps) => {
    if (!voiceConfig) return null

    return (
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-600 text-[24px]">record_voice_over</span>
                    <h2 className="text-lg font-bold text-gray-800">Voice Settings</h2>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {/* Read-only info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Provider</label>
                        <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                            {voiceConfig.provider || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Voice ID / Name</label>
                        <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                            {voiceConfig.voiceId || voiceConfig.voiceName || 'N/A'}
                        </div>
                    </div>
                </div>
                {/* Editable style instruction */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-2">
                        <span>Style Instruction</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">EDITABLE</span>
                    </label>
                    <textarea
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none leading-relaxed"
                        rows={3}
                        defaultValue={voiceConfig.styleInstruction || ''}
                        placeholder="Describe the voice style, emotion, pace... e.g., 'Speak slowly with deep emotion and dramatic pauses'"
                    ></textarea>
                </div>
                {voiceConfig.audioPath && (
                    <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            <strong>Audio File:</strong> {voiceConfig.audioPath}
                        </span>
                    </div>
                )}
            </div>
        </section>
    )
}
