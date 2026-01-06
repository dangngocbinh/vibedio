import axios from 'axios';
import { config } from '../../utils/config';
import { ImageSearchResult } from '../../types';

const UNSPLASH_API_URL = 'https://api.unsplash.com';

export class UnsplashService {
  private accessKey: string;

  constructor(accessKey?: string) {
    this.accessKey = accessKey || config.unsplash.accessKey;
    if (!this.accessKey) {
      console.warn('Unsplash access key is missing');
    }
  }

  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    if (!this.accessKey) {
      return [];
    }

    try {
      const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
        params: {
          query,
          per_page: count,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });

      return response.data.results.map((photo: any) => ({
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.thumb,
        source: 'unsplash' as const,
        photographer: photo.user.name,
        relevanceScore: 0, // Will be calculated by AI
      }));
    } catch (error) {
      console.error('Unsplash search error:', error);
      return [];
    }
  }
}
