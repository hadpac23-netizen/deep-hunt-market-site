# BOOM Lifecycle Brain Skill

## Mission
Decide whether a HUNT lifecycle trigger is eligible for preparation without sending any message.

## Supported triggers
Marketing:
- saved_reminder
- cart_reminder
- price_verified
- back_in_stock
- complementary_followup

Transactional/service:
- order_update
- tracking_update

## Required infrastructure for external messaging
Before email/push/SMS/WhatsApp can become a SEND_CANDIDATE:
- explicit lifecycle consent registry
- identified recipient
- send-history persistence
- enforceable frequency-cap ledger
- suppression/unsubscribe handling
- quiet-hours check
- connected channel
- send-enabled channel
- truthful trigger evidence

## Consent separation
Marketing triggers require channel-specific marketing opt-in.
Transactional/service triggers require a separately enabled transactional channel.
Marketing consent cannot silently authorize service messages, and service contact details cannot silently authorize marketing.

## Product-truth gates
Product lifecycle messages require:
- safe category
- Product Truth ready
- verified price
- exact variant stock verification for back-in-stock
- verified price-change evidence for price notifications

Never create urgency, scarcity, popularity, delivery guarantees or compatibility claims from lifecycle behavior.

## Order and tracking gates
Test orders never trigger customer messaging.
Order updates require:
- confirmed non-test order
- real order status

Tracking updates require:
- confirmed non-test order
- verified tracking change
- tracking status or tracking number
- event_id dedup so the same service event is not sent twice

Complementary follow-up requires:
- confirmed non-test order
- delivered state
- verified complementary Product Truth

## Frequency rules
Per-trigger:
- saved reminder: min 24h, max 2/30d, 7d cooldown
- cart reminder: min 2h, max 2/30d, 72h cooldown
- verified price: max 2/30d, 7d cooldown
- back in stock: max 2/30d, 7d cooldown
- complementary follow-up: min 7d after delivery, max 1/30d, 30d cooldown

Global marketing caps:
- max 1 marketing message / 24h
- max 2 marketing messages / 7d

Service events are not governed by marketing caps, but exact event IDs are deduplicated.

## Safe copy
The engine may create conservative message drafts only when the trigger is fully eligible.
Drafts:
- use verified facts only
- avoid pressure or urgency
- tell the user to review current HUNT details
- keep price/stock/shipping subject to the corresponding truth gates

## Execution rule
The core may return SEND_CANDIDATE or IN_APP_CANDIDATE.
It always returns:
- send_enabled=false
- external_send=false
- execute=false

No email, SMS, WhatsApp, push or external provider call is made from this skill.

## Owner gate
External messaging provider activation and any automated lifecycle send require explicit owner review.
