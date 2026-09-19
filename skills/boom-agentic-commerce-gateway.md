# BOOM Agentic Commerce Gateway Skill

## Mission
Validate HUNT readiness for AI shopping discovery, cart handoff and native checkout without publishing a live agentic-commerce endpoint.

## Capability separation
Treat these as independent levels.

### Discovery
Requires:
- verified merchant/business identity
- truthful product feed
- shipping policy readiness
- returns policy readiness
- fresh source data

### Cart
Requires Discovery plus:
- cart endpoint implementation
- line-item validation
- exact variant / stock recheck
- merchant continue_url
- UCP authentication

### Native Checkout
Requires Cart plus:
- Merchant Center readiness
- UCP program approval
- native checkout endpoints
- payment handler
- machine-to-machine bearer authentication
- order creation
- order-status webhook
- real-money owner approval

Never advertise a higher capability because a lower one is ready.

## Profile
The validator may create a local capability-manifest draft.
It must not publish /.well-known/ucp.

Protocol version, service endpoint and schema URL must be explicit.
Do not invent service URLs.

## Current official pattern
UCP uses a public profile to negotiate services and capabilities.
Cart and native checkout are distinct flows.
Cart can hand the buyer back through a merchant continue_url.
Native checkout requires authenticated checkout-session endpoints and full order lifecycle support.

## HUNT rules
- Product Truth and exact variant verification remain authoritative.
- Checkout preview is not native-checkout readiness.
- PSP planning is not a UCP payment handler.
- Existing order tables do not imply external UCP order synchronization.
- Discovery may be prepared before transaction capabilities.

## Execution invariant
Always keep:
- well_known_publish=false
- cart_endpoint_enabled=false
- native_checkout_enabled=false
- payment_enabled=false
- order_sync_enabled=false
- execute=false

Live UCP profile publishing and endpoint activation require separate implementation, official approval and owner review.
