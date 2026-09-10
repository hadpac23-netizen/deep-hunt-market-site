# HUNT DEAL — eBay Buy API Review Pack

## Review target
HUNT DEAL will use approved eBay Buy APIs for fixed-price inventory and approval-gated onsite checkout.

## Reviewer flow
1. Open HUNT home.
2. Search or browse an eligible eBay item.
3. Open product detail.
4. Add item to HUNT partner cart.
5. Open HUNT checkout.
6. Review seller, item, quantity, item price, shipping, delivery, import charges when applicable, and total.
7. Complete Checkout with eBay inside HUNT only after eBay enables the approved guest/member checkout capability.
8. HUNT retrieves order status through the approved Order API.
## Data flow
Browser -> HUNT frontend -> Supabase Edge Function -> eBay OAuth/Browse API.

Approved checkout flow:
Browser -> HUNT checkout -> eBay checkout capability -> eBay Order API -> HUNT order status.

Credentials stay server-side and are not committed to Git or exposed to browser JavaScript.

## Approval gates
- Browse is enabled only after Production OAuth passes.
- eBay onsite checkout stays disabled until required production approval is granted.
- No paid commitment or production launch is performed without owner approval.

## Included screenshots
- screenshots/home.png
- screenshots/product.png
- screenshots/checkout.png
- screenshots/mobile.png
