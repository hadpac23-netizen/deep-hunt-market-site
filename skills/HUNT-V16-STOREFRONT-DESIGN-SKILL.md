---
name: hunt-v16-storefront-design
description: Reusable HUNT storefront build and QA playbook for homepage, PLP and PDP work.
---

# HUNT V16 Storefront Design Skill

Use this skill whenever changing HUNT shopper-facing UI.

## Workflow
1. Read docs/HUNT-V16-UX-SPEC.md.
2. Identify whether the change is Header, Home, PLP, PDP, Search, Cart, or responsive behavior.
3. Preserve live catalog/product truth and Production OFF constraints.
4. Do not inherit old cinematic CSS.
5. Implement only the smallest coherent shopper-facing change.
6. Run syntax and link-integrity checks.
7. For PDP changes, test both live-detail and cached-fallback paths.
8. For navigation changes, keep one primary row and one secondary row; use horizontal overflow rather than wrapping into multiple noisy rows.
9. For product cards, show only real image/title/verified price; cache the full product before navigation.
10. For launch/readiness text, keep internal truth internal unless it materially helps a shopper.

## Design rules
- Warm off-white, near-black, muted gold.
- Serif only for editorial/display headings.
- Sans-serif for utility UI.
- No decorative motion or visual effects.
- No supplier names on storefront.
- No oversized technical banners.
- Product image and buying decision always dominate the PDP.

## PDP gate
Do not mark PDP work complete unless:
- valid provider + id URL
- cache fallback renders
- image gallery renders or a calm image-unavailable state is shown
- variant controls do not claim unavailable data
- CTA state matches price/variant truth
- mobile structure remains usable

## Research references
Use current Baymard Product Page / PLP research, NN/g ecommerce product-page principles, and Shopify product-page guidance as supporting references. Prefer source-grounded UX decisions over aesthetic guesswork.
