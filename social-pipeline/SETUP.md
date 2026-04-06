# Olivia Arcana — Social Pipeline Setup Guide

## Quick Start

### 1. Install System Dependencies

```bash
# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt install ffmpeg
```

### 2. Install Python Dependencies

```bash
cd ~/olivia-arcana/social-pipeline
pip install -r requirements.txt
```

### 3. Set Environment Variables

Create a `.env` file or export these:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."          # Claude API for scripts
export ELEVENLABS_API_KEY="..."                 # ElevenLabs for voiceover
export ELEVENLABS_VOICE_ID="..."                # Olivia's voice ID
export TELEGRAM_BOT_TOKEN="..."                 # Telegram bot for channel posts

# Optional (for auto-posting — can skip for Phase 1)
export TIKTOK_ACCESS_TOKEN="..."               # TikTok Content Posting API
export META_ACCESS_TOKEN="..."                  # Instagram Graph API
export YOUTUBE_API_KEY="..."                    # YouTube Data API
```

### 4. Install Fonts

Download Google Fonts to `fonts/` directory:
- [Playfair Display Bold](https://fonts.google.com/specimen/Playfair+Display)
- [Inter Regular + Bold](https://fonts.google.com/specimen/Inter)
- [Cormorant Garamond Medium](https://fonts.google.com/specimen/Cormorant+Garamond)

### 5. Test the Pipeline

```bash
# Test transit computation
python3 scripts/compute_transits.py

# Test image generation (no API key needed)
python3 scripts/generate_images.py

# Run full daily pipeline
python3 scripts/daily_pipeline.py daily

# Run daily + weekly skit
python3 scripts/daily_pipeline.py full
```

### 6. Set Up Cron (Automated Daily Runs)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily pipeline at 04:00 UTC
0 4 * * * cd ~/olivia-arcana/social-pipeline && /usr/bin/python3 scripts/daily_pipeline.py daily >> output/pipeline.log 2>&1

# Full pipeline (daily + weekly skit) on weekdays at 03:00 UTC
0 3 * * 1-5 cd ~/olivia-arcana/social-pipeline && /usr/bin/python3 scripts/daily_pipeline.py full >> output/pipeline.log 2>&1
```

Or use the built-in Python scheduler:
```bash
python3 scripts/schedule_cron.py
```

---

## Phase 1 (No API Keys for Posting)

Without TikTok/Instagram/YouTube API tokens, the pipeline will:
1. Generate all content (scripts, audio, video, images)
2. Save everything to `output/YYYY-MM-DD/`
3. Post to Telegram channel (requires bot token)
4. **Queue** TikTok/IG/YT posts (saved to manifest file)

You can then manually upload the generated videos from `output/YYYY-MM-DD/videos/` to each platform, or use a scheduling tool like Later.com / Buffer.

## Phase 2 (Full Automation)

### TikTok Content Posting API
1. Create a TikTok Developer account: https://developers.tiktok.com
2. Create an app with `video.publish` scope
3. Get approved for Content Posting API (can take 1-2 weeks)
4. Generate access token via OAuth2 flow
5. Set `TIKTOK_ACCESS_TOKEN` environment variable

### Instagram Graph API
1. Create a Meta Developer account: https://developers.facebook.com
2. Create a Facebook Page linked to your Instagram Business account
3. Create an app with `instagram_content_publish` permission
4. Generate a long-lived access token
5. Set `META_ACCESS_TOKEN` and `INSTAGRAM_BUSINESS_ACCOUNT_ID`

### YouTube Data API
1. Create a Google Cloud project: https://console.cloud.google.com
2. Enable YouTube Data API v3
3. Create OAuth2 credentials
4. Authorize with `youtube.upload` scope
5. Set `YOUTUBE_API_KEY` and save OAuth token

---

## Cost Summary

| Component | Monthly Cost |
|-----------|-------------|
| Claude API (scripts) | ~$20-30 |
| ElevenLabs (voiceover) | $5-22 |
| FFmpeg (video rendering) | $0 |
| Pillow (image generation) | $0 |
| Linktree Pro (link in bio) | $5 |
| Later.com (scheduling, Phase 1) | $15-25 |
| **Total** | **$45-82/month** |

## Output Structure

```
output/
  2026-04-07/
    transits.json              -- Today's planetary data
    scripts.json               -- All generated scripts
    pipeline_summary.json      -- Run statistics
    posting_manifest.json      -- What was posted where
    audio/
      aries_daily.mp3          -- 12 voiceover files
      taurus_daily.mp3
      ...
    videos/
      aries_daily.mp4          -- 12 TikTok videos
      taurus_daily.mp4
      ...
    stories/
      aries_story.png          -- 12 IG Story cards
      taurus_story.png
      ...
    feed/
      aries_feed.png           -- 12 IG feed cards
      taurus_feed.png
      ...
```
