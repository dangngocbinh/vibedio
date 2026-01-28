const axios = require('axios');

const UNSPLASH_API_URL = 'https://api.unsplash.com';

class UnsplashClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Unsplash API key is required');
        }
        this.apiKey = apiKey;
        this.requestCount = 0;
    }

    /**
     * Search for photos on Unsplash
     * @param {string} query - Search query
     * @param {number} perPage - Results per page (max 30 for free tier)
     * @returns {Promise<Array>} Array of photo objects
     */
    async searchPhotos(query, perPage = 3) {
        try {
            this.requestCount++;
            console.log(`[Unsplash] Searching photos: "${query}" (${perPage} results)`);

            const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
                params: {
                    query,
                    per_page: Math.min(perPage, 30), // Free tier max = 30
                    orientation: 'landscape', // Tốt cho video content
                },
                headers: {
                    Authorization: `Client-ID ${this.apiKey}`,
                },
            });

            if (!response.data.results || response.data.results.length === 0) {
                console.log(`[Unsplash] No photos found for: "${query}"`);
                return [];
            }

            return response.data.results.map((photo, index) => ({
                id: `unsplash-${photo.id}`,
                title: photo.description || photo.alt_description || 'Untitled',
                url: photo.links.html,
                downloadUrls: {
                    original: photo.urls.raw,
                    full: photo.urls.full,
                    large: photo.urls.regular,
                    medium: photo.urls.small,
                    small: photo.urls.thumb
                },
                width: photo.width,
                height: photo.height,
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                tags: photo.tags?.map(t => t.title) || [],
                color: photo.color,
                license: 'Unsplash License (Free to use)',
                rank: index + 1
            }));
        } catch (error) {
            console.error(`[Unsplash] Error searching photos for "${query}":`, error.message);

            // Log thêm info nếu là lỗi rate limit
            if (error.response?.status === 403) {
                console.error('[Unsplash] Rate limit exceeded or invalid API key');
            }

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

module.exports = UnsplashClient;
