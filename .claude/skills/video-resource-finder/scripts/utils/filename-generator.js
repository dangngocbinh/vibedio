const path = require('path');

/**
 * Generate safe filenames for downloaded resources
 */
class FilenameGenerator {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 100;
    this.includeSceneId = options.includeSceneId !== false;
  }

  /**
   * Generate a safe filename from URL and metadata
   * @param {string} url - Download URL
   * @param {Object} metadata - Resource metadata
   * @returns {string} Safe filename
   */
  generate(url, metadata = {}) {
    const { resourceType, sceneId, originalId, title } = metadata;

    // Extract extension from URL
    const ext = this.extractExtension(url, resourceType);

    // Build filename parts
    const parts = [];

    if (this.includeSceneId && sceneId) {
      parts.push(this.sanitize(sceneId));
    }

    // Use originalId as the main identifier
    const idPart = originalId ? originalId.replace(/[^a-zA-Z0-9-_]/g, '-') : '';
    if (idPart) {
      parts.push(idPart);
    }

    // Add title hint if available (truncated)
    if (title) {
      const titlePart = this.sanitize(title).substring(0, 30);
      if (titlePart && !parts.includes(titlePart)) {
        parts.push(titlePart);
      }
    }

    // Fallback: use timestamp
    if (parts.length === 0) {
      parts.push(`resource-${Date.now()}`);
    }

    let filename = parts.join('_') + ext;

    // Ensure max length
    if (filename.length > this.maxLength) {
      const extLength = ext.length;
      filename = filename.substring(0, this.maxLength - extLength) + ext;
    }

    return filename;
  }

  /**
   * Extract file extension from URL
   * @param {string} url - Download URL
   * @param {string} resourceType - Resource type
   * @returns {string} File extension with dot
   */
  extractExtension(url, resourceType) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const ext = path.extname(pathname).toLowerCase();

      // Valid extensions by type
      const validExts = {
        video: ['.mp4', '.webm', '.mov', '.avi'],
        image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        music: ['.mp3', '.wav', '.ogg', '.m4a'],
        sfx: ['.mp3', '.wav', '.ogg']
      };

      const typeExts = validExts[resourceType] || [];
      if (typeExts.includes(ext)) {
        return ext;
      }

      // Default by type
      const defaults = {
        video: '.mp4',
        image: '.jpg',
        music: '.mp3',
        sfx: '.mp3'
      };

      return defaults[resourceType] || ext || '.bin';
    } catch {
      return resourceType === 'video' ? '.mp4' : '.jpg';
    }
  }

  /**
   * Sanitize string for use in filename
   * @param {string} str - Input string
   * @returns {string} Sanitized string
   */
  sanitize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

module.exports = FilenameGenerator;
