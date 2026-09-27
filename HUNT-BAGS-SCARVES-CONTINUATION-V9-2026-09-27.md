# HUNT Bags / Scarves Continuation V9 — 2026-09-27

Shadow / preview only.
Production Effect: OFF.
Sellable: OFF.
Payment: OFF.
Supplier Live Order: OFF.

## Scarves continuation
- EPROLO false positive "Dental disposable scarves..." identified and held out of fashion Scarves.
- CJ exact native Scarves refreshed with product-detail truth.
- Two previously token-failed scarves recovered:
  - 2508221234211623300 — 6 costed variants, min supplier cost $4.86.
  - 2508270321311605800 — 11 costed variants, min supplier cost $2.90.
- Both were tested with explicit canonical variants across US / DE / GB / IL / AE.
- Both failed full Market5:
  - US had NO_LIVE_COSTED_VARIANT_WITH_SHIPPING.
  - Remaining markets produced a mix of PASS / UNKNOWN.
- No new Scarves promoted.
- Heated/electric scarves remain COMPLIANCE_HOLD.
- Current curated Scarves & Wraps remains 1.

## Bags exact routing
Existing Market5 + Image + Style + Safety rows were re-routed by primary product identity rather than generic "bag" keyword presence.

### V9 routing
- +1 Accessories / Bags
- +12 Kids / Kids Accessories
- +4 Travel / Luggage

### V10 routing
- +1 Accessories / Bags
- +1 Kids / Kids Accessories
- +11 Travel / Luggage

### V11 style reconciliation
Only clean exact bag identities with:
- Market5 PASS
- Image Technical PASS
- Catalog Safety PASS
- Stylist precheck PASS
- no IP flag
- no Stylist hold
were reconciled.

Promoted:
- +3 Accessories / Bags
- +2 Kids / Kids Accessories

False positives held:
- utility vest misread as bag
- motorcycle clutch handle
- heated gloves / handbag wording
- kids phone watch
- water shoes
- pencil/stationery bags
- microscope toy
- swimsuit "bag hip" wording
- parachute toy

## Image retry
Five real bag candidates previously failed with IMAGE_FETCH_FAILED and received one clean retry:
- diaper bag
- kids dinosaur backpack
- 3 evening / crystal clutch bags

Result:
- 5/5 remained IMAGE_FETCH_FAILED.
- No repeat retry loop.
- All remain IMAGE_HOLD.

Two additional candidates remain held for stable image quality issues:
- IMAGE_DIMENSIONS_TOO_SMALL
- IMAGE_FILE_TOO_SMALL

## Current curated routes
- Accessories / Bags: 5
- Kids / Kids Accessories: 15
- Travel / Luggage: 15

## Safety controls
Production Effect = 0
Sellable = 0
Payment = OFF
Supplier Live Order = OFF

No REVIEW/HOLD product was promoted.
No false-positive bag keyword match was moved into Bags.
Exact route identity remains mandatory.
