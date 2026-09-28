# HUNT SIMPLE FIRST COMMERCE NAVIGATION

Status: DEFAULT STOREFRONT NAVIGATION
Scope: HUNT only
Protected rollback: Living Campaign V4
Current experiment: Simple First V9

## Goal
Keep HUNT cinematic while making shopping navigation immediate, obvious and compact.

The information architecture is:
Main Category -> Department -> Living Campaign -> Exact Shelf Products -> Sort / Filters.

## What was learned from free public SHEIN / ecommerce evidence
We borrow **interaction logic, not branding or visual design**.

Observed patterns worth keeping:
- top-level shopping categories are immediately visible and scannable;
- choosing a category exposes the next level quickly rather than forcing users through a deep navigation ritual;
- mobile keeps category access near the top and makes browsing categories obvious;
- product-list sorting and filtering sit with the product list rather than competing with the primary category navigation;
- intermediary category screens work best when subcategory choices are easy to find before promotional clutter.

HUNT-specific adaptation:
- do not copy SHEIN styling, iconography, colors, wording or promotional layout;
- do not add an "All" route if it would merge exact HUNT shelves;
- keep the Original HUNT Cinematic / Living Campaign as the dominant visual surface;
- keep exact routing and no-mixing rules stronger than any reference pattern.

## Default UI contract
Desktop:
1. HUNT brand / utility line.
2. One compact Main Category row.
3. One compact Department row for the active Main Category.
4. Living Campaign.
5. Exact product shelf.
6. Compact Sort / Filter tools in the product-list area.

Mobile:
- same mental model and order;
- Main Categories remain one compact horizontally scrollable row;
- Departments remain a second compact horizontally scrollable row;
- no fullscreen category takeover;
- no drawer required for normal browsing;
- no forced scroll after category or department selection.

## Explicitly rejected by default
- fullscreen navigation;
- modal navigation;
- popup navigation;
- giant department cards;
- department thumbnails;
- department product counts;
- multi-step "Explore HUNT" flows;
- hidden primary categories;
- hidden departments behind "More";
- automatic page jumps;
- horizontal product rails as the primary shopping flow.

## Visual hierarchy
Main Categories > Departments > Sort/Filter controls.

Departments must never become visually heavier than Main Categories.
Navigation must never compete with the Living Campaign for visual dominance.

## Accessibility
- real buttons/links, not clickable divs;
- visible focus state;
- selected state exposed with semantic state such as aria-pressed / aria-current where appropriate;
- 320 CSS px reflow without page-wide horizontal overflow;
- horizontal scrolling is allowed only inside the compact navigation strips;
- no keyboard traps;
- prefers-reduced-motion respected;
- dark/light contrast maintained;
- RTL/LTR must not alter taxonomy.

## Truth and routing
- selecting Women shows Women Departments only;
- selecting Men shows Men Departments only;
- Home / Tech / Beauty / Sports / Travel / Jewelry stay isolated;
- selecting a Department does not merge sibling inventories;
- product link keeps provider:item_id identity and exact department/shelf route;
- no product appears as filler in another shelf.

## Filters
Filters are downstream of the exact shelf.
Only expose filters backed by verified product attributes.
Unknown attributes stay unavailable rather than guessed.
Sort may operate on safe local values such as existing order or title.

## Decision rule
If normal shopping navigation needs explanation, simplify it.

## Free research sources used
- SHEIN public mobile storefront: https://m.shein.com/us/
- SHEIN public category/filter pages: https://il.shein.com/
- Baymard 2026 Mobile App UX: https://baymard.com/research-articles/mobile-app-ux-trends
- Baymard Product Lists & Filtering research: https://baymard.com/research/ecommerce-product-lists
- ScreensDesign public SHEIN recorded-flow index: https://screensdesign.com/explore/flows/exploring-product-details/
- Mozaika public SHEIN category-browser reference: https://mozaika.design/inspiration/shein-mobile-shein-category-browser-dresses-bottoms
- YesPlz public SHEIN filtering analysis: https://yesplz.ai/resource/product-filter-and-search-evaluation1

Mobbin was attempted through the connected source but requires a paid Mobbin plan in this environment, so no Mobbin screen was used as evidence.

## Safety
Production OFF.
Payment Live OFF.
Supplier Live Order OFF.
V4 remains unchanged.
