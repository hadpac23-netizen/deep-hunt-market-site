# HUNT DEAL — BOOM Commerce Master Plan

Updated: 2026-09-11

## Mission
Keep HUNT stocked with real, current, purchasable products from authorized APIs/feeds while BOOM continuously improves merchandising, supplier quality, fulfillment truth, product economics, SEO and marketing decisions.

## Current verified catalog snapshot
Static shard audit (unique provider + item_id, excluding catalog-home duplicates):
- 6,490 unique products
- CJdropshipping: 5,276
- eBay: 727
- Printful: 308
- Gooten: 179

Strong/deep shelves include Women (394), Kids (294), Jewelry (253), Home (480), Outdoors (446), Pets (473), Phone Accessories (212), Storage (1,140).

Weak/critical shelves include Beauty (45), Tech (50), Travel (39), Swimwear (15), Perfume (2), Suits (0), Gifts (4), Sports (7), Socks (11).

Focused shelves currently requiring live supplier fill:
- womenunderwear
- menunderwear
- kidsunderwear
- sleepwear
- loungewear
- plussize
- petite
- maternity
- sets

## Supplier order of operations
1. CJdropshipping — primary live supplier/fulfillment source.
2. eBay — Browse integration active; onsite checkout remains approval-gated under EPN TIGS Case #00451324.
3. BigBuy — evaluate current EU API/feed, shipping, returns, catalog rights and cost before commitment.
4. Nihao — request direct API/feed, inventory refresh, order/tracking and media rights.
5. Additional suppliers only after a verified coverage or fulfillment gap remains.

## Product publish gate
A product should not be promoted or treated as purchase-ready unless HUNT has truthful source data for:
- provider + stable item id
- title + exact product media
- price/currency
- availability/stock where supported
- variants/sizes where relevant
- shipping/delivery
- returns/cancellation
- market eligibility
- brand/authenticity evidence when relevant

## BOOM Shelf Hunter
BOOM maintains public-safe category depth without fabricating products. Priority:
Women -> Bags -> Shoes -> Jewelry -> Beauty -> Men -> Kids -> Home -> Tech -> weak/zero focused shelves.

Operational coverage heuristic:
- critical: 0–19 static unique products
- weak: 20–74
- ok: 75–199
- strong: 200+
This is a workflow heuristic, not a prediction of demand or sales.

## BOOM Learning Hunter
Reusable operating modules:
1. Merchandising Intelligence
2. Product Truth Graph
3. Supplier Scoring
4. Landed Profit / Contribution Margin
5. Trend Radar
6. Visual Merchandising
7. Product SEO / Indexability Gate
8. CRO + Personalization
9. Marketing Attribution and Experimentation
10. Brand / Marketplace Compliance

Learning is only considered complete when it changes a decision rule, score, gate or workflow.

## Checkout truth
- eBay Browse: usable for approved product discovery.
- eBay Order/onsite checkout: OFF until explicit written production approval.
- CJ/other suppliers: onsite ordering only after order, shipping, tracking, returns and commercial terms are verified.
- Never simulate an approved checkout, supplier deal, discount, review, stock value or commission.

## SEO parallel track
Keep the slim sitemap/category architecture, canonical URL alignment and Search Console indexing work running independently from shelf population. Do not re-add dynamic product shells to Google until each product passes the Indexability Truth Gate.

## BOOM persistent controls
- public.hunt_boom_command_queue = prioritized execution queue
- public.hunt_shelf_coverage = persistent shelf coverage state
- Git/GitHub = source of truth for code/migrations/docs
