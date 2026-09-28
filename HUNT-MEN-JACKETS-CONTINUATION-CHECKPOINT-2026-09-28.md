# HUNT Men Jackets Continuation Checkpoint — 2026-09-28

Mode: Shadow / Preview only
Production Effect: OFF
Sellable: OFF
Payment Live: OFF
Supplier Live Order: OFF

## Exact Men taxonomy
Preview taxonomy was normalized and syntax-checked.
Commits:
- cc0ac7d2ada0b4a73122ab563d76ef8c0ad47490 — normalize Men taxonomy order and completion sequence
- 74b1dc82a1ebe2cb1e4ce1fa89b42273de564b34 — enforce exact Men shelf semantics

Men completion sequence:
Jackets -> Knitwear -> Hoodies -> Nightwear -> Loungewear -> Swimwear -> Bags -> Socks -> Accessories -> deepen Tops/Shirts/Suits/Underwear/Boxers.

## Men Jackets — locked clean rows
1) item 29949926
- exact route: men / jackets
- route lock: LOCKED
- image: PASS
- 8 variants
- stock + shipping verified in US/DE/GB/IL/AE
- DE/GB/IL/AE: RESERVE_SAFE_PASS
- US: HOLD address-level tax required
- final_profit_verified=false

2) item 32677402
- exact route: men / jackets
- route lock: LOCKED
- image preview QA: PASS
- image: 800x800 JPEG, 98,907 bytes
- 15 variants
- stock + shipping verified in all 5 markets
- reserve floors:
  - DE $54.99
  - GB $53.99
  - IL $94.99
  - AE $54.99
- DE/GB/IL/AE: RESERVE_SAFE_PASS
- US: HOLD
- final_profit_verified=false

3) item 32590502
- exact route: men / jackets
- route lock: LOCKED
- image preview QA: PASS
- image: 800x800 JPEG, 131,551 bytes
- 12 variants
- stock + shipping verified in all 5 markets
- reserve floors:
  - DE $54.99
  - GB $53.99
  - IL $102.99
  - AE $55.99
- DE/GB/IL/AE: RESERVE_SAFE_PASS
- US: HOLD
- final_profit_verified=false

## Next two Jackets — truth verified, pricing pending
4) item 32590510
- image preview QA: PASS, 800x800 JPEG
- 15 variants
- 15/15 stock + shipping verified in AE/DE/GB/IL/US
- reserve-profit write pending due Postgres connection pressure
- DO NOT promote until reserve-pricing write verifies

5) item 32679860
- image preview QA: PASS, 800x800 JPEG
- 24 variants
- 24/24 stock + shipping verified in AE/DE/GB/IL/US
- reserve-profit write pending due Postgres connection pressure
- DO NOT promote until reserve-pricing write verifies

## Semantic hold
item 29949789
- Hanfu / robe / kimono style
- excluded from exact Men Jackets
- reason: ROBE_KIMONO_HANFU_NOT_EXACT_MENS_JACKET_SHELF

## Image QA preview adapter
New preview-only function:
- hunt-image-technical-qa-preview
- custom internal token auth
- direct DB access to avoid PostgREST schema-cache dependency
- production_effect=false
- sellable=false

## DB capacity status
Cron schedules were staggered and 3/3 canaries passed temporarily.
Later, Postgres degraded again while direct variant audits and background workers overlapped.
Recent heavy/startup-timeout jobs observed:
- job 3 hunt-boom-pulse
- job 129 EPROLO matrix dispatch
- job 132 EPROLO economics
- PostgREST schema-cache statement timeouts also observed.

At this checkpoint even SELECT 1 was timing out.
Fail-closed rule:
- stop DB writes/scans while canary fails
- do not duplicate already completed supplier audits
- when DB recovers, first reduce cadence of heavy jobs 3/129/132
- then calculate reserve pricing for items 32590510 and 32679860
- only after reserve PASS apply exact route lock
- continue Men Jackets before moving to Knitwear
