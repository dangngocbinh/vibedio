const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const minimist = require('minimist');
const { OpenAI } = require('openai');
const { execSync } = require('child_process');

// NOTE FOR VUE DEVELOPER:
// Load environment variables từ thư mục gốc project
// Tương tự như import.meta.env trong Vue/Vite, nhưng ở Node.js dùng dotenv
// __dirname = /Users/binhpc/code/automation-video/.claude/skills/voice-generation/scripts
// Đi lên 4 cấp để đến /Users/binhpc/code/automation-video/
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Parse command-line arguments
// NOTE FOR VUE DEVELOPER:
// minimist library parse CLI arguments thành object
// Tương tự như props trong Vue component
// Example: --audio "file.mp3" --text "hello" → ARGS = { audio: "file.mp3", text: "hello" }
const ARGS = minimist(process.argv.slice(2));

// Configuration
const CONFIG = {
    openaiApiKey: process.env.OPENAI_API_KEY,
};

/**
 * Get actual audio duration using ffprobe
 * NOTE FOR VUE DEVELOPER:
 * execSync là cách chạy shell command trong Node.js, tương tự như child_process trong browser
 * ffprobe là tool để đọc metadata từ audio/video files
 * 
 * @param {string} audioPath - Path to audio file
 * @returns {number} Duration in seconds, or null if failed
 */
function getAudioDuration(audioPath) {
    try {
        // Chạy ffprobe command để lấy duration
        // -v error: chỉ hiện errors
        // -show_entries format=duration: chỉ hiện duration
        // -of default=noprint_wrappers=1:nokey=1: format output đơn giản
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
 * NOTE FOR VUE DEVELOPER:
 * async/await trong Node.js giống hệt trong Vue
 * OpenAI SDK sử dụng pattern tương tự như axios trong Vue
 * 
 * @param {string} audioPath - Path to audio file
 * @param {string} originalText - Optional original text for prompt (improves accuracy)
 * @returns {Array} Array of {word, start, end} objects
 */
async function generateTimestampsWithWhisper(audioPath, originalText = null) {
    if (!CONFIG.openaiApiKey) {
        throw new Error('Missing OPENAI_API_KEY in .env file. Please add it to generate timestamps.');
    }

    const openai = new OpenAI({ apiKey: CONFIG.openaiApiKey });

    // Create read stream from audio file
    // NOTE FOR VUE DEVELOPER:
    // fs.createReadStream tạo stream để đọc file lớn mà không load toàn bộ vào RAM
    // Tương tự như streaming trong HTTP requests
    const audioStream = fs.createReadStream(audioPath);

    console.log('📡 Calling OpenAI Whisper API for transcription...');

    try {
        // NOTE FOR VUE DEVELOPER:
        // API call này tương tự như axios.post() trong Vue
        // response_format: "verbose_json" để lấy thêm metadata
        // timestamp_granularities: ["word"] để lấy timestamps ở mức từng từ (word-level)
        const response = await openai.audio.transcriptions.create({
            file: audioStream,
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            // Nếu có originalText, pass vào prompt để cải thiện độ chính xác
            ...(originalText && { prompt: originalText })
        });

        // Extract word-level timestamps
        // NOTE FOR VUE DEVELOPER:
        // .map() trong JavaScript giống hệt .map() trong Vue/Array methods
        // Transform array từ format của Whisper sang format của chúng ta
        if (response.words) {
            console.log(`✅ Generated ${response.words.length} word timestamps`);
            return response.words.map(w => ({
                word: w.word,
                start: w.start,
                end: w.end
            }));
        }

        console.warn('⚠️  No word timestamps returned from Whisper API');
        return null;
    } catch (error) {
        console.error('❌ Whisper API Error:', error.message);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Validate arguments
        // NOTE FOR VUE DEVELOPER:
        // Validation này giống như computed properties hoặc form validation trong Vue
        const audioPath = ARGS.audio;
        const originalText = ARGS.text || null;
        const outputDir = ARGS.outputDir || null;

        if (!audioPath) {
            console.error('❌ Error: --audio argument is required');
            console.log('\nUsage:');
            console.log('  node generate-timestamps.js --audio "path/to/voice.mp3" [options]');
            console.log('\nOptions:');
            console.log('  --audio         Path to audio file (required)');
            console.log('  --text          Original text for better accuracy (optional)');
            console.log('  --outputDir     Custom output directory (optional, default: same as audio file)');
            console.log('\nExample:');
            console.log('  node .claude/skills/voice-generation/scripts/generate-timestamps.js \\');
            console.log('    --audio "public/projects/my-video/voice.mp3" \\');
            console.log('    --text "Xin chào các bạn"');
            process.exit(1);
        }

        // Resolve absolute path
        // NOTE FOR VUE DEVELOPER:
        // path.resolve() tương tự như path normalization
        // Chuyển relative path thành absolute path để tránh lỗi
        const absoluteAudioPath = path.isAbsolute(audioPath)
            ? audioPath
            : path.join(process.cwd(), audioPath);

        // Check if audio file exists
        if (!await fs.pathExists(absoluteAudioPath)) {
            console.error(`❌ Error: Audio file not found: ${absoluteAudioPath}`);
            process.exit(1);
        }

        console.log('\n🎵 Generating timestamps for existing voice file...');
        console.log(`📁 Audio file: ${absoluteAudioPath}`);
        if (originalText) {
            console.log(`📝 Original text: "${originalText.substring(0, 50)}${originalText.length > 50 ? '...' : ''}"`);
        }

        // Get audio duration
        const duration = getAudioDuration(absoluteAudioPath);
        if (duration) {
            console.log(`⏱️  Audio duration: ${duration}s`);
        }

        // Generate timestamps via Whisper
        const timestamps = await generateTimestampsWithWhisper(absoluteAudioPath, originalText);

        if (!timestamps || timestamps.length === 0) {
            console.error('❌ Failed to generate timestamps');
            process.exit(1);
        }

        // Determine output location
        // NOTE FOR VUE DEVELOPER:
        // Logic này tương tự như computed property trong Vue
        // Nếu có outputDir thì dùng, không thì dùng cùng thư mục với audio file
        let jsonPath;
        if (outputDir) {
            await fs.ensureDir(outputDir);
            const audioFilename = path.basename(absoluteAudioPath);
            const baseFilename = path.basename(audioFilename, path.extname(audioFilename));
            jsonPath = path.join(outputDir, `${baseFilename}.json`);
        } else {
            // Save in same directory as audio file
            const audioDir = path.dirname(absoluteAudioPath);
            const audioFilename = path.basename(absoluteAudioPath);
            const baseFilename = path.basename(audioFilename, path.extname(audioFilename));
            jsonPath = path.join(audioDir, `${baseFilename}.json`);
        }

        // Calculate duration from timestamps (more accurate)
        const durationFromTimestamps = timestamps.length > 0
            ? timestamps[timestamps.length - 1].end
            : duration;

        // Create metadata object
        // NOTE FOR VUE DEVELOPER:
        // Object này tương tự như data object trong Vue component
        // Chứa tất cả metadata cần thiết cho video editor
        const metadata = {
            text: originalText || '(transcribed from audio)',
            provider: 'external', // Voice từ nguồn bên ngoài
            audioFile: path.basename(absoluteAudioPath),
            duration: duration,
            durationFromTimestamps: durationFromTimestamps,
            timestamps: timestamps,
            timestamp_source: 'whisper',
            generatedAt: new Date().toISOString()
        };

        // Save metadata to JSON file
        await fs.writeJson(jsonPath, metadata, { spaces: 2 });

        console.log('\n✅ Success!');
        console.log(`📄 Metadata saved to: ${jsonPath}`);
        console.log(`📊 Generated ${timestamps.length} word timestamps`);
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

// Run main function
// NOTE FOR VUE DEVELOPER:
// Trong Node.js, code chạy ngay khi file được execute
// Không giống Vue component cần mount vào DOM
main();
