# HUNT WOMEN CATEGORY CLOSURE START — 2026-09-28

Status: BLOCKED_BY_DATABASE_CONTENTION
Branch: preview/hunt-cinematic-first-exact-categories-v2

## Canonical Women exact shelves
1. women-dresses — Dresses
2. women-evening — Evening & Occasion
3. women-suits — Suits & Blazers
4. women-tops — T-Shirts, Tops & Blouses
5. women-jeans — Jeans & Denim
6. women-bottoms — Pants & Shorts
7. women-skirts — Skirts
8. women-knitwear — Knitwear & Sweaters
9. women-outerwear — Jackets & Coats
10. women-underwear — Underwear & Bras
11. women-sleepwear — Sleepwear
12. women-swim — Swimwear
13. women-shoes — Shoes
14. women-socks — Socks
15. women-hoodies — Hoodies & Sweatshirts

## Closure rules
Each shelf must be completed independently.
No cross-shelf filling.
No keyword-only routing.
No product may be marked curated unless it passes:
- exact taxonomy identity
- catalog safety
- verified stocked variant
- fresh cost
- Market5 5/5
- Image Technical PASS
- Stylist/IP PASS
- Shadow only

## Current infrastructure blocker
Supabase execute_sql is timing out even for count(*) queries.

Postgres logs show:
- repeated "canceling statement due to statement timeout"
- repeated "cron job ... job startup timeout"
- concurrent heavy HUNT pg_cron jobs
- CJ readiness reconcile timing out
- Image Technical QA reconcile timing out
- EPROLO matrix / physical evidence dispatch jobs starting concurrently
- management/PostgREST connections being reset

No Women shelf counts were invented.
No Women product was promoted while DB truth was unavailable.

## Safety / launch controls
Production Effect: OFF
Sellable: OFF
Payment: OFF
Supplier Live Order: OFF

No cron job was disabled or rescheduled.
No Production configuration was changed.
