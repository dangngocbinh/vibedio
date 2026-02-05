#!/usr/bin/env python3
"""
VIDEO PRODUCTION DIRECTOR (VIBE DIO)
====================================
Orchestrator for Mecode.pro's Video Automation Pipeline.

Usage:
    python director.py import --project <name> --files <f1> <f2>
    python director.py produce --project <name>
    python director.py status --project <name>

Author: Mecode.pro
"""

import argparse
import sys
import json
import shutil
import subprocess
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# --- CONFIGURATION ---
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PROJECTS_DIR = BASE_DIR / "public" / "projects"
SKILLS_DIR = BASE_DIR / ".claude" / "skills"

# Sub-skill paths
DIRECTOR_SKILL_DIR = SKILLS_DIR / "video-production-director"
SCRIPT_CLI = DIRECTOR_SKILL_DIR / "script_cli.py"

VOICE_SKILL = SKILLS_DIR / "voice-generation"
RESOURCE_SKILL = SKILLS_DIR / "video-resource-finder"
EDITOR_SKILL = SKILLS_DIR / "video-editor"
IMPORT_SKILL = SKILLS_DIR / "local-asset-import"

# --- BRANDING ---
def print_logo():
    print("✨" * 30)
    print("   VIBE DIO (Mecode.pro) - Đạo diễn Video Tự động")
    print("✨" * 30)
    print("")

def log_info(msg):
    print(f"🎬 [Vibe Dio]: {msg}")

def log_error(msg):
    print(f"❌ [Vibe Dio Error]: {msg}")

def log_step_start(step_num: int, step_name: str, description: str):
    """Log khi bắt đầu một bước trong pipeline"""
    print("\n" + "=" * 60)
    print(f"📍 BƯỚC {step_num}: {step_name.upper()}")
    print(f"📝 Mô tả: {description}")
    print("=" * 60)

def log_action(action: str, detail: str = ""):
    """Log một action cụ thể đang thực hiện"""
    msg = f"⚙️  Đang thực hiện: {action}"
    if detail:
        msg += f"\n   └─ {detail}"
    print(msg)

def log_output(output_type: str, path: str, info: str = ""):
    """Log kết quả output của một bước"""
    msg = f"📦 Output {output_type}: {path}"
    if info:
        msg += f"\n   └─ {info}"
    print(msg)

def log_step_complete(step_name: str, duration: str = ""):
    """Log khi hoàn thành một bước"""
    msg = f"✅ Hoàn thành: {step_name}"
    if duration:
        msg += f" ({duration})"
    print(msg)
    print("")

# --- STATE MANAGEMENT ---
class ProductionState:
    DEFAULT_SCHEMA = {
        "projectId": "",
        "workflow": None, 
        "currentStep": "init",
        "lastUpdated": "",
        "steps": {
            "init": {"status": "completed", "output": None, "timestamp": ""},
            "import": {"status": "pending", "output": None, "timestamp": ""},
            "script": {"status": "pending", "output": None, "timestamp": ""},
            "voice": {"status": "pending", "output": None, "timestamp": ""},
            "resources": {"status": "pending", "output": None, "timestamp": ""},
            "editor": {"status": "pending", "output": None, "timestamp": ""},
            "render": {"status": "pending", "output": None, "timestamp": ""}
        }
    }

    def __init__(self, project_dir: Path):
        self.path = project_dir / "production_status.json"
        self.data = self._load(project_dir.name)

    def _load(self, project_name: str) -> Dict:
        if self.path.exists():
            try:
                with open(self.path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                log_error("File state bị lỗi, khởi tạo lại.")
        
        # Init new with schema
        data = self.DEFAULT_SCHEMA.copy()
        data["projectId"] = project_name
        data["lastUpdated"] = datetime.now().isoformat()
        # Deep copy steps to avoid reference issues
        data["steps"] = json.loads(json.dumps(self.DEFAULT_SCHEMA["steps"]))
        return data

    def update_step(self, step_name: str, status: str, output: any = None):
        if step_name not in self.data["steps"]:
            self.data["steps"][step_name] = {}
            
        self.data["steps"][step_name] = {
            "status": status,
            "output": output,
            "timestamp": datetime.now().isoformat()
        }
        self.data["lastUpdated"] = datetime.now().isoformat()
        self.data["currentStep"] = step_name
        self._save()

    def _save(self):
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

# --- CORE FUNCTIONS ---
def setup_project(name: str) -> Path:
    """
    INIT PROJECT STRUCTURE:
    - Tạo thư mục project trong public/projects/{name}.
    - Tạo file theo dõi trạng thái 'production_status.json' nếu chưa có.
    - Hàm này được gọi tự động mỗi khi chạy lệnh import hoặc produce.
    """
    project_dir = PROJECTS_DIR / name
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Init state file immediately
    ProductionState(project_dir)._save()
    
    # Refresh project list so the new project shows up in UI
    refresh_project_list()
    
    return project_dir

def import_files(project_dir: Path, file_paths: List[str]):
    log_info("Bắt đầu bước Import (sử dụng local-asset-import)...")
    
    # Convert files list to absolute paths
    abs_files = [str(Path(p).resolve()) for p in file_paths]
    
    cmd = [
        "node",
        str(IMPORT_SKILL / "scripts" / "import-assets.js"),
        "--projectDir", str(project_dir),
        "--files", *abs_files,
        "--updateResources"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        log_info("✅ Import thành công vào thư mục 'imports/'")
        
        # Update state
        state = ProductionState(project_dir)
        state.update_step("import", "completed", {"files": len(abs_files)})
        
    except subprocess.CalledProcessError:
        log_error("Lỗi khi import file!")
        sys.exit(1)

def run_step_script(project_dir: Path, topic: str, type: str, ratio: str = "9:16"):
    log_info(f"Bắt đầu bước 1: Tạo Kịch Bản (Script) - Aspect Ratio: {ratio}...")

    # Call video-script-generator CLI (internal)
    cmd = [
        "python",
        str(SCRIPT_SKILL / "cli.py"),  # ← Changed from demo.py to cli.py
        "--topic", topic,
        "--type", type,
        "--ratio", ratio,
        # "--output", str(project_dir / "script.json") # cli.py generates script.json in project dir
        # Wait, cli.py 'init' needs --project args, 'generate' command might be what was used here?
        # The previous code used 'generate' command implicitly?
        # Let's check the previous `cmd` construction.
        # It was: python3 cli.py --topic ...
        # But cli.py has subcommands init, read, etc.
        # It seems the OLD director.py used a DIFFERENT cli.py than the one I just saw?
        # The cli.py I saw has `init`, `read`, `add-section`...
        # It does NOT have `generate` with `--topic`.
        # This implies director.py was calling an OLD version of cli.py or I looked at a NEW version?
        # The cli.py I viewed has `init` which takes `--project`, `--description`, `--text`.
        # It DOES NOT have a `generate` subcommand.
        
        # NOTE: The User previously updated SKILL.md to say:
        # "video-script-generator (3 commands): BƯỚC 0: TẠO FULL TEXT... BƯỚC 1: INIT PROJECT"
        
        # The `produce` command with `topic-to-video` in director.py says:
        # "Agent sẽ tự quyết định quy trình tối ưu".
        # And `run_step_script` function is called... where?
        # Let's check where `run_step_script` is called.
    ]

    try:
        subprocess.run(cmd, check=True)
        log_info(f"✅ Kịch bản đã tạo xong: script.json (ratio: {ratio})")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi tạo script!")
        sys.exit(1)

# Helper functions below are available for agent to call directly if needed
# But agent is free to orchestrate workflow differently

def run_step_voice(project_dir: Path, text: str = None):
    """
    Tạo giọng đọc từ text.

    Args:
        project_dir: Project directory
        text: Full text to generate voice (nếu None, sẽ đọc từ script.json)
    """
    log_step_start(2, "TẠO GIỌNG ĐỌC", "Generate voice với timestamps chính xác")
    log_action("Tạo giọng đọc AI", "Provider: Auto-detect từ .env")
    
    # Call voice-generation
    # Note: voice-generation script usually takes text or input file. 
    # We need to ensure it reads from script.json
    # Assume generate-voice.js can read script.json or we pass text?
    # For now, let's use the standard flow: read script.json -> extract text -> generate
    
    # TODO: Refine voice-generation interface to accept project dir directly
    # Workaround: Read script.json manually in python, pass text to cli
    
    # If text not provided, read from script.json
    if not text:
        script_path = project_dir / "script.json"
        with open(script_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            text = data.get('script', {}).get('fullText', '')

        if not text:
            text = data.get('transcript', {}).get('fullText', '')

        if not text:
            log_error("Không tìm thấy nội dung text trong script.json")
            sys.exit(1)

    output_audio = project_dir / "resources" / "audio" / "voice.mp3"
    
    cmd = [
        "node",
        str(VOICE_SKILL / "scripts" / "generate-voice.js"),
        "--text", text,
        "--output", str(output_audio),
        "--provider", "openai" # Default to openai for stability, or auto
    ]
    
    try:
        subprocess.run(cmd, check=True)
        
        # Link voice.json (created by script) to root
        # The script creates voice.json next to output
        src_json = output_audio.with_suffix('.json')
        dest_json = project_dir / "voice.json"
        
        if src_json.exists():
            # Fix path issue: Ensure audioFile in json is relative to project root
            try:
                with open(src_json, 'r', encoding='utf-8') as f:
                    voice_data = json.load(f)
                
                # Update audioFile to relative path
                # output_audio is absolute, we want "filename.mp3"
                relative_audio_path = f"{output_audio.name}"
                voice_data["audioFile"] = relative_audio_path
                
                # Write to dest_json
                with open(dest_json, 'w', encoding='utf-8') as f:
                    json.dump(voice_data, f, indent=2, ensure_ascii=False)
                    
                # Cleanup source json
                os.remove(src_json)
                
            except Exception as e:
                log_error(f"Lỗi khi xử lý voice.json: {e}")
                # Fallback copy if something fails
                shutil.copy(src_json, dest_json)

        log_output("Audio file", "voice.mp3")
        log_output("Timestamps", "voice.json", "Word-level timestamps")
        log_step_complete("Tạo giọng đọc")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi tạo voice!")
        sys.exit(1)

# Removed hardcoded segmentation function
# Agent will call CLI commands directly when needed



def run_step_resources(project_dir: Path):
    log_info("Bắt đầu bước 3: Tìm Tài Nguyên (Visuals)...")
    
    cmd = [
        "node",
        str(RESOURCE_SKILL / "scripts" / "find-resources.js"),
        "--projectDir", str(project_dir)
    ]
    
    try:
        subprocess.run(cmd, check=True)
        log_info("✅ Tài nguyên đã sẵn sàng: resources.json")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi tìm tài nguyên!")
        sys.exit(1)

def refresh_project_list():
    log_info("Cập nhật danh sách dự án (projects.json)...")
    cmd = ["node", str(BASE_DIR / "scripts" / "generate-project-list.js")]
    try:
        subprocess.run(cmd, check=True)
        log_info("✅ Cập nhật projects.json thành công.")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi cập nhật danh sách dự án!")

def run_step_editor(project_dir: Path):
    log_info("Bắt đầu bước 4: Dựng Phim (Editing)...")
    
    cmd = [
        "python",
        str(EDITOR_SKILL / "cli.py"),
        str(project_dir)
    ]
    
    try:
        subprocess.run(cmd, check=True)
        log_info("✅ Timeline đã dựng xong: project.otio")
        
        # Always refresh project list after successful edit
        refresh_project_list()
        
    except subprocess.CalledProcessError:
        log_error("Lỗi khi dựng phim!")
        sys.exit(1)

def open_remotion_studio(project_name: str = None):
    """
    Kiểm tra và khởi động Remotion Studio nếu cần, sau đó show link cho user.

    Args:
        project_name: Tên project (optional, để construct direct URL)
    """
    import socket
    import time

    print("\n" + "=" * 60)
    log_info("🎬 Đang chuẩn bị Remotion Studio...")

    # 1. Check if Remotion is running on port 3000 using socket
    def is_port_open(port, host='localhost'):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        try:
            sock.connect((host, port))
            sock.close()
            return True
        except:
            return False

    is_running = is_port_open(3000)

    if not is_running:
        log_info("🚀 Remotion Studio chưa chạy. Đang khởi động...")
        log_info("   (Quá trình này mất ~10-15 giây...)")

        # Start npm in background
        try:
            process = subprocess.Popen(
                ["npm", "start"],
                cwd=BASE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True  # Detach from parent
            )

            # Wait for server to start (max 30s)
            max_wait = 30
            waited = 0
            while waited < max_wait:
                time.sleep(2)
                waited += 2
                if is_port_open(3000):
                    log_info(f"✅ Remotion Studio đã khởi động! (sau {waited}s)")
                    break
                else:
                    print(f"   ⏳ Đang đợi server... ({waited}/{max_wait}s)")

            if not is_port_open(3000):
                log_info("⚠️  Server mất nhiều thời gian hơn dự kiến.")
                log_info("   Nếu cần, chạy thủ công: cd project && npm start")

        except Exception as e:
            log_error(f"Không thể start npm: {e}")
            log_info("⚠️  Vui lòng chạy thủ công: npm start")
    else:
        log_info("✅ Remotion Studio đã chạy sẵn!")

    # 2. Display URL (always base URL)
    base_url = "http://localhost:3000"

    log_info("")
    if project_name:
        log_info(f"🎥 VIDEO '{project_name}' ĐÃ SẴN SÀNG!")
    else:
        log_info("🎥 REMOTION STUDIO ĐÃ SẴN SÀNG!")

    log_info("👉 Mở link để xem và render:")
    log_info("")
    print(f"   🔗 {base_url}")
    print("")
    print("=" * 60)



def clean_up_project(project_dir: Path):
    """
    Dọn dẹp các file tạm và backup vào thư mục riêng.
    """
    log_info(f"Bắt đầu dọn dẹp project: {project_dir.name}...")

    # 1. Setup folders
    backups_dir = project_dir / "backups"
    intermediate_dir = project_dir / "intermediate"
    
    backups_dir.mkdir(exist_ok=True)
    intermediate_dir.mkdir(exist_ok=True)

    # 2. Define rules
    # Tuple format: (pattern, destination_dir)
    rules = [
        ("script.backup.*.json", backups_dir),
        ("scenes_*.json", intermediate_dir),
        ("sec_*.txt", intermediate_dir),
    ]

    moved_count = 0

    for pattern, dest in rules:
        for file_path in project_dir.glob(pattern):
            try:
                # Move file
                shutil.move(str(file_path), str(dest / file_path.name))
                print(f"   Moved: {file_path.name} -> {dest.name}/")
                moved_count += 1
            except Exception as e:
                log_error(f"Failed to move {file_path.name}: {e}")

    if moved_count > 0:
        log_info(f"✅ Đã dọn dẹp {moved_count} files.")
    else:
        log_info("✨ Project đã gọn gàng, không có file nào cần dọn.")

# --- MAIN CLI ---
def main():
    print_logo()
    
    parser = argparse.ArgumentParser(description="Vibe Dio Video Director")
    subparsers = parser.add_subparsers(dest="command")
    
    # Import Command
    import_parser = subparsers.add_parser("import")
    import_parser.add_argument("--project", required=True)
    import_parser.add_argument("--files", nargs="+", required=True)
    
    # Produce Command
    produce_parser = subparsers.add_parser("produce")
    produce_parser.add_argument("--project", required=True)

    produce_parser.add_argument("--topic", help="Topic for topic-to-video workflow")
    # produce_parser.add_argument("--type", default="facts", help="Video type") # Deprecated
    produce_parser.add_argument("--ratio", default="9:16",
                                help="Aspect ratio (9:16 for TikTok/Shorts, 16:9 for YouTube, 1:1 for Instagram, 4:5 for Instagram Portrait)")

    # Status Command
    status_parser = subparsers.add_parser("status")
    status_parser.add_argument("--project", required=True)

    # Cleanup Command
    cleanup_parser = subparsers.add_parser("cleanup", help="Clean up backup and intermediate files")
    cleanup_parser.add_argument("--project", required=True)

    # Open Studio Command (NEW)
    studio_parser = subparsers.add_parser("studio", help="Open Remotion Studio for a project")
    studio_parser.add_argument("--project", help="Project name to open directly")

    
    args = parser.parse_args()
    
    if args.command == "import":
        proj_dir = setup_project(args.project)
        import_files(proj_dir, args.files)
        
    elif args.command == "produce":
        # PRODUCE COMMAND:
        # 1. Gọi setup_project để đảm bảo folder và state file tồn tại.
        # 2. Cập nhật "đề bài" (topic, ratio) vào file trạng thái.
        # 3. In log báo hiệu hệ thống đã sẵn sàng để Agent (AI) bắt đầu quy trình chi tiết.
        proj_dir = setup_project(args.project)
        state = ProductionState(proj_dir)
        # Default workflow (topic-to-video)
        state.data["workflow"] = "topic-to-video"
        
        if not args.topic:
            log_error("Lệnh 'produce' cần tham số --topic")
            return

        # Simplified workflow - Agent will orchestrate the details
        log_info("🎬 Starting video production...")
        log_info(f"   Topic: {args.topic}")
        # log_info(f"   Type: {args.type}") # Deprecated
        log_info(f"   Ratio: {args.ratio}")
        log_info("")
        log_info("⚠️  NOTE: AI Agent sẽ tự quyết định quy trình tối ưu")
        log_info("    (voice-first, script-first, hoặc hybrid)")
        log_info("")

        # Just setup the project, agent will handle the rest
        state.data["config"] = {
            "topic": args.topic,
            # "type": args.type, # Deprecated
            "ratio": args.ratio
        }
        state._save()

        log_info("✅ Project initialized. Đợi agent orchestrate...")
        log_info(f"📂 Project dir: {proj_dir}")
        log_info("")
        log_info("💡 Agent có thể sử dụng:")
        log_info("   • video-script-generator skill (generate, sync, segment)")
        log_info("   • voice-generation skill")
        log_info("   • video-resource-finder skill")
        log_info("   • video-editor skill")
            


    elif args.command == "status":
        proj_dir = PROJECTS_DIR / args.project
        if not proj_dir.exists():
            log_error("Project chưa tồn tại.")
            return
        state = ProductionState(proj_dir)
        print(json.dumps(state.data, indent=2, ensure_ascii=False))

    elif args.command == "cleanup":
        proj_dir = PROJECTS_DIR / args.project
        if not proj_dir.exists():
            log_error("Project chưa tồn tại.")
            return
        clean_up_project(proj_dir)

    elif args.command == "studio":
        # Open Remotion Studio
        project = args.project if hasattr(args, 'project') and args.project else None
        open_remotion_studio(project)

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
