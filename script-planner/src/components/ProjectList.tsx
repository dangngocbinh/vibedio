import type { ProjectInfo } from '../types'
import { formatTime, formatDate } from '../utils/formatters'

interface ProjectListProps {
    projects: ProjectInfo[]
    isLoading: boolean
    searchQuery: string
    onSearchChange: (query: string) => void
    onSelectProject: (projectName: string) => void
}

export const ProjectList = ({
    projects,
    isLoading,
    searchQuery,
    onSearchChange,
    onSelectProject
}: ProjectListProps) => {
    return (
        <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans">
            <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-lg size-10 text-primary">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Script Planner</h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Project</h2>
                        <p className="text-gray-600">Choose a project to edit or create a new one</p>
                    </div>

                    {/* Search Box */}
                    <div className="mb-6">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="grid gap-4">
                            {projects.map((project) => (
                                <button
                                    key={project.name}
                                    onClick={() => onSelectProject(project.name)}
                                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                                                {project.displayName}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-3">
                                                <span className="material-symbols-outlined text-[16px] align-middle mr-1">folder</span>
                                                {project.name}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {formatDate(project.updatedAt)}
                                                </span>
                                                {project.duration && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">timer</span>
                                                        {formatTime(project.duration)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center size-10 rounded-full bg-gray-100 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : searchQuery ? (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                            <p className="text-gray-500 mb-2">No projects found for "{searchQuery}"</p>
                            <button
                                onClick={() => onSearchChange('')}
                                className="text-primary hover:underline text-sm"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">folder_off</span>
                            <p className="text-gray-500 mb-4">No projects found</p>
                            <p className="text-sm text-gray-400">Create a project folder in <code className="bg-gray-100 px-2 py-1 rounded">public/projects/</code></p>
                        </div>
                    )}

                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">info</span>
                            Quick Start
                        </h3>
                        <p className="text-sm text-blue-800">
                            You can also open a project directly by adding <code className="bg-blue-100 px-2 py-1 rounded">?project=project-name</code> to the URL
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
