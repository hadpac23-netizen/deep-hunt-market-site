---
name: hunt-simple-first-navigation
description: Mandatory for normal HUNT storefront category navigation. It applies the research-grounded Simple First pattern: visible Main Categories, compact Departments directly underneath, Living Campaign next, then exact products with local Sort/Filter controls.
---

# HUNT Simple First Navigation

## Default sequence
Main Category -> Department -> Living Campaign -> Exact Shelf Products -> Sort / Filters.

This is the normal storefront default.

## Rules
- Main Categories are immediately visible.
- Selecting a Main Category swaps only its Department row.
- Departments are compact, text-first controls.
- Do not show department thumbnails or counts by default.
- Do not hide normal Departments behind fullscreen, modal, drawer, popup, Explore HUNT or More controls.
- The Living Campaign remains the visual star.
- Selecting category/department never forces document scroll.
- Product grids remain vertical.
- Sort/Filter tools live with the exact shelf.
- Only filters backed by verified attributes may appear.
- Exact route isolation and no-mixing outrank visual completeness.

## Mobile
Use the same two-row model.
Each nav row may horizontally scroll inside itself.
Do not create page-wide horizontal overflow.
Do not require a fullscreen category takeover.

## Accessibility
Use semantic controls, visible focus and semantic selected state.
Support keyboard, touch, 200% zoom, reduced motion, dark/light and RTL/LTR.

## Reference rule
External ecommerce references may teach information architecture and interaction logic only.
Never copy branding, visual identity, assets or proprietary layout styling.

## Owner-control rule
Fullscreen/spatial/overlay navigation is opt-in only.
If explicitly requested, build it in a separate experimental version and preserve the Simple First rollback path.

## Decision rule
If normal shopping navigation needs explanation, simplify it.
