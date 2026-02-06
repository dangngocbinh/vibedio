"""
Production Status Manager
=========================
Track project status through production pipeline.

Steps (user-friendly Vietnamese names):
1. script_created    → "Tạo kịch bản"
2. text_confirmed    → "Xác nhận nội dung"
3. voice_generated   → "Tạo giọng đọc"
4. structure_created → "Tạo cấu trúc"
5. timing_synced     → "Đồng bộ timing"
6. plan_confirmed    → "Xác nhận visual"
7. resources_found   → "Tìm tài nguyên"
8. resources_imported → "Tải tài nguyên"
9. video_built       → "Dựng video"
10. video_edited     → "Chỉnh sửa video"
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List, Any


# Step definitions with order and Vietnamese names
STEPS = {
    "script_created": {"order": 1, "name": "Tạo kịch bản", "description": "Khởi tạo project với script.json"},
    "text_confirmed": {"order": 2, "name": "Xác nhận nội dung", "description": "User đã xác nhận nội dung kịch bản (Checkpoint 1)"},
    "voice_generated": {"order": 3, "name": "Tạo giọng đọc", "description": "Đã tạo voice.mp3 và voice.json"},
    "structure_created": {"order": 4, "name": "Tạo cấu trúc", "description": "Đã tạo sections và scenes"},
    "timing_synced": {"order": 5, "name": "Đồng bộ timing", "description": "Đã sync timing với voice"},
    "plan_confirmed": {"order": 6, "name": "Xác nhận visual", "description": "User đã xác nhận visual descriptions (Checkpoint 2)"},
    "resources_found": {"order": 7, "name": "Tìm tài nguyên", "description": "Đã tìm video/image từ APIs (Checkpoint 3)"},
    "resources_imported": {"order": 8, "name": "Tải tài nguyên", "description": "Đã download resources về local"},
    "video_built": {"order": 9, "name": "Dựng video", "description": "Đã build project.otio"},
    "video_edited": {"order": 10, "name": "Chỉnh sửa video", "description": "Đã edit trên project.otio"}
}

# Steps that trigger "dangerous rebuild" warning (when going back before these)
PROTECTED_STEP = "video_built"


class StatusManager:
    """
    Manage production status for video projects.

    Usage:
        manager = StatusManager("public/projects/my-video")
        manager.complete_step("script_created")
        manager.complete_step("voice_generated")

        # Check if OTIO has been edited
        if manager.has_otio_edits():
            # Show warning before rebuild
            pass
    """

    def __init__(self, project_dir: str):
        """
        Initialize StatusManager.

        Args:
            project_dir: Path to project directory
        """
        self.project_dir = Path(project_dir)
        self.status_file = self.project_dir / "production_status.json"
        self._status = self._load_or_create()

    def _load_or_create(self) -> Dict[str, Any]:
        """Load existing status or create new one."""
        if self.status_file.exists():
            try:
                with open(self.status_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass

        # Create new status
        return {
            "currentStep": None,
            "currentStepOrder": 0,
            "otioEdited": False,
            "lastEditAction": None,
            "steps": {
                step_id: {
                    "completed": False,
                    "completedAt": None,
                    "order": info["order"],
                    "name": info["name"]
                }
                for step_id, info in STEPS.items()
            },
            "history": []
        }

    def _save(self):
        """Save status to file."""
        self.project_dir.mkdir(parents=True, exist_ok=True)
        with open(self.status_file, 'w', encoding='utf-8') as f:
            json.dump(self._status, f, indent=2, ensure_ascii=False)

    def complete_step(self, step_id: str, action: str = None) -> bool:
        """
        Mark a step as completed.

        Args:
            step_id: Step identifier (e.g., "script_created", "voice_generated")
            action: Optional action description for history

        Returns:
            True if step was marked completed
        """
        if step_id not in STEPS:
            raise ValueError(f"Unknown step: {step_id}. Valid steps: {list(STEPS.keys())}")

        now = datetime.now().isoformat()
        step_info = STEPS[step_id]

        # Mark step completed
        self._status["steps"][step_id]["completed"] = True
        self._status["steps"][step_id]["completedAt"] = now

        # Update current step
        self._status["currentStep"] = step_id
        self._status["currentStepOrder"] = step_info["order"]

        # Add to history
        self._status["history"].append({
            "step": step_id,
            "action": action or f"Completed: {step_info['name']}",
            "at": now
        })

        self._save()
        return True

    def mark_otio_edited(self, action: str):
        """
        Mark that OTIO has been edited (after build).

        Args:
            action: Description of edit (e.g., "add-title 'Subscribe!' at 3s")
        """
        now = datetime.now().isoformat()

        self._status["otioEdited"] = True
        self._status["lastEditAction"] = action

        # Complete video_edited step if not already
        if not self._status["steps"]["video_edited"]["completed"]:
            self._status["steps"]["video_edited"]["completed"] = True
            self._status["steps"]["video_edited"]["completedAt"] = now
            self._status["currentStep"] = "video_edited"
            self._status["currentStepOrder"] = STEPS["video_edited"]["order"]

        # Add to history
        self._status["history"].append({
            "step": "video_edited",
            "action": f"Edit: {action}",
            "at": now
        })

        self._save()

    def rollback_to_step(self, step_id: str):
        """
        Rollback status to a specific step.
        All steps after this step will be marked as incomplete.

        Args:
            step_id: Step to rollback to
        """
        if step_id not in STEPS:
            raise ValueError(f"Unknown step: {step_id}")

        target_order = STEPS[step_id]["order"]
        now = datetime.now().isoformat()

        # Mark all steps after target as incomplete
        for sid, info in STEPS.items():
            if info["order"] > target_order:
                self._status["steps"][sid]["completed"] = False
                self._status["steps"][sid]["completedAt"] = None

        # Update current step
        self._status["currentStep"] = step_id
        self._status["currentStepOrder"] = target_order

        # Reset OTIO edit flag if rolling back before video_built
        if target_order < STEPS["video_built"]["order"]:
            self._status["otioEdited"] = False
            self._status["lastEditAction"] = None

        # Add to history
        self._status["history"].append({
            "step": step_id,
            "action": f"Rollback to: {STEPS[step_id]['name']}",
            "at": now
        })

        self._save()

    def has_otio_edits(self) -> bool:
        """Check if OTIO has been edited after build."""
        return self._status.get("otioEdited", False)

    def get_current_step(self) -> Optional[str]:
        """Get current step ID."""
        return self._status.get("currentStep")

    def get_current_step_name(self) -> str:
        """Get current step Vietnamese name."""
        step_id = self.get_current_step()
        if step_id and step_id in STEPS:
            return STEPS[step_id]["name"]
        return "Chưa bắt đầu"

    def get_current_step_order(self) -> int:
        """Get current step order number."""
        return self._status.get("currentStepOrder", 0)

    def is_step_completed(self, step_id: str) -> bool:
        """Check if a specific step is completed."""
        if step_id not in self._status["steps"]:
            return False
        return self._status["steps"][step_id]["completed"]

    def get_completed_steps(self) -> List[str]:
        """Get list of completed step IDs."""
        return [
            step_id for step_id, info in self._status["steps"].items()
            if info["completed"]
        ]

    def get_next_step(self) -> Optional[str]:
        """Get the next step that should be done."""
        current_order = self.get_current_step_order()

        for step_id, info in STEPS.items():
            if info["order"] == current_order + 1:
                return step_id

        return None

    def get_next_step_name(self) -> str:
        """Get next step Vietnamese name."""
        next_step = self.get_next_step()
        if next_step:
            return STEPS[next_step]["name"]
        return "Hoàn thành"

    def should_warn_rebuild(self, target_step: str = None) -> bool:
        """
        Check if we should warn user about losing OTIO edits.

        Args:
            target_step: Step we're about to do (if None, check if any rebuild needed)

        Returns:
            True if user should be warned
        """
        if not self.has_otio_edits():
            return False

        if target_step is None:
            # General check - warn if OTIO has edits
            return True

        # Check if target step would cause rebuild
        if target_step in STEPS:
            target_order = STEPS[target_step]["order"]
            protected_order = STEPS[PROTECTED_STEP]["order"]

            # Warn if going back before "video_built"
            if target_order < protected_order:
                return True

        return False

    def get_rebuild_warning_message(self) -> str:
        """Get warning message for rebuild."""
        last_edit = self._status.get("lastEditAction", "unknown")
        return (
            f"⚠️ CẢNH BÁO: Video đã được chỉnh sửa!\n"
            f"   Thao tác gần nhất: {last_edit}\n"
            f"\n"
            f"   Nếu quay lại bước trước, những chỉnh sửa này sẽ BỊ MẤT.\n"
            f"   Bạn có chắc chắn muốn tiếp tục?"
        )

    def get_status_summary(self) -> str:
        """Get human-readable status summary."""
        current = self.get_current_step_name()
        current_order = self.get_current_step_order()
        total_steps = len(STEPS)
        completed = len(self.get_completed_steps())

        lines = [
            f"📊 TRẠNG THÁI PROJECT",
            f"   Bước hiện tại: [{current_order}/{total_steps}] {current}",
            f"   Hoàn thành: {completed}/{total_steps} bước",
        ]

        if self.has_otio_edits():
            lines.append(f"   🎬 Video đã được chỉnh sửa: {self._status.get('lastEditAction', 'Có')}")

        lines.append("")
        lines.append("   Các bước:")

        for step_id, info in sorted(STEPS.items(), key=lambda x: x[1]["order"]):
            step_status = self._status["steps"][step_id]
            icon = "✅" if step_status["completed"] else "⬜"
            current_marker = " ← (hiện tại)" if step_id == self.get_current_step() else ""
            lines.append(f"      {icon} {info['order']}. {info['name']}{current_marker}")

        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:
        """Return status as dictionary."""
        return self._status.copy()


# Convenience functions for CLI usage

def update_status(project_dir: str, step_id: str, action: str = None):
    """Quick function to update status from CLI."""
    manager = StatusManager(project_dir)
    manager.complete_step(step_id, action)
    return manager


def mark_edited(project_dir: str, action: str):
    """Quick function to mark OTIO as edited."""
    manager = StatusManager(project_dir)
    manager.mark_otio_edited(action)
    return manager


def check_rebuild_warning(project_dir: str, target_step: str = None) -> Optional[str]:
    """
    Check if rebuild warning should be shown.

    Returns:
        Warning message if should warn, None otherwise
    """
    manager = StatusManager(project_dir)
    if manager.should_warn_rebuild(target_step):
        return manager.get_rebuild_warning_message()
    return None


def get_status(project_dir: str) -> str:
    """Get status summary for project."""
    manager = StatusManager(project_dir)
    return manager.get_status_summary()


# CLI for testing
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python status_manager.py <project_dir> [command] [args]")
        print("")
        print("Commands:")
        print("  status                     - Show current status")
        print("  complete <step_id>         - Mark step as completed")
        print("  edit <action_description>  - Mark OTIO as edited")
        print("  rollback <step_id>         - Rollback to step")
        print("  check-rebuild              - Check if rebuild warning needed")
        print("")
        print("Steps: script_created, text_confirmed, voice_generated,")
        print("       structure_created, timing_synced, resources_found,")
        print("       resources_imported, video_built, video_edited")
        sys.exit(1)

    project_dir = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "status"

    manager = StatusManager(project_dir)

    if command == "status":
        print(manager.get_status_summary())

    elif command == "complete":
        if len(sys.argv) < 4:
            print("Error: Missing step_id")
            sys.exit(1)
        step_id = sys.argv[3]
        manager.complete_step(step_id)
        print(f"✅ Completed step: {step_id}")
        print(manager.get_status_summary())

    elif command == "edit":
        action = sys.argv[3] if len(sys.argv) > 3 else "Manual edit"
        manager.mark_otio_edited(action)
        print(f"✅ Marked OTIO as edited: {action}")

    elif command == "rollback":
        if len(sys.argv) < 4:
            print("Error: Missing step_id")
            sys.exit(1)
        step_id = sys.argv[3]

        # Check for warning
        if manager.should_warn_rebuild(step_id):
            print(manager.get_rebuild_warning_message())
            response = input("\nContinue? (y/N): ")
            if response.lower() != 'y':
                print("Cancelled.")
                sys.exit(0)

        manager.rollback_to_step(step_id)
        print(f"✅ Rolled back to: {step_id}")
        print(manager.get_status_summary())

    elif command == "check-rebuild":
        target = sys.argv[3] if len(sys.argv) > 3 else None
        warning = check_rebuild_warning(project_dir, target)
        if warning:
            print(warning)
        else:
            print("✅ No rebuild warning needed")

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
