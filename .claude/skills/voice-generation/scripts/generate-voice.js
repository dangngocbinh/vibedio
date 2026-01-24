const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const minimist = require('minimist');
const { OpenAI } = require('openai');
const textToSpeech = require('@google-cloud/text-to-speech');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const ARGS = minimist(process.argv.slice(2));

// Configuration
const CONFIG = {
    outputDir: ARGS.outputDir || process.env.OUTPUT_DIR || './output',
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    vbeeApiKey: process.env.VBEE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleApiKey: process.env.GOOGLE_API_KEY
};

// Ensure output directory exists
fs.ensureDirSync(CONFIG.outputDir);

/**
 * Generate formatted filename: slug-title-HH-mm-dd-MM-yyyy
 */
function generateBaseFilename(text, providedTitle) {
    let slug;

    if (providedTitle) {
        slug = slugify(providedTitle);
    } else {
        // Take first 5 words or first 30 chars
        const shortText = text.split(/\s+/).slice(0, 6).join(' ').substring(0, 40);
        slug = slugify(shortText);
    }

    // Format Date: HH-mm-dd-MM-yyyy
    const now = new Date();
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const timestamp = `${HH}-${mm}-${dd}-${MM}-${yyyy}`;

    return `${slug}-${timestamp}`;
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Main function to handle voice generation
 */
async function main() {
    try {
        const textArg = ARGS.text;
        const emotion = ARGS.emotion || 'neutral';
        const title = ARGS.title || null;

        const voiceId = ARGS.voiceId;
        let scriptPath = ARGS.script;

        let finalText = textArg;

        // If script path is provided, read from it
        if (scriptPath) {
            const absoluteScriptPath = path.isAbsolute(scriptPath)
                ? scriptPath
                : path.join(process.cwd(), scriptPath);

            if (await fs.pathExists(absoluteScriptPath)) {
                if (absoluteScriptPath.endsWith('.json')) {
                    const json = await fs.readJson(absoluteScriptPath);
                    finalText = json.script?.fullText || json.text || json.fullText;
                } else {
                    finalText = await fs.readFile(absoluteScriptPath, 'utf8');
                }
                console.log(`Loaded text from: ${absoluteScriptPath}`);
            } else {
                console.error(`Error: Script file not found: ${absoluteScriptPath}`);
                process.exit(1);
            }
        }

        if (!finalText) {
            console.error('Error: --text argument or --script file is required');
            process.exit(1);
        }

        // Handle provider selection before baseFilename
        let provider = ARGS.provider ? ARGS.provider.toLowerCase() : selectProvider(finalText, emotion);
        if (provider === 'google') provider = 'gemini';

        // Auto-select filename
        const baseFilename = ARGS.outputDir ? 'voice' : generateBaseFilename(finalText, title);

        console.log(`Generating voice...`);
        console.log(`Text: "${finalText.substring(0, 50)}..."`);
        console.log(`Filename: ${baseFilename}`);
        console.log(`Provider: ${provider}`);
        console.log(`Emotion: ${emotion}`);

        let result;

        switch (provider) {
            case 'elevenlabs':
                result = await generateElevenLabs(finalText, voiceId, emotion, baseFilename);
                break;
            case 'vbee':
                result = await generateVbee(finalText, voiceId, baseFilename);
                break;
            case 'openai':
                result = await generateOpenAI(finalText, voiceId, baseFilename);
                break;
            case 'gemini':
                result = await generateGemini(finalText, voiceId, emotion, baseFilename);
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Post-processing: Check if we need to generate timestamps via Whisper
        if (!result.timestamps && CONFIG.openaiApiKey && !ARGS['skip-timestamps']) {
            console.log('Timestamps missing. Attempting to generate via Whisper...');
            try {
                const whisperTimestamps = await generateTimestampsWithWhisper(result.audioPath, text);
                if (whisperTimestamps) {
                    result.timestamps = whisperTimestamps;
                    // Update the JSON file
                    const meta = await fs.readJson(result.jsonPath);
                    meta.timestamps = whisperTimestamps;
                    meta.timestamp_source = 'whisper_fallback';
                    await fs.writeJson(result.jsonPath, meta, { spaces: 2 });
                    console.log('Timestamps generated successfully via Whisper.');
                }
            } catch (err) {
                console.error('Failed to generate timestamps with Whisper:', err.message);
            }
        }

        console.log(`\nSuccess!`);
        console.log(`Audio: ${result.audioPath}`);
        if (result.jsonPath) {
            console.log(`Metadata: ${result.jsonPath}`);
        }

    } catch (error) {
        console.logError(error);
        process.exit(1);
    }
}

// Helper to log errors nicely
console.logError = (error) => {
    console.error('Generation Failed:', error.message);
    if (error.response) {
        console.error('API Error Status:', error.response.status);
        try { console.error('API Error Data:', JSON.stringify(error.response.data, null, 2)); }
        catch (e) { console.error('API Error Data:', error.response.data); }
    }
};

function selectProvider(text, emotion) {
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
        return 'vbee';
    }
    if (['sad', 'angry', 'excited', 'fearful'].includes(emotion)) {
        return 'elevenlabs';
    }
    return 'gemini';
}

/**
 * Generate Word-level Timestamps using OpenAI Whisper
 */
async function generateTimestampsWithWhisper(audioPath, originalText) {
    const openai = new OpenAI({ apiKey: CONFIG.openaiApiKey });
    const audioStream = fs.createReadStream(audioPath);

    console.log('Calling OpenAI Whisper API...');
    const response = await openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
    });

    if (response.words) {
        return response.words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    }
    return null;
}

async function generateGemini(text, voiceId, emotion, baseFilename) {
    if (!CONFIG.googleApiKey) throw new Error('Missing GOOGLE_API_KEY');

    const activeModelId = 'gemini-2.5-pro-preview-tts';
    console.log(`Using Gemini Generative API with model ${activeModelId}...`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModelId}:streamGenerateContent?key=${CONFIG.googleApiKey}`;
    const voiceName = voiceId || 'Puck';

    const payload = {
        contents: [{ role: "user", parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["audio"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } }
        }
    };

    const response = await axios.post(endpoint, payload);
    let chunks = response.data;
    if (typeof chunks === 'string') { try { chunks = JSON.parse(chunks); } catch (e) { } }

    if (!Array.isArray(chunks)) {
        if (chunks.candidates) chunks = [chunks];
        else throw new Error('Unexpected response format from Gemini API');
    }

    let fullAudioBuffer = Buffer.alloc(0);
    for (const chunk of chunks) {
        if (chunk.candidates && chunk.candidates[0].content && chunk.candidates[0].content.parts) {
            for (const part of chunk.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    fullAudioBuffer = Buffer.concat([fullAudioBuffer, Buffer.from(part.inlineData.data, 'base64')]);
                }
            }
        }
    }

    if (fullAudioBuffer.length === 0) throw new Error('No audio data received in stream.');

    // WRAP PCM in WAV Header (24kHz Mono 16-bit)
    const wavHeader = createWavHeader(fullAudioBuffer.length, 24000, 1, 16);
    const wavBuffer = Buffer.concat([wavHeader, fullAudioBuffer]);

    const basePath = path.join(CONFIG.outputDir, baseFilename);
    const audioPath = `${basePath}.wav`;

    await fs.writeFile(audioPath, wavBuffer);

    const jsonPath = `${basePath}.json`;
    await fs.writeJson(jsonPath, {
        text, provider: 'gemini', voiceId: voiceName, model: activeModelId,
        timestamps: null,
    }, { spaces: 2 });

    return { audioPath, jsonPath, timestamps: null };
}

function createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataLength, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);
    return header;
}

async function generateElevenLabs(text, voiceId, emotion, baseFilename) {
    if (!CONFIG.elevenLabsApiKey) throw new Error('Missing ELEVENLABS_API_KEY');
    const voiceMap = { neutral: '21m00Tcm4TlvDq8ikWAM', happy: '21m00Tcm4TlvDq8ikWAM', sad: 'ErXwobaYiN019PkySvjV', angry: 'TxGEqnHWrfWFTfGW9XjX' };
    const selectedVoiceId = voiceId || voiceMap[emotion] || voiceMap.neutral;
    const modelId = 'eleven_multilingual_v2';
    const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/with-timestamps`,
        { text: text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
        { headers: { 'xi-api-key': CONFIG.elevenLabsApiKey, 'Content-Type': 'application/json' } }
    );

    const basePath = path.join(CONFIG.outputDir, baseFilename);
    const audioData = response.data.audio_base64;
    await fs.writeFile(`${basePath}.mp3`, Buffer.from(audioData, 'base64'));
    const alignment = response.data.alignment;
    const wordTimestamps = processElevenLabsAlignment(alignment, text);

    await fs.writeJson(`${basePath}.json`, {
        text, provider: 'elevenlabs', voiceId: selectedVoiceId, emotion, raw_alignment: alignment, timestamps: wordTimestamps
    }, { spaces: 2 });

    return { audioPath: `${basePath}.mp3`, jsonPath: `${basePath}.json`, timestamps: wordTimestamps };
}

function processElevenLabsAlignment(alignment, text) {
    if (!alignment) return [];
    const words = []; const chars = alignment.characters; const starts = alignment.character_start_times_seconds; const ends = alignment.character_end_times_seconds;
    let currentWord = ''; let start = -1;
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (start === -1) start = starts[i];
        if (char === ' ' || i === chars.length - 1) {
            if (i === chars.length - 1 && char !== ' ') currentWord += char;
            if (currentWord.trim()) words.push({ word: currentWord.trim(), start: start, end: ends[i] });
            currentWord = ''; start = -1;
        } else { currentWord += char; }
    }
    return words;
}

async function generateVbee(text, voiceId, baseFilename) {
    if (!CONFIG.vbeeApiKey) throw new Error('Missing VBEE_API_KEY');
    const response = await axios.post('https://api.vbee.vn/api/v1/tts', {
        app_id: CONFIG.vbeeApiKey, input_text: text, voice: voiceId || 'hn_male_manh_dung_news_48k-h', rate: 1, format: 'mp3'
    }, { headers: { 'Authentication': `Bearer ${CONFIG.vbeeApiKey}` } });
    let audioData;
    if (response.data.audio_link) { const audioRes = await axios.get(response.data.audio_link, { responseType: 'arraybuffer' }); audioData = audioRes.data; }
    else { audioData = response.data; }

    const basePath = path.join(CONFIG.outputDir, baseFilename);
    await fs.writeFile(`${basePath}.mp3`, audioData);
    await fs.writeJson(`${basePath}.json`, { text, provider: 'vbee', voiceId, timestamps: null }, { spaces: 2 });
    return { audioPath: `${basePath}.mp3`, jsonPath: `${basePath}.json`, timestamps: null };
}

async function generateOpenAI(text, voiceId, baseFilename) {
    if (!CONFIG.openaiApiKey) throw new Error('Missing OPENAI_API_KEY');
    const openai = new OpenAI({ apiKey: CONFIG.openaiApiKey });
    const selectedVoice = voiceId || 'alloy';
    const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: selectedVoice, input: text, });
    const buffer = Buffer.from(await mp3.arrayBuffer());

    const basePath = path.join(CONFIG.outputDir, baseFilename);
    await fs.writeFile(`${basePath}.mp3`, buffer);
    await fs.writeJson(`${basePath}.json`, { text, provider: 'openai', voiceId: selectedVoice, timestamps: null }, { spaces: 2 });
    return { audioPath: `${basePath}.mp3`, jsonPath: `${basePath}.json`, timestamps: null };
}

main();
