# Handoff: Pricing & Payments System

## Overview

Olivia Arcana uses a **Stripe-powered freemium model** with two tiers (Free, VIP) and à la carte one-time purchases. All payment logic runs on a **FastAPI backend (Railway)**. The Next.js frontend is a static export — it creates checkout sessions via API calls and redirects to Stripe-hosted checkout.

---

## Pricing Tiers

### Free ($0)
- Daily horoscope
- Card of the Day (veil reveal)
- Basic zodiac profiles
- Academy (first lessons free)
- AI oracle (limited)

### VIP ($6.50/month or $65/year)
- Everything in Free
- Full natal chart readings
- Unlimited AI oracle
- Full Academy access (207 lessons)
- Transit alerts
- Synastry reports
- Journal prompts
- Priority features

### À La Carte (one-time purchases)
| Product | Price | PriceKey |
|---------|-------|----------|
| Birth Chart Reading | $3.90 | `birth_chart` |
| Compatibility Report | $3.90 | `compatibility` |
| Celtic Cross Spread | $1.95 | `celtic_cross` |
| Year Ahead Forecast | $6.50 | `year_ahead` |
| Video Reading | $39.99 | `video_reading` |

---

## File Map

| File | Purpose |
|------|---------|
| `src/lib/payments.ts` | API client — checkout, portal, status |
| `src/hooks/useSubscription.tsx` | React Context for subscription state |
| `src/components/Pricing.tsx` | Pricing page UI (tiers + toggle + à la carte) |
| `src/components/CheckoutButton.tsx` | Reusable Stripe checkout trigger |
| `src/components/Paywall.tsx` | VIP content gate component |
| `src/components/UpgradePrompt.tsx` | Inline upgrade nudge |
| `src/components/VipBadge.tsx` | VIP status badge |
| `src/app/checkout/success/page.tsx` | Post-payment success page |
| `src/app/checkout/cancel/page.tsx` | Payment canceled page |
| `src/app/account/billing/page.tsx` | Subscription management |

---

## Architecture

```
User clicks "Subscribe" / "Buy"
  └─ CheckoutButton.tsx
       └─ createCheckoutSession(priceKey)  [payments.ts]
            └─ POST /api/payments/checkout  [FastAPI backend]
                 └─ Creates Stripe Checkout Session
                      └─ Returns checkout_url
                           └─ window.location.href = checkout_url
                                └─ Stripe hosted checkout page
                                     └─ Success → /checkout/success?session_id=...
                                     └─ Cancel → /checkout/cancel
```

### Backend (FastAPI on Railway)
The backend handles:
1. **`POST /api/payments/checkout`** — Creates Stripe Checkout Session with price_key → Stripe Price ID mapping
2. **`POST /api/payments/portal`** — Creates Stripe Customer Portal session for self-service billing
3. **`GET /api/payments/status`** — Returns current subscription tier, status, purchases
4. **Stripe Webhooks** — Listens for `checkout.session.completed`, `customer.subscription.*`, `invoice.*` events to update Supabase

### Frontend API Client (`payments.ts`)

```typescript
// Price keys (match backend PRICE_MAP)
type PriceKey = "vip_monthly" | "vip_annual" | "birth_chart" | "compatibility" 
              | "celtic_cross" | "year_ahead" | "video_reading";

// Core functions
createCheckoutSession(priceKey: PriceKey): Promise<string>  // returns checkout URL
getSubscriptionStatus(): Promise<SubscriptionStatus>         // current tier + purchases
createPortalSession(): Promise<string>                       // returns portal URL
hasPurchased(status, readingType): boolean                   // check one-time purchase
```

All requests include JWT from `localStorage.getItem("olivia_token")` via Bearer auth.

### Subscription Context (`useSubscription.tsx`)

```typescript
const { isVip, isLoading, subscribe, manageSubscription } = useSubscription();
```

- Wraps the app in `SubscriptionProvider`
- Fetches status on mount (if logged in)
- `isVip` — boolean, true for active/trialing VIP
- `subscribe(priceKey)` — triggers checkout flow
- `manageSubscription()` — opens Stripe Customer Portal

---

## User Flows

### New Subscription
1. User visits `/` or any page with Pricing section
2. Selects Monthly ($6.50) or Annual ($65) via toggle
3. Clicks "Subscribe" → `CheckoutButton` → `createCheckoutSession("vip_monthly")`
4. Redirected to Stripe Checkout (hosted page)
5. Completes payment → redirected to `/checkout/success?session_id=...`
6. Success page confirms subscription, shows VIP badge
7. Webhook updates Supabase: `tier: "vip"`, `status: "active"`

### One-Time Purchase
1. User scrolls to "À La Carte" section on Pricing
2. Clicks "Purchase" on a reading → `createCheckoutSession("birth_chart")`
3. Same Stripe flow → `/checkout/success`
4. Purchase recorded in `status.purchases[]`
5. Content unlocked via `hasPurchased(status, "birth_chart")`

### Manage Subscription
1. User visits `/account/billing`
2. Page shows current tier, status, period end, purchases
3. "Manage Subscription" button → `createPortalSession()` → Stripe Portal
4. Can cancel, change plan, update payment method

### Paywall Gating
```tsx
// In any protected component:
<Paywall>
  <PremiumContent />
</Paywall>
// Shows UpgradePrompt if !isVip, children if isVip
```

---

## Subscription Status Shape

```typescript
interface SubscriptionStatus {
  tier: "free" | "vip";
  status: "none" | "active" | "trialing" | "past_due" | "canceled";
  is_vip: boolean;
  period_end: string | null;
  cancel_at_period_end: boolean;
  purchases: Array<{
    id: number;
    reading_type: string;      // matches PriceKey
    has_content: boolean;       // true once reading is generated
    created_at: string | null;
  }>;
}
```

---

## Pricing UI (`Pricing.tsx`)

- **Billing toggle**: Monthly ↔ Annual with animated switch
- **Two tier cards**: Free (ghost outline) and VIP (gold gradient border)
- **Feature lists**: Checkmarks for included, dashes for excluded
- **Annual savings badge**: "Save 17%" shown on annual toggle
- **À la carte section**: Below tiers, grid of one-time purchases
- **VIP state**: If already VIP, shows "Current Plan" badge + "Manage" button instead of subscribe
- Uses `ScrollFloat` for scroll-triggered entrance animation
- Uses `MagneticButton` for CTA buttons
- Fully responsive (stacked on mobile)

---

## Key Considerations

1. **Static export** — No server-side session validation. All auth is JWT-based client-side. The `olivia_token` in localStorage is the session credential.
2. **Backend is the source of truth** — Never trust client-side `isVip`. The backend validates JWT + checks Supabase on every API call.
3. **Stripe webhooks are critical** — Subscription status changes (cancel, renew, payment failure) are only captured via webhooks to the backend.
4. **Environment variable**: `NEXT_PUBLIC_API_URL` must point to the Railway FastAPI instance.
5. **Checkout URLs**: Success/cancel URLs use `window.location.origin` — works in any environment.
