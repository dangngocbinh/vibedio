# Video Editor Schema Documentation

## script.json Structure

The `script.json` file is the main configuration file for video-editor skill. It contains scene definitions, metadata, and optional multimedia settings.

### Required Fields

```json
{
  "metadata": {
    "projectName": "string",        // Project identifier
    "videoType": "string",          // One of: facts, listicle, motivation, story, image-slide
    "duration": number,             // Total video duration in seconds
    "width": number,                // Video width in pixels (e.g., 1920)
    "height": number,               // Video height in pixels (e.g., 1080)
    "ratio": "string",              // Aspect ratio (e.g., "16:9")
    "platform": "string",           // Target platform (e.g., "youtube")
    "createdAt": "string"           // ISO timestamp
  },
  "scenes": [
    {
      "id": "string",               // Unique scene identifier (e.g., "scene_1")
      "text": "string",             // Scene text/lyrics/narration
      "duration": number,           // Scene duration in seconds
      "startTime": number,          // Start time in seconds
      "endTime": number,            // End time in seconds
      "visualSuggestion": {         // Optional visual metadata
        "type": "string",           // e.g., "ai-generated", "stock", "custom"
        "description": "string",    // Brief description
        "query": "string"           // Search/generation prompt
      }
    }
  ]
}
```

### Optional Fields (Auto-Populated with Defaults)

These fields will be automatically created with sensible defaults if missing:

#### script
For voice-over projects with narration:
```json
{
  "fullText": "complete narration text",
  "wordCount": 0,
  "estimatedDuration": 0,
  "readingSpeed": 150  // words per minute
}
```

#### voice
For voice/audio configuration:
```json
{
  "enabled": true,    // Set to false to disable voice track and subtitles completely
  "provider": null,   // e.g., "elevenlabs", "google-tts", or null for pre-recorded
  "voiceId": null     // Voice identifier for TTS providers
}
```

#### music
For background music configuration:
```json
{
  "enabled": false,      // Set to true to enable background music
  "query": "",           // Music search query
  "mood": "neutral",     // e.g., "calm", "energetic", "melancholic"
  "genre": "background", // e.g., "ambient", "cinematic", "lofi"
  "volume": 0.5,         // 0.0 to 1.0
  "fadeIn": 1.0,         // seconds
  "fadeOut": 1.0         // seconds
}
```

#### subtitle
For subtitle/caption styling (TikTok-style captions):
```json
{
  "theme": "clean-minimal",     // Theme name (see Caption Themes below)
  "position": "bottom",         // Position: "top", "center", "bottom", "bottom-high" (default: "bottom")
  "font": "Montserrat",         // Optional: Override theme font
  "highlightColor": "#22c55e"   // Optional: Override theme highlight color
}
```

**Available Caption Themes:**
- `clean-minimal` (default) - White rounded background, black text, professional and readable
- `gold-bold` - Bold yellow text with thick black outline, attention-grabbing
- `drop-green` - Words drop with green highlight, dynamic and energetic
- `red-box` - Active word has red background box, great for emphasis
- `impact-yellow` - Maximum impact with large yellow text, perfect for hooks
- `neon-glow` - Glowing neon text, great for tech/night content
- `story-elegant` - Soft elegant style for storytelling
- `minimal-dark` - Simple dark text, clean and aesthetic

**Theme Auto-Selection:**
Themes can be auto-selected based on content keywords. For example:
- Educational/tutorial content → `clean-minimal`
- Shocking/dramatic content → `gold-bold` or `impact-yellow`
- Action/gaming content → `drop-green`
- Important points/CTA → `red-box`
- Tech/futuristic → `neon-glow`
- Stories/emotional → `story-elegant`

## voice.json Structure

```json
{
  "text": "complete voice script text",
  "provider": "external",  // or "elevenlabs", "google-tts", etc.
  "audioFile": "path/to/audio.mp3",
  "duration": 341.36,      // Audio duration in seconds
  "durationFromTimestamps": 341.34,
  "timestamps": [
    {
      "word": "example",
      "start": 0.0,        // Start time in seconds
      "end": 0.5           // End time in seconds
    }
    // ... more timestamps
  ]
}
```

## resources.json Structure

```json
{
  "projectName": "string",
  "generatedAt": "ISO timestamp",
  "apiSources": {
    "pexels": {"used": boolean, "requestCount": number},
    "pixabay": {"used": boolean, "requestCount": number},
    "gemini": {"used": boolean, "requestCount": number, "description": "string"}
  },
  "summary": {
    "totalVideos": number,
    "totalImages": number,
    "totalGeneratedImages": number,
    "totalPinned": number,
    "totalMusic": number,
    "totalSoundEffects": number,
    "totalScenes": number,
    "successfulQueries": number,
    "failedQueries": number
  },
  "resources": {
    "pinnedResources": [],
    "videos": [],
    "images": [],
    "generatedImages": [
      {
        "sceneId": "scene_1",
        "sceneText": "Scene description",
        "source": "gemini-ai",
        "type": "ai-generated",
        "results": [
          {
            "id": "unique-id",
            "title": "Image title",
            "localPath": "path/to/image.png",
            "source": "gemini-nano-banana",
            "generated": true,
            "license": "AI Generated",
            "rank": 1
          }
        ]
      }
    ]
  }
}
```

## Quick Reference - Minimal Configuration

### Image Slide Project (Minimum)
```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "image-slide",
    "duration": 300,
    "width": 1920,
    "height": 1080,
    "ratio": "16:9",
    "platform": "youtube",
    "createdAt": "2026-01-29T00:00:00Z"
  },
  "scenes": [
    {
      "id": "scene_1",
      "text": "First scene",
      "duration": 10,
      "startTime": 0,
      "endTime": 10
    }
  ]
}
```

### Voice-Over Project (Recommended)
```json
{
  "metadata": {
    "projectName": "my-project",
    "videoType": "facts",
    "duration": 300,
    "width": 1920,
    "height": 1080,
    "ratio": "16:9",
    "platform": "youtube",
    "createdAt": "2026-01-29T00:00:00Z"
  },
  "scenes": [ /* ... */ ],
  "script": {
    "fullText": "Narration text here",
    "wordCount": 50,
    "estimatedDuration": 300,
    "readingSpeed": 150
  },
  "voice": {
    "provider": "external",
    "voiceId": null
  }
}
```

## Validation Notes

- **metadata.videoType**: Must match one of the implemented strategy names
- **scenes**: Must be non-empty array with unique IDs
- **timing**: `startTime`, `endTime`, and `duration` should be consistent
- **Optional fields**: Missing fields are auto-populated with safe defaults
- **Custom fields**: Additional fields are preserved but not used by the editor

## Troubleshooting

### "missing required field: X"
- Check that `metadata` and `scenes` are present
- Other fields will be auto-created with defaults

### "videoType not found"
- Valid types: `facts`, `listicle`, `motivation`, `story`, `image-slide`
- Check spelling and case sensitivity

### Timing issues
- Ensure `startTime` < `endTime`
- Total duration should match `metadata.duration`
- Scenes should not overlap unless intentional
