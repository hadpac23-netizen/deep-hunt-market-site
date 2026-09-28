---
name: hunt-router
description: Use before any task that changes, audits, tests, deploys, queries, or reasons about HUNT. It selects mandatory HUNT skills and enforces approved baselines, Simple First navigation, truth gates, no-mixing taxonomy, and production safety.
---

# HUNT Skill Router

Read `HUNT-MASTER-CONTROL-PROMPT.md` first.

Then load skills by task:

- UI, styling, navigation, animations, category layout:
  - hunt-control
  - hunt-simple-first-navigation
  - hunt-cinematic-ui
  - hunt-navigation-ux
  - hunt-taxonomy-guard
  - hunt-visual-qa
  - hunt-accessibility-performance

- Only when the Owner explicitly asks for immersive/full-screen/spatial navigation:
  - hunt-cinematic-scene-navigation

- Only when the Owner explicitly asks to hide/collapse/reveal tertiary or optional UI:
  - hunt-adaptive-disclosure
  - Do not use this skill to hide normal Main Categories or the active category's Departments by default.

- Product page, variants, sizes, attributes, recommendations:
  - hunt-control
  - hunt-product-page
  - hunt-product-truth
  - hunt-taxonomy-guard
  - hunt-visual-qa

- Catalog import, shelf fill, categorization, dedupe:
  - hunt-taxonomy-guard
  - hunt-product-truth
  - hunt-supabase-safety

- Supabase/Postgres/RLS/query/performance work:
  - hunt-supabase-safety
  - hunt-product-truth when catalog truth is affected

- Authentication, checkout, payment, APIs, secrets:
  - hunt-control
  - hunt-launch-gate
  - hunt-supabase-safety when database work is involved

- Deployment / launch / production:
  - hunt-control
  - hunt-launch-gate
  - hunt-visual-qa
  - hunt-accessibility-performance
  - hunt-product-truth

Never skip hunt-control when an approved UI or workflow can be changed.
Never skip hunt-simple-first-navigation for normal storefront navigation.
Never skip hunt-taxonomy-guard when product placement can change.
