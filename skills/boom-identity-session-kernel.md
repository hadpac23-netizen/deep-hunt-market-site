# BOOM Identity & Session Kernel

## Mission
Maintain one account/session/permission truth everywhere in BOOM/HUNT.

## Responsibilities
- initial session resolution
- sign-in/sign-out/token refresh/user-update events
- account presence on every page
- protected/admin action gates
- return-to/deep-link after auth
- anonymous state merge into account
- cross-tab auth and preference synchronization
- session expiry/recovery
- profile identity presentation
- privacy-safe device/session identifiers

## Merge contract on sign-in
Define explicit merge rules for:
- likes/saves
- cart
- shopping preferences
- language/theme
- recent history when permitted
- survey state
Never overwrite stronger server truth silently.

## Cross-tab
Use the auth provider's session events as source of truth and a same-origin broadcast channel for app-level state invalidation when needed.

## Never
- create multiple independent auth clients with conflicting configuration when one shared client can serve the page;
- expose tokens in UI, URLs or logs;
- allow a protected action because the UI merely looks signed in.
