# BOOM × HUNT Automation Control Plane V1

## Decision
BOOM Orchestrator remains the command authority. n8n is an execution/connector adapter only — a nervous system under the Control Plane, never a ninth brain.

## Canonical chain
OWNER → BOOM Orchestrator → Primary Brain → Automation Control Plane → Tool Gateway / Adapter → Evidence → Owner Gate (when material) → Execution → Analytics → Learning Governance.

## HUNT workflows
1. Supplier → Product Truth → Price/Shipping/Profit → Shelf candidate.
2. 17-department shelf audit with a planning target of 1,000 verified sellable products per department. Counts are evidence-driven only.
3. Incident & Repair: detect → reproduce → root cause → minimal patch → tests → independent review → Owner Gate → deploy candidate → verify/rollback.
4. Product → Creative → Visual QA → Owner Gate → Publish candidate.
5. Customer lifecycle: cart/order/tracking/support with identity, privacy and consent gates.
6. Analytics → Learning → proposed policy/skill change.

## n8n boundary
n8n may execute approved workflow steps, wait, retry bounded transient failures, and emit run events. It may not self-approve, become a source of truth, bypass BOOM Runtime, hold raw secrets in workflow JSON, perform privileged Supabase writes directly, activate payments, place supplier orders, publish externally, change prices, or deploy production without the required gate.

## Runtime identifiers
Every run carries mission_id, workflow_id, run_id and correlation_id. Every side effect needs idempotency, timeout, retry policy and an evidence trail.

## Current implementation state
This branch now includes architecture, BOOM Studio visibility, a fail-closed Tool Gateway, and an in-memory Shadow Run Engine. It does not connect n8n, change Supabase, enable external publishing, activate payments, order from suppliers, or deploy Production.

## Next implementation sequence
1. Durable Run Ledger + Approval Queue.
2. Tool Gateway allowlist and adapter tokens/secret references.
3. n8n adapter in SHADOW with one safe read-only workflow.
4. Shelf Coverage workflow using verified catalog evidence.
5. Incident workflow from runtime failures.
6. Creative workflow through A6 Visual QA + Owner Gate.
7. Customer lifecycle workflows after privacy/consent proof.
8. Analytics learning loop with evidence thresholds.
