---
name: hunt-accessibility-performance
description: This skill should be used for HUNT responsive behavior, mobile UX, accessibility, animation, Core Web Vitals, image loading, or performance-sensitive frontend changes.
---

# HUNT Accessibility + Performance

Accessibility:
- Preserve semantic headings and landmarks.
- All interactive controls must be keyboard reachable.
- Visible focus states.
- Correct button/link semantics and ARIA state where needed.
- Useful alt text for meaningful product images.
- Dynamic status changes announced where important.
- Avoid keyboard traps.
- Support 200% zoom.
- No page-wide horizontal scroll around 320px width.
- Respect prefers-reduced-motion.
- Verify contrast in dark and light modes.
- Preserve RTL/LTR compatibility.

Performance:
- Lazy-load below-the-fold images.
- Avoid loading the full catalog into the page.
- Use exact category shards/routes and bounded result sets.
- Keep recommendation failures non-blocking.
- Avoid layout shift by reserving media dimensions/aspect ratios.
- Minimize animation work on scroll.
- Do not add large dependencies for a minor visual effect.
- Prefer progressive disclosure and incremental loading.

Performance improvements must not weaken Product Truth or taxonomy checks.


## Simple First navigation QA
For normal HUNT storefront navigation verify:
- Main Categories remain immediately reachable.
- Active category Departments remain immediately reachable in the second compact row.
- Horizontal overflow is contained inside the navigation strips only.
- Category/Department activation never forces document scroll.
- selected state is communicated visually and semantically.
- no department thumbnail downloads are required for the navigation layer.
- filters are downstream of the shelf and only expose verified attributes.
