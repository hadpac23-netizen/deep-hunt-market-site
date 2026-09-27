# HUNT Women P0 Continue — 2026-09-27

## Scope
Preview/shadow only. No Production publish, no payment activation, no supplier live ordering, no Netlify deploy.

## Women improvements completed
- Women Suits & Blazers opened with an already Market5 + Image + Profit-ready EPROLO candidate.
- Women Pants & Shorts opened with item 30202694 after:
  - Profit REVIEW already positive
  - exact variant present
  - Market5 5/5 PASS: US / DE / GB / IL / AE
  - Image Technical PASS
  - exact Women Bottoms semantic route correction
- Women Underwear remains populated with 9 verified items including basic/sports/maternity bra coverage.
- Women Shoes remains open with a verified product.
- Women Dresses and Swim remain open.

## CJ work
CJ was explicitly checked rather than ignored.

Three high-confidence CJ candidates were preflighted:
- 2 Women Shoes candidates
- 1 Women Blazer candidate

All had costed variants.

Market5 results did not justify promotion:
- Some destinations returned NO_LIVE_COSTED_VARIANT_WITH_SHIPPING.
- The CJ blazer had an HTTP 500 for US and no verified shipping for IL.
- No CJ candidate was promoted without 5/5.

No automatic retry loop was used.

## EPROLO discovery
Existing data shows useful category signals:
- category 164: many Women bottoms / pants candidates
- categories 155 / 158: Women tailoring / blazers / suits
- category 108: denim/jeans but mostly unisex / mixed-gender candidates
- category 68: swimwear
- category 64 / 1224: footwear

The existing basic-fill and targeted-basic functions were inspected:
- hunt-basic-apparel-targeted-run-once: underwear/basic apparel only
- hunt-basic-fill-v4: underwear/basic apparel only
- hunt-cj-shelf-fill: disabled (410)
None were misused for Jeans/Pants/Suits.

## Profit truth rule
No new profit formula was invented.
- Products with existing PROFIT_REVIEW may continue through Market5/Image/Semantic gates.
- EPROLO candidates without Profit REVIEW remain blocked.
- hunt-profit-engine does not support EPROLO; it was not misapplied.

## Current 141-route state
- FULL: 1
- GOOD: 4
- THIN: 64
- EMPTY: 72
- Active exact routes: 69/141
- Semantic accepted products: 248

## Current Women routes
- women/women-dresses: 3 (THIN)
- women/women-evening: 6 (THIN)
- women/women-suits: 1 (THIN)
- women/women-tops: 1 (THIN)
- women/women-jeans: 0 (EMPTY)
- women/women-bottoms: 1 (THIN)
- women/women-skirts: 2 (THIN)
- women/women-knitwear: 2 (THIN)
- women/women-outerwear: 1 (THIN)
- women/women-underwear: 9 (THIN)
- women/women-sleepwear: 16 (GOOD)
- women/women-swim: 1 (THIN)
- women/women-shoes: 1 (THIN)
- women/women-socks: 2 (THIN)
- women/women-hoodies: 1 (THIN)

## Next Women P0
1. Women Jeans: require stronger gender/category evidence; do not map unisex denim automatically.
2. Increase Pants & Shorts depth using category 164, but only rows with existing Profit REVIEW.
3. Increase Suits & Blazers depth once Profit REVIEW is available for the already Market5+Image candidates.
4. Continue selective CJ Market5 only after costed-variant preflight.
