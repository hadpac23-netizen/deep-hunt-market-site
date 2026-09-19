# HUNT End-to-End Journey Audit Skill

## Mission
Test HUNT as connected journeys. Page-level PASS is insufficient if the handoff between pages loses identity, truth, state or user intent.

## Core journeys

### Journey 1 — Browse to product
Home → department → product → Back.
Prove category identity, scroll continuity and product reacquisition.

### Journey 2 — Search mission
Natural-language search → interpreted intent → results → product.
Prove no raw query leakage to AI telemetry, relevant categories, Product Truth and compare continuity.

### Journey 3 — Product to cart
Product → variant → quantity → cart.
Prove provider/item/variant/quantity and verified retail state remain exact.

### Journey 4 — Checkout preview
Cart → country → shipping verification → totals.
Prove destination shipping is rechecked and no unverified amount becomes final.

### Journey 5 — Payment sandbox
Checkout → payment session → signed callback → idempotent paid state.
Never enable live payment during QA.

### Journey 6 — Supplier sandbox
Paid/test order → supplier sandbox → supplier reference → tracking.
Never substitute mock success for provider evidence.

### Journey 7 — Account continuity
Anonymous Like/Save → sign in → merge → profile/history.
Prove no duplicate/lost preference state.

### Journey 8 — Review
Product → sign in → rating/text/photo → moderation → published visibility.
Prove ownership and moderation state.

### Journey 9 — Failure recovery
Provider timeout / missing variant / stale price / offline / expired session.
Prove fail-closed behavior and useful recovery.

### Journey 10 — Return / post-purchase
Order → tracking → return/cancel request → support workflow.
If workflow is not live, mark BLOCKED/MISSING rather than displaying fake submit success.

## Evidence
For each journey record:
- start state
- interactions
- network/backend evidence
- resulting state
- preserved identifiers
- failure behavior
- screenshots if useful
- regression command
