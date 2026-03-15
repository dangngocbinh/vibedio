#!/usr/bin/env node
/**
 * Pre-render resource downloader
 * Downloads all remote HTTP resources to local files before rendering.
 * This is the #1 optimization for render speed - local files = no HTTP seeks during render.
 *
 * Usage:
 *   node scripts/pre-render-download.js [project-id]
 *   node scripts/pre-render-download.js my-project
 *   node scripts/pre-render-download.js  # downloads for all projects
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const PROJECTS_DIR = path.join(__dirname, '..', 'public', 'projects');
const CONCURRENCY = 4; // parallel downloads
const MAX_IMAGE_DIMENSION = 1920; // Max width/height for images - prevents OOM in headless Chrome

/**
 * Resize an image to MAX_IMAGE_DIMENSION using sips (macOS built-in) or skip on other platforms.
 * Returns true if resized, false if already within limits or tool unavailable.
 */
function resizeImageIfNeeded(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(ext)) return false;
    try {
        const result = execSync(
            `sips --getProperty pixelWidth --getProperty pixelHeight "${filePath}" 2>/dev/null`,
            { encoding: 'utf8', timeout: 10000 }
        );
        let w = 0, h = 0;
        for (const line of result.split('\n')) {
            if (line.includes('pixelWidth')) w = parseInt(line.trim().split(/\s+/).pop(), 10);
            if (line.includes('pixelHeight')) h = parseInt(line.trim().split(/\s+/).pop(), 10);
        }
        if (Math.max(w, h) > MAX_IMAGE_DIMENSION) {
            execSync(
                `sips --resampleHeightWidthMax ${MAX_IMAGE_DIMENSION} "${filePath}" --out "${filePath}" 2>/dev/null`,
                { timeout: 30000 }
            );
            return true;
        }
    } catch {
        // sips not available (non-macOS) or failed — skip silently
    }
    return false;
}

function isRemoteUrl(url) {
    return url && /^https?:\/\//i.test(url);
}

function isMediaUrl(url) {
    return /\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp)($|\?)/i.test(url);
}

function getExtension(url) {
    const match = url.match(/\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp)($|\?)/i);
    return match ? '.' + match[1].toLowerCase() : '.mp4';
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(destPath)) {
            const stat = fs.statSync(destPath);
            if (stat.size > 10000) { // skip if already downloaded (>10KB)
                resolve({ skipped: true, path: destPath });
                return;
            }
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const file = fs.createWriteStream(destPath + '.tmp');
        const proto = url.startsWith('https') ? https : http;

        const request = proto.get(url, { timeout: 30000 }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(destPath + '.tmp');
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath + '.tmp');
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                fs.renameSync(destPath + '.tmp', destPath);
                resolve({ skipped: false, path: destPath });
            });
        });

        request.on('error', (err) => {
            file.close();
            if (fs.existsSync(destPath + '.tmp')) fs.unlinkSync(destPath + '.tmp');
            reject(err);
        });

        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error(`Timeout downloading ${url}`));
        });
    });
}

function collectUrlsFromOtio(otio, result = []) {
    if (!otio || typeof otio !== 'object') return result;
    if (otio.media_references) {
        Object.values(otio.media_references).forEach(ref => {
            if (ref?.target_url && isRemoteUrl(ref.target_url) && isMediaUrl(ref.target_url)) {
                result.push(ref.target_url);
            }
        });
    }
    if (Array.isArray(otio.children)) {
        otio.children.forEach(child => collectUrlsFromOtio(child, result));
    }
    if (otio.tracks) collectUrlsFromOtio(otio.tracks, result);
    return result;
}

function collectUrlsFromResources(resources) {
    const urls = [];
    if (!resources?.resources) return urls;
    const categories = ['videos', 'images', 'generatedImages', 'pinnedResources'];
    categories.forEach(cat => {
        (resources.resources[cat] || []).forEach(entry => {
            const results = entry.results || [];
            // Determine selected resource IDs for this scene
            const selectedIds = Array.isArray(entry.selectedResourceIds) && entry.selectedResourceIds.length > 0
                ? entry.selectedResourceIds
                : (entry.selectedResourceId ? [entry.selectedResourceId] : []);

            // Only process selected resources, or if none selected, the first result
            const toProcess = selectedIds.length > 0
                ? results.filter(r => selectedIds.includes(r?.id))
                : results.slice(0, 1);

            toProcess.forEach(r => {
                // Skip if already has local path
                if (r.importedPath || r.relativePath || r.localPath) return;
                const url = r.downloadUrl || r.downloadUrls?.hd || r.downloadUrls?.large || r.downloadUrls?.medium || r.downloadUrls?.sd;
                if (url && isRemoteUrl(url) && isMediaUrl(url)) {
                    urls.push({ url, resource: r, sceneId: entry.sceneId });
                }
            });
        });
    });
    return urls;
}

async function runWithConcurrency(tasks, concurrency) {
    const results = [];
    let index = 0;
    async function worker() {
        while (index < tasks.length) {
            const i = index++;
            try {
                results[i] = await tasks[i]();
            } catch (err) {
                results[i] = { error: err.message };
            }
        }
    }
    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
    await Promise.all(workers);
    return results;
}

async function processProject(projectPath) {
    const projectId = path.basename(projectPath);
    console.log(`\n📁 Project: ${projectId}`);

    let totalDownloaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const tasks = [];
    const seenDestPaths = new Set(); // deduplicate by dest path to avoid race conditions

    // 1. Read OTIO file - download remote URLs and patch OTIO to use local paths
    const otioFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('.otio'));
    for (const otioFile of otioFiles) {
        const otioFilePath = path.join(projectPath, otioFile);
        try {
            const otio = JSON.parse(fs.readFileSync(otioFilePath, 'utf8'));
            const urls = [...new Set(collectUrlsFromOtio(otio))];
            console.log(`  📼 OTIO: ${urls.length} remote media URLs found`);
            if (urls.length === 0) continue;

            // Build url → localPath map (use relative paths so Remotion can serve via HTTP)
            const urlToLocal = {};
            urls.forEach((url, i) => {
                const ext = getExtension(url);
                const destName = `downloaded_${i}${ext}`;
                const destPath = path.join(projectPath, 'videos', destName);
                urlToLocal[url] = `videos/${destName}`; // relative path, fixOtioPaths will prefix with basePath
                if (seenDestPaths.has(destPath)) return;
                seenDestPaths.add(destPath);
                tasks.push(async () => {
                    process.stdout.write(`  ⬇️  ${path.basename(destName)}... `);
                    const result = await downloadFile(url, destPath);
                    process.stdout.write(result.skipped ? `✓ cached\n` : `✓ done\n`);
                    return result;
                });
            });

            // Patch OTIO in-place: replace remote target_urls with local paths
            const patchOtio = (obj) => {
                if (!obj || typeof obj !== 'object') return;
                if (obj.target_url && urlToLocal[obj.target_url]) {
                    obj.target_url = urlToLocal[obj.target_url];
                }
                Object.values(obj).forEach(v => {
                    if (Array.isArray(v)) v.forEach(patchOtio);
                    else if (v && typeof v === 'object') patchOtio(v);
                });
            };
            patchOtio(otio);
            fs.writeFileSync(otioFilePath, JSON.stringify(otio, null, 2));
            console.log(`  ✏️  OTIO patched with local paths`);
        } catch (e) {
            console.warn(`  ⚠️  Failed to process ${otioFile}: ${e.message}`);
        }
    }

    // 2. Read resources.json - update localPath for resources without local file
    const resourcesPath = path.join(projectPath, 'resources.json');
    let resourcesModified = false;
    if (fs.existsSync(resourcesPath)) {
        try {
            const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
            const remoteEntries = collectUrlsFromResources(resources);
            console.log(`  🌐 resources.json: ${remoteEntries.length} remote resources without local path`);

            for (const entry of remoteEntries) {
                const { url, resource, sceneId } = entry;
                const ext = getExtension(url);
                const resourceId = resource.id || `res_${Math.random().toString(36).slice(2, 8)}`;
                const subDir = ext.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'images' : 'videos';
                const destName = `${resourceId}${ext}`;
                const destPath = path.join(projectPath, subDir, destName);
                const relativePath = `${subDir}/${destName}`;

                if (seenDestPaths.has(destPath)) {
                    // Already scheduled, just update resource reference
                    resource.localPath = destPath;
                    resource.relativePath = relativePath;
                    resourcesModified = true;
                    continue;
                }
                seenDestPaths.add(destPath);

                tasks.push(async () => {
                    process.stdout.write(`  ⬇️  [${sceneId}] ${destName}... `);
                    const result = await downloadFile(url, destPath);
                    if (!result.error) {
                        // Update resource with local path
                        resource.localPath = destPath;
                        resource.relativePath = relativePath;
                        resourcesModified = true;
                        process.stdout.write(result.skipped ? `✓ cached\n` : `✓ done\n`);
                    } else {
                        process.stdout.write(`✗ failed\n`);
                    }
                    return result;
                });
            }

            // Save modified resources.json after all downloads
            const origTasks = [...tasks];
            tasks.length = 0;
            origTasks.forEach(t => tasks.push(t));
            // We'll save after running tasks below

        } catch (e) {
            console.warn(`  ⚠️  Failed to read resources.json: ${e.message}`);
        }
    }

    if (tasks.length === 0) {
        console.log(`  ✅ All resources are already local`);
        return;
    }

    // Run downloads with concurrency
    const results = await runWithConcurrency(tasks, CONCURRENCY);
    results.forEach(r => {
        if (!r) return;
        if (r.error) totalFailed++;
        else if (r.skipped) totalSkipped++;
        else totalDownloaded++;
    });

    // Save updated resources.json
    if (resourcesModified && fs.existsSync(resourcesPath)) {
        try {
            const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
            fs.writeFileSync(resourcesPath, JSON.stringify(resources, null, 2));
            console.log(`  💾 resources.json updated with local paths`);
        } catch (e) {}
    }

    console.log(`  📊 Downloaded: ${totalDownloaded}, Cached: ${totalSkipped}, Failed: ${totalFailed}`);

    // Resize any oversized images in the project directory
    let resizedCount = 0;
    const allImageDirs = ['images', 'imports/images', 'videos', 'imports', 'uploads', '.'].map(d => path.join(projectPath, d));
    for (const dir of allImageDirs) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
            if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) continue;
            const fullPath = path.join(dir, file);
            if (!fs.statSync(fullPath).isFile()) continue;
            if (resizeImageIfNeeded(fullPath)) {
                process.stdout.write(`  🔲 Resized ${path.relative(projectPath, fullPath)} to max ${MAX_IMAGE_DIMENSION}px\n`);
                resizedCount++;
            }
        }
    }
    if (resizedCount > 0) console.log(`  🖼️  Resized ${resizedCount} oversized image(s)`);
}

async function main() {
    const targetProject = process.argv[2];

    if (!fs.existsSync(PROJECTS_DIR)) {
        console.error(`Projects directory not found: ${PROJECTS_DIR}`);
        process.exit(1);
    }

    const projects = fs.readdirSync(PROJECTS_DIR)
        .filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory())
        .filter(f => !targetProject || f === targetProject);

    if (projects.length === 0) {
        console.error(targetProject ? `Project not found: ${targetProject}` : 'No projects found');
        process.exit(1);
    }

    console.log(`🚀 Pre-render download: ${projects.length} project(s)`);
    console.log(`   Concurrency: ${CONCURRENCY} parallel downloads`);

    for (const project of projects) {
        await processProject(path.join(PROJECTS_DIR, project));
    }

    console.log('\n✅ Pre-render download complete!');
    console.log('💡 Now run: npm run build');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
