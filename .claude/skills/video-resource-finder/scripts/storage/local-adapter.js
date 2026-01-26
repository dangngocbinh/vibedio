const fs = require('fs-extra');
const path = require('path');
const BaseStorageAdapter = require('./base-adapter');

/**
 * Local filesystem storage adapter
 * Saves files to projectDir/downloads/{type}/
 */
class LocalStorageAdapter extends BaseStorageAdapter {
  constructor(config = {}) {
    super(config);
    this.type = 'local';
    this.baseDir = config.baseDir || null;
    this.structure = config.structure || 'by-type'; // 'by-type' | 'by-scene' | 'flat'
  }

  /**
   * Initialize storage - create directory structure
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.baseDir) {
      throw new Error('baseDir is required for LocalStorageAdapter');
    }

    // Create directory structure based on config
    const dirs = ['videos', 'images', 'music', 'sfx'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.baseDir, 'downloads', dir));
    }

    console.log(`[LocalStorage] Initialized at: ${this.baseDir}/downloads/`);
  }

  /**
   * Store a file to local filesystem
   * @param {Buffer} data - File data
   * @param {Object} metadata - File metadata
   * @returns {Promise<StorageResult>}
   */
  async store(data, metadata) {
    const { filename, resourceType, sceneId } = metadata;

    // Determine target directory based on structure
    let targetDir;
    if (this.structure === 'by-type') {
      targetDir = path.join(this.baseDir, 'downloads', this.mapResourceType(resourceType));
    } else if (this.structure === 'by-scene') {
      targetDir = path.join(this.baseDir, 'downloads', sceneId || 'misc');
    } else {
      targetDir = path.join(this.baseDir, 'downloads');
    }

    await fs.ensureDir(targetDir);

    const filePath = path.join(targetDir, filename);

    try {
      await fs.writeFile(filePath, data);
      const stats = await fs.stat(filePath);

      return {
        success: true,
        localPath: filePath,
        publicUrl: null, // Local adapter doesn't have public URLs
        identifier: filePath,
        size: stats.size
      };
    } catch (error) {
      return {
        success: false,
        localPath: null,
        publicUrl: null,
        identifier: null,
        size: 0,
        error: error.message
      };
    }
  }

  /**
   * Map resource type to directory name
   * @param {string} type - Resource type
   * @returns {string} Directory name
   */
  mapResourceType(type) {
    const mapping = {
      'video': 'videos',
      'image': 'images',
      'music': 'music',
      'sfx': 'sfx',
      'soundEffect': 'sfx'
    };
    return mapping[type] || 'misc';
  }

  /**
   * Check if file exists
   * @param {string} identifier - File path
   * @returns {Promise<boolean>}
   */
  async exists(identifier) {
    return fs.pathExists(identifier);
  }

  /**
   * Get file info
   * @param {string} identifier - File path
   * @returns {Promise<FileInfo|null>}
   */
  async getInfo(identifier) {
    if (!await this.exists(identifier)) return null;
    const stats = await fs.stat(identifier);
    return {
      path: identifier,
      size: stats.size,
      createdAt: stats.birthtime,
      mimeType: this.guessMimeType(identifier)
    };
  }

  /**
   * Delete a file
   * @param {string} identifier - File path
   * @returns {Promise<boolean>}
   */
  async delete(identifier) {
    try {
      await fs.remove(identifier);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get accessible path (for local, it's the same as identifier)
   * @param {string} identifier - File path
   * @returns {string}
   */
  getAccessiblePath(identifier) {
    return identifier;
  }

  /**
   * Guess MIME type from file extension
   * @param {string} filepath - File path
   * @returns {string} MIME type
   */
  guessMimeType(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get storage info for summary
   * @returns {Object}
   */
  getStorageInfo() {
    return {
      type: this.type,
      baseDir: this.baseDir,
      downloadsDir: path.join(this.baseDir, 'downloads')
    };
  }
}

module.exports = LocalStorageAdapter;
