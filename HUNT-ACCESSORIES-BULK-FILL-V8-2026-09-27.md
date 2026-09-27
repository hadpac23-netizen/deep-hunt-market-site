# HUNT Accessories Bulk Fill V8 — 2026-09-27

Shadow / preview only.
Production Effect: OFF.
Sellable: OFF.
Payment: OFF.
Supplier Live Order: OFF.

## Belts V8
- Supplier-native EPROLO metadata was used instead of broad keyword matching.
- 2 new exact Fashion Belts were identified:
  - item 19878607 — Leather Belt Ladies INS Style...
  - item 2049494 — Hollowed Out Flower Belts...
- Both had exact variants, fresh supplier cost/stock, Catalog Safety PASS and clean Stylist precheck.
- Market5: 2/2 passed US / DE / GB / IL / AE.
- Image Technical QA: 2/2 PASS.
- Shadow curated: +2.
- Current curated Belts: 3.

## Scarves / Wraps
- CJ native source category Scarves & Wraps was audited.
- Product-detail refresh recovered exact variant/cost truth for three existing scarf candidates.
- Explicit-variant Market5 results: 3/5, 1/5, 3/5.
- 0 new Scarves promoted.
- Current curated Scarves & Wraps: 1.
- Further CJ scale scan stopped after upstream 429 rate limiting; no retry loop.

## Gooten / Printful discovery
- Current read-only multi-provider catalog build returned 658 unique products.
- Gooten Bandanas product 155 is present in the technical catalog:
  - supplier base price: $7.40
  - availability verified: true
- No provider shipping observations or unit economics exist for Gooten/Printful.
- No Gooten/Printful credentials are present in Vault.
- Bandanas are not currently an exact HUNT taxonomy shelf.
- Gooten Bandana 155 was recorded as SUPPLIER_DISCOVERED only:
  - route_status: EXACT_SHELF_MISSING
  - market5_status: PENDING_PROVIDER_CREDENTIALS
  - candidate_promotion: false
  - production_effect: false
- Gooten marketing catalog lists Scarves/Bandanas, but Scarves were not present in the active technical catalog build and therefore were not treated as live inventory.
- Printful marketing pages list Bandana/Neck Gaiter, but those products were not present in the public API build used by HUNT and therefore were not promoted.

## Current curated accessory counts
- Bag Accessories: 13
- Belts: 3
- Gloves: 16
- Hair Accessories: 13
- Hats: 13
- Keychains: 12
- Scarves & Wraps: 1
- Socks: 16
- Sunglasses: 20
- Watches: 13

## Safety / launch controls
Production Effect = 0
Sellable = 0
Payment = OFF
Supplier Live Order = OFF

Exact shelf identity remains mandatory.
No keyword-only promotion.
No REVIEW/HOLD image is promoted.
No supplier marketing-page item is treated as live stock without technical catalog truth.
