---
name: hunt-product-truth
description: This skill should be used whenever HUNT product readiness, supplier data, variants, images, stock, shipping, cost, profit, availability, or sellability is evaluated or changed. It prevents unverified readiness and fabricated commerce data.
---

# HUNT Product Truth

Required order:
Safety -> Exact Variant -> Image QA -> Stock -> Shipping -> Final Cost -> Profit Reserve -> Route Lock.

Rules:
- Do not infer final readiness from UI completeness.
- Do not mark Final Profit Verified without required tax/cost truth.
- Do not invent stock, shipping, price, margin, variants, or physical quality.
- Distinguish verified, reserve-based, review-required, and HOLD states.
- Prefer fresh exact-variant evidence.
- If supplier endpoints disagree, preserve source evidence and apply the documented truth rule rather than guessing.
- Keep sellable=false and production_effect=false while launch gates remain closed.
- Use bounded, cached supplier/API work; write results back in short batches.
- Product Truth outranks catalog fullness.

Output status with evidence and unresolved blockers, not optimistic labels.
