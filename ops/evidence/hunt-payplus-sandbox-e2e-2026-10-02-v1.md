# PayPlus Sandbox Red Team — 2026-10-02

Status: BLOCKED — EXTERNAL_BLOCKED on secure staging configuration, sandbox Owner control and provider transaction proof.

FOUND: deployed callback v16 still accepts GET and obtains identity from merged URL/body; branch is POST-only and signed-body-only. The branch also lacked an expiry check. Every verified callback currently returns accepted_paid=false; an exactly-once paid transition is not implemented/proven by this evidence path.
IMPACT: source/runtime drift, acceptance of stale callback evidence, and no completed Sandbox E2E. Current paid acceptance remains safely OFF.
FIX: branch now selects expires_at and rejects expired, missing/invalid-expiry or inactive sessions before ipn-full/evidence writes. Existing HMAC-SHA256, constant-time compare, signed-body identity and exact request/transaction/amount/currency/session checks remain.
TEST: PayPlus authentication/status/callback tests plus adversarial expiry-boundary/missing/invalid/cancelled session cases PASS locally. No external signed callback was fabricated or submitted.
STATUS: PARTIAL code validation; real sandbox E2E BLOCKED. Runtime callback was not deployed.

Fresh SQL: 33 sessions, 0 sandbox, 0 paid; 0 signature/ipn-full/accepted status observations. hunt_payplus_sandbox_evidence=false/unapproved. PAYPLUS-named credentials were not found in Vault; this does not prove absence from every runtime environment.

Exact next action: configure staging credentials securely outside chat and approve only the sandbox evidence control. Use an authenticated test session to obtain generateLink, complete a provider sandbox transaction, receive authentic signed POST callback and ipn-full reconciliation, then prove duplicate/forged/amount/currency/request/transaction/expired-session/withdrawal behavior. Add or validate a sandbox-only exactly-once transition ledger before declaring E2E PASS; the current always-hold callback cannot prove that transition. Live payment and live paid acceptance stay OFF.

Primary documentation: https://docs.payplus.co.il/reference/introduction (retrieved 2026-10-02). The complete live wire/signature/status contract must be verified from official Sandbox output before enabling acceptance.
