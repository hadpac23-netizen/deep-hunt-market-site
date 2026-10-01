# HUNT F35/F50 Gap Red Team — 2026-10-02

## Scope

PR26 / `launch/hunt-candidate-2026-09-29-v1` only. This checkpoint does not authorize merge, Production deployment, live payment, or live supplier ordering.

## Safety gates

- Payment Live: OFF
- PayPlus paid callback acceptance: OFF
- Supplier Live Order: OFF
- Profit release: OFF
- Merge: NO
- Production deploy: NO
- Owner Gate required before any launch-state change

## F35 — EPROLO gap QA findings

### Candidate evidence chain

The official gap scan summary reports:

- Kids / Swimwear: 5 candidates
- Kids / Socks: 7 candidates
- Kids / Schoolwear: 0
- Men / Loungewear: 0 new

The downstream QA batch is not yet durably identifiable as one immutable 12-item batch in `private.hunt_pdp_qa_runs`. Current candidate rows do not carry a single immutable scan/batch identifier that deterministically rehydrates the exact 5+7 set.

**Gate:** do not claim `12/12 QA complete` until every candidate has durable `scan_run_id`, source item id, exact variant id, target department/shelf, observation timestamp and QA result/reject reason.

### Kids Swimwear semantic false positive

Current canonical candidate data includes EPROLO item `28549981` titled approximately "Infants and young children with inflatable seat rings and sunshades ... swimming circle ..." under `kids-swimwear`. It is a swimming accessory, not apparel.

**Action staged in PR26:** `eprolo-shelves.ts` now quarantines high-confidence non-apparel swimming accessories from the canonical Kids Swimwear shelf with auditable reason `NON_APPAREL_IN_KIDS_SWIMWEAR`. A regression contract test was added.

### Kids Socks taxonomy destination

The approved storefront taxonomy currently has exactly 50 canonical shelves and does **not** include a dedicated `kids-socks` canonical shelf. The live taxonomy table likewise has no dedicated Kids Socks shelf. Therefore the 7 candidates cannot be promoted into a new dedicated shelf without a taxonomy Owner Gate.

**Action:** keep candidates in Shadow QA; do not create shelf 51 or silently mix them into Women/Men socks. Owner decision is required on whether Kids Socks becomes a new canonical shelf or a scoped subcategory under an existing Kids shelf.

## F50 — launch blockers still open

1. Supplier freshness automation is not yet proven live end-to-end; stale data must fail closed.
2. EPROLO `FINAL_PROFIT_VERIFIED` remains 0 because destination tax/customs truth is not verified.
3. CJ authenticated sandbox fulfillment has no proven tracking -> shipped end-to-end path.
4. PayPlus sandbox signed callback/status/idempotent paid-transition proof remains open.
5. Official EPROLO Create Order / Order Query / Tracking contract remains open.
6. Legal/business identity and customer-policy review remain open.
7. Branch-protection / required-check verification remains unproven to the current integration.
8. EPROLO PDP/runtime public display remains quarantined until runtime credentials and evidence are ready.

## Competitive benchmark gaps to evaluate

These are capability comparisons, not automatic launch requirements.

- NEXT: Schoolwear is a full department experience with Boys/Girls, shirts, polos, trousers, dresses, shoes, bags/accessories, coats/jackets, PE kit, socks/tights, fit/size guidance and practical schoolwear filters. HUNT's `kids-schoolwear` shelf is valid but currently has 0 new EPROLO candidates.
- H&M: Men's Nightwear & Loungewear is a distinct assortment with pyjamas, trousers, shorts, sets and robes plus size/fit/product-type filters. HUNT's `men-loungewear` shelf is valid but currently has 0 new EPROLO candidates.
- ASOS: stronger apparel decision support through size guides, international conversions, model sizing, fit details, fit-oriented reviews and personalised Fit Assistant.
- Zara: customer-facing favourites, restock email notifications for expected returns to stock, low-stock messaging and stock-aware cart handling.
- Temu: prominent delivery guarantee, returns/refunds flows and price-adjustment proposition.

## HUNT capability notes

- Reviews and returns infrastructure already exists; do not label those capabilities as wholly absent.
- Product PDP already supports gallery, color/size variants, zoom, price gating and product facts.
- Current PDP evidence does not show an ASOS-level fit/size assistant.
- Current schema/branch audit does not establish a HUNT customer wishlist/back-in-stock notification capability comparable to Zara; treat this as `NOT_EVIDENCED`, not as a claim of universal absence.

## Required next execution order

1. Persist/recover the exact 12-candidate immutable QA batch.
2. Run exact PDP QA on all 12: category, age/gender, exact variant, images, sizes/colors, inventory and taxonomy.
3. Reject false positives with explicit reason; no silent remap.
4. Shipping Shadow only for PDP-QA PASS items.
5. Profit Shadow only after shipping evidence; supplier cost + shipping + fees; keep COO/destination-tax blocker explicit.
6. Shadow Catalog only for candidates that pass all applicable gates.
7. Run targeted supplier discovery for Kids Schoolwear and Men Loungewear without lowering evidence standards.
8. Keep Payment Live OFF, Supplier Live Order OFF, no Merge/Production without Owner Gate.
