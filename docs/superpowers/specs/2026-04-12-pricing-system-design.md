# Olivia Arcana — Pricing & Payment System Design

**Date:** 2026-04-12
**Status:** Draft
**Goal:** Add payment infrastructure to the website so users can subscribe to VIP and purchase individual readings via Stripe.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js static export on Netlify)                    │
│                                                                 │
│  Pricing.tsx ──→ CheckoutButton ──→ POST /api/payments/checkout │
│                                        │                        │
│  Paywall.tsx ──→ useSubscription() ──→ GET /api/payments/status │
│                                        │                        │
│  Success page ←── Stripe redirect ←────┘                        │
│  Account/Billing ──→ POST /api/payments/portal                  │
└─────────────────────────────────────────────────────────────────┘
        │                                    ▲
        ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                              │
│                                                                 │
│  api/payments.py                                                │
│    POST /checkout   → stripe.checkout.Session.create()          │
│    POST /webhook    → handle Stripe events                      │
│    GET  /status     → return user tier + features               │
│    POST /portal     → stripe.billing_portal.Session.create()    │
│                                                                 │
│  db/models.py                                                   │
│    User.stripe_customer_id                                      │
│    User.subscription_tier    ("free" | "vip")                   │
│    User.subscription_status  ("none"|"active"|"past_due"|...)   │
│    User.subscription_expires_at                                 │
│    Payment table (immutable ledger)                              │
│    Purchase table (one-time reading purchases)                  │
└─────────────────────────────────────────────────────────────────┘
        │                                    ▲
        ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│  STRIPE                                                         │
│                                                                 │
│  Products:                                                      │
│    - VIP Monthly ($6.50/mo, recurring)                          │
│    - VIP Annual ($65/yr, recurring)                             │
│    - Birth Chart ($3.90, one-time)                              │
│    - Compatibility ($3.90, one-time)                            │
│    - Celtic Cross ($1.95, one-time)                             │
│    - Year-Ahead ($6.50, one-time)                               │
│    - Video Reading ($39.99, one-time)                           │
│                                                                 │
│  Webhooks → POST /api/payments/webhook                          │
│    checkout.session.completed                                   │
│    customer.subscription.updated                                │
│    customer.subscription.deleted                                │
│    invoice.payment_failed                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Pricing Strategy

### Tiers

| Tier | Price | Billing | Free Trial |
|------|-------|---------|------------|
| Free | $0 | — | — |
| VIP Monthly | $6.50/mo | Recurring | 3-day free trial |
| VIP Annual | $65/yr | Recurring | 3-day free trial |

### A la carte readings (one-time purchase)

| Reading | Price | Stripe Mode |
|---------|-------|-------------|
| Birth Chart | $3.90 | payment |
| Compatibility Report | $3.90 | payment |
| Celtic Cross Spread | $1.95 | payment |
| Year-Ahead Forecast | $6.50 | payment |
| Video Reading | $39.99 | payment |

### Decision: No credits system at launch
"Ask the Stars" credit bundles add UX complexity (balance tracking, depletion UX, refill prompts) without proven demand. Ship VIP + a la carte first. Add credits as a Phase 2 optimization once there's usage data.

### Conversion funnel
```
Visit site → Free onboarding → Daily usage (5 msg limit) → Hit limit → Upgrade prompt → Stripe Checkout → VIP
                                  └→ Try reading → Teaser preview → Buy full reading → A la carte purchase
```

## 3. Key Decisions

### Payment provider: Stripe
- Already planned in BUSINESS_ARCHITECTURE.md
- Best-in-class subscription billing
- Stripe Checkout = hosted payment page, zero PCI burden
- Customer Portal = self-service billing management
- Handles Apple Pay, Google Pay, 3D Secure, 25+ currencies
- Tax calculation available (Stripe Tax)

### Checkout flow: Stripe Checkout (redirect)
- Frontend creates checkout session via backend API
- User redirected to Stripe-hosted payment page
- After payment, redirected back to success/cancel URL
- Why not embedded Elements: static export can't do server-side rendering of payment intents, and redirect is simpler + more trusted by users

### Subscription state: Backend DB synced via webhooks
- Stripe is source of truth for billing
- Backend DB stores denormalized subscription fields on User for fast reads
- Webhooks keep backend in sync with Stripe
- Frontend reads tier from backend API, never directly from Stripe
- 3-day grace period on expiration (matches bot behavior)

### Feature gating: Hybrid server + client
- **Server-side:** API endpoints for premium features check `user.subscription_tier` and return 403 for non-VIP
- **Client-side:** `useSubscription()` hook provides tier, `<Paywall>` component wraps premium UI
- **Why hybrid:** Server-side alone works but gives bad UX (error after click). Client-side alone is insecure (can be bypassed). Hybrid = good UX + secure.

### Billing management: Stripe Customer Portal
- Users can cancel, update payment method, view invoices
- Zero custom UI needed — Stripe hosts it
- Backend creates portal session, frontend redirects

## 4. Database Schema Changes

### User model additions (backend/db/models.py)
```python
# Payment & subscription fields
stripe_customer_id = Column(String(255), nullable=True, unique=True)
subscription_tier = Column(String(20), default="free")         # "free" | "vip"
subscription_status = Column(String(20), default="none")       # "none" | "active" | "past_due" | "canceled" | "trialing"
subscription_stripe_id = Column(String(255), nullable=True)    # Stripe subscription ID
subscription_current_period_end = Column(DateTime, nullable=True)
subscription_cancel_at_period_end = Column(Boolean, default=False)
```

### New Payment table
```python
class Payment(Base):
    id, user_id, stripe_session_id, stripe_payment_intent_id
    type: "subscription" | "one_time"
    product: "vip_monthly" | "vip_annual" | "birth_chart" | etc.
    amount_cents: int
    currency: str
    status: "pending" | "completed" | "failed" | "refunded"
    created_at: datetime
```

### New Purchase table (for a la carte readings)
```python
class Purchase(Base):
    id, user_id, payment_id
    reading_type: str     # "birth_chart" | "compatibility" | etc.
    reading_data: Text    # JSON content (generated after payment)
    created_at: datetime
```

## 5. API Endpoints

### POST /api/payments/checkout
- **Auth:** Required (JWT)
- **Body:** `{ price_key: "vip_monthly" | "vip_annual" | "birth_chart" | ..., success_url, cancel_url }`
- **Returns:** `{ checkout_url: "https://checkout.stripe.com/..." }`
- **Logic:** Get-or-create Stripe customer → Create checkout session → Return URL

### POST /api/payments/webhook
- **Auth:** Stripe signature verification (no JWT)
- **Body:** Raw Stripe event payload
- **Handles:**
  - `checkout.session.completed` → Activate subscription or record purchase
  - `customer.subscription.updated` → Sync tier/status/period_end
  - `customer.subscription.deleted` → Set tier to "free"
  - `invoice.payment_failed` → Set status to "past_due"

### GET /api/payments/status
- **Auth:** Required (JWT)
- **Returns:** `{ tier, status, period_end, cancel_at_period_end, purchases: [...] }`

### POST /api/payments/portal
- **Auth:** Required (JWT)
- **Returns:** `{ portal_url: "https://billing.stripe.com/..." }`

## 6. Frontend Components

### useSubscription() hook
- Fetches `/api/payments/status` on mount
- Returns `{ tier, isVip, isLoading, subscribe(priceKey), manageSubscription() }`
- Caches in React context to avoid re-fetching

### CheckoutButton
- Takes `priceKey` prop
- Shows loading spinner while creating session
- Redirects to Stripe Checkout

### Paywall
- Wraps premium content
- Free users see teaser + upgrade CTA
- VIP users see full content

### UpgradePrompt
- Shown when free user hits daily limit or views locked content
- Animated modal/banner with VIP value props
- CTA → checkout

### Updated Pricing.tsx
- VIP button → Stripe Checkout (monthly)
- Annual toggle
- A la carte items → individual checkout sessions

### Success/Cancel pages
- `/checkout/success/` — confirmation + redirect to app
- `/checkout/cancel/` — "no worries" + back to pricing

### Account Billing page
- Shows current tier, next billing date
- "Manage Subscription" → Stripe Customer Portal
- Purchase history

## 7. Security

- Stripe secret key: backend only (env var `STRIPE_SECRET_KEY`)
- Publishable key: frontend only (env var `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- Webhook secret: backend only (env var `STRIPE_WEBHOOK_SECRET`)
- All payment creation goes through authenticated backend endpoints
- Webhook signature verification prevents spoofing
- No card data touches our servers (Stripe Checkout handles it)

## 8. Environment Variables

### Backend (.env)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_VIP_MONTHLY=price_...
STRIPE_PRICE_VIP_ANNUAL=price_...
STRIPE_PRICE_BIRTH_CHART=price_...
STRIPE_PRICE_COMPATIBILITY=price_...
STRIPE_PRICE_CELTIC_CROSS=price_...
STRIPE_PRICE_YEAR_AHEAD=price_...
STRIPE_PRICE_VIDEO_READING=price_...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=https://api.oliviaarcana.com
```

## 9. Upgrade Prompt Placement Strategy

| Trigger | Location | Prompt Type |
|---------|----------|-------------|
| Daily message limit hit (5/5) | Chat interface | Modal: "You've used all free messages today" |
| Free reading teaser | Reading result page | Inline: "Unlock the full reading" |
| Locked feature tap | Feature card | Toast: "VIP members get [feature]" |
| After onboarding | Onboarding complete | Full-screen: "Your chart is ready — upgrade for daily insights" |
| Profile page | Account section | Banner: "Currently on Free plan" |
| 7-day re-engagement | Email/push | "Your stars have been active — see what you're missing" |

## 10. Launch Sequence

1. **Create Stripe account** + products/prices in test mode
2. **Backend:** Add DB models + migrate
3. **Backend:** Add Stripe service + payment endpoints
4. **Backend:** Deploy + configure webhook URL
5. **Frontend:** Add Stripe.js + payment client
6. **Frontend:** Wire pricing page to checkout
7. **Frontend:** Add paywall + upgrade prompts
8. **Frontend:** Add success/cancel/billing pages
9. **Test:** Full checkout flow in test mode
10. **Stripe:** Switch to live keys
11. **Launch:** Update pricing CTA copy, announce

## 11. Out of Scope (Phase 2+)

- "Ask the Stars" credit system
- Crypto payments on website (bot-only for now)
- iOS/Android IAP
- Referral/affiliate system
- Coupon/promo codes (Stripe supports, but not wired yet)
- Cross-platform subscription sync (bot ↔ web)
