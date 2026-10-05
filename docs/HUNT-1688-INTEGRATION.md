# HUNT × 1688 Cross-Border Integration

Status: **SHADOW / READ-ONLY / AWAITING OFFICIAL 1688 APPROVAL + API DOCUMENTATION**

Created: 2026-10-06

## Goal

Use 1688 as a large official sourcing pool for HUNT while keeping HUNT's existing pricing, taxonomy, quality, logistics, profitability, Red Team and Owner Gate controls authoritative.

Target scale is up to **500,000 supplier candidates**, not 500,000 automatically public products.

## Non-negotiable rules

- Official 1688 Open Platform / Cross-Border APIs only. No scraping.
- No guessed endpoints, authentication schemes or undocumented fields.
- No 1688 credentials in Git, logs or public responses.
- No persistence of 1688 Shared Data outside the PRC until the required written/data-transfer approval is confirmed.
- No storefront image display until the applicable image-use right is confirmed.
- No AI image alteration until modification rights are explicitly confirmed.
- Never remove or obscure trademarks/watermarks merely to make a product appear unbranded.
- No supplier order submission during the pilot.
- No payment activation during the pilot.
- No automatic publication.
- Owner Gate remains mandatory before public activation.

## Requested official capability set

HUNT has asked 1688 for the complete Cross-Border API/SDK integration scope, including:

1. Product portfolio/search/detail/category/attributes.
2. Text, image and link/same-product sourcing.
3. SKU/variant identifiers, price, inventory and lifecycle events.
4. Bulk/incremental catalog synchronization suitable for 100K–500K candidates.
5. Product images/media plus display and permitted transformation rights.
6. Supplier/factory verification, MOQ, one-piece/dropship and dispatch promises where available.
7. Source/price comparison.
8. Listing/catalog integration.
9. Logistics quote/route/ETA/tracking, package dimensions and international fulfillment.
10. China consolidation / multi-supplier warehouse support if available.
11. Customs/HS/COO, DDP/DDU and duty/tax-related fields if available.
12. Order, payment-status, returns/refunds and event/webhook APIs.
13. Sandbox/test environment, production environment, quotas/rate limits and onboarding checklist.

## External blockers to close

Before any live API implementation, 1688 must clarify/approve:

- Israel-based legal entity eligibility.
- Company verification documents and developer onboarding.
- App Key / App Secret / token mechanism and official authentication/signature rules.
- Exact API/SDK names, endpoints, scopes and required callbacks/data fields.
- Fees, deposits, transaction/minimum-volume requirements.
- Quotas, concurrency and bulk-sync behavior at 500K scale.
- Cross-border storage/processing outside mainland China.
- Image display rights and AI translation/removal of Chinese promotional text.
- Required 1688/supplier attribution or branding.
- One-piece fulfillment/dropship and international shipping coverage to IL/EU/US.
- Consolidation, returns and customs workflow.

## Canary

The first real API run is capped at **20 products** and remains internal.

Preferred categories:

- Women
- Bags / Accessories
- Jewelry
- Home

For every candidate capture:

- official 1688 product ID
- supplier/source ID
- SKU/variant IDs
- supplier price and currency
- inventory snapshot and timestamp
- MOQ / one-piece signal when available
- raw image/media references under approved rights
- supplier/factory trust evidence where available
- package weight/dimensions
- destination shipping quote and ETA
- lifecycle/status state
- source-observed timestamp

Then run:

`SOURCE → IP/BRAND → SUPPLIER TRUST → SKU/VARIANT → STOCK → IMAGE RIGHTS/QA → TAXONOMY → SHIPPING → MARKET VALIDATION → LANDED COST → PROFIT → RED TEAM → OWNER GATE → PUBLISH`

A candidate is **not** public merely because the 1688 API returns it.

## Image handling

- **CLEAN**: may proceed to Image QA after display rights are confirmed.
- **CLEANABLE**: Chinese promotional text may be translated/removed only if explicit modification rights are confirmed; product fidelity must be compared against the source afterwards.
- **REJECT**: brand watermark, unclear rights, misleading-edit risk, or material product mismatch.

## Scale ladder

Only scale after evidence from the preceding step:

`20 → 1K → 5K → 30K → 100K → 250K → 500K candidates`

Each stage must report at minimum: API errors, rate-limit behavior, duplicates, valid SKU ratio, stock ratio, image-rights/quality ratio, shipping coverage, market-price validation, profit pass/review/block, supplier trust distribution and freshness.

## Runtime controls reserved

Secrets/controls are not committed; these names are reserved for runtime configuration once officially approved:

- `HUNT_1688_APP_KEY`
- `HUNT_1688_APP_SECRET`
- `HUNT_1688_ACCESS_TOKEN` (only if required by official docs)
- `HUNT_1688_INTERNAL_TOKEN`
- `HUNT_1688_SHADOW_ENABLED`
- `HUNT_1688_OFFICIAL_API_CONTRACT_VERIFIED`
- `HUNT_1688_DATA_RESIDENCY_APPROVED`
- `HUNT_1688_IMAGE_DISPLAY_RIGHTS_APPROVED`
- `HUNT_1688_IMAGE_MODIFICATION_RIGHTS_APPROVED`

## Current implementation

`supabase/functions/hunt-1688-readonly-pilot/index.ts` is intentionally a fail-closed contract scaffold. It does **not** call 1688 yet. It becomes eligible for implementation only after HUNT receives and verifies the official technical contract and approvals.

The current implementation explicitly reports:

- Payment: OFF
- Supplier Live Order: OFF
- Supplier submission: blocked
- Production catalog writes: blocked
- Public exposure: blocked
- Auto-publish: blocked

## Supplier intelligence extension

Once the official fields are known, HUNT should compute a provider-independent supplier score rather than trusting source ranking alone. Candidate dimensions:

- factory/supplier verification
- fulfillment reliability
- stock stability
- price stability
- variant accuracy
- shipping reliability
- dispute/refund evidence if legally/API-available
- data freshness

The score is internal decision support; it must not invent claims or expose unsupported supplier labels publicly.

## Source Brain target

`SEE → SOURCE → COMPARE → TRUST → NORMALIZE → MARKET → PROFIT → ROUTE → PUBLISH → WATCH`

1688 becomes a sourcing pool. F35/HUNT remains the decision layer.
