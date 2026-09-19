# Netlify Credit Guard

## Why this exists
The team Free credit allowance was exhausted in the 2026-09-09 billing cycle by 20 successful production deploys.

Netlify credit model used by this policy:
- Production deploy: 15 credits.
- Branch deploy / Deploy Preview: 0 credits.
- Production is therefore an explicit release action, not a normal QA step.

## Rules
1. QA, visual review, F35/F50/F60/F60T review, experiments and owner review use Preview/Branch deploys only.
2. Never run `netlify deploy --prod` directly during development.
3. Production deploys require:
   - clean git worktree;
   - commit already present on `main`;
   - explicit owner approval for that release;
   - environment variable `HUNT_OWNER_PROD_APPROVED=YES`;
   - use of `scripts/netlify-production-deploy.sh`.
4. One approved release should combine all passed changes whenever practical.
5. Preview failures never trigger a production retry.
6. Production deploys should be logged with commit SHA and release reason.
7. The preferred long-term setup is Git-connected Netlify with `main` as the production branch; manual production deploys should then be disabled.

## Owner Gate
No agent, script or automation may publish to Netlify production merely because tests pass.
QA PASS means “eligible for owner review”, not “authorized to publish”.
