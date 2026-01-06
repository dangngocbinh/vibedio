import { UnsplashService } from './unsplash';
import { PexelsService } from './pexels';
import { PixabayService } from './pixabay';
import { ImageSearchResult } from '../../types';

export class ImageSearchService {
  private unsplash: UnsplashService;
  private pexels: PexelsService;
  private pixabay: PixabayService;

  constructor() {
    this.unsplash = new UnsplashService();
    this.pexels = new PexelsService();
    this.pixabay = new PixabayService();
  }

  async searchAllPlatforms(query: string, countPerPlatform: number = 5): Promise<ImageSearchResult[]> {
    console.log(`Searching images for: "${query}"`);

    // Search all platforms in parallel
    const [unsplashResults, pexelsResults, pixabayResults] = await Promise.all([
      this.unsplash.searchImages(query, countPerPlatform),
      this.pexels.searchImages(query, countPerPlatform),
      this.pixabay.searchImages(query, countPerPlatform),
    ]);

    // Combine all results
    const allResults = [
      ...unsplashResults,
      ...pexelsResults,
      ...pixabayResults,
    ];

    console.log(`Found ${allResults.length} images across all platforms`);
    return allResults;
  }

  async searchSinglePlatform(
    platform: 'unsplash' | 'pexels' | 'pixabay',
    query: string,
    count: number = 10
  ): Promise<ImageSearchResult[]> {
    switch (platform) {
      case 'unsplash':
        return this.unsplash.searchImages(query, count);
      case 'pexels':
        return this.pexels.searchImages(query, count);
      case 'pixabay':
        return this.pixabay.searchImages(query, count);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}

export const imageSearchService = new ImageSearchService();
