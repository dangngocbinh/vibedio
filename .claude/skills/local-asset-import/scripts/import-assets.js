#!/usr/bin/env node

/**
 * Local Asset Import Script
 *
 * Import local files into a video project.
 * - Detects content type from extension
 * - Smart-renames for clarity
 * - Classifies into subfolders: imports/{videos,images,music,sfx}
 * - Files already inside the project are referenced in-place
 * - Files outside the project are copied into imports/
 *
 * Zero external dependencies - uses only Node.js built-ins.
 *
 * Usage:
 *   node import-assets.js --projectDir <path> --files <path1> [path2...] [options]
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const FileClassifier = require('./file-classifier');
const SmartRenamer = require('./smart-renamer');

// ─── FS Helpers (replace fs-extra) ──────────────────────────────────

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
  // Don't overwrite if dest already exists
  if (await pathExists(dest)) return;
  await fsp.copyFile(src, dest);
}

async function readJson(filePath) {
  const data = await fsp.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function writeJson(filePath, obj) {
  await fsp.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

// ─── Argument Parsing ───────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    projectDir: null,
    files: [],
    type: 'auto',
    sceneId: null,
    label: null,
    updateResources: false,
    dryRun: false,
  };

  let i = 2; // skip node and script path
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--projectDir' && argv[i + 1]) {
      args.projectDir = argv[++i];
    } else if (arg === '--files') {
      i++;
      while (i < argv.length && !argv[i].startsWith('--')) {
        args.files.push(argv[i]);
        i++;
      }
      continue; // don't increment i again
    } else if (arg === '--type' && argv[i + 1]) {
      args.type = argv[++i];
    } else if (arg === '--sceneId' && argv[i + 1]) {
      args.sceneId = argv[++i];
    } else if (arg === '--label' && argv[i + 1]) {
      args.label = argv[++i];
    } else if (arg === '--updateResources') {
      args.updateResources = true;
    } else if (arg === '--dryRun') {
      args.dryRun = true;
    }

    i++;
  }

  return args;
}

// ─── Path Helpers ───────────────────────────────────────────────────

/**
 * Expand ~ and resolve to absolute path
 */
function expandPath(filePath) {
  if (filePath.startsWith('~')) {
    return path.resolve(os.homedir(), filePath.slice(2));
  }
  return path.resolve(filePath);
}

/**
 * Check if a file is inside the project directory
 */
function isInsideProject(filePath, projectDir) {
  const absFile = path.resolve(filePath);
  const absProject = path.resolve(projectDir);
  return absFile.startsWith(absProject + path.sep) || absFile === absProject;
}

/**
 * Get relative path from project dir
 */
function getRelativePath(filePath, projectDir) {
  return path.relative(path.resolve(projectDir), path.resolve(filePath));
}

// ─── Resources.json Updater ─────────────────────────────────────────

async function updateResourcesJson(projectDir, importedFiles) {
  const resourcesPath = path.join(projectDir, 'resources.json');
  let resources = {};

  if (await pathExists(resourcesPath)) {
    resources = await readJson(resourcesPath);
  }

  // Ensure imports section exists
  if (!resources.imports) {
    resources.imports = [];
  }

  for (const file of importedFiles) {
    resources.imports.push({
      id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      originalPath: file.originalPath,
      localPath: file.importedPath,
      relativePath: file.relativePath,
      contentType: file.contentType,
      filename: file.filename,
      fileSize: file.fileSize,
      sceneId: file.sceneId || null,
      label: file.label || null,
      importedAt: new Date().toISOString(),
      source: 'local-import',
    });
  }

  // Update summary counts
  if (!resources.summary) {
    resources.summary = {};
  }
  resources.summary.totalImported = resources.imports.length;

  await writeJson(resourcesPath, resources);
  return resources;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  // Validate
  if (!args.projectDir) {
    console.error(JSON.stringify({
      success: false,
      error: 'Missing required --projectDir',
      usage: 'node import-assets.js --projectDir <path> --files <path1> [path2...]',
    }));
    process.exit(1);
  }

  if (args.files.length === 0) {
    console.error(JSON.stringify({
      success: false,
      error: 'No files specified. Use --files <path1> [path2...]',
    }));
    process.exit(1);
  }

  const projectDir = expandPath(args.projectDir);
  const classifier = new FileClassifier();
  const renamer = new SmartRenamer();

  // Ensure project dir exists
  if (!await pathExists(projectDir)) {
    console.error(JSON.stringify({
      success: false,
      error: `Project directory not found: ${projectDir}`,
    }));
    process.exit(1);
  }

  const results = {
    success: true,
    imported: [],
    skipped: [],
    errors: [],
    summary: { total: 0, imported: 0, skipped: 0, errors: 0 },
  };

  const existingFilenames = new Set();

  for (const rawPath of args.files) {
    results.summary.total++;
    const absPath = expandPath(rawPath);

    // Check file exists
    if (!await pathExists(absPath)) {
      results.errors.push({
        originalPath: rawPath,
        error: `File not found: ${absPath}`,
      });
      results.summary.errors++;
      continue;
    }

    // Check it's a file, not directory
    const stat = await fsp.stat(absPath);
    if (stat.isDirectory()) {
      results.errors.push({
        originalPath: rawPath,
        error: 'Path is a directory, not a file. Provide individual files.',
      });
      results.summary.errors++;
      continue;
    }

    // Classify
    const classification = classifier.classify(absPath, args.type);
    if (!classification.supported && args.type === 'auto') {
      results.skipped.push({
        originalPath: rawPath,
        reason: `Unsupported file type: ${classification.ext}`,
        supportedTypes: classifier.getSupportedExtensions().join(', '),
      });
      results.summary.skipped++;
      continue;
    }

    // Check if file is already inside project
    const alreadyInProject = isInsideProject(absPath, projectDir);

    if (alreadyInProject) {
      // File is already in project - just reference it
      const relativePath = getRelativePath(absPath, projectDir);
      results.imported.push({
        originalPath: absPath,
        importedPath: absPath,
        relativePath,
        contentType: classification.contentType,
        fileSize: stat.size,
        filename: path.basename(absPath),
        alreadyInProject: true,
        action: 'referenced',
        sceneId: args.sceneId || null,
        label: args.label || null,
      });
      results.summary.imported++;
      continue;
    }

    // Smart rename
    const renamed = renamer.rename(absPath, {
      sceneId: args.sceneId,
      label: args.label,
      contentType: classification.contentType,
    });

    // Resolve collisions
    const finalFilename = renamer.resolveCollision(renamed.filename, existingFilenames);
    existingFilenames.add(finalFilename);

    // Determine target directory
    const targetDir = path.join(projectDir, 'imports', classification.folder);
    const targetPath = path.join(targetDir, finalFilename);
    const relativePath = path.relative(projectDir, targetPath);

    if (args.dryRun) {
      results.imported.push({
        originalPath: absPath,
        importedPath: targetPath,
        relativePath,
        contentType: classification.contentType,
        fileSize: stat.size,
        filename: finalFilename,
        alreadyInProject: false,
        action: 'dry-run (would copy)',
        sceneId: args.sceneId || null,
        label: args.label || null,
      });
      results.summary.imported++;
      continue;
    }

    // Create target directory and copy
    try {
      await ensureDir(targetDir);
      await copyFile(absPath, targetPath);

      // Verify copy
      const copiedStat = await fsp.stat(targetPath);

      results.imported.push({
        originalPath: absPath,
        importedPath: targetPath,
        relativePath,
        contentType: classification.contentType,
        fileSize: copiedStat.size,
        filename: finalFilename,
        alreadyInProject: false,
        action: 'copied',
        sceneId: args.sceneId || null,
        label: args.label || null,
      });
      results.summary.imported++;
    } catch (err) {
      results.errors.push({
        originalPath: absPath,
        targetPath,
        error: err.message,
      });
      results.summary.errors++;
    }
  }

  // Update resources.json if requested
  if (args.updateResources && results.imported.length > 0 && !args.dryRun) {
    try {
      await updateResourcesJson(projectDir, results.imported);
      results.resourcesUpdated = true;
    } catch (err) {
      results.resourcesUpdated = false;
      results.resourcesError = err.message;
    }
  }

  // Output
  results.success = results.summary.errors === 0;
  console.log(JSON.stringify(results, null, 2));

  process.exit(results.success ? 0 : 1);
}

main().catch(err => {
  console.error(JSON.stringify({
    success: false,
    error: err.message,
    stack: err.stack,
  }));
  process.exit(1);
});
