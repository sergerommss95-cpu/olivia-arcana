# YouTube Shorts Pipeline - Study Notes

## Architecture

```
CLI (__main__.py)
  |
  +-- draft -------> TopicEngine (Reddit/RSS/Trends) -> LLM script gen
  +-- produce -----> B-roll (Gemini) -> TTS -> Whisper captions -> Music duck -> ffmpeg assemble
  +-- upload ------> YouTube API (OAuth2, resumable upload, SRT + thumbnail)
```

Pipeline stages tracked via `PipelineState` (JSON checkpointing) -- stages can resume without re-running completed work.

## Key Files

| File | Purpose |
|------|---------|
| `niches/*.yaml` | Niche profiles: tone, hooks, visual style, caption colors, music mood, discovery sources |
| `verticals/niche.py` | Loads YAML, builds LLM prompt context (`get_script_context`), extracts voice/caption/music config |
| `verticals/llm.py` | Provider abstraction: Claude/Gemini/OpenAI/Ollama with auto-detect fallback chain |
| `verticals/tts.py` | TTS abstraction: Edge TTS (free) -> ElevenLabs (premium) -> macOS say (fallback) |
| `verticals/captions.py` | Whisper word-level timestamps -> ASS subtitle with per-word highlight -> SRT for upload |
| `verticals/broll.py` | Gemini image gen + Ken Burns (ffmpeg zoompan: zoom_in/pan_right/zoom_out) |
| `verticals/music.py` | Speech region detection via Whisper -> ffmpeg volume ducking filter |
| `verticals/assemble.py` | ffmpeg concat animated frames + voiceover + ducked music + ASS burn-in |
| `verticals/upload.py` | YouTube Data API v3: resumable upload, SRT captions, thumbnail |
| `verticals/topics/engine.py` | Parallel multi-source discovery (Reddit, RSS, Google Trends, NewsAPI, Twitter, TikTok) |
| `verticals/state.py` | JSON-based stage checkpointing for resume |
| `verticals/retry.py` | Decorator with exponential backoff |

## Patterns to Steal

**1. Niche YAML profile system** -- `niches/general.yaml` is the template. Each profile configures script tone, hook templates, forbidden phrases, visual style + prompt suffix, voice selection per provider, caption colors/grouping, music mood + duck volumes, discovery subreddits. Create `olivia_tarot.yaml` with mystical tone, tarot-specific hooks, dark purple palette, ethereal music tags.

**2. Whisper word-level captions** -- `captions.py` runs `whisper.load_model("base")` with `word_timestamps=True`, groups words (default 4), generates ASS with per-word color highlight using override tags. The ASS format with `{\c&H...&}` inline color is the key pattern. Directly portable.

**3. Ken Burns via ffmpeg zoompan** -- `broll.py:animate_frame()` uses three effects cycled per frame: `zoom_in` (1.12x scale down), `pan_right` (0.15*iw traverse), `zoom_out` (1.0->1.12x). All use ffmpeg `zoompan` filter with 30fps. Copy these filter strings directly.

**4. Music ducking** -- `music.py` detects speech regions from Whisper timestamps, builds ffmpeg `volume='if(between(t,...))'` filter. Speech=0.12, gaps=0.25. Elegant approach using existing Whisper data.

**5. Provider abstraction** -- `llm.py` and `tts.py` both use the same pattern: resolve provider (explicit > env > config > auto-detect), call with fallback chain. Wrap each in `@with_retry` decorator.

**6. Upload flow** -- `upload.py` uses `google-api-python-client` with OAuth2 credentials, resumable `MediaFileUpload`, plus separate caption and thumbnail uploads. Uploads as `private` by default.

## What to Skip

- **Gemini image gen** -- we use Flux 2 Pro via BFL API, not Gemini Imagen
- **Topic discovery** -- Olivia content is tarot/astrology, not news-driven; we generate from zodiac calendar, not Reddit trends
- **Multi-language support** -- Olivia is English-only for now
- **Edge TTS default** -- we want ElevenLabs as primary for brand voice consistency
- **ffmpeg-based video assembly** -- our Remotion pipeline handles this; but the Ken Burns zoompan filters are useful for quick prototypes
