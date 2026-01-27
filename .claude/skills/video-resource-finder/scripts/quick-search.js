#!/usr/bin/env node

/**
 * Quick Image Search - Tìm ảnh nhanh từ Pexels/Pixabay
 * 
 * Usage:
 *   node quick-search.js --query "woman walking dog on beach" --type image
 *   node quick-search.js --query "sunset ocean" --type video
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const minimist = require('minimist');
const PexelsClient = require('./api/pexels-client');
const PixabayClient = require('./api/pixabay-client');

const args = minimist(process.argv.slice(2), {
    string: ['query', 'type', 'source'],
    number: ['limit'],
    default: {
        type: 'image',  // image | video
        source: 'pexels', // pexels | pixabay
        limit: 5
    }
});

async function main() {
    console.log('\n🔍 QUICK RESOURCE SEARCH\n');

    if (!args.query) {
        console.error('❌ Error: --query is required\n');
        console.log('Usage:');
        console.log('  node quick-search.js --query "woman walking dog on beach"');
        console.log('\nOptions:');
        console.log('  --query      Search query (required)');
        console.log('  --type       Resource type: image | video (default: image)');
        console.log('  --source     API source: pexels | pixabay (default: pexels)');
        console.log('  --limit      Number of results (default: 5)');
        process.exit(1);
    }

    const query = args.query;
    const type = args.type.toLowerCase();
    const source = args.source.toLowerCase();
    const limit = args.limit;

    console.log(`📝 Query: "${query}"`);
    console.log(`🎯 Type: ${type}`);
    console.log(`🌐 Source: ${source}`);
    console.log(`📊 Limit: ${limit}\n`);

    try {
        let results = [];

        if (source === 'pexels') {
            if (!process.env.PEXELS_API_KEY) {
                throw new Error('Missing PEXELS_API_KEY in .env file');
            }
            const client = new PexelsClient(process.env.PEXELS_API_KEY);

            if (type === 'image') {
                results = await client.searchPhotos(query, limit);
            } else if (type === 'video') {
                results = await client.searchVideos(query, limit);
            }
        } else if (source === 'pixabay') {
            if (!process.env.PIXABAY_API_KEY) {
                throw new Error('Missing PIXABAY_API_KEY in .env file');
            }
            const client = new PixabayClient(process.env.PIXABAY_API_KEY);

            if (type === 'image') {
                results = await client.searchImages(query, limit);
            } else if (type === 'video') {
                results = await client.searchVideos(query, limit);
            }
        }

        if (results.length === 0) {
            console.log('❌ No results found. Try a different query.');
            process.exit(0);
        }

        console.log(`✅ Found ${results.length} results:\n`);

        results.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title || item.id}`);

            if (type === 'image') {
                console.log(`   📐 Size: ${item.width}x${item.height}`);
                console.log(`   🔗 URL: ${item.url}`);
                if (item.downloadUrls) {
                    console.log(`   📥 Download: ${item.downloadUrls.original || item.downloadUrls.large}`);
                }
            } else if (type === 'video') {
                console.log(`   📐 Size: ${item.width}x${item.height}`);
                console.log(`   ⏱️  Duration: ${item.duration}s`);
                console.log(`   🔗 URL: ${item.url}`);
                if (item.downloadUrls) {
                    const qualities = Object.keys(item.downloadUrls);
                    console.log(`   📥 Available: ${qualities.join(', ')}`);
                }
            }

            if (item.user || item.photographer) {
                console.log(`   👤 By: ${item.user?.name || item.photographer}`);
            }
            console.log('');
        });

        console.log('✨ Done!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.status, error.response.statusText);
        }
        process.exit(1);
    }
}

main();
