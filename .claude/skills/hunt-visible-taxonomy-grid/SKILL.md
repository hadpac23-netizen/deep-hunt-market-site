---
name: hunt-visible-taxonomy-grid
description: Mandatory HUNT navigation rule for showing categories and shelves without horizontal dragging or hidden overflow.
---

# HUNT Visible Taxonomy Grid

Use this skill whenever changing HUNT category, department, shelf, or catalog-navigation UI.

## Core invariant
A shopper must never have to drag horizontally to discover a category or shelf.

## Required layout
1. Main Categories: responsive wrapping text grid.
2. Active scope Departments/Shelves: second responsive wrapping text grid.
3. Living Campaign follows below.
4. Exact products follow the selected shelf.

## Responsive behavior
- Desktop: `repeat(auto-fit, minmax(...))` or equivalent responsive grid.
- Tablet: reflow to fewer columns.
- Mobile: normally 2 columns; 3 only when labels remain readable.
- Vertical document scrolling is allowed.
- Horizontal taxonomy scrolling is not.

## Prohibited patterns
- `overflow-x:auto` on category/shelf navigation
- scroll-snap taxonomy rails
- drag-to-discover
- swipe-only discovery
- previous/next taxonomy arrows
- hidden "More" for normal taxonomy
- fullscreen taxonomy takeover
- forced document scroll on selection

## Interaction
Every choice is a real button/link with visible focus and selected state.
Selection changes scope only.
Do not change the underlying exact-routing/no-mixing rules.

## Cinematic color hierarchy
- Main Categories: stronger HUNT sapphire/gold cinematic treatment.
- Departments/Shelves: related but slightly different secondary hue.
- Use restrained live gleam on hover/active only.
- Active category should read stronger than active department.
- Preserve WCAG contrast and text clarity in light and dark modes.
- Effects must not change layout dimensions or introduce motion that blocks navigation.

## Visual rule
Keep taxonomy text-first and compact.
Spend most cinematic depth on Living Campaign and product media; taxonomy may carry a restrained signature glow without becoming heavy navigation chrome.

## QA gate
Fail the change if any category/shelf becomes reachable only through horizontal movement at desktop, tablet, 320px mobile width, or browser zoom/reflow.
