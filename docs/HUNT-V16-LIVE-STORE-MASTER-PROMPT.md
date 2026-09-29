# HUNT V16 — Live Store Master Prompt

## Mission
Operate HUNT V16 as a production-quality storefront preview while keeping Production, payment capture, and supplier live ordering OFF until Owner approval.

## Shopper-facing goals
- Clean premium storefront
- No supplier names anywhere in shopper UI
- Real images only
- Real catalog routes only
- Real positive HUNT prices only
- Real sizes/colors only when live detail or verified cached evidence exists
- Calm loading/error states
- Working account sign-in
- Working product navigation and cart preview

## Catalog source of truth
Primary source:
- hunt-cinematic-shadow-catalog

Required gates before a product reaches HUNT:
- production_effect = false
- availability_verified = true
- verified_inventory > 0
- taxonomy_gate_v2.status = REMAP
- catalog_safety_status = PASS
- image_technical_status = PASS
- latest_market5_all_pass = true
- profit_gate_v2.status = PROFIT_REVIEW
- positive target_retail_usd
- positive projected_product_contribution_usd
- approved candidate_status

## Product QA
Before display:
1. Reject unsafe or general-audience-inappropriate titles.
2. Reject obvious route/title mismatches for exact shelves.
3. Require HTTPS image URL.
4. Deduplicate same route + title + image.
5. Keep supplier identity internal.
6. Expose only HUNT-facing public item id and hidden source alias/detail id.
7. Show target HUNT price; do not claim final shipping-inclusive profit when it is not verified.

## Shelf behavior
- Department → shelf → products.
- Fuller shelves appear first.
- Thin shelves do not dominate top navigation.
- Search can surface products across all HUNT routes.
- More opens secondary departments such as pets, travel, tech, sports, kitchen and other live categories.
- No cross-mixing inside an exact shelf.

## Product Detail
On product click:
- Navigate with opaque source alias (h1/h2/h3/h4) + internal item id.
- Never display provider/supplier names.
- Cache clicked product in sessionStorage for instant fallback.
- Fetch live detail through HuntCore.storefront.
- Render gallery, live variants, colors, sizes, stock and product facts.
- If live detail fails, render cached image/title/target price immediately.
- Show cached sizes/colors as disabled evidence-only options when available.
- Never fabricate variant combinations or per-variant stock.
- Purchase CTA remains disabled unless existing HUNT truth logic marks the required price/variant state ready.

## Login
- Use Supabase Auth.
- Email magic link is always the base sign-in path.
- Only show social providers that /auth/v1/settings reports enabled.
- Signed-in session changes the HUNT account link to Account.
- Sign-out must work.
- Never expose provider secrets in client code.

## Pricing
- PLP/card price source: target_retail_usd / profit_truth.target_retail_usd.
- PDP may show verified retail price when available.
- If final retail is not verified but target price exists, show the target price while keeping the purchase gate conservative.
- Never show fake discounts or compare-at pricing.

## Visual/Product QA
- No supplier name on cards, PDP, auth or shopper-facing structured data.
- No missing-image card.
- No route mismatch.
- No duplicate exact product/image inside the same shelf.
- No old V2–V15 page routes.
- No decorative glow/pulse/glass/animation layers.

## Current verified snapshot — 2026-09-29
- Strict candidates before extra V16 QA: 675
- Effective shopper products after V16 QA: 663
- Effective routes: 90
- Products with HUNT target price: 663
- Cached size evidence: 10
- Cached color evidence: 13
- Exact duplicate removed: 1
- Live sizes/colors for other products: fetched at Product Detail when provider detail succeeds
- Final Profit Verified remains false on the strict Shadow catalog; do not call these Launch Ready.

## Completion definition
HUNT is not considered launch-ready merely because it looks complete. Launch remains blocked until checkout/payment/supplier ordering and final profit/shipping truth are explicitly approved and verified.
