# Olivia Arcana — Pricing Implementation Guide

Step-by-step guide to go from zero to live payments. Follow in order.

---

## Phase 0: Stripe Account Setup (30 min)

### 0.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) → Sign up
2. Verify email, add business info (sole proprietor is fine)
3. You'll start in **test mode** — all development uses test mode

### 0.2 Create Products & Prices in Stripe Dashboard

Go to **Products** → **Add product** for each:

| Product Name | Price | Type | Recurring |
|---|---|---|---|
| VIP Monthly | $6.50 | Recurring | Monthly |
| VIP Annual | $65.00 | Recurring | Yearly |
| Birth Chart Reading | $3.90 | One-time | — |
| Compatibility Report | $3.90 | One-time | — |
| Celtic Cross Spread | $1.95 | One-time | — |
| Year-Ahead Forecast | $6.50 | One-time | — |
| Video Reading | $39.99 | One-time | — |

After creating each, note the **Price ID** (starts with `price_`).

### 0.3 Configure Customer Portal

Go to **Settings** → **Billing** → **Customer portal**:
- Enable: Update payment methods, Cancel subscriptions, View invoices
- Set cancellation to: "Cancel at end of billing period" (not immediately)

### 0.4 Set Up Webhook

Go to **Developers** → **Webhooks** → **Add endpoint**:
- URL: `https://api.oliviaarcana.com/api/payments/webhook`
  (for dev: use [ngrok](https://ngrok.com) to tunnel localhost)
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

Note the **Webhook signing secret** (starts with `whsec_`).

### 0.5 Collect API Keys

From **Developers** → **API keys**:
- **Publishable key**: `pk_test_...` (goes to frontend)
- **Secret key**: `sk_test_...` (goes to backend ONLY)
- **Webhook secret**: `whsec_...` (from step 0.4)

---

## Phase 1: Backend Setup (1-2 hours)

### 1.1 Environment Variables

Create/edit `/olivia-arcana/backend/.env`:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Price IDs from Stripe Dashboard (Step 0.2)
STRIPE_PRICE_VIP_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_VIP_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BIRTH_CHART=price_xxxxxxxxxxxxx
STRIPE_PRICE_COMPATIBILITY=price_xxxxxxxxxxxxx
STRIPE_PRICE_CELTIC_CROSS=price_xxxxxxxxxxxxx
STRIPE_PRICE_YEAR_AHEAD=price_xxxxxxxxxxxxx
STRIPE_PRICE_VIDEO_READING=price_xxxxxxxxxxxxx

# Site URL (for redirect URLs)
SITE_URL=https://oliviaarcana.com

# Existing
JWT_SECRET=your-jwt-secret
DATABASE_URL=sqlite+aiosqlite:///./data/olivia.db
```

### 1.2 Install Stripe SDK

```bash
cd /olivia-arcana/backend
pip install stripe>=11.0.0
# or: pip install -r requirements.txt
```

### 1.3 Load .env in main.py

Add to the top of `backend/main.py` (before other imports):
```python
from dotenv import load_dotenv
load_dotenv()
```

And add `python-dotenv>=1.0.0` to `requirements.txt`.

### 1.4 Database Migration

The updated `db/models.py` (already created) adds these fields to User:
- `stripe_customer_id`, `subscription_tier`, `subscription_status`
- `subscription_stripe_id`, `subscription_current_period_end`
- `subscription_cancel_at_period_end`
- `free_messages_today`, `free_messages_date`

Plus new tables: `payments`, `purchases`.

**For development (SQLite):** Just delete the old DB file and restart:
```bash
rm -f data/olivia.db
python -m uvicorn main:app --reload
# Tables are auto-created by init_db()
```

**For production (PostgreSQL):** Use Alembic migrations:
```bash
pip install alembic
alembic init migrations
# Edit alembic/env.py to use your models
alembic revision --autogenerate -m "add payment fields"
alembic upgrade head
```

### 1.5 Verify Backend

Start the server:
```bash
cd /olivia-arcana/backend
uvicorn main:app --reload --port 8000
```

Test the health endpoint:
```bash
curl http://localhost:8000/api/health
# → {"status":"ok","service":"olivia-arcana"}
```

Test the payment status endpoint (requires auth):
```bash
# First login to get a token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Then check payment status
curl http://localhost:8000/api/payments/status \
  -H "Authorization: Bearer $TOKEN"
# → {"tier":"free","status":"none","is_vip":false,"period_end":null,"cancel_at_period_end":false,"purchases":[]}
```

---

## Phase 2: Frontend Setup (1-2 hours)

### 2.1 Environment Variables

Edit `/olivia-arcana/website/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ghyzkpcxlnlfjzitdxkk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, change `NEXT_PUBLIC_API_URL` to your backend URL.

### 2.2 Install Stripe.js (Optional)

Only needed if you want the Stripe.js client-side library for future embedded checkout. For redirect-based checkout (current approach), no frontend Stripe package is needed.

```bash
# Optional: npm install @stripe/stripe-js
```

### 2.3 Add SubscriptionProvider to Layout

Wrap your app with the subscription context. Edit your root layout:

```tsx
// src/app/layout.tsx — add near the top of the component tree
import { SubscriptionProvider } from "@/hooks/useSubscription";

// Inside the layout component, wrap children:
<SubscriptionProvider>
  {children}
</SubscriptionProvider>
```

### 2.4 Verify Frontend

```bash
cd /olivia-arcana/website
npm run dev
```

Visit `http://localhost:3333` → scroll to pricing section. The VIP button should now:
1. Check if user is logged in (token in localStorage)
2. If not logged in → redirect to `/onboarding/`
3. If logged in → call backend → create Stripe checkout → redirect to Stripe

---

## Phase 3: Test the Full Flow (1 hour)

### 3.1 Stripe Test Cards

Use these test card numbers in Stripe Checkout:

| Scenario | Card Number | CVC | Expiry |
|---|---|---|---|
| Success | `4242 4242 4242 4242` | Any 3 digits | Any future date |
| Requires auth | `4000 0025 0000 3155` | Any 3 digits | Any future date |
| Declined | `4000 0000 0000 0002` | Any 3 digits | Any future date |

### 3.2 Test Webhook Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:8000/api/payments/webhook
# Copy the webhook signing secret it prints → update STRIPE_WEBHOOK_SECRET in .env
```

### 3.3 Full Flow Test

1. Register/login on the website
2. Click "Start VIP" on pricing page
3. Complete checkout with test card `4242 4242 4242 4242`
4. Verify redirect to success page
5. Check `/account/billing/` shows VIP status
6. Verify backend: `GET /api/payments/status` returns `tier: "vip"`

### 3.4 Test Cancellation

1. Go to `/account/billing/`
2. Click "Manage Subscription" → opens Stripe portal
3. Cancel subscription
4. Verify: status changes to "canceled", access continues until period end

---

## Phase 4: Feature Gating (1-2 hours)

### 4.1 Server-Side Gating

Add to any FastAPI endpoint that should be VIP-only:

```python
from db.models import User

async def require_vip(user: User):
    """Raise 403 if user is not VIP."""
    if not user.is_vip:
        raise HTTPException(
            status_code=403,
            detail="VIP subscription required",
        )
```

Example usage in a reading endpoint:
```python
@router.get("/api/readings/birth-chart")
async def birth_chart(authorization: str = "", db: AsyncSession = Depends(get_db)):
    user = await _get_authenticated_user(authorization, db)
    
    # Check if user has purchased this reading OR is VIP
    if not user.is_vip:
        # Check for a la carte purchase
        result = await db.execute(
            select(Purchase).where(
                Purchase.user_id == user.id,
                Purchase.reading_type == "birth_chart",
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Purchase required")
    
    # Generate and return the full reading...
```

### 4.2 Client-Side Gating

Use the `<Paywall>` component to wrap premium content:

```tsx
import Paywall from "@/components/Paywall";

// In any page:
<Paywall featureName="your birth chart reading">
  <FullBirthChartReading data={chartData} />
</Paywall>
```

For the teaser pattern (show partial content):
```tsx
<Paywall
  featureName="the full reading"
  teaser={
    <div>
      <p>Your Sun is in Pisces...</p>
      <p className="text-muted-lavender/40 italic">
        The detailed analysis continues with your Moon placement, 
        rising sign influence, and house positions...
      </p>
    </div>
  }
>
  <FullReadingContent />
</Paywall>
```

### 4.3 Daily Message Limit

Use `<UpgradePrompt>` when the user hits their daily limit:

```tsx
import UpgradePrompt from "@/components/UpgradePrompt";
import { useSubscription } from "@/hooks/useSubscription";

function ChatInterface() {
  const { isVip } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleSendMessage = async (msg: string) => {
    try {
      const res = await sendMessage(msg);
      // ... handle response
    } catch (err) {
      if (err.message.includes("daily limit")) {
        setShowUpgrade(true);
      }
    }
  };

  return (
    <>
      {/* ... chat UI ... */}
      {showUpgrade && (
        <UpgradePrompt
          reason="message_limit"
          variant="modal"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
```

---

## Phase 5: Go Live (30 min)

### 5.1 Switch to Live Mode

1. In Stripe Dashboard: toggle from **Test mode** to **Live mode**
2. Create the same products/prices in live mode
3. Create a new webhook endpoint for production URL
4. Update all environment variables:

```bash
# Backend .env (production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PRICE_VIP_MONTHLY=price_live_...
# ... all price IDs from live mode

# Frontend .env.local (production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_API_URL=https://api.oliviaarcana.com
```

### 5.2 Deploy

```bash
# Backend
cd /olivia-arcana/backend
# Deploy to your server (Docker, Railway, Fly.io, etc.)

# Frontend  
cd /olivia-arcana/website
npm run build
# Netlify auto-deploys from git push
```

### 5.3 Verify Production

1. Visit oliviaarcana.com → Pricing → click "Start VIP"
2. Use a **real card** with a **small amount** (you can refund via Stripe Dashboard)
3. Verify webhook fires and subscription activates
4. Cancel via billing portal → verify grace period works

### 5.4 Update Pricing Copy

In `src/lib/i18n/translations.ts`, update the payment method line:
```diff
- price_pay: "Pay with Telegram Stars or Crypto (TON/USDT)",
+ price_pay: "Secure payment via Stripe. Cancel anytime.",
```

---

## Architecture Reference

### File Map

```
backend/
├── main.py                    # FastAPI app — mounts auth + payments routers
├── requirements.txt           # Python deps — added stripe>=11.0.0
├── .env                       # Stripe keys + price IDs (NEVER commit)
├── api/
│   ├── auth.py                # Auth endpoints (existing)
│   └── payments.py            # NEW: checkout, webhook, status, portal
├── db/
│   ├── database.py            # DB engine (existing)
│   └── models.py              # UPDATED: User + Payment + Purchase models
└── services/
    └── stripe_service.py      # NEW: Stripe integration logic

website/src/
├── lib/
│   ├── supabase.ts            # Auth client (existing)
│   └── payments.ts            # NEW: Payment API client
├── hooks/
│   └── useSubscription.ts     # NEW: React subscription context/hook
├── components/
│   ├── Pricing.tsx            # UPDATED: Real checkout + billing toggle
│   ├── CheckoutButton.tsx     # NEW: Stripe checkout trigger
│   ├── Paywall.tsx            # NEW: Premium content gate
│   ├── UpgradePrompt.tsx      # NEW: Upgrade nudge (modal/banner/inline)
│   └── VipBadge.tsx           # NEW: VIP status indicator
└── app/
    ├── checkout/
    │   ├── success/page.tsx   # NEW: Post-payment success
    │   └── cancel/page.tsx    # NEW: Payment cancelled
    └── account/
        └── billing/page.tsx   # NEW: Subscription management
```

### Checkout Flow Diagram

```
User clicks "Start VIP"
  │
  ├─ Not logged in? → /onboarding/ → come back
  │
  └─ Logged in:
       │
       POST /api/payments/checkout
       { price_key: "vip_monthly" }
       │
       Backend:
       ├─ Get-or-create Stripe Customer
       ├─ Create Stripe Checkout Session (mode: subscription)
       ├─ Save pending Payment record
       └─ Return checkout_url
       │
       Frontend redirects to Stripe Checkout
       │
       User enters card → pays
       │
       ├─ Stripe sends webhook → POST /api/payments/webhook
       │   ├─ checkout.session.completed
       │   ├─ Update Payment → completed
       │   └─ Update User → tier="vip", status="trialing"
       │
       └─ Stripe redirects user → /checkout/success/
           ├─ Show success animation
           └─ refresh() → fetch updated tier
```

### Revenue Projections

At $6.50/mo VIP with 5% free→VIP conversion:

| Users | Free | VIP (5%) | Monthly Revenue | Monthly Profit (~97% margin) |
|-------|------|----------|-----------------|------------------------------|
| 1,000 | 950 | 50 | $325 | $315 |
| 5,000 | 4,750 | 250 | $1,625 | $1,576 |
| 10,000 | 9,500 | 500 | $3,250 | $3,153 |
| 50,000 | 47,500 | 2,500 | $16,250 | $15,763 |

Plus a la carte readings at ~$2/user/month average = additional 25% on top.

---

## Troubleshooting

### "Checkout failed" error
- Check backend logs for the specific Stripe error
- Verify `STRIPE_SECRET_KEY` is set correctly
- Verify the `price_key` maps to a valid Stripe Price ID

### Webhook not firing
- Check Stripe Dashboard → Developers → Webhooks → Event log
- Verify webhook URL is correct and accessible
- For local dev: ensure ngrok/stripe CLI is running

### User not showing as VIP after payment
- Check webhook logs for errors
- Verify `stripe_customer_id` is set on the User
- Check Payment table for the completed record
- Try manual refresh: `GET /api/payments/status`

### CORS errors
- Verify backend CORS allows your frontend origin
- Check `main.py` → `allow_origins` list

### Static export + API routes
- Remember: Next.js static export cannot have API routes
- All server logic goes through FastAPI backend
- Frontend only does `fetch()` to backend URLs
