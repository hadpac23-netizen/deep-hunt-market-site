# BOOM M05 — Offer Chess — 2026-09-19

## Objective
Move HUNT from "we have coupon headroom" to "is there a meaningful, safe offer worth testing?"

## Architecture
M05 sits above the existing Profit Engine and checkout bundle preview.
It does not replace either.

Profit Engine:
verifies real economics and safe coupon/CAC headroom.

Offer Chess:
selects the type of offer worth testing.

Checkout / bundle preview:
revalidates live price, stock, shipping and combined economics before any offer can be used.

## Offer states
- HOLD
- NO_OFFER
- SAFE_COUPON_CANDIDATE
- SHIPPING_SUPPORT_CANDIDATE
- BUNDLE_CANDIDATE

## Meaningful-offer guard
The default draft threshold is both:
- at least $0.50 safe coupon value
- at least 5% verified price

This prevents HUNT from advertising a 4-cent or 9-cent discount merely to create the appearance of a promotion.

## Current verified economics baseline
Using the three currently verified positive economics examples:
- safe coupon $0.09 / 0.86% → NO OFFER
- safe coupon $0.04 / 0.54% → NO OFFER
- safe coupon $0.51 / 8.46% → SAFE COUPON CANDIDATE

No coupon is activated by this result.

## Shipping support
A shipping offer is a candidate only if verified contribution headroom can absorb the verified customer shipping amount.

## Bundle
A bundle candidate requires fresh bundle-level verification. Single-SKU headroom is not treated as proof of bundle safety.

## Integration
Growth OS now shows:
- SKUs evaluated
- no-offer decisions
- coupon candidates
- safe coupon range
- shipping/bundle candidates
- blockers
- application state

## Safety / execution
APPLICATION_ENABLED: false
CHECKOUT_REVALIDATION_REQUIRED: true
EXTERNAL_PUBLISHING_CHANGED: false
PAID_SPEND_CHANGED: false
PRODUCTION_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
