# HUNT DEAL — Business Model

## Two shopping experiences, one commerce engine

HUNT supports both:

1. **Standard Store** — shoppers browse verified products, add to cart and buy normally when onsite checkout is supported.
2. **HUNT Mission / Arena** — the shopper defines an outcome and BOOM hunts, compares, verifies, and can invite approved merchants to beat the known market result.

The shopper does not need to understand the revenue model. BOOM keeps ranking and deal truth independent from how HUNT earns money.

## Revenue lane 1 — STANDARD_RETAIL

HUNT earns retail contribution when HUNT is the seller / checkout merchant for a supported supplier order.

Gross revenue:
- verified customer retail price

HUNT-borne costs can include:
- supplier cost
- shipping
- payment fee
- taxes / duties borne by HUNT
- fulfillment
- returns reserve
- customer acquisition
- creator attribution
- other verified transaction costs

Contribution Profit =
Retail Revenue
- Supplier Cost
- Shipping
- Payment Fees
- Tax / Duties borne by HUNT
- Fulfillment
- Returns Reserve
- Acquisition Cost
- Creator Cost
- Other Cost

A supplier-base price is never shown as a customer retail price.

## Revenue lane 2 — ARENA_SUCCESS_FEE

An approved merchant can respond to a HUNT Mission with a private verified offer.

If the shopper accepts and the transaction is completed, HUNT may earn a disclosed success fee under the merchant agreement.

Important:
- paying HUNT never improves the organic BOOM verdict
- competing merchant offers stay private
- the merchant pays only under the agreed success condition
- HUNT records revenue only after the qualifying conversion is confirmed

The same Profit Gate evaluates the fee after HUNT-borne acquisition, payment, creator, support, or other verified costs.

## Revenue lane 3 — AFFILIATE_FALLBACK

When a legitimate commerce source cannot support HUNT onsite checkout, HUNT may use an approved affiliate / referral route.

Revenue:
- confirmed commission only

Rules:
- outbound route is clearly disclosed
- no commission is recorded before network / merchant confirmation
- BOOM does not rank a product higher because its commission is larger
- affiliate is a fallback lane, not a fake onsite checkout

## Later revenue lanes

Only after the core store proves useful and profitable:
- Merchant Pro tools
- clearly labeled sponsored placements
- premium shopper monitoring features

These are secondary. Standard retail, Arena success fees, and affiliate fallback form the initial revenue architecture.

# Profit Gate

Every commercial candidate passes one internal formula before HUNT can treat it as sellable.

Profit Gate inputs:
- channel
- currency
- all HUNT-borne cost fields
- channel revenue
- minimum contribution-profit floor
- minimum contribution-margin floor
- verified evidence flag

Result:
- **PASS** — verified economics clear the configured floor
- **FAIL** — economics are complete but below the configured floor
- **WAIT** — evidence or costs are incomplete

No default profit percentage is invented. The owner configures the floor.

## Required revenue floor

The engine calculates the minimum revenue required to satisfy both:
- minimum absolute contribution profit
- minimum contribution margin

For STANDARD_RETAIL this becomes the minimum acceptable retail revenue.
For ARENA it becomes the minimum success fee.
For AFFILIATE it becomes the minimum commission needed for that traffic / conversion cost profile.

# Checkout truth

The public checkout must never total supplier-base costs as if they were retail prices.

Until a cart item has:
- a verified retail price
- Profit Gate = PASS

the cart displays:
**PRICING PENDING**

Payment remains disabled until the separate payment, fulfillment, tax, returns and order-execution controls are ready.

## Revenue accounting

Confirmed business revenue events are separated by channel:
- STANDARD_RETAIL
- ARENA_SUCCESS_FEE
- AFFILIATE_FALLBACK
- later SPONSORED / MERCHANT_PRO

Projected margin is not booked as confirmed revenue.

## BOOM operating objective

BOOM optimizes for:
**Verified Profitable Orders**

Not:
- clicks
- gross sales without cost truth
- largest commission
- largest advertised discount
