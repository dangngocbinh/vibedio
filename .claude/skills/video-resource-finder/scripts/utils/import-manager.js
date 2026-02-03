const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

/**
 * ImportManager - Manages resource import from staging to permanent storage
 * 
 * Workflow:
 * 1. Copy selected resources from downloads/ → imports/
 * 2. Update resource paths to point to imports/
 * 3. Cleanup downloads/ staging area
 */
class ImportManager {
    constructor(projectDir, options = {}) {
        this.projectDir = projectDir;
        this.downloadsDir = path.join(projectDir, 'downloads');
        this.importsDir = path.join(projectDir, 'imports');
        this.autoCleanup = options.autoCleanup !== false; // Default: true
    }

    /**
     * Import selected resources to imports/ directory
     * @param {Array} selections - Array of {sceneId, resource} objects from ResourceSelector
     * @returns {Promise<Object>} Import summary
     */
    async importResources(selections) {
        console.log(`\n📦 Importing ${selections.length} selected resources...`);

        const imported = [];
        const failed = [];

        for (const selection of selections) {
            try {
                const result = await this.importSingleResource(selection);
                imported.push(result);
            } catch (error) {
                console.error(`[ImportManager] Failed to import resource for "${selection.sceneId}":`, error.message);
                failed.push({
                    sceneId: selection.sceneId,
                    error: error.message
                });
            }
        }

        const summary = {
            total: selections.length,
            imported: imported.length,
            failed: failed.length,
            resources: imported,
            errors: failed,
            importsDir: this.importsDir
        };

        console.log(`✅ Import complete: ${summary.imported} imported, ${summary.failed} failed`);

        return summary;
    }

    /**
     * Import a single resource
     * @param {Object} selection - {sceneId, resource} object
     * @returns {Promise<Object>} Updated resource with importedPath
     */
    async importSingleResource(selection) {
        const { sceneId, resource } = selection;

        if (!resource.localPath) {
            throw new Error(`Resource has no localPath to import`);
        }

        // Check if file exists
        try {
            await fsp.access(resource.localPath);
        } catch (err) {
            throw new Error(`Source file not found: ${resource.localPath}`);
        }

        // Determine resource type and target directory
        const type = this.detectResourceType(resource);
        const targetDir = path.join(this.importsDir, type);

        await fsp.mkdir(targetDir, { recursive: true });

        // Generate import filename
        const ext = path.extname(resource.localPath);
        const filename = this.generateImportFilename(sceneId, resource, ext);
        const targetPath = path.join(targetDir, filename);

        // Copy file to imports/
        await fsp.copyFile(resource.localPath, targetPath);

        console.log(`  ✓ ${sceneId}: ${filename}`);

        // Return updated resource
        return {
            ...resource,
            importedPath: targetPath,
            relativePath: path.relative(this.projectDir, targetPath),
            originalDownloadPath: resource.localPath,
            importedAt: new Date().toISOString()
        };
    }

    /**
     * Detect resource type from metadata
     * @param {Object} resource - Resource object
     * @returns {string} Type: 'videos', 'images', 'music', 'sfx'
     */
    detectResourceType(resource) {
        // Check explicit source
        if (resource.source) {
            if (resource.source.includes('music') || resource.source === 'pixabay-scraper') {
                return 'music';
            }
            if (resource.source.includes('sfx')) {
                return 'sfx';
            }
        }

        // Check file extension
        const ext = path.extname(resource.localPath || '').toLowerCase();

        const videoExts = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

        if (videoExts.includes(ext)) return 'videos';
        if (imageExts.includes(ext)) return 'images';
        if (audioExts.includes(ext)) return 'music';

        // Check metadata
        if (resource.duration && resource.width && resource.height) {
            return 'videos';
        }
        if (resource.width && resource.height && !resource.duration) {
            return 'images';
        }

        return 'misc';
    }

    /**
     * Generate clean filename for imported resource
     * Format: {sceneId}_selected_{source}_{id}.{ext}
     */
    generateImportFilename(sceneId, resource, ext) {
        const cleanSceneId = sceneId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const source = (resource.source || 'unknown').split('-')[0]; // pexels, pixabay, etc.
        const id = resource.id ? String(resource.id).split('-').pop() : 'unknown';

        return `${cleanSceneId}_selected_${source}_${id}${ext}`;
    }

    /**
     * Cleanup downloads/ staging directory
     * @returns {Promise<Object>} Cleanup summary
     */
    async cleanupDownloads() {
        if (!this.autoCleanup) {
            console.log(`[ImportManager] Auto cleanup disabled, skipping downloads/ cleanup`);
            return { cleaned: false, reason: 'disabled' };
        }

        console.log(`\n🧹 Cleaning up downloads/ staging area...`);

        try {
            // Check if downloads directory exists
            try {
                await fsp.access(this.downloadsDir);
            } catch {
                console.log(`  ℹ️  downloads/ already clean`);
                return { cleaned: false, reason: 'not_found' };
            }

            // Get size before deletion for reporting
            const sizeBeforeCleanup = await this.getDirectorySize(this.downloadsDir);

            // Remove downloads directory
            await fsp.rm(this.downloadsDir, { recursive: true, force: true });

            console.log(`  ✅ Removed downloads/ (freed ~${this.formatBytes(sizeBeforeCleanup)})`);

            return {
                cleaned: true,
                freedBytes: sizeBeforeCleanup,
                freedFormatted: this.formatBytes(sizeBeforeCleanup)
            };

        } catch (error) {
            console.error(`[ImportManager] Error during cleanup:`, error.message);
            return {
                cleaned: false,
                error: error.message
            };
        }
    }

    /**
     * Get total size of a directory
     */
    async getDirectorySize(dirPath) {
        let totalSize = 0;

        async function walkDir(dir) {
            const entries = await fsp.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await walkDir(fullPath);
                } else {
                    const stats = await fsp.stat(fullPath);
                    totalSize += stats.size;
                }
            }
        }

        try {
            await walkDir(dirPath);
        } catch (err) {
            // Ignore errors
        }

        return totalSize;
    }

    /**
     * Format bytes to human readable size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update resources.json with imported paths
     * @param {string} resourcesPath - Path to resources.json
     * @param {Array} importedResources - Array of imported resources
     */
    async updateResourcesJSON(resourcesPath, importedResources) {
        console.log(`\n📝 Updating resources.json with imported paths...`);

        // Read existing resources.json
        const rawData = await fsp.readFile(resourcesPath, 'utf8');
        const resourcesJSON = JSON.parse(rawData);

        // Create a map of sceneId -> imported resource
        const importMap = new Map();
        for (const imported of importedResources) {
            const sceneId = imported.sceneId || this.extractSceneIdFromPath(imported.importedPath);
            if (sceneId) {
                importMap.set(sceneId, imported);
            }
        }

        // Update resources with imported paths
        const categories = ['videos', 'images', 'generatedImages', 'pinnedResources'];

        for (const category of categories) {
            if (!resourcesJSON.resources[category]) continue;

            for (const group of resourcesJSON.resources[category]) {
                const imported = importMap.get(group.sceneId);
                if (!imported) continue;

                // Find and update the selected resource
                const selectedResource = group.results?.find(r =>
                    r.id === imported.id || r.localPath === imported.originalDownloadPath
                );

                if (selectedResource) {
                    selectedResource.importedPath = imported.relativePath;
                    selectedResource.importedAt = imported.importedAt;
                    selectedResource.selected = true;
                }
            }
        }

        // Add import metadata
        resourcesJSON.importSummary = {
            imported: importedResources.length,
            importedAt: new Date().toISOString(),
            importsDir: path.relative(this.projectDir, this.importsDir)
        };

        // Save updated resources.json
        await fsp.writeFile(resourcesPath, JSON.stringify(resourcesJSON, null, 2), 'utf8');

        console.log(`  ✅ Updated resources.json with ${importedResources.length} imported paths`);
    }

    /**
     * Extract sceneId from imported path
     */
    extractSceneIdFromPath(importedPath) {
        const filename = path.basename(importedPath, path.extname(importedPath));
        const match = filename.match(/^([^_]+)_selected/);
        return match ? match[1] : null;
    }
}

module.exports = ImportManager;
