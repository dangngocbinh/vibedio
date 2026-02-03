#!/usr/bin/env node

/**
 * Resource Selection and Import for Director
 * 
 * This module provides functions for director to:
 * 1. Select best resources from downloads/
 * 2. Import selected to imports/
 * 3. Cleanup downloads/
 * 4. Update script.json with imported paths
 */

const fs = require('fs');
const path = require('path');
const ResourceSelector = require('./utils/resource-selector');
const ImportManager = require('./utils/import-manager');

/**
 * Update script.json with imported resource paths
 * @param {string} scriptPath - Path to script.json
 * @param {Array} importedResources - Array of imported resources with paths
 * @param {Object} importedMusic - Imported music object (optional)
 * @param {boolean} verbose - Log output
 */
async function updateScriptJSON(scriptPath, importedResources, importedMusic = null, verbose = false) {
    try {
        const scriptData = fs.readFileSync(scriptPath, 'utf8');
        const script = JSON.parse(scriptData);

        // Create lookup map: sceneId -> importedPath
        const pathMap = {};
        for (const resource of importedResources) {
            // Use relativePath if available (preferred for portability) or importedPath
            const finalPath = resource.relativePath || resource.importedPath;

            if (resource.sceneId && finalPath) {
                if (!pathMap[resource.sceneId]) {
                    pathMap[resource.sceneId] = {
                        importedPaths: [],
                        selectedResourceIds: []
                    };
                }

                pathMap[resource.sceneId].importedPaths.push(finalPath);

                const resId = resource.resourceId || resource.id;
                if (resId) {
                    pathMap[resource.sceneId].selectedResourceIds.push(resId);
                }
            }
        }

        // Update scenes in script
        let updated = 0;
        if (script.sections) {
            for (const section of script.sections) {
                if (section.scenes) {
                    for (const scene of section.scenes) {
                        if (pathMap[scene.id]) {
                            const mapEntry = pathMap[scene.id];

                            // Add importedResourcePath (legacy singular - use first)
                            if (mapEntry.importedPaths && mapEntry.importedPaths.length > 0) {
                                scene.importedResourcePath = mapEntry.importedPaths[0];
                            } else if (mapEntry.importedPath) {
                                scene.importedResourcePath = mapEntry.importedPath;
                            }

                            // Update selectedResourceIds (array only)
                            if (mapEntry.selectedResourceIds && mapEntry.selectedResourceIds.length > 0) {
                                scene.selectedResourceIds = mapEntry.selectedResourceIds;
                            }

                            // UPDATE: Fix localPath in resourceCandidates[]
                            if (scene.resourceCandidates && Array.isArray(scene.resourceCandidates)) {
                                for (const candidate of scene.resourceCandidates) {
                                    // If this candidate was selected and imported
                                    if (mapEntry.selectedResourceIds.includes(candidate.id)) {
                                        // Find the imported path for this specific resource
                                        const resourceIndex = mapEntry.selectedResourceIds.indexOf(candidate.id);
                                        if (resourceIndex !== -1 && mapEntry.importedPaths[resourceIndex]) {
                                            // Update localPath to point to imports/ instead of downloads/
                                            candidate.localPath = mapEntry.importedPaths[resourceIndex];
                                        }
                                    }
                                }
                            }

                            updated++;
                        }
                    }
                }
            }
        }

        // Update music in script
        if (importedMusic && script.music) {
            script.music.selectedMusicId = importedMusic.id;
            script.music.importedMusicPath = importedMusic.relativePath || importedMusic.importedPath;

            if (verbose) {
                console.log(`  🎵 Updated music: ${importedMusic.title || importedMusic.id}`);
            }
        }

        // Save updated script
        fs.writeFileSync(scriptPath, JSON.stringify(script, null, 4), 'utf8');

        if (verbose) {
            console.log(`\n  📝 Updated script.json: ${updated} scenes with imported paths`);
        }

        return { updated };
    } catch (error) {
        console.error('[updateScriptJSON] Error:', error.message);
        throw error;
    }
}

/**
 * Select and import resources for a project
 * @param {string} projectDir - Absolute path to project directory
 * @param {Object} options - Options
 * @returns {Promise<Object>} Import results
 */
async function selectAndImportResources(projectDir, options = {}) {
    const {
        autoCleanup = true,
        verbose = true
    } = options;

    if (verbose) {
        console.log('\n🎯 Selecting and importing best resources...');
    }

    try {
        // Read resources.json
        const resourcesPath = path.join(projectDir, 'resources.json');
        if (!fs.existsSync(resourcesPath)) {
            throw new Error(`resources.json not found at: ${resourcesPath}`);
        }

        const resourcesData = fs.readFileSync(resourcesPath, 'utf8');
        const resourcesJSON = JSON.parse(resourcesData);

        // Read script.json to get scene info
        const scriptPath = path.join(projectDir, 'script.json');
        if (!fs.existsSync(scriptPath)) {
            throw new Error(`script.json not found at: ${scriptPath}`);
        }

        const scriptData = fs.readFileSync(scriptPath, 'utf8');
        const script = JSON.parse(scriptData);

        // Extract scenes from script (including selectedResourceId)
        const scenes = [];
        if (script.sections) {
            for (const section of script.sections) {
                if (section.scenes) {
                    for (const scene of section.scenes) {
                        scenes.push({
                            sceneId: scene.id,
                            id: scene.id,
                            query: scene.visualDescription || scene.text || '',
                            visualDescription: scene.visualDescription,
                            text: scene.text,
                            selectedResourceIds: scene.selectedResourceIds || [] // MULTI-SELECT support
                        });
                    }
                }
            }
        }

        if (verbose) {
            console.log(`  Found ${scenes.length} scenes`);
        }

        if (scenes.length === 0) {
            console.warn('  ⚠️  No scenes found, skipping resource selection');
            return {
                selected: 0,
                imported: 0,
                cleaned: false
            };
        }

        // Initialize ResourceSelector
        const selector = new ResourceSelector({
            textMatchWeight: 0.4,
            apiRankWeight: 0.3,
            qualityWeight: 0.2,
            diversityWeight: 0.1
        });

        // Select best resources (respects selectedResourceId if present)
        const selectionResult = selector.selectAllResources(scenes, resourcesJSON);

        if (verbose) {
            console.log(`\n  📊 Selection Summary:`);
            console.log(`    Selected: ${selectionResult.stats.selected}/${selectionResult.stats.total}`);
            console.log(`    Avg Score: ${selectionResult.stats.averageScore.toFixed(3)}`);
        }

        if (selectionResult.selections.length === 0) {
            console.warn('  ⚠️  No resources selected, nothing to import');
            return {
                selected: 0,
                imported: 0,
                cleaned: false
            };
        }

        // Initialize ImportManager
        const importManager = new ImportManager(projectDir, { autoCleanup });

        // Import selected resources
        const importResult = await importManager.importResources(selectionResult.selections);

        if (verbose) {
            console.log(`\n  📦 Import: ${importResult.imported} resources imported`);
        }

        // Select and import music (if available)
        let importedMusic = null;
        const selectedMusicId = script.music?.selectedMusicId;
        const musicResources = resourcesJSON.resources?.music || [];

        if (musicResources.length > 0) {
            // Find music candidates
            let musicCandidate = null;

            for (const musicGroup of musicResources) {
                for (const result of musicGroup.results || []) {
                    // Prioritize user selection
                    if (selectedMusicId && result.id === selectedMusicId) {
                        musicCandidate = result;
                        break;
                    }

                    // Otherwise, pick first available with localPath
                    if (!musicCandidate && result.localPath) {
                        musicCandidate = result;
                    }
                }
                if (musicCandidate && selectedMusicId) break;
            }

            if (musicCandidate && musicCandidate.localPath) {
                // Import music
                const musicImportResult = await importManager.importMusic(musicCandidate);

                if (musicImportResult.success) {
                    importedMusic = musicImportResult.music;

                    if (verbose) {
                        console.log(`  🎵 Music: ${musicImportResult.music.title || musicImportResult.music.id} imported`);
                    }
                }
            }
        }

        // Update resources.json with imported paths
        if (importResult.imported > 0) {
            const selectionsWithImports = selectionResult.selections.map((sel, idx) => ({
                ...sel,
                ...(importResult.resources[idx] || {})
            }));

            await importManager.updateResourcesJSON(resourcesPath, selectionsWithImports);

            // Update script.json with imported paths (including music)
            await updateScriptJSON(scriptPath, importResult.resources, importedMusic, verbose);
        } else if (importedMusic) {
            // Only music was imported
            await updateScriptJSON(scriptPath, [], importedMusic, verbose);
        }

        // Cleanup downloads/ if enabled
        let cleanupResult = { cleaned: false };
        if (autoCleanup) {
            cleanupResult = await importManager.cleanupDownloads();

            if (verbose && cleanupResult.cleaned) {
                console.log(`  🧹 Cleanup: ${cleanupResult.freedFormatted} freed\n`);
            }
        }

        return {
            selected: selectionResult.stats.selected,
            imported: importResult.imported,
            failed: importResult.failed,
            cleaned: cleanupResult.cleaned,
            freedBytes: cleanupResult.freedBytes || 0,
            selections: selectionResult.selections,
            importedResources: importResult.resources,
            importedMusic: importedMusic
        };

    } catch (error) {
        console.error('❌ Error during resource selection/import:', error.message);
        throw error;
    }
}

/**
 * Check if project needs resource import
 * @param {string} projectDir - Project directory
 * @returns {boolean} True if imports/ doesn't exist or is empty
 */
function needsImport(projectDir) {
    const importsDir = path.join(projectDir, 'imports');

    if (!fs.existsSync(importsDir)) {
        return true;
    }

    // Check if imports/ has any files
    const hasFiles = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile()) return true;
            if (entry.isDirectory() && hasFiles(path.join(dir, entry.name))) return true;
        }
        return false;
    };

    return !hasFiles(importsDir);
}

module.exports = {
    selectAndImportResources,
    needsImport
};

// CLI usage
if (require.main === module) {
    const minimist = require('minimist');
    const args = minimist(process.argv.slice(2));

    if (!args.projectDir) {
        console.error('Usage: node resource-import.js --projectDir <path>');
        process.exit(1);
    }

    const projectDir = path.resolve(args.projectDir);

    selectAndImportResources(projectDir, {
        autoCleanup: !args.skipCleanup,
        verbose: true
    })
        .then(result => {
            console.log('\n✅ Resource import complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Failed:', error.message);
            process.exit(1);
        });
}
