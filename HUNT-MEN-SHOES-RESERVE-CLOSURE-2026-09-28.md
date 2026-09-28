# HUNT Men Shoes Reserve Closure — 2026-09-28

Mode: Shadow / Preview only.
Production Effect: OFF.
Sellable: OFF.
Payment Live: OFF.
Supplier Live Order: OFF.

## Exact shelf
Department: men
Shelf: shoes

Verified locked curated product rows:
- 29095 / item 12515068
- 29623 / item 31998888
- 29688 / item 31411072

All remain:
- storefront_department=men
- storefront_shelf=shoes
- taxonomy_exact_lock=LOCKED
- boom_stylist_curated=true
- production_effect=false
- sellable=false

## Variant-market audit
3 products
83 exact variants
5 markets = 415 variant-market rows

Private shadow table:
private.hunt_variant_market_shadow_pricing

Results:
- DE: 83/83 RESERVE_SAFE_PASS, floor $16.99–$29.99
- GB: 83/83 RESERVE_SAFE_PASS, floor $15.99–$27.99
- IL: 83/83 RESERVE_SAFE_PASS, floor $25.99–$57.99
- AE: 83/83 RESERVE_SAFE_PASS, floor $17.99–$30.99
- US: 83/83 HOLD — address-level tax/nexus required

All four reserve markets remain tax_verified=false and final_profit_eligible=false.
RESERVE_SAFE_PASS means conservative shadow profit screening only, not Final Profit Verified.

Minimum projected margin after reserve:
- DE ~20.34%
- GB ~20.27%
- IL ~20.10%
- AE ~20.51%

Minimum projected contribution after reserve:
- DE $4.27
- GB $4.37
- IL $5.24
- AE $4.35

Candidate rows now carry:
- men_shoes_shadow_pricing_version=HUNT-MEN-SHOES-RESERVE-V1
- men_shoes_shadow_pricing_status=RESERVE_SAFE_4_MARKETS_US_HOLD
- men_shoes_final_profit_verified=false
- production_effect=false
- sellable=false

DB verification after write:
- shadow rows = 415
- 3/3 canary SQL PASS

Next: Men Jackets exact-route candidate discovery and fresh supplier truth.
