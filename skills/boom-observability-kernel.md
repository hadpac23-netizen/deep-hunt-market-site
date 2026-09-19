# BOOM Observability Kernel

## Mission
Make every important decision and action traceable without exposing secrets or unnecessary personal data.

## Event envelope
event_id
correlation_id
action_id
decision_id when relevant
surface
actor_mode guest/signed-in/admin/system
state pending/success/error/blocked
source
duration_ms
error_code
evidence_ref when safe
timestamp

## Rules
Never log access/refresh tokens, passwords, secrets, full payment data or unnecessary personal identifiers.
Use stable error codes, not only prose.
UI, Edge Function and downstream order/payment events should share correlation lineage.
Observability is evidence for Learning, not a second business-logic owner.
