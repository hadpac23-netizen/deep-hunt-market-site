# BOOM M08 — Growth Agent — 2026-09-19

## Objective
Create one orchestrator above HUNT's specialized commerce brains so the system returns a coherent next move instead of independent recommendations that can conflict.

## Problem solved
Before M08:
- Marketing Brain could recommend a channel.
- Control Tower could mark a SKU as a candidate.
- Creative Factory could create a safe draft.
- Offer Chess could find a safe offer.
- Learning Loop could evaluate an experiment.

But no single component enforced that every required gate agreed before moving to a higher-risk action.

## M08 architecture
M08 reads M01–M07 and outputs:
- one Primary Move
- six lane decisions
- diagnostics
- no execution

### Lanes
- Owned / onsite
- External discovery
- Paid media
- Lifecycle
- Creator
- Agentic discovery

## Decision priority
The agent prefers:
1. fix launch gate
2. verify economics
3. enrich Product Truth/feed truth
4. run owned/organic learning
5. test truthful external discovery
6. test paid only when all paid gates pass
7. otherwise collect more evidence

This intentionally prevents paid acquisition from becoming the default answer to low traffic.

## Current hard measurement gates
At M08 implementation:
- paid attribution ready: false
- server event-id persistence: false
- owner paid approval: false
- incrementality ready: false
- post-acquisition profit readiness: false

Therefore the current agent cannot authorize scale.

## Scale architecture
M08 exposes can_scale only when:
- Control Tower has a scale candidate
- paid testing gates pass
- incrementality is ready
- post-acquisition profit evidence is ready

The incrementality layer is intentionally deferred to M10.

## Safety / owner control
M08 is recommendation-only.
It does not:
- publish feeds or social posts
- start/stop campaigns
- change budgets
- send lifecycle messages
- publish creator content
- make creator payouts
- enable payment or supplier ordering

## Invariants
RECOMMENDATIONS_ONLY: true
EXTERNAL_PUBLISH: false
PAID_SPEND: false
LIFECYCLE_SEND: false
CREATOR_PUBLISH: false
CREATOR_PAYOUT: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED
