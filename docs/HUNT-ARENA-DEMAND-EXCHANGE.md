# HUNT ARENA — Demand Exchange

## The reversal

Normal ecommerce starts with inventory:
merchant publishes → shopper searches → shopper compares.

HUNT ARENA reverses the direction:
shopper defines a mission → BOOM creates a privacy-safe market request → approved merchants compete to satisfy it → Deal Chess judges the offers.

The merchant competes for the buyer, instead of the buyer doing all the hunting.

## Example

Mission:
- black suit
- size 52
- quantity 2
- maximum landed budget ₪700
- destination: Israel
- delivery deadline
- approved alternatives allowed

BOOM can compare:
- existing marketplace offers
- verified promotions
- supplier inventory
- private merchant responses
- checkout-verified combinations

## Privacy boundary

A merchant request must not contain:
- shopper name
- email
- phone
- exact address
- payment details
- unrelated profile data

It may contain only what is needed to quote:
- normalized product intent
- category and variant constraints
- quantity
- budget ceiling when the shopper chooses to disclose it
- country / coarse region
- deadline
- permitted alternatives

HUNT remains the broker between the shopper and merchant until the shopper chooses a verified offer.

## Merchant response

Only approved HUNT merchants may respond.

An offer contains:
- product or offer identity
- quantity
- full landed total when available
- shipping / taxes / duties components
- delivery promise
- expiration
- evidence
- checkout verification state

## BOOM rules

BOOM does not rank by merchant payment.

Deal Chess ranks by:
1. mission fit
2. verified availability
3. checkout truth
4. landed cost
5. delivery fit
6. return / support quality when available
7. observed outcome quality

Sponsored participation may exist later, but sponsorship cannot silently improve the organic verdict.

Merchants do not see rival private offers.
HUNT does not disclose the shopper's exact maximum budget unless the shopper explicitly chooses that mode.

## Crowd Power

Crowd Power is opt-in demand aggregation.

When multiple compatible missions exist, HUNT may create an anonymous demand pool such as:
- 18 shoppers
- 31 units total
- same product family / compatible variants
- same target country
- similar delivery window

BOOM can request a group quote from approved suppliers or merchants.

Crowd Power must not use:
- fake member counts
- fake countdowns
- social pressure
- automatic commitment
- hidden price changes

A shopper can leave a collecting pool before accepting an offer.
A group price is shown only when a real merchant or supplier has submitted it.

## Why this matters

A normal comparison engine searches existing prices.
HUNT ARENA creates new competitive pressure.

This creates three layers:
1. Market Hunt — find what already exists.
2. Deal Chess — identify the best verified existing move.
3. Demand Exchange — invite the market to beat it.

The third layer is the strategic moat.

## Future extension: HUNT Price Shield

After an onsite purchase, HUNT may watch the same verified product during the merchant's price-adjustment or return window.

If an eligible lower price appears:
- HUNT verifies product identity and policy eligibility
- shows the shopper the evidence
- recommends the permitted next action

HUNT does not assume a refund policy exists and does not submit claims without explicit authorization.

## Future extension: Outcome Memory

After fulfillment HUNT learns from non-sensitive transaction outcomes:
- final amount paid
- delivery reliability
- cancellation / return outcome
- support outcome
- shopper usefulness feedback

Outcome Memory improves merchant quality scoring and future Deal Chess decisions.

# Gap Map — what HUNT still needs

## Tier 1 — critical
- server-side HUNT Mission persistence
- exact product identity graph using GTIN / EAN / SKU / brand / model
- landed-cost engine for shipping, tax and duties
- merchant response API for Arena offers
- returns / cancellation policy normalization
- checkout execution for supported onsite suppliers
- order reconciliation after purchase

## Tier 2 — major advantage
- price history
- Price Shield
- UCP / ACP interoperability
- AI-channel structured catalog distribution
- merchant delivery / support outcome score
- Crowd Power quote workflow
- referral / creator attribution that cannot influence BOOM ranking

## Tier 3 — scale
- demand forecasting from anonymous mission aggregates
- supplier opportunity dashboard
- international currency normalization with timestamped FX evidence
- merchant SLA scoring
- counterfeit / identity discrepancy detection
- experimentation framework for mission completion
- privacy-preserving personalization controls

## North-star expansion

Verified Mission Success Rate remains the primary product metric.

For ARENA add:
**Market Beat Rate**
= share of eligible open missions where a verified merchant response beats the best already-known market outcome without degrading mission fit.

A high Market Beat Rate proves HUNT creates value rather than merely redistributing traffic.
