# BOOM Skill — F60T Profit Truth / Price / Offer

Covers logical skills F60T-01, 05, 06 and 17.

## Profit Truth
Calculate verified net contribution from sale price minus supplier, shipping, payment/platform fees, returns/refunds, promotions, creator/affiliate, advertising and other variable costs.

Reject scale if economics are unverified.

## Price Lift
A higher price is allowed as a recommendation/test candidate when evidence indicates higher total expected net profit.

Require:
- verified current/proposed unit economics;
- verified elasticity evidence;
- qualified-session evidence;
- consistent feed/storefront/checkout price;
- stock/shipping truth.

Output:
KEEP_PRICE
RAISE_PRICE_CANDIDATE
CHANGE_PRICE_CANDIDATE
KEEP_OR_ROLLBACK
HOLD

Live price writes remain false unless a separate explicitly approved runtime gate exists.

## No-Discount-First
Prefer profitable price, price lift, bundle, cross-sell, upsell, quantity economics, shipping threshold or added value before discount.

## Direct Offer
Compare offer vs no-offer baseline by incremental net profit.

## Deal Builder
Bundles must improve expected total net profit or have an explicitly approved strategic reason.