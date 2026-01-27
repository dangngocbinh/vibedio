const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const minimist = require('minimist');
const { OpenAI } = require('openai');
const textToSpeech = require('@google-cloud/text-to-speech');
const { execSync } = require('child_process');

// Load environment variables
// NOTE FOR VUE DEVELOPER:
// __dirname là biến global trong Node.js, tương tự như import.meta.url trong Vue/Vite
// Nó trỏ đến thư mục hiện tại của file này: /Users/binhpc/code/automation-video/.claude/skills/voice-generation/scripts
// Đi lên 4 cấp (../../../..) để đến thư mục gốc project: /Users/binhpc/code/automation-video/
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const ARGS = minimist(process.argv.slice(2));

// Configuration
const CONFIG = {
    outputDir: ARGS.outputDir || process.env.OUTPUT_DIR || './output',
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    vbeeApiKey: process.env.VBEE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleApiKey: process.env.GEMINI_API_KEY
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

        // NOTE FOR VUE DEVELOPER:
        // ARGS là object chứa command-line arguments, tương tự như props trong Vue component
        // minimist library parse command line thành object: --voiceId "Charon" → ARGS.voiceId = "Charon"
        const voiceId = ARGS.voiceId;
        const styleInstruction = ARGS.styleInstruction || null; // Gemini style instruction
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

        // NOTE FOR VUE DEVELOPER:
        // Validation này giống như form validation trong Vue
        // Kiểm tra điều kiện trước khi submit/execute
        // Validate API key for selected provider
        const providerKeyMap = {
            'elevenlabs': { key: CONFIG.elevenLabsApiKey, name: 'ELEVENLABS_API_KEY' },
            'vbee': { key: CONFIG.vbeeApiKey, name: 'VBEE_API_KEY' },
            'openai': { key: CONFIG.openaiApiKey, name: 'OPENAI_API_KEY' },
            'gemini': { key: CONFIG.googleApiKey, name: 'GEMINI_API_KEY' }
        };

        const providerInfo = providerKeyMap[provider];
        if (providerInfo && !providerInfo.key) {
            throw new Error(
                `Cannot use provider "${provider}": Missing ${providerInfo.name} in .env file.\n` +
                `Please add it to: /Users/binhpc/code/automation-video/.env\n` +
                `Or use a different provider with: --provider <elevenlabs|vbee|openai|gemini>`
            );
        }

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
                // Pass styleInstruction to Gemini generator
                result = await generateGemini(finalText, voiceId, emotion, baseFilename, styleInstruction);
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Post-processing: Get actual audio duration from file
        const actualDuration = getAudioDuration(result.audioPath);
        if (actualDuration !== null) {
            console.log(`Actual audio duration: ${actualDuration}s`);
            result.duration = actualDuration;
            // Update the JSON file with actual duration
            const meta = await fs.readJson(result.jsonPath);
            meta.duration = actualDuration;
            meta.audioFile = path.basename(result.audioPath);
            await fs.writeJson(result.jsonPath, meta, { spaces: 2 });
        }

        // Post-processing: Check if we need to generate timestamps via Whisper
        if (!result.timestamps && CONFIG.openaiApiKey && !ARGS['skip-timestamps']) {
            console.log('Timestamps missing. Attempting to generate via Whisper...');
            try {
                const whisperTimestamps = await generateTimestampsWithWhisper(result.audioPath, finalText);
                if (whisperTimestamps) {
                    result.timestamps = whisperTimestamps;
                    // Update the JSON file
                    const meta = await fs.readJson(result.jsonPath);
                    meta.timestamps = whisperTimestamps;
                    meta.timestamp_source = 'whisper';
                    // Recalculate duration from timestamps if available
                    if (whisperTimestamps.length > 0) {
                        const lastWord = whisperTimestamps[whisperTimestamps.length - 1];
                        meta.durationFromTimestamps = lastWord.end;
                    }
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

// NOTE FOR VUE DEVELOPER:
// Function này tương tự như computed property trong Vue
// Nó tự động chọn provider phù hợp dựa trên text và emotion
// Và kiểm tra xem có API key không trước khi chọn
function selectProvider(text, emotion) {
    // Detect Vietnamese text
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    const hasEmotion = ['sad', 'angry', 'excited', 'fearful'].includes(emotion);

    // Priority list based on text characteristics
    let preferredProvider = null;

    if (isVietnamese) {
        // Vietnamese: prefer Vbee > Gemini > OpenAI
        if (CONFIG.vbeeApiKey) {
            preferredProvider = 'vbee';
        } else if (CONFIG.googleApiKey) {
            preferredProvider = 'gemini';
            console.log('⚠️  Vbee not available (no API key), using Gemini instead');
        } else if (CONFIG.openaiApiKey) {
            preferredProvider = 'openai';
            console.log('⚠️  Vbee & Gemini not available, using OpenAI instead');
        }
    } else if (hasEmotion) {
        // English with emotion: prefer ElevenLabs > Gemini > OpenAI
        if (CONFIG.elevenLabsApiKey) {
            preferredProvider = 'elevenlabs';
        } else if (CONFIG.googleApiKey) {
            preferredProvider = 'gemini';
            console.log('⚠️  ElevenLabs not available (no API key), using Gemini instead');
        } else if (CONFIG.openaiApiKey) {
            preferredProvider = 'openai';
            console.log('⚠️  ElevenLabs & Gemini not available, using OpenAI instead');
        }
    } else {
        // Default: prefer Gemini > OpenAI > ElevenLabs
        if (CONFIG.googleApiKey) {
            preferredProvider = 'gemini';
        } else if (CONFIG.openaiApiKey) {
            preferredProvider = 'openai';
            console.log('⚠️  Gemini not available (no API key), using OpenAI instead');
        } else if (CONFIG.elevenLabsApiKey) {
            preferredProvider = 'elevenlabs';
            console.log('⚠️  Gemini & OpenAI not available, using ElevenLabs instead');
        }
    }

    if (!preferredProvider) {
        throw new Error('No voice provider available. Please add at least one API key to .env file:\n' +
            '  - GEMINI_API_KEY (Google Gemini)\n' +
            '  - OPENAI_API_KEY (OpenAI)\n' +
            '  - ELEVENLABS_API_KEY (ElevenLabs)\n' +
            '  - VBEE_API_KEY (Vbee - Vietnamese)');
    }

    return preferredProvider;
}

/**
 * Get actual audio duration using ffprobe
 * @param {string} audioPath - Path to audio file
 * @returns {number} Duration in seconds, or null if failed
 */
function getAudioDuration(audioPath) {
    try {
        const result = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
            { encoding: 'utf8', timeout: 10000 }
        );
        const duration = parseFloat(result.trim());
        if (!isNaN(duration)) {
            return Math.round(duration * 100) / 100; // Round to 2 decimal places
        }
    } catch (err) {
        console.warn(`Warning: Could not get audio duration via ffprobe: ${err.message}`);
    }
    return null;
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

async function generateGemini(text, voiceId, emotion, baseFilename, styleInstruction = null) {
    if (!CONFIG.googleApiKey) throw new Error('Missing GEMINI_API_KEY');

    const activeModelId = 'gemini-2.5-pro-preview-tts';
    console.log(`Using Gemini Generative API with model ${activeModelId}...`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModelId}:streamGenerateContent?key=${CONFIG.googleApiKey}`;
    const voiceName = voiceId || 'Puck';

    // NOTE FOR VUE DEVELOPER:
    // Đây là cách build object động trong JavaScript
    // Tương tự như computed properties trong Vue, nhưng đơn giản hơn
    // Nếu styleInstruction tồn tại, thêm vào payload, nếu không thì bỏ qua
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    // Nếu có styleInstruction, thêm vào đầu text để Gemini hiểu style
                    { text: styleInstruction ? `${styleInstruction}\n\n${text}` : text }
                ]
            }
        ],
        generationConfig: {
            responseModalities: ["audio"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
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
    const audioFilename = path.basename(audioPath);
    await fs.writeJson(jsonPath, {
        text,
        provider: 'gemini',
        voiceId: voiceName,
        styleInstruction: styleInstruction || null, // Save style instruction to metadata
        model: activeModelId,
        audioFile: audioFilename,
        duration: null, // Will be updated with actual duration from ffprobe
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

    const audioFilename = `${path.basename(basePath)}.mp3`;
    await fs.writeJson(`${basePath}.json`, {
        text,
        provider: 'elevenlabs',
        voiceId: selectedVoiceId,
        emotion,
        audioFile: audioFilename,
        duration: null, // Will be updated with actual duration from ffprobe
        raw_alignment: alignment,
        timestamps: wordTimestamps
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
    const audioFilename = `${path.basename(basePath)}.mp3`;
    await fs.writeJson(`${basePath}.json`, {
        text,
        provider: 'vbee',
        voiceId,
        audioFile: audioFilename,
        duration: null, // Will be updated with actual duration from ffprobe
        timestamps: null
    }, { spaces: 2 });
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
    const audioFilename = `${path.basename(basePath)}.mp3`;
    await fs.writeJson(`${basePath}.json`, {
        text,
        provider: 'openai',
        voiceId: selectedVoice,
        audioFile: audioFilename,
        duration: null, // Will be updated with actual duration from ffprobe
        timestamps: null
    }, { spaces: 2 });
    return { audioPath: `${basePath}.mp3`, jsonPath: `${basePath}.json`, timestamps: null };
}

main();
