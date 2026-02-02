const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

class ResourceMatcher {
  constructor(pexelsClient, pixabayClient, options = {}) {
    this.pexelsClient = pexelsClient;
    this.pixabayClient = pixabayClient;
    this.unsplashClient = options.unsplashClient || null;
    this.geminiClient = options.geminiClient || null;
    this.resultsPerQuery = options.resultsPerQuery || 3;
    this.preferredSource = options.preferredSource || 'pexels';
    this.enableAIGeneration = options.enableAIGeneration !== false;
    this.projectDir = options.projectDir || null;
    this.existingResources = options.existingResources || null;
    this.batchSize = options.batchSize || 0;
    // Initialize Pixabay Scraper from options
    this.pixabayScraper = options.pixabayScraper || null;
  }

  /**
   * Fetch resources for all queries
   * @param {Object} queries - Organized queries from QueryBuilder
   * @returns {Promise<Object>} Resource results
   */
  async fetchAllResources(queries) {
    console.log('\n=== Starting Resource Fetch ===\n');

    const results = {
      videos: [],
      images: [],
      generatedImages: [],
      pinnedResources: [],
      music: [],
      soundEffects: [],
      errors: []
    };

    // Helper to find existing resource
    const findExisting = (sceneId, category) => {
      if (!this.existingResources || !this.existingResources[category]) return null;
      return this.existingResources[category].find(r => r.sceneId === sceneId);
    };

    // Process pinned resources FIRST (user-provided local files or URLs)
    if (queries.pinned && queries.pinned.length > 0) {
      console.log(`\n--- Processing ${queries.pinned.length} Pinned Resources ---`);
      for (const pinnedQuery of queries.pinned) {
        try {
          // Pinned resources are usually local/specific, so we re-process them to ensure file existence
          // But if we want to skip processing if already in resources.json?
          // Pinned resources might have changed on disk, so safer to re-process or check existence.
          // Let's re-process pinned for now as they are fast (local checks).
          const pinnedResult = await this.processPinnedResource(pinnedQuery);
          results.pinnedResources.push(pinnedResult);
        } catch (error) {
          console.error(`[ResourceMatcher] Error processing pinned resource for "${pinnedQuery.sceneId}":`, error.message);
          results.errors.push({
            sceneId: pinnedQuery.sceneId,
            type: 'pinned',
            error: error.message
          });
        }
      }
    }

    // Fetch videos
    if (queries.videos.length > 0) {
      console.log(`\n--- Fetching ${queries.videos.length} Video Queries ---`);
      for (const videoQuery of queries.videos) {
        const existing = findExisting(videoQuery.sceneId, 'videos');
        if (existing) {
          console.log(`[Resume] Using existing video results for "${videoQuery.sceneId}"`);
          results.videos.push(existing);
          continue;
        }

        const videoResults = await this.fetchVideo(videoQuery);
        results.videos.push(videoResults);
      }
    }

    // Fetch images (stock)
    if (queries.images.length > 0) {
      console.log(`\n--- Fetching ${queries.images.length} Image Queries ---`);
      for (const imageQuery of queries.images) {
        const existing = findExisting(imageQuery.sceneId, 'images');
        if (existing) {
          console.log(`[Resume] Using existing image results for "${imageQuery.sceneId}"`);
          results.images.push(existing);
          continue;
        }

        const imageResults = await this.fetchImage(imageQuery);
        results.images.push(imageResults);
      }
    }

    // Fetch AI-generated images
    if (queries.aiImages && queries.aiImages.length > 0) {
      console.log(`\n--- Generating ${queries.aiImages.length} AI Images ---`);
      let aiRequests = 0;

      for (const aiQuery of queries.aiImages) {
        // Check if we have ALREADY generated this or if it is PINNED
        const existingGenerated = findExisting(aiQuery.sceneId, 'generatedImages');
        const existingPinned = findExisting(aiQuery.sceneId, 'pinnedResources');

        if (existingGenerated) {
          console.log(`[Resume] Using existing AI image for "${aiQuery.sceneId}"`);
          results.generatedImages.push(existingGenerated);
          continue;
        }

        if (existingPinned) {
          console.log(`[Resume] Scene "${aiQuery.sceneId}" has a Pinned Resource. Skipping AI generation.`);
          // Add to results.pinnedResources so it is preserved in output resources.json
          results.pinnedResources.push(existingPinned);
          continue;
        }

        // Check Batch Limit
        if (this.batchSize > 0 && aiRequests >= this.batchSize) {
          console.log(`[Batch] Limit reached (${this.batchSize}). Skipping generation for "${aiQuery.sceneId}"`);
          continue;
        }

        const aiResults = await this.generateAIImage(aiQuery);
        results.generatedImages.push(aiResults);
        aiRequests++;
      }
    }

    // Fetch music
    if (queries.music.length > 0) {
      console.log(`\n--- Fetching ${queries.music.length} Music Queries ---`);
      for (const musicQuery of queries.music) {
        // Music uses 'mood' or 'query' not sceneId usually, but let's check structure
        // SKILL.md says resources.music has array of objects.
        // We can just check if queries.music is already satisfied?
        // Music query is usually singular (background music).
        // Let's re-fetch music to be safe unless we implement smart matching by query text.
        // Music requests are low cost (3 queries usually).
        const musicResults = await this.fetchMusic(musicQuery);
        results.music.push(musicResults);
      }
    }

    // Fetch sound effects
    if (queries.soundEffects.length > 0) {
      console.log(`\n--- Fetching ${queries.soundEffects.length} Sound Effect Queries ---`);
      for (const sfxQuery of queries.soundEffects) {
        // SFX relies on type/query.
        const sfxResults = await this.fetchSoundEffect(sfxQuery);
        results.soundEffects.push(sfxResults);
      }
    }

    console.log('\n=== Resource Fetch Complete ===\n');
    return results;
  }

  /**
   * Fetch video resources for a query
   * @param {Object} queryObj - Query object with sceneId, query, resourceType, etc.
   * @returns {Promise<Object>} Video results
   */
  async fetchVideo(queryObj) {
    const { sceneId, sceneText, query, resourceType = 'auto' } = queryObj;

    // Skip if user explicitly wants images only
    if (resourceType === 'image') {
      console.log(`[ResourceMatcher] Skipping video search for "${sceneId}" (resourceType=image)`);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        skipped: true,
        reason: 'resourceType preference: image'
      };
    }
    let results = [];
    let source = null;

    try {
      // Try Pexels first (preferred)
      if (this.pexelsClient && this.preferredSource === 'pexels') {
        results = await this.pexelsClient.searchVideos(query, this.resultsPerQuery);
        source = 'pexels';
      }

      // Fallback to Pixabay if no results
      if (results.length === 0 && this.pixabayClient) {
        console.log(`[ResourceMatcher] Trying Pixabay fallback for: "${query}"`);
        results = await this.pixabayClient.searchVideos(query, this.resultsPerQuery);
        source = 'pixabay';
      }

      if (results.length === 0) {
        console.warn(`[ResourceMatcher] No video results for: "${query}"`);
        return {
          sceneId,
          sceneText,
          query,
          source: null,
          results: [],
          error: 'No results found'
        };
      }

      return {
        sceneId,
        sceneText,
        query,
        source,
        results
      };

    } catch (error) {
      console.error(`[ResourceMatcher] Error fetching video for "${query}":`, error.message);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch image resources for a query
   * @param {Object} queryObj - Query object with sceneId, query, resourceType, etc.
   * @returns {Promise<Object>} Image results
   */
  async fetchImage(queryObj) {
    const { sceneId, sceneText, query, resourceType = 'auto' } = queryObj;

    // Skip if user explicitly wants videos only
    if (resourceType === 'video') {
      console.log(`[ResourceMatcher] Skipping image search for "${sceneId}" (resourceType=video)`);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        skipped: true,
        reason: 'resourceType preference: video'
      };
    }
    let results = [];
    let source = null;

    try {
      // Try Pexels first
      if (this.pexelsClient && this.preferredSource === 'pexels') {
        results = await this.pexelsClient.searchPhotos(query, this.resultsPerQuery);
        source = 'pexels';
      }

      // Fallback to Unsplash (high quality images)
      if (results.length === 0 && this.unsplashClient) {
        console.log(`[ResourceMatcher] Trying Unsplash fallback for: "${query}"`);
        results = await this.unsplashClient.searchPhotos(query, this.resultsPerQuery);
        source = 'unsplash';
      }

      // Fallback to Pixabay
      if (results.length === 0 && this.pixabayClient) {
        console.log(`[ResourceMatcher] Trying Pixabay fallback for: "${query}"`);
        results = await this.pixabayClient.searchImages(query, this.resultsPerQuery);
        source = 'pixabay';
      }

      // Fallback to AI generation if no stock results and Gemini is available
      if (results.length === 0 && this.geminiClient && this.enableAIGeneration) {
        console.log(`[ResourceMatcher] No stock results, trying AI generation for: "${query}"`);
        return await this.generateAIImage({
          sceneId,
          sceneText,
          query,
          type: 'ai-fallback'
        });
      }

      if (results.length === 0) {
        console.warn(`[ResourceMatcher] No image results for: "${query}"`);
        return {
          sceneId,
          sceneText,
          query,
          source: null,
          results: [],
          error: 'No results found',
          suggestion: this.geminiClient ? 'AI generation failed' : 'Try enabling AI generation with GEMINI_API_KEY'
        };
      }

      return {
        sceneId,
        sceneText,
        query,
        source,
        results
      };

    } catch (error) {
      console.error(`[ResourceMatcher] Error fetching image for "${query}":`, error.message);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch music resources
   * @param {Object} queryObj - Music query object
   * @returns {Promise<Object>} Music results
   */
  async fetchMusic(queryObj) {
    const { mood, query } = queryObj;
    let results = [];
    let source = null;

    try {
      // Use Pixabay Scraper for Music (High priority, real files)
      if (this.pixabayScraper) {
        // Only use the main keyword for scraping to get better results
        // e.g. "epic cinematic background music" -> "epic"
        const scrapeQuery = mood || query.split(' ')[0] || 'background';

        results = await this.pixabayScraper.searchMusic(scrapeQuery, this.resultsPerQuery);
        if (results.length > 0) source = 'pixabay-scraper';
      }

      // Fallback: Use Pixabay API (Placeholder if scraper failed or not available)
      if (results.length === 0 && this.pixabayClient) {
        results = await this.pixabayClient.searchMusic(query, this.resultsPerQuery);
        source = 'pixabay';
      }

      if (results.length === 0) {
        console.warn(`[ResourceMatcher] No music results for: "${query}"`);
        return {
          mood,
          query,
          source: null,
          results: [],
          error: 'No results found - manual download required'
        };
      }

      return {
        mood,
        query,
        source,
        results
      };

    } catch (error) {
      console.error(`[ResourceMatcher] Error fetching music for "${query}":`, error.message);
      return {
        mood,
        query,
        source: null,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch sound effect resources
   * @param {Object} queryObj - SFX query object
   * @returns {Promise<Object>} SFX results
   */
  async fetchSoundEffect(queryObj) {
    const { type, query, description } = queryObj;
    let results = [];
    let source = null;

    try {
      // Use Pixabay for SFX
      if (this.pixabayClient) {
        results = await this.pixabayClient.searchSoundEffects(query, this.resultsPerQuery);
        source = 'pixabay';
      }

      if (results.length === 0) {
        console.warn(`[ResourceMatcher] No SFX results for: "${query}"`);
        return {
          type,
          query,
          description,
          source: null,
          results: [],
          error: 'No results found - visit Pixabay SFX manually'
        };
      }

      return {
        type,
        query,
        description,
        source,
        results
      };

    } catch (error) {
      console.error(`[ResourceMatcher] Error fetching SFX for "${query}":`, error.message);
      return {
        type,
        query,
        description,
        source: null,
        results: [],
        error: error.message
      };
    }
  }
  /**
   * Generate AI image using Gemini
   * @param {Object} queryObj - Query object with sceneId, query, etc.
   * @returns {Promise<Object>} Generated image result
   */
  async generateAIImage(queryObj) {
    const { sceneId, sceneText, query, style, referenceImages = [], type = 'ai-generated' } = queryObj;

    if (!this.geminiClient) {
      console.warn(`[ResourceMatcher] Gemini client not available for AI generation`);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        error: 'Gemini API not configured',
        suggestion: 'Add GEMINI_API_KEY to .env file'
      };
    }

    try {
      console.log(`[ResourceMatcher] Generating AI image for scene "${sceneId}": "${query}"`);

      // Build enhanced prompt
      const enhancedPrompt = this.buildAIPrompt(query, sceneText, style);

      const result = await this.geminiClient.generateImage(enhancedPrompt, {
        aspectRatio: '16:9',
        outputDir: this.projectDir,
        filename: `${sceneId}_ai.png`,
        referenceImages: this._resolveReferenceImages(referenceImages)
      });

      if (!result.success) {
        console.error(`[ResourceMatcher] AI generation failed:`, result.error);
        return {
          sceneId,
          sceneText,
          query,
          source: null,
          results: [],
          error: result.error,
          suggestion: 'Try simplifying the prompt or check Gemini API status'
        };
      }

      // Format result similar to stock results
      return {
        sceneId,
        sceneText,
        query,
        source: 'gemini-ai',
        type,
        results: [{
          id: `gemini-${sceneId}-${Date.now()}`,
          title: `AI Generated: ${query}`,
          localPath: result.savedPath,
          prompt: enhancedPrompt,
          source: 'gemini-nano-banana',
          generated: true,
          license: 'AI Generated (usage follows Gemini Terms of Service)',
          rank: 1
        }]
      };

    } catch (error) {
      console.error(`[ResourceMatcher] Error generating AI image for "${query}":`, error.message);
      return {
        sceneId,
        sceneText,
        query,
        source: null,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Build enhanced prompt for AI generation
   * @param {string} query - Original query
   * @param {string} sceneText - Scene narration text
   * @param {string} style - Visual style hint
   * @returns {string} Enhanced prompt
   */
  buildAIPrompt(query, sceneText, style) {
    let prompt = query;

    // Add context from scene text if available
    if (sceneText && sceneText.length > 10) {
      prompt = `${query}. Context: This image illustrates "${sceneText.substring(0, 100)}..."`;
    }

    // Add style if specified
    if (style) {
      prompt += `. Style: ${style}`;
    }

    // Add quality hints
    prompt += '. High quality, professional, suitable for video production, 16:9 aspect ratio.';

    return prompt;
  }

  /**
   * Generate a sequence of images for story/slideshow
   * @param {Array<Object>} scenes - Array of scene objects
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Generated images
   */
  async generateImageSequence(scenes, options = {}) {
    if (!this.geminiClient) {
      console.warn('[ResourceMatcher] Gemini client not available for sequence generation');
      return [];
    }

    const { style = null, maintainConsistency = true } = options;
    const results = [];

    console.log(`[ResourceMatcher] Generating image sequence: ${scenes.length} images`);

    // Build prompts with consistency hints
    const prompts = scenes.map((scene, index) => ({
      id: scene.sceneId || `slide_${index + 1}`,
      prompt: scene.query,
      style: maintainConsistency && index > 0
        ? `${style || 'consistent visual style'}. Maintain visual continuity with previous images in the series.`
        : style
    }));

    // Use Gemini's sequence generation
    const sequenceResults = await this.geminiClient.generateImageSequence(prompts, {
      outputDir: this.projectDir
    });

    for (const result of sequenceResults) {
      results.push({
        sceneId: result.id,
        query: prompts.find(p => p.id === result.id)?.prompt || '',
        source: 'gemini-ai',
        type: 'ai-sequence',
        sequenceIndex: result.index,
        sequenceTotal: result.total,
        results: result.success ? [{
          id: `gemini-seq-${result.id}`,
          title: `AI Sequence ${result.index}/${result.total}`,
          localPath: result.savedPath,
          prompt: result.prompt,
          source: 'gemini-nano-banana',
          generated: true,
          license: 'AI Generated'
        }] : [],
        error: result.success ? null : result.error
      });
    }

    return results;
  }

  // ─── Pinned Resource Processing ─────────────────────────────────────

  /**
   * Process a pinned resource (user-provided local file or URL)
   * @param {Object} queryObj - Pinned query object
   * @returns {Promise<Object>} Pinned resource result
   */
  async processPinnedResource(queryObj) {
    const { sceneId, sceneText, path: filePath, url, description, style } = queryObj;

    // URL-based pinned resource
    if (url) {
      return this._processPinnedUrl(sceneId, sceneText, url, description, style);
    }

    // Local file path pinned resource
    if (filePath) {
      return this._processPinnedLocalFile(sceneId, sceneText, filePath, description, style);
    }

    return {
      sceneId,
      sceneText,
      source: null,
      description,
      contentType: 'unknown',
      results: [],
      error: 'Pinned resource has neither path nor url'
    };
  }

  /**
   * Process a pinned URL resource
   */
  _processPinnedUrl(sceneId, sceneText, url, description, style) {
    const contentType = this._detectContentTypeFromUrl(url);

    console.log(`[ResourceMatcher] Pinned URL for "${sceneId}": ${url} (${contentType})`);

    return {
      sceneId,
      sceneText,
      source: 'url-pinned',
      description,
      contentType,
      results: [{
        id: `pinned-${sceneId}-${Date.now()}`,
        title: `User Pinned: ${url.split('/').pop() || url}`,
        url: url,
        localPath: null,
        relativePath: null,
        originalPath: url,
        pinned: true,
        description,
        style: style || null,
        license: 'User Provided',
        rank: 1
      }]
    };
  }

  /**
   * Process a pinned local file resource - imports into project if needed
   */
  async _processPinnedLocalFile(sceneId, sceneText, filePath, description, style) {
    // Expand ~ to home directory
    const expandedPath = filePath.startsWith('~')
      ? path.resolve(os.homedir(), filePath.slice(2))
      : path.resolve(this.projectDir || '.', filePath);

    // Check if file exists
    try {
      await fsp.access(expandedPath);
    } catch {
      console.warn(`[ResourceMatcher] Pinned file not found: ${expandedPath}`);
      return {
        sceneId,
        sceneText,
        source: null,
        description,
        contentType: 'unknown',
        results: [],
        error: `File not found: ${expandedPath} (original: ${filePath})`
      };
    }

    const contentType = this._detectContentTypeFromExt(expandedPath);
    const stat = await fsp.stat(expandedPath);
    const projectDir = this.projectDir ? path.resolve(this.projectDir) : null;

    // Check if file is already inside project
    const isInProject = projectDir && expandedPath.startsWith(projectDir + path.sep);

    let localPath = expandedPath;
    let relativePath = null;
    let action = 'referenced';

    if (isInProject) {
      // Already in project - just reference it
      relativePath = path.relative(projectDir, expandedPath);
      console.log(`[ResourceMatcher] Pinned file already in project: ${relativePath}`);
    } else if (projectDir) {
      // Outside project - copy into imports/{type}/
      const folderMap = { video: 'videos', image: 'images', music: 'music', sfx: 'sfx' };
      const targetFolder = folderMap[contentType] || 'misc';
      const targetDir = path.join(projectDir, 'imports', targetFolder);
      const filename = this._buildImportFilename(sceneId, expandedPath, description);
      const targetPath = path.join(targetDir, filename);

      await fsp.mkdir(targetDir, { recursive: true });

      // Copy file (don't overwrite if exists)
      try {
        await fsp.access(targetPath);
        console.log(`[ResourceMatcher] Pinned file already imported: ${targetPath}`);
      } catch {
        await fsp.copyFile(expandedPath, targetPath);
        console.log(`[ResourceMatcher] Imported pinned file: ${expandedPath} → ${targetPath}`);
      }

      localPath = targetPath;
      relativePath = path.relative(projectDir, targetPath);
      action = 'imported';
    }

    return {
      sceneId,
      sceneText,
      source: 'local-pinned',
      description,
      contentType,
      results: [{
        id: `pinned-${sceneId}-${Date.now()}`,
        title: `User Pinned: ${path.basename(localPath)}`,
        localPath,
        relativePath,
        originalPath: filePath,
        url: null,
        pinned: true,
        description,
        style: style || null,
        fileSize: stat.size,
        action,
        importedAt: new Date().toISOString(),
        license: 'User Provided',
        rank: 1
      }]
    };
  }

  /**
   * Extract sceneId from filename if it follows pattern: {sceneId}_{description}.ext
   * Examples:
   * - "scene_1_peaceful_nature.mp4" → "scene_1"
   * - "item1_coding_workspace.jpg" → "item1"
   * - "hook_amazing_intro.mp4" → "hook"
   * @param {string} filename - Original filename
   * @returns {string|null} Extracted sceneId or null
   */
  _extractSceneIdFromFilename(filename) {
    const nameWithoutExt = path.basename(filename, path.extname(filename));

    // Try common scene patterns
    const patterns = [
      /^(scene_\d+)/i,        // scene_1, scene_2, etc.
      /^(item\d+)/i,          // item1, item2, etc.
      /^(hook|intro|cta|outro)/i,  // common scene names
      /^([a-z0-9_-]+?)_/i     // anything before first underscore
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Build import filename for pinned local file
   * Pattern: import_{sceneId}_{description}_{originalName}.{ext}
   */
  _buildImportFilename(sceneId, filePath, description) {
    const ext = path.extname(filePath).toLowerCase();
    const originalName = path.basename(filePath, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

    const parts = ['import'];

    if (sceneId) {
      parts.push(sceneId.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20));
    }

    if (description) {
      const descSlug = description.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 30);
      if (descSlug) parts.push(descSlug);
    }

    if (originalName) {
      parts.push(originalName);
    }

    let filename = parts.join('_') + ext;

    // Max 120 chars
    if (filename.length > 120) {
      filename = filename.substring(0, 120 - ext.length) + ext;
    }

    return filename;
  }

  /**
   * Detect content type from file extension
   */
  _detectContentTypeFromExt(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const videoExts = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.flv', '.wmv'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.tif', '.heic', '.avif'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma', '.aiff', '.opus'];

    if (videoExts.includes(ext)) return 'video';
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'music';
    return 'unknown';
  }

  /**
   * Detect content type from URL
   */
  _detectContentTypeFromUrl(url) {
    try {
      const urlPath = new URL(url).pathname;
      return this._detectContentTypeFromExt(urlPath);
    } catch {
      // Guess from URL keywords
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('video') || lowerUrl.includes('.mp4')) return 'video';
      if (lowerUrl.includes('image') || lowerUrl.includes('.jpg') || lowerUrl.includes('.png')) return 'image';
      if (lowerUrl.includes('audio') || lowerUrl.includes('.mp3')) return 'music';
      return 'unknown';
    }
  }

  /**
   * Resolve reference images to absolute paths
   * @param {Array<string>} references - Array of paths or URLs
   * @returns {Array<string>} Absolute paths or URLs
   */
  _resolveReferenceImages(references) {
    if (!references || !Array.isArray(references)) return [];

    return references.map(ref => {
      // If it's a URL, return as is
      if (ref.startsWith('http')) return ref;

      // If absolute path, return as is (but verify existence later)
      if (path.isAbsolute(ref)) return ref;

      // If starts with ~, expand home dir
      if (ref.startsWith('~')) {
        return path.resolve(os.homedir(), ref.slice(2));
      }

      // Otherwise, resolve relative to projectDir
      return path.resolve(this.projectDir || '.', ref);
    });
  }
}

module.exports = ResourceMatcher;
