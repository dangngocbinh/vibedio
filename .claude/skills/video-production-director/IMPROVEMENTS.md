# PROPOSED IMPROVEMENTS

## Hybrid Workflow Enhancement (Local + AI/Stock)

### 1. New Capability: Smart Asset Auto-Mapping
**Status**: Planned
**Problem**: Currently, importing local assets requires manual mapping or explicit tedious commands.
**Solution**: Create a "Smart Mapper" module in `video-production-director`.
- **Function**: Automatically map local files from a folder to Script Scenes.
- **Logic**: Use fuzzy matching between filenames and Scene `visualDescription` or `text`.
- **Command**: `script_cli.py auto-map --project "nm" --assets-dir "path/to/folder"`

### 2. Upgrade: Gap-Filling Resource Finder
**Status**: Planned
**Problem**: Resource finder overwrites or ignores existing pinned resources, wasting API calls and user effort.
**Solution**: Modify `video-resource-finder` skill.
- **Logic**: Check for `pinnedResources` in `resources.json` before searching.
- **Action**: ONLY search or generate AI images for Scenes that have NO pinned resources (Gaps).
- **Benefit**: seamlessly mixes user-provided content with AI/Stock content.

### 3. Upgrade: Context-Aware Creation
**Status**: Planned
**Problem**: AI generation doesn't know the style of local assets provided by the user.
**Solution**: Analyze the filename/metadata of pinned assets to detect "style" (e.g., "cartoon", "sketch").
- **Action**: Apply this detected style to the AI generation prompt for the missing scenes to ensure visual consistency across the video.
