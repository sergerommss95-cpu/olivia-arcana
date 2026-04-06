# Olivia Arcana — Posting Frequency Research (April 2026)

**Source:** Research from Buffer (11M+ posts dataset), Sprout Social, TikTok official docs, YouTube growth data

---

## Critical Finding: Quality > Volume in 2026

The 2026 algorithm across ALL platforms penalizes high-volume low-quality posting. The original plan of 12-15 TikToks/day is **counter-productive**.

## Revised Optimal Posting Frequency

| Platform | Original Target | Revised Target | Data Source |
|----------|----------------|---------------|-------------|
| **TikTok** | 12-15/day | **3-5/day** | Buffer: 2-5/week = +17% views/post. Algorithm clusters topical series. |
| **IG Reels** | 3-5/day | **1-2/day** | Per-reel reach drops sharply above 1/day. Space 6+ hours apart. |
| **IG Stories** | 12/day | **4-5/day** | Adam Mosseri recommends 1-2/day. Power users: 4-5/day max. |
| **IG Feed** | 1/day | **3-5/week** | Carousels and aesthetics, not daily. |
| **YT Shorts** | 2-3/day | **2-3/day** | Already optimal. 2/day = +2,200 subs/month. |
| **Telegram** | 3-4/day | **3-4/day** | No algorithm — direct push. Keep as is. |

**Total:** ~10-15 pieces/day instead of 30-35. Same or BETTER growth.

## Platform API Limits

| Platform | API | Daily Limit | Our Usage | Headroom |
|----------|-----|------------|-----------|----------|
| TikTok | Content Posting API | 15 posts/day/account | 3-5 | Plenty |
| Instagram | Meta Graph API | 100 posts/day | 6-7 (Reels + Stories) | Plenty |
| YouTube | Data API v3 | 6 uploads/day (default quota) | 2-3 | Sufficient |

## Best Posting Times (Astrology/Spiritual Content)

- **TikTok:** Late morning to early afternoon (11 AM - 3 PM target audience local time)
- **Instagram:** 11 AM - 1 PM and 7 PM - 9 PM
- **YouTube:** 2 PM - 4 PM
- **Best days:** Tuesdays and Wednesdays show highest engagement

## Recommended Stack for Auto-Posting

### Layer 1: Direct Platform APIs (Free)
- TikTok Content Posting API (needs developer account approval, 5-10 business days)
- Meta Graph API for Instagram (needs Business account + app review)
- YouTube Data API v3 (needs Google Cloud project)

### Layer 2: Cross-Posting Service (Backup/Simplicity)
- **Late.dev** ($19/mo): Cheapest true API. Single REST call → all 3 platforms.
- **Publer** ($12/mo): Cheapest dashboard. True auto-post.
- **Repurpose.io** ($35/mo): Best for "upload once, auto-distribute everywhere."

### Layer 3: Manual Phase 1
- Use Later.com ($25/mo) or Buffer ($6-15/mo) for scheduling
- Or export from pipeline and manually upload from organized folders

## Revised Content Strategy

Instead of 12 separate daily zodiac clips, produce:

### Daily (3-5 pieces on TikTok)
1. **Morning zodiac forecast** — Pick 3-4 most affected signs (not all 12)
2. **Midday hook** — One high-engagement format (roast, compatibility, etc.)
3. **Afternoon content** — Educational or trend-reactive piece

### Weekly Skit Schedule (unchanged)
- Monday: Zodiac roast
- Tuesday: Compatibility
- Wednesday: Celebrity chart
- Thursday: "What your sign does when..."
- Friday: Birth chart reveal

### Instagram Daily
1. **1 Reel** (best TikTok of the day, cross-posted)
2. **4-5 Stories** (top signs + tarot + engagement poll)
3. **3-5 Feed posts/week** (carousels, aesthetics)

### YouTube Daily
2-3 Shorts (best TikToks of the day)

## Impact on Pipeline

The pipeline still generates ALL 12 zodiac scripts daily (for Telegram channel + Instagram Stories). But for TikTok/Reels/Shorts, it only renders 3-5 videos instead of 12. This:
- Cuts ElevenLabs costs by ~60%
- Cuts rendering time by ~60%
- Allows higher quality per video
- Better matches algorithm preferences
