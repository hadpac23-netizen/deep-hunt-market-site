---
name: hunt-bulk-catalog-fill
description: Fill HUNT shelves in large verified batches while preserving taxonomy, image, stock, Market5 and profit truth.
---

# HUNT Bulk Catalog Fill

## Input priority
1. Already 5/5 Market5 + Profit, missing only Image
2. Already Image + Profit, missing only Market5
3. Already Image + Market5, missing only Profit materialization
4. Full new candidate pipeline last

## Batch size
- 100-200 candidates where provider/API health permits
- prioritize multiple thin shelves in parallel

## Required gates
Stock → Safety → Taxonomy → Image → Market5 → Profit → Candidate Status → Dedupe/Route Fit.

## Shelf target
Primary shelves: minimum 8 strict products first.
Then raise strong commercial shelves toward 16-24+.

## Never
- mix adjacent categories
- use stale provider names in public URLs
- rerun Market5 when 5/5 exact-variant evidence is already fresh
- override HOLD just to increase count
