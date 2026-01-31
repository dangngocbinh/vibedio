---
name: environment-setup
description: Tự động setup môi trường, cài đặt dependencies, kiểm tra prerequisites. Dùng khi user nói về setup lần đầu, cài đặt thư viện, chuẩn bị môi trường.
---

# ENVIRONMENT SETUP SKILL

## 🎯 MỤC ĐÍCH

Skill này tự động:
- ✅ Kiểm tra prerequisites (Python, Node, FFmpeg, etc.)
- ✅ Cài đặt system packages (ffmpeg, python3, nodejs)
- ✅ Setup Python virtual environments cho từng skill
- ✅ Cài đặt Python dependencies (pip install)
- ✅ Cài đặt Node.js dependencies (npm install)
- ✅ Configure environment variables (.env)
- ✅ Verify installation

## 🔍 TRIGGER KEYWORDS (CHO DIRECTOR)

**Director nên gọi skill này khi user nói:**
- "setup môi trường"
- "cài đặt lần đầu"
- "chuẩn bị thư viện"
- "install dependencies"
- "setup project"
- "first time setup"
- "cài ffmpeg"
- "cài python packages"
- "setup venv"
- "kiểm tra môi trường"
- "check prerequisites"

## 🛠️ USAGE

### Basic Setup (All-in-one)

```bash
python3 .claude/skills/environment-setup/setup.py --all
```

### Specific Tasks

**Check prerequisites**
```bash
python3 .claude/skills/environment-setup/setup.py check
```

**Install system packages** (ffmpeg, python3, nodejs)
```bash
python3 .claude/skills/environment-setup/setup.py install-system
```

**Setup Python virtual environments**
```bash
python3 .claude/skills/environment-setup/setup.py setup-venv
```

**Install Python dependencies**
```bash
python3 .claude/skills/environment-setup/setup.py install-python
```

**Install Node.js dependencies**
```bash
python3 .claude/skills/environment-setup/setup.py install-node
```

**Configure .env file**
```bash
python3 .claude/skills/environment-setup/setup.py configure-env
```

**Verify installation**
```bash
python3 .claude/skills/environment-setup/setup.py verify
```

## 📋 COMMANDS REFERENCE

| Command | Description | Platforms |
|---------|-------------|-----------|
| `check` | Check prerequisites (Python, Node, FFmpeg) | All |
| `install-system` | Install system packages via package manager | macOS, Linux |
| `setup-venv` | Create Python venvs for all skills | All |
| `install-python` | Install Python dependencies (pip) | All |
| `install-node` | Install Node.js dependencies (npm) | All |
| `configure-env` | Create .env file with prompts | All |
| `verify` | Verify all installations | All |
| `--all` | Run all steps in order | All |

## 🔄 WORKFLOW

```
User: "Tôi muốn setup project lần đầu"
  ↓
Director detects keywords: "setup", "lần đầu"
  ↓
Director delegates to environment-setup skill
  ↓
Skill runs: check → install-system → setup-venv → install-python → install-node → configure-env → verify
  ↓
Report results to user
```

## 🖥️ PLATFORM SUPPORT

### macOS
- ✅ Auto-install via Homebrew
- ✅ Detect if Homebrew missing → prompt install
- ✅ Commands: `brew install python3 node ffmpeg`

### Linux (Ubuntu/Debian)
- ✅ Auto-install via apt
- ✅ Commands: `sudo apt install python3 python3-pip nodejs npm ffmpeg`

### Windows
- ⚠️ Manual instructions (no auto-install)
- ✅ Check if installed
- ✅ Provide download links

## 📊 OUTPUT EXAMPLE

```
🔍 Checking prerequisites...

✅ Python 3.13.0 - Installed
✅ Node.js 18.17.0 - Installed
❌ FFmpeg - Not found

📦 Installing missing packages...

[macOS] Running: brew install ffmpeg
✅ FFmpeg installed successfully

🐍 Setting up Python virtual environments...

✅ video-editor venv created
✅ video-script-generator venv created
✅ otio-quick-editor venv created

📦 Installing Python dependencies...

✅ video-editor: 12 packages installed
✅ video-script-generator: 8 packages installed
✅ otio-quick-editor: 5 packages installed

📦 Installing Node.js dependencies...

✅ npm install completed (234 packages)

⚙️ Configuring environment...

? Enter GEMINI_API_KEY: **********************
? Enter OPENAI_API_KEY: **********************

✅ .env file created

✅ All done! Environment ready.
```

## 🎯 FOR AI AGENT (DIRECTOR)

**Detection logic:**

```python
user_input = "Tôi muốn cài đặt project lần đầu"

keywords = ["setup", "cài đặt", "install", "dependencies", "môi trường", "environment", "first time", "lần đầu", "thư viện", "ffmpeg", "python packages"]

if any(keyword in user_input.lower() for keyword in keywords):
    # Delegate to environment-setup skill
    result = run_skill("environment-setup", "--all")
    return result
```

**Example conversations:**

```
User: "Setup project cho tôi"
Director: [Calls environment-setup skill with --all]
Director: "Đã setup xong! Python venvs, dependencies, và Node packages đã sẵn sàng."

User: "Cài ffmpeg cho tôi"
Director: [Calls environment-setup skill with install-system]
Director: "Đã cài FFmpeg qua Homebrew."

User: "Kiểm tra môi trường"
Director: [Calls environment-setup skill with check]
Director: "Python ✅, Node ✅, FFmpeg ✅. Môi trường đã sẵn sàng!"
```

## 🔧 TECHNICAL DETAILS

**Python dependencies detection:**
- Reads `requirements.txt` from each skill folder
- Creates venv if not exists
- Activates venv and runs `pip install -r requirements.txt`

**Node dependencies:**
- Runs `npm install` in project root
- Checks for `package.json`

**System packages:**
- macOS: Uses `brew` (checks if installed first)
- Linux: Uses `apt` (requires sudo)
- Windows: Provides download links

**Environment variables:**
- Interactive prompts for API keys
- Creates `.env` file in project root
- Never stores sensitive data in code

## ⚠️ SAFETY

- ✅ Never runs `sudo` without asking user
- ✅ Tự động skip không ghi đè .env nếu đã tồn tại để bảo vệ cấu hình của user
- ✅ Validates Python/Node versions before install
- ✅ Dry-run mode available (`--dry-run`)

## 📝 NOTES

1. **Homebrew required on macOS** - If not installed, skill will prompt
2. **sudo required on Linux** - For apt-get install
3. **Windows users** - Manual installation with provided links
4. **Virtual environments** - Isolated per skill (best practice)
5. **API keys** - Required for AI features (Gemini, OpenAI, etc.)

---

**Created**: 2026-01-31
**Last Updated**: 2026-01-31
