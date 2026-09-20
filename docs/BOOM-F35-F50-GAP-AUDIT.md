# BOOM F35 + F50 Gap Audit — Brain OS v1

## Scope
Reviewed the current HUNT/BOOM interaction code, existing brain skills, shared state patterns and the new Brain/Action/Surface contracts.

## F35 — verified structural findings

### 1. State ownership was fragmented
Cart, auth/session, likes/saves and page-level actions are implemented in separate files. This can create inconsistent behavior across surfaces unless ownership is explicit.

### 2. Multiple Supabase auth clients existed
auth.js, profile.js, shopping-actions.js and account-presence.js each constructed clients. Brain OS v1 begins migration to one shared runtime client per page.

### 3. Interaction coverage was not mechanically enforceable
The code had many direct click/change/submit listeners but no canonical inventory. Brain OS v1 now maps 56 explicit handlers/controls to canonical action IDs.

### 4. Surface runtime requirements were implicit
Different pages load different combinations of core/auth/actions/analytics/theme/i18n. A Surface Contract now defines the target runtime per surface.

### 5. Action states were not universal
Some flows already handle pending/error/rollback well, but the contract was not shared by every control. The Action & State Kernel standardizes idle/pending/success/error/blocked, duplicate-submit guard and recovery.

### 6. Cross-tab app-state invalidation was not first-class
Like/save state can diverge across open tabs. Brain OS v1 adds a same-origin runtime broadcast bus and begins with like/save invalidation.

## F50 — missing layers worth adding

### A. Shadow Mode for brains
New/changed brains should be able to observe and recommend without changing behavior. Promote SHADOW -> ACTIVE only after evals.

### B. Brain Circuit Breaker
If a brain exceeds error/conflict thresholds or loses evidence freshness, Orchestrator should demote it to SHADOW/OFF automatically and surface a blocker.

### C. Contract-generated QA
Generate tests from:
- Brain Registry
- Action Contract
- Interaction Inventory
- Surface Contract
This turns architecture into executable checks rather than documentation.

### D. Action Trace Viewer in BOOM Studio
For a selected action show:
UI control -> action_id -> owner -> state -> API/function -> evidence/result -> analytics -> learning.

### E. Journey Graph
Model critical journeys as graphs:
search -> product -> variant -> like/save -> cart -> quote -> checkout
and
guest -> actions -> sign in -> merge -> profile
Run parity checks across desktop/mobile and tabs.

### F. Guest-to-account Merge Matrix
Likes/saves are already merged. Define conflict rules for cart, preferences, language/theme, survey and permitted history.

### G. Global Feedback Center
One consistent non-intrusive feedback primitive for pending/success/error/blocked. Avoid each page inventing its own status behavior.

### H. Error Taxonomy
Stable error codes with user-safe copy and recovery actions. Do not rely on arbitrary prose exceptions.

### I. Storage Schema Versioning
Local/session storage keys need version/migration contracts so future changes do not silently corrupt state.

### J. Decision Confidence Decay
Research, supplier, shipping, stock and market decisions should lose confidence over time and automatically trigger recheck.

### K. Mission Budgets
Orchestrator should track budgets for money, API calls, deploy credits, execution attempts and time/risk. The Netlify credit incident is an example of why resource budgets belong in orchestration.

### L. Explainability
For material ranking/action decisions store short reason codes so BOOM Studio can answer: why did this brain choose this?

## External implementation references checked
- WAI-ARIA APG: buttons/toggles require correct semantic state; focus behavior depends on the action.
- Supabase Auth: onAuthStateChange provides session lifecycle events.
- MDN BroadcastChannel: same-origin contexts can synchronize app-level invalidation, including login/logout-related UI refresh.

## Recommended rollout
1. Contracts + registry + tests — DONE on feature branch.
2. Shared runtime/client + like/save cross-tab invalidation — STAGED on feature branch.
3. Migrate auth/profile/cart/search/filter to runtime actions.
4. Add Guest Merge Matrix + error taxonomy.
5. Add journey tests and action trace viewer.
6. Run SHADOW evals.
7. Owner review.
8. Merge/deploy only when hosting is available and QA passes.
