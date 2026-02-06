#!/usr/bin/env python3
import sys
import os
import time
import subprocess
import argparse
import webbrowser
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Auto launch Remotion Studio with fallback and direct link opening")
    parser.add_argument('--project', required=True, help="Path to project.otio file or directory")
    args = parser.parse_args()

    project_path = str(Path(args.project).resolve())
    
    # Check if Remotion Studio is running (port 3000)
    is_running = False
    try:
        # Simple check using lsof or curl (curl is better for cross-platform/service check)
        # But lsof is what we use in other scripts
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            is_running = s.connect_ex(('localhost', 3000)) == 0
    except:
        is_running = False

    url = f"http://localhost:3000/?project={project_path}"

    if is_running:
        print("✅ Remotion Studio is already running.")
        print(f"🚀 Opening {url}")
        webbrowser.open(url)
    else:
        print("⏳ Remotion Studio is not running. Starting it now...")
        
        # Start in background
        # We assume we are in project root (where package.json and scripts/ exist)
        project_root = Path(os.getcwd())
        
        try:
            # Using Popen to start without blocking
            # Assuming 'npm start' works in current directory
            process = subprocess.Popen(
                ["npm", "start"], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                cwd=str(project_root),
                start_new_session=True # Detach from current terminal group
            )
            
            print(f"🕒 Waiting for Studio to initialize (PID: {process.pid})...")
            
            # Smart Wait: Poll port 3000 until open or timeout
            start_time = time.time()
            timeout = 30 # seconds
            
            studio_ready = False
            while time.time() - start_time < timeout:
                try:
                    import socket
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.settimeout(1)
                        if s.connect_ex(('localhost', 3000)) == 0:
                            studio_ready = True
                            break
                except:
                    pass
                time.sleep(1)
                
            if studio_ready:
                print("✅ Remotion Studio started successfully!")
                print(f"🚀 Opening {url}")
                webbrowser.open(url)
            else:
                print("⚠️  Warning: Studio taking longer than expected to start.")
                print(f"Please check http://localhost:3000 manually.")
                print(f"Direct Link: {url}")
                
        except Exception as e:
            print(f"❌ Failed to auto-start Studio: {e}")
            print(f"Please run 'npm start' manually.")

    return 0

if __name__ == "__main__":
    main()
