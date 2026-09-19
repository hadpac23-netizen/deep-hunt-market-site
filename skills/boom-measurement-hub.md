# BOOM Multi-Channel Measurement Hub Skill

## Mission
Create one HUNT measurement identity for each commerce event so browser analytics, first-party analytics and future server-side channel adapters can deduplicate the same user action.

## Canonical event envelope
Every event must have:
- event_id
- event_name
- event_time_ms
- source
- session_id
- page_path
- mission_type
- product/item identity when applicable
- variant identity when applicable
- quantity
- destination market when known
- transaction identity for purchase
- value/currency only when truthful
- consent_granted
- user_data_included=false by default

## Event identity
- Generate event_id exactly once per event.
- The same event_id travels to every allowed destination.
- Purchase uses a deterministic ID derived from the confirmed transaction ID.
- Do not create a purchase event from checkout preview, payment intent or supplier sandbox.

## Consent
No measurement send before analytics consent.
Queued events preserve their original event_id after consent is granted.
Decline clears the queue.

## PII
Canonical HUNT events contain no raw:
- email
- phone
- address
- full name
- customer identifiers

Future enhanced conversions / CAPI user data require a separate consent, hashing and policy review. Do not add them silently.

## Destination states
GA4:
May send when configured + consented.

HUNT first-party:
May send existing events when configured + consented.
Server event_id persistence must be proven before calling server-side dedup READY.

Google Ads/Data Manager, Meta CAPI, TikTok Events API, Pinterest Conversions API:
Remain send_enabled=false until official account connection, destination schema, consent rules and persistent event_id are implemented.

## Deduplication invariant
Browser/server dedup is not complete unless the backend persists the canonical event_id.

A short time-window duplicate guard is not equivalent to persistent event identity.

## Purchase invariant
Purchase requires:
- confirmed=true
- real transaction_id
- numeric value
- currency
- hunt_order_state=confirmed_real_order

## Owner gate
Connecting a new external measurement destination, enabling customer-data matching or sending conversion data externally requires explicit owner review.
