# HUNT Commerce Navigation + Women + Quick Find — 2026-09-27

## Scope
Preview branch only: `preview/hunt-cinematic-launch-flow-v1`

Unchanged safety controls:
- Payment Live: OFF
- Supplier Live Order: OFF
- Production taxonomy publish: OFF
- Netlify deploys used for this work: 0

## Navigation hierarchy
Existing canonical truth is unchanged:
Department → Category → Exact Shelf → Products

Grouped browsing was added above canonical categories:
- Women: Clothing / Lingerie & Sleep / Shoes / Swim / Occasion
- Men: Clothing / Underwear & Basics / Shoes & Bags / Accessories
- Kids: Kids / Baby Clothing / Baby Essentials
- Accessories: Jewelry / Bags & Small Accessories / Wear / Hair & Basics
- Tech: Phone Essentials / Audio & Wearables / Devices & Home / Computer & Gaming
- Home: Decor / Textiles & Windows / Storage & Furniture / Care & Utility
- Pets: Everyday / Play & Care / Comfort / Aquarium
- Sports: Training / Outdoor & Cycling / Gear & Bags

Programmatic coverage check:
- 0 missing grouped categories
- 0 duplicate grouped categories
- JS syntax PASS

## Women shelf type views
These are presentation filters only; they do not change canonical_route.

Underwear & Bras:
- Bras
- Briefs & Knickers
- Thongs
- Lingerie Sets
- Shapewear
- Bodysuits
- Sports Bras
- Maternity & Nursing

Sleepwear:
- Pajamas
- Nightwear
- Robes & Dressing Gowns
- Sleep Sets

Shoes:
- Sneakers & Trainers
- Heels
- Sandals
- Boots
- Flats & Loafers
- Slippers

Swim:
- Bikinis
- One-Piece
- Cover-Ups

Dresses:
- Mini
- Midi
- Maxi

Zero-count type filters are disabled; HUNT never borrows from another shelf to fake density.

## Women taxonomy cleanup completed
- Opened / corrected Women Dresses from verified existing inventory.
- Opened Women Swimwear from verified existing inventory.
- Moved a sleepwear misroute out of Women Underwear into Women Sleepwear.
- Opened Women Shoes from an already Market5 + Image verified shoe candidate.
- Added 8 already verified basic/sports/maternity bras into Women Underwear.
- Hardened exact identity policies for Women Dresses, Underwear, Swim, Jeans, Bottoms, Shoes.

## Women current Shadow counts
- women/women-dresses: 3 (THIN)
- women/women-evening: 6 (THIN)
- women/women-suits: 0 (EMPTY)
- women/women-tops: 1 (THIN)
- women/women-jeans: 0 (EMPTY)
- women/women-bottoms: 0 (EMPTY)
- women/women-skirts: 2 (THIN)
- women/women-knitwear: 2 (THIN)
- women/women-outerwear: 1 (THIN)
- women/women-underwear: 9 (THIN)
- women/women-sleepwear: 16 (GOOD)
- women/women-swim: 1 (THIN)
- women/women-shoes: 1 (THIN)
- women/women-socks: 2 (THIN)
- women/women-hoodies: 1 (THIN)

## Overall 141-route state
- FULL: 1
- GOOD: 4
- THIN: 63
- EMPTY: 73
- Active routes: 68/141
- Semantic accepted products: 244

## Quick Find
A zero-credit canonical Quick Find was added to the Cinematic header.

It searches only:
1. Departments
2. Configured exact shelves
3. Products already accepted by the gated in-memory index

It does not query raw suppliers and cannot bypass Taxonomy / Market5 / Image / Profit gating.

Interaction:
- Search by department/category/shelf/product terms
- Click shelf → exact canonical route
- Click gated product → exact shelf + Product World
- Escape closes
- Enter activates the first result
- Mobile responsive
- Keyboard focus styles included

## Remaining Women gaps
Still materially thin or empty:
- Suits & Blazers
- Jeans & Denim
- Pants & Shorts
- Shoes depth beyond the first verified item
- Swimwear depth beyond the first verified item
- Underwear subtypes beyond current Bra/Bodysuit coverage

For Jeans / Pants, current title-only candidates are not clean enough for automatic remap. Keep fail-closed and use stronger supplier/category evidence or targeted sourcing.

## Profit rule
Nothing in this work changes the distinction:
- PROFIT_REVIEW = projected positive contribution
- FINAL PROFIT VERIFIED = destination-specific shipping + fees + final net profit proof

No product should be called launch-ready solely from PROFIT_REVIEW.
