class ResourceMatcher {
  constructor(pexelsClient, pixabayClient, options = {}) {
    this.pexelsClient = pexelsClient;
    this.pixabayClient = pixabayClient;
    this.geminiClient = options.geminiClient || null;
    this.resultsPerQuery = options.resultsPerQuery || 3;
    this.preferredSource = options.preferredSource || 'pexels';
    this.enableAIGeneration = options.enableAIGeneration !== false;
    this.projectDir = options.projectDir || null;
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
      music: [],
      soundEffects: [],
      errors: []
    };

    // Fetch videos
    if (queries.videos.length > 0) {
      console.log(`\n--- Fetching ${queries.videos.length} Video Queries ---`);
      for (const videoQuery of queries.videos) {
        const videoResults = await this.fetchVideo(videoQuery);
        results.videos.push(videoResults);
      }
    }

    // Fetch images (stock)
    if (queries.images.length > 0) {
      console.log(`\n--- Fetching ${queries.images.length} Image Queries ---`);
      for (const imageQuery of queries.images) {
        const imageResults = await this.fetchImage(imageQuery);
        results.images.push(imageResults);
      }
    }

    // Fetch AI-generated images
    if (queries.aiImages && queries.aiImages.length > 0) {
      console.log(`\n--- Generating ${queries.aiImages.length} AI Images ---`);
      for (const aiQuery of queries.aiImages) {
        const aiResults = await this.generateAIImage(aiQuery);
        results.generatedImages.push(aiResults);
      }
    }

    // Fetch music
    if (queries.music.length > 0) {
      console.log(`\n--- Fetching ${queries.music.length} Music Queries ---`);
      for (const musicQuery of queries.music) {
        const musicResults = await this.fetchMusic(musicQuery);
        results.music.push(musicResults);
      }
    }

    // Fetch sound effects
    if (queries.soundEffects.length > 0) {
      console.log(`\n--- Fetching ${queries.soundEffects.length} Sound Effect Queries ---`);
      for (const sfxQuery of queries.soundEffects) {
        const sfxResults = await this.fetchSoundEffect(sfxQuery);
        results.soundEffects.push(sfxResults);
      }
    }

    console.log('\n=== Resource Fetch Complete ===\n');
    return results;
  }

  /**
   * Fetch video resources for a query
   * @param {Object} queryObj - Query object with sceneId, query, etc.
   * @returns {Promise<Object>} Video results
   */
  async fetchVideo(queryObj) {
    const { sceneId, sceneText, query } = queryObj;
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
   * @param {Object} queryObj - Query object
   * @returns {Promise<Object>} Image results
   */
  async fetchImage(queryObj) {
    const { sceneId, sceneText, query } = queryObj;
    let results = [];
    let source = null;

    try {
      // Try Pexels first
      if (this.pexelsClient && this.preferredSource === 'pexels') {
        results = await this.pexelsClient.searchPhotos(query, this.resultsPerQuery);
        source = 'pexels';
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
      // Use Pixabay for music (Pexels doesn't have music)
      if (this.pixabayClient) {
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
          error: 'No results found - visit Pixabay Music manually'
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
    const { sceneId, sceneText, query, style, type = 'ai-generated' } = queryObj;

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
        filename: `${sceneId}_ai.png`
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
}

module.exports = ResourceMatcher;
