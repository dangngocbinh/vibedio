const path = require('path');

/**
 * Smart file renamer for imported assets
 * Expands cryptic filenames into descriptive, project-friendly names
 *
 * Naming pattern: import_{sceneId}_{label}_{cleanedName}.{ext}
 */
class SmartRenamer {
  constructor(options = {}) {
    this.prefix = options.prefix || 'import';
    this.maxLength = options.maxLength || 120;
  }

  /**
   * Extract sceneId from filename if it follows pattern: {sceneId}_{description}.ext
   * Examples:
   * - "scene_1_peaceful_nature.mp4" → "scene_1"
   * - "item1_coding_workspace.jpg" → "item1"
   * - "hook_amazing_intro.mp4" → "hook"
   * @param {string} filename - Original filename
   * @returns {string|null} Extracted sceneId or null
   */
  extractSceneId(filename) {
    const nameWithoutExt = path.basename(filename, path.extname(filename));

    // Try common scene patterns
    const patterns = [
      /^(scene_\d+)/i,        // scene_1, scene_2, etc.
      /^(item\d+)/i,          // item1, item2, etc.
      /^(hook|intro|cta|outro|conclusion)/i,  // common scene names
      /^([a-z0-9_-]+?)_/i     // anything before first underscore
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Generate a descriptive import filename
   * @param {string} originalPath - Original file path
   * @param {Object} context - Import context
   * @param {string} [context.sceneId] - Scene ID to associate with (auto-detected if not provided)
   * @param {string} [context.label] - Descriptive label
   * @param {string} [context.contentType] - Content type (video, image, etc.)
   * @returns {{ filename: string, parts: Object }}
   */
  rename(originalPath, context = {}) {
    const ext = path.extname(originalPath).toLowerCase();
    const basename = path.basename(originalPath, ext);
    let { sceneId, label } = context;

    // Smart sceneId detection if not provided
    if (!sceneId) {
      const detectedSceneId = this.extractSceneId(originalPath);
      if (detectedSceneId) {
        sceneId = detectedSceneId;
        console.log(`[SmartRenamer] Auto-detected sceneId: "${sceneId}" from filename`);
      }
    }

    // Clean the original name
    const cleanedName = this.cleanName(basename);

    // Build filename parts in order
    const parts = [this.prefix];

    if (sceneId) {
      parts.push(this.sanitize(sceneId));
    }

    if (label) {
      parts.push(this.sanitize(label));
    }

    // Add cleaned original name (skip if redundant with label)
    if (cleanedName && cleanedName !== this.sanitize(label)) {
      parts.push(cleanedName);
    }

    let filename = parts.join('_') + ext;

    // Enforce max length
    if (filename.length > this.maxLength) {
      const extLen = ext.length;
      filename = filename.substring(0, this.maxLength - extLen) + ext;
    }

    return {
      filename,
      parts: {
        prefix: this.prefix,
        sceneId: sceneId || null,
        label: label || null,
        cleanedName,
        ext,
      },
    };
  }

  /**
   * Clean a raw filename into something readable
   * Handles common patterns: IMG_xxxx, Screenshot, DSC, etc.
   * @param {string} name - Raw filename without extension
   * @returns {string} Cleaned name
   */
  cleanName(name) {
    if (!name) return '';

    let cleaned = name;

    // Normalize unicode and trim
    cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace common separators with hyphens
    cleaned = cleaned
      .replace(/[\s_]+/g, '-')       // spaces and underscores → hyphens
      .replace(/[()[\]{}]/g, '')     // remove brackets/parens
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // remove special chars
      .replace(/-+/g, '-')           // collapse multiple hyphens
      .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
      .toLowerCase();

    // Expand common camera/device prefixes
    const expansions = [
      [/^img[-_]?(\d+)$/i, 'img-$1'],
      [/^dsc[-_]?(\d+)$/i, 'dsc-$1'],
      [/^dscn[-_]?(\d+)$/i, 'dscn-$1'],
      [/^p(\d{6,})$/i, 'photo-$1'],
      [/^vid[-_]?(\d+)$/i, 'vid-$1'],
      [/^mov[-_]?(\d+)$/i, 'mov-$1'],
      [/^screen[-_]?shot[-_]?(.*)$/i, 'screenshot-$1'],
      [/^screen[-_]?recording[-_]?(.*)$/i, 'screen-recording-$1'],
      [/^untitled[-_]?(\d*)$/i, 'untitled-$1'],
      [/^new[-_]?file[-_]?(\d*)$/i, 'file-$1'],
    ];

    for (const [pattern, replacement] of expansions) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, replacement);
        break;
      }
    }

    // Remove trailing hyphens from expansion
    cleaned = cleaned.replace(/-+$/g, '').replace(/^-+/g, '');

    // Truncate very long names
    if (cleaned.length > 60) {
      cleaned = cleaned.substring(0, 60).replace(/-$/, '');
    }

    return cleaned || 'file';
  }

  /**
   * Sanitize a string for use in filename
   * @param {string} str - Input string
   * @returns {string}
   */
  sanitize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);
  }

  /**
   * Generate a unique filename if collision detected
   * @param {string} filename - Proposed filename
   * @param {Set<string>} existing - Set of existing filenames
   * @returns {string}
   */
  resolveCollision(filename, existing) {
    if (!existing.has(filename)) return filename;

    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let counter = 2;

    while (existing.has(`${base}-${counter}${ext}`)) {
      counter++;
    }

    return `${base}-${counter}${ext}`;
  }
}

module.exports = SmartRenamer;
