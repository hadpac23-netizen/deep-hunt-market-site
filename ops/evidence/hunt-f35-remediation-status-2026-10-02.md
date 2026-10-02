# HUNT F35 Remediation Status — 2026-10-02

Scope: PR26 / `launch/hunt-candidate-2026-09-29-v1` only.

Safety posture remains unchanged:
- Payment Live OFF
- Supplier Live Order OFF
- Profit Release OFF
- PayPlus paid callback acceptance OFF
- No Merge / Production without Owner Gate

## Closed in this remediation pass

### Supplier identity leak — FIXED IN BRANCH

Customer profile previously exposed raw provider names in Saved/Liked cards and Order cards, and generated product links with a visible `provider=` query parameter.

Branch fix:
- Saved/Liked cards now show `HUNT SAVED`.
- Order cards now show `HUNT ORDER`.
- Product links generated from profile use opaque `src` source codes via `H.sourceCodeForProvider()`.
- No `product.html?provider=` link is generated from profile.
- Regression coverage added to `tests/storefront-provider-privacy.test.js`.

Verification at commit `397ab647da12d042709e655f1f68d83e13643099`:
- HUNT Catalog Integrity: PASS
- HUNT checkout regression: PASS
- CodeRabbit status: PASS

## Data truth discovered for F35 P1

Current `hunt_shelf_candidates` count observed: 26,375.

Verified attribute coverage in current source payloads:
- `underwear_sizes`: 106 candidates
- `underwear_colors`: 106 candidates
- `physical_variant_option1`: 355 candidates
- `physical_variant_option2`: 355 candidates
- `physical_variant_option3`: 354 candidates
- `physical_variant_weight_g`: 357 candidates

Implication:
- A global Size/Color/Material/Fit filter must NOT pretend all catalog items have these attributes.
- Size Guide / deep facets should be progressive and evidence-gated: show them only where normalized verified data exists.
- Fit Assistant cannot be marked complete until reliable body/model/product measurement data exists.

## Execution matrix

### P0 — real-money launch blockers

1. Destination tax / customs / COO / landed-cost truth
   - Status: BLOCKED ON SOURCE TRUTH
   - Rule: `Final Profit Verified` stays false where destination tax/customs/COO evidence is incomplete.
   - No inferred COO, flat duty, or taxonomy-derived customs class.

2. PayPlus sandbox E2E
   - Status: BLOCKED ON SANDBOX CREDENTIALS + SIGNED CALLBACK PROOF
   - Payment Live remains OFF.

3. Supplier order -> tracking -> shipped E2E
   - Status: BLOCKED ON AUTHORIZED SANDBOX / OFFICIAL PROVIDER CONTRACT
   - Supplier Live Order remains OFF.

4. Fresh stock / price / shipping automation
   - Status: PARTIAL
   - Shadow watcher exists; sellable state must fail closed on stale truth.
   - Do not promote to launch-complete until scheduled execution and stale-to-HOLD behavior are proven.

5. Legal / operating identity / customer policies
   - Status: BLOCKED ON VERIFIED BUSINESS DETAILS + FINAL REVIEW
   - Do not fabricate business identity, support, privacy, or returns details.

6. Pooler / runtime reliability
   - Status: PARTIAL
   - Requires Owner-Gated runtime configuration/deploy + load retest.

7. Git protection / required checks
   - Status: PARTIAL
   - CI is passing; repository protection remains independently unverified where integration lacks permission.

8. Security hardening
   - Status: PARTIAL
   - Keep fail-closed posture; remaining account/security settings require explicit closure evidence.

### P1 — conversion / trust

9. Supplier privacy
   - Status: FIXED IN PR26 BRANCH
   - Regression test added.

10. Size Guide
   - Status: PARTIAL / DATA-GATED
   - Next implementation rule: show available size choices now; show measurement tables only when normalized verified measurements exist.

11. Deep filters
   - Status: PARTIAL / DATA-GATED
   - Add Size/Color/Fit/Material/Rating facets only from normalized verified attributes; hidden or unavailable when evidence is absent.

12. Structured fit reviews
   - Status: PLANNED
   - Existing 1–5 star/comment/photo review system remains valid; add fit dimensions only after schema + RLS + UI contract is reviewed.

13. Back-in-stock notification
   - Status: PLANNED / REQUIRES PERSISTENCE + FRESH INVENTORY TRUTH
   - Subscription must be tied to exact variant and user/contact ownership.

14. Low-stock messaging
   - Status: DATA-GATED
   - Show only from fresh exact-variant inventory; never infer urgency.

15. Delivery ETA before purchase
   - Status: DATA-GATED
   - Show only from verified route/quote evidence; no fake fixed delivery promises.

16. Search autocomplete / synonyms / typo tolerance
   - Status: PARTIAL
   - Basic search exists; enhancement must preserve exact taxonomy and not mix departments.

17. Promotions / coupons / rewards customer UX
   - Status: PARTIAL
   - Backend primitives exist; customer application flow must respect Profit Gate and checkout truth.

### P2 — differentiation after launch truth

18. Personalized Fit Assistant
19. Shareable Wishlist
20. Search by Image
21. Buyer-protection / delivery-guarantee propositions

These remain after P0 truth is stable. Guarantees must not be displayed unless operations/legal/economics can actually honor them.

## Non-negotiable completion rule

A feature is not marked PASS because UI exists. PASS requires the underlying source/data/runtime path to be verified for the exact customer claim being displayed.
