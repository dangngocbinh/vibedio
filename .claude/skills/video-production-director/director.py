#!/usr/bin/env python3
"""
VIDEO PRODUCTION DIRECTOR (VIBE DIO)
====================================
Orchestrator for Mecode.pro's Video Automation Pipeline.

Usage:
    python director.py import --project <name> --files <f1> <f2>
    python director.py produce --project <name> --workflow <type>
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
SKILLS_DIR = BASE_DIR / ".agent" / "skills"

# Sub-skill paths
SCRIPT_SKILL = SKILLS_DIR / "video-script-generator"
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
    project_dir = PROJECTS_DIR / name
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Init state file immediately
    ProductionState(project_dir)._save()
    
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

    # Call video-script-generator CLI
    cmd = [
        "python3",
        str(SCRIPT_SKILL / "cli.py"),  # ← Changed from demo.py to cli.py
        "--topic", topic,
        "--type", type,
        "--ratio", ratio,
        "--output", str(project_dir / "script.json")
    ]

    try:
        subprocess.run(cmd, check=True)
        log_info(f"✅ Kịch bản đã tạo xong: script.json (ratio: {ratio})")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi tạo script!")
        sys.exit(1)

def run_step_voice(project_dir: Path):
    log_info("Bắt đầu bước 2: Tạo Giọng Đọc (Voice)...")
    
    # Call voice-generation
    # Note: voice-generation script usually takes text or input file. 
    # We need to ensure it reads from script.json
    # Assume generate-voice.js can read script.json or we pass text?
    # For now, let's use the standard flow: read script.json -> extract text -> generate
    
    # TODO: Refine voice-generation interface to accept project dir directly
    # Workaround: Read script.json manually in python, pass text to cli
    
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
            shutil.copy(src_json, dest_json)
            
        log_info("✅ Giọng đọc đã tạo xong: resources/audio/voice.mp3")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi tạo voice!")
        sys.exit(1)

def run_step_multi_video_setup(project_dir: Path, ratio: str = "9:16"):
    log_info(f"Bắt đầu bước 1: Setup Multi-Video (Import & Transcribe) - Aspect Ratio: {ratio}...")

    cmd = [
        "python3",
        str(SCRIPT_SKILL / "cli_multi.py"),
        "--project", project_dir.name,
        "--ratio", ratio  # ← Added aspect ratio parameter
    ]

    try:
        subprocess.run(cmd, check=True)
        log_info(f"✅ Setup hoàn tất. Script.json đã có transcript (ratio: {ratio}).")
    except subprocess.CalledProcessError:
        log_error("Lỗi khi setup multi-video!")
        sys.exit(1)

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
        "python3",
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
    produce_parser.add_argument("--workflow", default="auto", choices=["auto", "topic-to-video", "multi-video-edit", "multi-video-resume"])
    produce_parser.add_argument("--topic", help="Topic for topic-to-video workflow")
    produce_parser.add_argument("--type", default="facts", help="Video type")
    produce_parser.add_argument("--ratio", default="9:16",
                                help="Aspect ratio (9:16 for TikTok/Shorts, 16:9 for YouTube, 1:1 for Instagram, 4:5 for Instagram Portrait)")

    # Status Command
    status_parser = subparsers.add_parser("status")
    status_parser.add_argument("--project", required=True)
    
    args = parser.parse_args()
    
    if args.command == "import":
        proj_dir = setup_project(args.project)
        import_files(proj_dir, args.files)
        
    elif args.command == "produce":
        proj_dir = setup_project(args.project)
        state = ProductionState(proj_dir)
        state.data["workflow"] = args.workflow
        
        if args.workflow == "topic-to-video":
            if not args.topic:
                log_error("Workflow 'topic-to-video' cần tham số --topic")
                return

            # Execute Pipeline
            run_step_script(proj_dir, args.topic, args.type, args.ratio)
            state.update_step("script", "completed", {"file": "script.json", "ratio": args.ratio})
            
            run_step_voice(proj_dir)
            state.update_step("voice", "completed", "voice.json")
            
            run_step_resources(proj_dir)
            state.update_step("resources", "completed", "resources.json")
            
            run_step_editor(proj_dir)
            state.update_step("editor", "completed", "project.otio")
            
            log_info("🎉 Quy trình hoàn tất! Anh/chị có thể render video ngay.")
            
        elif args.workflow == "multi-video-edit":
            # 1. Setup (Import/Extraction/Transcription)
            run_step_multi_video_setup(proj_dir, args.ratio)
            state.update_step("setup", "completed", {"file": "script.json (transcript)", "ratio": args.ratio})
            
            # 2. Agent Interaction required
            log_info("🛑 PAUSE: Đã có Transcript.")
            log_info("Vibe Dio cần Anh/Chị (Agent) phân tích script.json và cập nhật scenes mới.")
            log_info("Sau khi xong, hãy chạy: python director.py produce --project <name> --workflow multi-video-resume")
            
        elif args.workflow == "multi-video-resume":
             # Resume from Editor step
             # Use resources step if needed for B-roll
             run_step_resources(proj_dir)
             
             run_step_editor(proj_dir)
             state.update_step("editor", "completed", "project.otio")
             log_info("🎉 Quy trình hoàn tất! Anh/chị có thể render video ngay.")
            
    elif args.command == "status":
        proj_dir = PROJECTS_DIR / args.project
        if not proj_dir.exists():
            log_error("Project chưa tồn tại.")
            return
        state = ProductionState(proj_dir)
        print(json.dumps(state.data, indent=2, ensure_ascii=False))
        
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
