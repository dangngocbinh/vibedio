const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();
const GeminiClient = require('./api/gemini-client');

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in env');
        process.exit(1);
    }

    const client = new GeminiClient(apiKey);

    // CLI Args: node generate-single-image.js <prompt> <ref_image_path> <output_path>
    const args = process.argv.slice(2);
    const prompt = args[0] || "A character in action pose";
    const refImage = args[1];
    const outputPath = args[2] || "output.png";

    if (!refImage) {
        console.error("Please provide reference image path");
        process.exit(1);
    }

    console.log(`Generating image with:`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Reference: ${refImage}`);
    console.log(`Output: ${outputPath}`);

    try {
        const result = await client.generateImage(prompt, {
            aspectRatio: '9:16',
            outputDir: path.dirname(outputPath),
            filename: path.basename(outputPath),
            referenceImage: refImage
        });

        if (result.success) {
            console.log(`✅ Success! Image saved to ${path.join(path.dirname(outputPath), path.basename(outputPath))}`);
        } else {
            console.error(`❌ Failed.`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
