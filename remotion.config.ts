import { Config } from '@remotion/cli/config';
import * as os from 'os';

// ─── Dynamic System Detection ───────────────────────────────────────────────

const platform = os.platform(); // 'darwin' | 'linux' | 'win32'
const arch     = os.arch();     // 'arm64' | 'x64' | ...
const cpuCount = os.cpus().length;
const totalRam = os.totalmem();
const freeRam  = os.freemem();

const MB = 1024 * 1024;
const GB = 1024 * MB;

// ─── Concurrency ────────────────────────────────────────────────────────────
// macOS reclaims inactive pages automatically, so usable ≈ 60% of total RAM.
// Reserve 2GB for OS + encoder. Each Chromium tab needs ~700MB.
const usableRam    = Math.max(0, totalRam * 0.6 - 2 * GB);
const maxByRam     = Math.max(1, Math.floor(usableRam / (700 * MB)));
const concurrency  = Math.min(cpuCount, maxByRam, 8); // hard cap at 8

// ─── GL Renderer ────────────────────────────────────────────────────────────
// macOS / Windows: 'angle' (native GPU via ANGLE)
// Linux with display (GPU): 'angle'
// Linux headless (CI, no GPU): 'swiftshader'
const hasDisplay = !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
const glRenderer: 'angle' | 'swiftshader' | 'egl' | 'vulkan' | 'angle-egl' =
    platform === 'linux' && !hasDisplay ? 'swiftshader' : 'angle';

// ─── Hardware Acceleration ──────────────────────────────────────────────────
// 'if-possible' → fast but large file (bitrate-based, no CRF)
// 'disabled'    → slower but smaller file (CRF-based, ~3x smaller)
// Strategy: use hwAccel only if RAM is generous (>12GB total) to balance speed+size.
// On typical 8GB machines, CRF mode gives better size without much speed penalty
// because concurrency already does the heavy lifting.
const hwAccel: 'if-possible' | 'disable' | 'required' =
    totalRam > 12 * GB ? 'if-possible' : 'disable';

// ─── CRF (Constant Rate Factor) — only used when hwAccel is disabled ────────
// 18 = near-lossless (default), ~128MB for 3min video
// 23 = good quality, ~60-80MB for 3min video  ← recommended balance
// 28 = acceptable quality, ~30-40MB for 3min video
const crf = 23;

// ─── x264 Preset ────────────────────────────────────────────────────────────
// 'medium' = good balance speed/quality (default is 'slow' which is ~30% slower)
// 'fast'   = faster, minor quality loss (~15% faster than medium)
// Note: preset is ignored when hardware acceleration is active
const x264Preset: 'ultrafast'|'superfast'|'veryfast'|'faster'|'fast'|'medium'|'slow'|'slower'|'veryslow' = 'medium';

// ─── Log chosen settings ────────────────────────────────────────────────────
console.log(`\n🖥  System: ${platform}/${arch} | ${cpuCount} CPUs | ${Math.round(totalRam/GB)}GB RAM (${Math.round(freeRam/MB)}MB free)`);
const sizeMode = hwAccel === 'disable' ? `crf=${crf}` : 'bitrate=auto(hwAccel)';
console.log(`⚙️  Render: concurrency=${concurrency} | gl=${glRenderer} | hwAccel=${hwAccel} | x264=${x264Preset} | ${sizeMode}\n`);

// ─── Apply Config ────────────────────────────────────────────────────────────
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(80);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setDelayRenderTimeoutInMilliseconds(90000);
Config.setMaxTimelineTracks(500);

Config.setConcurrency(concurrency);
Config.setChromiumOpenGlRenderer(glRenderer);
Config.setHardwareAcceleration(hwAccel);
Config.setX264Preset(x264Preset);
if (hwAccel === 'disable') {
    Config.setCrf(crf);
}

// ─── Webpack config ──────────────────────────────────────────────────────────
Config.overrideWebpackConfig((currentConfiguration) => {
    return {
        ...currentConfiguration,
        module: {
            ...currentConfiguration.module,
            rules: [
                ...(currentConfiguration.module?.rules ?? []),
                {
                    test: /\.otio$/,
                    type: 'json',
                },
            ],
        },
    };
});
