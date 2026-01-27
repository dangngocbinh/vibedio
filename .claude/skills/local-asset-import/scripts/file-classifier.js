const path = require('path');

/**
 * Classify files by content type based on extension
 * Maps to project folder structure: videos/, images/, music/, sfx/
 */
class FileClassifier {
  constructor() {
    this.extensionMap = {
      // Video
      '.mp4': 'video',
      '.mov': 'video',
      '.webm': 'video',
      '.avi': 'video',
      '.mkv': 'video',
      '.m4v': 'video',
      '.flv': 'video',
      '.wmv': 'video',

      // Image
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.webp': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.bmp': 'image',
      '.tiff': 'image',
      '.tif': 'image',
      '.heic': 'image',
      '.heif': 'image',
      '.avif': 'image',

      // Audio (default: music, can be overridden to sfx)
      '.mp3': 'music',
      '.wav': 'music',
      '.ogg': 'music',
      '.m4a': 'music',
      '.flac': 'music',
      '.aac': 'music',
      '.wma': 'music',
      '.aiff': 'music',
      '.opus': 'music',
    };

    // Content type → folder name mapping
    this.folderMap = {
      'video': 'videos',
      'image': 'images',
      'music': 'music',
      'sfx': 'sfx',
    };
  }

  /**
   * Classify a file by its extension
   * @param {string} filePath - File path
   * @param {string} [forceType] - Override type: video|image|music|sfx|auto
   * @returns {{ contentType: string, folder: string, ext: string }}
   */
  classify(filePath, forceType = 'auto') {
    const ext = path.extname(filePath).toLowerCase();

    let contentType;
    if (forceType && forceType !== 'auto') {
      contentType = forceType;
    } else {
      contentType = this.extensionMap[ext] || null;
    }

    if (!contentType) {
      return {
        contentType: 'unknown',
        folder: 'misc',
        ext,
        supported: false,
      };
    }

    return {
      contentType,
      folder: this.folderMap[contentType] || 'misc',
      ext,
      supported: true,
    };
  }

  /**
   * Check if a file extension is supported
   * @param {string} filePath - File path
   * @returns {boolean}
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext in this.extensionMap;
  }

  /**
   * Get all supported extensions
   * @returns {string[]}
   */
  getSupportedExtensions() {
    return Object.keys(this.extensionMap);
  }

  /**
   * Get MIME type for a file
   * @param {string} filePath - File path
   * @returns {string}
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.m4v': 'video/x-m4v',
      '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.avif': 'image/avif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.wma': 'audio/x-ms-wma',
      '.aiff': 'audio/aiff',
      '.opus': 'audio/opus',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }
}

module.exports = FileClassifier;
