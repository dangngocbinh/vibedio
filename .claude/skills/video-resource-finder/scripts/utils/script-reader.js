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

      // Calculate total scenes including those in sections
      let totalScenes = script.scenes?.length || 0;
      if (script.sections) {
        script.sections.forEach(section => {
          if (section.scenes) totalScenes += section.scenes.length;
        });
      }
      console.log(`[ScriptReader] Scenes: ${totalScenes}`);

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
    // Support both sections (new) and scenes (legacy)
    let scenes = [];
    if (script.sections && Array.isArray(script.sections)) {
      // Flatten sections into scenes
      for (const section of script.sections) {
        if (section.scenes && Array.isArray(section.scenes)) {
          scenes = scenes.concat(section.scenes);
        }
      }
    } else if (script.scenes && Array.isArray(script.scenes)) {
      scenes = script.scenes;
    }

    if (scenes.length === 0) {
      console.warn('[ScriptReader] No scenes found in script');
      return { stock: [], ai: [], pinned: [] };
    }

    const stockQueries = [];
    const aiQueries = [];
    const pinnedQueries = [];

    for (const scene of scenes) {
      // Collect all visual items (from legacy visualSuggestion or new visuals array)
      const visualItems = [];

      if (scene.visualSuggestion) {
        visualItems.push(scene.visualSuggestion);
      }

      // Support visualDescription string (common in Vietnamese workflow)
      if (scene.visualDescription && typeof scene.visualDescription === 'string') {
        visualItems.push({
          type: 'stock',
          query: scene.visualDescription,
          resourceType: scene.type || 'auto'
        });
      }

      if (scene.visuals && Array.isArray(scene.visuals)) {
        visualItems.push(...scene.visuals);
      }

      if (visualItems.length === 0) {
        continue;
      }

      for (const item of visualItems) {
        const { type, query, style, path, url, description, resourceType } = item;

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
              resourceType: resourceType || 'auto', // preferred asset type
              duration: item.duration || scene.duration || 5
            });
          }
          continue;
        }

        const queryObj = {
          sceneId: scene.id,
          sceneText: scene.text,
          query: query,
          style: style || null,
          resourceType: resourceType || 'auto', // 'image', 'video', or 'auto'
          referenceImages: item.referenceImages || item.references || [],
          duration: item.duration || scene.duration || 5
        };

        // Categorize by type
        if (type === 'ai-generated' || type === 'ai' || type === 'illustration') {
          if (query) {
            aiQueries.push({ ...queryObj, type: 'ai-generated' });
          }
        } else if ((type === 'stock' || !type) && query) {
          stockQueries.push(queryObj);
        }
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

    const { mood, query, suggestions } = script.music;

    if (!mood && !query) {
      return null;
    }

    // Priority: explicit query > mood-based query
    const musicQuery = {
      mood: mood || 'calm',
      suggestions: suggestions || [],
      query: query || `${mood} background music`
    };

    console.log(`[ScriptReader] Extracted music query: "${musicQuery.query}" (mood: ${musicQuery.mood})`);
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
