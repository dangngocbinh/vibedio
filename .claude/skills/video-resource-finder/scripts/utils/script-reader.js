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
   * @returns {Array} Array of query objects
   */
  extractVisualQueries(script) {
    if (!script.scenes || !Array.isArray(script.scenes)) {
      console.warn('[ScriptReader] No scenes found in script');
      return [];
    }

    const queries = [];

    for (const scene of script.scenes) {
      if (!scene.visualSuggestion) {
        continue;
      }

      const { type, query, style } = scene.visualSuggestion;

      // Only process stock footage queries (skip ai-generated for now)
      if (type === 'stock' && query) {
        queries.push({
          sceneId: scene.id,
          sceneText: scene.text,
          query: query,
          style: style || null,
          duration: scene.duration || 5
        });
      }
    }

    console.log(`[ScriptReader] Extracted ${queries.length} visual queries (stock type)`);
    return queries;
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
