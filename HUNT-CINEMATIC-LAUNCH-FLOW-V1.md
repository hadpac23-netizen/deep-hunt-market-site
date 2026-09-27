# HUNT Cinematic Launch Flow V1 · 2026-09-27

## Scope

This isolated preview extends the approved Original HUNT Cinematic exact-shelf direction without changing Production.

The canonical shopping path remains:

Department → Category → Exact shelf → Product.

The selected product now opens a dedicated **Product World**. Scrolling inside that world continues in a fixed, visible order:

1. Same exact shelf — the closest alternatives from the product's canonical route.
2. Same department — products from other exact shelves in the same department, still labeled with their own routes.
3. BOOM personalization — a preview ranking based on product interactions and style preferences in this browser only.
4. Other worlds — limited discovery from explicitly related departments, visually separated and never reclassified into the selected shelf.

## Taxonomy boundaries

- Exact-route products are never silently borrowed from another shelf.
- Same-department recommendations preserve their original canonical routes.
- Cross-department recommendations are a separate discovery layer.
- BOOM changes ranking only. It does not rewrite department, category, shelf, canonical route, stock truth, image truth or profit truth.
- Empty layers remain visibly empty rather than being filled with unrelated products.

## Personalization

The preview stores lightweight interaction signals locally in the browser:
- recently interacted product terms,
- provider affinity,
- department affinity,
- route affinity.

This is a preview mechanism only. It does not write user data to Supabase and is not the final account-backed personalization model.

## Accessibility

- Skip link to shopping categories.
- Department/category/shelf buttons expose selected state.
- Product World uses an aria-modal dialog.
- Escape closes the Product World.
- Tab focus is trapped inside the open dialog and returns to the original shelf control when closed.
- Focus-visible treatments remain explicit.
- Reduced-motion behavior remains supported.
- Mobile Product World becomes a full-screen flow with vertical product grids.

## Commerce safety

Payment Live remains OFF.
Supplier Live Order remains OFF.
Production taxonomy publication remains OFF.

The Product World does not expose a live purchase action. Variants, destination shipping and final net profit remain truth-gated and are not invented when the dataset does not provide them.

## Branch

`preview/hunt-cinematic-launch-flow-v1`

This branch is isolated from the existing current preview and Production.
