---
name: hunt-cinematic-ui
description: Use for HUNT storefront visual design, Living Campaign, animation, layout, product grids, or aesthetic experiments. It preserves Original HUNT Cinematic while keeping normal navigation Simple First.
---

# HUNT Cinematic UI

Preserve:
- Original HUNT Cinematic composition.
- Sapphire / Gold.
- Light / Dark.
- premium depth and restrained motion.
- Living Campaign / Advertising & Promotions floor.
- primary product browsing vertically.
- exact route isolation.

## Simple First boundary
Normal primary navigation is intentionally simple:
- Main Categories visible in a compact first row.
- Active Main Category's Departments in a compact second row.
- Living Campaign immediately below.
- Exact products below the campaign.
- Filters downstream with the product list.

Do not make the navigation itself the cinematic spectacle.
Do not add fullscreen navigation, modal navigation, giant department cards, thumbnail grids or multi-step scene selectors by default.

If the Owner explicitly asks for an immersive navigation experiment, build it as a separate version and keep the Simple First baseline intact.

## Design rules
- Cinematic energy belongs in campaign storytelling, product media, transitions and depth.
- Micro-interactions confirm state; they do not obscure navigation.
- Keep promotion/editorial content visually separate from product inventory.
- Do not convert HUNT into a generic ecommerce template or dashboard.
- Mobile must reflow without page-wide horizontal scrolling.
- Respect prefers-reduced-motion.

Before coding identify approved baseline, exact visual delta, protected behavior and rollback path.
After coding use hunt-visual-qa.
