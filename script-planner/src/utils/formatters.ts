/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds: any): string => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format ISO date string to localized Vietnamese format
 */
export const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
