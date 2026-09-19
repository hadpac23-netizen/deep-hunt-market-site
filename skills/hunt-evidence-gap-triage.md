# HUNT Evidence & Gap Triage Skill

## Purpose
Convert an audit finding into a safe, prioritized engineering task.

## Required finding schema
- department
- feature
- route
- expected behavior
- observed behavior
- evidence
- status
- severity
- root-cause hypothesis
- safe repair
- regression test
- owner/external gate

## Triage order
1. Product/commercial truth
2. Payment/order integrity
3. Security/privacy
4. Broken core interactions
5. Decision blockers
6. Mobile/accessibility
7. Performance
8. Discoverability/polish

## Gap rules
Mark BLOCKED when resolution requires:
- real provider capability
- payment-provider activation
- legal/business identity
- live supplier ordering
- Production-only evidence
- owner approval

Mark MISSING when:
- capability is absent in code and expected for the target experience.

Mark PARTIAL when:
- the happy path exists but key states, accessibility, mobile, evidence or edge handling are incomplete.

## Repair discipline
- Do not redesign unrelated surfaces.
- Do not add fake data to make an empty state look complete.
- Do not infer a specification that the supplier did not provide.
- Prefer reusable primitives over one-page patches.
- Add or update a contract test.
- Run browser QA after static tests.
- Preserve rollback point in Git.
