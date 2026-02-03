import type { LightboxMedia } from '../types'

interface LightboxProps {
    media: LightboxMedia | null
    onClose: () => void
}

export const Lightbox = ({ media, onClose }: LightboxProps) => {
    if (!media) return null

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
                <span className="material-symbols-outlined text-[32px]">close</span>
            </button>

            <div
                className="max-w-6xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {media.type === 'image' ? (
                    <img
                        src={media.url}
                        alt={media.title || 'Preview'}
                        className="w-full h-full object-contain rounded-lg"
                    />
                ) : (
                    <video
                        src={media.url}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain rounded-lg"
                    />
                )}
                {media.title && (
                    <div className="mt-4 text-center text-white text-sm">
                        {media.title}
                    </div>
                )}
            </div>
        </div>
    )
}
