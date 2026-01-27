#!/usr/bin/env node

/**
 * Add background music to a video project
 *
 * This script:
 * 1. Reads script.json to get music query
 * 2. Searches Pixabay for matching music using scraper
 * 3. Downloads the music file
 * 4. Updates resources.json with music info
 * 5. Optionally updates project.otio with music track
 *
 * Usage:
 *   node add-music-to-project.js --projectDir "path/to/project"
 *   node add-music-to-project.js --projectDir "path/to/project" --query "epic cinematic"
 *   node add-music-to-project.js --projectDir "path/to/project" --updateOtio
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '..', '.env') });

const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const minimist = require('minimist');

const PixabayScraper = require('./api/pixabay-scraper');

// Parse arguments
const args = minimist(process.argv.slice(2), {
    string: ['projectDir', 'query', 'outputFile'],
    boolean: ['updateOtio', 'force', 'verbose'],
    number: ['limit'],
    default: {
        limit: 3,
        updateOtio: false,
        force: false,
        verbose: false,
        outputFile: 'background-music.mp3'
    }
});

/**
 * Download a file from URL to destination
 */
async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = require('fs').createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, destPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });
        }).on('error', (err) => {
            require('fs').unlink(destPath, () => {});
            reject(err);
        });
    });
}

/**
 * Add music track to project.otio
 */
async function addMusicToOtio(otioPath, musicPath, musicInfo, scriptPath) {
    const otioContent = await fs.readFile(otioPath, 'utf-8');
    const otio = JSON.parse(otioContent);

    // Read script for music config
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const script = JSON.parse(scriptContent);

    const musicConfig = script.music || {};
    const duration = script.script?.estimatedDuration || script.metadata?.duration || 60;
    const frameRate = 30;
    const totalFrames = duration * frameRate;

    // Check if music track already exists
    const existingMusicTrack = otio.tracks.children.find(t => t.name === 'Music');
    if (existingMusicTrack) {
        console.log('[OTIO] Music track already exists, updating...');
        // Update existing track's clip
        if (existingMusicTrack.children && existingMusicTrack.children.length > 0) {
            existingMusicTrack.children[0].media_references.DEFAULT_MEDIA.target_url = musicPath;
            existingMusicTrack.children[0].metadata.title = musicInfo.title;
        }
    } else {
        // Create new music track
        const musicTrack = {
            "OTIO_SCHEMA": "Track.1",
            "metadata": {
                "volume": musicConfig.volume || 0.15,
                "fadeIn": musicConfig.fadeIn || 3.0,
                "fadeOut": musicConfig.fadeOut || 5.0
            },
            "name": "Music",
            "source_range": null,
            "effects": [],
            "markers": [],
            "enabled": true,
            "color": null,
            "children": [
                {
                    "OTIO_SCHEMA": "Clip.2",
                    "metadata": {
                        "media_type": "audio",
                        "volume": musicConfig.volume || 0.15,
                        "fadeIn": {
                            "duration": (musicConfig.fadeIn || 3.0) * frameRate,
                            "type": "linear"
                        },
                        "fadeOut": {
                            "duration": (musicConfig.fadeOut || 5.0) * frameRate,
                            "type": "linear"
                        },
                        "loop": false,
                        "title": musicInfo.title,
                        "license": musicInfo.license || "Pixabay Content License"
                    },
                    "name": "Background Music",
                    "source_range": {
                        "OTIO_SCHEMA": "TimeRange.1",
                        "duration": {
                            "OTIO_SCHEMA": "RationalTime.1",
                            "rate": frameRate,
                            "value": totalFrames
                        },
                        "start_time": {
                            "OTIO_SCHEMA": "RationalTime.1",
                            "rate": frameRate,
                            "value": 0.0
                        }
                    },
                    "effects": [],
                    "markers": [],
                    "enabled": true,
                    "color": null,
                    "media_references": {
                        "DEFAULT_MEDIA": {
                            "OTIO_SCHEMA": "ExternalReference.1",
                            "metadata": {
                                "duration_sec": musicInfo.duration,
                                "source": "pixabay"
                            },
                            "name": musicInfo.title,
                            "available_range": {
                                "OTIO_SCHEMA": "TimeRange.1",
                                "duration": {
                                    "OTIO_SCHEMA": "RationalTime.1",
                                    "rate": frameRate,
                                    "value": musicInfo.duration * frameRate
                                },
                                "start_time": {
                                    "OTIO_SCHEMA": "RationalTime.1",
                                    "rate": frameRate,
                                    "value": 0.0
                                }
                            },
                            "available_image_bounds": null,
                            "target_url": musicPath
                        }
                    },
                    "active_media_reference_key": "DEFAULT_MEDIA"
                }
            ],
            "kind": "Audio"
        };

        otio.tracks.children.push(musicTrack);
    }

    await fs.writeFile(otioPath, JSON.stringify(otio, null, 4));
    return true;
}

/**
 * Main function
 */
async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║       ADD MUSIC TO PROJECT v1.0                       ║');
    console.log('║       Find and add background music automatically     ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Validate arguments
    if (!args.projectDir) {
        console.error('❌ Error: --projectDir is required\n');
        console.log('Usage:');
        console.log('  node add-music-to-project.js --projectDir "path/to/project"');
        console.log('\nOptions:');
        console.log('  --projectDir     Path to project directory (required)');
        console.log('  --query          Custom music search query (optional, reads from script.json)');
        console.log('  --limit          Number of results to fetch (default: 3)');
        console.log('  --outputFile     Output filename (default: background-music.mp3)');
        console.log('  --updateOtio     Also update project.otio with music track');
        console.log('  --force          Overwrite existing music file');
        console.log('  --verbose        Show detailed logs');
        process.exit(1);
    }

    const projectDir = path.resolve(args.projectDir);
    const scriptPath = path.join(projectDir, 'script.json');
    const resourcesPath = path.join(projectDir, 'resources.json');
    const otioPath = path.join(projectDir, 'project.otio');

    console.log(`📁 Project: ${projectDir}\n`);

    // Check if project exists
    try {
        await fs.access(scriptPath);
    } catch {
        console.error(`❌ Error: script.json not found at ${scriptPath}`);
        process.exit(1);
    }

    // Read script.json for music query
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const script = JSON.parse(scriptContent);

    let musicQuery = args.query;
    if (!musicQuery) {
        // Extract from script
        const musicConfig = script.music || {};
        musicQuery = musicConfig.query || musicConfig.mood || 'ambient background';
        console.log(`🎵 Music query from script: "${musicQuery}"`);
    } else {
        console.log(`🎵 Music query (custom): "${musicQuery}"`);
    }

    // Simplify query for better scraping results
    const simplifiedQuery = musicQuery.split(' ').slice(0, 3).join(' ');
    console.log(`🔍 Searching with: "${simplifiedQuery}"\n`);

    // Create audio directory
    const audioDir = path.join(projectDir, 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    // Check if music already exists
    const musicFilePath = path.join(audioDir, args.outputFile);
    try {
        await fs.access(musicFilePath);
        if (!args.force) {
            console.log(`⚠️  Music file already exists: ${musicFilePath}`);
            console.log('   Use --force to overwrite\n');

            // Still update OTIO if requested
            if (args.updateOtio) {
                console.log('📝 Updating project.otio...');
                // Read existing resources to get music info
                const resourcesContent = await fs.readFile(resourcesPath, 'utf-8');
                const resources = JSON.parse(resourcesContent);
                const existingMusic = resources.resources?.music?.[0] || { title: 'Background Music', duration: 120 };

                await addMusicToOtio(otioPath, `audio/${args.outputFile}`, existingMusic, scriptPath);
                console.log('✅ project.otio updated\n');
            }
            process.exit(0);
        }
    } catch {
        // File doesn't exist, continue
    }

    // Initialize scraper
    const scraper = new PixabayScraper();

    try {
        // Search for music
        console.log('🔍 Searching Pixabay for music...\n');
        const results = await scraper.searchMusic(simplifiedQuery, args.limit);

        if (results.length === 0) {
            console.log('❌ No music found. Try a different query.');
            console.log('   Examples: "piano", "ambient", "cinematic", "upbeat"');
            process.exit(1);
        }

        console.log(`✅ Found ${results.length} tracks:\n`);
        results.forEach((track, i) => {
            console.log(`  ${i + 1}. ${track.title}`);
            console.log(`     Duration: ${track.duration}s`);
            console.log(`     URL: ${track.downloadUrl ? '✓ Available' : '✗ N/A'}`);
        });

        // Find first track with download URL
        const trackToDownload = results.find(t => t.downloadUrl);
        if (!trackToDownload) {
            console.log('\n❌ No downloadable track found');
            process.exit(1);
        }

        console.log(`\n📥 Downloading: "${trackToDownload.title}"...`);

        // Download file
        await downloadFile(trackToDownload.downloadUrl, musicFilePath);
        const stats = await fs.stat(musicFilePath);
        console.log(`✅ Downloaded: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Update resources.json
        console.log('\n📝 Updating resources.json...');
        let resources = { projectName: path.basename(projectDir), resources: { images: [], music: [] } };

        try {
            const existingContent = await fs.readFile(resourcesPath, 'utf-8');
            resources = JSON.parse(existingContent);
        } catch {
            // Create new if not exists
        }

        // Ensure music array exists
        if (!resources.resources) resources.resources = {};
        if (!resources.resources.music) resources.resources.music = [];

        // Add music entry (format compatible with both video-editor patterns)
        resources.resources.music = [{
            id: trackToDownload.id || `pixabay-music-${Date.now()}`,
            title: trackToDownload.title,
            duration: trackToDownload.duration,
            downloadUrl: `audio/${args.outputFile}`,
            sourceUrl: trackToDownload.downloadUrl,
            source: 'pixabay-scraper',
            license: trackToDownload.license || 'Pixabay Content License (Free to use)',
            tags: trackToDownload.tags || [simplifiedQuery],
            // Also include nested format for compatibility
            results: [{
                id: trackToDownload.id || `pixabay-music-${Date.now()}`,
                title: trackToDownload.title,
                downloadUrl: `audio/${args.outputFile}`,
                sourceUrl: trackToDownload.downloadUrl,
                duration: trackToDownload.duration,
                license: trackToDownload.license || 'Pixabay Content License (Free to use)'
            }]
        }];

        await fs.writeFile(resourcesPath, JSON.stringify(resources, null, 2));
        console.log('✅ resources.json updated');

        // Update project.otio if requested
        if (args.updateOtio) {
            try {
                await fs.access(otioPath);
                console.log('\n📝 Updating project.otio...');
                await addMusicToOtio(otioPath, `audio/${args.outputFile}`, trackToDownload, scriptPath);
                console.log('✅ project.otio updated');
            } catch {
                console.log('\n⚠️  project.otio not found, skipping OTIO update');
            }
        }

        // Summary
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║                   ✅ SUCCESS                           ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');
        console.log(`🎵 Track: ${trackToDownload.title}`);
        console.log(`📁 File: ${musicFilePath}`);
        console.log(`⏱️  Duration: ${trackToDownload.duration}s`);
        console.log(`📜 License: ${trackToDownload.license || 'Pixabay Content License'}`);

        if (args.updateOtio) {
            console.log('\n✨ Music track added to timeline!');
        } else {
            console.log('\n✨ Next steps:');
            console.log('   Run video-editor to regenerate OTIO with music, or');
            console.log('   Run this script again with --updateOtio to add music track');
        }
        console.log('');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (args.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        await scraper.close();
    }
}

main();
