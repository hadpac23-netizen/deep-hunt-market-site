# HUNT DEAL Agent Operating Contract

This file defines the default operating rules for every coding agent working in this repository.

The goal is not to produce the largest change. The goal is to produce the smallest verified change that improves HUNT without weakening product truth, checkout safety, UX stability, or owner control.

## 1. Read before changing

Before editing code:

1. Read this file completely.
2. Inspect the current branch, working tree, recent commits, and the files directly involved.
3. Read any more-specific `AGENTS.md` found deeper in the directory tree; the nearest file wins for that scope.
4. Read relevant project docs, tests, schemas, API contracts, and configuration before making assumptions.
5. Identify the exact user-visible behavior to preserve and the exact behavior to change.
6. Do not claim a system, feature, API, table, route, or integration is missing until you have searched the repository and relevant configuration for it.

When uncertain, verify first. Do not invent project truth.

## 2. HUNT truth rules

HUNT is a commerce system. Commerce truth has priority over visual convenience.

Never invent or silently substitute:

- products
- supplier identity
- price
- discount
- stock
- shipping cost
- delivery estimate
- product images
- color/size availability
- variant mapping
- reviews
- ratings
- commissions
- profit
- order status
- tracking status

Supplier-controlled facts must come from an approved, authoritative source such as an official supplier API/feed or verified stored supplier data.

If a fact cannot be verified, represent it as unknown/unavailable rather than fabricating a value.

## 3. Product gallery and variant integrity

Product selection must resolve to a real supplier variant.

For gallery/variant work:

- Thumbnail selection must update the main image deterministically.
- Color/size selection must resolve the exact supplier variant whenever variant data exists.
- Prefer the selected variant's real `image_url` when the supplier provides one.
- Never invent a distinct image for a size or color that has no distinct supplier image.
- Do not preserve a stale main image after the resolved variant changes.
- Do not let UI state imply that a variant exists when the supplier data does not support it.
- Keep user selection, displayed image, displayed price, stock state, cart payload, and checkout payload consistent with the same resolved variant.

Any fix here requires regression testing for thumbnail click, color change, size change, variant change, cart add, and reopen/reselect behavior where applicable.

## 4. Checkout, pricing, and order safety

Checkout truth is a critical boundary.

Rules:

- Destination-sensitive pricing must remain destination-safe.
- Do not bypass country, shipping, stock, authentication, or account-binding gates.
- Do not enable real/live payment, capture funds, create binding supplier orders, or change production payment credentials unless the owner explicitly authorizes that action.
- Do not turn a dry-run, preview, quote, sandbox response, or mocked order into a production-success claim.
- Net-profit calculations must use verified inputs and clearly distinguish estimates from settled values.
- Preserve onsite-first checkout behavior unless a documented provider constraint requires a handoff.

When a change touches money, shipping, account ownership, or order creation, treat it as high-risk and require stronger verification.

## 5. Change discipline

Use the smallest correct patch.

Do not:

- redesign unrelated UI
- rename broad modules without need
- rewrite working code merely for style
- replace a working system with a parallel duplicate
- introduce fake fallback data to hide an API failure
- remove historical behavior without checking why it exists
- change public behavior outside the stated scope unless required for correctness

If a refactor is necessary to fix the root cause, explain why the smaller patch is unsafe or insufficient.

## 6. Incident & Repair protocol

For a defect, use this sequence:

**DETECT → REPRODUCE → ROOT CAUSE → MINIMAL PATCH → TARGETED TESTS → REGRESSION TESTS → INDEPENDENT REVIEW → OWNER GATE → DEPLOY → POST-DEPLOY VERIFY → LEARN/ROLLBACK**

Required behavior:

- Reproduce before patching when reasonably possible.
- Fix root cause, not only the visible symptom.
- Record what failed and what invariant should prevent recurrence.
- If verification fails, do not call the incident resolved.
- If a deployment regresses behavior, prefer a safe rollback over stacking speculative fixes.

Responsibility model:

- Experience: product page, gallery, interaction, visual state.
- Operations: checkout, shipping, authentication, order flow.
- Commerce Truth: price, stock, shipping, margin/profit truth.
- Learning Governance: incident evidence, regression coverage, rollback lessons.

## 7. Testing and evidence

A claim of PASS requires evidence.

For every material change:

1. Run the narrowest relevant tests first.
2. Run affected integration/regression tests next.
3. Check console/runtime errors for UI changes.
4. Verify at representative desktop and mobile widths when layout or interaction changes.
5. Distinguish:
   - PASS
   - FAIL
   - PARTIAL
   - BLOCKED
   - NOT TESTED
6. Never convert a pre-existing failure into a success claim. Label it accurately.

Do not say "fixed", "working", "production-ready", or "verified" unless the evidence supports that exact statement.

## 8. Security and privacy

- Never commit secrets, API keys, tokens, passwords, cookies, OTPs, private credentials, or customer personal data.
- Use environment variables and existing secret-management patterns.
- Preserve authorization boundaries and RLS/security controls.
- Do not weaken validation or access control to make tests pass.
- Treat logs/screenshots as potentially sensitive before committing them.

## 9. Git rules

- Work on a feature/fix branch unless explicitly instructed otherwise.
- Keep commits scoped and descriptive.
- Do not force-push shared history.
- Do not merge to `main`, deploy production, or delete branches as part of a coding task unless explicitly authorized.
- Prefer a Draft PR while verification or owner review is pending.
- Do not hide unrelated changes inside the same commit.

## 10. Owner Gate

The owner retains final approval over production-impacting decisions.

Owner approval is required before:

- production deploy
- enabling live payments
- changing payment or bank/provider routing
- placing real supplier orders
- sending binding commercial actions
- destructive data migrations
- deleting production data
- replacing a major architecture/system
- broad visual redesign
- merging high-risk changes when owner review was requested

Agents may prepare, test, simulate, draft, and recommend. They must not silently convert preparation into execution.

## 11. Completion report

At the end of a task, report only what is useful:

- What changed
- Root cause, if it was a bug
- Files changed
- Tests/evidence run and their result
- Remaining risks or blocked items
- Whether production changed
- Exact next owner decision, if any

Keep truth status precise. Evidence beats confidence.
