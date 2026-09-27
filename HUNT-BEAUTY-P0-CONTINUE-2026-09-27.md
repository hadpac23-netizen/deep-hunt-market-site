# HUNT Beauty P0 Continue — 2026-09-27

## Scope
Shadow/preview only. Production / Payment / Supplier Live Order remain OFF.

## Current Beauty coverage
- Skincare: 1 THIN
- Body Care: 0 EMPTY
- Makeup: 3 THIN
- Nails: 0 EMPTY
- Hair & Wigs: 1 THIN
- Beauty Tools: 6 THIN
- Fragrance: 0 EMPTY

Coverage: 4 / 7 routes open.

## Guardrails added
Exact semantic policies now fail closed for:
- Body Care
- Fragrance
- Nails (already hardened)

Body Care excludes misleading health/weight-loss/intimate/pet/baby uses.
Fragrance excludes empty bottles, car fragrance, candles, diffusers, deodorant, shower gel and hair spray.

## Why the three routes remain empty
### Body Care
No current candidate has the complete Safety + Profit + Market5 + Image evidence stack with exact body-care identity.

### Nails
Existing candidates are currently false positives, pet grooming, packaging, or incomplete evidence.

### Fragrance
No product is promoted merely because its title contains perfume/fragrance.
Authenticity/source/IP proof is required before HUNT treats fragrance as a real retail shelf.

No fake density was used.
