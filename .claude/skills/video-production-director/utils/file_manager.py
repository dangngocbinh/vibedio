#!/usr/bin/env python3
"""
File Manager - Centralized file path management for video production
====================================================================
Ensures all intermediate files are saved in organized directories.
"""

from pathlib import Path
from typing import Optional

class FileManager:
    """
    Manages file paths for video production projects.

    Directory Structure:
        public/projects/{project-name}/
        ├── script.json                 # Main script
        ├── voice.json                  # Voice metadata
        ├── resources.json              # Resources metadata
        ├── raw_script.txt              # Original text
        ├── init/                       # Intermediate files (sections, scenes)
        │   ├── sec_intro.txt
        │   ├── scenes_intro.json
        │   ├── sec_fitness.txt
        │   └── scenes_fitness.json
        ├── resources/                  # Downloaded resources
        │   ├── videos/
        │   ├── images/
        │   └── audio/
        └── backups/                    # Old versions
    """

    def __init__(self, project_dir: str):
        """
        Initialize FileManager for a project.

        Args:
            project_dir: Path to project directory (e.g., "public/projects/my-video")
        """
        self.project_dir = Path(project_dir)
        self.init_dir = self.project_dir / "init"
        self.resources_dir = self.project_dir / "resources"
        self.backups_dir = self.project_dir / "backups"

        # Ensure directories exist
        self.init_dir.mkdir(parents=True, exist_ok=True)
        self.resources_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)

    def get_section_text_path(self, section_id: str) -> Path:
        """
        Get path for section text file.

        Args:
            section_id: Section ID (e.g., "intro", "fitness")

        Returns:
            Path to sec_{section_id}.txt in init/ directory
        """
        return self.init_dir / f"sec_{section_id}.txt"

    def get_scenes_file_path(self, section_id: str) -> Path:
        """
        Get path for scenes definition file.

        Args:
            section_id: Section ID (e.g., "intro", "fitness")

        Returns:
            Path to scenes_{section_id}.json in init/ directory
        """
        return self.init_dir / f"scenes_{section_id}.json"

    def get_script_path(self) -> Path:
        """Get path to script.json"""
        return self.project_dir / "script.json"

    def get_voice_path(self) -> Path:
        """Get path to voice.json"""
        return self.project_dir / "voice.json"

    def get_resources_path(self) -> Path:
        """Get path to resources.json"""
        return self.project_dir / "resources.json"

    def get_raw_script_path(self) -> Path:
        """Get path to raw_script.txt"""
        return self.project_dir / "raw_script.txt"

    def get_backup_path(self, filename: str) -> Path:
        """
        Get path for backup file.

        Args:
            filename: Original filename

        Returns:
            Path in backups/ directory
        """
        return self.backups_dir / filename

    def ensure_init_dir(self) -> Path:
        """Ensure init directory exists and return its path."""
        self.init_dir.mkdir(parents=True, exist_ok=True)
        return self.init_dir

    @staticmethod
    def get_project_init_dir(project_dir: str) -> Path:
        """
        Static helper to get init directory path.

        Args:
            project_dir: Project directory path

        Returns:
            Path to init/ directory
        """
        init_dir = Path(project_dir) / "init"
        init_dir.mkdir(parents=True, exist_ok=True)
        return init_dir

    @staticmethod
    def resolve_relative_path(file_path: str, project_dir: str) -> Path:
        """
        Resolve a file path relative to project directory.

        If file_path starts with "init/", "resources/", etc., resolve relative to project.
        Otherwise, treat as absolute or CWD-relative.

        Args:
            file_path: File path (can be relative or absolute)
            project_dir: Project directory

        Returns:
            Resolved absolute path
        """
        path_obj = Path(file_path)

        # If already absolute, return as-is
        if path_obj.is_absolute():
            return path_obj

        # If starts with known subdirectory, resolve relative to project
        parts = path_obj.parts
        if len(parts) > 0 and parts[0] in ['init', 'resources', 'backups']:
            return Path(project_dir) / path_obj

        # Otherwise, resolve relative to CWD
        return path_obj.resolve()
