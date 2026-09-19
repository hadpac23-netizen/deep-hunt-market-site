# BOOM M18 — Evidence Decision Gate — 2026-09-19

## Objective
Make M17 evidence operational by gating M08 Growth Agent recommendations before they appear as final Studio decisions.

## Architecture
M08 proposes.
M17 classifies evidence.
M18 applies proof requirements.
Studio displays the gated decision.

M18 never upgrades a lane or creates execution permission.

## Lane requirements
Owned tests require fresh product source truth, verified economics and experiment registry evidence.

External discovery tests require product source truth, business identity and experiment registry evidence.

Paid tests require product source truth, verified economics, canonical paid attribution and experiment registry evidence.

Lifecycle and Creator lanes require their observed evidence domains in addition to their own M06/M07 infrastructure gates.

Agentic tests require product source truth and business identity in addition to M09 capability gates.

## Behavior
A TEST_CANDIDATE with missing proof becomes EVIDENCE_HOLD.
A test-like primary move with missing proof becomes COLLECT_EVIDENCE / EVIDENCE_HOLD.
PREPARE and HOLD states are not upgraded.
Scale is forced false if paid evidence is incomplete.

## Safety
M18 is a downgrade-only decision layer.
It cannot publish, spend, send lifecycle messages, publish/pay creators or execute external actions.

## Invariants
EVIDENCE_GATE_APPLIED: true
RECOMMENDATIONS_ONLY: true
PAID_SPEND: false
EXTERNAL_PUBLISH: false
EXECUTE_ACTIONS: false
OWNER_GATE: REVIEW_REQUIRED