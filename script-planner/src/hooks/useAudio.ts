import { useState, useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'

export const useAudio = (audioUrl: string | null) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const waveformRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)

    // Initialize WaveSurfer when audio URL is available
    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#e5e7eb',
            progressColor: '#13a4ec',
            cursorColor: '#13a4ec',
            barWidth: 3,
            barGap: 3,
            barRadius: 3,
            height: 40,
            normalize: true,
            backend: 'WebAudio'
        })

        wavesurfer.load(audioUrl)

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration())
        })

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime())
        })

        wavesurfer.on('play', () => setIsPlaying(true))
        wavesurfer.on('pause', () => setIsPlaying(false))

        wavesurferRef.current = wavesurfer

        return () => {
            wavesurfer.destroy()
        }
    }, [audioUrl])

    // Play from specific time
    const playFromTime = (timeInSeconds: number) => {
        if (!wavesurferRef.current) return
        wavesurferRef.current.seekTo(timeInSeconds / wavesurferRef.current.getDuration())
        wavesurferRef.current.play()
    }

    // Toggle play/pause
    const togglePlayPause = () => {
        if (!wavesurferRef.current) return
        wavesurferRef.current.playPause()
    }

    return {
        isPlaying,
        currentTime,
        duration,
        waveformRef,
        wavesurferRef,
        playFromTime,
        togglePlayPause
    }
}
