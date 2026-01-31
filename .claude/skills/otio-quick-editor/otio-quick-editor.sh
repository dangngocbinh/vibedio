#!/bin/bash
# OTIO Quick Editor wrapper script
# Usage: ./otio-quick-editor.sh <command> [args...]

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate venv and run CLI
"$SCRIPT_DIR/venv/bin/python3" "$SCRIPT_DIR/cli.py" "$@"
