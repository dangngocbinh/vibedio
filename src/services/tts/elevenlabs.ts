import axios from 'axios';
import { config } from '../../utils/config';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

export interface TTSOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  outputPath?: string;
}

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.elevenlabs.apiKey;
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
    const {
      text,
      voiceId = '21m00Tcm4TlvDq8ikWAM', // Default voice (Rachel)
      stability = 0.5,
      similarityBoost = 0.75,
    } = options;

    try {
      const response = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  async saveAudioToFile(audioBuffer: ArrayBuffer, outputPath: string): Promise<void> {
    if (typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, Buffer.from(audioBuffer));
    } else {
      // Browser environment - download file
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputPath;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

export const generateSpeech = async (text: string, voiceId?: string): Promise<string> => {
  const service = new ElevenLabsService();
  const audioBuffer = await service.textToSpeech({ text, voiceId });

  const timestamp = Date.now();
  // Return path relative to public/ directory (without 'public/' prefix)
  // This will be used with staticFile() in Remotion
  const filename = `audio/generated_${timestamp}.mp3`;
  const outputPath = `public/${filename}`;

  await service.saveAudioToFile(audioBuffer, outputPath);

  return filename; // Return relative path for use with staticFile()
};
