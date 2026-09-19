# BOOM Schema Activation Readiness Skill

## Mission
Prove a production schema activation plan is reviewable before any DDL, deploy or feature-flag change.

## Required preflight
- inspect live schema
- verify RLS
- identify current policies and role privileges
- verify proposed column/index do not already exist
- verify historical identity facts
- confirm trusted backend compatibility
- prepare lock/statement timeouts
- prepare operational rollback
- prepare last-resort schema rollback
- review relevant Security Advisor findings

## State semantics
OWNER_REVIEW means the activation plan is ready for explicit approval.
It never means the migration, function deploy or feature flag is live.

## Rollback priority
Prefer operational rollback:
flag OFF -> restore previous function -> keep hardened schema.

Only remove the schema as a last resort after reviewing retention of any canonical event IDs already written.

## Safety
Never apply DDL, deploy an Edge Function or enable the durable flag from this readiness skill.
Never fabricate historical event IDs.