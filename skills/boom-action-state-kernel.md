# BOOM Action & State Kernel

## Mission
Provide one behavior contract for every button, toggle, form, like, save, cart action, search/filter action, modal trigger and preference change across HUNT/BOOM.

## Universal state machine
idle -> pending -> success
idle/pending -> blocked
pending -> error -> retry OR rollback

## Required behavior
Every action declares:
- canonical action_id
- one owner
- auth policy
- persistence target
- optimistic or pessimistic mode
- duplicate-submit guard
- validation
- analytics event
- correlation_id
- accessibility semantics
- success feedback
- failure feedback
- rollback/retry policy
- guest-to-account merge policy if stateful

## UI invariants
- A pending action cannot be submitted twice.
- Toggle truth is exposed semantically; use aria-pressed only when the visible label remains a stable toggle label.
- Disabled/blocked is visibly and semantically distinct.
- User input is not silently lost on network/auth errors.
- Desktop and mobile controls dispatch the same canonical action.
- A visual button never owns business truth; it dispatches to the action owner.
- All state-changing actions are observable.

## Integration target
Existing page-specific handlers should progressively become adapters that dispatch canonical actions instead of duplicating state logic.
