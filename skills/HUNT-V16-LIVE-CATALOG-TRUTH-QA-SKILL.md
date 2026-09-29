---
name: hunt-v16-live-catalog-truth-qa
description: HUNT V16 reusable catalog-fill, product QA, price, variant, shelf and shopper-interface gate.
---

# HUNT V16 Live Catalog Truth QA

Use whenever filling shelves, changing catalog feeds, adding products, or editing shopper-facing product data.

## Inputs
- hunt_shelf_candidates
- hunt-cinematic-shadow-catalog
- HUNT taxonomy route
- Product Detail response
- image technical evidence
- Market5 evidence
- HUNT profit gate

## Gate order
1. Catalog safety PASS.
2. Availability verified and positive stock.
3. Taxonomy REMAP to one exact department/shelf.
4. Route/title semantic fit.
5. HTTPS image and Image Technical PASS.
6. Market5 all-pass.
7. Positive HUNT target retail and projected product contribution.
8. Deduplicate by route + normalized title + image.
9. Hide provider/supplier identity in shopper UI.
10. Load live Product Detail before claiming size/color availability.
11. If detail fails, use cached evidence only as disabled/read-only options.
12. Never increase readiness from visual completeness alone.

## Shelf fill
- Rank shelves by verified product count.
- Keep fuller shelves visible first.
- Do not fill an exact shelf with adjacent-category products.
- Use More for valid secondary departments.
- Thin shelves remain discoverable but should not crowd primary navigation.
- Do not use stale static products to fake fullness when live gates fail.

## Price rules
- Card: show positive HUNT target retail.
- PDP: verified retail wins.
- Target retail may be displayed while final shipping-inclusive profit remains pending.
- No fake sale, MSRP or discount badge.
- No checkout activation from target price alone.

## Variant rules
- Live provider detail is preferred.
- Render exact variant options from live detail.
- Do not infer a color or size from title text unless the provider detail explicitly provides it.
- Do not construct a size×color Cartesian product from separate evidence arrays.
- Cached option evidence can be shown disabled if detail is temporarily unavailable.

## Image QA
- Image Technical PASS is mandatory.
- Remove obvious same-image duplicates.
- Flag route/title/image mismatch for review.
- Do not use generated replacement product imagery as evidence of the real product.

## Auth/UI
- Email magic link remains available.
- Social provider buttons are visible only when the Auth settings endpoint says enabled.
- Shopper pages never show internal source/provider names.
- HUNT links remain inside V16.

## Required checks before handoff
- JavaScript syntax PASS
- no legacy V2–V15 links
- no shopper-facing supplier names
- all visible product cards have image + positive price
- all displayed products pass current catalog filters
- Product page can render from session cache
- Production/Payments/Supplier Live remain unchanged unless explicitly approved
