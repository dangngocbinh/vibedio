import { useState, useMemo, useCallback } from 'react'
import type { ResourcesData, ResourceCandidate, LightboxMedia } from '../types'

export const useResources = (resourcesData: ResourcesData | null) => {
    const [sceneResourceIndex, setSceneResourceIndex] = useState<Record<string, number>>({})
    const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null)

    // Memoize resource map to avoid expensive O(N) lookup on every render
    const resourcesByScene = useMemo(() => {
        const map: Record<string, ResourceCandidate[]> = {}
        if (!resourcesData?.resources) return map

        // Map category names to resource types
        const categoryTypeMap: Record<string, string> = {
            'images': 'image',
            'videos': 'video',
            'generatedImages': 'image',
            'pinnedResources': 'image' // Assume pinned are images by default
        }

        const categories = ['images', 'videos', 'generatedImages', 'pinnedResources']

        categories.forEach(cat => {
            const entries = (resourcesData.resources as any)[cat] || []
            entries.forEach((entry: any) => {
                if (entry.sceneId && entry.results) {
                    const sId = entry.sceneId
                    // Add type field to each resource based on category
                    const typedResults = entry.results.map((resource: ResourceCandidate) => ({
                        ...resource,
                        type: resource.type || categoryTypeMap[cat] || 'image'
                    }))

                    if (!map[sId]) {
                        map[sId] = typedResults
                    } else {
                        map[sId] = [...map[sId], ...typedResults]
                    }
                }
            })
        })

        return map
    }, [resourcesData])

    // Get resources for a scene (O(1) lookup)
    const getSceneResources = useCallback((sceneId: string): ResourceCandidate[] => {
        return resourcesByScene[sceneId] || []
    }, [resourcesByScene])

    return {
        sceneResourceIndex,
        setSceneResourceIndex,
        lightboxMedia,
        setLightboxMedia,
        getSceneResources
    }
}
