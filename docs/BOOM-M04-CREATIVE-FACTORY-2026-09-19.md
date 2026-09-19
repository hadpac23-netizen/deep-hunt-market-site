# BOOM M04 — Creative Factory + AI Claim Firewall — 2026-09-19

## Objective
Turn verified HUNT product facts into reusable channel creative drafts without creating unsupported product claims.

## Implemented
- boom-claim-firewall.js
- boom-claim-firewall.test.cjs
- boom-creative-factory.js
- boom-creative-factory.test.cjs
- Growth OS Creative Factory dashboard
- Control Tower → Creative Factory gating
- legacy Growth OS creative count replaced by M04 safe drafts

## Draft channels
- Google asset copy
- Meta Reels
- TikTok
- Pinterest
- HUNT onsite

## Creative candidate gate
A SKU requires:
- safe category
- title
- primary image
- at least one verified creative fact
- no Control Tower STOP state

External HOLD can still allow a local draft because draft preparation is not publication. External publishing remains OFF.

## Claim Firewall
Adversarial QA verifies that unsupported claims such as:
- #1
- waterproof
- fits all phones
- delivery tomorrow
- limited stock
- free shipping
are rejected when matching evidence is absent.

Verified evidence can explicitly authorize a matching claim. The firewall never creates evidence.

## Product media
Video briefs explicitly require approved product-linked media. No unrelated product video, invented demonstration or synthetic performance claim is allowed.

## Publication state
Every output is:
publish_ready=false
external_publish=false
owner_gate=REVIEW_REQUIRED

## Current limitation
The live catalog currently has limited persisted rich Product Truth. M04 therefore intentionally produces drafts only for SKUs whose current Commerce Passport exposes at least one verified creative fact. It must not inflate creative coverage by converting a title into invented descriptive claims.

## Next stage
M05 Offer Chess should consume:
- verified unit economics
- safe CAC
- safe coupon envelope
- shipping truth
- channel/customer context
and choose among no offer / coupon / bundle / shipping support only when the math remains safe.

## Invariants
EXTERNAL_PUBLISHING_CHANGED: false
PAID_SPEND_CHANGED: false
PRODUCTION_CHANGED: false
CLAIM_GENERATION_FROM_UNKNOWN_DATA: false
OWNER_GATE: REVIEW_REQUIRED
