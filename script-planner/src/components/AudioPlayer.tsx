import { formatTime } from '../utils/formatters'

interface AudioPlayerProps {
    isPlaying: boolean
    currentTime: number
    duration: number
    onTogglePlay: () => void
    waveformRef: React.RefObject<HTMLDivElement | null>
}

export const AudioPlayer = ({
    isPlaying,
    currentTime,
    duration,
    onTogglePlay,
    waveformRef
}: AudioPlayerProps) => {
    return (
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center shrink-0 z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
            <div className="w-full max-w-5xl mx-auto flex items-center gap-6">
                <button
                    onClick={onTogglePlay}
                    className="size-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm shrink-0"
                >
                    <span className="material-symbols-outlined">
                        {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                </button>
                <div className="flex-1 h-10" ref={waveformRef}></div>
                <div className="font-mono text-sm font-semibold text-gray-500 shrink-0 tabular-nums">
                    <span className="text-gray-900">{formatTime(currentTime)}</span>
                    <span className="text-gray-300"> / </span>
                    {formatTime(duration)}
                </div>
            </div>
        </div>
    )
}
