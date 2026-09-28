---
name: hunt-visual-qa
description: This skill should be used after HUNT frontend changes or before approving a preview. It performs browser-based visual regression and interaction checks across desktop/mobile, dark/light, routes, and approved baselines.
---

# HUNT Visual QA

Inspired by browser-test and visual-regression workflows, but scoped to HUNT.

For every changed storefront surface:
1. Capture/inspect the approved baseline.
2. Capture/inspect the experiment.
3. Test desktop, tablet, and mobile widths.
4. Test dark and light modes.
5. Run real journeys, not screenshots only.

Mandatory journeys:
- Main Category -> departments underneath.
- Department selection -> exact products below campaign floor.
- No forced jump to top.
- Product open -> breadcrumb preserves route.
- Variant/color/size interactions.
- Product -> Similar / Complementary / Discover.
- Back navigation to same category/department.
- Load More / long vertical scroll.
- Cart/checkout preview when in scope.

Visual regressions to reject:
- page-wide horizontal overflow
- overlapping text/buttons
- hidden critical controls
- broken sticky elements
- layout jump that loses context
- promotion floor replacing navigation
- wrong products visible in a shelf
- dark/light contrast failures

Record PASS/FAIL with evidence. Do not declare visual PASS from static code inspection alone when a browser is available.
