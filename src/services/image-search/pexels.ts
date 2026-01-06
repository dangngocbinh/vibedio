import axios from 'axios';
import { config } from '../../utils/config';
import { ImageSearchResult } from '../../types';

const PEXELS_API_URL = 'https://api.pexels.com/v1';

export class PexelsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.pexels.apiKey;
    if (!this.apiKey) {
      console.warn('Pexels API key is missing');
    }
  }

  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${PEXELS_API_URL}/search`, {
        params: {
          query,
          per_page: count,
          orientation: 'landscape',
        },
        headers: {
          Authorization: this.apiKey,
        },
      });

      return response.data.photos.map((photo: any) => ({
        url: photo.src.large,
        thumbnailUrl: photo.src.medium,
        source: 'pexels' as const,
        photographer: photo.photographer,
        relevanceScore: 0,
      }));
    } catch (error) {
      console.error('Pexels search error:', error);
      return [];
    }
  }
}
