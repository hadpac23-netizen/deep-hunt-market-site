# HUNT DEAL — Claude Code Project Instructions

Before any HUNT task, read:
1. `.claude/skills/hunt-router/SKILL.md`
2. `HUNT-MASTER-CONTROL-PROMPT.md`

The router decides which HUNT skills are mandatory for the task.

Core invariants:
- Approved baselines are immutable. Build experiments in new files/branches.
- Preserve Original Cinematic / Living Campaign architecture unless Owner explicitly changes it.
- Main Category -> Departments underneath -> Exact Shelf -> Product -> Variant.
- No cross-shelf filler. No duplicate product identity across visible sellable shelves.
- Production, Payment Live and Supplier Live Order remain OFF unless explicitly approved.
- Product Truth outranks visual completeness.
- When uncertain, HOLD rather than guess.
