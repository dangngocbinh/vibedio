const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from project root
// NOTE FOR VUE DEVELOPER:
// Tương tự như file generate-voice.js, đi lên 4 cấp thư mục để đến thư mục gốc
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

/*
 * NOTE FOR VUE DEVELOPER:
 * This is a standard JavaScript module (Node.js). 
 * It is not React code, but the concepts are similar to Vue.
 * - `PROVIDERS` is a constant object, similar to `data()` in a Vue component or `state` in Pinia/Vuex.
 * - It holds the configuration for different voice providers.
 */

const PROVIDERS = {
    gemini: {
        name: 'Google Gemini (Generative)',
        voices: [
            // This array contains objects representing each voice.
            // In Vue, you would iterate over this using `v-for="voice in voices"`.
            { id: 'Zephyr', gender: 'Female', style: 'Tươi sáng' },
            { id: 'Puck', gender: 'Male', style: 'Rộn ràng' },
            { id: 'Charon', gender: 'Male', style: 'Cung cấp nhiều thông tin' },
            { id: 'Kore', gender: 'Female', style: 'Firm' },
            { id: 'Fenrir', gender: 'Male', style: 'Dễ kích động' },
            { id: 'Leda', gender: 'Female', style: 'Trẻ trung' },
            { id: 'Orus', gender: 'Male', style: 'Firm' },
            { id: 'Aoede', gender: 'Female', style: 'Breezy' },
            { id: 'Callirrhoe', gender: 'Unknown', style: 'Dễ chịu' },
            { id: 'Autonoe', gender: 'Unknown', style: 'Tươi sáng' },
            { id: 'Enceladus', gender: 'Unknown', style: 'Breathy' },
            { id: 'Iapetus', gender: 'Unknown', style: 'Rõ ràng' },
            { id: 'Umbriel', gender: 'Unknown', style: 'Dễ tính' },
            { id: 'Algieba', gender: 'Unknown', style: 'Làm mịn' },
            { id: 'Despina', gender: 'Unknown', style: 'Smooth (Mượt mà)' },
            { id: 'Erinome', gender: 'Unknown', style: 'Clear' },
            { id: 'Algenib', gender: 'Unknown', style: 'Khàn' },
            { id: 'Rasalgethi', gender: 'Unknown', style: 'Cung cấp nhiều thông tin' },
            { id: 'Laomedeia', gender: 'Unknown', style: 'Rộn ràng' },
            { id: 'Achernar', gender: 'Unknown', style: 'Mềm' },
            { id: 'Alnilam', gender: 'Unknown', style: 'Firm' },
            { id: 'Schedar', gender: 'Unknown', style: 'Even' },
            { id: 'Gacrux', gender: 'Unknown', style: 'Người trưởng thành' },
            { id: 'Pulcherrima', gender: 'Unknown', style: 'Lạc quan' },
            { id: 'Achird', gender: 'Unknown', style: 'Thân thiện' },
            { id: 'Zubenelgenubi', gender: 'Unknown', style: 'Thông thường' },
            { id: 'Vindemiatrix', gender: 'Unknown', style: 'Êm dịu' },
            { id: 'Sadachbia', gender: 'Unknown', style: 'Lively' },
            { id: 'Sadaltager', gender: 'Unknown', style: 'Hiểu biết' },
            { id: 'Sulafat', gender: 'Unknown', style: 'Ấm' }
        ]
    },
    openai: {
        name: 'OpenAI',
        voices: [
            { id: 'alloy', gender: 'Neutral', style: 'Versatile, Balanced' },
            { id: 'echo', gender: 'Male', style: 'Warm, Soft' },
            { id: 'fable', gender: 'Male', style: 'British, Narrative' },
            { id: 'onyx', gender: 'Male', style: 'Deep, Serious' },
            { id: 'nova', gender: 'Female', style: 'Energetic, Friendly' },
            { id: 'shimmer', gender: 'Female', style: 'Clear, Resonant' }
        ]
    }
};

async function listElevenLabsVoices() {
    if (!process.env.ELEVENLABS_API_KEY) return [];
    try {
        const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
        });
        return response.data.voices.map(v => ({
            id: v.voice_id,
            name: v.name,
            category: v.category,
            labels: v.labels
        }));
    } catch (e) {
        console.error('Failed to fetch ElevenLabs voices:', e.message);
        return [];
    }
}

// Vbee voices are often static or require specific API, here is a common list or fetch attempt
// For now we list common high quality ones
const VBEE_COMMON_VOICES = [
    { id: 'hn_male_manh_dung_news_48k-h', name: 'Mạnh Dũng (HN)', style: 'News, Standard' },
    { id: 'hn_female_thao_trinh_news_48k-h', name: 'Thảo Trinh (HN)', style: 'News, Soft' },
    { id: 'sg_male_minh_hoang_news_48k-h', name: 'Minh Hoàng (SG)', style: 'News, Warm' },
    { id: 'sg_female_thao_vy_news_48k-h', name: 'Thảo Vy (SG)', style: 'News, Clear' }
];

async function main() {
    console.log('--- AVAILABLE VOICES ---\n');

    // 1. Gemini
    console.log(`[${PROVIDERS.gemini.name}]`);
    PROVIDERS.gemini.voices.forEach(v => {
        console.log(`  - ID: ${v.id.padEnd(10)} | ${v.gender} | ${v.style}`);
    });
    console.log('');

    // 2. OpenAI
    console.log(`[${PROVIDERS.openai.name}]`);
    PROVIDERS.openai.voices.forEach(v => {
        console.log(`  - ID: ${v.id.padEnd(10)} | ${v.gender} | ${v.style}`);
    });
    console.log('');

    // 3. Vbee
    console.log(`[Vbee (Vietnamese)]`);
    VBEE_COMMON_VOICES.forEach(v => {
        console.log(`  - ID: ${v.id.padEnd(30)} | ${v.name} | ${v.style}`);
    });
    console.log('');

    // 4. ElevenLabs
    if (process.env.ELEVENLABS_API_KEY) {
        console.log(`[ElevenLabs] (Fetching...)`);
        const voices = await listElevenLabsVoices();
        voices.slice(0, 10).forEach(v => { // Limit to 10 for brevity
            const desc = v.labels ? JSON.stringify(v.labels) : v.category;
            console.log(`  - ID: ${v.id.padEnd(25)} | Name: ${v.name.padEnd(15)} | ${desc}`);
        });
        if (voices.length > 10) console.log(`  ... and ${voices.length - 10} more.`);
    } else {
        console.log(`[ElevenLabs] Skipped (No API Key)`);
    }
}

main();
