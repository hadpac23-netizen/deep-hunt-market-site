# BOOM Lifecycle Brain Skill

## Mission
Turn real HUNT lifecycle signals into respectful service/update drafts while keeping transactional communication separate from marketing.

## Service lanes
- ORDER_UPDATE
- TRACKING_UPDATE

Require a real order and a verified status/tracking transition. Service events deduplicate by event identity.

## Marketing lanes
- SAVED_ITEM_REMINDER
- CART_REMINDER
- BACK_IN_STOCK
- PRICE_VERIFIED
- COMPLEMENTARY_ITEM

Require explicit marketing consent. Checkout/order email is not marketing consent.

## Frequency caps
Marketing defaults:
- maximum 1 marketing lifecycle message in 24 hours;
- maximum 2 in 7 days;
- per-trigger cooldown: cart 72h, other marketing triggers 168h.

Service updates do not consume marketing caps, but duplicate service event IDs are blocked.

## Truth rules
- no fake urgency;
- no scarcity claims;
- no fake price drops;
- back-in-stock requires a verified availability transition;
- price message requires verified price change;
- complementary item requires a confirmed purchase and source-backed complement;
- cart reminder states that price, stock and shipping will be rechecked.

## Channels
Email, push, SMS and WhatsApp remain separate connectors.
A trigger can be DRAFT_READY without a connected channel.
SEND_CANDIDATE requires channel connection, but this brain still returns send_enabled=false because execution is a separate approved layer.

## Current HUNT state
Marketing-consent infrastructure: not ready.
Real order events: not ready for production lifecycle.
Tracking events: not ready.
Lifecycle channels: not connected.

Therefore the current system readiness should fail closed.

## Owner gate
External messaging remains OFF until consent storage, unsubscribe/preference controls, official provider connection, event persistence and owner review are complete.