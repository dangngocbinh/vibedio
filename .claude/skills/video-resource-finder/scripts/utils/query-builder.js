class QueryBuilder {
  /**
   * Build standardized queries for different resource types
   */

  /**
   * Build video/image query from scene visual suggestion
   * @param {Object} visualQuery - Visual query from scene
   * @returns {string} Cleaned query string
   */
  buildVisualQuery(visualQuery) {
    let query = visualQuery.query;

    // If it's an AI-generated prompt, extract keywords only
    if (query.includes('--ar') || query.includes('cinematic') || query.includes('4k')) {
      query = this.extractKeywordsFromAIPrompt(query);
    }

    // Clean up query
    query = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim();

    return query;
  }

  /**
   * Extract keywords from AI image generation prompt
   * Example: "tired person waking up, cinematic lighting --ar 9:16" -> "tired person waking up"
   * @param {string} prompt - AI generation prompt
   * @returns {string} Extracted keywords
   */
  extractKeywordsFromAIPrompt(prompt) {
    // Remove common AI prompt modifiers
    const cleanPrompt = prompt
      .split(',')[0] // Take first part before comma
      .replace(/--\w+\s+[\w:]+/g, '') // Remove flags like --ar 9:16
      .replace(/(cinematic|photorealistic|4k|8k|hd|ultra|high quality|detailed)/gi, '')
      .trim();

    return cleanPrompt;
  }

  /**
   * Build music query from mood
   * @param {string} mood - Music mood (e.g., "calm", "energetic")
   * @returns {string} Music search query
   */
  buildMusicQuery(mood) {
    // Map moods to better search terms
    const moodMapping = {
      'calm': 'calm ambient peaceful',
      'energetic': 'energetic upbeat motivation',
      'dramatic': 'dramatic cinematic epic',
      'happy': 'happy cheerful uplifting',
      'sad': 'sad emotional piano',
      'suspense': 'suspense tension thriller'
    };

    const enhancedMood = moodMapping[mood.toLowerCase()] || mood;
    return `${enhancedMood} background music`;
  }

  /**
   * Build standard sound effect queries
   * @returns {Array} Array of SFX query objects
   */
  buildSoundEffectQueries() {
    return [
      {
        type: 'whoosh',
        query: 'whoosh transition swoosh',
        description: 'For scene transitions and text animations'
      },
      {
        type: 'pop',
        query: 'pop click notification',
        description: 'For bullet points and highlights'
      },
      {
        type: 'ding',
        query: 'ding bell correct',
        description: 'For important moments and checkmarks'
      }
    ];
  }

  /**
   * Determine if query should fetch video or image
   * Based on scene duration and content hints
   * @param {Object} visualQuery - Visual query object
   * @returns {string} 'video' or 'image'
   */
  determineMediaType(visualQuery) {
    const duration = visualQuery.duration || 5;
    const query = visualQuery.query.toLowerCase();

    // Short scenes or static concepts -> prefer images
    const staticKeywords = ['logo', 'text', 'title', 'quote', 'number', 'chart', 'graph', 'diagram'];
    const hasStaticKeyword = staticKeywords.some(keyword => query.includes(keyword));

    if (duration < 3 || hasStaticKeyword) {
      return 'image';
    }

    // Default to video for dynamic content
    return 'video';
  }

  /**
   * Build all queries from script data
   * @param {Object} visualQueries - Object with stock and ai arrays (or legacy Array)
   * @param {Object|null} musicQuery - Music query
   * @returns {Object} Organized queries object
   */
  buildAllQueries(visualQueries, musicQuery) {
    const organized = {
      videos: [],
      images: [],
      aiImages: [],
      music: [],
      soundEffects: []
    };

    // Handle both new format {stock, ai} and legacy Array format
    let stockQueries = [];
    let aiQueries = [];

    if (Array.isArray(visualQueries)) {
      // Legacy format - all are stock queries
      stockQueries = visualQueries;
    } else {
      // New format with stock and ai separation
      stockQueries = visualQueries.stock || [];
      aiQueries = visualQueries.ai || [];
    }

    // Process stock visual queries
    for (const vq of stockQueries) {
      const cleanedQuery = this.buildVisualQuery(vq);
      const mediaType = this.determineMediaType(vq);

      const queryObj = {
        sceneId: vq.sceneId,
        sceneText: vq.sceneText,
        query: cleanedQuery,
        originalQuery: vq.query,
        style: vq.style
      };

      if (mediaType === 'video') {
        organized.videos.push(queryObj);
      } else {
        organized.images.push(queryObj);
      }
    }

    // Process AI image queries (keep original prompt for better generation)
    for (const vq of aiQueries) {
      organized.aiImages.push({
        sceneId: vq.sceneId,
        sceneText: vq.sceneText,
        query: vq.query, // Keep original prompt for AI generation
        style: vq.style,
        type: 'ai-generated'
      });
    }

    // Process music query
    if (musicQuery) {
      organized.music.push({
        mood: musicQuery.mood,
        query: this.buildMusicQuery(musicQuery.mood),
        suggestions: musicQuery.suggestions
      });
    }

    // Add standard sound effects
    organized.soundEffects = this.buildSoundEffectQueries();

    console.log('[QueryBuilder] Built queries:', {
      videos: organized.videos.length,
      images: organized.images.length,
      aiImages: organized.aiImages.length,
      music: organized.music.length,
      soundEffects: organized.soundEffects.length
    });

    return organized;
  }
}

module.exports = QueryBuilder;
