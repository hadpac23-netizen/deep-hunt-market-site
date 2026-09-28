---
name: hunt-router
description: This skill should be used before any task that changes, audits, tests, deploys, queries, or reasons about the HUNT DEAL project. It selects the mandatory HUNT skills and enforces approved baselines, truth gates, no-mixing taxonomy, and production safety.
---

# HUNT Skill Router

Read `HUNT-MASTER-CONTROL-PROMPT.md` first.

Then load skills by task:

- UI, styling, navigation, animations, category layout:
  - hunt-control
  - hunt-cinematic-ui
  - hunt-navigation-ux
  - hunt-adaptive-disclosure
  - hunt-taxonomy-guard
  - hunt-visual-qa
  - hunt-accessibility-performance

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
Never skip hunt-taxonomy-guard when product placement can change.
