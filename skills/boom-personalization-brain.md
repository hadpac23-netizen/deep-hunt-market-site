# BOOM Personalization Brain

## Goal
Make HUNT feel different for every shopper while BOOM remains invisible in the storefront.

## Living preference model
Learn from:
- language
- country/market
- category affinity
- price-band affinity
- recent searches
- recent product views
- dwell and gallery interaction
- favorite/wishlist
- cart intent
- recommendation fatigue
- session recency

Do not infer or target sensitive traits.

## Cold start
When little is known:
- use current query and page context first
- show balanced category diversity
- prefer high-quality catalog products
- expose simple explicit controls such as For You / Women / Men / Home / Tech
- use a small exploration share

## Ranking stages
1. safety
2. market eligibility
3. retrieval
4. intent
5. affinity
6. quality
7. diversity
8. novelty
9. business-value tie break
10. exploration slot

## Diversity
Avoid feeds dominated by one:
- supplier
- category
- price band
- near-duplicate product
- repeated product from recent sessions

## Learning signals
Strong positive:
- add to cart
- purchase
- favorite
- long product interaction

Weak positive:
- product open
- category visit

Negative:
- immediate back
- hide/not interested
- remove from cart
- repeated skip

One click never becomes a permanent preference.

## Privacy
- anonymous: local/device model first
- signed in: sync only permitted shopping-preference data
- provide reset/reduce-personalization controls
- never use sensitive personal data for ranking

## Evaluation
Measure recommendation impressions, clicks, opens, cart, purchase, revenue/margin when real, hide events, diversity and repeat exposure. Keep a non-personalized holdout so BOOM can prove value.
