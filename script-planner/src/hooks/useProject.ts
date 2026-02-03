import { useState, useEffect } from 'react'
import type { ProjectInfo, ScriptData, ResourcesData } from '../types'

export const useProject = () => {
    const [projectTitle, setProjectTitle] = useState("Script Planner")
    const [scriptData, setScriptData] = useState<ScriptData | null>(null)
    const [resourcesData, setResourcesData] = useState<ResourcesData | null>(null)
    const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([])
    const [showProjectList, setShowProjectList] = useState(false)
    const [isLoadingProjects, setIsLoadingProjects] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch available projects
    const fetchProjects = async () => {
        setIsLoadingProjects(true)
        try {
            const res = await fetch('/projects-list.json')
            if (!res.ok) throw new Error('Failed to fetch projects list')

            const projectsList = await res.json()
            const projects: ProjectInfo[] = []

            for (const proj of projectsList) {
                try {
                    const scriptRes = await fetch(`/projects/${proj.id}/script.json`)
                    if (scriptRes.ok) {
                        const data: ScriptData = await scriptRes.json()
                        projects.push({
                            name: proj.id,
                            displayName: data.metadata?.projectName || proj.name,
                            updatedAt: data.metadata?.createdAt || proj.modifiedAt || new Date().toISOString(),
                            duration: data.metadata?.duration
                        })
                    }
                } catch (e) {
                    projects.push({
                        name: proj.id,
                        displayName: proj.name,
                        updatedAt: proj.modifiedAt || new Date().toISOString(),
                        duration: undefined
                    })
                }
            }

            projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            setAvailableProjects(projects)
        } catch (err) {
            console.error('Failed to fetch projects:', err)
            setAvailableProjects([])
        } finally {
            setIsLoadingProjects(false)
        }
    }

    // Load project by slug
    const loadProject = (projectSlug: string) => {
        setProjectTitle(`Project: ${projectSlug}`)
        setShowProjectList(false)

        localStorage.setItem('lastOpenedProject', projectSlug)

        // Fetch script.json
        fetch(`/projects/${projectSlug}/script.json`)
            .then(res => {
                if (!res.ok) throw new Error('Script not found')
                return res.json()
            })
            .then((data: ScriptData) => {
                console.log('Loaded script.json:', data)
                setScriptData(data)

                if (data.metadata?.projectName) {
                    setProjectTitle(data.metadata.projectName)
                }

                window.history.pushState({}, '', `?project=${projectSlug}`)
            })
            .catch(err => {
                console.error('Failed to load script.json:', err)
                alert(`Failed to load project "${projectSlug}". Please check if the project exists.`)
                setShowProjectList(true)
                localStorage.removeItem('lastOpenedProject')
            })

        // Fetch resources.json
        fetch(`/projects/${projectSlug}/resources.json`)
            .then(res => {
                if (!res.ok) throw new Error('Resources not found')
                return res.json()
            })
            .then(data => {
                console.log('Loaded resources.json:', data)
                setResourcesData(data)
            })
            .catch(err => {
                console.warn('No resources.json found:', err)
                setResourcesData(null)
            })
    }

    // Go back to project list
    const goBackToProjectList = () => {
        setShowProjectList(true)
        setSearchQuery('')
        fetchProjects()
        window.history.pushState({}, '', '/')
    }

    // Reload resources.json (useful after clearing scene resources)
    const reloadResources = async () => {
        const params = new URLSearchParams(window.location.search)
        const projectSlug = params.get('project')

        if (!projectSlug) return

        try {
            const res = await fetch(`/projects/${projectSlug}/resources.json`)
            if (!res.ok) throw new Error('Resources not found')
            const data = await res.json()
            console.log('Reloaded resources.json:', data)
            setResourcesData(data)
        } catch (err) {
            console.warn('No resources.json found:', err)
            setResourcesData(null)
        }
    }

    // Filter projects based on search
    const filteredProjects = availableProjects.filter(project =>
        project.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Initialize on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const project = params.get('project')

        if (project) {
            loadProject(project)
        } else {
            const lastProject = localStorage.getItem('lastOpenedProject')
            if (lastProject) {
                console.log('Loading last opened project:', lastProject)
                loadProject(lastProject)
            } else {
                setShowProjectList(true)
                fetchProjects()
            }
        }
    }, [])

    return {
        projectTitle,
        setProjectTitle,
        scriptData,
        setScriptData,
        resourcesData,
        availableProjects,
        filteredProjects,
        showProjectList,
        isLoadingProjects,
        searchQuery,
        setSearchQuery,
        loadProject,
        goBackToProjectList,
        fetchProjects,
        reloadResources
    }
}
