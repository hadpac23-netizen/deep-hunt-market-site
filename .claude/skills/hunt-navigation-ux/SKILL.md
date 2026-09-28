---
name: hunt-navigation-ux
description: Use for HUNT main-category navigation, department navigation, menu hierarchy, compact navigation, mobile reflow, or any change that affects how much screen space navigation consumes. Simple First is the default.
---

# HUNT Navigation UX

Read `hunt-simple-first-navigation` first for normal storefront navigation.

## Default hierarchy
Main Categories -> Departments -> Living Campaign -> Exact Products -> Sort / Filters.

- Main Categories are primary and stay immediately visible.
- The active Main Category's Departments appear directly underneath in one compact text-first row.
- Selecting a Main Category swaps only the Department row.
- Selecting a Department updates the exact route and product shelf without forcing page scroll.
- Sort / Filter controls live with the product list, not inside category navigation.

## Visual hierarchy
- Main Categories are visually stronger than Departments.
- Departments are secondary, compact, scannable, plain-language text.
- No thumbnails, image tiles, product counts, oversized pills or decorative cards by default.
- Navigation must not visually overpower the Living Campaign.

## Screen-space budget
Desktop:
- one compact Main Category row;
- one compact Department row;
- campaign begins immediately after.

Mobile:
- same two-row mental model;
- each row may scroll horizontally inside itself;
- no page-wide horizontal overflow;
- no fullscreen/drawer/modal required for normal category browsing.

## Accessibility
- semantic buttons/links;
- visible focus;
- selected state exposed semantically;
- touch targets remain practical without inflating the visual layer;
- reflow at 320 CSS px;
- keyboard reachable;
- RTL/LTR compatible;
- prefers-reduced-motion respected.

## Explicit opt-in only
Do not introduce fullscreen, overlay, modal, drawer, spatial or card-based primary navigation unless the Owner explicitly asks for that exact experiment.

## HUNT aesthetic
Use HUNT typography, Sapphire/Gold accents, subtle depth and restrained motion.
The cinematic identity belongs primarily in the Living Campaign and product world, not in a complicated menu.

After changes run hunt-visual-qa at desktop, tablet, mobile, dark and light modes.


## Product detail header behavior
Product detail pages use the same scroll-direction commerce header:
- scroll down -> hide header;
- scroll up -> reveal header immediately;
- keep keyboard focus reveal;
- no pointer-edge reveal gimmick;
- keep sticky buy controls clear of the header in both states.


## Compact product detail
For HUNT product pages:
- remove oversized editorial intros from the default shopping path;
- keep image/gallery compact enough that price, variants, and CTA appear quickly;
- desktop should use a balanced gallery + buy box, not a giant image stage;
- mobile should use a compact image stage, compact title/price/options, and existing one-hand CTA;
- keep truth/evidence UI secondary rather than above-the-fold dominant;
- description, details, reviews, and recommendations belong below the main purchase block.


## Product taxonomy header
Inside product detail:
- show HUNT plus Main Categories plus the active category's Departments/Shelves;
- hide/show the whole header as a single unit based on scroll direction;
- preserve exact route links back to Category/Shelf;
- Light and Dark must both keep the brand and taxonomy readable;
- Light mode must not contain isolated hard-coded dark panels.
