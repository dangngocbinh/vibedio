const FileDownloader = require('./file-downloader');
const FilenameGenerator = require('../utils/filename-generator');

/**
 * Resource downloader orchestrator
 * Downloads resources and stores them using the provided storage adapter
 */
class ResourceDownloader {
  constructor(storageAdapter, options = {}) {
    this.storage = storageAdapter;
    this.fileDownloader = new FileDownloader({
      concurrency: options.concurrency || 3,
      maxRetries: options.maxRetries || 3
    });
    this.filenameGenerator = new FilenameGenerator();
    this.qualityPreference = options.quality || 'best'; // 'best' | 'hd' | 'sd' | 'medium'
    this.downloadCount = options.downloadCount || 1; // Number of results to download per scene
  }

  /**
   * Download all resources from a resources object
   * @param {Object} resources - Resources from ResourceMatcher
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Updated resources with localPath
   */
  async downloadAllResources(resources, onProgress = null) {
    const tasks = this.buildDownloadTasks(resources);

    if (tasks.length === 0) {
      console.log('[ResourceDownloader] No resources to download');
      return resources;
    }

    console.log(`\n[ResourceDownloader] Starting download of ${tasks.length} files...\n`);

    const results = await this.fileDownloader.downloadBatch(tasks, onProgress);

    // Process results and store files
    const storedResults = await this.storeDownloadedFiles(results);

    // Update resources with local paths
    return this.updateResourcesWithPaths(resources, storedResults);
  }

  /**
   * Build download tasks from resources
   * @param {Object} resources - Resources object
   * @returns {Array<DownloadTask>}
   */
  buildDownloadTasks(resources) {
    const tasks = [];

    // Process videos
    for (const videoGroup of (resources.videos || [])) {
      const resultsToDownload = videoGroup.results.slice(0, this.downloadCount);
      for (const result of resultsToDownload) {
        const url = this.selectQuality(result.downloadUrls, 'video');
        if (url) {
          tasks.push({
            id: result.id,
            url: url,
            metadata: {
              resourceType: 'video',
              sceneId: videoGroup.sceneId,
              originalId: result.id,
              title: result.title,
              selectedQuality: this.getSelectedQualityName(result.downloadUrls, url)
            }
          });
        }
      }
    }

    // Process images
    for (const imageGroup of (resources.images || [])) {
      const resultsToDownload = imageGroup.results.slice(0, this.downloadCount);
      for (const result of resultsToDownload) {
        const url = this.selectQuality(result.downloadUrls, 'image');
        if (url) {
          tasks.push({
            id: result.id,
            url: url,
            metadata: {
              resourceType: 'image',
              sceneId: imageGroup.sceneId,
              originalId: result.id,
              title: result.title,
              selectedQuality: this.getSelectedQualityName(result.downloadUrls, url)
            }
          });
        }
      }
    }

    // Process music
    for (const musicGroup of (resources.music || [])) {
      const resultsToDownload = musicGroup.results.slice(0, this.downloadCount);
      for (const result of resultsToDownload) {
        if (result.downloadUrl) {
          tasks.push({
            id: result.id,
            url: result.downloadUrl,
            metadata: {
              resourceType: 'music',
              sceneId: musicGroup.mood,
              originalId: result.id,
              title: result.title,
              selectedQuality: 'default'
            }
          });
        }
      }
    }

    // Process sound effects
    for (const sfxGroup of (resources.soundEffects || [])) {
      const resultsToDownload = sfxGroup.results.slice(0, this.downloadCount);
      for (const result of resultsToDownload) {
        if (result.downloadUrl) {
          tasks.push({
            id: result.id,
            url: result.downloadUrl,
            metadata: {
              resourceType: 'sfx',
              sceneId: sfxGroup.type,
              originalId: result.id,
              title: result.title,
              selectedQuality: 'default'
            }
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Select best quality URL based on preference
   * @param {Object} downloadUrls - Available download URLs
   * @param {string} mediaType - 'video' | 'image'
   * @returns {string|null} Selected URL
   */
  selectQuality(downloadUrls, mediaType) {
    if (!downloadUrls) return null;

    if (mediaType === 'video') {
      // Priority based on quality preference
      const priorities = {
        'best': ['4k', 'hd', 'large', 'sd', 'medium', 'small'],
        '4k': ['4k', 'hd', 'large', 'sd', 'medium'],
        'hd': ['hd', 'large', '4k', 'sd', 'medium'],
        'sd': ['sd', 'medium', 'hd', 'small'],
        'medium': ['medium', 'sd', 'hd', 'large']
      };

      const order = priorities[this.qualityPreference] || priorities['best'];
      for (const quality of order) {
        if (downloadUrls[quality]) return downloadUrls[quality];
      }
    } else {
      // Images
      const priorities = {
        'best': ['original', 'full', 'large', 'medium', 'small'],
        'original': ['original', 'full', 'large', 'medium'],
        'large': ['large', 'original', 'full', 'medium'],
        'medium': ['medium', 'large', 'webformat', 'small']
      };

      const order = priorities[this.qualityPreference] || priorities['best'];
      for (const quality of order) {
        if (downloadUrls[quality]) return downloadUrls[quality];
      }
    }

    // Fallback: return first available URL
    return Object.values(downloadUrls).find(url => url) || null;
  }

  /**
   * Get the quality name for a selected URL
   * @param {Object} downloadUrls - Available download URLs
   * @param {string} selectedUrl - Selected URL
   * @returns {string} Quality name
   */
  getSelectedQualityName(downloadUrls, selectedUrl) {
    if (!downloadUrls) return 'unknown';
    for (const [quality, url] of Object.entries(downloadUrls)) {
      if (url === selectedUrl) return quality;
    }
    return 'unknown';
  }

  /**
   * Store downloaded files using storage adapter
   * @param {Array} downloadResults - Download results
   * @returns {Promise<Array>} Stored results
   */
  async storeDownloadedFiles(downloadResults) {
    const stored = [];

    for (const result of downloadResults) {
      if (!result.success || !result.data) {
        stored.push({
          ...result,
          stored: false,
          localPath: null
        });
        continue;
      }

      const filename = this.filenameGenerator.generate(result.url, result.metadata);

      const storeResult = await this.storage.store(result.data, {
        filename,
        resourceType: result.metadata.resourceType,
        sceneId: result.metadata.sceneId,
        mimeType: result.mimeType
      });

      stored.push({
        ...result,
        stored: storeResult.success,
        localPath: storeResult.localPath,
        publicUrl: storeResult.publicUrl,
        fileSize: storeResult.size,
        error: storeResult.error
      });

      // Free memory
      result.data = null;
    }

    return stored;
  }

  /**
   * Update original resources object with local paths
   * @param {Object} resources - Original resources
   * @param {Array} storedResults - Stored results
   * @returns {Object} Updated resources
   */
  updateResourcesWithPaths(resources, storedResults) {
    const pathMap = new Map();
    for (const result of storedResults) {
      if (result.stored && result.localPath) {
        pathMap.set(result.metadata.originalId, {
          localPath: result.localPath,
          publicUrl: result.publicUrl,
          downloadStatus: 'success',
          downloadedQuality: result.metadata.selectedQuality,
          fileSize: result.fileSize
        });
      } else {
        pathMap.set(result.metadata.originalId, {
          localPath: null,
          publicUrl: null,
          downloadStatus: 'failed',
          downloadedQuality: null,
          fileSize: 0,
          downloadError: result.error
        });
      }
    }

    // Deep clone and update
    const updated = JSON.parse(JSON.stringify(resources));

    // Update videos
    for (const videoGroup of (updated.videos || [])) {
      for (const result of videoGroup.results) {
        const paths = pathMap.get(result.id);
        if (paths) {
          Object.assign(result, paths);
        }
      }
    }

    // Update images
    for (const imageGroup of (updated.images || [])) {
      for (const result of imageGroup.results) {
        const paths = pathMap.get(result.id);
        if (paths) {
          Object.assign(result, paths);
        }
      }
    }

    // Update music
    for (const musicGroup of (updated.music || [])) {
      for (const result of musicGroup.results) {
        const paths = pathMap.get(result.id);
        if (paths) {
          Object.assign(result, paths);
        }
      }
    }

    // Update SFX
    for (const sfxGroup of (updated.soundEffects || [])) {
      for (const result of sfxGroup.results) {
        const paths = pathMap.get(result.id);
        if (paths) {
          Object.assign(result, paths);
        }
      }
    }

    return updated;
  }

  /**
   * Get download statistics
   * @param {Array} storedResults - Stored results
   * @returns {Object} Statistics
   */
  getDownloadStats(storedResults) {
    const stats = {
      total: storedResults.length,
      successful: 0,
      failed: 0,
      totalSize: 0
    };

    for (const result of storedResults) {
      if (result.stored) {
        stats.successful++;
        stats.totalSize += result.fileSize || 0;
      } else {
        stats.failed++;
      }
    }

    return stats;
  }
}

module.exports = ResourceDownloader;
