---
name: hunt-adaptive-disclosure
description: Use whenever HUNT needs to hide/show secondary UI intelligently: departments, filters, specifications, secondary controls, account tools, recommendation controls, or other optional layers. It minimizes visual clutter without losing access, context, keyboard support, or the Cinematic surface.
---

# HUNT Adaptive Disclosure

## Primary-navigation exception
Simple First is the default. Do **not** use adaptive disclosure to hide normal Main Categories or the active category's Department row.
Use this skill for tertiary/optional UI such as filters, specs, secondary account tools or explicitly requested experiments.

## Core principle
Hide visually, never lose functionally.

Secondary UI may collapse when it is not needed, but:
- there is always a clear control to reopen it;
- the current selection/state remains visible;
- all options remain reachable;
- no data or action becomes inaccessible;
- the Cinematic surface keeps visual priority.

## Preferred pattern
Use a semantic disclosure before inventing a custom menu widget:
- real `button`
- `aria-expanded="true|false"`
- `aria-controls="panel-id"`
- controlled region hidden when collapsed
- Enter / Space toggles
- Escape closes when open and restores focus to the controlling button
- click/tap outside may close when that does not cause data loss

Do not use `role="menu"` for ordinary site navigation unless full menu semantics and keyboard behavior are intentionally implemented.

## HUNT navigation
- Main Categories stay visible.
- Activating a Main Category opens its Departments in a compact disclosure layer.
- Department selection closes the layer automatically.
- The chosen state remains visible as a compact breadcrumb/selection control, e.g. `Women / Dresses · Change`.
- Clicking the same category/selection control reopens the Departments.
- Switching Main Category swaps the disclosure content without page jump.
- Never force-scroll when opening/closing.
- Advertising / Living Campaign stays in place.
- Products remain below the campaign floor.

## General HUNT use
This pattern may also be used for:
- Filters
- Size guide / measurements
- Product specifications
- Shipping detail
- Secondary account/profile tools
- Optional recommendation controls
- Dense admin/debug information

Do NOT collapse:
- critical price
- stock/availability state
- selected variant
- primary purchase CTA
- important errors/warnings
- safety/compliance disclosures
- core category identity

## Responsive behavior
Desktop:
- disclosure may appear as a compact anchored panel under the navigation.
- keep it within viewport and avoid covering critical controls.

Mobile:
- use a compact full-width disclosure sheet/panel when needed.
- all items remain reachable by touch and keyboard.
- no page-wide horizontal overflow.

## State
- Selected Category and Department persist in URL/session state when already part of HUNT routing.
- Collapsed/expanded visual state does not change taxonomy.
- Closing a disclosure never clears a user's selection.

## Visual rules
- Secondary panel must feel lighter than the Cinematic hero.
- No large image tiles by default.
- Text-first, fast-scanning options.
- Current selection may use Sapphire/Gold accent.
- Animation should be short and restrained.
- Respect prefers-reduced-motion.

## QA
Verify:
- open / close
- select / auto-close
- reopen to same category
- switch category
- Escape behavior
- focus return
- click outside
- mobile
- dark/light
- no forced scroll
- no taxonomy change
- no hidden unreachable option
- Cinematic layout unchanged
