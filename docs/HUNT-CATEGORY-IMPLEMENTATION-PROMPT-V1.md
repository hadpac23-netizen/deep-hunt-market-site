# HUNT-CATEGORY-ARCHITECTURE-IMPLEMENTATION-PROMPT-V1

## MODE
PRE-IMPLEMENTATION PLAN ONLY UNTIL OWNER GATE.

Do not merge, deploy, publish taxonomy, enable Payment Live, enable Supplier Live Ordering, or delete catalog data.

## SOURCE OF TRUTH
- config/hunt-category-architecture-v1.json
- evidence/HUNT-CATEGORY-COVERAGE-AUDIT-2026-09-27.json
- HUNT Taxonomy Gate V2
- Profit Gate V2
- current Shadow catalog

## MISSION
Implement a clean three-layer shopping hierarchy:
Department → Family → Leaf Category

while preserving one canonical taxonomy route per product and supporting alternate discovery through audience/occasion/merchandising tags.

## REQUIRED PRE-CODE OUTPUT
Before writing UI code, produce:
1. exact migration map from every current shelf to canonical V1 route;
2. list of shelves to merge/rename/remove;
3. list of cross-surface routes that must become filters instead of taxonomy;
4. list of missing target leaves and clean product counts;
5. list of leaves below 12 products that must remain hidden;
6. list of TAXONOMY_REVIEW/BLOCK items;
7. desktop department rail specification;
8. desktop mega-menu/family specification;
9. mobile sticky department rail specification;
10. mobile family drill-down specification;
11. breadcrumbs and View All behavior;
12. URL/canonical rules;
13. exact files that would change;
14. regression matrix;
15. rollback plan.

## NON-NEGOTIABLE RULES
- Supplier category never wins over HUNT taxonomy.
- Shelf density never overrides product identity.
- One product, one canonical route.
- Cross-surface discovery uses tags/filters.
- No empty public category.
- No TAXONOMY_REVIEW in autofill.
- No unsafe/restricted product class.
- Profit calculation remains separate from taxonomy.
- Final Sell Ready still requires variant/stock/shipping/profit truth.
- BOOM Stylist may rank, never reclassify.
- Production remains unchanged until explicit Owner Gate.

## NAVIGATION CONTRACT
All 17 departments remain reachable from the persistent department rail.

Family row: max 10 equal-weight buttons.

Leaf exposure:
- >=24 clean products: direct button allowed.
- 12–23: direct if useful.
- 1–11: parent/More only.
- 0: hidden.

Every level has All/View All.

## DEFINITION OF DONE FOR PLAN
The plan is complete only when every existing HUNT shelf has exactly one of:
CANONICAL_KEEP
CANONICAL_REMAP
MERGE
CROSS_SURFACE_FILTER
TAXONOMY_REVIEW
BLOCK

and all 17 target departments have an explicit button/family/leaf map.
