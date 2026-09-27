# HUNT Accessories — BOOM Stylist Curation — 2026-09-27

## Scope
Shadow/preview only.
- Production taxonomy publish: OFF
- Payment: OFF
- Supplier Live Order: OFF
- Netlify deploys used: 0

## Curation rule
Every product stays inside its exact canonical shelf.

Within a shelf, display order is now:
1. BOOM Stylist score
2. Projected product contribution
3. Verified inventory

No Stylist rank can mutate canonical taxonomy.

## Identity cleanup
367 legacy Jewelry misroutes were moved to HOLD in Shadow only.
- Nothing deleted.
- Nothing auto-remapped to a new category.
- HOLD reason: FAIL_EXACT_JEWELRY_IDENTITY_NO_AUTO_REMAP

Post-clean verification:
- Remaining exact Jewelry identity violations: 0

Examples blocked from Necklaces include:
- apparel that merely contains "necklace" or "pendant"
- Christmas/home pendants
- keychains and bag pendants
- teething items
- lamps / pendant lights
- display stands
- swimwear and clothing

Rings also block clothing ring-details, smart rings and utility-ring meanings.
Bracelets block smart/fitness bands, watch storage and phone-case meanings.
Earrings block audio/ear-cleaning meanings while allowing animal-themed jewelry.

## New BOOM Stylist picks promoted
All passed:
- Catalog Safety
- positive PROFIT_REVIEW
- verified inventory
- Market5 5/5: US / DE / GB / IL / AE
- Image Technical PASS
- exact semantic shelf identity

### Earrings
- S925 minimalist retro metallic layered hoop earrings
  - Stylist: 69
  - HUNT price: $6.99
  - Projected contribution: $4.86

### Necklaces
- Elegant titanium steel pearl necklace / minimalist choker
  - Stylist: 69
  - HUNT price: $10.99
  - Projected contribution: $4.73
- Colorful crystal luxe clavicle necklace
  - Stylist: 62
  - HUNT price: $46.99
  - Projected contribution: $16.48

### Rings
- S925 pure silver woven wave center-stone ring
  - Stylist: 62
  - HUNT price: $13.99
  - Projected contribution: $4.90

### Bracelets
- Luxury full-diamond crystal bracelet
  - Stylist: 69
  - HUNT price: $8.99
  - Projected contribution: $4.79
- Copper zirconia tennis bracelet, minimalist/elegant
  - Stylist: 69
  - HUNT price: $11.99
  - Projected contribution: $4.50

## Current first display order

### Earrings
1. S925 minimalist layered hoops — Stylist 69
2. novelty dangle earrings — Stylist 55

### Necklaces
1. pearl minimalist choker — Stylist 69
2. crystal luxe necklace — Stylist 62 / higher profit
3. S925 heart necklace — Stylist 55
4. Y2K necklace/bracelet — Stylist 55

### Rings
1. cultured lab-grown diamond ring — Stylist 62 / projected contribution $214.63
2. S925 woven-wave ring — Stylist 62
3. S925 bow ring — Stylist 62
4. rough stone agate ring — no Stylist score, therefore later

### Bracelets
1. luxury crystal bracelet — Stylist 69
2. zirconia tennis bracelet — Stylist 69
3. braided friendship bracelet — Stylist 62
4. S925 bracelet — Stylist 55 / high projected contribution
5. sterling silver bracelet — Stylist 55

## Important profit truth
These are still PROFIT_REVIEW values.
FINAL PROFIT VERIFIED remains false until destination-specific final shipping, fees and reserves are closed.

## Implementation
- hunt-cinematic-shadow-catalog v3 now exposes stylist_score.
- Shadow SQL sorts each exact route by Stylist → contribution → inventory.
- Cinematic routeProducts() applies the same ranking client-side.
- Jewelry & Watches remains the first featured Accessories group.
- Women "Complete the look" keeps direct links to Earrings, Necklaces, Rings and Bags.
