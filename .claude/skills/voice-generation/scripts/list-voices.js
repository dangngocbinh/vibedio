const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PROVIDERS = {
    gemini: {
        name: 'Google Gemini (Generative)',
        voices: [
            { id: 'Puck', gender: 'Male', style: 'Energetic, Mischievous' },
            { id: 'Charon', gender: 'Male', style: 'Deep, Authoritative' },
            { id: 'Kore', gender: 'Female', style: 'Calm, Soothing' },
            { id: 'Fenrir', gender: 'Male', style: 'Wild, Intense' },
            { id: 'Aoede', gender: 'Female', style: 'Musical, Expressive' }
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
