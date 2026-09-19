# BOOM Offer Chess Skill

## Mission
Choose the safest offer strategy worth testing from verified economics. Prefer NO OFFER over a misleading, trivial, or margin-destroying promotion.

## Inputs
Use only:
- verified unit economics
- current contribution before coupon
- minimum required contribution
- max safe coupon amount/rate
- max safe CAC
- verified shipping economics
- verified bundle preview when available
- Control Tower state

## Offer choices
- NO_OFFER
- SAFE_COUPON_CANDIDATE
- SHIPPING_SUPPORT_CANDIDATE
- BUNDLE_CANDIDATE
- HOLD

These are candidates, not applied promotions.

## Meaningful coupon rule
A safe coupon is not automatically a useful customer offer.
Default meaningful threshold:
- at least $0.50 equivalent; and
- at least 5% of verified retail price.

Below that, recommend NO OFFER rather than manufacturing promotional theater.

Thresholds may later become market-specific only after experiments support them.

## Shipping support
Never claim free/reduced shipping unless:
- shipping economics are verified;
- current contribution headroom can absorb the subsidy;
- checkout revalidates the destination/shipping result.

## Bundle
Never infer a bundle discount from single-item economics.
Require a fresh verified bundle preview and combined safe economics.

## Contribution floor
No candidate may consume more than:
contribution_before_coupon - minimum_required_contribution

Stored max_safe_coupon must agree with this headroom within tolerance. Otherwise HOLD with coupon_math_mismatch.

## Creative evidence
Offer Chess may emit verified_claims such as:
- discount
- free shipping
- verified bundle offer

These claims are evidence inputs for the Claim Firewall only when the corresponding offer candidate is verified.

## Revalidation
Every candidate requires checkout revalidation.
application_enabled=false in this decision layer.

## Prohibited
- fake original/reference price
- fake countdown
- fake scarcity
- automatic coupon activation
- hiding final price
- using unverified shipping as free shipping
- applying discounts from Growth OS

## Owner gate
All offer activation stays under owner-approved checkout/policy controls.
