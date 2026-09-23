# BOOM Decision Intelligence Fabric — Phase B Shadow Skill

## Role
BDIF is shared decision infrastructure beneath the existing BOOM Orchestrator and Primary Brains. It is not a Primary Brain and has no direct execution authority.

## Reuse first
- Truth ownership: Commerce Truth Brain + existing evidence freshness policy.
- Material approval: existing Owner Gate map.
- Model/tool routing: existing BOOM AI Tool Router and Tool Gateway.
- Run/evidence/learning storage: existing BOOM ledgers.
- Profit truth: existing Profit Engine and Product Profit Ledger.
- Learning governance: existing Learning Loop.
- Incident handling: existing Incident & Repair flow.

## Canonical decision loop
DATA -> VERIFY -> HARD POLICY -> SPECIALIST DECISION -> CONFIDENCE -> OPTIONAL MULTI-JUDGE -> OWNER GATE WHEN REQUIRED -> EXECUTION ELSEWHERE -> OUTCOME -> LEDGER -> LEARNING.

## Phase B boundaries
- SHADOW only.
- No Production deploy.
- No payment activation.
- No supplier order.
- No autonomous price change.
- No external publish.
- No schema migration unless existing ledger fields prove insufficient.
- UNKNOWN is valid and must fail closed for material execution.

## Contracts
- boom-bdif-decision-contract.json
- boom-bdif-truth-contract.json
- boom-bdif-policy-map.json
- boom-bdif-ledger-map.json
- boom-bdif-confidence-contract.json
- boom-bdif-model-router-map.json
- boom-bdif-multi-judge-contract.json
- boom-bdif-simulation-contract.json
- boom-bdif-eval-contract.json

## Runtime
boom-bdif-kernel.js is a pure, side-effect-free Shadow evaluator. It may normalize decisions, evaluate the initial HUNT Product Gate, compute calibration metrics, aggregate judges, check existing Owner Gate mappings and run supplied unit-economics sensitivity scenarios. It cannot call suppliers, payments, checkout, Supabase mutations or deployment tools.

## Graduation
No BDIF engine receives Production authority until the 1,000-product HUNT pilot is evaluated against the existing HUNT baseline and any material graduation passes Owner Gate.
