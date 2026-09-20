# BOOM Brain Operating System v1

## Command chain
OWNER -> BOOM ORCHESTRATOR -> INTELLIGENCE (F60T/F35) -> F50 when needed -> F35 Kill Test -> COMMERCE TRUTH -> EXPERIENCE/GROWTH -> OPERATIONS -> OWNER GATE -> EXECUTION -> LEARNING/GOVERNANCE -> ORCHESTRATOR.

## Key architectural decision
BOOM has few primary brains. Smaller capabilities are skills/modules/control planes. A new "brain" is created only if it owns a distinct class of decisions that cannot live under an existing brain.

## Shared control planes
### Action & State Kernel
Owns interaction behavior: like/save/cart/search/filter/theme/language/buttons/forms and UI action states.

### Identity & Session Kernel
Owns session/account/permissions/guest merge and consistent signed-in state.

### Navigation & Flow Kernel
Owns route/deep-link/back/return-to/focus restoration and desktop/mobile parity.

### Design System Kernel
Owns visual states, responsive behavior, accessibility primitives, feedback and motion conventions.

### Observability Kernel
Owns normalized events, correlation IDs, errors, experiments and evidence.

## Current F35 findings
- Cart logic is duplicated across multiple files.
- Auth/account presentation is split across auth.js, profile.js and account-presence.js.
- Like/save has a strong implementation but remains a separate state island.
- Many page-level click handlers are independent instead of dispatching canonical actions.
- Cross-tab app-state synchronization is not a first-class contract.
- Pending/error/rollback semantics are not yet universal across all actions.

## F50 additions worth building
1. Action Registry + runtime dispatcher.
2. Shared App State invalidation channel across tabs.
3. Guest-to-account merge matrix beyond likes/saves.
4. Global feedback/status center for action success/error without noisy popups.
5. Action trace viewer inside BOOM Studio: action -> owner -> state -> API -> result -> analytics.
6. Contract tests that crawl interactive controls and fail when an action has no registry owner.
7. Journey graph that verifies the same action behaves consistently on home/category/product/profile/checkout/mobile.

## Rollout
Phase A: registry/contracts/skills/tests, no behavior change.
Phase B: shared identity client + action dispatcher.
Phase C: migrate likes/saves/cart/auth/search/filter page adapters.
Phase D: journey QA + accessibility + cross-tab tests.
Phase E: BOOM Studio visualization and live observability.
