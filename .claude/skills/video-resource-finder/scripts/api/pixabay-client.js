const axios = require('axios');

class PixabayClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Pixabay API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://pixabay.com/api';
    this.requestCount = 0;
  }

  /**
   * Search for videos on Pixabay
   * @param {string} query - Search query
   * @param {number} perPage - Results per page (max 200)
   * @returns {Promise<Array>} Array of video objects
   */
  async searchVideos(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pixabay] Searching videos: "${query}" (${perPage} results)`);

      const response = await axios.get(`${this.baseUrl}/videos/`, {
        params: {
          key: this.apiKey,
          q: query,
          per_page: perPage,
          video_type: 'all'
        }
      });

      if (!response.data.hits || response.data.hits.length === 0) {
        console.log(`[Pixabay] No videos found for: "${query}"`);
        return [];
      }

      return response.data.hits.map((video, index) => ({
        id: `pixabay-${video.id}`,
        title: video.tags || query,
        url: video.pageURL,
        downloadUrls: {
          large: video.videos?.large?.url || null,
          medium: video.videos?.medium?.url || null,
          small: video.videos?.small?.url || null,
          tiny: video.videos?.tiny?.url || null
        },
        width: video.videos?.large?.width || video.videos?.medium?.width || null,
        height: video.videos?.large?.height || video.videos?.medium?.height || null,
        duration: video.duration,
        user: {
          name: video.user,
          id: video.user_id
        },
        tags: video.tags.split(', '),
        views: video.views,
        downloads: video.downloads,
        likes: video.likes,
        license: 'Pixabay Content License (Free to use)',
        rank: index + 1
      }));
    } catch (error) {
      console.error(`[Pixabay] Error searching videos for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Search for images on Pixabay
   * @param {string} query - Search query
   * @param {number} perPage - Results per page (max 200)
   * @returns {Promise<Array>} Array of image objects
   */
  async searchImages(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pixabay] Searching images: "${query}" (${perPage} results)`);

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          q: query,
          per_page: perPage,
          image_type: 'all'
        }
      });

      if (!response.data.hits || response.data.hits.length === 0) {
        console.log(`[Pixabay] No images found for: "${query}"`);
        return [];
      }

      return response.data.hits.map((image, index) => ({
        id: `pixabay-${image.id}`,
        title: image.tags || query,
        url: image.pageURL,
        downloadUrls: {
          full: image.fullHDURL || image.largeImageURL,
          large: image.largeImageURL,
          medium: image.webformatURL,
          preview: image.previewURL
        },
        width: image.imageWidth,
        height: image.imageHeight,
        user: image.user,
        tags: image.tags.split(', '),
        license: 'Pixabay Content License (Free to use)',
        rank: index + 1
      }));
    } catch (error) {
      console.error(`[Pixabay] Error searching images for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Search for music on Pixabay
   * @param {string} query - Search query
   * @param {number} perPage - Results per page
   * @returns {Promise<Array>} Array of music objects
   */
  async searchMusic(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pixabay] Searching music: "${query}" (${perPage} results)`);

      // Note: Pixabay music API doesn't support direct search yet
      // Using a workaround with general audio search
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: this.apiKey,
          q: query,
          per_page: perPage
        }
      });

      // For now, return placeholder structure
      // In production, you'd use actual Pixabay Music API endpoint when available
      console.log(`[Pixabay] Music API limited - using placeholder`);

      return [{
        id: 'pixabay-music-placeholder',
        title: `${query} music`,
        url: 'https://pixabay.com/music/',
        downloadUrl: null,
        duration: 120,
        genre: 'Background',
        tags: query.split(' '),
        license: 'Pixabay Content License (Free to use)',
        note: 'Visit Pixabay Music page to browse and download manually'
      }];
    } catch (error) {
      console.error(`[Pixabay] Error searching music for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Search for sound effects on Pixabay
   * @param {string} query - Search query
   * @param {number} perPage - Results per page
   * @returns {Promise<Array>} Array of sound effect objects
   */
  async searchSoundEffects(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pixabay] Searching SFX: "${query}" (${perPage} results)`);

      // Similar to music, Pixabay SFX API is limited
      // Return placeholder structure
      console.log(`[Pixabay] SFX API limited - using placeholder`);

      return [{
        id: `pixabay-sfx-${query.replace(/\s+/g, '-')}`,
        title: query,
        url: 'https://pixabay.com/sound-effects/',
        downloadUrl: null,
        duration: 2,
        tags: query.split(' '),
        license: 'Pixabay Content License (Free to use)',
        note: 'Visit Pixabay Sound Effects page to browse and download manually'
      }];
    } catch (error) {
      console.error(`[Pixabay] Error searching SFX for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Get total number of API requests made
   * @returns {number}
   */
  getRequestCount() {
    return this.requestCount;
  }
}

module.exports = PixabayClient;
