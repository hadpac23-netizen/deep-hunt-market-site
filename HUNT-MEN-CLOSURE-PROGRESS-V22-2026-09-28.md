# HUNT Men Closure Progress V22 — 2026-09-28

Shadow / preview only.
Production Effect: OFF.
Sellable: OFF.
Payment: OFF.
Supplier Live Order: OFF.

## Taxonomy alignment
Cinematic Men taxonomy was aligned with the active owner-approved operational taxonomy.
Added Preview shelves:
- men-shorts
- men-nightwear
- men-loungewear
- men-swimwear

Taxonomy commit:
- e7ab28cccb39bb4734bc1fca098b45c74e34e51a

## Newly curated in this Men closure pass
All rows below were already required to have current Market5 5/5, Image Technical PASS, Catalog Safety PASS, and clean Stylist precheck before curation.

- Men Jeans: +41
- Men Shorts: +37
- Men Underwear: +1
- Men Boxers: +1
- Men Tops: +5
- Men Suits / Blazers: +1
- Men Shirts: +1

## Routing correction
An earlier temporary remap moved 37 exact Men Shorts into men-bottoms because the Cinematic taxonomy did not expose men-shorts.
After reconciling against public.hunt_storefront_taxonomy, men-shorts was confirmed active and owner-approved.
The Preview taxonomy was updated and those 37 rows were restored to:
- department: men
- shelf: men-shorts
- boom_stylist_curated: true
- production_effect: false
- sellable: false

## Operational Men taxonomy discovered
Owner-approved targets include:
- men-tops
- men-shirts
- men-jeans
- men-bottoms
- men-shorts
- jackets
- knitwear
- hoodies
- men-tailoring
- men-underwear
- men-nightwear
- men-loungewear
- men-swimwear
- shoes
- accessories

Men Underwear also has explicit subcoverage:
- boxers-short
- briefs
- trunks
- long-underwear
- thermal-base-layer

## Current infrastructure blocker
Supabase management / PostgREST path continues to time out on filtered candidate scans.
Recent Postgres logs show repeated:
- canceling statement due to statement timeout
- PostgREST schema-introspection SELECT timeouts
- connection resets
- pg_cron startup timeouts

The 11 heavy HUNT catalog/readiness/image cron jobs were temporarily disabled while performing targeted Men updates.
No BOOM / F60T / growth jobs were disabled.

No unverified Men product was promoted merely to increase shelf counts.

## Remaining Men closure work
Need current-source completion for:
- Outerwear / Jackets
- Knitwear
- Hoodies
- Nightwear
- Loungewear
- Swimwear
- Shoes
- Bags
- Socks
- Accessories
- further depth for Tops / Shirts / Suits / Underwear / Boxers

Do not mark Men closed until those shelves are reconciled through the same gates.
