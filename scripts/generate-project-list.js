const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '../public/projects');
const OUTPUT_FILE = path.join(__dirname, '../src/generated/projects.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, '../public/projects.json');

function getProjects() {
    if (!fs.existsSync(PROJECTS_DIR)) {
        console.warn('Projects directory not found:', PROJECTS_DIR);
        // Create if not exists to avoid errors
        fs.mkdirSync(PROJECTS_DIR, { recursive: true });
        return [];
    }

    const items = fs.readdirSync(PROJECTS_DIR);
    const projects = [];

    for (const item of items) {
        if (item.startsWith('.')) continue;

        const itemPath = path.join(PROJECTS_DIR, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            const files = fs.readdirSync(itemPath);
            const hasScript = files.includes('script.json');
            const otioFiles = files.filter(f => f.endsWith('.otio'));
            const hasOtio = otioFiles.length > 0;

            if (hasScript || hasOtio) {
                // Read aspect ratio from script.json if available
                let ratio = null;
                if (hasScript) {
                    try {
                        const scriptContent = JSON.parse(
                            fs.readFileSync(path.join(itemPath, 'script.json'), 'utf-8')
                        );
                        ratio = scriptContent.metadata?.ratio || null;
                    } catch (e) {
                        // Ignore parse errors
                    }
                }

                projects.push({
                    id: item,
                    name: item,
                    path: `projects/${item}`,
                    hasScript,
                    hasOtio,
                    otioFile: hasOtio ? otioFiles[0] : null,
                    ratio,
                    modifiedAt: stats.mtime.toISOString(),
                    timestamp: stats.mtime.getTime()
                });
            }
        }
    }

    // Sort by modification time (newest first)
    projects.sort((a, b) => b.timestamp - a.timestamp);

    return projects;
}

const projects = getProjects();
// Ensure src/generated exists
const generatedDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2));
fs.writeFileSync(PUBLIC_OUTPUT_FILE, JSON.stringify(projects, null, 2));

console.log(`Generated project list with ${projects.length} projects.`);
console.log(`Scanned projects from ${PROJECTS_DIR}`);
console.log(`Saved JSON to ${OUTPUT_FILE}`);
