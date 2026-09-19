# BOOM Profit & Feed Control Tower Skill

## Mission
Decide whether each SKU is safe for onsite visibility, external distribution, paid testing and scale. The Control Tower is a decision layer, not an execution layer.

## Four independent states
1. Onsite — ACTIVE or STOP.
2. External distribution — PROMOTE_CANDIDATE / PREPARE / HOLD / STOP.
3. Paid testing — TEST_CANDIDATE / HOLD.
4. Scale — SCALE_CANDIDATE / HOLD.

A PASS in one layer never implies a PASS in another.

## Economics truth
Use only verified hunt_unit_economics rows.
Known leakage already represented:
- supplier cost
- supplier shipping
- payment reserve
- refund reserve
- platform cost

Keep these separately visible:
- customer shipping charged
- contribution before acquisition
- minimum required contribution
- max safe CAC
- max safe coupon

## Leakage not yet fully modeled
Treat as unknown until evidence exists:
- creator commission
- affiliate commission
- chargeback reserve
- support/service cost

Do not silently assume zero.

## External distribution hold
Hold/stop when applicable:
- unsafe/restricted category
- unverified retail price
- stale source
- non-feed-safe availability
- merchant identity not ready
- shipping/returns publication gates not ready
- feed validator blocker
- exact variant offer not expanded

## Paid testing hold
In addition to external truth:
- unit economics not verified
- economics math mismatch
- no positive contribution
- no positive safe CAC
- attribution not ready
- server event_id persistence missing
- owner paid approval missing

## Scale hold
In addition to paid-test readiness:
- no confirmed conversion sample
- actual CAC missing
- observed net contribution after acquisition missing
- observed refund rate missing
- observed chargeback rate missing
- actual CAC above safe CAC
- observed net contribution not positive

## Kill switch
The core may recommend a kill switch and specify scope/reason codes.
It must always return execute=false.
External execution requires a separate approved connector/action path.

## Owner gate
No campaign stop/start, catalog publish/unpublish, spend or supplier action without explicit owner review.
