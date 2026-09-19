# BOOM Navigation & Flow Kernel

## Mission
Make navigation, deep links, back/forward, auth return-to, modal focus and mobile/desktop journeys deterministic.

## Contracts
- A link navigates; a button performs an action.
- Protected destinations preserve a safe same-origin return-to path.
- Back/forward does not corrupt cart/filter/action state.
- Opening a dialog moves focus inside; closing returns focus logically.
- Route changes move focus to the new primary context when appropriate.
- Mobile and desktop routes resolve to the same underlying destination/action.
- Broken/unknown routes have a safe fallback.

## Observability
Emit navigation.route with origin, destination, surface and correlation_id.
