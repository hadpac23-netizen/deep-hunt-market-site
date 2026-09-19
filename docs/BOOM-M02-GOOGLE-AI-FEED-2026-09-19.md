# BOOM M02 — Google + AI Feed Layer — 2026-09-19

## Mission
Build a network-free Google Merchant / AI-shopping ProductInput draft and validation layer on top of M01 Commerce Passports.

## Current operating mode
- ProductInput draft: ON
- Validation: ON
- Merchant API OAuth: OFF / not connected
- Google Merchant insert/update/delete: OFF
- External feed publishing: OFF
- Paid Google campaigns: OFF
- Owner gate: REVIEW_REQUIRED

## 2026 product contract incorporated
The current Merchant Products API supports ProductInput with:
- offerId
- contentLanguage
- feedLabel
- productAttributes

Product attributes include standard commerce attributes plus newer conversational and enrichment fields such as:
- questionsAndAnswers
- documentLinks
- variantOptions
- relatedProducts
- videoLinks
- canonicalLink
- offer-level return data in Merchant API capabilities

M02 uses these field concepts only for local draft validation. It does not call Google.

## Critical F35 finding — variants
A parent HUNT product can contain multiple provider variants. Google offer-level attributes such as color and size must not be collapsed into one misleading ProductInput.

M02 therefore emits:
variant_offer_not_expanded

whenever the passport contains multiple values for a variant option. A later feed enrichment stage must create one external offer per exact provider/HUNT variant identity.

## Critical F35 finding — market
M02 does not default feedLabel to US, Israel or another country.
An explicit target feed label is required.

## M02 validator
A draft fails closed when any required truth layer is missing:
- source description
- HTTPS product URL
- HTTPS primary image
- verified retail price
- feed-safe availability
- merchant identity / policy readiness from M01
- source freshness
- exact variant offer expansion
- feed label

Channel connection is deliberately not required for export_ready; it is required for publish_ready.

## M01 live baseline entering M02
At the start of this stage:
- catalog products: 117
- catalog availability signals: 117
- source fresh ≤7d: 46
- product images: 117
- products with brand: 5
- distinct products with verified positive unit economics: 3
- fully approved business identity: 0

Because current hunt_catalog_products does not persist rich source descriptions or feed-safe variant availability, and business identity/policy/channel gates are not ready, the first live M02 result is zero export-ready and zero publish-ready Google offers. This is a truthful baseline, not a reason to weaken the validator.

### Live blocker counts
Read-only validation against the current 117 catalog rows:
- title missing: 0
- HTTPS image missing: 0
- verified retail price/economics missing: 114
- rich source description missing: 117
- feed-safe availability missing: 117
- approved merchant identity missing: 117
- shipping publication readiness missing: 117
- returns publication readiness missing: 117
- source freshness not verified within 7 days: 71
- explicit feed label / target market missing: 117

The current positive base is therefore strong media/title coverage, while commercial feed truth and policy/merchant configuration remain the limiting layer.

## Next gap after M02
M03 should build the Measurement Hub.
In parallel, the feed-enrichment lane must eventually persist:
1. source-backed rich description;
2. exact per-variant offer identity;
3. feed-safe availability snapshot;
4. target-market/feed-label configuration;
5. shipping and returns publication readiness;
6. official Merchant connection;
7. verified conversational attributes.

## Invariants
NETWORK_CALLS_FROM_EXPORTER: 0
EXTERNAL_PUBLISHING_CHANGED: false
PAID_SPEND_CHANGED: false
PRODUCTION_CHANGED: false
PAYMENT_CHANGED: false
SUPPLIER_ORDER_CHANGED: false
OWNER_GATE: REVIEW_REQUIRED
