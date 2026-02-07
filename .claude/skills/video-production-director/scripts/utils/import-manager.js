const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * ImportManager - Manages resource import from URLs or staging to permanent storage
 *
 * NEW Workflow (v2.0 - URL-first):
 * 1. Download from URL → imports/ (chỉ file đã chọn)
 * 2. Update resource paths to point to imports/
 * 3. NO cleanup (không có downloads/ staging nữa)
 *
 * Legacy Workflow (vẫn hỗ trợ):
 * 1. Copy từ downloads/ → imports/ (nếu có localPath)
 * 2. Update resource paths to point to imports/
 * 3. Cleanup downloads/ staging area (optional)
 */
class ImportManager {
    constructor(projectDir, options = {}) {
        this.projectDir = projectDir;
        this.downloadsDir = path.join(projectDir, 'downloads');
        this.importsDir = path.join(projectDir, 'imports');
        this.autoCleanup = options.autoCleanup !== false; // Default: true
        this.downloadTimeout = options.downloadTimeout || 60000; // 60s default
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
     * Import a single resource - supports both URL download and local copy
     * @param {Object} selection - {sceneId, resource} object
     * @returns {Promise<Object>} Updated resource with importedPath
     */
    async importSingleResource(selection) {
        const { sceneId, resource } = selection;

        // Determine resource type and target directory
        const type = this.detectResourceType(resource);
        const targetDir = path.join(this.importsDir, type);
        await fsp.mkdir(targetDir, { recursive: true });

        // Strategy 1: Check if localPath exists (legacy workflow - copy from downloads/)
        if (resource.localPath) {
            let sourcePath = resource.localPath;
            if (!path.isAbsolute(sourcePath)) {
                sourcePath = path.resolve(this.projectDir, sourcePath);
            }

            // Reject invalid local extension early and fallback to URL download
            const localExt = path.extname(sourcePath).toLowerCase();
            if (localExt === '.dat') {
                console.log(`  ℹ️ ${sceneId}: localPath is .dat, skipping local and trying URL...`);
            } else {
                try {
                    await fsp.access(sourcePath);
                    // File exists locally - copy it
                    const ext = path.extname(sourcePath);
                    const filename = this.generateImportFilename(sceneId, resource, ext);
                    const targetPath = path.join(targetDir, filename);

                    await fsp.copyFile(sourcePath, targetPath);
                    console.log(`  ✓ ${sceneId}: ${filename} (copied from local)`);

                    return {
                        ...resource,
                        sceneId, // Ensure sceneId is included for mapping
                        importedPath: targetPath,
                        relativePath: path.relative(this.projectDir, targetPath),
                        originalDownloadPath: resource.localPath,
                        importedAt: new Date().toISOString()
                    };
                } catch (err) {
                    // Local file doesn't exist, try URL download
                    console.log(`  ℹ️ ${sceneId}: Local file not found, trying URL download...`);
                }
            }
        }

        // Strategy 2: Download from URL (NEW workflow)
        const downloadUrl = this.getDownloadUrl(resource);
        if (!downloadUrl) {
            throw new Error(`Resource has no valid URL or localPath to import`);
        }

        // Generate filename from URL
        const ext = this.getExtensionFromUrl(downloadUrl, type);
        const filename = this.generateImportFilename(sceneId, resource, ext);
        const targetPath = path.join(targetDir, filename);

        // Download file
        const downloadResult = await this.downloadFromUrl(downloadUrl, targetPath, type);
        const finalPath = downloadResult.finalPath || targetPath;
        const finalFilename = path.basename(finalPath);
        console.log(`  ✓ ${sceneId}: ${finalFilename} (downloaded from URL)`);

        return {
            ...resource,
            sceneId, // Ensure sceneId is included for mapping
            importedPath: finalPath,
            relativePath: path.relative(this.projectDir, finalPath),
            downloadedFrom: downloadUrl,
            mimeType: downloadResult.mimeType || resource.mimeType,
            importedAt: new Date().toISOString()
        };
    }

    /**
     * Get the best download URL from resource
     * Priority: downloadUrls.hd > downloadUrls.sd > downloadUrl > url
     */
    getDownloadUrl(resource) {
        // Check downloadUrls object
        if (resource.downloadUrls) {
            for (const quality of ['hd', 'sd', '4k', 'original', 'large', 'medium']) {
                if (resource.downloadUrls[quality]) {
                    return resource.downloadUrls[quality];
                }
            }
        }

        // Fallback to single downloadUrl
        if (resource.downloadUrl) {
            return resource.downloadUrl;
        }

        // Last resort: url (only if it looks like a direct media URL)
        if (resource.url && this.isDirectMediaUrl(resource.url)) {
            return resource.url;
        }

        return null;
    }

    /**
     * Check if URL is a direct media URL (not a page view)
     */
    isDirectMediaUrl(url) {
        // Reject page URLs
        if (url.includes('pexels.com/video/') || url.includes('pixabay.com/videos/')) {
            return false;
        }
        if (url.includes('pexels.com/photo/') || url.includes('pixabay.com/photos/')) {
            return false;
        }
        // Accept direct CDN URLs
        const cdnPatterns = ['cdn.pexels.com', 'cdn.pixabay.com', 'vimeo.com', 'player.vimeo.com'];
        if (cdnPatterns.some(cdn => url.includes(cdn))) {
            return true;
        }
        // Accept URLs ending with media extensions
        const mediaExts = ['.mp4', '.mov', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav'];
        if (mediaExts.some(ext => url.toLowerCase().endsWith(ext))) {
            return true;
        }
        return false;
    }

    /**
     * Get file extension from URL or default based on type
     */
    getExtensionFromUrl(url, type) {
        // Try to extract from URL
        const urlPath = new URL(url).pathname;
        const ext = path.extname(urlPath).toLowerCase();
        if (ext && ext.length <= 5 && ext !== '.dat' && ext !== '.bin') {
            return ext;
        }

        // Default extensions by type
        const defaults = {
            'videos': '.mp4',
            'images': '.jpg',
            'music': '.mp3',
            'sfx': '.mp3',
            'misc': ''
        };
        return defaults[type] || '';
    }

    /**
     * Download file from URL to destination path
     * @param {string} url - URL to download from
     * @param {string} destPath - Destination file path
     */
    async downloadFromUrl(url, destPath, expectedType = null) {
        return new Promise((resolve, reject) => {
            const tempPath = destPath + '.tmp';
            let redirectCount = 0;
            const maxRedirects = 5;

            const makeRequest = (requestUrl) => {
                const protocol = requestUrl.startsWith('https') ? https : http;
                const file = fs.createWriteStream(tempPath);

                const request = protocol.get(requestUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    },
                    timeout: this.downloadTimeout
                }, (response) => {
                    // Handle redirects
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        redirectCount++;
                        if (redirectCount > maxRedirects) {
                            file.close();
                            fs.unlinkSync(tempPath);
                            reject(new Error(`Too many redirects for: ${url}`));
                            return;
                        }
                        file.close();
                        // Follow redirect
                        const redirectUrl = response.headers.location.startsWith('http')
                            ? response.headers.location
                            : new URL(response.headers.location, requestUrl).href;
                        makeRequest(redirectUrl);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        file.close();
                        fs.unlinkSync(tempPath);
                        reject(new Error(`Failed to download: ${url} (status: ${response.statusCode})`));
                        return;
                    }

                    const contentType = String(response.headers['content-type'] || '').toLowerCase();
                    if (contentType.includes('text/html')) {
                        file.close();
                        try { fs.unlinkSync(tempPath); } catch (e) { }
                        reject(new Error(`Invalid media response (HTML): ${requestUrl}`));
                        return;
                    }
                    if (!this.isMimeCompatible(contentType, expectedType)) {
                        file.close();
                        try { fs.unlinkSync(tempPath); } catch (e) { }
                        reject(new Error(`MIME mismatch for ${expectedType}: ${contentType || 'unknown'}`));
                        return;
                    }

                    response.pipe(file);

                    file.on('finish', () => {
                        file.close();
                        const expectedExt = this.inferExtensionFromMime(contentType, expectedType);
                        const currentExt = path.extname(destPath).toLowerCase();
                        let finalPath = destPath;
                        if (expectedExt && currentExt !== expectedExt) {
                            finalPath = destPath.slice(0, destPath.length - currentExt.length) + expectedExt;
                        }
                        // Rename temp file to final
                        fs.renameSync(tempPath, finalPath);
                        resolve({ finalPath, mimeType: contentType });
                    });
                });

                request.on('error', (err) => {
                    file.close();
                    try { fs.unlinkSync(tempPath); } catch (e) { }
                    reject(new Error(`Download error for ${url}: ${err.message}`));
                });

                request.on('timeout', () => {
                    request.destroy();
                    file.close();
                    try { fs.unlinkSync(tempPath); } catch (e) { }
                    reject(new Error(`Download timeout for: ${url}`));
                });
            };

            makeRequest(url);
        });
    }

    inferExtensionFromMime(mimeType, expectedType) {
        const lower = String(mimeType || '').toLowerCase();
        if (lower.includes('video/mp4')) return '.mp4';
        if (lower.includes('video/webm')) return '.webm';
        if (lower.includes('video/quicktime')) return '.mov';
        if (lower.includes('image/jpeg')) return '.jpg';
        if (lower.includes('image/png')) return '.png';
        if (lower.includes('image/webp')) return '.webp';
        if (lower.includes('image/gif')) return '.gif';
        if (lower.includes('audio/mpeg')) return '.mp3';
        if (lower.includes('audio/wav')) return '.wav';
        if (lower.includes('audio/ogg')) return '.ogg';
        if (lower.includes('audio/mp4')) return '.m4a';

        if (expectedType === 'videos') return '.mp4';
        if (expectedType === 'images') return '.jpg';
        if (expectedType === 'music' || expectedType === 'sfx') return '.mp3';
        return '';
    }

    isMimeCompatible(mimeType, expectedType) {
        if (!mimeType) return true;
        const lower = String(mimeType).toLowerCase();
        if (lower.includes('text/html')) return false;
        if (expectedType === 'videos') return lower.startsWith('video/');
        if (expectedType === 'images') return lower.startsWith('image/');
        if (expectedType === 'music' || expectedType === 'sfx') return lower.startsWith('audio/');
        return true;
    }

    /**
     * Detect resource type from metadata
     * @param {Object} resource - Resource object
     * @returns {string} Type: 'videos', 'images', 'music', 'sfx'
     */
    detectResourceType(resource) {
        // Check explicit type field first
        if (resource.type) {
            if (resource.type === 'video') return 'videos';
            if (resource.type === 'image') return 'images';
            if (resource.type === 'music' || resource.type === 'audio') return 'music';
            if (resource.type === 'sfx') return 'sfx';
        }

        // Check explicit source
        if (resource.source) {
            if (resource.source.includes('music') || resource.source === 'pixabay-scraper') {
                return 'music';
            }
            if (resource.source.includes('sfx')) {
                return 'sfx';
            }
        }

        // Check file extension from localPath or URL
        const urlForExt = resource.localPath || resource.downloadUrl || resource.url || '';
        const ext = path.extname(new URL(urlForExt, 'file://').pathname || '').toLowerCase();

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
     * Import music to imports/music/ directory
     * Supports both local copy and URL download
     * @param {Object} musicResource - Music resource object from resources.json
     * @returns {Promise<Object>} Import result with music info
     */
    async importMusic(musicResource) {
        console.log(`\n🎵 Importing background music...`);

        try {
            // Create music directory
            const musicDir = path.join(this.importsDir, 'music');
            await fsp.mkdir(musicDir, { recursive: true });

            const source = (musicResource.source || 'unknown').split('-')[0];
            const id = musicResource.id ? String(musicResource.id).split('-').pop() : 'unknown';

            // Strategy 1: Try local file first
            if (musicResource.localPath) {
                let sourcePath = musicResource.localPath;
                if (!path.isAbsolute(sourcePath)) {
                    sourcePath = path.resolve(this.projectDir, sourcePath);
                }

                try {
                    await fsp.access(sourcePath);
                    // File exists locally - copy it
                    const ext = path.extname(sourcePath);
                    const filename = `background-music_${source}_${id}${ext}`;
                    const targetPath = path.join(musicDir, filename);

                    await fsp.copyFile(sourcePath, targetPath);
                    console.log(`  ✓ ${musicResource.title || filename} (copied from local)`);

                    return {
                        success: true,
                        music: {
                            ...musicResource,
                            id: musicResource.id,
                            title: musicResource.title,
                            importedPath: targetPath,
                            relativePath: path.relative(this.projectDir, targetPath),
                            originalDownloadPath: musicResource.localPath,
                            importedAt: new Date().toISOString()
                        }
                    };
                } catch (err) {
                    console.log(`  ℹ️ Music local file not found, trying URL download...`);
                }
            }

            // Strategy 2: Download from URL
            const downloadUrl = this.getDownloadUrl(musicResource);
            if (!downloadUrl) {
                throw new Error(`Music resource has no valid URL or localPath to import`);
            }

            const ext = this.getExtensionFromUrl(downloadUrl, 'music');
            const filename = `background-music_${source}_${id}${ext}`;
            const targetPath = path.join(musicDir, filename);

            await this.downloadFromUrl(downloadUrl, targetPath);
            console.log(`  ✓ ${musicResource.title || filename} (downloaded from URL)`);

            return {
                success: true,
                music: {
                    ...musicResource,
                    id: musicResource.id,
                    title: musicResource.title,
                    importedPath: targetPath,
                    relativePath: path.relative(this.projectDir, targetPath),
                    downloadedFrom: downloadUrl,
                    importedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error(`[ImportManager] Failed to import music:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
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
