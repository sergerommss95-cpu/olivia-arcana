# Legal source changes — unpublished review draft

No legal page is edited in this PR. These are exact source-level replacements to review after seller/professional decisions, not published legal advice or final terms.

| Source | Existing assertion | Draft replacement / action |
|---|---|---|
| website/src/app/layout.tsx Organization name | Olivia Arcana LLC | Olivia Arcana (brand only); omit legalName/address until verified. |
| website/src/components/Footer.tsx copyright | Olivia Arcana LLC | Olivia Arcana; do not imply a registered company. |
| website/src/app/contact/page.tsx | Olivia Arcana LLC; Wyoming registered address on request | Remove both claims. Seller section remains blocked pending verified legal name, address and contact; do not ship placeholders to customers. |
| website/src/app/privacy/page.tsx opening controller | Wyoming LLC operator | Replace with verified controller identity/address/contact after review. Mark publication blocked in release checklist, not a fabricated entity. Audit actual local/AI/account data flows and processor disclosures. |
| website/src/app/terms/page.tsx operator, liability and Wyoming venue | LLC and Wyoming jurisdiction | Remove nonexistent entity assertions in reviewed draft; governing law/venue must be professionally reviewed for actual seller and customer jurisdictions. Not automatically Ukraine or USA. |
| website/src/app/dmca/page.tsx agent/jurisdiction | LLC DMCA agent and US jurisdiction | Review whether this notice applies; verified contact and applicable complaint process needed. Do not invent a registered agent. |

Required seller fields for release: verified legal name and form; registration identifier where required; service/contact address; customer support email; tax/VAT disclosures as applicable; controller identity; accepted payment provider; contract formation and renewal/cancellation/refund terms. Owner/professional supplies facts. Proposed EUR9.99 and ten readings is not approved legal copy. Remove old Paddle/LLC strategy commentary and old price/forecast promises in a dedicated reviewed content pass after decisions.

Current production claims remain an acknowledged blocker: this engineering PR does not publish corrections. A reviewed content patch is required before launch, with EN/UK consistency and structured-data/footer/contact/terms/privacy/DMCA checks.
