# HUNT Live Launch Proof Audit — 2026-09-20

Status: **BLOCKED FOR SOFT LAUNCH / BLOCKED FOR REAL MONEY**

This audit separates **source-ready** from **live-ready**. It was produced from read-only inspection of the connected `boom-social-world` Supabase project plus the Final Candidate source. No database write, migration, Edge deployment, payment, supplier order or production deployment was performed.

## Final Candidate evidence already PASS

- Final Preview Matrix: 1440 / 1280 / 768 / 390 PASS.
- Desktop + mobile Product → exact variant → stock verification → Cart → Checkout PASS.
- No final-matrix browser runtime errors.
- Brain Runtime single Supabase/Auth client and single Cart owner PASS.
- Product Finding, Gallery, Variant Truth, Decision Confidence, Hero 4.2.1, Home 3 and System Completion PASS.
- Analytics consent/privacy fail-closed and revocation tests PASS.
- Commerce Truth, profit gate, payment/order state and callback safety source contracts PASS.
- Live payment remains disabled.

## Live Supabase evidence

Project: `boom-social-world` / `zszlnahjqmwozwubetkm`.

### Deployment sync

The live migration history currently ends at:

`20260919193323_f60t_official_rss_source_contract`

Final Candidate contains four later source migrations that are **not deployed live**:

1. `20260920071959_partner_evidence_freshness.sql`
2. `20260920084547_harden_hunt_payment_order_grants.sql`
3. `20260920094955_move_security_definers_to_boom_internal.sql`
4. `20260920095538_add_hunt_legal_registry.sql`

This confirms the manual `deployment_sync = FAIL` gate.

### Business Identity

A primary Business Identity row exists, but it is:
- status: `draft`
- owner-approved: `false`
- missing required fields: legal entity name, registration number, business address, support email, privacy contact email and returns address.

No values are copied into this audit.

### Legal

The source expects `public.hunt_legal_document_versions`, but that table does **not** exist in the live database.

The missing table is already source-tracked by `20260920095538_add_hunt_legal_registry.sql`. That migration creates a versioned legal registry with RLS and allows public reads only for owner-approved published/effective documents. It does not fabricate legal content.

Therefore Legal Readiness cannot be live-PASS until:
1. the owner approves deployment of the source migration;
2. Business Identity is complete and owner-approved;
3. owner/counsel supplied Terms, Privacy, Returns and Shipping versions are published under Owner Gate.

### PayPlus

Live evidence:
- `hunt_payplus_status_observations`: 0 rows.
- verified sandbox success fingerprint: not captured.
- verified sandbox reject fingerprint: not captured.
- `hunt_payplus_callback_accept_paid`: disabled.
- callback control owner-approved: false.
- source PayPlus proof contract remains `HOLD`.

No provider status may be guessed. Real-money launch remains blocked until exact signed + ipn-full verified success/reject sandbox fingerprints are reviewed and explicitly approved.

### Orders / tracking

- HUNT orders: 8 total.
- test orders: 8.
- non-test orders: 0.
- orders with tracking number: 0.
- order events: 8, all attached to test orders.
- payment events: 19, all prelaunch.
- non-prelaunch payment events: 0.

These rows are test/prelaunch evidence only and do not prove a live fulfillment path.

### Unit economics

- checks recorded: 3.
- verified Profit Gate PASS: 3.
- represented destinations among verified PASS checks: 1.

Economics logic is proven for the recorded sample, but broader destination/category evidence is still needed before paid acquisition or global real-money launch.

### Analytics

- current database contains 14,094 events whose event_type begins with `hunt_`.
- manual gate remains `analytics_production = PARTIAL` because the exact Final Candidate has not been owner-approved and deployed to production, then verified end-to-end in production analytics.

### Merchant Program

- program versions: 1.
- active + owner-approved versions: 0.
- gate remains HOLD and does not block CJ-only soft-launch work.

## Current manual readiness gates

Manual evidence currently reports:
- PASS: 4
- PARTIAL: 5
- FAIL: 1
- HOLD: 1

Non-PASS gates:
- `analytics_production` — PARTIAL — blocks soft launch and real money.
- `deployment_sync` — FAIL — blocks soft launch and real money.
- `legal_policies` — PARTIAL — blocks soft launch and real money.
- `order_tracking` — PARTIAL — blocks real money.
- `payment_callback` — PARTIAL — blocks real money.
- `security_hardening` — PARTIAL — blocks real money.
- `merchant_marketplace` — HOLD — blocks neither.

## Current live Security Advisor

Observed 2026-09-20:
- 8 public-schema SECURITY DEFINER functions callable by authenticated users are WARN findings.
- leaked-password protection is disabled (WARN).
- 2 F60T private/control tables have RLS enabled with no policies (INFO).

Final Candidate migration `20260920094955_move_security_definers_to_boom_internal.sql` is specifically designed to replace the 8 exposed SECURITY DEFINER implementations with SECURITY INVOKER public wrappers and move privileged implementations into `boom_internal`. It is not yet deployed.

Final Candidate migration `20260920084547_harden_hunt_payment_order_grants.sql` removes direct anon/authenticated write privileges from payment/order/economics evidence tables and is also not yet deployed.

Leaked-password protection is an Auth configuration item and is not resolved merely by applying those SQL migrations.

## Launch decision boundary

**Source / Preview:** strong PASS evidence.

**Soft Launch:** BLOCKED until at minimum deployment sync, legal/business identity and exact-candidate production analytics gates are PASS.

**Real Money:** additionally BLOCKED by PayPlus exact callback proof, real order/tracking proof and security hardening.

**Production deploy / DB migration:** Owner approval required before execution.
