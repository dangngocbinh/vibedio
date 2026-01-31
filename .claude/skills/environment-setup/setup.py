#!/usr/bin/env python3
"""
Environment Setup Skill
Automated setup and dependency installation for Video Automation Project
"""

import sys
import os
import platform
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(msg: str, status: str = "info"):
    """Print colored status message"""
    if status == "success":
        print(f"{Colors.GREEN}✅ {msg}{Colors.END}")
    elif status == "error":
        print(f"{Colors.RED}❌ {msg}{Colors.END}")
    elif status == "warning":
        print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")
    elif status == "info":
        print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")
    else:
        print(msg)

def print_header(msg: str):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def run_command(cmd: str, shell: bool = True, check: bool = True) -> Tuple[bool, str]:
    """Run shell command and return success status and output"""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            capture_output=True,
            text=True,
            check=check
        )
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr.strip()

def get_platform() -> str:
    """Detect OS platform"""
    system = platform.system().lower()
    if system == "darwin":
        return "macos"
    elif system == "linux":
        return "linux"
    elif system == "windows":
        return "windows"
    return "unknown"

def check_command_exists(cmd: str) -> bool:
    """Check if command exists in PATH"""
    success, _ = run_command(f"which {cmd}", check=False)
    return success

def get_version(cmd: str, flag: str = "--version") -> str:
    """Get version of installed command"""
    success, output = run_command(f"{cmd} {flag}", check=False)
    if success and output:
        # Extract version number (first line usually)
        return output.split('\n')[0]
    return "Unknown"

def check_prerequisites() -> Dict[str, Dict]:
    """Check if prerequisites are installed"""
    print_header("🔍 Checking Prerequisites")

    results = {}

    # Check Python 3
    if check_command_exists("python3"):
        version = get_version("python3", "--version")
        print_status(f"Python: {version}", "success")
        results["python3"] = {"installed": True, "version": version}
    else:
        print_status("Python 3 not found", "error")
        results["python3"] = {"installed": False}

    # Check pip3
    if check_command_exists("pip3"):
        version = get_version("pip3", "--version")
        print_status(f"pip: {version}", "success")
        results["pip3"] = {"installed": True, "version": version}
    else:
        print_status("pip3 not found", "warning")
        results["pip3"] = {"installed": False}

    # Check Node.js
    if check_command_exists("node"):
        version = get_version("node", "--version")
        print_status(f"Node.js: {version}", "success")
        results["node"] = {"installed": True, "version": version}
    else:
        print_status("Node.js not found", "error")
        results["node"] = {"installed": False}

    # Check npm
    if check_command_exists("npm"):
        version = get_version("npm", "--version")
        print_status(f"npm: {version}", "success")
        results["npm"] = {"installed": True, "version": version}
    else:
        print_status("npm not found", "error")
        results["npm"] = {"installed": False}

    # Check FFmpeg
    if check_command_exists("ffmpeg"):
        version = get_version("ffmpeg", "-version")
        print_status(f"FFmpeg: {version}", "success")
        results["ffmpeg"] = {"installed": True, "version": version}
    else:
        print_status("FFmpeg not found", "error")
        results["ffmpeg"] = {"installed": False}

    return results

def install_system_packages(platform_name: str, dry_run: bool = False):
    """Install system packages via package manager"""
    print_header("📦 Installing System Packages")

    if platform_name == "macos":
        # Check Homebrew
        if not check_command_exists("brew"):
            print_status("Homebrew not found. Please install from https://brew.sh", "error")
            return False

        packages = ["python3", "node", "ffmpeg"]
        for pkg in packages:
            print_status(f"Installing {pkg} via Homebrew...")
            if not dry_run:
                success, output = run_command(f"brew install {pkg}", check=False)
                if success:
                    print_status(f"{pkg} installed", "success")
                else:
                    print_status(f"{pkg} may already be installed or failed", "warning")

    elif platform_name == "linux":
        print_status("Running: sudo apt update")
        if not dry_run:
            run_command("sudo apt update", check=False)

        packages = ["python3", "python3-pip", "nodejs", "npm", "ffmpeg"]
        for pkg in packages:
            print_status(f"Installing {pkg} via apt...")
            if not dry_run:
                success, output = run_command(f"sudo apt install -y {pkg}", check=False)
                if success:
                    print_status(f"{pkg} installed", "success")
                else:
                    print_status(f"{pkg} may already be installed or failed", "warning")

    elif platform_name == "windows":
        print_status("Windows detected. Please install manually:", "warning")
        print("  - Python 3: https://python.org/downloads")
        print("  - Node.js: https://nodejs.org/")
        print("  - FFmpeg: https://ffmpeg.org/download.html")
        return False

    return True

def setup_python_venvs(project_root: Path, dry_run: bool = False):
    """Setup Python virtual environments for each skill"""
    print_header("🐍 Setting up Python Virtual Environments")

    skills_dir = project_root / ".claude" / "skills"

    # Skills that need Python venv
    python_skills = [
        "video-editor",
        "video-script-generator",
        "otio-quick-editor",
        "video-production-director",
        "environment-setup"
    ]

    for skill in python_skills:
        skill_path = skills_dir / skill
        if not skill_path.exists():
            print_status(f"Skill {skill} not found, skipping", "warning")
            continue

        venv_path = skill_path / "venv"

        if venv_path.exists():
            print_status(f"{skill}: venv already exists", "info")
        else:
            print_status(f"Creating venv for {skill}...")
            if not dry_run:
                success, output = run_command(f"python3 -m venv {venv_path}")
                if success:
                    print_status(f"{skill}: venv created", "success")
                else:
                    print_status(f"{skill}: venv creation failed - {output}", "error")

def install_python_deps(project_root: Path, dry_run: bool = False):
    """Install Python dependencies for each skill"""
    print_header("📦 Installing Python Dependencies")

    skills_dir = project_root / ".claude" / "skills"

    python_skills = [
        "video-editor",
        "video-script-generator",
        "otio-quick-editor",
        "video-production-director"
    ]

    for skill in python_skills:
        skill_path = skills_dir / skill
        requirements_file = skill_path / "requirements.txt"

        if not requirements_file.exists():
            print_status(f"{skill}: no requirements.txt found", "warning")
            continue

        venv_path = skill_path / "venv"
        if not venv_path.exists():
            print_status(f"{skill}: venv not found, run setup-venv first", "error")
            continue

        # Determine pip path based on OS
        pip_cmd = str(venv_path / "bin" / "pip") if get_platform() != "windows" else str(venv_path / "Scripts" / "pip.exe")

        print_status(f"Installing dependencies for {skill}...")
        if not dry_run:
            success, output = run_command(f"{pip_cmd} install -r {requirements_file}")
            if success:
                # Count installed packages
                success2, pkg_list = run_command(f"{pip_cmd} list --format=freeze")
                count = len(pkg_list.split('\n')) if success2 else "?"
                print_status(f"{skill}: {count} packages installed", "success")
            else:
                print_status(f"{skill}: installation failed - {output}", "error")

def install_node_deps(project_root: Path, dry_run: bool = False):
    """Install Node.js dependencies"""
    print_header("📦 Installing Node.js Dependencies")

    package_json = project_root / "package.json"

    if not package_json.exists():
        print_status("package.json not found", "error")
        return False

    print_status("Running: npm install")
    if not dry_run:
        os.chdir(project_root)
        success, output = run_command("npm install")
        if success:
            print_status("npm install completed", "success")
            # Count packages
            node_modules = project_root / "node_modules"
            if node_modules.exists():
                count = len(list(node_modules.iterdir()))
                print_status(f"{count} packages installed", "info")
        else:
            print_status(f"npm install failed - {output}", "error")
            return False

    return True

def configure_env(project_root: Path, dry_run: bool = False):
    """Configure .env file"""
    print_header("⚙️ Configuring Environment Variables")

    env_file = project_root / ".env"
    env_example = project_root / ".env.example"

    # [FIX] Do not override existing .env
    if env_file.exists():
        print_status(f".env file already exists at {env_file}. Skipping configuration to avoid overriding your settings.", "success")
        return

    if dry_run:
        print_status("Dry run: would create .env file", "info")
        return

    # Create .env with prompts
    print_status("Please provide API keys (press Enter to skip):")

    env_vars = {}

    # AI APIs
    gemini_key = input(f"{Colors.YELLOW}? GEMINI_API_KEY: {Colors.END}").strip()
    if gemini_key:
        env_vars["GEMINI_API_KEY"] = gemini_key

    openai_key = input(f"{Colors.YELLOW}? OPENAI_API_KEY: {Colors.END}").strip()
    if openai_key:
        env_vars["OPENAI_API_KEY"] = openai_key

    # Voice APIs (optional)
    print_status("\nOptional Voice APIs (press Enter to skip):", "info")

    elevenlabs_key = input(f"{Colors.YELLOW}? ELEVENLABS_API_KEY: {Colors.END}").strip()
    if elevenlabs_key:
        env_vars["ELEVENLABS_API_KEY"] = elevenlabs_key

    vbee_key = input(f"{Colors.YELLOW}? VBEE_API_KEY: {Colors.END}").strip()
    if vbee_key:
        env_vars["VBEE_API_KEY"] = vbee_key

    # Stock resources (optional)
    print_status("\nOptional Stock Resource APIs (press Enter to skip):", "info")

    pexels_key = input(f"{Colors.YELLOW}? PEXELS_API_KEY: {Colors.END}").strip()
    if pexels_key:
        env_vars["PEXELS_API_KEY"] = pexels_key

    pixabay_key = input(f"{Colors.YELLOW}? PIXABAY_API_KEY: {Colors.END}").strip()
    if pixabay_key:
        env_vars["PIXABAY_API_KEY"] = pixabay_key

    # Write .env file
    with open(env_file, 'w') as f:
        f.write("# Video Automation Project - Environment Variables\n")
        f.write("# Generated by environment-setup skill\n\n")

        if env_vars:
            f.write("# AI APIs\n")
            for key, value in env_vars.items():
                if "API_KEY" in key:
                    f.write(f"{key}={value}\n")
        else:
            f.write("# No API keys configured\n")

    print_status(f".env file created at {env_file}", "success")

def verify_installation(project_root: Path):
    """Verify all installations"""
    print_header("✅ Verifying Installation")

    all_good = True

    # Check system packages
    prereqs = check_prerequisites()
    for name, info in prereqs.items():
        if not info.get("installed"):
            all_good = False

    # Check Python venvs
    skills_dir = project_root / ".claude" / "skills"
    for skill in ["video-editor", "video-script-generator"]:
        venv_path = skills_dir / skill / "venv"
        if venv_path.exists():
            print_status(f"{skill} venv: OK", "success")
        else:
            print_status(f"{skill} venv: Missing", "error")
            all_good = False

    # Check Node modules
    node_modules = project_root / "node_modules"
    if node_modules.exists():
        print_status("Node modules: OK", "success")
    else:
        print_status("Node modules: Missing", "error")
        all_good = False

    # Check .env
    env_file = project_root / ".env"
    if env_file.exists():
        print_status(".env file: OK", "success")
    else:
        print_status(".env file: Missing", "warning")

    print()
    if all_good:
        print_status("✅ Environment is ready!", "success")
    else:
        print_status("⚠️  Some components are missing. Review above.", "warning")

    return all_good

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Environment Setup Skill")
    parser.add_argument("command", nargs="?", default="check",
                       choices=["check", "install-system", "setup-venv", "install-python",
                               "install-node", "configure-env", "verify"],
                       help="Command to run")
    parser.add_argument("--all", action="store_true", help="Run all setup steps")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode (don't execute)")

    args = parser.parse_args()

    # Get project root (3 levels up from this script)
    project_root = Path(__file__).parent.parent.parent.parent
    platform_name = get_platform()

    print_header(f"🚀 Video Automation - Environment Setup")
    print_status(f"Platform: {platform_name}", "info")
    print_status(f"Project root: {project_root}", "info")

    if args.dry_run:
        print_status("DRY RUN MODE - No changes will be made", "warning")

    if args.all:
        # Run all steps
        check_prerequisites()
        install_system_packages(platform_name, args.dry_run)
        setup_python_venvs(project_root, args.dry_run)
        install_python_deps(project_root, args.dry_run)
        install_node_deps(project_root, args.dry_run)
        configure_env(project_root, args.dry_run)
        verify_installation(project_root)
    else:
        # Run specific command
        if args.command == "check":
            check_prerequisites()
        elif args.command == "install-system":
            install_system_packages(platform_name, args.dry_run)
        elif args.command == "setup-venv":
            setup_python_venvs(project_root, args.dry_run)
        elif args.command == "install-python":
            install_python_deps(project_root, args.dry_run)
        elif args.command == "install-node":
            install_node_deps(project_root, args.dry_run)
        elif args.command == "configure-env":
            configure_env(project_root, args.dry_run)
        elif args.command == "verify":
            verify_installation(project_root)

if __name__ == "__main__":
    main()
