const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const minimist = require('minimist');
const { OpenAI } = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Parse command-line arguments
const ARGS = minimist(process.argv.slice(2));

// Configuration
const CONFIG = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
};

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
            return Math.round(duration * 100) / 100;
        }
    } catch (err) {
        console.warn(`Warning: Could not get audio duration via ffprobe: ${err.message}`);
    }
    return null;
}

/**
 * Detect language code for ElevenLabs from text
 * Returns ISO 639-1 code
 * @param {string} text - Text to detect language from
 * @returns {string} Language code (e.g., 'vi', 'en')
 */
function detectLanguageCode(text) {
    if (!text) return null;
    // Simple Vietnamese detection: check for Vietnamese diacritics
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    if (vietnamesePattern.test(text)) return 'vi';
    return 'en';
}

/**
 * Generate Word-level Timestamps using ElevenLabs Scribe v2
 * Uses the batch Speech-to-Text API with word-level timestamp granularity
 *
 * @param {string} audioPath - Path to audio file
 * @param {string} originalText - Optional original text (used for language detection)
 * @returns {Array} Array of {word, start, end} objects
 */
async function generateTimestampsWithElevenLabs(audioPath, originalText = null) {
    if (!CONFIG.elevenlabsApiKey) {
        throw new Error('Missing ELEVENLABS_API_KEY in .env file. Please add it to use ElevenLabs STT.');
    }

    console.log('📡 Calling ElevenLabs Scribe v2 API for transcription...');

    const form = new FormData();
    form.append('model_id', 'scribe_v2');
    form.append('file', fs.createReadStream(audioPath));
    form.append('timestamps_granularity', 'word');
    form.append('tag_audio_events', 'false');

    // Detect and set language for better accuracy
    const langCode = detectLanguageCode(originalText);
    if (langCode) {
        form.append('language_code', langCode);
        console.log(`🌐 Language detected: ${langCode}`);
    }

    try {
        const response = await axios.post(
            'https://api.elevenlabs.io/v1/speech-to-text',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'xi-api-key': CONFIG.elevenlabsApiKey,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000, // 5 min timeout for large files
            }
        );

        const data = response.data;

        if (data.words && data.words.length > 0) {
            // Filter only actual words (skip spacing and audio_event types)
            const wordTimestamps = data.words
                .filter(w => w.type === 'word')
                .map(w => ({
                    word: w.text,
                    start: Math.round(w.start * 1000) / 1000,
                    end: Math.round(w.end * 1000) / 1000,
                }));

            console.log(`✅ Generated ${wordTimestamps.length} word timestamps via ElevenLabs Scribe v2`);

            // Log transcribed text for verification
            if (data.text) {
                const preview = data.text.length > 100 ? data.text.substring(0, 100) + '...' : data.text;
                console.log(`📝 Transcribed: "${preview}"`);
            }

            return { timestamps: wordTimestamps, transcribedText: data.text || null };
        }

        console.warn('⚠️  No word timestamps returned from ElevenLabs API');
        return { timestamps: null, transcribedText: data.text || null };
    } catch (error) {
        if (error.response) {
            console.error(`❌ ElevenLabs API Error [${error.response.status}]:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ ElevenLabs API Error:', error.message);
        }
        throw error;
    }
}

/**
 * Generate Word-level Timestamps using OpenAI Whisper
 * @param {string} audioPath - Path to audio file
 * @param {string} originalText - Optional original text for prompt (improves accuracy)
 * @returns {Array} Array of {word, start, end} objects
 */
async function generateTimestampsWithWhisper(audioPath, originalText = null) {
    if (!CONFIG.openaiApiKey) {
        throw new Error('Missing OPENAI_API_KEY in .env file. Please add it to generate timestamps.');
    }

    const openai = new OpenAI({ apiKey: CONFIG.openaiApiKey });
    const audioStream = fs.createReadStream(audioPath);

    console.log('📡 Calling OpenAI Whisper API for transcription...');

    try {
        const response = await openai.audio.transcriptions.create({
            file: audioStream,
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            ...(originalText && { prompt: originalText })
        });

        if (response.words) {
            console.log(`✅ Generated ${response.words.length} word timestamps via Whisper`);
            const timestamps = response.words.map(w => ({
                word: w.word,
                start: w.start,
                end: w.end
            }));
            return { timestamps, transcribedText: response.text || null };
        }

        console.warn('⚠️  No word timestamps returned from Whisper API');
        return { timestamps: null, transcribedText: response.text || null };
    } catch (error) {
        console.error('❌ Whisper API Error:', error.message);
        throw error;
    }
}

/**
 * Select the best STT provider based on availability and user preference
 * Priority: elevenlabs (if key available) > whisper (if key available)
 *
 * @param {string} requestedProvider - User-requested provider ('elevenlabs', 'whisper', 'auto')
 * @returns {string} Selected provider name
 */
function selectProvider(requestedProvider) {
    const provider = (requestedProvider || 'auto').toLowerCase();

    if (provider === 'elevenlabs') {
        if (!CONFIG.elevenlabsApiKey) {
            throw new Error('ElevenLabs requested but ELEVENLABS_API_KEY is missing in .env');
        }
        return 'elevenlabs';
    }

    if (provider === 'whisper') {
        if (!CONFIG.openaiApiKey) {
            throw new Error('Whisper requested but OPENAI_API_KEY is missing in .env');
        }
        return 'whisper';
    }

    // Auto mode: prefer ElevenLabs for better accuracy, fallback to Whisper
    if (provider === 'auto') {
        if (CONFIG.elevenlabsApiKey) {
            console.log('🔄 Auto-selected: ElevenLabs Scribe v2 (ELEVENLABS_API_KEY found)');
            return 'elevenlabs';
        }
        if (CONFIG.openaiApiKey) {
            console.log('🔄 Auto-selected: OpenAI Whisper (OPENAI_API_KEY found, no ELEVENLABS_API_KEY)');
            return 'whisper';
        }
        throw new Error('No API keys found. Please add ELEVENLABS_API_KEY or OPENAI_API_KEY to .env file.');
    }

    throw new Error(`Unknown provider: "${provider}". Use: elevenlabs, whisper, or auto`);
}

/**
 * Main function
 */
async function main() {
    try {
        const audioPath = ARGS.audio;
        const originalText = ARGS.text || null;
        const outputDir = ARGS.outputDir || null;
        const requestedProvider = ARGS.provider || 'auto';

        if (!audioPath) {
            console.error('❌ Error: --audio argument is required');
            console.log('\nUsage:');
            console.log('  node generate-timestamps.js --audio "path/to/voice.mp3" [options]');
            console.log('\nOptions:');
            console.log('  --audio         Path to audio file (required)');
            console.log('  --text          Original text for better accuracy (optional)');
            console.log('  --provider      STT provider: elevenlabs, whisper, auto (default: auto)');
            console.log('                  auto = ElevenLabs if key exists, else Whisper');
            console.log('  --outputDir     Custom output directory (optional, default: same as audio file)');
            console.log('\nExamples:');
            console.log('  # Auto-select best provider (ElevenLabs > Whisper)');
            console.log('  node .claude/skills/voice-generation/scripts/generate-timestamps.js \\');
            console.log('    --audio "public/projects/my-video/voice.mp3" \\');
            console.log('    --text "Xin chào các bạn"');
            console.log('');
            console.log('  # Force ElevenLabs Scribe v2');
            console.log('  node .claude/skills/voice-generation/scripts/generate-timestamps.js \\');
            console.log('    --audio "public/projects/my-video/voice.mp3" \\');
            console.log('    --provider elevenlabs');
            console.log('');
            console.log('  # Force Whisper');
            console.log('  node .claude/skills/voice-generation/scripts/generate-timestamps.js \\');
            console.log('    --audio "public/projects/my-video/voice.mp3" \\');
            console.log('    --provider whisper');
            process.exit(1);
        }

        // Resolve absolute path
        const absoluteAudioPath = path.isAbsolute(audioPath)
            ? audioPath
            : path.join(process.cwd(), audioPath);

        // Check if audio file exists
        if (!await fs.pathExists(absoluteAudioPath)) {
            console.error(`❌ Error: Audio file not found: ${absoluteAudioPath}`);
            process.exit(1);
        }

        // Select provider
        const selectedProvider = selectProvider(requestedProvider);

        console.log('\n🎵 Generating timestamps for existing voice file...');
        console.log(`📁 Audio file: ${absoluteAudioPath}`);
        console.log(`🔧 STT Provider: ${selectedProvider === 'elevenlabs' ? 'ElevenLabs Scribe v2' : 'OpenAI Whisper'}`);
        if (originalText) {
            console.log(`📝 Original text: "${originalText.substring(0, 50)}${originalText.length > 50 ? '...' : ''}"`);
        }

        // Get audio duration
        const duration = getAudioDuration(absoluteAudioPath);
        if (duration) {
            console.log(`⏱️  Audio duration: ${duration}s`);
        }

        // Generate timestamps with selected provider
        let result;
        if (selectedProvider === 'elevenlabs') {
            result = await generateTimestampsWithElevenLabs(absoluteAudioPath, originalText);
        } else {
            result = await generateTimestampsWithWhisper(absoluteAudioPath, originalText);
        }

        const { timestamps, transcribedText } = result;

        if (!timestamps || timestamps.length === 0) {
            console.error('❌ Failed to generate timestamps');
            process.exit(1);
        }

        // Determine output location
        let jsonPath;
        if (outputDir) {
            await fs.ensureDir(outputDir);
            const audioFilename = path.basename(absoluteAudioPath);
            const baseFilename = path.basename(audioFilename, path.extname(audioFilename));
            jsonPath = path.join(outputDir, `${baseFilename}.json`);
        } else {
            const audioDir = path.dirname(absoluteAudioPath);
            const audioFilename = path.basename(absoluteAudioPath);
            const baseFilename = path.basename(audioFilename, path.extname(audioFilename));
            jsonPath = path.join(audioDir, `${baseFilename}.json`);
        }

        // Calculate duration from timestamps
        const durationFromTimestamps = timestamps.length > 0
            ? timestamps[timestamps.length - 1].end
            : duration;

        // Create metadata object
        const metadata = {
            text: originalText || transcribedText || '(transcribed from audio)',
            provider: 'external',
            audioFile: path.basename(absoluteAudioPath),
            duration: duration,
            durationFromTimestamps: durationFromTimestamps,
            timestamps: timestamps,
            timestamp_source: selectedProvider === 'elevenlabs' ? 'elevenlabs_scribe_v2' : 'whisper',
            generatedAt: new Date().toISOString()
        };

        // Save metadata to JSON file
        await fs.writeJson(jsonPath, metadata, { spaces: 2 });

        console.log('\n✅ Success!');
        console.log(`📄 Metadata saved to: ${jsonPath}`);
        console.log(`📊 Generated ${timestamps.length} word timestamps`);
        console.log(`🔧 Source: ${metadata.timestamp_source}`);
        if (durationFromTimestamps) {
            console.log(`⏱️  Total duration: ${durationFromTimestamps}s`);
        }

    } catch (error) {
        console.error('\n❌ Generation Failed:', error.message);
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            try {
                console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
            } catch (e) {
                console.error('API Error Data:', error.response.data);
            }
        }
        process.exit(1);
    }
}

main();
