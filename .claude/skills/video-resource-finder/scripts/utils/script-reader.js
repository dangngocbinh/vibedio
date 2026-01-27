const fs = require('fs-extra');
const path = require('path');

class ScriptReader {
  /**
   * Read and parse script.json from project directory
   * @param {string} projectDir - Path to project directory
   * @returns {Promise<Object>} Parsed script object
   */
  async readScript(projectDir) {
    const scriptPath = path.join(projectDir, 'script.json');

    if (!await fs.pathExists(scriptPath)) {
      throw new Error(`script.json not found at: ${scriptPath}`);
    }

    try {
      const content = await fs.readFile(scriptPath, 'utf-8');
      const script = JSON.parse(content);

      console.log(`[ScriptReader] Loaded script from: ${scriptPath}`);
      console.log(`[ScriptReader] Project: ${script.metadata?.projectName || 'Unknown'}`);
      console.log(`[ScriptReader] Scenes: ${script.scenes?.length || 0}`);

      return script;
    } catch (error) {
      throw new Error(`Failed to read/parse script.json: ${error.message}`);
    }
  }

  /**
   * Extract video/image queries from scenes
   * @param {Object} script - Parsed script object
   * @returns {Object} Object with stock and ai arrays
   */
  extractVisualQueries(script) {
    if (!script.scenes || !Array.isArray(script.scenes)) {
      console.warn('[ScriptReader] No scenes found in script');
      return { stock: [], ai: [], pinned: [] };
    }

    const stockQueries = [];
    const aiQueries = [];
    const pinnedQueries = [];

    for (const scene of script.scenes) {
      if (!scene.visualSuggestion) {
        continue;
      }

      const { type, query, style, path, url, description } = scene.visualSuggestion;

      // Pinned resources: user-provided local path or URL
      if (type === 'pinned') {
        if (path || url) {
          pinnedQueries.push({
            sceneId: scene.id,
            sceneText: scene.text,
            path: path || null,
            url: url || null,
            description: description || '',
            style: style || null,
            query: query || null, // fallback search query
            duration: scene.duration || 5
          });
        }
        continue;
      }

      const queryObj = {
        sceneId: scene.id,
        sceneText: scene.text,
        query: query,
        style: style || null,
        duration: scene.duration || 5
      };

      // Categorize by type
      if (type === 'ai-generated' || type === 'ai' || type === 'illustration') {
        if (query) {
          aiQueries.push({ ...queryObj, type: 'ai-generated' });
        }
      } else if (type === 'stock' && query) {
        stockQueries.push(queryObj);
      }
    }

    console.log(`[ScriptReader] Extracted ${stockQueries.length} stock, ${aiQueries.length} AI, ${pinnedQueries.length} pinned queries`);
    return { stock: stockQueries, ai: aiQueries, pinned: pinnedQueries };
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} script - Parsed script object
   * @returns {Array} Array of stock query objects only
   */
  extractStockQueries(script) {
    const { stock } = this.extractVisualQueries(script);
    return stock;
  }

  /**
   * Extract AI-generated image queries from scenes
   * @param {Object} script - Parsed script object
   * @returns {Array} Array of AI query objects
   */
  extractAIQueries(script) {
    const { ai } = this.extractVisualQueries(script);
    return ai;
  }

  /**
   * Extract music query from script
   * @param {Object} script - Parsed script object
   * @returns {Object|null} Music query object
   */
  extractMusicQuery(script) {
    if (!script.music) {
      console.warn('[ScriptReader] No music config found in script');
      return null;
    }

    const { mood, suggestions } = script.music;

    if (!mood) {
      return null;
    }

    const musicQuery = {
      mood: mood,
      suggestions: suggestions || [],
      query: `${mood} background music`
    };

    console.log(`[ScriptReader] Extracted music query: "${musicQuery.query}"`);
    return musicQuery;
  }

  /**
   * Get project metadata from script
   * @param {Object} script - Parsed script object
   * @returns {Object} Project metadata
   */
  getMetadata(script) {
    return {
      projectName: script.metadata?.projectName || 'unknown-project',
      videoType: script.metadata?.videoType || 'unknown',
      duration: script.metadata?.duration || 60,
      platform: script.metadata?.platform || 'shorts'
    };
  }
}

module.exports = ScriptReader;
