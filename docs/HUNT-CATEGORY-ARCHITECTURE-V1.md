# HUNT Category & Department Architecture V1

**Status:** DESIGN ONLY — OWNER GATE REQUIRED BEFORE IMPLEMENTATION  
**Date:** 2026-09-27

## Research conclusion

HUNT should copy the information-architecture logic used by leading commerce sites, not their visual clutter:

- expose broad departments clearly;
- use intermediary category pages with subcategories before promotions;
- keep a clear "View All" at every level;
- avoid very deep or overlapping taxonomies;
- use one canonical product route, then merchandising filters for alternate discovery surfaces.

This is especially important for HUNT because it spans fashion, home, tech, pets, toys, garden, office and travel rather than a single vertical.

## Core architecture

The storefront has exactly 17 shopper-facing departments:

Women · Men · Kids · Accessories · Beauty · Home · Kitchen · Tech · Electrical · Sports · Camping · Pets · Toys · Garden · Office · Travel · Gifts

### Layer A — Department rail

The department rail is persistent on Home, Department, Category, Search, Product-list and Product pages.

Desktop:
- one non-wrapping rail;
- horizontal overflow/arrows if needed;
- active department pinned/highlighted;
- "All Departments" opens the full grouped view.

Mobile:
- sticky horizontal chips;
- "All" first;
- active department visibly selected;
- do not bury all categories under a generic Shop link.

### Layer B — Family buttons

After a department is selected, display 5–10 broad family buttons.

Never show 20 peer buttons at equal visual weight.

### Layer C — Leaf categories

Leaf categories are product-type truth. They are not promotional concepts.

Dedicated shopper-facing leaf button:
- >=24 clean products: healthy, expose directly.
- 12–23 clean products: expose if useful, mark as thin internally.
- 1–11 clean products: keep under parent family / More until filled.
- 0 products: do not expose.

Every family and leaf level must include an All/View All route.

## Canonical taxonomy is different from navigation

This is the most important rule.

A shopper may reach the same canonical product from several surfaces, but the product keeps one taxonomy route.

Examples:
- A women's handbag is **Accessories > Bags**, with audience=women. Women can still show an Accessories button.
- Nursery furniture is **Home**, with audience=kids,baby. Kids can still show Nursery.
- Kids drinkware is **Kitchen**, with audience=kids,baby. Kids can still show Kids Dining.
- A giftable necklace remains **Accessories > Jewelry**. giftable=true is a merchandising attribute.
- Unisex apparel has one canonical route plus audience tags; do not duplicate the SKU.

## Merchandising dimensions — never canonical taxonomy

New · Trending · Best Sellers · Deals · For You · Seasonal · Occasion · Creator Picks · Giftable · Audience

BOOM Stylist may rank and surface products across these dimensions, but it may never rewrite canonical taxonomy.

## Department button sets

### Women
All Women · Clothing · Dresses · Tops · Bottoms · Outerwear · Shoes · Underwear & Sleep · Swim · Occasion & Maternity

Cross-surface: Accessories, Activewear.

### Men
All Men · Clothing · Tops · Bottoms · Outerwear · Shoes · Underwear & Sleep · Swim · Tailoring · Active

Cross-surface: Accessories, Activewear.

### Kids
All Kids · Baby · Girls · Boys · Clothing · Shoes · School · Sleep & Underwear · Occasion & Swim · Nursery & Kids Home

Cross-surface: Nursery/Kids Home → Home; Kids Dining → Kitchen; Toys → Toys.

### Accessories
All Accessories · Bags · Jewelry · Watches · Sunglasses · Hats · Belts & Scarves · Hair Accessories · Socks · Small Accessories

### Beauty
All Beauty · Makeup · Skincare · Hair · Nails · Body Care · Fragrance · Beauty Tools

### Home
All Home · Furniture & Living · Bedroom & Bedding · Bath · Decor & Mirrors · Storage & Organization · Rugs & Windows · Lighting · Laundry & Cleaning

Cross-surface: Kitchen, Garden, Kids Home.

### Kitchen
All Kitchen · Cookware · Tools & Utensils · Tableware · Drinkware · Storage · Bakeware

Cross-surface: Small Appliances → Electrical.

### Tech
All Tech · Phones & Accessories · Charging · Audio · Wearables · Gaming · Cameras · Computing · Stands & Holders · Smart Home

### Electrical
All Electrical · Small Appliances · Heating & Cooling · Cleaning Appliances · Personal Appliances · Power & Electrical

### Sports
All Sports · Activewear · Fitness · Yoga · Running · Team Sports · Sports Gear

### Camping
All Camping · Tents & Shelter · Sleep · Lighting · Camp Cooking · Camp Furniture · Outdoor Gear

### Pets
All Pets · Beds & Houses · Clothing · Feeding · Grooming · Toys · Walking · Aquarium · Accessories

### Toys
All Toys · Educational · Building · Pretend Play · Dolls & Figures · Vehicles & RC · Puzzles & Games · Arts & Crafts · Plush · Outdoor Play

### Garden
All Garden · Planters · Watering · Garden Tools · Outdoor Living · Garden Decor · Plant Care

### Office
All Office · Stationery · Writing · Filing & Organization · Desk Accessories · Office Furniture · Notebooks & Planners

### Travel
All Travel · Luggage · Travel Bags · Organizers · Travel Accessories · Toiletry · Documents

### Gifts
All Gifts · Gift Decor · Party · Gift Wrap · Cards & Stationery · Gift Bags & Boxes

"Gifts by recipient", "Gifts by price", "Birthday", "Holiday" etc. are curated filters/pages, not canonical categories.

## Current coverage priority

Strongest/currently most structured:
Accessories, Women, Men, Pets, Tech.

Needs targeted fill:
Kids, Beauty, Home.

Highest structural gaps:
Kitchen, Electrical, Toys, Garden, Office, Travel, Gifts, Camping, parts of Sports.

Do not create empty public buttons to make the architecture look complete. Fill and verify first.

## Known legacy cleanup

Before UI implementation, migration mapping must explicitly handle:
- Home > kitchen / garden / tech legacy shelves;
- Home > women-maternity;
- Kids > bath / curtains / cushions / dinnerware / garden / tech / towels;
- any remaining Men/Women cross-prefix mismatch;
- lifestyle;
- baby as a top-level department;
- empty department;
- blocked-review.

These must become either:
1. canonical remap,
2. cross-surface merchandising route,
3. TAXONOMY_REVIEW,
4. BLOCK.

## URL contract

- /shop/{department}
- /shop/{department}/{family}
- /shop/{department}/{leaf}

Curated audience/occasion surfaces must not generate conflicting canonical product taxonomy.

## UI acceptance criteria

1. Every department can be reached from every shopping surface within one interaction.
2. Current department is obvious.
3. No department rail wrapping into random rows.
4. Maximum 10 equal-weight family buttons.
5. Every hierarchy level has View All.
6. No empty public categories.
7. No supplier taxonomy labels visible to shoppers.
8. Search and breadcrumbs preserve scope.
9. Mobile supports touch, keyboard-equivalent focus behavior where relevant, and active scope.
10. BOOM Stylist may rank/surface, never reclassify.

## Owner Gate

This document authorizes no code, migration, Production change, payment change or supplier order.
