# HUNT Men Shoes Progress V25 — 2026-09-28

Mode: Shadow / preview only.
Production Effect: OFF.
Sellable: OFF.
Payment: OFF.
Supplier Live Order: OFF.

## Infrastructure recovery
Supabase/Postgres was suffering recurring statement/connection timeouts caused by overlapping HUNT cron workload and PostgREST schema introspection.

Applied reversible load reductions:
- hunt-catalog-enrichment-pipeline: moved to */30 minutes and batch sizes reduced to 10.
- hunt-eprolo-matrix-dispatch-stable: reduced to 4-59/10 and batch 2.
- hunt-eprolo-readiness-reconcile-stable: requested 11-59/20; verify before relying on this change.
- hunt-eprolo-economics-stable: 1-59/15.
- hunt-image-technical-reconcile-stable: 3-59/15.
- hunt-eprolo-underwear-variant-audit-stable: 5-59/15 and batch 1.
- hunt-image-technical-dispatch-stable: 7-59/15 and batch 2.
- hunt-eprolo-physical-evidence-dispatch-stable: 9-59/15 and batch 2.
- hunt-cj-costed-variant-prefilter-stable: 11-59/15.
- hunt-boom-score-catchup-stable and hunt-cj-readiness-reconcile-stable returned connection timeout during reschedule attempts; verify current schedules before further edits.

A long-running HUNT taxonomy cron backend was cancelled once to free DB capacity; its cron job remained enabled.

## Taxonomy overwrite bug found
The storefront enrichment/multishelf workers will rewrite rows unless their version markers are already final.

Exact curated rows must therefore lock:
- storefront_taxonomy_version = HUNT_STOREFRONT_V1
- storefront_multishelf_version = HUNT_MULTI_V2
- storefront_semantic_version = HUNT_SEMANTIC_V2
- storefront_precision_version = HUNT_PRECISION_V1
- taxonomy_exact_lock = LOCKED

This prevents a valid Men route from being overwritten back to lifestyle or an incorrect semantic shelf.

## Men Shoes current state
Owner-approved operational route:
- department: men
- shelf: shoes
- subcategory: mens-footwear
- target_min: 250

Three EPROLO products currently have:
- Market5 5/5
- Image Technical PASS
- Catalog Safety PASS
- Stylist PASS / no IP / no hold

Items:
- 31998888
- 31411072
- 12515068

These are route-locked to men / shoes and remain Shadow-only.

Important: none of these three is counted FULLY_READY yet.
Current Profit Gate remains PROFIT_REVIEW / final_profit_verified=false because destination shipping economics must be proven.

One additional item:
- 10719039
- Market5 PASS
- Image Technical HOLD
- excluded from curation.

## Profit truth
hunt-eprolo-country-shadow was identified as the correct live path for:
- exact variant enforcement
- destination shipping price
- supplier cost
- active owner-approved profit profile
- retail floor
- contribution
- margin
- country PASS/HOLD

10 country-profit checks were queued for:
- 31998888 / 720490497
- 31411072 / 712348555
Across US / DE / GB / IL / AE.
Request IDs: 14885-14894.
At checkpoint time they remained queued; no result was fabricated.

## New Men Shoes batch
20 additional clean EPROLO Men Shoes candidates with exact variants were queued to fresh Market5 5/5.
Request IDs: 14895-14914.

No product from this new batch is marked Market5 PASS until fresh country results are read.
No product is counted FULLY_READY without:
1. exact Men Shoes identity
2. Catalog Safety PASS
3. verified stock + exact variant + cost
4. Market5 5/5
5. Image Technical PASS
6. Stylist PASS / IP clear
7. 5-country destination shipping + economics PASS
8. exact route lock
9. Production Effect OFF
10. Sellable OFF
