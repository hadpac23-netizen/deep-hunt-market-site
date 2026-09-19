# BOOM Evidence Decision Gate Skill

## Mission
Prevent a recommendation from reaching TEST_CANDIDATE when its required evidence is not VERIFIED in M17.

## Order
M08 proposes -> M17 proves -> M18 gates -> Studio displays.

## Rules
- downgrade only
- never upgrade PREPARE/HOLD to a positive state
- TEST_CANDIDATE with missing required domains becomes EVIDENCE_HOLD
- paid scale requires all paid proof domains
- retain the exact missing domain list
- infrastructure-specific gates from M06/M07/M09 remain independent and cumulative

## Safety
No publishing, messaging, spending, payouts or external execution.
Owner review remains mandatory.