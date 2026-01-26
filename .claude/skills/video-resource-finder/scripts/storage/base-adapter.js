/**
 * Abstract base class for storage adapters
 * Defines the interface for local and cloud storage
 */
class BaseStorageAdapter {
  constructor(config = {}) {
    this.config = config;
    this.type = 'base'; // 'local' | 'cloud'
  }

  /**
   * Initialize the storage (create directories, authenticate, etc.)
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented');
  }

  /**
   * Store a file and return the path/URL
   * @param {Buffer|Stream} data - File data
   * @param {Object} metadata - File metadata
   * @param {string} metadata.filename - Desired filename
   * @param {string} metadata.resourceType - 'video' | 'image' | 'music' | 'sfx'
   * @param {string} metadata.sceneId - Scene identifier
   * @param {string} metadata.mimeType - MIME type
   * @returns {Promise<StorageResult>}
   */
  async store(data, metadata) {
    throw new Error('Method store() must be implemented');
  }

  /**
   * Check if a file exists
   * @param {string} identifier - File path or URL
   * @returns {Promise<boolean>}
   */
  async exists(identifier) {
    throw new Error('Method exists() must be implemented');
  }

  /**
   * Get file info
   * @param {string} identifier - File path or URL
   * @returns {Promise<FileInfo|null>}
   */
  async getInfo(identifier) {
    throw new Error('Method getInfo() must be implemented');
  }

  /**
   * Delete a file
   * @param {string} identifier - File path or URL
   * @returns {Promise<boolean>}
   */
  async delete(identifier) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Get the accessible URL/path for a stored file
   * @param {string} identifier - Internal identifier
   * @returns {string} Public URL or local path
   */
  getAccessiblePath(identifier) {
    throw new Error('Method getAccessiblePath() must be implemented');
  }
}

/**
 * @typedef {Object} StorageResult
 * @property {boolean} success - Whether storage succeeded
 * @property {string} localPath - Local file path (for local adapter)
 * @property {string} publicUrl - Public URL (for cloud adapter, null for local)
 * @property {string} identifier - Internal identifier for the file
 * @property {number} size - File size in bytes
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} path - File path
 * @property {number} size - File size
 * @property {Date} createdAt - Creation timestamp
 * @property {string} mimeType - MIME type
 */

module.exports = BaseStorageAdapter;
