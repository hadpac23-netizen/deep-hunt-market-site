# BOOM M09 — Agentic Commerce Gateway — 2026-09-19

## Objective
Prepare HUNT for agentic commerce without prematurely exposing transaction capabilities.

## Official architecture checked
Current Google UCP guidance separates:
- public UCP profile / capability negotiation
- Cart API
- Native Checkout API
- payment handler
- order status synchronization

The Cart flow can return a merchant continue_url.
Native Checkout uses authenticated checkout-session endpoints and requires the merchant transaction lifecycle to be complete.

## HUNT implementation
M09 is a local capability validator only.

### Discovery validation
Checks:
- merchant identity
- feed truth
- shipping policy
- returns policy
- source freshness

### Cart validation
Adds:
- cart endpoint
- line item validation
- exact variant recheck
- continue_url
- UCP authentication

### Checkout validation
Adds:
- Merchant Center readiness
- UCP approval
- native checkout endpoints
- payment handler
- M2M bearer auth
- real order creation
- order status webhook
- owner real-money approval

## Current HUNT state
Growth OS intentionally keeps:
- service endpoint: not configured
- schema URL: not configured
- public UCP profile: OFF
- cart endpoint: OFF
- native checkout endpoints: OFF
- payment handler: OFF
- M2M auth: OFF
- order sync: OFF
- real-money owner approval: OFF

Exact HUNT variant recheck is available from X04, but one capability is not enough to advertise Cart or Checkout.

## M08 integration
Growth Agent now consumes M09 gateway state.
Agent-readable product data alone can no longer make the Agentic lane TEST_CANDIDATE.

## No live exposure
M09 does not create:
- /.well-known/ucp
- /carts
- /checkout-sessions
- payment handler
- order webhook endpoint

## Invariants
UCP_PROFILE_PUBLISHED: false
CART_ENDPOINT_ENABLED: false
NATIVE_CHECKOUT_ENABLED: false
PAYMENT_ENABLED: false
ORDER_SYNC_ENABLED: false
REQUESTS_SERVED: 0
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED
