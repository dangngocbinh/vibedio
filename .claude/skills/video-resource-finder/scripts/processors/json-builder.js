const fs = require('fs-extra');
const path = require('path');

class JSONBuilder {
  /**
   * Build resources.json from fetched results
   * @param {Object} metadata - Project metadata
   * @param {Object} results - Resource results from ResourceMatcher
   * @param {Object} apiStats - API usage statistics
   * @param {Object} downloadSummary - Download summary (optional)
   * @returns {Object} Complete resources.json object
   */
  buildResourcesJSON(metadata, results, apiStats, downloadSummary = null) {
    const timestamp = new Date().toISOString();

    // Calculate summary statistics
    const summary = this.calculateSummary(results);

    // Collect errors
    const errors = this.collectErrors(results);

    // Handle generatedImages (AI generated)
    const generatedImages = results.generatedImages || [];

    // Handle pinned resources (user-provided local files or URLs)
    const pinnedResources = results.pinnedResources || [];

    const resourcesJSON = {
      projectName: metadata.projectName,
      generatedAt: timestamp,
      apiSources: {
        pexels: {
          used: apiStats.pexels > 0,
          requestCount: apiStats.pexels
        },
        pixabay: {
          used: apiStats.pixabay > 0,
          requestCount: apiStats.pixabay
        },
        gemini: {
          used: apiStats.gemini > 0,
          requestCount: apiStats.gemini,
          description: 'AI image generation using Gemini Nano Banana'
        }
      },
      downloadSummary: downloadSummary || {
        enabled: false,
        totalDownloaded: 0,
        totalFailed: 0,
        totalSkipped: 0,
        storageLocation: null,
        storageType: null,
        qualityPreference: null
      },
      summary,
      resources: {
        pinnedResources: pinnedResources.filter(p => p.results && p.results.length > 0),
        videos: results.videos.filter(v => v.results.length > 0),
        images: results.images.filter(i => i.results.length > 0),
        generatedImages: generatedImages.filter(g => g.results && g.results.length > 0),
        music: results.music.filter(m => m.results.length > 0),
        soundEffects: results.soundEffects.filter(s => s.results.length > 0)
      },
      errors
    };

    console.log('\n[JSONBuilder] Built resources.json:');
    if (resourcesJSON.resources.pinnedResources.length > 0) {
      console.log(`  - Pinned: ${resourcesJSON.resources.pinnedResources.length} user-provided resources`);
    }
    console.log(`  - Videos: ${resourcesJSON.resources.videos.length} scenes with results`);
    console.log(`  - Images: ${resourcesJSON.resources.images.length} scenes with results`);
    console.log(`  - Generated Images: ${resourcesJSON.resources.generatedImages.length} AI-created`);
    console.log(`  - Music: ${resourcesJSON.resources.music.length} tracks`);
    console.log(`  - Sound Effects: ${resourcesJSON.resources.soundEffects.length} types`);
    console.log(`  - Errors: ${resourcesJSON.errors.length}`);

    return resourcesJSON;
  }

  /**
   * Calculate summary statistics
   * @param {Object} results - Resource results
   * @returns {Object} Summary stats
   */
  calculateSummary(results) {
    let totalVideos = 0;
    let totalImages = 0;
    let totalGeneratedImages = 0;
    let totalPinned = 0;
    let totalMusic = 0;
    let totalSoundEffects = 0;

    // Count pinned resources
    const pinnedResources = results.pinnedResources || [];
    for (const pinned of pinnedResources) {
      if (pinned.results) {
        totalPinned += pinned.results.length;
      }
    }

    // Count video results
    for (const video of results.videos) {
      totalVideos += video.results.length;
    }

    // Count image results
    for (const image of results.images) {
      totalImages += image.results.length;
    }

    // Count AI generated images
    const generatedImages = results.generatedImages || [];
    for (const genImg of generatedImages) {
      if (genImg.results) {
        totalGeneratedImages += genImg.results.length;
      }
    }

    // Count music results
    for (const music of results.music) {
      totalMusic += music.results.length;
    }

    // Count SFX results
    for (const sfx of results.soundEffects) {
      totalSoundEffects += sfx.results.length;
    }

    return {
      totalVideos,
      totalImages,
      totalGeneratedImages,
      totalPinned,
      totalMusic,
      totalSoundEffects,
      totalScenes: results.videos.length + results.images.length + generatedImages.length + pinnedResources.length,
      successfulQueries: this.countSuccessful(results),
      failedQueries: this.countFailed(results)
    };
  }

  /**
   * Count successful queries
   * @param {Object} results - Resource results
   * @returns {number} Count of successful queries
   */
  countSuccessful(results) {
    let count = 0;

    count += results.videos.filter(v => v.results.length > 0).length;
    count += results.images.filter(i => i.results.length > 0).length;
    count += (results.generatedImages || []).filter(g => g.results && g.results.length > 0).length;
    count += results.music.filter(m => m.results.length > 0).length;
    count += results.soundEffects.filter(s => s.results.length > 0).length;

    return count;
  }

  /**
   * Count failed queries
   * @param {Object} results - Resource results
   * @returns {number} Count of failed queries
   */
  countFailed(results) {
    let count = 0;

    count += results.videos.filter(v => v.results.length === 0).length;
    count += results.images.filter(i => i.results.length === 0).length;
    count += (results.generatedImages || []).filter(g => !g.results || g.results.length === 0).length;
    count += results.music.filter(m => m.results.length === 0).length;
    count += results.soundEffects.filter(s => s.results.length === 0).length;

    return count;
  }

  /**
   * Collect all errors from results
   * @param {Object} results - Resource results
   * @returns {Array} Array of error objects
   */
  collectErrors(results) {
    const errors = [];

    // Collect video errors
    for (const video of results.videos) {
      if (video.error || video.results.length === 0) {
        errors.push({
          type: 'video',
          sceneId: video.sceneId,
          query: video.query,
          error: video.error || 'No results found',
          suggestion: 'Try simpler query or use AI-generated imagery'
        });
      }
    }

    // Collect image errors
    for (const image of results.images) {
      if (image.error || image.results.length === 0) {
        errors.push({
          type: 'image',
          sceneId: image.sceneId,
          query: image.query,
          error: image.error || 'No results found',
          suggestion: 'Try simpler query or use AI-generated imagery'
        });
      }
    }

    // Collect music errors
    for (const music of results.music) {
      if (music.error || music.results.length === 0) {
        errors.push({
          type: 'music',
          mood: music.mood,
          query: music.query,
          error: music.error || 'No results found',
          suggestion: 'Visit Pixabay Music page manually to browse'
        });
      }
    }

    // Collect SFX errors
    for (const sfx of results.soundEffects) {
      if (sfx.error || sfx.results.length === 0) {
        errors.push({
          type: 'soundEffect',
          sfxType: sfx.type,
          query: sfx.query,
          error: sfx.error || 'No results found',
          suggestion: 'Visit Pixabay Sound Effects page manually'
        });
      }
    }

    return errors;
  }

  /**
   * Save resources.json to project directory
   * @param {string} projectDir - Project directory path
   * @param {Object} resourcesJSON - Resources JSON object
   * @returns {Promise<string>} Path to saved file
   */
  async saveToFile(projectDir, resourcesJSON) {
    const outputPath = path.join(projectDir, 'resources.json');

    try {
      await fs.ensureDir(projectDir);
      await fs.writeFile(outputPath, JSON.stringify(resourcesJSON, null, 2), 'utf-8');

      console.log(`\n[JSONBuilder] Saved resources.json to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to save resources.json: ${error.message}`);
    }
  }

  /**
   * Validate resources.json structure
   * @param {Object} resourcesJSON - Resources JSON object
   * @returns {boolean} True if valid
   */
  validate(resourcesJSON) {
    const required = ['projectName', 'generatedAt', 'apiSources', 'summary', 'resources', 'errors'];

    for (const field of required) {
      if (!resourcesJSON[field]) {
        console.error(`[JSONBuilder] Validation failed: missing ${field}`);
        return false;
      }
    }

    if (!resourcesJSON.resources.videos || !Array.isArray(resourcesJSON.resources.videos)) {
      console.error('[JSONBuilder] Validation failed: invalid resources.videos');
      return false;
    }

    console.log('[JSONBuilder] Validation passed');
    return true;
  }
}

module.exports = JSONBuilder;
