# SETUP NEW MACHINE - Video Automation Project

## 📋 MANUAL SETUP

### 1️⃣ Prerequisites

**Install Python 3.x** (>= 3.8)
```bash
# macOS (via Homebrew)
brew install python3

# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# Windows
# Download from python.org (IMPORTANT: Check "Add to PATH")
```

**Install Node.js** (>= 18.x)
```bash
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Windows
# Download from nodejs.org
```

**Install FFmpeg**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from ffmpeg.org and add to PATH
```

---

### 2️⃣ Clone/Copy Project

```bash
# Option A: Git clone
git clone <repo-url>
cd automation-video

# Option B: Copy files
# Copy entire project folder to new machine
```

---

### 3️⃣ Install Dependencies

**Python dependencies** (cho từng skill)
```bash
# video-editor
cd .claude/skills/video-editor
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
pip3 install -r requirements.txt

# video-script-generator
cd ../video-script-generator
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt

# Repeat for other skills...
```

**Node dependencies** (Remotion)
```bash
cd /path/to/automation-video
npm install
```

---

### 4️⃣ Configure Environment Variables

**Create `.env` file** in project root:
```bash
# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Voice APIs (optional)
ELEVENLABS_API_KEY=your_elevenlabs_key
VBEE_API_KEY=your_vbee_key

# Stock Resources (optional)
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key
```

---

### 5️⃣ Verify Setup

**Test Python**
```bash
python3 --version
# Should show Python 3.8 or higher
```

**Test Node**
```bash
node --version
npm --version
```

**Test FFmpeg**
```bash
ffmpeg -version
```

**Test Python skills**
```bash
# Test video-editor
./.claude/skills/video-editor/cli.py --help

# Test video-production-director
./.claude/skills/video-production-director/director.py --help
```

**Test Remotion**
```bash
npm run dev
# Should start dev server at http://localhost:3000
```

---

### 6️⃣ Platform-Specific Notes

#### **Windows** ⚠️

**Issues and fixes:**

1. **Shebang không hoạt động**
   ```bash
   # Thay vì:
   ./script.py

   # Dùng:
   python3 script.py
   ```

2. **Path separators**
   ```bash
   # Python scripts đã handle cross-platform paths
   # Nhưng trong shell commands, dùng:
   python3 .\.claude\skills\video-editor\cli.py  # Windows
   python3 ./.claude/skills/video-editor/cli.py  # macOS/Linux
   ```

3. **Virtual environment activation**
   ```bash
   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

4. **Line endings**
   ```bash
   # Nếu clone từ Git, config:
   git config --global core.autocrlf true
   ```

#### **Linux** ✅

**No issues** - Everything works out of the box

#### **macOS** ✅

**Potential issues:**

1. **Python 2 vs 3**
   ```bash
   # Always use python3, NOT python
   python3 --version
   ```

2. **File permissions**
   ```bash
   # After clone/copy, make scripts executable:
   chmod +x .claude/skills/*/cli.py
   chmod +x .claude/skills/*/director.py
   chmod +x .claude/skills/python-runner.sh
   ```

---

## 🚀 PERFORMANCE EXPECTATIONS

| Operation | Time (SSD) | Time (HDD) |
|-----------|-----------|-----------|
| Script generation | 2-5s | 2-5s |
| Voice generation | 3-10s | 3-10s |
| Resource finding | 10-30s | 10-30s |
| OTIO timeline creation | 1-2s | 2-5s |
| Remotion rendering (30s video) | 30-60s | 60-120s |
| Remotion rendering (60s video) | 60-120s | 120-240s |

**Bottlenecks:**
- ⚡ **Network**: AI API calls, stock downloads
- 💻 **CPU**: Remotion rendering (multi-threaded)
- 💾 **Disk**: Video file I/O (prefer SSD)

---

## ⚠️ COMMON ISSUES

### Issue 1: `python: command not found`
**Solution:**
```bash
# Use python3 instead
python3 --version
```

### Issue 2: `ModuleNotFoundError: No module named 'opentimelineio'`
**Solution:**
```bash
# Install dependencies
cd .claude/skills/video-editor
pip3 install -r requirements.txt
```

### Issue 3: `Permission denied` when running scripts
**Solution:**
```bash
# Make executable
chmod +x .claude/skills/video-editor/cli.py

# Or use python3 explicitly
python3 .claude/skills/video-editor/cli.py
```

### Issue 4: Remotion fails to render
**Solution:**
```bash
# Check Node version (>= 18)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: FFmpeg errors
**Solution:**
```bash
# Install FFmpeg
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

---

## 🎯 QUICK START (TL;DR)

**For experienced developers:**
```bash
# 1. Prerequisites
brew install python3 node ffmpeg  # macOS
# OR
sudo apt install python3 python3-pip nodejs npm ffmpeg  # Linux

# 2. Clone
git clone <repo-url> && cd automation-video

# 3. Install Python deps
cd .claude/skills/video-editor && python3 -m venv venv && source venv/bin/activate && pip3 install -r requirements.txt && cd ../../..

# 4. Install Node deps
npm install

# 5. Configure .env
cp -n .env.example .env
# Edit .env with your API keys

# 6. Test
npm run dev
```

---

## 📞 SUPPORT

**Nếu gặp issues:**
1. Check Python version: `python3 --version`
2. Check dependencies: `pip3 list`
3. Check logs in console
4. Report issue với full error message

**Platform compatibility:**
- ✅ macOS (native)
- ✅ Linux (native)
- ⚠️ Windows (cần adjustments)

---

**Last Updated**: 2026-01-31
