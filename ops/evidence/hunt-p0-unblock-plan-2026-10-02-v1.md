# HUNT P0 Unblock Plan — 2026-10-02 v1

This document is an execution map only. It does not authorize Production deploy, live payment, live supplier ordering, Profit Release, merge, or freshness scheduling.

## Safety baseline

- Payment Live: OFF
- Supplier Live Order: OFF
- Profit Release: OFF
- PayPlus paid acceptance: OFF
- PR26: Draft / open / unmerged
- No Production deploy without explicit Owner Gate

## P0-1 Destination Tax / COO / Final Profit

Current state:
- TAX8 destination-tax exceptions remain open.
- Final Profit remains unverified.
- Final Profit code now requires exact-variant COO + destination-specific landed-cost/tax-duty evidence.
- EPROLO public exact pages provide material/product detail for several TAX8 items but no verified COO in the retrieved evidence.
- Supplier `taxesFee` alone is not accepted as final customs truth.

Next safe action:
1. Obtain exact item/variant Country of Origin evidence from EPROLO/support/API documentation.
2. Bind COO evidence to the exact EPROLO item/variant.
3. Run Zonos/authoritative landed-cost Shadow calculation per destination.
4. Re-run Profit Gate using current destination shipping and a market-credible retail target.

Owner/external dependency:
- EPROLO response or authoritative supplier-origin field.
- No guessing COO/HS from product title, supplier location, or taxonomy.

## P0-2 PayPlus Sandbox E2E

Current state:
- Code/auth/callback/status verification: CODE_PASS.
- Staging base and callback/IPN-full contract verified.
- Sandbox status observations: 0.
- Payment Live and paid acceptance remain OFF.

Required evidence:
1. PayPlus staging `api-key`.
2. PayPlus staging `secret-key`.
3. Staging `payment_page_uid`.
4. Owner-approved sandbox-evidence control/token.
5. One sandbox payment flow proving signed callback + server-side `ipn-full`.
6. Duplicate callback/idempotency proof.
7. Failed-payment proof.
8. Paid candidate transition remains isolated from live paid acceptance.

Owner/external dependency:
- Sandbox credentials/control approval.
- Do not enable Payment Live.

## P0-3 Supplier Fulfillment E2E

### EPROLO

Current state:
- Official `add_order.html` request contract is represented in Shadow V2.
- PII is redacted in evidence.
- Request shape fails closed on missing `tax_cost`, province code and exact Product-Detail/order-variant provenance.
- No supplier mutation has been executed.

Required evidence before any supplier submission:
1. Exact order-variant namespace/provenance.
2. Verified tax cost.
3. Province code where required.
4. Complete official request shape.
5. Safe non-billable/sandbox execution path confirmed by EPROLO.
6. Order Query → tracking lifecycle proof.

### CJ

Current state:
- Sandbox control is enabled/Owner-approved; Live remains OFF.
- Existing failed sandbox attempts are recoverable and below retry ceiling.
- Prior failure was CJ transient `1603000 server busy`.
- Retry + reconciliation logic exists and avoids duplicate creation.
- Tracking/shipped proof remains 0.

Required evidence:
1. Valid authenticated Admin sandbox session.
2. Safe sandbox re-run through the existing state machine.
3. Supplier order ID proof.
4. Tracking proof.
5. Shipped lifecycle proof.

Do not bypass Admin authentication.

## P0-4 Freshness Runtime Proof

Current state:
- Race fix is CODE_PASS.
- No live freshness cron/rotation proof.

Owner-Gated execution only:
1. Deploy exact reviewed freshness runner/watcher sources.
2. Configure only required secrets.
3. Enable approved Shadow schedule only.
4. Prove two complete rotations.
5. Prove stale/failure detection.
6. Prove recovery and exception reconciliation.
7. Keep all commerce kill-switches OFF during proof.

## P0-5 Runtime / Pooler Proof

Current state:
- Branch code removes several legacy raw-Postgres dependencies, but final live runtime parity/load proof is not complete for all reviewed changes.

Owner-Gated execution only:
1. Pin exact PR26 deploy SHA.
2. Record current runtime versions and rollback target.
3. Deploy only reviewed runtime functions required for the proof.
4. Run bounded concurrency/load canary.
5. Verify no connection storm, auth regression, timeout spike or stale-source fallback.
6. Roll back immediately on regression.

No Production traffic change beyond the explicitly approved canary.

## P0-6 Legal Real-Money Disclosures

Current state:
- Operating entity fields are verified privately.
- Support/privacy contacts complete.
- Owner-approved returns workflow complete.
- Four prelaunch policy pages verified.
- Universal public returns address is not assumed or invented.

Still required before paid checkout:
1. Registered business-address disclosure where legally required.
2. Active-market transaction disclosures reflecting actual payment, shipping, tax and fulfillment behavior.
3. Final Owner review of the real-money publication state.

Do not commit private identity values to the public repository merely to close a checklist.

## P0-7 Git Governance Verification

Current state:
- Repository rulesets observed: 0.
- Current integration cannot read classic branch protection; result is permission-limited.
- Status is `UNVERIFIED_PERMISSION_LIMIT`, not protected and not unprotected.

Required proof:
1. Read `main` classic branch-protection state using an account/integration with Administration read permission, or inspect it directly in repository Settings.
2. Verify required status checks and force-push/deletion policy.
3. Any governance mutation requires Owner Gate.

## Non-blocking hardening

### Supabase leaked-password protection
- Advisor warning remains open.
- HUNT customer auth currently uses Magic Link/OAuth/Google ID Token only; no password-auth path is present in HUNT code.
- Keep this as project security hardening and reclassify to launch-blocking immediately if password auth is introduced.

### Strict supplier network anonymity
- Customer-visible supplier-name privacy is PASS.
- Technical users may still infer source from CDN/network/internal metadata.
- Full API/media proxying is post-launch hardening, not a current real-money blocker.

## Definition of P0 closure

HUNT is not `READY` and Red Team is not `CLOSED` until the launch blockers above have direct evidence and final explicit Owner Gate is given.
