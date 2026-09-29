---
name: hunt-launch-governance
description: Maintain HUNT launch control, legal/trust, returns/support, SEO, monitoring and final payment-owner gate.
---

# HUNT Launch Governance

## Launch Control states
DONE / DO_NOW / BLOCKED_EXTERNAL / PAYMENT_LAST / OWNER_GATE.

## Required pre-payment domains
- Storefront
- Catalog
- Product truth
- Checkout quote
- Fulfillment sandbox
- Tracking
- Returns/refunds architecture
- Support
- Legal
- SEO
- Analytics/privacy
- Monitoring
- Finance ledger

## Payment activation
Never infer approval.
Only move to payment live after explicit Owner approval and a successful sandbox E2E.

## Supplier live order
Never infer approval.
Requires explicit Owner approval and controlled real-order proof.

## SEO
Public URLs must be HUNT-facing.
Supplier identities must not appear in sitemap, canonical URLs, shopper structured data, or navigation.
