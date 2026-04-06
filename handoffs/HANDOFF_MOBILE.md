# Olivia Arcana — Mobile App Development Handoff

**Date:** April 6, 2026
**Status:** Not started. Planning phase only.
**Planned Tech:** PWA first -> React Native/Expo -> native features
**Target Platforms:** iOS 16+ and Android 10+

---

## 1. Phase Plan

### Phase 1: PWA (Weeks 1-2)
Deploy the Next.js website as a Progressive Web App. Minimal effort, validates mobile UX.
- Add `manifest.json` with app name, icons, theme color (#0D0D1A)
- Add Service Worker for offline caching of daily readings
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Disable WebGL cosmos engine on mobile (use CSS gradient + static star image)
- Test on iPhone 12+ and Samsung Galaxy S21+
- Submit to Google Play Store as TWA (Trusted Web Activity)
- **Effort:** 1-2 weeks
- **Value:** Installable app with push notifications via web push API

### Phase 2: React Native / Expo (Weeks 3-8)
Full native app with shared backend. Reuse 30-40% of web components (logic, not UI).
- Expo SDK 52+ with Expo Router for navigation
- Shared FastAPI backend (same endpoints as website)
- Native push notifications (expo-notifications)
- Apple IAP + Google Play Billing (expo-in-app-purchases)
- SVG birth chart wheel (react-native-svg)
- **Effort:** 4-6 weeks
- **Value:** Native performance, App Store presence, push notifications, IAP

### Phase 3: Native Features (Months 3-6)
Features that require native APIs not available in React Native.
- Apple Watch complications (Swift, watchOS app)
- iOS 18 widgets (SwiftUI WidgetKit)
- Android widgets (Jetpack Glance)
- Haptic feedback on constellation activation
- **Effort:** 2-4 weeks per feature
- **Value:** Platform differentiation, daily visibility on watch/home screen

---

## 2. Recommended Tech Stack

### Primary: React Native + Expo

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React Native 0.77+ | Cross-platform, large ecosystem |
| Tooling | Expo SDK 52+ | Managed workflow, OTA updates, easy builds |
| Navigation | Expo Router v4 | File-based routing (matches Next.js mental model) |
| State | Zustand or Jotai | Lightweight, no boilerplate |
| API | TanStack Query (React Query) | Caching, background refresh, offline support |
| Charts | react-native-svg | SVG birth chart wheel rendering |
| Animations | react-native-reanimated 3 | 60fps native-thread animations |
| Gestures | react-native-gesture-handler | Touch interactions for chart exploration |
| Push | expo-notifications | FCM (Android) + APNs (iOS) |
| Payments | expo-in-app-purchases | Apple IAP + Google Play Billing |
| Storage | expo-secure-store | Encrypted local storage for user data |
| Fonts | expo-font | Load Cormorant Garamond, Inter, Playfair Display |

### Why NOT Swift/Kotlin Native?

| Factor | React Native/Expo | Swift + Kotlin Native |
|--------|-------------------|----------------------|
| Development time | 4-6 weeks (1 codebase) | 8-12 weeks (2 codebases) |
| Code sharing with web | 30-40% shared logic | 0% |
| Team skill match | JavaScript/TypeScript (same as website) | Requires iOS + Android specialists |
| Update speed | OTA updates via Expo | App Store review required |
| Cost | 1 developer | 2 developers minimum |

**Exception:** If the app needs advanced 3D graphics (equivalent to the website's WebGL cosmos), consider Swift + SceneKit for iOS. React Native's GL bridge has performance limitations for complex shaders.

---

## 3. MVP Feature Priority

### P0 -- Must Ship (Week 1-3)
| Feature | Description | Backend Endpoint |
|---------|-------------|-----------------|
| Onboarding | Multi-step birth data collection (name, date, time, city) | `POST /api/chart` |
| Birth chart | Interactive SVG wheel showing planets, houses, aspects | `POST /api/chart` |
| Daily reading | Personalized reading (Power/Pressure/Trouble format) | `POST /api/daily` |
| Push notifications | Daily horoscope at user's preferred time | `GET /api/transits` |

### P1 -- Second Sprint (Week 4-5)
| Feature | Description | Backend Endpoint |
|---------|-------------|-----------------|
| Compatibility | Two-chart synastry with scores | `POST /api/compat` |
| Ask the Stars | Pay-per-question Claude Q&A | `POST /api/ask` |
| Transit alerts | Push when a planet hits user's natal point | `GET /api/transits` |
| Settings | Notification preferences, language selection | Local storage |

### P2 -- Polish (Week 6-8)
| Feature | Description | Backend Endpoint |
|---------|-------------|-----------------|
| Social (add friends) | See friends' sun signs and daily readings | New: `POST /api/friends` |
| Shareable chart card | Generate image of Big 3 for social media | New: `POST /api/card` |
| Zodiac roast | Humorous personalized reading | New: `POST /api/roast` |
| Weekly/monthly readings | Longer-form forecasts | `POST /api/weekly` |

### P3 -- Backlog
- Apple Watch complications
- Home screen widgets
- Video readings (ElevenLabs + HeyGen)
- Celebrity chart lookup
- Group chart analysis
- Cosmic Year Wrapped

---

## 4. Shared Backend (FastAPI Endpoints)

The mobile app uses the exact same FastAPI backend as the website. All endpoints return JSON.

### Endpoints to Build for Mobile

```
POST /api/auth/register
  Body: { device_id: string }
  Returns: { user_id, token }
  Notes: Anonymous registration. No email required. Device ID is the primary identifier.

POST /api/auth/link-telegram
  Body: { user_id, telegram_id }
  Returns: { success }
  Notes: Optional. Links mobile account to Telegram bot account for cross-platform data.

POST /api/chart
  Body: { date: "1990-03-06", time?: "14:30", city?: "Kyiv" }
  Returns: { chart_id, sun, moon, rising, planets: [...], houses: [...], aspects: [...] }
  Notes: time and city are optional. Without them, houses and rising are unknown.

POST /api/daily
  Body: { chart_id }
  Returns: { reading: { power: string, pressure: string, trouble: string }, date }
  Notes: Cached per chart_id per day. Claude generates on first request.

POST /api/compat
  Body: { chart_id_1, chart_id_2 }
  Returns: { scores: { love, communication, conflict, trust }, summary }

GET /api/transits
  Returns: { planets: [...], notable_transits: [...] }

POST /api/ask
  Body: { chart_id, question: string }
  Returns: { answer: string, cost_stars: int }
  Notes: Premium feature. Deducts from user's credit balance.

POST /api/push/register
  Body: { user_id, push_token, platform: "ios"|"android" }
  Returns: { success }

GET /api/push/preferences
POST /api/push/preferences
  Body: { daily_time: "09:00", transit_alerts: bool, weekly: bool }
```

### Authentication Strategy
- **Anonymous accounts** -- No email, no password. User gets a `user_id` + `token` on first launch.
- **Device ID** as primary identifier (expo-secure-store)
- **Optional** Telegram linking for cross-platform data sync
- **Optional** Apple Sign In / Google Sign In for account recovery

---

## 5. UI/UX Patterns (Match Website)

### Dark Theme
The app MUST use a dark theme matching the website's Celestial Noir palette. No light mode at launch.

```
Background:       #0D0D1A (Void Black)
Card background:  rgba(26, 26, 62, 0.6) with blur
Accent:           #D4AF37 (Celestial Gold)
Interactive:      #7B68EE (Medium Slate Blue)
Text primary:     #F5F0E8 (Warm Ivory)
Text secondary:   #9B96A8 (Muted Lavender)
Success:          #4ECDC4 (Cosmic Teal)
Warning:          #E8524A (Mars Red)
```

### Glass Morphism
Cards and modals use frosted glass effect:
```jsx
// React Native approach
<View style={{
  backgroundColor: 'rgba(26, 26, 62, 0.6)',
  borderWidth: 1,
  borderColor: 'rgba(212, 175, 55, 0.15)',
  borderRadius: 16,
}}>
  <BlurView intensity={20} tint="dark" />
</View>
```

Use `expo-blur` for the `BlurView` component.

### Typography
| Role | Font | Weight | Size (mobile) |
|------|------|--------|---------------|
| Headlines | Playfair Display | 700 | 28-32px |
| Section headers | Cormorant Garamond | 500 | 20-24px |
| Body | Inter | 400 | 15-16px |
| Labels | Cormorant Garamond | 500 | 12-14px |
| Small | Inter | 400 | 12px |

Load fonts via `expo-font`:
```bash
npx expo install expo-font @fontsource/inter @fontsource/playfair-display @fontsource/cormorant-garamond
```

### Navigation Structure
```
Tab Navigator (bottom tabs, glass morphism background)
  |
  +-- Home (daily reading + cosmic weather)
  +-- Chart (birth chart wheel + planet readings)
  +-- Compatibility (synastry checker)
  +-- Ask (Ask the Stars Q&A)
  +-- Profile (settings, subscription, notifications)

Stack Navigator (overlays)
  +-- Onboarding (4-5 screens, shown once)
  +-- Reading Detail (full reading view)
  +-- Transit Alert Detail
  +-- Payment / Subscription
```

### Tab Bar Icons
Use gold outline icons on void black background. Active tab: filled gold. Inactive: outline muted lavender.
- Home: crescent moon
- Chart: circle with cross (chart wheel)
- Compatibility: two overlapping circles
- Ask: star with question mark
- Profile: person silhouette

---

## 6. Push Notification Strategy

### Daily Horoscope (Primary Retention Driver)
- **Time:** User-selectable (default: 9:00 AM local time)
- **Content:** 2-line teaser of today's reading + "Tap to read your full cosmic weather"
- **Backend:** APScheduler job computes readings at 04:00 UTC, queues push notifications per user's timezone
- **Frequency:** Daily (can be turned off)

### Transit Alerts (VIP Only)
- **Trigger:** When a transiting planet forms an exact aspect to user's natal planet
- **Content:** "Mercury is entering your 7th house today -- communication in relationships is amplified"
- **Backend:** Hourly transit scan against VIP users' charts
- **Frequency:** 2-5 per week depending on chart

### Weekly Summary (VIP Only)
- **Time:** Monday 8:00 AM local
- **Content:** "Your week ahead: [Sun emoji] Power in career, [Warning emoji] Tension in relationships"
- **Frequency:** Weekly

### Re-engagement (7-day inactive)
- **Trigger:** User hasn't opened app in 7 days
- **Content:** "The stars have shifted since we last spoke... [current transit] is affecting your chart"
- **Frequency:** Once per inactivity period

### Implementation
```bash
npx expo install expo-notifications expo-device expo-constants
```

Register push token on app launch -> send to `POST /api/push/register`. Backend uses Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS, both via a unified library like `firebase-admin` Python SDK.

---

## 7. Payment Integration

### Apple In-App Purchases (iOS)
| Product | Type | Price | Apple Cut |
|---------|------|-------|-----------|
| VIP Monthly | Auto-renewable subscription | $6.49/mo | 30% (15% after Y1) |
| VIP Annual | Auto-renewable subscription | $64.99/yr | 30% (15% after Y1) |
| Ask the Stars (3 pack) | Consumable | $2.99 | 30% |
| Ask the Stars (10 pack) | Consumable | $4.99 | 30% |
| Birth Chart Reading | Non-consumable | $3.99 | 30% |
| Compatibility Report | Non-consumable | $3.99 | 30% |
| Year-Ahead Forecast | Non-consumable | $9.99 | 30% |

### Google Play Billing (Android)
Same products, same prices. Google takes 15% for subscriptions (first $1M), 30% for one-time.

### Implementation
```bash
npx expo install expo-in-app-purchases
```

**Server-side receipt validation is mandatory.** Never trust the client. Backend endpoint:
```
POST /api/purchase/verify
  Body: { platform: "ios"|"android", receipt: string }
  Returns: { valid: bool, product_id, expires_at? }
```

Use Apple's `verifyReceipt` endpoint and Google Play Developer API for server-side validation.

### Strategy: Drive Conversions Through Web/Telegram
Apple and Google take 15-30% of revenue. The website (Stripe, 2.9%) and Telegram (Stars, 0%) have far lower fees. The app's primary role is retention and push notifications, not conversion. Upsell messaging should direct users to the Telegram bot or website for purchases when possible.

---

## 8. Chart Visualization (SVG Wheel)

### Approach
Use `react-native-svg` to render a circular birth chart wheel.

```bash
npx expo install react-native-svg
```

### Chart Wheel Components
```
<Svg viewBox="0 0 400 400">
  {/* Outer ring: 12 zodiac sign segments */}
  {zodiacSigns.map(sign => <Path d={signArc} fill={signColor} />)}

  {/* House dividers: 12 lines from center */}
  {houses.map(house => <Line ... stroke="#D4AF37" strokeWidth={0.5} />)}

  {/* Planet glyphs: positioned by degree */}
  {planets.map(planet => <Text x={planetX} y={planetY}>{planetGlyph}</Text>)}

  {/* Aspect lines: connecting planets */}
  {aspects.map(aspect => <Line ... stroke={aspectColor} strokeDasharray={dashPattern} />)}
</Svg>
```

### Planet Glyphs (Unicode)
| Planet | Glyph | Unicode |
|--------|-------|---------|
| Sun | ☉ | U+2609 |
| Moon | ☽ | U+263D |
| Mercury | ☿ | U+263F |
| Venus | ♀ | U+2640 |
| Mars | ♂ | U+2642 |
| Jupiter | ♃ | U+2643 |
| Saturn | ♄ | U+2644 |
| Uranus | ♅ | U+2645 |
| Neptune | ♆ | U+2646 |
| Pluto | ♇ | U+2647 |

### Aspect Colors
| Aspect | Color | Dash |
|--------|-------|------|
| Conjunction (0 deg) | #D4AF37 (gold) | Solid |
| Trine (120 deg) | #4ECDC4 (teal) | Solid |
| Sextile (60 deg) | #7B68EE (blue) | Dashed |
| Square (90 deg) | #E8524A (red) | Solid |
| Opposition (180 deg) | #E8524A (red) | Dashed |

---

## 9. Offline Support

### What to Cache Locally
| Data | Storage | TTL | Size |
|------|---------|-----|------|
| User's natal chart | expo-secure-store | Permanent | ~2KB |
| Today's daily reading | AsyncStorage | 24 hours | ~1KB |
| This week's weekly reading | AsyncStorage | 7 days | ~3KB |
| Planet-in-sign readings (all 10) | AsyncStorage | 30 days | ~10KB |
| Push notification history | AsyncStorage | 30 days | ~5KB |

### Offline Behavior
- App opens -> show cached daily reading immediately (no loading spinner)
- Background fetch new reading when network available
- "Last updated: 2 hours ago" indicator
- Offline indicator in navbar (subtle, non-intrusive)
- Chart wheel renders from cached natal chart data (no network needed)

### Implementation
Use TanStack Query's built-in caching:
```typescript
const { data } = useQuery({
  queryKey: ['daily', chartId, today],
  queryFn: () => fetchDailyReading(chartId),
  staleTime: 1000 * 60 * 60, // 1 hour
  cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  placeholderData: getCachedReading(chartId, today),
});
```

---

## 10. App Store Optimization (ASO)

### iOS App Store
- **Title:** "Olivia Arcana: Birth Chart & Horoscope" (30 char max for title)
- **Subtitle:** "AI Astrology & Daily Readings" (30 char max)
- **Keywords:** horoscope, birth chart, astrology, zodiac, natal chart, compatibility, tarot, daily horoscope, star sign, transit
- **Category:** Primary: Lifestyle, Secondary: Entertainment
- **Age Rating:** 4+
- **Screenshots:** 6.7" iPhone 16 Pro Max + 12.9" iPad Pro, dark theme showcasing chart wheel, daily reading, compatibility

### Google Play Store
- **Title:** "Olivia Arcana - AI Astrology" (50 char max)
- **Short Description:** "Personal birth chart, daily horoscope & compatibility from NASA planetary data" (80 char max)
- **Category:** Lifestyle
- **Content Rating:** Everyone

### ASO Keywords (prioritized)
1. birth chart (high volume, medium competition)
2. horoscope today (very high volume, high competition)
3. zodiac compatibility (medium volume, low competition)
4. natal chart (medium volume, low competition)
5. astrology app (high volume, high competition)
6. daily horoscope (very high volume, very high competition)
7. tarot reading (high volume, medium competition)
8. transit astrology (low volume, very low competition)

---

## 11. Privacy-First Architecture

### No Email Required
- Account creation uses anonymous device ID only
- No personal data collected beyond birth date/time/city (needed for chart)
- Birth data stored encrypted at rest (AES-256)
- User can delete all data from Settings -> "Delete My Data"

### Data Storage
- Birth data: encrypted in backend database (SQLite/Postgres)
- Readings: cached locally, server-side generation only
- Push tokens: stored server-side, deleted on uninstall detection
- No third-party analytics SDKs (no Google Analytics, no Facebook SDK)
- Analytics: privacy-respecting PostHog (self-hosted) or Plausible

### App Tracking Transparency (iOS)
- No tracking, so ATT prompt is NOT needed
- Set `NSUserTrackingUsageDescription` to empty (not required since we don't track)
- This is a competitive advantage: "We don't track you. We read the stars, not your data."

### GDPR Compliance
- Data export: `GET /api/user/export` returns all stored user data as JSON
- Data deletion: `DELETE /api/user` removes all user data permanently
- No data sharing with third parties
- Privacy policy URL required for App Store / Play Store submission

---

## 12. Reference Documents

| Document | Path | Relevant Sections |
|----------|------|-------------------|
| Feature Spec | `docs/COSTAR_FEATURE_SPEC.md` | Feature inventory, architecture, sprint plan |
| Business Architecture | `docs/BUSINESS_ARCHITECTURE.md` | Mobile app section, payment rails, pricing tiers |
| Design System | `docs/DESIGN_SYSTEM.md` | Celestial Noir palette, typography, card templates |
| Viral Features | `docs/VIRAL_FEATURES.md` | Shareable chart card, compatibility link, roast |
| Growth Playbook | `docs/GROWTH_PLAYBOOK.md` | Push notification strategy, re-engagement |
| Asset Specs | `docs/ASSET_SPECIFICATIONS.md` | Image dimensions and templates for shareable cards |
