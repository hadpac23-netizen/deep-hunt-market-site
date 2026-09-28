---
name: hunt-control
description: This skill should be used whenever changing an approved HUNT view, flow, file, branch, architecture, or production behavior. It prevents design drift, destructive edits, accidental deployment, and loss of approved baselines.
---

# HUNT Control / Anti-Drift

1. Identify the last approved baseline and its file/commit.
2. Treat that baseline as immutable unless Owner explicitly says to replace it.
3. Put design/UX experiments in a new file or branch.
4. Preserve an explicit rollback target.
5. Change only the requested surface.
6. Do not “improve” adjacent areas without a direct requirement.
7. Preserve Production OFF, Payment Live OFF, Supplier Live Order OFF unless Owner explicitly authorizes a change.
8. Never equate Preview PASS with Production approval.
9. If Owner rejects an interpretation, return to the approved baseline before trying a new direction.

11. Verify route closure for every experiment: brand/home/category/product/recommendation/mobile links must stay inside the same experiment family unless explicitly requested.
12. Current Cinematic public brand lockup is HUNT only; do not regress to HUNT DEAL in the primary header.

10. Before handoff, report:
   - baseline preserved?
   - experiment file/branch
   - changed surfaces
   - unchanged protected surfaces
   - validation performed
