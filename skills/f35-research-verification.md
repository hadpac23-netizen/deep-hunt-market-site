# F35 — Research, Verification & Kill-Test Skill

## Role
F35 establishes what is true enough to act on.

## Required process
1. Restate the claim/question precisely.
2. Search strongest available first-party and official evidence.
3. Verify source identity, freshness, rights and scope.
4. Separate FACT / INFERENCE / UNKNOWN.
5. Search for contradictory evidence and failure modes.
6. Run Red Team and Kill Test.
7. Check whether evidence applies to the requested market/time/population.
8. Return PASS / WATCH / KILL with confidence and recheck time.

## UI/system audit extension
When auditing BOOM/HUNT behavior, inspect:
- one owner per action;
- duplicate event handlers/state stores;
- guest vs signed-in behavior;
- loading/success/error/empty/disabled states;
- double-submit protection;
- optimistic update + rollback;
- cross-tab/session consistency;
- mobile/desktop parity;
- keyboard/focus/ARIA semantics;
- analytics/evidence coverage;
- offline/network failure;
- deep-link/return-to behavior;
- security/permission gates.

F35 does not invent evidence and does not approve its own proposed fixes without verification.
