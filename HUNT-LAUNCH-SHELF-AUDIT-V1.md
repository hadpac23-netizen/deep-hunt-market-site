# HUNT Launch Shelf Audit V1 — 2026-09-27

Aggregate-only snapshot. No live product rows or customer data are exported.

## Gate definitions

- **Pipeline ready:** Taxonomy V2 REMAP + Profit REVIEW + positive target retail/contribution + verified inventory + availability + no production exposure.
- **Display gate ready:** Pipeline ready + technical image PASS + Market5 PASS + approved Market5 candidate state.
- **FULL / GOOD / THIN / EMPTY:** 24+ / 12–23 / 1–11 / 0 display-gate products.
- Final destination profit is still separate; `final_profit_verified` remains a launch blocker.

## Portfolio summary

- Configured exact routes: **141**
- Taxonomy pool across configured routes: **9382**
- Profit + stock pipeline ready: **8025**
- Display gate ready: **267**
- CJ pipeline ready: **1177**
- EPROLO pipeline ready: **6848**
- Final profit verified: **0**
- Display status: FULL 2 · GOOD 6 · THIN 34 · EMPTY 99
- Pipeline status: FULL 46 · GOOD 23 · THIN 29 · EMPTY 43

## Departments

| Department | Routes | Pipeline ready | Display ready | CJ | EPROLO | Display FULL/GOOD/THIN/EMPTY |
|---|---:|---:|---:|---:|---:|---:|
| Women | 15 | 1101 | 17 | 148 | 953 | 0/0/4/11 |
| Men | 14 | 502 | 32 | 78 | 424 | 0/1/3/10 |
| Kids & Baby | 8 | 1030 | 64 | 23 | 1007 | 1/1/2/4 |
| Beauty | 7 | 398 | 8 | 145 | 253 | 0/0/3/4 |
| Accessories & Jewelry | 16 | 2761 | 76 | 422 | 2339 | 1/2/5/8 |
| Phone & Tech | 12 | 489 | 4 | 73 | 416 | 0/0/2/10 |
| Home & Living | 19 | 104 | 6 | 50 | 54 | 0/0/4/15 |
| Kitchen | 7 | 44 | 12 | 9 | 35 | 0/1/0/6 |
| Electrical & Appliances | 3 | 4 | 0 | 1 | 3 | 0/0/0/3 |
| Camping & Outdoor | 5 | 97 | 2 | 9 | 88 | 0/0/1/4 |
| Garden & Outdoor | 6 | 37 | 1 | 29 | 8 | 0/0/1/5 |
| Sports & Outdoors | 8 | 207 | 2 | 17 | 190 | 0/0/1/7 |
| Pets | 9 | 1121 | 23 | 134 | 987 | 0/0/6/3 |
| Toys | 4 | 23 | 2 | 3 | 20 | 0/0/1/3 |
| Travel | 1 | 27 | 16 | 7 | 20 | 0/1/0/0 |
| Office & Crafts | 5 | 62 | 0 | 23 | 39 | 0/0/0/5 |
| Gifts & Party | 2 | 18 | 2 | 6 | 12 | 0/0/1/1 |

## P0 — display empty although pipeline already has 24+

| Route | Pipeline | CJ | EPROLO | Display |
|---|---:|---:|---:|---:|
| women/women-shoes | 550 | 61 | 489 | 0 |
| women/women-outerwear | 256 | 42 | 214 | 0 |
| men/men-outerwear | 223 | 29 | 194 | 0 |
| accessories/jewelry-bracelets | 196 | 68 | 128 | 0 |
| pets/pet-toys | 163 | 19 | 144 | 0 |
| tech/chargers-cables | 156 | 28 | 128 | 0 |
| women/women-knitwear | 137 | 33 | 104 | 0 |
| beauty/skincare | 114 | 56 | 58 | 0 |
| camping/outdoors | 87 | 9 | 78 | 0 |
| accessories/hair-accessories | 74 | 13 | 61 | 0 |
| men/men-shirts | 72 | 16 | 56 | 0 |
| women/women-tops | 55 | 0 | 55 | 0 |
| accessories/scarves | 47 | 4 | 43 | 0 |
| tech/wearable-accessories | 46 | 6 | 40 | 0 |
| sports/activewear | 46 | 3 | 43 | 0 |
| tech/audio | 38 | 7 | 31 | 0 |
| office/office-furniture | 36 | 19 | 17 | 0 |
| tech/stands-holders | 35 | 1 | 34 | 0 |
| beauty/nails | 29 | 25 | 4 | 0 |
| tech/wearables | 28 | 2 | 26 | 0 |
| women/women-hoodies | 27 | 6 | 21 | 0 |
| accessories/keychains | 26 | 2 | 24 | 0 |
| office/stationery | 26 | 4 | 22 | 0 |
| men/men-hoodies | 25 | 3 | 22 | 0 |

## True pipeline-empty routes

- women/women-dresses — Dresses
- women/women-suits — Suits & Blazers
- women/women-jeans — Jeans & Denim
- women/women-bottoms — Pants & Shorts
- women/women-swim — Swimwear
- men/men-suits — Suits & Blazers
- men/men-boxers — Boxers
- men/men-bags — Bags
- men/men-accessories — Men Accessories
- kids/kids-accessories — Kids Accessories
- accessories/gloves — Gloves
- tech/smart-home — Smart Home
- tech/computer-accessories — Computer Accessories
- tech/electronics — Useful Electronics
- home/home-storage — Storage & Organization
- home/lighting — Lighting
- home/bedding — Bedding & Pillows
- home/home-decor — Home Decor
- home/cleaning — Cleaning
- home/furniture — Furniture
- home/wall-decor — Wall Decor
- home/home-textiles — Home Textiles
- home/towels — Towels
- kitchen/cookware — Cookware
- kitchen/food-storage — Food Storage
- kitchen/tableware — Tableware
- kitchen/bakeware — Bakeware
- kitchen/drinkware — Drinkware
- kitchen/kitchen-appliances — Kitchen Appliances
- electrical/electrical-lighting — Electrical Lighting
- electrical/electrical-accessories — Electrical Accessories
- camping/camping-shelter — Tents & Shelter
- garden/garden-decor — Garden Decor
- garden/garden-lighting — Garden Lighting
- sports/fitness — Fitness
- sports/outdoors — Outdoor & Camping
- sports/sports-bags — Sports Bags
- sports/cycling — Cycling
- toys/toys — Toys
- toys/plush-toys — Plush Toys
- office/crafts — Arts & Crafts
- office/stickers — Stickers
- office/office-storage — Office Storage

## Release rule

Do not fill an exact shelf by borrowing products from another canonical route. Promote existing pipeline candidates through Image/Market5/Visual QA first; source new CJ/EPROLO candidates only where the pipeline itself is THIN/EMPTY. Supplier identity remains internal. Payment Live, Supplier Live Order and Production taxonomy publish remain OFF.
