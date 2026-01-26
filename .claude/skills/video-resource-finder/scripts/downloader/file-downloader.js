const axios = require('axios');

/**
 * HTTP file downloader with retry logic and concurrency control
 */
class FileDownloader {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 60000; // 60s for large videos
    this.concurrency = options.concurrency || 3;
  }

  /**
   * Download a file from URL
   * @param {string} url - Download URL
   * @param {Object} options - Download options
   * @returns {Promise<DownloadResult>}
   */
  async download(url, options = {}) {
    const { headers = {}, retries = this.maxRetries } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Downloader] Downloading: ${this.truncateUrl(url)} (attempt ${attempt}/${retries})`);

        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'arraybuffer',
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoResourceFinder/1.0)',
            ...headers
          },
          maxRedirects: 5
        });

        const contentType = response.headers['content-type'] || '';
        const contentLength = parseInt(response.headers['content-length'] || '0');

        return {
          success: true,
          data: Buffer.from(response.data),
          size: contentLength || response.data.byteLength,
          mimeType: contentType,
          url: url
        };

      } catch (error) {
        console.error(`[Downloader] Attempt ${attempt} failed: ${error.message}`);

        if (attempt < retries) {
          await this.delay(this.retryDelay * attempt);
        } else {
          return {
            success: false,
            data: null,
            size: 0,
            mimeType: null,
            url: url,
            error: error.message
          };
        }
      }
    }
  }

  /**
   * Download multiple files with concurrency control
   * @param {Array<DownloadTask>} tasks - Array of download tasks
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array<DownloadResult>>}
   */
  async downloadBatch(tasks, onProgress = null) {
    const results = [];
    const queue = [...tasks];
    let completed = 0;

    const processNext = async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;

        const result = await this.download(task.url, task.options);
        result.taskId = task.id;
        result.metadata = task.metadata;
        results.push(result);

        completed++;
        if (onProgress) {
          onProgress({
            completed,
            total: tasks.length,
            current: task,
            result: result
          });
        }
      }
    };

    // Start concurrent downloads
    const workers = [];
    const workerCount = Math.min(this.concurrency, tasks.length);
    for (let i = 0; i < workerCount; i++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
    return results;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Truncate URL for logging
   * @param {string} url - URL
   * @returns {string} Truncated URL
   */
  truncateUrl(url) {
    if (url.length <= 80) return url;
    return url.substring(0, 40) + '...' + url.substring(url.length - 30);
  }
}

/**
 * @typedef {Object} DownloadTask
 * @property {string} id - Unique task ID
 * @property {string} url - Download URL
 * @property {Object} metadata - Additional metadata
 * @property {Object} [options] - Download options
 */

/**
 * @typedef {Object} DownloadResult
 * @property {boolean} success
 * @property {Buffer|null} data
 * @property {number} size
 * @property {string|null} mimeType
 * @property {string} url
 * @property {string} [error]
 * @property {string} [taskId]
 * @property {Object} [metadata]
 */

module.exports = FileDownloader;
