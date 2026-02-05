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
const { execSync } = require('child_process');
const ResourceSelector = require('./utils/resource-selector');
const ImportManager = require('./utils/import-manager');

/**
 * Update production status after successful import
 * @param {string} projectDir - Project directory
 * @param {number} importedCount - Number of imported resources
 */
function updateProductionStatus(projectDir, importedCount) {
    try {
        const statusManagerPath = path.join(__dirname, '../utils/status_manager.py');
        const cmd = `python3 "${statusManagerPath}" "${projectDir}" complete resources_imported`;
        execSync(cmd, { stdio: 'pipe' });
    } catch (error) {
        // Silently ignore status update errors
    }
}

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
                                // Strategy: Update ALL candidates that match ANY ID in the chain
                                // This handles both scene.selectedResourceIds AND mapEntry.selectedResourceIds
                                const allSelectedIds = new Set([
                                    ...(scene.selectedResourceIds || []),
                                    ...(mapEntry.selectedResourceIds || [])
                                ]);

                                for (const candidate of scene.resourceCandidates) {
                                    // Check if this candidate ID matches any selected ID
                                    if (allSelectedIds.has(candidate.id)) {
                                        // Find the imported path (use first path if multiple)
                                        const importedPath = mapEntry.importedPaths[0];
                                        if (importedPath) {
                                            // ⚠️ CRITICAL FIX: Add importedPath field (video-editor prioritizes this)
                                            // Video-editor resolution priority: importedPath > localPath > url
                                            candidate.importedPath = importedPath;
                                            // Also update localPath for backward compatibility
                                            candidate.localPath = importedPath;
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

                    // Otherwise, pick first available with localPath OR downloadUrl
                    if (!musicCandidate && (result.localPath || result.downloadUrl || result.downloadUrls)) {
                        musicCandidate = result;
                    }
                }
                if (musicCandidate && selectedMusicId) break;
            }

            // Import music if we have a candidate (supports both local and URL download)
            if (musicCandidate && (musicCandidate.localPath || musicCandidate.downloadUrl || musicCandidate.downloadUrls)) {
                // Import music (ImportManager now handles both local copy and URL download)
                const musicImportResult = await importManager.importMusic(musicCandidate);

                if (musicImportResult.success) {
                    importedMusic = musicImportResult.music;

                    if (verbose) {
                        const source = musicImportResult.music.downloadedFrom ? 'downloaded from URL' : 'copied from local';
                        console.log(`  🎵 Music: ${musicImportResult.music.title || musicImportResult.music.id} (${source})`);
                    }
                }
            } else if (verbose && musicResources.length > 0) {
                console.log(`  ⚠️ Music: No valid candidate found (need localPath or downloadUrl)`);
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

        // Update production status
        if (importResult.imported > 0 || importedMusic) {
            updateProductionStatus(projectDir, importResult.imported);
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
