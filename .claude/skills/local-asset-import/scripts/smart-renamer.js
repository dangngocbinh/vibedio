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
   * Generate a descriptive import filename
   * @param {string} originalPath - Original file path
   * @param {Object} context - Import context
   * @param {string} [context.sceneId] - Scene ID to associate with
   * @param {string} [context.label] - Descriptive label
   * @param {string} [context.contentType] - Content type (video, image, etc.)
   * @returns {{ filename: string, parts: Object }}
   */
  rename(originalPath, context = {}) {
    const ext = path.extname(originalPath).toLowerCase();
    const basename = path.basename(originalPath, ext);
    const { sceneId, label } = context;

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
