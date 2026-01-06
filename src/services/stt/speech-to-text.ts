import axios from 'axios';
import { config } from '../../utils/config';
import { AudioTimestamp, CaptionWord } from '../../types';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

export class SpeechToTextService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.deepgram.apiKey;
    if (!this.apiKey) {
      throw new Error('Deepgram API key is required');
    }
  }

  async transcribeAudio(audioPath: string): Promise<AudioTimestamp> {
    try {
      let audioBuffer: Buffer;

      if (typeof window === 'undefined') {
        // Node.js environment
        const fs = await import('fs/promises');
        audioBuffer = await fs.readFile(audioPath);
      } else {
        // Browser environment
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      }

      const response = await axios.post(
        `${DEEPGRAM_API_URL}/listen`,
        audioBuffer,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': 'audio/mpeg',
          },
          params: {
            model: 'nova-2',
            smart_format: 'true',
            punctuate: 'true',
            diarize: 'false',
            utterances: 'true',
            words: 'true', // Get word-level timestamps
            language: 'vi', // Vietnamese, change to 'en' for English
          },
        }
      );

      const result = response.data;
      const words: CaptionWord[] = [];

      // Extract word-level timestamps
      if (result.results?.channels?.[0]?.alternatives?.[0]?.words) {
        const wordsData = result.results.channels[0].alternatives[0].words;

        for (const word of wordsData) {
          words.push({
            word: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence,
          });
        }
      }

      // Get total duration
      const duration =
        result.results?.channels?.[0]?.alternatives?.[0]?.words?.slice(-1)[0]?.end || 0;

      return {
        words,
        duration,
        audioUrl: audioPath,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async transcribeAudioWithFallback(audioPath: string, text: string, duration: number): Promise<AudioTimestamp> {
    try {
      return await this.transcribeAudio(audioPath);
    } catch (error) {
      console.error('STT failed, using fallback timing:', error);
      // Fallback: distribute words evenly
      return this.createFallbackTimestamps(text, duration, audioPath);
    }
  }

  private createFallbackTimestamps(text: string, duration: number, audioPath: string): AudioTimestamp {
    const words = text.split(/\s+/);
    const wordDuration = duration / words.length;

    const captionWords: CaptionWord[] = words.map((word, index) => ({
      word,
      start: index * wordDuration,
      end: (index + 1) * wordDuration,
      confidence: 1.0,
    }));

    return {
      words: captionWords,
      duration,
      audioUrl: audioPath,
    };
  }
}

export const speechToTextService = new SpeechToTextService();
