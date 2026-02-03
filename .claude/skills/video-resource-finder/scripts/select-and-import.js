#!/usr/bin/env node

/**
 * Select and Import Resources CLI
 * 
 * Usage:
 *   node scripts/select-and-import.js --projectDir "path/to/project"
 * 
 * This tool:
 * 1. Reads resources.json and script.json
 * 2. Uses ResourceSelector to pick best resources
 * 3. Imports selected resources to imports/
 * 4. Cleans up downloads/ staging area
 * 5. Updates resources.json with selections
 */

const minimist = require('minimist');
const path = require('path');
const fs = require('fs');

const ResourceSelector = require('./processors/resource-selector');
const ImportManager = require('./utils/import-manager');

async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║       RESOURCE SELECTION & IMPORT                    ║');
    console.log('║       Select best resources and import to project    ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Parse arguments
    const args = minimist(process.argv.slice(2), {
        string: ['projectDir'],
        boolean: ['skipCleanup', 'keepDownloads'],
        default: {
            skipCleanup: false,
            keepDownloads: false
        }
    });

    if (!args.projectDir) {
        console.error('❌ Error: --projectDir is required');
        console.log('\nUsage:');
        console.log('  node scripts/select-and-import.js --projectDir "path/to/project"');
        console.log('\nOptions:');
        console.log('  --projectDir      Path to project directory (required)');
        console.log('  --skipCleanup     Skip cleaning up downloads/ (keep staging files)');
        console.log('  --keepDownloads   Alias for --skipCleanup');
        process.exit(1);
    }

    // Resolve project directory
    const projectDir = path.resolve(args.projectDir);
    console.log(`📁 Project Directory: ${projectDir}\n`);

    try {
        // Step 1: Read resources.json
        console.log('📖 Reading resources.json...');
        const resourcesPath = path.join(projectDir, 'resources.json');

        if (!fs.existsSync(resourcesPath)) {
            throw new Error(`resources.json not found at: ${resourcesPath}`);
        }

        const resourcesData = fs.readFileSync(resourcesPath, 'utf8');
        const resourcesJSON = JSON.parse(resourcesData);
        console.log(`  ✓ Loaded resources.json\n`);

        // Step 2: Read script.json to get scene info
        console.log('📖 Reading script.json...');
        const scriptPath = path.join(projectDir, 'script.json');

        if (!fs.existsSync(scriptPath)) {
            throw new Error(`script.json not found at: ${scriptPath}`);
        }

        const scriptData = fs.readFileSync(scriptPath, 'utf8');
        const script = JSON.parse(scriptData);

        // Extract scenes from script
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
                            text: scene.text
                        });
                    }
                }
            }
        }

        console.log(`  ✓ Found ${scenes.length} scenes\n`);

        if (scenes.length === 0) {
            console.warn('⚠️  No scenes found in script.json');
            process.exit(0);
        }

        // Step 3: Initialize ResourceSelector
        console.log('🎯 Selecting best resources...');
        const selector = new ResourceSelector({
            textMatchWeight: 0.4,
            apiRankWeight: 0.3,
            qualityWeight: 0.2,
            diversityWeight: 0.1
        });

        const selectionResult = selector.selectAllResources(scenes, resourcesJSON);

        console.log(`\n📊 Selection Summary:`);
        console.log(`  Total scenes:     ${selectionResult.stats.total}`);
        console.log(`  Selected:         ${selectionResult.stats.selected}`);
        console.log(`  Failed:           ${selectionResult.stats.failed}`);
        console.log(`  Average score:    ${selectionResult.stats.averageScore.toFixed(3)}`);
        console.log(`\n  Source distribution:`);
        for (const [source, count] of Object.entries(selectionResult.sourceDistribution)) {
            console.log(`    ${source}: ${count}`);
        }
        console.log('');

        if (selectionResult.selections.length === 0) {
            console.warn('⚠️  No resources selected, nothing to import');
            process.exit(0);
        }

        // Step 4: Import selected resources
        const autoCleanup = !args.skipCleanup && !args.keepDownloads;
        const importManager = new ImportManager(projectDir, { autoCleanup });

        const importResult = await importManager.importResources(selectionResult.selections);

        console.log(`\n📦 Import Summary:`);
        console.log(`  Total:      ${importResult.total}`);
        console.log(`  Imported:   ${importResult.imported}`);
        console.log(`  Failed:     ${importResult.failed}`);
        console.log(`  Location:   ${importResult.importsDir}`);

        if (importResult.failed > 0) {
            console.log(`\n⚠️  Import Errors:`);
            for (const error of importResult.errors) {
                console.log(`  ${error.sceneId}: ${error.error}`);
            }
        }

        // Step 5: Update resources.json with imported paths
        if (importResult.imported > 0) {
            // Add imported resources to selections
            const selectionsWithImports = selectionResult.selections.map((sel, idx) => ({
                ...sel,
                ...importResult.resources[idx]
            }));

            await importManager.updateResourcesJSON(resourcesPath, selectionsWithImports);
        }

        // Step 6: Cleanup downloads/ if enabled
        if (autoCleanup) {
            const cleanupResult = await importManager.cleanupDownloads();

            if (cleanupResult.cleaned) {
                console.log(`\n✨ Cleanup: ${cleanupResult.freedFormatted} freed from downloads/`);
            }
        } else {
            console.log(`\nℹ️  Skipped cleanup (use without --skipCleanup to auto-cleanup downloads/)`);
        }

        // Step 7: Print next steps
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║                   ✅ SUCCESS                           ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        console.log('✨ Next steps:');
        console.log('  1. Review selected resources in imports/');
        console.log('  2. Build video timeline with video-editor skill');
        console.log('  3. Render final video\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run
main();
