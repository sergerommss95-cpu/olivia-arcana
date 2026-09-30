# Olivia Arcana — Ship-Readiness Audit
**Date:** 2026-05-04  
**Auditor:** Claude Sonnet 4.6  
**Scope:** Pricing alignment + brand drift across all 15 routes (desktop 1280×800 + mobile 414×896)

---

## §1 — Pricing Alignment

### Verdict: **DRIFTED**

The code retains the old 4-tier model from baseline 2026-04-27. The canonical business plan §3 specifies a simplified **2-tier model** (Free + VIP) and revised add-on prices. Neither the subscription tiers nor the add-on table in code match the plan.

### Comparison Table

| Item | Code (`payments.ts`) | Plan §3 Canonical | Status |
|------|---------------------|-------------------|--------|
| Free | $0 | $0 | ✓ |
| Insight monthly | $4.99 | — (tier removed) | ✗ DRIFT |
| Insight annual | $39 | — (tier removed) | ✗ DRIFT |
| Premium monthly | $14.99 | — (tier removed) | ✗ DRIFT |
| Premium annual | $119 | — (tier removed) | ✗ DRIFT |
| VIP monthly | $34.99 | **$6.50** | ✗ DRIFT |
| VIP annual | $299 | **$65** (eff. $5.42/mo) | ✗ DRIFT |
| AI Avatar Reading | — | $35 | ✗ MISSING |
| Live Expert Video | $49.99 (generic "30-min") | **$65** | ✗ DRIFT |
| Physical Deck | — | $49 | ✗ MISSING |
| Collector Edition | — | $89 | ✗ MISSING |

### JSON-LD in `/pricing/page.tsx`

The JSON-LD block (`productJsonLd`) derives all offers dynamically from `PRICING` (line 30–36). It currently emits Insight, Premium, and VIP offers at old prices — and will auto-correct once `PRICING` is fixed. **No separate edit needed in `page.tsx`**, but the stale tier names ("Insight Monthly", "Insight Annual", "Premium Monthly", "Premium Annual") will vanish once removed from the constant.

**Secondary issue in plan HTML:** `docs/business_plan_pdf/index-compact.html` §3 tier cards (lines 500–518) still show the old 4-tier prices. The competitor comparison table in the same file (line 571) already reads $6.50/$65, creating an internal inconsistency.

### Concrete Edits Required

#### `website/src/lib/payments.ts`

**Line 12** — collapse `Tier` type:
```ts
// BEFORE
export type Tier = "free" | "insight" | "premium" | "vip";

// AFTER
export type Tier = "free" | "vip";
```

**Lines 15–24** — collapse `PriceKey` type:
```ts
// BEFORE
export type PriceKey =
  | "insight_monthly" | "insight_annual"
  | "premium_monthly" | "premium_annual"
  | "vip_monthly" | "vip_annual"
  | "addon_birth_chart" | "addon_compatibility"
  | "addon_celtic_cross" | "addon_year_ahead"
  | "addon_video_reading" | "addon_solar_return";

// AFTER
export type PriceKey =
  | "vip_monthly" | "vip_annual"
  | "addon_birth_chart" | "addon_compatibility"
  | "addon_celtic_cross" | "addon_year_ahead"
  | "addon_ai_avatar" | "addon_live_expert"
  | "addon_physical_deck" | "addon_collector_deck"
  | "addon_solar_return";
```

**Lines 27–32** — update `PRICING` constant:
```ts
// BEFORE
export const PRICING = {
  free:    { monthly: 0,     annual: 0 },
  insight: { monthly: 4.99,  annual: 39 },
  premium: { monthly: 14.99, annual: 119 },
  vip:     { monthly: 34.99, annual: 299 },
} as const;

// AFTER
export const PRICING = {
  free: { monthly: 0,    annual: 0 },
  vip:  { monthly: 6.50, annual: 65 },
} as const;
```

**Lines 35–42** — update `ADDONS` constant:
```ts
// BEFORE
export const ADDONS = {
  addon_birth_chart:    { name: "Full Natal Chart Reading",  price: 9.99 },
  addon_compatibility:  { name: "Synastry Report",           price: 9.99 },
  addon_celtic_cross:   { name: "Celtic Cross Tarot",        price: 4.99 },
  addon_year_ahead:     { name: "Year-Ahead Forecast",       price: 19.99 },
  addon_solar_return:   { name: "Solar Return Reading",      price: 14.99 },
  addon_video_reading:  { name: "30-min Video Reading",      price: 49.99 },
} as const;

// AFTER
export const ADDONS = {
  addon_birth_chart:    { name: "Full Natal Chart Reading",  price: 9.99 },
  addon_compatibility:  { name: "Synastry Report",           price: 9.99 },
  addon_celtic_cross:   { name: "Celtic Cross Tarot",        price: 4.99 },
  addon_year_ahead:     { name: "Year-Ahead Forecast",       price: 19.99 },
  addon_solar_return:   { name: "Solar Return Reading",      price: 14.99 },
  addon_ai_avatar:      { name: "AI Avatar Reading (1 hr)",  price: 35 },
  addon_live_expert:    { name: "Live Expert Video (24 h)",  price: 65 },
  addon_physical_deck:  { name: "Physical Deck + Shipping",  price: 49 },
  addon_collector_deck: { name: "Collector Edition Deck",    price: 89 },
} as const;
```

After these changes, `tierLabel()` (line 125) must drop `"insight"` and `"premium"` branches, and `Pricing.tsx` `TIERS` array must drop the Insight/Premium tier objects and their `monthlyKey`/`annualKey` references.

---

## §2 — Brand Drift Score Table

**Axes:**
- **a** — Indigo + gold palette (no warm tones) 
- **b** — Negative space ≥ 40%
- **c** — No cyberpunk / no dark cosmic
- **d** — Brand consistency (font, accents, motifs)

Score 0–5. **Bold** = DRIFT flag (< 3).

| Route | Viewport | a | b | c | d | Notes |
|-------|----------|---|---|---|---|-------|
| `/` | desktop | 5 | 5 | 5 | 5 | Perfect hero: indigo nebula, gold heading, celestial orb, ample space |
| `/` | mobile | 5 | 4 | 5 | 5 | Gold CTA dominant, gold nav highlight, on-brand bottom nav |
| `/pricing` | desktop | 5 | 4 | 5 | 5 | Dark indigo bg, gold Annual toggle pill, cards in fold |
| `/pricing` | mobile | 4 | 3 | 5 | 4 | Card sections crowd viewport; "$0 forever" copy reads well |
| `/chart` | desktop | 5 | 5 | 5 | 5 | Glass form on nebula, maximum negative space, minimal |
| `/chart` | mobile | 5 | 5 | 5 | 5 | Same clean composition on mobile |
| `/synastry` | desktop | 5 | 4 | 5 | 5 | Two-column form, gold labels, indigo bg |
| `/synastry` | mobile | 5 | 4 | 5 | 5 | Responsive columns collapse cleanly |
| `/sample` | desktop | 3 | 4 | 4 | 4 | Nebula photo has visible dusty amber/warm earth tones in rock formations |
| `/sample` | mobile | 3 | 3 | 4 | 4 | Same warm-nebula issue, tighter crop amplifies it |
| `/portrait` | desktop | 5 | 5 | 5 | 5 | Minimal auth-gate form, gold label, pure indigo |
| `/portrait` | mobile | 5 | 5 | 5 | 5 | Excellent negative space maintained |
| `/ask` | desktop | 4 | 4 | 4 | 4 | Atmospheric, text floats on nebula; moody but not cyberpunk |
| `/ask` | mobile | 3 | 4 | 3 | 4 | Bright warm-white light burst upper-left/right bleeds warm tones |
| `/cosmos` | desktop | 4 | 3 | 5 | 4 | Planet-transit list data-dense; negative space drops to ~35% |
| `/cosmos` | mobile | 3 | **2** | 4 | 3 | Data list fills full viewport; moon-phase orb blown-out bright; neg space ~20% |
| `/transits` | desktop | 5 | 5 | 5 | 5 | Auth-gate: centered headline on nebula, minimal |
| `/transits` | mobile | 3 | 4 | 3 | 4 | Same bright nebula glare issue on mobile |
| `/timing` | desktop | 5 | 5 | 5 | 5 | Auth-gate: clean centered layout |
| `/timing` | mobile | 3 | 4 | 3 | 4 | Bright warm-white nebula glare visible |
| `/journal` | desktop | 5 | 5 | 5 | 5 | Almost entirely nebula + gold heading — beautiful |
| `/journal` | mobile | 3 | 4 | 3 | 4 | Bright warm-white glare, partially occludes heading |
| `/oracle-letter` | desktop | **2** | 4 | 3 | **2** | Pure black background — no indigo, no nebula, brand identity absent |
| `/oracle-letter` | mobile | **2** | 4 | 3 | **2** | Same pure-black empty-state; only outline button, no gold accents |
| `/onboarding` | desktop | 5 | 5 | 5 | 5 | Nebula bg, gold-bordered input field, centered dialog |
| `/onboarding` | mobile | 4 | 4 | 5 | 4 | Slightly less negative space; otherwise clean |
| `/daily` | desktop | 3 | 3 | 4 | 3 | Zodiac wheel uses multicolor planet glyphs (orange, red, green) — warm-tone violation |
| `/daily` | mobile | 3 | 3 | 4 | 3 | Same wheel, plus cropped viewport tightens space |
| `/story` | desktop | 4 | 5 | 4 | 3 | Loading/auth state, nebula bg dominant; text barely legible — readability risk |
| `/story` | mobile | 3 | 4 | 3 | 3 | Bright warm light burst dominates upper half; feels more "dark cosmic" than brand |

**DRIFT flags (score < 3):**
- `/oracle-letter` desktop — a=**2**, d=**2**
- `/oracle-letter` mobile — a=**2**, d=**2**
- `/cosmos` mobile — b=**2**

---

## §3 — Top 5 Highest-Impact Fixes

### Fix 1 — `/oracle-letter`: Restore indigo nebula background on empty state
**Impact: CRITICAL — brand identity score 2/5 on both viewports**

The empty-state screen renders on a near-pure `#09090b` black background with zero nebula, zero indigo, and minimal gold. Every other route uses the nebula backdrop. The component needs the standard `bg-nebula` / `bg-[#08061a]` class plus the global nebula `::before` overlay applied to its root container.

File: `website/src/app/oracle-letter/page.tsx` (or its layout)  
Fix: Add `className="min-h-screen bg-[#08061a] relative"` and the nebula background div that the rest of the app uses.

### Fix 2 — Pricing code: migrate to canonical 2-tier model (Free + VIP $6.50/$65)
**Impact: HIGH — revenue model mismatch; JSON-LD incorrect for SEO**

As detailed in §1, `website/src/lib/payments.ts` lines 12, 15–24, 27–32, and 35–42 all need updating. Cascade: `Pricing.tsx` `TIERS` array (drop Insight/Premium objects), `tierLabel()` helper. The JSON-LD in `pricing/page.tsx` auto-corrects.

Also update `docs/business_plan_pdf/index-compact.html` lines 500–518 to replace the 4-tier card grid with Free + VIP cards at $0 and $6.50/mo ($65/yr).

### Fix 3 — `/daily`: Replace warm-color planet glyphs on zodiac wheel
**Impact: HIGH — warm-tone violation across both viewports**

The zodiac wheel on `/daily` renders planet glyphs with standard astrological colors (Mars=red/orange, Jupiter=blue, etc.). These violate the no-warm-tones rule. Replace with the brand palette: gold (`#d4af37`) for active/highlighted planets, `cosmic-teal` (`#4ECDC4`) for transiting bodies, muted white/lavender for neutral — eliminating all reds and oranges.

File: the wheel/chart rendering component referenced from `website/src/app/daily/page.tsx`.

### Fix 4 — Mobile nebula glare: reduce bright warm-white light burst
**Impact: MEDIUM — affects 6 mobile routes (/ask, /transits, /timing, /journal, /story, /cosmos)**

The nebula background image has an overexposed bright warm-white light burst (upper region) that reads as a warm-tone violation and leans "dark cosmic mystery/explosion" rather than refined indigo elegance. Solutions: add a CSS `filter: brightness(0.8) hue-rotate(10deg)` on the nebula `<img>` or `::before` pseudo-element on mobile breakpoints, or apply an `rgba(8, 6, 26, 0.35)` indigo overlay at higher opacity on mobile to cool and dim the bright areas.

File: the global nebula background component/CSS (check `website/src/app/globals.css` and layout `::before` pseudo-element).

### Fix 5 — `/sample`: Add indigo color-grade overlay to tame warm nebula tones
**Impact: MEDIUM — dusty amber earth tones in Pillars-of-Creation imagery, both viewports**

The sample reading page uses a nebula photo with visible warm amber/dusty-brown rock formations that violate the no-warm-tones brand rule. Add a stronger indigo overlay (`mix-blend-mode: multiply` or `rgba(20, 10, 60, 0.4)` absolute overlay) on top of the background image to neutralize the amber tones while preserving the atmospheric depth.

File: `website/src/app/sample/page.tsx` or its associated CSS/component.

---

## §4 — Screenshot File Paths

All 30 screenshots captured successfully (15 routes × 2 viewports). No failures.

```
website/AUDIT_2026-05-04/screenshots/
├── home_desktop.png
├── home_mobile.png
├── pricing_desktop.png
├── pricing_mobile.png
├── chart_desktop.png
├── chart_mobile.png
├── synastry_desktop.png
├── synastry_mobile.png
├── sample_desktop.png
├── sample_mobile.png
├── portrait_desktop.png
├── portrait_mobile.png
├── ask_desktop.png
├── ask_mobile.png
├── cosmos_desktop.png
├── cosmos_mobile.png
├── transits_desktop.png
├── transits_mobile.png
├── timing_desktop.png
├── timing_mobile.png
├── journal_desktop.png
├── journal_mobile.png
├── oracle-letter_desktop.png
├── oracle-letter_mobile.png
├── onboarding_desktop.png
├── onboarding_mobile.png
├── daily_desktop.png
├── daily_mobile.png
├── story_desktop.png
└── story_mobile.png
```

---

*Audit tooling: Playwright 1.56.1 · Chromium (opt/pw-browsers/chromium-1194) · Next.js 16.2.2 dev server*
