# HUNT DEAL — FINISH MODE MASTER PROMPT

## Mission
Finish HUNT DEAL from the current V16 state into a complete, full, operational pre-launch ecommerce system.
Payment activation is intentionally LAST.

Until payment approval:
- Production payment capture = OFF
- Supplier live ordering = OFF
- No fake readiness
- No fake product counts
- No fake stock, variants, prices, reviews, discounts, shipping or profit
- All new work must preserve the current V16 storefront and Shadow truth gates

## Primary outcome
HUNT must feel and operate like a real global ecommerce store before payments are enabled:
- full departments and shelves
- working search/navigation
- clean product pages
- sizes/colors/variants where verified
- prices on every sellable product
- working login/account
- working cart
- working checkout quote flow
- working order-preview lifecycle
- shipping/tracking architecture
- returns/refunds/support architecture
- legal/policies
- analytics/privacy
- SEO/sitemap/merchant feeds
- monitoring and daily operations
- no supplier names in shopper UI
- no legacy V2-V15 routing

## Golden rule
Do not call HUNT launch-ready because the UI looks complete.
Readiness must be proven by evidence.

## Work order

### PHASE A — STOREFRONT COMPLETE
1. Homepage V16
2. Navigation / departments / shelves
3. Search and discovery
4. Product cards
5. Product Detail
6. Cart
7. Login / account / saved / likes
8. Mobile QA
9. Accessibility/basic keyboard flows
10. Remove legacy UI and old routes from customer paths

### PHASE B — CATALOG FULL
For each department:
- map exact shelves
- fill thin shelves in bulk
- rank fuller shelves first
- maintain route purity
- dedupe exact products/images
- hide supplier identity

Required product gates:
- production_effect=false
- availability_verified=true
- verified_inventory>0
- taxonomy REMAP
- safety PASS
- image PASS
- Market5 5/5 PASS
- positive HUNT target retail
- positive projected contribution
- approved candidate status

Batch mode:
- process 100-200 candidates at a time when the pipeline is healthy
- reuse yesterday/existing evidence before new API calls
- do not rerun expensive checks unnecessarily

### PHASE C — PRODUCT DETAIL TRUTH
For each sellable product:
- gallery
- exact title
- exact variant ids
- exact colors/sizes when verified
- verified stock
- verified HUNT price
- delivery/shipping estimate when verified
- product facts/specs
- no fabricated review score
- no fabricated variant combinations
- graceful fallback from session cache

### PHASE D — CHECKOUT WITHOUT PAYMENT
Build V16 checkout matching the V16 visual system.
Required:
- guest checkout
- signed-in checkout
- shipping address
- phone normalization
- destination market
- fresh stock recheck
- fresh price recheck
- fresh shipping quote
- tax/duty placeholder only where final logic not ready
- order preview
- idempotency
- clear error handling
- payment remains disabled

### PHASE E — ORDER / FULFILLMENT PRE-LAUNCH
- payment session lifecycle
- order preview
- fulfillment order creation in sandbox only
- provider grouping
- retry/backoff
- phone/address normalization
- supplier failure queue
- tracking fields
- shipped/delivered states
- finance ledger
- no supplier live order until Owner approval

### PHASE F — RETURNS / REFUNDS / SUPPORT
Create operational architecture before launch:
- return request
- return status lifecycle
- refund request
- refund decision
- refund execution state
- support tickets
- order-linked customer issues
- internal notes
- SLA/priority/status
No real refund processor actions until payment live.

### PHASE G — LEGAL / TRUST
Required owner-approved documents:
- Terms
- Privacy
- Returns & Refunds
- Shipping
- Analytics choices
- contact/support details
Legal documents must come from a versioned registry.
Do not invent jurisdiction-specific legal claims; mark legal-review-required where appropriate.

### PHASE H — SEO / DISCOVERY
- V16 canonical URLs
- remove supplier/provider names from public URLs/sitemap
- robots.txt
- V16 sitemap
- Product structured data
- Offer structured data only from verified price/availability
- shipping/returns structured data when verified
- merchant feed using HUNT-facing ids
- no stale category.html/product.html legacy entries

### PHASE I — OPERATIONS
Mission Control must show:
- storefront health
- catalog strict count
- thin shelves
- image failures
- Market5 failures
- profit failures
- checkout quote failures
- fulfillment failures
- stuck processing
- stock changes
- price changes
- tracking exceptions
- returns
- support tickets
- payment state
- supplier-live-order state

Automation principle:
- system handles normal flows
- humans handle exceptions

### PHASE J — PAYMENT LAST
Only after every prior phase is proven:
1. choose approved payment route
2. sandbox E2E
3. callback/webhook verification
4. one controlled real payment
5. one controlled supplier order
6. tracking
7. delivered
8. ledger settlement
9. refund test
10. Owner launch approval

## Current truth snapshot
- V16 storefront branch: preview/hunt-v16-professional-rebuild
- strict catalog: 861
- effective shopper products: 852
- effective routes: 97
- payment live: OFF
- supplier live order: OFF
- payment routes active: 0
- login currently available: email + Google + GitHub
- Apple/Facebook not active
- checkout still old/pre-launch visual system
- fulfillment test failures exist and must be cleared before live use
- legal registry missing
- returns/refunds/support registries missing
- SEO sitemap still contains legacy URLs/provider names

## Definition of PRE-PAYMENT COMPLETE
HUNT is pre-payment complete only when:
- storefront is V16 end-to-end
- catalog is full enough across primary departments
- product pages are clean and truthful
- guest/account/cart/checkout quote work
- sandbox fulfillment succeeds reliably
- retry/backoff works
- tracking lifecycle exists
- returns/refunds/support architecture exists
- legal documents are publishable through versioned registry
- SEO is V16-only
- monitoring exists
- payments remain OFF

## Working behavior
Always:
- inspect current truth first
- reuse evidence
- batch work
- verify after changes
- write evidence
- update Launch Control
- never silently change payment/live-order gates
