#!/usr/bin/env node

/**
 * Add FloatingEffect overlay track to a project OTIO
 *
 * FloatingEffect creates bokeh/firefly particles that float and react to music.
 *
 * Usage:
 *   node add-floating-effect.js --projectDir "path/to/project"
 */

const fs = require('fs').promises;
const path = require('path');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
    string: ['projectDir', 'trackName'],
    boolean: ['force', 'withAudio'],
    default: {
        trackName: 'Floating Effect',
        force: false,
        withAudio: false  // Disabled by default due to useAudioData URL issues
    }
});

async function main() {
    console.log('\n=== Add Floating Effect to Project ===\n');

    if (!args.projectDir) {
        console.error('Error: --projectDir is required');
        console.log('\nUsage:');
        console.log('  node add-floating-effect.js --projectDir "path/to/project"');
        console.log('\nOptions:');
        console.log('  --force       Overwrite existing track');
        console.log('  --withAudio   Enable audio reactivity (experimental)');
        process.exit(1);
    }

    const projectDir = path.resolve(args.projectDir);
    const otioPath = path.join(projectDir, 'project.otio');
    const resourcesPath = path.join(projectDir, 'resources.json');

    // Check files exist
    try {
        await fs.access(otioPath);
    } catch {
        console.error(`Error: project.otio not found at ${otioPath}`);
        process.exit(1);
    }

    // Read OTIO
    const otioContent = await fs.readFile(otioPath, 'utf-8');
    const otio = JSON.parse(otioContent);

    // Get total duration from existing tracks
    const tracks = otio.tracks?.children || [];
    let totalDuration = 0;
    let frameRate = 30;

    for (const track of tracks) {
        if (track.children && track.children.length > 0) {
            for (const clip of track.children) {
                if (clip.source_range?.duration) {
                    const dur = clip.source_range.duration;
                    frameRate = dur.rate || 30;
                    const frames = dur.value;
                    if (frames > totalDuration) {
                        totalDuration = frames;
                    }
                }
            }
        }
    }

    if (totalDuration === 0) {
        console.error('Error: Could not determine video duration from OTIO');
        process.exit(1);
    }

    console.log(`Video duration: ${totalDuration} frames (${(totalDuration / frameRate).toFixed(1)}s @ ${frameRate}fps)`);

    // Check for existing track
    const existingTrackIndex = tracks.findIndex(t => t.name === args.trackName);
    if (existingTrackIndex !== -1) {
        if (args.force) {
            console.log(`Removing existing "${args.trackName}" track...`);
            tracks.splice(existingTrackIndex, 1);
        } else {
            console.log(`Track "${args.trackName}" already exists. Use --force to replace.`);
            process.exit(0);
        }
    }

    // Also remove StarParticles if exists
    const starTrackIndex = tracks.findIndex(t => t.name === 'Star Particles');
    if (starTrackIndex !== -1) {
        console.log('Removing existing "Star Particles" track...');
        tracks.splice(starTrackIndex, 1);
    }

    // Find music file for audio reactivity (optional)
    let audioSrc = null;
    if (args.withAudio) {
        try {
            const resourcesContent = await fs.readFile(resourcesPath, 'utf-8');
            const resources = JSON.parse(resourcesContent);
            const music = resources.resources?.music?.[0];
            if (music) {
                audioSrc = music.downloadUrl || music.results?.[0]?.downloadUrl;
            }
        } catch {
            console.log('No resources.json or music found');
        }
    }

    // Create Floating Effect track
    const floatingEffectTrack = {
        "OTIO_SCHEMA": "Track.1",
        "metadata": {},
        "name": args.trackName,
        "source_range": null,
        "effects": [],
        "markers": [],
        "enabled": true,
        "color": null,
        "children": [
            {
                "OTIO_SCHEMA": "Clip.2",
                "metadata": {
                    "remotion_component": "FloatingEffect",
                    "props": {
                        "audioSrc": audioSrc
                    }
                },
                "name": "Floating Particles",
                "source_range": {
                    "OTIO_SCHEMA": "TimeRange.1",
                    "duration": {
                        "OTIO_SCHEMA": "RationalTime.1",
                        "rate": frameRate,
                        "value": totalDuration
                    },
                    "start_time": {
                        "OTIO_SCHEMA": "RationalTime.1",
                        "rate": frameRate,
                        "value": 0
                    }
                },
                "effects": [],
                "markers": [],
                "enabled": true,
                "color": null,
                "media_references": {
                    "DEFAULT_MEDIA": {
                        "OTIO_SCHEMA": "MissingReference.1",
                        "metadata": {},
                        "name": "FloatingEffect Component"
                    }
                },
                "active_media_reference_key": "DEFAULT_MEDIA"
            }
        ],
        "kind": "Video"
    };

    // Insert track right after Images track (index 1) to be overlay
    const imagesTrackIndex = tracks.findIndex(t => t.name === 'Images');
    if (imagesTrackIndex !== -1) {
        tracks.splice(imagesTrackIndex + 1, 0, floatingEffectTrack);
    } else {
        tracks.unshift(floatingEffectTrack);
    }

    // Save updated OTIO
    await fs.writeFile(otioPath, JSON.stringify(otio, null, 4));

    console.log('\n=== Success ===');
    console.log(`Added "${args.trackName}" track to project.otio`);
    console.log(`Audio Reactive: ${audioSrc ? 'Yes' : 'No'}`);
    console.log(`\nFile: ${otioPath}\n`);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
