# HUNT Men Jackets Progress — 2026-09-28

Mode: Shadow / Preview only
Production Effect: OFF
Sellable: OFF
Payment Live: OFF
Supplier Live Order: OFF

## Tax reserve scope
private.hunt_tax_reserve_rules was generalized from adult_footwear to adult_apparel for DE/GB/IL/AE/US so the same conservative reserve logic can be used for adult jackets without claiming transaction tax truth.

## First exact Men Jacket promoted in Shadow
Candidate:
- row id 26341
- item 29949926
- title: Vintage stand up collar vintage couple denim jacket for men

Truth checks:
- Market5=true
- Image Technical=PASS
- Catalog Safety=PASS
- Stylist=PASS
- IP=false
- hold=false
- fresh full variant audit run across US/DE/GB/IL/AE

Variant audit:
- 8 exact variants
- every market: 8/8 in stock
- every market: 8/8 shipping verified
- out of stock: 0

Reserve-aware shadow pricing:
- DE: 8/8 RESERVE_SAFE_PASS, required floor $45.99, min projected contribution $9.47, min margin ~20.59%
- GB: 8/8 RESERVE_SAFE_PASS, required floor $44.99, min projected contribution $9.42, min margin ~20.94%
- IL: 8/8 RESERVE_SAFE_PASS, required floor $68.99, min projected contribution $13.97, min margin ~20.25%
- AE: 8/8 RESERVE_SAFE_PASS, required floor $45.99, min projected contribution $9.85, min margin ~21.42%
- US: 8/8 HOLD — address-level tax/nexus required

Exact route lock applied:
- storefront_department=men
- storefront_shelf=jackets
- taxonomy_exact_lock=LOCKED
- boom_stylist_curated=true
- production_effect=false
- sellable=false
- final profit verified=false

## Semantic hold
Candidate 37796 / item 29949789:
- Hanfu / robe / kimono jacket
- explicitly held from Men Jackets exact shelf
- boom_stylist_curated=false
- reason: ROBE_KIMONO_HANFU_NOT_EXACT_MENS_JACKET_SHELF

## Fresh Market5 batch
10 clean exact-jacket candidates submitted once:
- request 14975 item 32695977
- request 14976 item 32677402
- request 14977 item 32679860
- request 14978 item 30723547
- request 14979 item 32590510
- request 14980 item 32590502
- request 14981 item 30728767
- request 14982 item 30728612
- request 14983 item 30728553
- request 14984 item 30728538

All HTTP submissions returned 202.
No fresh matrix observations were present at checkpoint time.
Do not duplicate these requests.
Next action when results appear:
Market5 5/5 -> Image QA -> full variant-country audit -> reserve-aware shadow pricing -> exact route lock.
