class ResourceMatcher {
  constructor(pexelsClient, pixabayClient, options = {}) {
    this.pexelsClient = pexelsClient;
    this.pixabayClient = pixabayClient;
    this.resultsPerQuery = options.resultsPerQuery || 3;
    this.preferredSource = options.preferredSource || 'pexels';
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

    // Fetch images
    if (queries.images.length > 0) {
      console.log(`\n--- Fetching ${queries.images.length} Image Queries ---`);
      for (const imageQuery of queries.images) {
        const imageResults = await this.fetchImage(imageQuery);
        results.images.push(imageResults);
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

      if (results.length === 0) {
        console.warn(`[ResourceMatcher] No image results for: "${query}"`);
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
}

module.exports = ResourceMatcher;
