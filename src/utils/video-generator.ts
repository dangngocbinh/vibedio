import { ttsService } from '../services/tts';
import { imageSearchService } from '../services/image-search';
import { contentAnalyzer } from '../services/ai-agent/content-analyzer';
import { speechToTextService } from '../services/stt/speech-to-text';
import {
  VideoConfig,
  SceneAnalysis,
  AudioTimestamp,
  ImageSearchResult,
} from '../types';

export interface GeneratedVideoData {
  config: VideoConfig;
  sceneAnalysis: SceneAnalysis;
  audioTimestamp: AudioTimestamp;
  selectedImages: ImageSearchResult[];
}

export class VideoGenerator {
  async generate(config: VideoConfig): Promise<GeneratedVideoData> {
    console.log('🎬 Starting video generation...');
    console.log('📝 Input text:', config.text);

    // Step 1: Generate speech from text
    console.log('🎙️ Step 1: Generating speech...');
    const audioPath = await ttsService.generateSpeech({
      text: config.text,
      voiceId: config.voiceId,
      provider: config.ttsProvider,
    });
    console.log('✅ Audio generated:', audioPath);

    // Step 2: Get audio duration (we'll estimate for now)
    // In production, you'd use an audio library to get exact duration
    const estimatedDuration = this.estimateAudioDuration(config.text);
    console.log('⏱️ Estimated duration:', estimatedDuration, 'seconds');

    // Step 3: Analyze content and create scenes
    console.log('🤖 Step 2: Analyzing content with AI...');
    const sceneAnalysis = await contentAnalyzer.analyzeContent(
      config.text,
      estimatedDuration
    );
    console.log('✅ Scene analysis complete:', sceneAnalysis.scenes.length, 'scenes');

    // Step 4: Search and select images for each scene
    console.log('🖼️ Step 3: Searching images...');
    const selectedImages: ImageSearchResult[] = [];

    for (let i = 0; i < sceneAnalysis.scenes.length; i++) {
      const scene = sceneAnalysis.scenes[i];
      console.log(`  🔍 Scene ${i + 1}/${sceneAnalysis.scenes.length}: "${scene.imageQuery}"`);

      // Search all platforms
      const imageResults = await imageSearchService.searchAllPlatforms(
        scene.imageQuery,
        5 // 5 images per platform
      );

      if (imageResults.length === 0) {
        console.warn(`  ⚠️ No images found for scene ${i + 1}`);
        continue;
      }

      // Let AI select the best image
      const bestImage = await contentAnalyzer.selectBestImage(imageResults, {
        text: scene.text,
        keywords: scene.keywords,
      });

      if (bestImage) {
        selectedImages.push(bestImage);
        console.log(`  ✅ Selected image from ${bestImage.source}`);
      }
    }

    console.log('✅ Image selection complete:', selectedImages.length, 'images');

    // Step 5: Generate word-level timestamps for captions
    console.log('📝 Step 4: Generating captions with timestamps...');
    const audioTimestamp = await speechToTextService.transcribeAudioWithFallback(
      audioPath,
      config.text,
      estimatedDuration
    );
    console.log('✅ Caption timestamps generated:', audioTimestamp.words.length, 'words');

    console.log('🎉 Video generation complete!');

    return {
      config,
      sceneAnalysis,
      audioTimestamp,
      selectedImages,
    };
  }

  private estimateAudioDuration(text: string): number {
    // Rough estimation: average speaking rate is about 150 words per minute
    // That's 2.5 words per second, or 0.4 seconds per word
    const words = text.split(/\s+/).length;
    const estimatedSeconds = words * 0.4;
    return Math.max(estimatedSeconds, 5); // Minimum 5 seconds
  }

  async generateFromCache(cachedData: string): Promise<GeneratedVideoData> {
    // Load previously generated data from JSON
    return JSON.parse(cachedData);
  }

  saveToCache(data: GeneratedVideoData): string {
    // Save generated data to JSON for reuse
    return JSON.stringify(data, null, 2);
  }
}

export const videoGenerator = new VideoGenerator();
