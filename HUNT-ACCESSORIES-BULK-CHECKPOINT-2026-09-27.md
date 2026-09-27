# HUNT Accessories Bulk Checkpoint — 2026-09-27

## Scope
Shadow/preview only.
- Production publish OFF
- Payment OFF
- Supplier Live Order OFF
- Netlify deploys used: 0

## Bulk batches completed

### Jewelry
- Earrings: GOOD
- Necklaces: GOOD
- Rings: GOOD
- Bracelets: GOOD
- Ranked by BOOM Stylist → projected contribution → stock
- 367 legacy Jewelry misroutes held

### Hats / Hair / Sunglasses / Watches
Market5 batch:
- 41/41 passed 5/5 destinations

Image QA:
- Hair Accessories: 12/12 PASS
- Hats: 12/12 PASS
- Sunglasses: 6/8 PASS
- Watches: 6/9 PASS

Promoted only PASS items.

### Keychains / Bag Accessories / Socks
Market5:
- 28/28 passed 5/5 destinations

Image QA:
- Bag Accessories: 12/12 PASS
- Keychains: 10/12 PASS
- Socks: 4/4 PASS

Promoted only PASS items.

## Identity cleanup
Legacy exact-accessory cleanup moved rows to HOLD only:
- Watches / Hats / Hair / Sunglasses / Belts cleanup: 330 HOLD
- Keychains / Bag Accessories / Socks / Scarves / Gloves cleanup: 126 HOLD

Nothing deleted.
No automatic cross-category remap.

## Current Accessories
- accessories/jewelry-necklaces: 13 (GOOD)
- accessories/jewelry-rings: 14 (GOOD)
- accessories/jewelry-earrings: 13 (GOOD)
- accessories/jewelry-bracelets: 12 (GOOD)
- accessories/jewelry: 1 (THIN)
- accessories/watches: 7 (THIN)
- accessories/bags: 32 (FULL)
- accessories/hats: 16 (GOOD)
- accessories/belts: 1 (THIN)
- accessories/scarves: 0 (EMPTY)
- accessories/keychains: 11 (THIN)
- accessories/gloves: 0 (EMPTY)
- accessories/hair-accessories: 14 (GOOD)
- accessories/bag-accessories: 12 (GOOD)
- accessories/socks: 9 (THIN)
- accessories/sunglasses: 7 (THIN)

## Overall 141-route state
- FULL: 1
- GOOD: 12
- THIN: 72
- EMPTY: 56
- Active routes: 85/141
- Semantic accepted products: 412
- Shadow source products: 464

## Remaining Accessory blockers
- Belts: current pool is mostly products merely containing the word belt; keep fail-closed.
- Scarves: existing pool is mostly clothing-with-scarf / shawl-apparel, not standalone scarves.
- Gloves: no sufficiently clean profit+style candidate pool yet.
- Watches and Sunglasses may still need more depth after current PASS set.
- Final Profit Verified still separate from PROFIT_REVIEW.
