# BOOM — HUNT Store UX Protocol

## Purpose

BOOM treats the HUNT storefront as a decision system, not an inventory dump.

The homepage has two equally legitimate entry paths:
1. **Shop normally** — browse a conventional store.
2. **Give HUNT a mission** — let BOOM compare and improve the shopping outcome.

Neither path may block or confuse the other.

## Homepage rule: showroom, not warehouse

The homepage demonstrates breadth and trust without rendering the full catalog.

BOOM should:
- show a limited, diverse sample of real products
- keep the full inventory available through Categories and Search
- prefer clear department handoffs over endless vertical shelves
- preserve real catalog counts without rendering every item
- keep promotional blocks secondary to shopping intent

## Mobile density budget

Mobile is the strictest layout.

Default homepage budgets:
- 4 products per market shelf at <=760px
- maximum 4 market departments at <=760px
- maximum 2 category shelves inside each department
- 8 personalized products
- 8 Keep Discovering products
- 4 products per promotion block
- 2 promotion blocks

These are presentation limits only. They never reduce the underlying catalog.

Any increase requires browser evidence that:
- page length remains manageable
- no horizontal overflow appears
- image count and render cost remain acceptable
- the primary shopping actions stay easy to find

## Truth hierarchy

Public retail truth has priority over visual fullness.

Never:
- display supplier base cost as a customer retail subtotal
- imply checkout is active when payment / fulfillment is not verified
- call an observation a verified deal
- manufacture discounts, reviews, scarcity, popularity, or inventory

When retail economics are incomplete:
**PRICING PENDING**

When variants are incomplete:
**Options pending**

When the full catalog detail service is unavailable:
show a safe catalog snapshot rather than leaving a permanent loading state.

## Direct-link resilience

A shared Product URL must remain useful even if live detail fetch fails.

HUNT therefore:
1. stores a small product snapshot before internal product navigation
2. falls back to the verified catalog snapshot for direct links
3. disables cart actions when variant-level data is missing
4. continues to show truth gaps instead of inventing options

A product page that only works after navigating from the homepage fails this protocol.

## Flow verification

Every meaningful storefront change must verify:

HOME → HUNT MISSION → CATEGORY → PRODUCT → CHECKOUT

At desktop and mobile widths, check:
- meaningful body content
- document horizontal overflow
- runtime exceptions
- broken image sources
- HUNT Mission persistence
- category browse/filter controls
- product direct-link rendering
- truthful cart readiness
- payment-disabled state while pre-launch

## BOOM quality loop

OBSERVE
→ MEASURE
→ IDENTIFY FRICTION
→ FORM HYPOTHESIS
→ MAKE ISOLATED CHANGE
→ DESKTOP TEST
→ 390PX TEST
→ DIRECT-LINK TEST
→ CHECKOUT TRUTH TEST
→ COMPARE BEFORE / AFTER
→ KEEP OR REVERT
→ LEARN

Visual confidence is not evidence. BOOM must use measured browser output when available.

## Current measured lesson

The previous HUNT Light homepage rendered too much inventory at once.
The redesign keeps inventory intact while reducing homepage render density and handing full browsing to Categories/Search.

This principle should remain in force as Brandsdistribution and future suppliers add much larger catalogs.
