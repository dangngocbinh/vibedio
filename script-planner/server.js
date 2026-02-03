import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from public/projects
const projectsDir = path.join(__dirname, '../public/projects');
app.use('/projects', express.static(projectsDir));
console.log(`📁 Static serving enabled for: ${projectsDir}`);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectSlug = req.body.projectSlug || 'default';
        const uploadDir = path.join(__dirname, '../public/projects', projectSlug, 'uploads');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        cb(null, `${basename}-${timestamp}${ext}`);
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// API Routes

/**
 * POST /api/upload
 * Upload a file (image or video) to the project's uploads folder
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        console.log('📂 Upload request received');

        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const projectSlug = req.body.projectSlug || 'default';
        console.log(`📂 Project slug: ${projectSlug}`);
        console.log(`📂 Original filename: ${req.file.originalname}`);

        const relativePath = `uploads/${req.file.filename}`;
        const fullPath = path.join(__dirname, '../public/projects', projectSlug, relativePath);
        console.log(`✅ File saved to: ${fullPath}`);
        console.log(`✅ Relative path returned: ${relativePath}`);

        res.json({
            success: true,
            filename: req.file.filename,
            path: relativePath,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/save-script
 * Save the script data to the project's script.json file
 */
app.post('/api/save-script', (req, res) => {
    try {
        console.log('📝 Save script request received');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body:', JSON.stringify(req.body).substring(0, 200));

        const { projectSlug, scriptData } = req.body;

        if (!projectSlug) {
            console.error('❌ Missing projectSlug');
            return res.status(400).json({ error: 'Project slug is required' });
        }

        if (!scriptData) {
            console.error('❌ Missing scriptData');
            return res.status(400).json({ error: 'Script data is required' });
        }

        const projectDir = path.join(__dirname, '../public/projects', projectSlug);
        const scriptPath = path.join(projectDir, 'script.json');

        // Create project directory if it doesn't exist
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // Create backup of existing script
        if (fs.existsSync(scriptPath)) {
            const backupPath = path.join(projectDir, `script.backup.${Date.now()}.json`);
            fs.copyFileSync(scriptPath, backupPath);

            // Keep only the last 5 backups
            const backups = fs.readdirSync(projectDir)
                .filter(f => f.startsWith('script.backup.'))
                .sort()
                .reverse();

            backups.slice(5).forEach(backup => {
                fs.unlinkSync(path.join(projectDir, backup));
            });
        }

        // Update the updatedAt timestamp
        const updatedScript = {
            ...scriptData,
            metadata: {
                ...scriptData.metadata,
                updatedAt: new Date().toISOString()
            }
        };

        // Write the script file
        fs.writeFileSync(scriptPath, JSON.stringify(updatedScript, null, 4));

        res.json({
            success: true,
            message: 'Script saved successfully',
            path: scriptPath
        });
    } catch (error) {
        console.error('Save script error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/clear-scene-resources
 * Clear all fetched resources for a specific scene from resources.json
 */
app.post('/api/clear-scene-resources', (req, res) => {
    try {
        console.log('🗑️  Clear scene resources request received');
        const { projectSlug, sceneId } = req.body;

        if (!projectSlug || !sceneId) {
            return res.status(400).json({ error: 'Project slug and scene ID are required' });
        }

        const projectDir = path.join(__dirname, '../public/projects', projectSlug);
        const resourcesPath = path.join(projectDir, 'resources.json');

        // Check if resources.json exists
        if (!fs.existsSync(resourcesPath)) {
            console.log('⚠️  resources.json not found, nothing to clear');
            return res.json({ success: true, message: 'No resources file found' });
        }

        // Read resources.json
        const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'));

        // Remove resources for this scene from all categories
        let removedCount = 0;
        const categories = ['videos', 'images', 'generatedImages', 'pinnedResources'];

        categories.forEach(category => {
            if (resourcesData.resources && resourcesData.resources[category]) {
                const originalLength = resourcesData.resources[category].length;
                resourcesData.resources[category] = resourcesData.resources[category].filter(
                    entry => entry.sceneId !== sceneId
                );
                removedCount += originalLength - resourcesData.resources[category].length;
            }
        });

        // Write back to resources.json
        fs.writeFileSync(resourcesPath, JSON.stringify(resourcesData, null, 2));

        console.log(`✅ Cleared ${removedCount} resource entries for scene: ${sceneId}`);
        res.json({
            success: true,
            message: `Cleared ${removedCount} resource entries`,
            sceneId,
            removedCount
        });
    } catch (error) {
        console.error('Clear scene resources error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/clear-music-downloads
 * Clear downloaded music files from downloads/music/ folder
 */
app.post('/api/clear-music-downloads', (req, res) => {
    try {
        console.log('🎵 Clear music downloads request received');
        const { projectSlug } = req.body;

        if (!projectSlug) {
            return res.status(400).json({ error: 'Project slug is required' });
        }

        const projectDir = path.join(__dirname, '../public/projects', projectSlug);
        const musicDownloadsDir = path.join(projectDir, 'downloads', 'music');

        // Check if music downloads directory exists
        if (!fs.existsSync(musicDownloadsDir)) {
            console.log('⚠️  Music downloads directory not found, nothing to clear');
            return res.json({ success: true, message: 'No music downloads found' });
        }

        // Remove all files in the music downloads directory
        const files = fs.readdirSync(musicDownloadsDir);
        let removedCount = 0;

        files.forEach(file => {
            const filePath = path.join(musicDownloadsDir, file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                removedCount++;
            }
        });

        // Remove the directory if empty
        if (fs.readdirSync(musicDownloadsDir).length === 0) {
            fs.rmdirSync(musicDownloadsDir);
        }

        console.log(`✅ Cleared ${removedCount} music files`);
        res.json({
            success: true,
            message: `Cleared ${removedCount} music files`,
            removedCount
        });
    } catch (error) {
        console.error('Clear music downloads error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Script Planner API Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving projects from: ${path.join(__dirname, '../public/projects')}`);
});
