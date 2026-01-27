#!/usr/bin/env node

/**
 * Set caption theme for a project
 *
 * Usage:
 *   node set-caption-theme.js --projectDir "path/to/project" --theme "gold-bold"
 *   node set-caption-theme.js --list  # List all available themes
 */

const fs = require('fs').promises;
const path = require('path');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
    string: ['projectDir', 'theme'],
    boolean: ['list'],
    default: {
        theme: 'gold-bold'
    }
});

// Theme definitions (mirror of caption-themes.ts)
const THEMES = {
    'clean-minimal': {
        name: 'Clean Minimal',
        description: 'White rounded background, black text, subtle gray highlight. Professional and readable.',
        keywords: ['educational', 'professional', 'clean', 'minimal', 'tutorial'],
    },
    'gold-bold': {
        name: 'Gold Bold',
        description: 'Bold yellow text with thick black outline. High contrast, attention-grabbing.',
        keywords: ['attention', 'news', 'facts', 'shocking', 'vietnamese', 'bold'],
    },
    'drop-green': {
        name: 'Drop Green',
        description: 'Words drop into place with green highlight on active word. Dynamic and energetic.',
        keywords: ['dynamic', 'action', 'energetic', 'sports', 'gaming'],
    },
    'red-box': {
        name: 'Red Box Highlight',
        description: 'Active word highlighted with red background box. Great for emphasis.',
        keywords: ['important', 'warning', 'cta', 'emphasis', 'urgent'],
    },
    'impact-yellow': {
        name: 'Impact Yellow',
        description: 'Maximum impact with large yellow text and heavy stroke. Perfect for hooks.',
        keywords: ['hook', 'viral', 'shocking', 'reveal', 'impact'],
    },
    'neon-glow': {
        name: 'Neon Glow',
        description: 'Glowing neon text effect. Great for tech and night content.',
        keywords: ['tech', 'futuristic', 'night', 'neon', 'cyber', 'gaming'],
    },
    'story-elegant': {
        name: 'Story Elegant',
        description: 'Soft, elegant style perfect for storytelling and emotional content.',
        keywords: ['story', 'emotional', 'narrative', 'calm', 'art', 'poetry'],
    },
    'minimal-dark': {
        name: 'Minimal Dark',
        description: 'Simple dark text with subtle highlight. Clean and aesthetic.',
        keywords: ['minimal', 'aesthetic', 'art', 'simple', 'design'],
    },
};

async function main() {
    // List themes
    if (args.list) {
        console.log('\n=== Available Caption Themes ===\n');
        Object.entries(THEMES).forEach(([key, theme]) => {
            console.log(`  ${key}`);
            console.log(`    ${theme.name}`);
            console.log(`    ${theme.description}`);
            console.log(`    Keywords: ${theme.keywords.join(', ')}`);
            console.log('');
        });
        return;
    }

    if (!args.projectDir) {
        console.error('Error: --projectDir is required');
        console.log('\nUsage:');
        console.log('  node set-caption-theme.js --projectDir "path/to/project" --theme "gold-bold"');
        console.log('  node set-caption-theme.js --list');
        console.log('\nAvailable themes:', Object.keys(THEMES).join(', '));
        process.exit(1);
    }

    if (!THEMES[args.theme]) {
        console.error(`Error: Unknown theme "${args.theme}"`);
        console.log('Available themes:', Object.keys(THEMES).join(', '));
        process.exit(1);
    }

    const projectDir = path.resolve(args.projectDir);
    const otioPath = path.join(projectDir, 'project.otio');

    console.log(`\n=== Set Caption Theme: ${args.theme} ===\n`);
    console.log(`Theme: ${THEMES[args.theme].name}`);
    console.log(`Description: ${THEMES[args.theme].description}\n`);

    // Read OTIO
    const otioContent = await fs.readFile(otioPath, 'utf-8');
    const otio = JSON.parse(otioContent);

    // Find subtitle track and update all TikTokCaption clips
    let updated = 0;
    const tracks = otio.tracks?.children || [];

    for (const track of tracks) {
        if (track.name?.includes('Subtitle') || track.name?.includes('Caption')) {
            const clips = track.children || [];
            for (const clip of clips) {
                if (clip.metadata?.remotion_component === 'TikTokCaption') {
                    if (!clip.metadata.props) {
                        clip.metadata.props = {};
                    }

                    // Set new theme
                    clip.metadata.props.theme = args.theme;

                    // Remove old props that would override theme
                    // These props were used before theme system existed
                    delete clip.metadata.props.font;
                    delete clip.metadata.props.highlightColor;
                    delete clip.metadata.props.style;
                    delete clip.metadata.props.fontSize;
                    // Keep position if you want to override theme position
                    // delete clip.metadata.props.position;

                    updated++;
                }
            }
        }
    }

    if (updated === 0) {
        console.log('No TikTokCaption clips found in Subtitle track.');
        console.log('Make sure your OTIO has a Subtitles track with TikTokCaption clips.');
        process.exit(1);
    }

    // Save updated OTIO
    await fs.writeFile(otioPath, JSON.stringify(otio, null, 4));

    console.log(`Updated ${updated} caption clip(s) with theme "${args.theme}"`);
    console.log(`\nFile: ${otioPath}\n`);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
