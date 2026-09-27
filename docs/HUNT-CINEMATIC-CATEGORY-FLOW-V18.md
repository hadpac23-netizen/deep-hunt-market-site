# HUNT Cinematic V18 — Exact Category Flow

V18 returns to the original HUNT cinematic foundation:

- Original light/dark theme behavior via hunt-theme.js.
- Original HUNT brand motion via hunt-brand-motion.js / css.
- Original Hero4 / Urban Luxe visual system.
- Sapphire / deep-night / metallic-gold direction.

## Exact navigation contract

Department click:
- Opens only that department.
- Renders only categories defined inside that department.

Category click:
- Resolves only the shelf keys explicitly mapped to that department/category.
- Product lookup uses `department/shelf` exact keys.
- No fallback to another department.
- If a category has no clean rows, the UI shows an empty/filling state.

## Clean data contract

Source: hunt-cinematic-clean-catalog-v18.json

Rows must satisfy:
- sellable=false
- production_effect=false
- Taxonomy Gate V2 REMAP
- Safety PASS
- positive inventory
- image present
- Profit Gate V2 PROFIT_REVIEW

V18 adds a rendering sanity filter for historically risky shelf patterns such as footwear storage, jewelry storage/phone holders, pet-themed human apparel, phone cases and wearables.

## BOOM personalization

BOOM preview learning may rank only within the currently active exact scope. It never changes product taxonomy or inserts another department into the feed.

## Production safety

Preview branch only.
Payment Live OFF.
Supplier Live Order OFF.
No Production taxonomy publish.
