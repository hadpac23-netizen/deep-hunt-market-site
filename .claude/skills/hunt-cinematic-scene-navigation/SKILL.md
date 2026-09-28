---
name: hunt-cinematic-scene-navigation
description: Use for HUNT category and department navigation when the goal is cinematic, editorial, spatial, or immersive navigation rather than conventional menus, pills, dropdowns, or drawers. It turns Main Categories into Chapters and Departments into Scenes while preserving exact HUNT routing and accessibility.
---

# HUNT Cinematic Scene Navigation

## Design thesis
Navigation is part of the HUNT story, not chrome around it.

Translate hierarchy into a cinematic grammar:
- Main Category = Chapter
- Department = Scene
- Exact Shelf = Product world
- Product = Object of focus

## Preferred interaction
Use one global **Explore HUNT** control.

Opening Explore HUNT reveals a cinematic scene navigator over the current page without reflowing or destroying the underlying Cinematic surface.

### Chapter view
- Show Main Categories as large editorial titles, not pills/cards.
- Keep generous negative space.
- Hover/focus may update a live preview using exact HUNT product imagery from that category.
- One active Chapter is visually clear.
- Do not show department details until a Chapter is chosen.

### Scene view
- After selecting a Chapter, transition in place to that category's Departments.
- Department names remain text-first and fast to scan.
- Preview imagery must come only from products canonically routed to that Department.
- Selecting a Department closes the navigator and updates HUNT to that exact route.
- Preserve current selection in a compact path: e.g. Women / Dresses.

## Global availability
The Explore HUNT control should be reachable from every HUNT surface.
A product/detail page may route into the same navigator state if the navigator is not yet shared as a global module.

## Motion direction
- Prefer one orchestrated transition between Chapter -> Scene -> HUNT.
- Avoid scattered card-hover animation.
- Use scale, blur, mask/reveal, depth and opacity with restraint.
- Motion must explain hierarchy, not decorate it.
- Respect prefers-reduced-motion.

## Accessibility
Prefer the native HTML dialog element for a truly modal cinematic navigator:
- showModal()
- browser-managed focus entry
- browser-managed focus return
- Escape closes
- outside content becomes inert
- visible close control
- semantic headings and buttons
- all Chapters and Scenes keyboard reachable

Do not emulate a modal with aria-modal unless behavior actually matches a modal.

## Cinematic preservation
When navigator is closed:
- Original HUNT Cinematic remains unchanged.
- Living Campaign remains unchanged.
- no permanent navigation slab remains.
- no forced scroll.
- selected products remain below the campaign floor.

## Truth / taxonomy
Preview imagery and Scene selection must use canonical exact HUNT routes.
No generic supplier category or legacy shard may drive Scene identity.
No cross-shelf filler.

## Visual language
- Sapphire / Gold / deep dark / off-white light.
- large editorial serif titles.
- restrained utility sans.
- asymmetry, depth and overlap may be used.
- avoid generic dashboard cards, pill clouds, and mega-menu grids as the dominant treatment.

## QA
Verify:
- Explore opens from keyboard and pointer.
- focus moves into dialog.
- Escape closes and returns focus.
- Chapter selection reveals only that Chapter's Scenes.
- Scene preview imagery is exact-route only.
- Scene selection closes dialog and updates URL/state.
- no page reflow or forced scroll.
- dark/light.
- mobile.
- prefers-reduced-motion.
- Original Cinematic unchanged after close.
