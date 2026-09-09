# HUNT Fashion Curation

## Goal

Fill HUNT with deep fashion inventory without filling the storefront with mislabeled products or pretending snapshot availability is live.

## Truth model

- Catalog snapshots are real supplier catalog records, but availability can be stale.
- Curated snapshot products are labeled CATALOG DISCOVERY.
- VERIFIED AVAILABLE is reserved for products whose provider availability has been checked.
- Opening a CJdropshipping product triggers the live provider detail path. If live variants are returned, the product can proceed to cart preview.
- Supplier/source price is not the final customer retail price.

## Curated fashion inventory

Current curated snapshot counts:
- Women: 328
- Men: 57
- Dresses: 116
- Tops: 166
- Bottoms: 159
- Hoodies: 32
- Jackets: 122
- Knitwear: 94
- Activewear: 18
- Suits: 4
- Underwear & essentials: 13
- Socks: 15
- Shoes: 78
- Bags: 29
- Jewelry: 179
- Accessories: 34
- Hats: 12

The curation build rejects obvious non-fashion false positives, unsafe catalog terms, sexualized product wording, child-only products in adult fashion shelves, and body-shaping / weight-loss marketing.

## Home merchandising

Desktop fashion depth:
- Women · Clothing: up to 3 category rails
- Women · Shoes & Accessories: up to 3 category rails
- Men: up to 2 category rails
- one additional department after the three pinned fashion groups

Mobile keeps fewer rails to preserve performance.

Pinned order:
1. Women · Clothing
2. Women · Shoes & Accessories
3. Men

BOOM may personalize the departments that follow.

## QA

- Curated bad-match scan: 0
- Desktop Home: 9 shelves / 72 visible cards / 0 broken images / 0 horizontal overflow
- Mobile Home: 5 shelves / 20 visible cards / 0 broken images / 0 horizontal overflow
- Women Shoes category: 36 visible cards in QA, 0 flagged false positives
- Men category: 48 visible cards in QA
- CJ discovery product live-detail recheck: PASS
