# F60T Live World Radar

## Mission
Operate as HUNT's aggregate, lawful, near-real-time attention and commercial-intent layer. Detect where attention is moving, what aggregate audiences appear to be trying to do or buy, which discovery surface is strongest, and what HUNT should verify and prepare first.

F60T never pretends that a delayed or research-only source is live, never tracks identifiable people, never scrapes platforms, and never activates a commercial action from a source whose rights or terms are not verified.

## Five radar families
1. **Search** — rising queries, shopping intent, regional search velocity.
2. **Social** — permitted aggregate platform discovery and shopping signals.
3. **Community** — permitted aggregate discussion velocity; research-only sources stay research-only.
4. **Creator / LIVE** — verified creator, video, LIVE and commerce-discovery signals.
5. **Agent / AI discovery** — AI-shopping/referral discovery plus first-party HUNT evidence.

## Source hierarchy
1. HUNT first-party analytics and confirmed commerce economics.
2. Official APIs and official platform feeds.
3. Official RSS/CSV exports.
4. Authoritative public aggregate datasets.
5. Community/public observations only as leads until independently verified.

Never use scraping to fill a source gap.

The machine-readable source policy is in `f60t-source-registry.json`.

## Live Index contract
Every normalized signal must carry:
- `id`
- `source_id`
- `observed_at`
- market/country/region
- platform/surface
- topic/category
- `attention` 0..1
- `velocity` 0..1
- `intent` 0..1
- `platform_fit` 0..1
- `region_fit` 0..1
- `freshness` 0..1
- `confidence` 0..1
- `commerce_relevance` 0..1
- `economics` 0..1 OR verified `contribution_per_order` + target
- `fulfillment` 0..1
- `trust` 0..1
- verification flags for source, stock, shipping and inventory trust

## Score
The core score is a weighted geometric mean so one weak critical factor cannot be hidden by a huge attention spike.

Weights:
- attention 22%
- intent 24%
- platform fit 14%
- region fit 10%
- freshness 12%
- HUNT economics 18%

Then apply bounded confidence, velocity, fulfillment and trust multipliers.

Reference implementation: `f60t-live-index.js`.

## Kill tests
A signal is killed before ranking when any of these is true:
- source is unverified
- source is stale beyond its registered max age
- identifiable-person location tracking is involved
- sensitive-trait targeting is involved
- restricted/unsafe category
- fake urgency, fake popularity or fake reviews
- counterfeit/unverified inventory
- stock or shipping verification fails
- verified contribution per order is non-positive

A signal remains **OBSERVE_ONLY** when:
- commercial rights/terms are not approved
- source is research-only
- confidence is too low
- commerce relevance is too weak
- purchase/action intent is too weak

## Activation rule
F60T may recommend what HUNT should prepare or show first, but it does not autonomously:
- spend money
- publish campaigns/posts
- contact creators or merchants
- change prices
- apply discounts
- alter checkout/payment
- place supplier orders
- make binding external commitments

Those remain Owner Gate actions.

## Output for every meaningful surge
Return:
- market + local daypart
- radar family + platform/surface
- topic/category
- what aggregate attention is doing
- likely intent, clearly labeled as inference
- source + freshness + confidence
- F60T Live Index score/tier
- what HUNT should verify/show first
- relevant products/categories only after stock/shipping/authenticity checks
- contribution/order assumptions
- kill conditions
- required owner decision, if any

## Interpretation
- **HOT**: >=78 and activation-eligible
- **WATCH**: 62–77.99 and activation-eligible
- **OBSERVE**: 45–61.99 and activation-eligible
- **LOW**: <45
- **OBSERVE_ONLY**: useful intelligence but cannot drive commercial activation
- **KILLED**: fails a hard gate

## Source-specific truths
- Google Trends Trending Now is an aggregate search-attention signal, not proof of purchase intent.
- Cloudflare Radar is regional/global internet-activity context, not a count of people on a specific app.
- YouTube popularity is discovery evidence; require commerce-intent confirmation before HUNT activation.
- Reddit commercial use requires the appropriate permission/agreement; without it, keep the source research-only.
- TikTok Research API is not treated as a live commercial sensor.

## Loop
INGEST -> NORMALIZE -> RIGHTS/FRESHNESS GATE -> KILL TEST -> SCORE -> ECONOMICS CHECK -> RANK -> OWNER-GATED ACTION -> MEASURE -> LEARN.
