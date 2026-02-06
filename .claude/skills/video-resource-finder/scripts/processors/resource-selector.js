/**
 * ResourceSelector - Intelligent resource selection engine
 * 
 * Selects the best resource for each scene based on:
 * - Text matching (40%): Query keywords vs title/tags
 * - API ranking (30%): Position in search results
 * - Quality metrics (20%): Resolution, duration, aspect ratio
 * - Diversity (10%): Avoid over-using same source
 */

class ResourceSelector {
    constructor(options = {}) {
        // Selection weights
        this.weights = {
            textMatch: options.textMatchWeight || 0.4,
            apiRank: options.apiRankWeight || 0.3,
            quality: options.qualityWeight || 0.2,
            diversity: options.diversityWeight || 0.1
        };

        // Track source usage for diversity scoring
        this.sourceUsage = {};
    }

    /**
     * Select best resources for a scene (supports multiple selections)
     * @param {Object} scene - Scene object with query/description
     * @param {Array} resources - Available resources (with localPath)
     * @returns {Array} Array of best matched resources (empty if none)
     */
    selectBestResource(scene, resources) {
        if (!resources || resources.length === 0) {
            return [];
        }

        // Filter resources with localPath (successfully downloaded) or valid download URL
        const downloaded = resources.filter(r => r.localPath || r.downloadUrl || r.downloadUrls);

        if (downloaded.length === 0) {
            console.warn(`[ResourceSelector] No downloaded resources for scene "${scene.sceneId || scene.id}"`);
            return [];
        }

        // PRIORITY 1: Check if user has already selected resources (selectedResourceIds)
        if (scene.selectedResourceIds && scene.selectedResourceIds.length > 0) {
            const userSelected = downloaded.filter(r => scene.selectedResourceIds.includes(r.id));
            if (userSelected.length > 0) {
                console.log(`[ResourceSelector] Using ${userSelected.length} user-selected resources for "${scene.sceneId || scene.id}"`);

                // Sort by order in selectedResourceIds to maintain user sequence
                userSelected.sort((a, b) => {
                    return scene.selectedResourceIds.indexOf(a.id) - scene.selectedResourceIds.indexOf(b.id);
                });

                return userSelected;
            }
        }

        // PRIORITY 2: Use scoring algorithm to pick best
        // Score each resource
        const scored = downloaded.map(resource => ({
            resource,
            score: this.calculateScore(scene, resource),
            breakdown: this.getScoreBreakdown(scene, resource)
        }));

        // Sort by score (highest first)
        scored.sort((a, b) => b.score - a.score);

        const selected = scored[0];

        // Track source usage for diversity
        const source = selected.resource.source || 'unknown';
        this.sourceUsage[source] = (this.sourceUsage[source] || 0) + 1;

        console.log(`[ResourceSelector] Selected for "${scene.sceneId || scene.id}": ${selected.resource.title || selected.resource.id} (score: ${selected.score.toFixed(3)})`);

        return [selected.resource];
    }

    /**
     * Select best resources for all scenes
     * @param {Array} scenes - Array of scene objects
     * @param {Object} resourcesJSON - Full resources.json object
     * @returns {Object} Selection results with metadata
     */
    selectAllResources(scenes, resourcesJSON) {
        const selections = [];
        const stats = {
            total: scenes.length,
            selected: 0,
            failed: 0,
            averageScore: 0
        };

        for (const scene of scenes) {
            const sceneId = scene.sceneId || scene.id;

            // Find resources for this scene
            const sceneResources = this.findResourcesForScene(sceneId, resourcesJSON);

            if (!sceneResources || sceneResources.length === 0) {
                console.warn(`[ResourceSelector] No resources found for scene "${sceneId}"`);
                stats.failed++;
                continue;
            }

            // Select best resource (returns Array now)
            const selectedResources = this.selectBestResource(scene, sceneResources);

            if (selectedResources && selectedResources.length > 0) {
                // Add each selected resource as a selection entry
                for (const res of selectedResources) {
                    selections.push({
                        sceneId,
                        resource: res,
                        selectionMetadata: {
                            totalOptions: sceneResources.length,
                            selectedAt: new Date().toISOString()
                        }
                    });
                }
                stats.selected++;
            } else {
                stats.failed++;
            }
        }

        // Calculate average score
        if (stats.selected > 0) {
            const totalScore = selections.reduce((sum, s) => {
                const score = this.calculateScore(
                    { sceneId: s.sceneId, query: '' },
                    s.resource
                );
                return sum + score;
            }, 0);
            stats.averageScore = totalScore / stats.selected;
        }

        return {
            selections,
            stats,
            sourceDistribution: this.sourceUsage
        };
    }

    /**
     * Find all resources for a specific scene
     * @param {string} sceneId - Scene ID
     * @param {Object} resourcesJSON - Full resources.json
     * @returns {Array} Resources for this scene
     */
    findResourcesForScene(sceneId, resourcesJSON) {
        const resources = [];

        // Check videos
        if (resourcesJSON.resources?.videos) {
            const videoGroup = resourcesJSON.resources.videos.find(v => v.sceneId === sceneId);
            if (videoGroup?.results) {
                resources.push(...videoGroup.results);
            }
        }

        // Check images
        if (resourcesJSON.resources?.images) {
            const imageGroup = resourcesJSON.resources.images.find(i => i.sceneId === sceneId);
            if (imageGroup?.results) {
                resources.push(...imageGroup.results);
            }
        }

        // Check generated images
        if (resourcesJSON.resources?.generatedImages) {
            const genGroup = resourcesJSON.resources.generatedImages.find(g => g.sceneId === sceneId);
            if (genGroup?.results) {
                resources.push(...genGroup.results);
            }
        }

        // Check pinned resources
        if (resourcesJSON.resources?.pinnedResources) {
            const pinnedGroup = resourcesJSON.resources.pinnedResources.find(p => p.sceneId === sceneId);
            if (pinnedGroup?.results) {
                resources.push(...pinnedGroup.results);
            }
        }

        return resources;
    }

    /**
     * Calculate overall score for a resource
     * @param {Object} scene - Scene object
     * @param {Object} resource - Resource object
     * @returns {number} Score between 0 and 1
     */
    calculateScore(scene, resource) {
        const scores = {
            textMatch: this.scoreTextMatch(scene.query || scene.visualDescription || '', resource),
            apiRank: this.scoreApiRank(resource.rank || 1),
            quality: this.scoreQuality(resource),
            diversity: this.scoreDiversity(resource)
        };

        const totalScore = (
            scores.textMatch * this.weights.textMatch +
            scores.apiRank * this.weights.apiRank +
            scores.quality * this.weights.quality +
            scores.diversity * this.weights.diversity
        );

        return totalScore;
    }

    /**
     * Get detailed score breakdown for debugging
     */
    getScoreBreakdown(scene, resource) {
        return {
            textMatch: this.scoreTextMatch(scene.query || '', resource),
            apiRank: this.scoreApiRank(resource.rank || 1),
            quality: this.scoreQuality(resource),
            diversity: this.scoreDiversity(resource)
        };
    }

    /**
     * Score text matching between query and resource metadata
     * @returns {number} Score 0-1
     */
    scoreTextMatch(query, resource) {
        if (!query) return 0.5; // Neutral if no query

        const queryWords = query.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 2); // Ignore short words

        if (queryWords.length === 0) return 0.5;

        const resourceText = [
            resource.title || '',
            ...(resource.tags || []),
            resource.photographer || '',
            resource.user?.name || ''
        ].join(' ').toLowerCase();

        const matches = queryWords.filter(word =>
            resourceText.includes(word)
        ).length;

        return matches / queryWords.length;
    }

    /**
     * Score based on API ranking (position in search results)
     * @returns {number} Score 0-1
     */
    scoreApiRank(rank) {
        // rank 1 = best (score 1.0)
        // rank 10 = worst in top 10 (score 0.1)
        return Math.max(0, 1 - (rank - 1) * 0.1);
    }

    /**
     * Score based on quality metrics
     * @returns {number} Score 0-1
     */
    scoreQuality(resource) {
        let score = 0.5; // Base score

        // Resolution scoring (for videos and images)
        if (resource.width) {
            if (resource.width >= 3840) {
                score = 1.0; // 4K
            } else if (resource.width >= 1920) {
                score = 0.8; // Full HD
            } else if (resource.width >= 1280) {
                score = 0.6; // HD
            } else {
                score = 0.4; // SD
            }
        }

        // Duration scoring (for videos)
        if (resource.duration) {
            // Prefer 10-30s clips for B-roll
            if (resource.duration >= 10 && resource.duration <= 30) {
                score += 0.2;
            } else if (resource.duration >= 5 && resource.duration <= 60) {
                score += 0.1;
            }
            // Too short (<5s) or too long (>60s) gets penalty
        }

        // Aspect ratio bonus (16:9 is ideal for most videos)
        if (resource.width && resource.height) {
            const aspectRatio = resource.width / resource.height;
            if (aspectRatio >= 1.7 && aspectRatio <= 1.8) {
                score += 0.1; // Close to 16:9
            }
        }

        return Math.min(1.0, score);
    }

    /**
     * Score based on source diversity
     * Prefer mixing different sources to avoid repetition
     * @returns {number} Score 0-1
     */
    scoreDiversity(resource) {
        const source = resource.source || 'unknown';
        const usageCount = this.sourceUsage[source] || 0;

        // Less used sources get higher scores
        return Math.max(0, 1 - usageCount * 0.1);
    }

    /**
     * Reset source usage tracking
     */
    reset() {
        this.sourceUsage = {};
    }
}

module.exports = ResourceSelector;
