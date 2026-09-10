# HUNT DEAL — eBay Buy API Production Access Draft

## Business model
HUNT DEAL is a shopping decision-intelligence marketplace. It supports normal catalog shopping plus mission-based shopping where BOOM compares verified offers and helps users choose the best outcome.

eBay inventory is intended to be surfaced inside HUNT only through approved eBay Buy APIs. HUNT will not present unsupported onsite checkout as active. eBay checkout remains approval-gated.

## Intended eBay use case
- Browse fixed-price eBay inventory through the Browse API.
- Show eBay item imagery, title, price, seller identity/ratings, shipping, delivery, condition and returns when returned by eBay.
- Allow HUNT users to place eligible eBay items in a partner cart.
- For approved guest-checkout markets, use Checkout with eBay inside HUNT.
- Do not redirect or mask checkout state when onsite checkout approval is unavailable.

## Current implementation status
- eBay Browse adapter implemented behind server-side OAuth Client Credentials.
- Fashion-first safety and quality filters implemented.
- eBay Order adapter implemented but disabled by approval gate.
- HUNT cart/checkout recognizes ONSITE_REQUIRED eBay items.
- Product page blocks purchase if eBay Order API approval is unavailable.
- No production eBay checkout is enabled today.

## UX flow for review
1. User searches or browses HUNT.
2. HUNT requests eBay Browse data server-side.
3. HUNT shows only eligible fixed-price items.
4. User opens product detail and sees eBay-provided listing data.
5. User adds an eligible item to HUNT partner cart.
6. Checkout page shows item, seller, quantity, item price, shipping, import charges when available, and total.
7. Guest buyer completes payment through Checkout with eBay widget inside HUNT once approved.
8. HUNT retrieves the guest purchase order status using the Order API.

## Data handling
- eBay API credentials remain server-side in Supabase Edge Function secrets.
- HUNT does not store eBay Client Secret in browser code, Git or catalog JSON.
- Buyer contact/address data is sent only as needed for approved checkout flow.
- HUNT does not expose purchaseOrderId to the buyer.

## eBay UX compliance commitments
- Only FIXED_PRICE items for checkout use cases.
- Preserve eBay relevance ordering where required.
- Show eBay logo where required.
- Use eBay item images.
- Show seller name and seller ratings when returned.
- Show item condition.
- Show shipping cost separately from item price.
- Show returns information.
- Show required disclosure/privacy links.
- Show total cost and import-charge breakdown when applicable.

## Sandbox review instructions — to complete before submission
- URL: [insert approved sandbox/review URL]
- Test account: [insert if eBay requests one]
- Steps: Home → Search → eBay item → Partner Cart → Checkout with eBay sandbox flow.
- Note: guest/member checkout sandbox access itself requires eBay approval.

## Requested access
We request production access for eBay Buy APIs necessary for the above partner shopping flow, including guest checkout via Checkout with eBay where supported.
