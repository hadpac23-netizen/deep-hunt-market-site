# HUNT CJ → Shadow Shelf Refresh — 2026-09-27

## CJ readiness results

Two CJ candidates currently have Market5 5/5 and Image Technical PASS:

1. Beauty / Makeup
   - Shopper-facing title: PHOFAY Double Head Seal Liquid Eyeliner
   - Image QA: PASS, 1200×1200, 146895 bytes
   - Shadow public ref: e99b11be5f247930752cb4d1
   - Semantic correction: Beauty/Makeup identity policy expanded to recognize canonical makeup types including eyeliner.

2. Accessories / Jewelry Rings
   - Shopper-facing title: Personality Hand Wrapped Rough Stone Agate Ring
   - Image QA retry: PASS, 1000×1000, 150984 bytes
   - Shadow public ref: 5f57b108cb2d787005ea68e6
   - Exact taxonomy correction: accessories/jewelry → accessories/jewelry-rings.
   - Original source route remains recorded in taxonomy evidence.

Both remain Shadow-only:
- Production exposure: false
- Payment Live: OFF
- Supplier Live Order: OFF
- Profit status: REVIEW
- Physical quality: not final

## Image QA pipeline repair

The dispatcher now treats both runner v2 and v3 as existing technical-image evidence, preventing duplicate dispatches after the current v3 Edge Function writes an observation.

## Shadow Catalog

Endpoint:
`hunt-cinematic-shadow-catalog` v2

The endpoint accepts:
- MARKET5_READY_STYLE_PHYSICAL_PENDING
- MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING
- MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED

Supplier identity is masked to HUNT and public IDs are hashed HUNT refs.

## 141-shelf refresh

Fresh endpoint source:
- Shadow source products: 282
- Shadow source routes: 45

After the Cinematic semantic gate:
- Accepted: 203
- Excluded: 79
- Active exact routes: 40
- Configured exact routes: 141

Shelf state:
- FULL: 1
- GOOD: 4
- THIN: 35
- EMPTY: 101

FULL:
- accessories/bags — 35

GOOD:
- women/women-sleepwear — 15
- men/men-bottoms — 22
- kids/baby — 17
- kids/baby-clothing — 18

Highest THIN:
- travel/luggage — 11
- accessories/socks — 9
- men/men-tops — 8
- kitchen/kitchen-tools — 7
- women/women-evening — 6
- beauty/beauty-tools — 5
- home/cushions-throws — 5
- pets/pet-grooming — 5
- pets/pet-accessories — 4
- beauty/makeup — 3

## Next priority

Promote existing Profit+Stock pipeline into the 101 EMPTY shelves before any broad new sourcing. Keep exact taxonomy fail-closed; do not borrow products from adjacent shelves to fake density.
