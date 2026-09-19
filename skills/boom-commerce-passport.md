# BOOM Commerce Passport Skill

## Mission
Create one evidence-first commerce passport per HUNT SKU so every external channel receives the same verified product truth.

## Passport layers
1. Identity — provider, item ID, SKU, title, category, brand, model.
2. Truth — verified retail price, feed-safe availability, canonical URL, media, merchant identity, shipping, returns, source freshness.
3. Conversational — verified Q&A, related products, variant options, document links.
4. Economics — verified contribution, max safe CAC, max safe coupon.
5. Measurement — stable product/attribution identity.
6. Channel readiness — data-ready, connected/discovery-ready and transaction-ready are separate states.

## 2026 channel principles
- Google Merchant/AI discovery requires structured product truth. Do not publish incomplete commercial claims.
- Agentic discovery and agentic transaction readiness are separate. Discovery may be prepared before payment/order/tracking are enabled.
- Paid media requires verified economics, attribution readiness and explicit owner approval.
- Organic/social drafts may be prepared without publishing, but external publishing remains owner-gated.

## Fail-closed rules
- Do not infer product descriptions from titles.
- Do not treat a catalog-level availability signal as feed-safe variant availability.
- Do not invent GTIN, brand, model, shipping, returns or compatibility.
- Do not publish stale source data.
- Do not export an unverified price.
- Do not mark a channel connected just because analytics for that vendor exists.
- Never enable spend, external publishing, payment or supplier ordering from this skill.

## Required outputs per SKU
- passport_id
- product_key
- truth states
- conversational attributes
- verified creative inputs
- economics envelope
- measurement identity
- channel readiness
- blockers
- owner gate

## Readiness vocabulary
- data_ready: product data contract is complete enough for the channel.
- discovery_ready: data_ready + official channel connection.
- transaction_ready: discovery_ready + checkout/payment/order/tracking lifecycle.
- blocked: one or more truth, policy, connection or approval gates are unresolved.

## Learning loop
CATALOG → PASSPORT → BLOCKERS → ENRICH/VERIFY → CHANNEL DRAFT → OWNER REVIEW → PUBLISH/TEST → MEASURE → LEARN.
