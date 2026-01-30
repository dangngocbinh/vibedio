const fs = require('fs-extra');
const path = require('path');

class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.requestCount = 0;
    // Use gemini-2.0-flash-exp-image-generation for native image generation (Nano Banana)
    // This is the latest model with best image generation quality

    this.model = 'gemini-3-pro-image-preview';
  }

  /**
   * Generate an image using Gemini API (Nano Banana - Native Image Generation)
   * Uses gemini-2.0-flash-exp-image-generation for best quality
   * @param {string} prompt - Image generation prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated image data
   */
  async generateImage(prompt, options = {}) {
    const {
      aspectRatio = '16:9',
      outputDir = null,
      filename = null,
      referenceImages = []
    } = options;

    console.log(`[GeminiClient] 🍌 Nano Banana generating: "${prompt.substring(0, 50)}..."`);
    if (referenceImages && referenceImages.length > 0) {
      console.log(`[GeminiClient] 📸 Using ${referenceImages.length} reference images`);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Generate image: ${prompt}. Aspect ratio: ${aspectRatio}. High quality, professional.` },
                ...(await this._prepareReferenceImages(referenceImages))
              ]
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              temperature: 1,
              topP: 0.95,
              topK: 40
            }
          })
        }
      );

      this.requestCount++;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Extract image from response
      const imageData = this.extractImageFromResponse(data);

      if (!imageData) {
        throw new Error('No image generated in response');
      }

      // Save image if outputDir provided
      let savedPath = null;
      if (outputDir) {
        savedPath = await this.saveImage(imageData, outputDir, filename);
      }

      return {
        success: true,
        prompt,
        imageData: imageData.base64,
        mimeType: imageData.mimeType,
        savedPath,
        source: 'gemini-nano-banana'
      };

    } catch (error) {
      console.error(`[GeminiClient] Error generating image:`, error.message);
      return {
        success: false,
        prompt,
        error: error.message,
        source: 'gemini-nano-banana'
      };
    }
  }

  /**
   * Generate multiple images for a story/sequence
   * @param {Array<Object>} prompts - Array of {id, prompt} objects
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of generated images
   */
  async generateImageSequence(prompts, options = {}) {
    const results = [];

    console.log(`[GeminiClient] Generating ${prompts.length} images for sequence...`);

    for (let i = 0; i < prompts.length; i++) {
      const { id, prompt, style } = prompts[i];

      // Add style consistency hint
      const enhancedPrompt = style
        ? `${prompt}. Art style: ${style}. Maintain visual consistency with the series.`
        : prompt;

      const result = await this.generateImage(enhancedPrompt, {
        ...options,
        filename: `${id || `image_${i + 1}`}.png`
      });

      results.push({
        id,
        ...result,
        index: i + 1,
        total: prompts.length
      });

      // Small delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Extract image data from Gemini response
   * @param {Object} response - Gemini API response
   * @returns {Object|null} Image data with base64 and mimeType
   */
  extractImageFromResponse(response) {
    try {
      const candidates = response.candidates || [];

      for (const candidate of candidates) {
        const content = candidate.content || {};
        const parts = content.parts || [];

        for (const part of parts) {
          if (part.inlineData) {
            return {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png'
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[GeminiClient] Error extracting image:', error.message);
      return null;
    }
  }

  /**
   * Save base64 image to file
   * @param {Object} imageData - Image data with base64 and mimeType
   * @param {string} outputDir - Output directory
   * @param {string} filename - Filename (optional)
   * @returns {Promise<string>} Saved file path
   */
  async saveImage(imageData, outputDir, filename = null) {
    const ext = imageData.mimeType.includes('png') ? 'png' : 'jpg';
    const finalFilename = filename || `gemini_${Date.now()}.${ext}`;
    const outputPath = path.join(outputDir, 'generated', finalFilename);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Write image
    const buffer = Buffer.from(imageData.base64, 'base64');
    await fs.writeFile(outputPath, buffer);

    console.log(`[GeminiClient] Image saved to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get request count for stats
   * @returns {number} Number of API requests made
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Determine if a query should use AI generation based on content
   * @param {string} query - The visual query
   * @param {Object} options - Additional context
   * @returns {boolean} Whether to use AI generation
   */
  shouldUseAIGeneration(query, options = {}) {
    const { stockResultsFound = 0, type = 'stock' } = options;

    // Explicit AI type
    if (type === 'ai-generated' || type === 'ai') {
      return true;
    }

    // No stock results found
    if (stockResultsFound === 0) {
      return true;
    }

    // Keywords that suggest creative/abstract content
    const aiPreferredKeywords = [
      'illustration', 'cartoon', 'animated', 'fantasy',
      'abstract', 'concept', 'metaphor', 'surreal',
      'custom', 'unique', 'specific', 'branded',
      'infographic', 'diagram', 'visualization',
      'story', 'character', 'mascot'
    ];

    const queryLower = query.toLowerCase();
    return aiPreferredKeywords.some(keyword => queryLower.includes(keyword));
  }
  /**
   * Prepare reference images for API request
   * @param {Array<string>} references - Array of paths or URLs
   * @returns {Promise<Array>} Array of parts for API
   */
  async _prepareReferenceImages(references) {
    if (!references || !Array.isArray(references) || references.length === 0) {
      return [];
    }

    const parts = [];

    for (const ref of references) {
      try {
        let base64Data = null;
        let mimeType = null;

        if (ref.startsWith('http')) {
          // URLs are currently not supported for direct transmission in this implementation
          // You would need to fetch the URL and convert to base64
          // For now, we skip URLs to avoid complexity, or implement basic fetch
          console.warn(`[GeminiClient] Remote URL references not fully supported yet, skipping: ${ref}`);
          continue;
        } else {
          // Local file
          const exists = await fs.pathExists(ref);
          if (exists) {
            const buffer = await fs.readFile(ref);
            base64Data = buffer.toString('base64');
            const ext = path.extname(ref).toLowerCase();
            mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            });
            console.log(`[GeminiClient] Added reference image: ${path.basename(ref)}`);
          } else {
            console.warn(`[GeminiClient] Reference image not found: ${ref}`);
          }
        }
      } catch (error) {
        console.warn(`[GeminiClient] Error processing reference image ${ref}:`, error.message);
      }
    }

    return parts;
  }
}

module.exports = GeminiClient;
