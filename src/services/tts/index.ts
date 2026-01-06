import { ElevenLabsService, TTSOptions } from './elevenlabs';

export type TTSProvider = 'elevenlabs' | 'google' | 'azure';

export interface TTSServiceOptions extends TTSOptions {
  provider?: TTSProvider;
}

class TTSServiceFactory {
  private static instance: TTSServiceFactory;

  private constructor() {}

  static getInstance(): TTSServiceFactory {
    if (!TTSServiceFactory.instance) {
      TTSServiceFactory.instance = new TTSServiceFactory();
    }
    return TTSServiceFactory.instance;
  }

  getService(provider: TTSProvider = 'elevenlabs') {
    switch (provider) {
      case 'elevenlabs':
        return new ElevenLabsService();
      case 'google':
        // TODO: Implement Google TTS
        throw new Error('Google TTS not implemented yet');
      case 'azure':
        // TODO: Implement Azure TTS
        throw new Error('Azure TTS not implemented yet');
      default:
        throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }

  async generateSpeech(options: TTSServiceOptions): Promise<string> {
    const { provider = 'elevenlabs', ...ttsOptions } = options;
    const service = this.getService(provider);

    const audioBuffer = await service.textToSpeech(ttsOptions);
    const timestamp = Date.now();
    // Return path relative to public/ directory (without 'public/' prefix)
    const filename = `audio/generated_${timestamp}.mp3`;
    const outputPath = `public/${filename}`;

    await service.saveAudioToFile(audioBuffer, outputPath);

    return filename; // Return relative path for use with staticFile()
  }
}

export const ttsService = TTSServiceFactory.getInstance();
