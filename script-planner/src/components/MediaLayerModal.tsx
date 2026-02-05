import { useState, useRef } from 'react'
import type { ResourceCandidate } from '../types'

interface MediaLayerModalProps {
    isOpen: boolean
    onClose: () => void
    sceneId: string
    sceneName: string
    resources: ResourceCandidate[]
    selectedResourceIds: string[]
    onUpdateSelection: (resourceIds: string[]) => void
    onUploadFile: (file: File) => Promise<void>
    projectSlug: string | null
}

export const MediaLayerModal = ({
    isOpen,
    onClose,
    sceneId,
    sceneName,
    resources,
    selectedResourceIds,
    onUpdateSelection,
    onUploadFile,
    projectSlug
}: MediaLayerModalProps) => {
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
    const [isDraggingFile, setIsDraggingFile] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    if (!isOpen) return null

    // Get selected resources in order
    const selectedResources = selectedResourceIds
        .map(id => resources.find(r => r.id === id))
        .filter(Boolean) as ResourceCandidate[]

    const handleAddResource = (resourceId: string) => {
        if (!selectedResourceIds.includes(resourceId)) {
            onUpdateSelection([...selectedResourceIds, resourceId])
        }
    }

    const handleRemoveResource = (resourceId: string) => {
        onUpdateSelection(selectedResourceIds.filter(id => id !== resourceId))
    }

    const handleMoveLayer = (fromIndex: number, toIndex: number) => {
        const newIds = [...selectedResourceIds]
        const [movedId] = newIds.splice(fromIndex, 1)
        newIds.splice(toIndex, 0, movedId)
        onUpdateSelection(newIds)
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setIsUploading(true)
            try {
                await onUploadFile(file)
            } finally {
                setIsUploading(false)
                e.target.value = '' // Reset input
            }
        }
    }

    const handleFileDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingFile(false)
        
        const file = e.dataTransfer.files?.[0]
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
            setIsUploading(true)
            try {
                await onUploadFile(file)
            } finally {
                setIsUploading(false)
            }
        } else if (file) {
            alert('Please drop an image or video file')
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingFile(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingFile(false)
    }

    const getResourcePath = (resource: ResourceCandidate): string => {
        let rawPath = resource.localPath || resource.downloadUrl

        if (!rawPath && resource.downloadUrls) {
            rawPath = resource.downloadUrls['4k'] ||
                resource.downloadUrls.hd ||
                resource.downloadUrls.large ||
                resource.downloadUrls.medium ||
                resource.downloadUrls.original ||
                resource.downloadUrls.sd
        }

        if (!rawPath && resource.url) {
            rawPath = resource.url
        }

        if (!rawPath) {
            return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo media%3C/text%3E%3C/svg%3E'
        }

        if (rawPath.startsWith('http') || rawPath.startsWith('blob:')) {
            return rawPath
        }

        if (rawPath.startsWith('/Users/') || rawPath.startsWith('/home/')) {
            const match = rawPath.match(/public\/projects\/(.+)/)
            if (match) {
                return `/projects/${match[1]}`
            }
            const filename = rawPath.split('/').pop()
            return `/projects/${projectSlug}/uploads/${filename}`
        }

        return `/projects/${projectSlug}/${rawPath}`
    }

    const handleClose = () => {
        if (selectedResources.length === 0) {
            const confirmed = window.confirm('⚠️ You haven\'t selected any media yet. Are you sure you want to close?')
            if (!confirmed) return
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative" 
                onClick={(e) => e.stopPropagation()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
            >
                {/* Drag & Drop Overlay */}
                {isDraggingFile && (
                    <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-md flex items-center justify-center border-4 border-dashed border-primary rounded-2xl">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-8xl text-primary animate-bounce block mb-4">upload</span>
                            <p className="text-2xl font-bold text-primary mb-2">Drop file here to upload</p>
                            <p className="text-sm text-primary/70">Images and videos only</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Media Layers</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Scene: {sceneName || sceneId}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left: Selected Layers (Stacked) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">layers</span>
                                    Selected Layers ({selectedResources.length})
                                </h3>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                    {isUploading ? 'Uploading...' : 'Upload New'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {selectedResources.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">layers_clear</span>
                                    <p className="text-gray-400 text-sm">No layers selected</p>
                                    <p className="text-gray-300 text-xs mt-1">Add media from the right panel</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedResources.map((resource, index) => {
                                        const isImage = resource.type === 'image'
                                        const resourcePath = getResourcePath(resource)
                                        const layerNumber = selectedResources.length - index // Top layer = highest number

                                        return (
                                            <div
                                                key={resource.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.effectAllowed = 'move'
                                                    e.dataTransfer.setData('text/plain', index.toString())
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault()
                                                    e.dataTransfer.dropEffect = 'move'
                                                    setDragOverIndex(index)
                                                }}
                                                onDragLeave={() => setDragOverIndex(null)}
                                                onDrop={(e) => {
                                                    e.preventDefault()
                                                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                                                    handleMoveLayer(fromIndex, index)
                                                    setDragOverIndex(null)
                                                }}
                                                className={`bg-white border-2 rounded-xl p-3 flex items-center gap-3 cursor-move hover:shadow-md transition-all ${
                                                    dragOverIndex === index ? 'border-primary bg-primary/5' : 'border-gray-200'
                                                }`}
                                            >
                                                {/* Drag Handle */}
                                                <div className="text-gray-400 hover:text-gray-600">
                                                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                                                </div>

                                                {/* Thumbnail */}
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                                                    {isImage ? (
                                                        <img
                                                            src={resourcePath}
                                                            alt={resource.title || 'Layer'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={resourcePath}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                        />
                                                    )}
                                                    <div className="absolute top-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                        {isImage ? 'IMG' : 'VID'}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-primary">Layer {layerNumber}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {resource.source === 'local' ? 'Uploaded' : 'Fetched'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 truncate">{resource.title || 'Untitled'}</p>
                                                    {resource.width && resource.height && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {resource.width} × {resource.height}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemoveResource(resource.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                                                    title="Remove layer"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Layer Info */}
                            {selectedResources.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
                                        <div className="text-xs text-blue-800">
                                            <p className="font-semibold mb-1">Layer Order</p>
                                            <p>Top layer (Layer {selectedResources.length}) will be displayed on top. Drag to reorder.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Available Resources */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                                Available Media ({resources.length})
                            </h3>

                            {resources.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">image_not_supported</span>
                                    <p className="text-gray-400 text-sm">No media available</p>
                                    <p className="text-gray-300 text-xs mt-1">Upload files to get started</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                                    {resources.map((resource) => {
                                        const isImage = resource.type === 'image'
                                        const resourcePath = getResourcePath(resource)
                                        const isSelected = selectedResourceIds.includes(resource.id)

                                        return (
                                            <div
                                                key={resource.id}
                                                className={`bg-white border-2 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all ${
                                                    isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-primary'
                                                }`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        handleRemoveResource(resource.id)
                                                    } else {
                                                        handleAddResource(resource.id)
                                                    }
                                                }}
                                            >
                                                {/* Thumbnail */}
                                                <div className="aspect-video bg-gray-100 relative">
                                                    {isImage ? (
                                                        <img
                                                            src={resourcePath}
                                                            alt={resource.title || 'Media'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={resourcePath}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                        />
                                                    )}
                                                    {/* Selection Badge */}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                                        </div>
                                                    )}
                                                    {/* Type Badge */}
                                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                        {isImage ? 'IMG' : 'VID'}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="p-2">
                                                    <p className="text-xs text-gray-700 truncate font-medium">{resource.title || 'Untitled'}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {resource.source === 'local' ? 'Uploaded' : 'Fetched'}
                                                        </span>
                                                        {resource.width && resource.height && (
                                                            <span className="text-[10px] text-gray-400">
                                                                {resource.width}×{resource.height}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">
                            {selectedResources.length} layer{selectedResources.length !== 1 ? 's' : ''} selected
                        </p>
                        {selectedResources.length === 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                <span className="font-medium">Please select at least 1 media</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (selectedResources.length === 0) {
                                alert('⚠️ Please select at least 1 image or video before closing.')
                                return
                            }
                            onClose()
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                            selectedResources.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg'
                        }`}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}
