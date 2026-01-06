// Load environment variables
// In browser environment (Remotion Studio), use import.meta.env
// In Node environment (rendering), use process.env

export const config = {
  // TTS Services
  elevenlabs: {
    apiKey: typeof process !== 'undefined'
      ? process.env.ELEVENLABS_API_KEY
      : import.meta.env?.ELEVENLABS_API_KEY || '',
  },

  // Image Search Services
  unsplash: {
    accessKey: typeof process !== 'undefined'
      ? process.env.UNSPLASH_ACCESS_KEY
      : import.meta.env?.UNSPLASH_ACCESS_KEY || '',
  },
  pexels: {
    apiKey: typeof process !== 'undefined'
      ? process.env.PEXELS_API_KEY
      : import.meta.env?.PEXELS_API_KEY || '',
  },
  pixabay: {
    apiKey: typeof process !== 'undefined'
      ? process.env.PIXABAY_API_KEY
      : import.meta.env?.PIXABAY_API_KEY || '',
  },

  // AI Agent
  openai: {
    apiKey: typeof process !== 'undefined'
      ? process.env.OPENAI_API_KEY
      : import.meta.env?.OPENAI_API_KEY || '',
  },

  // Speech-to-Text
  deepgram: {
    apiKey: typeof process !== 'undefined'
      ? process.env.DEEPGRAM_API_KEY
      : import.meta.env?.DEEPGRAM_API_KEY || '',
  },
};

export const validateConfig = () => {
  const missing: string[] = [];

  if (!config.elevenlabs.apiKey) missing.push('ELEVENLABS_API_KEY');
  if (!config.unsplash.accessKey) missing.push('UNSPLASH_ACCESS_KEY');
  if (!config.pexels.apiKey) missing.push('PEXELS_API_KEY');
  if (!config.openai.apiKey) missing.push('OPENAI_API_KEY');
  if (!config.deepgram.apiKey) missing.push('DEEPGRAM_API_KEY');

  if (missing.length > 0) {
    console.warn('Missing API keys:', missing.join(', '));
    console.warn('Please add them to your .env file');
  }

  return missing.length === 0;
};
