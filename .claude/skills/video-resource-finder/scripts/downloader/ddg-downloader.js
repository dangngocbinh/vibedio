const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const FileDownloader = require('./file-downloader');

/**
 * DDG Downloader
 * Downloads images from DuckDuckGo web search results
 * Matches behavior of Pexels/Pixabay downloaders
 */
class DDGDownloader {
  constructor(options = {}) {
    this.downloadScript = path.join(__dirname, '../../tools/download_web_image.py');
    this.fileDownloader = new FileDownloader(options);
    this.downloadCount = 0;

    // Verify Python script exists
    if (!fs.existsSync(this.downloadScript)) {
      throw new Error(`DDG download script not found: ${this.downloadScript}`);
    }
  }

  /**
   * Download DDG image to target directory
   * @param {Object} image - DDG image object
   * @param {string} targetDir - Target download directory
   * @param {string} sceneId - Scene identifier
   * @returns {Promise<Object>} Download result with localPath
   */
  async downloadImage(image, targetDir, sceneId) {
    try {
      this.downloadCount++;

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Determine file extension from URL or default to .jpg
      const url = image.downloadUrls?.original || image.image_url;
      if (!url) {
        throw new Error('No download URL found');
      }

      // Extract extension from URL (fallback to .jpg)
      let ext = '.jpg';
      try {
        const urlPath = new URL(url).pathname;
        const urlExt = path.extname(urlPath);
        if (urlExt && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt.toLowerCase())) {
          ext = urlExt;
        }
      } catch (e) {
        // Invalid URL or no extension, use default
      }

      // Generate filename: {sceneId}_ddg_{id}.{ext}
      const cleanSceneId = sceneId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const imageId = image.id.replace('ddg-', '');
      const filename = `${cleanSceneId}_ddg_${imageId}${ext}`;
      const targetPath = path.join(targetDir, filename);

      // Download using Python script
      console.log(`[DDG] Downloading: ${filename}...`);

      const cmd = `python3 "${this.downloadScript}" "${url}" --output "${targetPath}" --timeout 30`;

      try {
        execSync(cmd, {
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 50 * 1024 * 1024 // 50MB
        });
      } catch (downloadError) {
        // If Python download fails, try FileDownloader as fallback
        console.log(`[DDG] Python download failed, trying fallback...`);

        const result = await this.fileDownloader.downloadFile(url, targetPath);

        if (!result.success) {
          throw new Error(result.error || 'Download failed');
        }
      }

      // Verify file exists and get size
      if (!fs.existsSync(targetPath)) {
        throw new Error('Download completed but file not found');
      }

      const stats = fs.statSync(targetPath);
      console.log(`[DDG] ✓ Downloaded: ${filename} (${this.formatBytes(stats.size)})`);

      return {
        success: true,
        localPath: targetPath,
        filename: filename,
        size: stats.size,
        source: 'duckduckgo'
      };

    } catch (error) {
      console.error(`[DDG] Download failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download multiple images (batch)
   * @param {Array} images - Array of DDG image objects
   * @param {string} targetDir - Target directory
   * @param {string} sceneId - Scene identifier
   * @returns {Promise<Array>} Array of download results
   */
  async downloadMultiple(images, targetDir, sceneId) {
    console.log(`[DDG] Batch downloading ${images.length} images for scene: ${sceneId}`);

    const results = [];

    for (const image of images) {
      const result = await this.downloadImage(image, targetDir, sceneId);
      results.push({
        ...image,
        ...result
      });

      // Small delay to avoid overwhelming the server
      await this.sleep(200);
    }

    const successful = results.filter(r => r.success).length;
    console.log(`[DDG] Batch complete: ${successful}/${images.length} downloaded`);

    return results;
  }

  /**
   * Get download count
   */
  getDownloadCount() {
    return this.downloadCount;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Python dependencies are available
   */
  static checkDependencies() {
    try {
      execSync('python3 -c "import ddgs; import requests"', {
        stdio: 'pipe'
      });
      return true;
    } catch (error) {
      console.error('[DDG] Missing dependencies. Please run:');
      console.error('  cd .claude/skills/video-resource-finder');
      console.error('  pip3 install ddgs requests');
      return false;
    }
  }
}

module.exports = DDGDownloader;
