# HUNT Launch Control Plane Repair — 2026-09-27

## Scope
Shadow/pre-launch only. No Production storefront publish, no Payment Live, no Supplier Live Order.

## Shelf audit truth
- 141 configured exact routes.
- Aggregate taxonomy pool in configured routes: 9,382.
- Profit + stock pipeline ready: 8,025.
- Display-gate ready at audit snapshot: 267.
- CJ profit + stock pipeline ready: 1,177.
- EPROLO profit + stock pipeline ready: 6,848.
- Final profit verified: 0.
- Display status: FULL 2 · GOOD 6 · THIN 34 · EMPTY 99.
- Pipeline status: FULL 46 · GOOD 23 · THIN 29 · EMPTY 43.
- 24 routes were display EMPTY while already pipeline FULL; promote existing candidates through Image/Market5/Visual QA before sourcing more.

## Root cause found
The runtime control `hunt_control_plane_stable_v1` still said STABILIZED, but the expected catalog/readiness/image/profit cron jobs were missing. Only general BOOM/Growth cron jobs remained.

## Repair applied
Restored these Shadow QA jobs:
- hunt-catalog-enrichment-pipeline
- hunt-boom-score-catchup-stable
- hunt-eprolo-matrix-dispatch-stable
- hunt-eprolo-readiness-reconcile-stable
- hunt-cj-readiness-reconcile-stable
- hunt-eprolo-economics-stable
- hunt-image-technical-reconcile-stable
- hunt-eprolo-underwear-variant-audit-stable
- hunt-image-technical-dispatch-stable
- hunt-cj-costed-variant-prefilter-stable

Intentionally NOT restored:
- hunt-cj-mass-fill-stable

Reason: first consume and promote the existing 8K+ profit/stock-ready pool. Do not spend supplier/API work on broad sourcing while high-value shelves already have large unpromoted pipelines.

Runtime control note updated to:
`STABILIZED_REPAIRED_LAUNCH_QA_ONLY`
with `production_effect:false` and `mass_fill_enabled:false`.

## CJ lane recovery
All four `cj_prefilter_lane_0..3` lanes were stuck in running state since 2026-09-25 and referenced old pg_net response IDs that no longer existed.

The four lanes were reset to ready and restarted. New request IDs were created successfully.

First recovery batch:
- Three CJ items resolved an exact costed variant and were accepted by the 5-market readiness matrix.
- One observed matrix result passed GB + IL but held US/DE/AE.
- Another observed matrix result passed 0/5.
- These remain Shadow/HOLD as required; no false global-ready status was created.

## Important CJ display blocker
At the checkpoint:
- CJ pipeline ready: 1,177.
- CJ Image Technical PASS: 0.
- CJ Market5 PASS: 1.
- CJ Display Gate ready: 0.

This explains why the clean Cinematic preview looked EPROLO-heavy. Supplier mixing must come from real CJ readiness evidence, not forced visual balancing.

## Storefront rules already applied on launch-flow branch
- Supplier identity is hidden from shopper cards and Product World.
- Shopper-facing badge is HUNT VERIFIED.
- HUNT preview price uses existing `profit_gate_v2.target_retail_usd`.
- Account entry is connected to the existing HUNT auth page.
- Product World remains Exact Shelf → Same Department → BOOM For You → Separate Other Worlds.
- BOOM may rank; it may not rewrite canonical taxonomy.

## Kill switches confirmed
- `hunt_payment_live = false`
- `hunt_supplier_order_live = false`
- Production taxonomy publish remains outside this branch.

## Next execution order
1. Promote P0 existing pipeline through Image/Market readiness.
2. Build market-aware CJ/EPROLO shelf balance without fake 50/50.
3. Lock department/category navigation and accessibility.
4. Run Login → Session → Profile → Likes/Saves → Cart → Logout regression.
5. Connect larger filtered catalog population to Cinematic preview.
6. Final destination shipping + fees + reserve + net-profit gate.
7. Mobile/performance/accessibility QA.
8. Checkout PR regression and integration.
9. Netlify RC1 only after these pass.
