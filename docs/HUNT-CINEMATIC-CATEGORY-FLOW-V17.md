# HUNT Cinematic Category Flow V17 — Preview Contract

## Purpose
Demonstrate the new HUNT shopper interaction layer without changing Production:

Department → Category Drawer → Continuous Feed → Related Worlds → BOOM Personalization → Next Chapter.

## Key interaction rules
- 17 departments remain persistent and accessible.
- Selecting a department opens that department's category drawer in-place.
- Selecting a category opens the category feed below instead of navigating to a dead-end page.
- Related category worlds continue below the primary feed.
- BOOM personalization changes ranking/order only; canonical taxonomy remains unchanged.
- Product clicks and category choices create lightweight local preview taste signals.
- The preview may use real catalog-home.json imagery, but it does not publish or reclassify catalog data.
- No Payment, Supplier Live Order or Production taxonomy change.

## Accessibility
- Sticky department rail.
- Large touch targets.
- Keyboard-focusable product cards.
- Breadcrumb scope.
- Reduced-motion support.
- Category state always visible.
- Mobile layout keeps department rail horizontally scrollable.

## Owner Gate
This branch is a visual/interaction preview only.
