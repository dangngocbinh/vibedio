import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageSearchResult } from '../types';

/**
 * Download images to local directory to avoid CORS issues during render
 */
export class ImageDownloader {
  private outputDir: string;

  constructor(outputDir: string = 'public/images/downloaded') {
    this.outputDir = outputDir;
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    try {
      // Create output directory if not exists
      await fs.mkdir(this.outputDir, { recursive: true });

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      const ext = this.getExtensionFromUrl(url) || 'jpg';
      const outputPath = path.join(this.outputDir, `${filename}.${ext}`);

      await fs.writeFile(outputPath, response.data);

      return outputPath;
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error);
      throw error;
    }
  }

  async downloadImages(images: ImageSearchResult[]): Promise<string[]> {
    const downloadPromises = images.map((image, index) =>
      this.downloadImage(image.url, `scene-${index}-${Date.now()}`)
    );

    return Promise.all(downloadPromises);
  }

  private getExtensionFromUrl(url: string): string | null {
    const match = url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i);
    return match ? match[1] : null;
  }

  async cleanup(olderThanHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const maxAge = olderThanHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up images:', error);
    }
  }
}

export const imageDownloader = new ImageDownloader();
