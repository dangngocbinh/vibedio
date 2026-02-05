const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * DuckDuckGo Web Search Client
 * Wrapper around Python DDG tools to match Pexels/Pixabay format
 */
class DDGClient {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../tools/search_web_images.py');
    this.downloadScript = path.join(__dirname, '../../tools/download_web_image.py');
    this.requestCount = 0;

    // Verify Python scripts exist
    if (!fs.existsSync(this.pythonScript)) {
      throw new Error(`DDG search script not found: ${this.pythonScript}`);
    }
  }

  /**
   * Search for photos using DuckDuckGo
   * @param {string} query - Search query
   * @param {number} perPage - Results per page
   * @returns {Promise<Array>} Array of photo objects in standardized format
   */
  async searchPhotos(query, perPage = 10) {
    try {
      this.requestCount++;
      console.log(`[DDG] Searching photos: "${query}" (${perPage} results)`);

      // Call Python script
      const cmd = `python3 "${this.pythonScript}" "${query}" ` +
                  `--max-results ${perPage} ` +
                  `--type-image photo`;

      const result = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      const data = JSON.parse(result);

      if (!data.results || data.results.length === 0) {
        console.log(`[DDG] No photos found for: "${query}"`);
        return [];
      }

      // Transform to standardized format (matching Pexels/Pixabay)
      return data.results.map((image, index) => ({
        id: image.id || `ddg-${index + 1}`,
        title: image.title || 'Untitled',
        url: image.source || image.image_url, // Page URL (for attribution)
        downloadUrls: {
          original: image.image_url,
          large: image.image_url,
          medium: image.thumbnail || image.image_url,
          small: image.thumbnail || image.image_url
        },
        width: image.width || 0,
        height: image.height || 0,
        photographer: 'Web Source',
        photographerUrl: image.source || '',
        tags: [],
        license: 'Unknown - Verify rights before use',
        source: 'duckduckgo',
        rank: image.rank || (index + 1),
        copyrightWarning: true // Flag to show copyright warning in UI
      }));

    } catch (error) {
      // Check if it's a Python error
      if (error.stderr) {
        const stderr = error.stderr.toString();
        if (stderr.includes('Rate limit')) {
          console.error(`[DDG] Rate limit reached. Please wait before retrying.`);
        } else if (stderr.includes('No results found')) {
          console.log(`[DDG] No photos found for: "${query}"`);
          return [];
        } else {
          console.error(`[DDG] Python error:`, stderr);
        }
      } else {
        console.error(`[DDG] Error searching photos for "${query}":`, error.message);
      }
      return [];
    }
  }

  /**
   * Download image to specified path
   * @param {string} url - Image URL
   * @param {string} outputPath - Output file path
   * @returns {Promise<boolean>} Success status
   */
  async downloadImage(url, outputPath) {
    try {
      console.log(`[DDG] Downloading: ${url}`);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Call Python download script
      const cmd = `python3 "${this.downloadScript}" "${url}" --output "${outputPath}"`;

      execSync(cmd, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large images
      });

      // Verify file was created
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`[DDG] Downloaded: ${path.basename(outputPath)} (${stats.size} bytes)`);
        return true;
      } else {
        console.error(`[DDG] Download failed: File not created`);
        return false;
      }

    } catch (error) {
      if (error.stderr) {
        const stderr = error.stderr.toString();
        console.error(`[DDG] Download error:`, stderr);
      } else {
        console.error(`[DDG] Download error:`, error.message);
      }
      return false;
    }
  }

  /**
   * Get total number of API requests made
   * @returns {number}
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Check if Python dependencies are available
   * @returns {boolean}
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

module.exports = DDGClient;
