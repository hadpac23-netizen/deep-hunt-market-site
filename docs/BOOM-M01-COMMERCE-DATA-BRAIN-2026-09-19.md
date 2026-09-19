# BOOM M01 — Commerce Data Brain / Commerce Passport — 2026-09-19

## Objective
Turn HUNT product truth into a single structured contract that can later power Google Merchant, Google AI commerce, agentic/UCP discovery, social catalogs, creative systems and paid-media eligibility without creating conflicting product claims.

## Official 2026 signals incorporated
Google Merchant API added conversational product attributes in 2026 including question/answer, related products, variant options and document links. Google also added offer-level returns support. Shopify/Google UCP separates discovery/catalog capabilities from checkout and post-purchase capabilities.

HUNT mirrors that separation internally:
- data_ready
- discovery_ready
- transaction_ready

## Live HUNT snapshot at implementation
- Catalog products: 117
- Availability signal verified: 117
- Source fresh ≤7 days: 46
- Products with image: 117
- Products with brand: 5
- Verified Profit Gate economics rows: 3
- Distinct products with verified economics: 3
- Business identity fully ready + owner-approved: 0

## Implemented
- boom-commerce-passport.js
- boom-commerce-passport.test.cjs
- boom-marketing-brain.js upgraded to consume passport readiness
- boom-marketing-brain.test.cjs
- Growth OS reads catalog + unit economics + business identity
- Growth OS Commerce Passport dashboard
- Top blocker frequency counts unique affected SKUs, not duplicate channel occurrences
- Google Merchant draft builder containing only known product values
- Conversational Q&A export accepts only explicitly verified Q&A
- UCP discovery and transaction gates separated
- Paid media remains locked behind economics + attribution + owner approval

## Intentional current blockers
The first live pass is expected to be strict.

### Catalog enrichment
hunt_catalog_products currently has no rich description field. M01 does not synthesize one from the title.

### Feed-safe availability
Catalog availability signals are not automatically treated as export-safe variant stock. X04 proved product-detail inventory may disagree with official CJ queryByVid stock.

### Merchant identity
Primary business identity is still draft and owner_approved=false with required public fields missing.

### Shipping / returns publication gates
M01 keeps external policy readiness false until explicit verified policy/readiness evidence exists.

### Channel connections
Google Merchant, Google AI/UCP, Meta/TikTok/Pinterest catalogs and paid-media execution are not marked connected by M01.

### Paid scale
Only 3 distinct products currently have verified positive unit economics. Attribution and paid owner approval remain off.

## What M02 must solve
Build the enrichment/export pipeline:
1. verified rich product description source;
2. feed-safe availability snapshot per external offer/variant;
3. canonical production URL;
4. verified shipping/returns policy readiness;
5. Merchant/account connection;
6. conversational Product Truth persistence;
7. external feed validation report before any publish.

## Hard gates
PRODUCTION_CHANGED: false
EXTERNAL_PUBLISHING_CHANGED: false
PAID_SPEND_CHANGED: false
PAYMENT_CHANGED: false
SUPPLIER_ORDER_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
