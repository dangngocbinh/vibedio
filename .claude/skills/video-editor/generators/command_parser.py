"""Parse natural language commands into editing operations."""

import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
import yaml


@dataclass
class Operation:
    """Structured representation of an editing operation."""
    type: str  # e.g., 'insert_clip', 'add_transition'
    params: Dict[str, Any]

    def __repr__(self):
        return f"Operation(type={self.type}, params={self.params})"


class CommandParser:
    """Parse natural language commands using regex patterns."""

    def __init__(self, patterns_file: Optional[str] = None):
        """
        Initialize CommandParser.

        Args:
            patterns_file: Path to command_patterns.yaml
                          If None, uses default in same directory
        """
        if patterns_file is None:
            patterns_file = Path(__file__).parent / "command_patterns.yaml"

        self.patterns = self._load_patterns(patterns_file)
        self.compiled_patterns = self._compile_patterns()

    def _load_patterns(self, patterns_file: str) -> List[Dict[str, Any]]:
        """Load pattern definitions from YAML file."""
        with open(patterns_file, 'r') as f:
            data = yaml.safe_load(f)
        return data.get('patterns', [])

    def _compile_patterns(self) -> List[Dict[str, Any]]:
        """Pre-compile regex patterns for faster matching."""
        compiled = []
        for pattern_def in self.patterns:
            try:
                regex = re.compile(
                    pattern_def['pattern'],
                    re.IGNORECASE | re.VERBOSE
                )
                compiled.append({
                    **pattern_def,
                    'compiled_regex': regex
                })
            except re.error as e:
                print(f"Warning: Failed to compile pattern {pattern_def['name']}: {e}")
        return compiled

    def parse(self, command: str) -> List[Operation]:
        """
        Parse command string into operations.

        Args:
            command: Natural language command string

        Returns:
            List of Operation objects

        Raises:
            ValueError: If command doesn't match any pattern
        """
        command = command.strip()

        for pattern_def in self.compiled_patterns:
            match = pattern_def['compiled_regex'].search(command)

            if match:
                # Extract parameters from match groups
                params = {}
                for param_name, param_type in pattern_def['params'].items():
                    value = match.groupdict().get(param_name)

                    if value is not None:
                        # Convert to appropriate type
                        params[param_name] = self._convert_param(
                            value, param_type
                        )

                return [Operation(
                    type=pattern_def['operation'],
                    params=params
                )]

        raise ValueError(f"Command not recognized: {command}")

    def _convert_param(
        self, value: str, param_type: Union[str, List[str]]
    ) -> Any:
        """
        Convert parameter value to appropriate type.

        Args:
            value: String value from regex match
            param_type: Type specification (str, int, float, bool, or "str|int")

        Returns:
            Converted value
        """
        if isinstance(param_type, str) and '|' in param_type:
            # Try types in order
            for type_name in param_type.split('|'):
                try:
                    return self._convert_param(value, type_name.strip())
                except (ValueError, TypeError):
                    continue
            raise ValueError(f"Cannot convert {value} to any of {param_type}")

        if param_type == 'str':
            return str(value)

        if param_type == 'int':
            # Try to parse as int, handle case like "track 0" -> 0
            match = re.search(r'\d+', value)
            if match:
                return int(match.group())
            return int(value)

        if param_type == 'float':
            # Extract float from value
            match = re.search(r'\d+\.?\d*', value)
            if match:
                return float(match.group())
            return float(value)

        if param_type == 'bool':
            return value.lower() in ('true', 'yes', '1', 'on')

        return value

    def parse_multiple(self, commands: List[str]) -> List[Operation]:
        """
        Parse multiple commands.

        Args:
            commands: List of command strings

        Returns:
            List of Operation objects
        """
        operations = []
        for cmd in commands:
            operations.extend(self.parse(cmd))
        return operations

    def list_patterns(self) -> List[Dict[str, str]]:
        """
        List available command patterns.

        Returns:
            List of pattern definitions with examples
        """
        return [
            {
                'name': p['name'],
                'description': p['description'],
                'example': p['example'],
                'operation': p['operation']
            }
            for p in self.patterns
        ]

    def get_pattern_help(self, operation_name: Optional[str] = None) -> str:
        """
        Get help text for patterns.

        Args:
            operation_name: Specific operation to get help for

        Returns:
            Formatted help text
        """
        patterns = self.patterns

        if operation_name:
            patterns = [p for p in patterns if p['name'] == operation_name]

        help_text = []
        for p in patterns:
            help_text.append(f"• {p['name']}: {p['description']}")
            help_text.append(f"  Example: {p['example']}")

        return "\n".join(help_text)
