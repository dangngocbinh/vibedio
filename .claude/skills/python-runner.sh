#!/bin/bash
# Python Runner Helper - Auto-detect correct Python interpreter
# Usage: ./python-runner.sh script.py [args...]

# Try python3 first (most common on modern systems)
if command -v python3 &> /dev/null; then
    python3 "$@"
# Fallback to python (might be Python 2 or 3 depending on system)
elif command -v python &> /dev/null; then
    # Check if it's Python 3
    if python --version 2>&1 | grep -q "Python 3"; then
        python "$@"
    else
        echo "Error: Python 3 is required but only Python 2 was found."
        echo "Please install Python 3 or use 'python3' explicitly."
        exit 1
    fi
else
    echo "Error: Python is not installed or not in PATH."
    exit 1
fi
