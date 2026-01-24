const { createClient } = require('pexels');

class PexelsClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Pexels API key is required');
    }
    this.client = createClient(apiKey);
    this.requestCount = 0;
  }

  /**
   * Search for videos on Pexels
   * @param {string} query - Search query
   * @param {number} perPage - Results per page (max 80)
   * @returns {Promise<Array>} Array of video objects
   */
  async searchVideos(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pexels] Searching videos: "${query}" (${perPage} results)`);

      const response = await this.client.videos.search({ query, per_page: perPage });

      if (!response.videos || response.videos.length === 0) {
        console.log(`[Pexels] No videos found for: "${query}"`);
        return [];
      }

      return response.videos.map((video, index) => ({
        id: `pexels-${video.id}`,
        title: video.url.split('/').pop().replace(/-/g, ' '),
        url: video.url,
        downloadUrls: {
          hd: video.video_files.find(f => f.quality === 'hd')?.link || null,
          sd: video.video_files.find(f => f.quality === 'sd')?.link || null,
          '4k': video.video_files.find(f => f.quality === 'uhd')?.link || null
        },
        width: video.width,
        height: video.height,
        duration: video.duration,
        fps: video.video_files[0]?.fps || null,
        user: {
          name: video.user.name,
          url: video.user.url
        },
        tags: [], // Pexels doesn't provide tags in video search
        license: 'Pexels License (Free to use)',
        rank: index + 1
      }));
    } catch (error) {
      console.error(`[Pexels] Error searching videos for "${query}":`, error.message);
      return [];
    }
  }

  /**
   * Search for photos on Pexels
   * @param {string} query - Search query
   * @param {number} perPage - Results per page (max 80)
   * @returns {Promise<Array>} Array of photo objects
   */
  async searchPhotos(query, perPage = 3) {
    try {
      this.requestCount++;
      console.log(`[Pexels] Searching photos: "${query}" (${perPage} results)`);

      const response = await this.client.photos.search({ query, per_page: perPage });

      if (!response.photos || response.photos.length === 0) {
        console.log(`[Pexels] No photos found for: "${query}"`);
        return [];
      }

      return response.photos.map((photo, index) => ({
        id: `pexels-${photo.id}`,
        title: photo.alt || photo.url.split('/').pop().replace(/-/g, ' '),
        url: photo.url,
        downloadUrls: {
          original: photo.src.original,
          large: photo.src.large,
          medium: photo.src.medium,
          small: photo.src.small
        },
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        tags: [], // Pexels doesn't provide tags in photo search
        license: 'Pexels License (Free to use)',
        rank: index + 1
      }));
    } catch (error) {
      console.error(`[Pexels] Error searching photos for "${query}":`, error.message);
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

module.exports = PexelsClient;
