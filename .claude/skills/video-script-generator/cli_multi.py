#!/usr/bin/env python3
"""
Multi-Video Edit CLI Wrapper
Allows external tools (like Director) to trigger the multi-video setup process.
"""

import argparse
from pathlib import Path
from utils.multi_video_generator import MultiVideoEditGenerator

def main():
    parser = argparse.ArgumentParser(description="Multi-Video Edit Setup")
    parser.add_argument("--project", required=True, help="Project name (folder in public/projects)")
    parser.add_argument("--videos", nargs="+", help="Paths to source videos (if not already imported)")
    parser.add_argument("--ratio", default="9:16", help="Aspect ratio")
    
    args = parser.parse_args()
    
    # Base paths
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    projects_dir = base_dir / "public" / "projects"
    project_dir = projects_dir / args.project
    
    print(f"🎬 Initializing Multi-Video Setup for: {args.project}")
    
    # Initialize Generator
    generator = MultiVideoEditGenerator(project_dir)
    
    # If videos are passed, resolve them
    # NOTE: Director might have already imported them to resources/videos.
    # The generator expects absolute paths to the files to PROCESS.
    
    video_paths = []
    
    # 1. Check if args.videos provided
    if args.videos:
        for v in args.videos:
            p = Path(v)
            if p.exists():
                video_paths.append(str(p.resolve()))
            else:
                # check if it's inside project resources or imports
                p_res = project_dir / "resources" / "videos" / v
                p_imp = project_dir / "imports" / "videos" / v
                
                if p_res.exists():
                    video_paths.append(str(p_res.resolve()))
                elif p_imp.exists():
                    video_paths.append(str(p_imp.resolve()))
    else:
        # 2. auto-discover from project imports/videos (priority) AND resources/videos
        search_dirs = [
            project_dir / "imports" / "videos",
            project_dir / "resources" / "videos"
        ]
        
        for d in search_dirs:
            if d.exists():
                video_paths.extend([str(p) for p in d.glob("*") if p.suffix.lower() in ['.mp4', '.mov', '.avi']])
            
    if not video_paths:
        print("❌ No input videos found! Please provide --videos or import them to resources/videos first.")
        exit(1)
        
    print(f"  Found {len(video_paths)} videos.")
    
    # Generate Script & Transcribe
    try:
        script = generator.generate_initial_script(
            video_paths=video_paths,
            ratio=args.ratio
        )
        print("✅ setup complete. script.json created.")
        print("  Next: Agent should analyze transcript and update scenes.")
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)

if __name__ == "__main__":
    main()
