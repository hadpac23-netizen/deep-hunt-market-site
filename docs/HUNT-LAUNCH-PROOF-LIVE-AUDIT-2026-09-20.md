# HUNT Launch Proof — Live Read-Only Audit

Date: 2026-09-20  
Target: Supabase `boom-social-world` + Netlify `deep-hunt-market`  
Mode: **READ-ONLY / NO LIVE ACTIVATION**

## Executive state

The consolidated HUNT candidate is technically strong and passes local customer-journey QA, but the live launch gates are intentionally still closed.

No real payment was enabled.  
No live supplier order was created.  
No production deployment was changed.

## Candidate / Preview evidence

Final Candidate PR: **#20**

Local final preview matrix: **PASS**
- 1440 × 1000
- 1280 × 800
- 768 × 1024
- 390 × 844

Covered:
- Home / Hero
- Category
- Search / AI Find
- Product / Decision Check
- exact variant / stock verification
- Cart
- Checkout

Desktop and mobile Product → Cart → Checkout passed.
Payment remained disabled.

Netlify production remains on the pre-existing ready deploy; manual draft attempts were canceled after Netlify CLI stalled during CDN diffing.

## Live migration state

Live Supabase migration head:

`20260919193323_f60t_official_rss_source_contract`

Final Candidate contains four later migrations that are **source-ready but unapplied**:

1. `20260920071959_partner_evidence_freshness.sql`
2. `20260920084547_harden_hunt_payment_order_grants.sql`
3. `20260920094955_move_security_definers_to_boom_internal.sql`
4. `20260920095538_add_hunt_legal_registry.sql`

Source proofs:
- Partner Evidence: PASS
- Payment DB Security: PASS
- SECURITY DEFINER Isolation: PASS
- Legal Readiness: PASS

Live application of these migrations still requires explicit Owner approval.

## Business Identity

Live row: `primary`

State:
- status: `draft`
- owner_approved: `false`
- registered country: present
- legal entity name: missing
- registration number: missing
- business address: missing
- support email: missing
- returns address: missing
- privacy contact email: missing

This blocks Legal Readiness.

No value should be inferred or fabricated.

## Legal Registry

Live database currently has **no legal-document registry table**.

The source migration will create:

`hunt_legal_document_versions`

It intentionally inserts no Terms / Privacy / Returns / Shipping text.

Even after the registry migration, launch remains blocked until owner/counsel-supplied documents are reviewed, owner-approved and published.

## Payment gates

Runtime controls:

- `hunt_payment_live` = OFF / owner_approved=false
- `hunt_payplus_callback_accept_paid` = OFF / owner_approved=false
- `hunt_supplier_order_live` = OFF / owner_approved=false
- `hunt_supplier_order_sandbox` = ON / owner_approved=true

All real-money / real-supplier paths remain fail-closed.

### PayPlus proof

`hunt_payplus_status_observations` currently contains **zero observations**.

Therefore there is no signed, IPN-full-verified sandbox success fingerprint and no signed reject fingerprint.

PayPlus callback acceptance must remain OFF.

### Payment routes

Current route rows:
- PayPlus Card — planned
- PayPlus Apple Pay — planned
- PayPlus Google Pay — planned
- PayPal — planned
- Apple Pay via PayPal — planned
- Google Pay via PayPal — planned

No route is approved.
No buyer-country activation is populated.
No currency activation is populated.

## Payment / Order data

Current data is prelaunch/test only:

- 23 payment sessions: mode=prelaunch / status=prelaunch
- 19 PayPlus events: `prelaunch_session_created`
- 8 HUNT sandbox orders
  - 4 processing
  - 4 exception
- all 8 orders are `is_test=true`
- order source: `supplier_sandbox`
- no real tracking numbers

No live customer order was observed.

## CJ supplier sandbox evidence

Pipeline runs:
- 1 dry_run → PASS / validated
- 2 sandbox → HOLD / supplier_created

Both sandbox HOLD runs failed with CJ transient error:

`CJ_API_1603000_500: server busy / try again later`

The currently deployed `hunt-order-orchestrator` is v15 and now includes:
- transient CJ retry logic;
- up to 5 attempts;
- stable sandbox order number;
- reconciliation after ambiguous/network failures;
- duplicate reconciliation;
- fail-closed live supplier gate.

A fresh CJ sandbox order should only be run after explicit Owner approval for that sandbox test.

## Security Advisor

Current findings:

### WARN
- 8 public SECURITY DEFINER functions callable by authenticated users.
- leaked-password protection disabled.

### INFO
- `f60t_cron_auth`: RLS enabled, no policies.
- `f60t_oauth_states`: RLS enabled, no policies.

The Final Candidate already contains the SECURITY DEFINER isolation migration that:
- moves privileged implementations to `boom_internal`;
- preserves public RPC signatures as SECURITY INVOKER wrappers;
- preserves auth.uid(), ownership and admin checks;
- revokes anon access;
- includes fail-closed post-migration assertions.

Source test: PASS.

Leaked-password protection is a separate live Auth setting and is not changed by SQL migrations.

## Launch Readiness live evidence

Current real blockers:

### Blocks soft launch
- legal_policies = PARTIAL
- analytics_production = PARTIAL
- deployment_sync = FAIL

### Blocks real money
- legal_policies = PARTIAL
- payment_callback = PARTIAL
- order_tracking = PARTIAL
- security_hardening = PARTIAL
- analytics_production = PARTIAL
- deployment_sync = FAIL

Checkout Shipping Chess and catalog structure are already PASS.

## Remaining sequence

1. Owner decides whether to authorize the four live Supabase migrations.
2. Supply the real HUNT operating Business Identity fields.
3. Prepare/review/publish Terms, Privacy, Returns and Shipping documents.
4. Enable leaked-password protection through an explicit live Auth configuration action.
5. Obtain real PayPlus sandbox success + reject callbacks and approve exact fingerprints.
6. Run one explicit CJ sandbox E2E test on orchestrator v15.
7. Verify supplier order ID + sandbox tracking.
8. Obtain owner-approved Netlify candidate preview / deployment.
9. Verify production analytics only after approved deployment.
10. Only after all gates pass: separately consider live payment and live supplier-order activation.

## Hard boundary

Passing source tests or migrations does **not** authorize:
- production deploy;
- live payment;
- paid callback acceptance;
- real supplier order;
- merchant activation.

Those remain separate Owner Gates.
