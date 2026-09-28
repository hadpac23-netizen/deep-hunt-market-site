---
name: hunt-navigation-ux
description: Use for HUNT main-category navigation, department navigation, menu hierarchy, compact navigation, mobile reflow, or any change that affects how much screen space navigation consumes. It keeps main categories visually primary and departments secondary without hiding options or shrinking accessibility.
---

# HUNT Navigation UX

## Visual hierarchy
- Main Categories are primary navigation and must be visually stronger than Departments.
- Departments are secondary navigation: compact, scannable, plain-language text.
- Never make department cards visually heavier or taller than main-category controls.
- Do not use decorative thumbnails in department navigation unless they materially improve identification and the Owner asks for them.
- Counts are not required in navigation and should be omitted if they create visual noise.

## Screen-space budget
- Preserve the Cinematic campaign as the dominant visual surface.
- On desktop, aim for one compact main-category row and one compact department row/wrap.
- Departments may wrap to additional lines when necessary, but do not hide items behind "More" by default.
- Avoid tall cards, large thumbnails, or repeated metadata in the navigation layer.

## Accessibility
- Maintain readable text and minimum practical target size without making controls visually heavy.
- Keyboard reachable, visible focus state, semantic buttons/links.
- Reflow at 320 CSS px without page-wide two-dimensional scrolling.
- On narrow mobile, a horizontal navigation strip is acceptable for navigation when it is clearly scrollable and all items remain reachable.
- Preserve RTL/LTR compatibility.

## Interaction
- Selecting a Main Category updates Departments directly underneath.
- Selecting a Department does not jump the page.
- Campaign/Advertising floor remains visible and unchanged.
- Products remain below the campaign floor and browse vertically.
- No accordion, side drawer, or legacy page unless explicitly requested.

## HUNT aesthetic
Use typography, spacing, border, glow and active-state treatment to express hierarchy.
Do not add generic dashboard cards or oversized pills.

After changes, run hunt-visual-qa and verify navigation hierarchy at desktop, tablet, mobile, dark and light modes.
