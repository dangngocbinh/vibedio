import axios from 'axios';
import { config } from '../../utils/config';
import { ImageSearchResult } from '../../types';

const PIXABAY_API_URL = 'https://pixabay.com/api/';

export class PixabayService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.pixabay.apiKey;
    if (!this.apiKey) {
      console.warn('Pixabay API key is missing');
    }
  }

  async searchImages(query: string, count: number = 10): Promise<ImageSearchResult[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(PIXABAY_API_URL, {
        params: {
          key: this.apiKey,
          q: query,
          image_type: 'photo',
          orientation: 'horizontal',
          per_page: count,
        },
      });

      return response.data.hits.map((photo: any) => ({
        url: photo.largeImageURL,
        thumbnailUrl: photo.previewURL,
        source: 'pixabay' as const,
        photographer: photo.user,
        relevanceScore: 0,
      }));
    } catch (error) {
      console.error('Pixabay search error:', error);
      return [];
    }
  }
}
