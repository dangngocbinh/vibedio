const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class PixabayScraper {
    constructor() {
        this.baseUrl = 'https://pixabay.com/music/search/';
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--autoplay-policy=no-user-gesture-required',
                ]
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Search for music on Pixabay (Audio Element Polling Method)
     * @param {string} query - Search query
     * @param {number} limit - Number of results
     * @returns {Promise<Array>} Music objects with download URLs
     */
    async searchMusic(query, limit = 3) {
        let page = null;
        try {
            if (!this.browser) await this.init();

            console.log(`[PixabayScraper] 🔍 Scraping "${query}" (Audio Polling Mode)...`);
            page = await this.browser.newPage();

            await page.setViewport({ width: 1920, height: 1080 });

            const encodedQuery = encodeURIComponent(query);
            const searchUrl = `${this.baseUrl}${encodedQuery}/`;

            await page.goto(searchUrl, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Wait for track rows
            try {
                await page.waitForSelector('div[class*="audioRow"]', { timeout: 10000 });
            } catch (e) {
                console.log(`[PixabayScraper] ⚠️ No tracks found`);
                return [];
            }

            const trackRows = await page.$$('div[class*="audioRow"]');
            const processLimit = Math.min(trackRows.length, limit);

            console.log(`[PixabayScraper] Found ${trackRows.length} tracks, processing ${processLimit}...`);

            const results = [];

            // Enable request interception if not already enabled? 
            // Better to listener on the page for responses.

            for (let i = 0; i < processLimit; i++) {
                const row = trackRows[i];

                // Extract metadata
                const title = await row.$eval('a[class*="title"]', el => el.innerText.trim())
                    .catch(() => `Track ${i + 1}`);

                const durationText = await row.$eval('div[class*="duration"], span[class*="duration"]', el => el.innerText.trim())
                    .catch(() => '0:00');

                console.log(`[PixabayScraper]   [${i + 1}/${processLimit}] "${title}"...`);

                // Find play button
                const playBtn = await row.$('button[class*="playOverlay"], button[class*="play"]');

                if (playBtn) {
                    try {
                        // Setup response listener for MP3
                        const mp3Promise = new Promise((resolve) => {
                            const handler = (response) => {
                                const url = response.url();
                                if (url.includes('.mp3') && !url.includes('google') && response.request().method() === 'GET') {
                                    page.off('response', handler); // Remove listener
                                    resolve(url);
                                }
                            };

                            // Timeout fallback
                            setTimeout(() => {
                                page.off('response', handler);
                                resolve(null);
                            }, 5000);

                            page.on('response', handler);
                        });

                        // Click play
                        await playBtn.click();

                        // Wait for MP3 URL
                        const mp3Url = await mp3Promise;

                        if (mp3Url) {
                            console.log(`[PixabayScraper]     ✅ Network Captured: ...${mp3Url.slice(-40)}`);
                            results.push({
                                title,
                                durationText,
                                url: mp3Url
                            });

                            // Stop playback (click again)
                            await playBtn.click().catch(() => { });
                        } else {
                            console.log(`[PixabayScraper]     ⚠️ Timeout - no MP3 request detected`);
                        }

                    } catch (err) {
                        console.log(`[PixabayScraper]     ❌ Error: ${err.message}`);
                    }
                }

                // Delay between tracks
                await new Promise(r => setTimeout(r, 1000));
            }

            if (results.length === 0) {
                console.log(`[PixabayScraper] ❌ No MP3 URLs captured`);
                return [];
            }

            console.log(`[PixabayScraper] ✅ Successfully scraped ${results.length} tracks!`);

            return results.map((track, index) => ({
                id: `pixabay-scraped-${index}-${Date.now()}`,
                title: track.title,
                url: 'https://pixabay.com/music/',
                downloadUrl: track.url,
                duration: parseDuration(track.durationText),
                genre: query,
                tags: [query, 'scraped'],
                license: 'Pixabay Content License (Free to use)',
                source: 'pixabay-scraper'
            }));

        } catch (error) {
            console.error(`[PixabayScraper] Fatal error:`, error.message);
            return [];
        } finally {
            if (page) await page.close();
        }
    }
}

function parseDuration(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

module.exports = PixabayScraper;
