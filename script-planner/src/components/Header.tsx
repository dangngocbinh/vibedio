import type { ScriptData } from '../types'

interface HeaderProps {
    projectTitle: string
    onTitleChange: (title: string) => void
    onBack: () => void
    scriptData: ScriptData | null
    expandAllVisuals: boolean
    onToggleVisuals: () => void
    viewMode: 'overview' | 'detail'
    onViewModeChange: (mode: 'overview' | 'detail') => void
    onSave: () => void
}

export const Header = ({
    projectTitle,
    onTitleChange,
    onBack,
    scriptData,
    expandAllVisuals,
    onToggleVisuals,
    viewMode,
    onViewModeChange,
    onSave
}: HeaderProps) => {
    const totalScenes = scriptData?.sections?.reduce(
        (total, section) => total + (section.scenes?.length || 0),
        0
    ) || 0

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-4 w-full max-w-5xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                    title="Back to projects"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-lg size-10 text-primary">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <input
                        className="text-xl font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-80 placeholder-gray-400 outline-none"
                        type="text"
                        value={projectTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-3">
                    {/* Stats */}
                    {scriptData?.sections && (
                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                <span className="material-symbols-outlined text-[14px]">folder</span>
                                <span className="font-bold">{scriptData.sections.length}</span>
                                <span className="text-blue-600">sections</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">
                                <span className="material-symbols-outlined text-[14px]">movie</span>
                                <span className="font-bold">{totalScenes}</span>
                                <span className="text-purple-600">scenes</span>
                            </div>
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => onViewModeChange('overview')}
                            className={`flex items-center justify-center gap-1.5 rounded-md h-7 px-3 text-xs font-medium transition-all ${viewMode === 'overview'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            title="Overview mode - See all sections and scenes"
                        >
                            <span className="material-symbols-outlined text-[16px]">view_list</span>
                            <span>Overview</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange('detail')}
                            className={`flex items-center justify-center gap-1.5 rounded-md h-7 px-3 text-xs font-medium transition-all ${viewMode === 'detail'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            title="Detail mode - Full editor with all features"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit_note</span>
                            <span>Detail</span>
                        </button>
                    </div>

                    {viewMode === 'detail' && (
                        <button
                            onClick={onToggleVisuals}
                            className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                            title={expandAllVisuals ? "Collapse all visual settings" : "Expand all visual settings"}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {expandAllVisuals ? 'unfold_less' : 'unfold_more'}
                            </span>
                            <span>Visuals</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSave}
                        className="flex items-center justify-center gap-2 rounded-lg h-9 px-6 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-sm"
                        title="Save (Ctrl+S)"
                    >
                        <span>Save</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
