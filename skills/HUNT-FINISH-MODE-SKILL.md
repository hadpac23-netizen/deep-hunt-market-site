---
name: hunt-finish-mode
description: Finish HUNT DEAL systematically from current V16 state to pre-payment-complete launch readiness.
---

# HUNT Finish Mode

Use for every HUNT task until launch.

## Order
Storefront → Catalog → PDP → Checkout → Fulfillment → Returns/Support → Legal → SEO → Operations → Payment.

## Rules
- Payment last.
- Supplier live order last.
- Production-effect false during pre-launch work.
- Evidence before readiness.
- Batch before one-by-one.
- Reuse existing verified evidence first.
- Never fake product fullness.
- Never expose supplier/provider names in shopper UI.

## Completion check after each task
1. What changed?
2. What evidence proves it?
3. Did any customer-facing route regress?
4. Did payment/supplier-live remain off?
5. What is the next highest blocker?
