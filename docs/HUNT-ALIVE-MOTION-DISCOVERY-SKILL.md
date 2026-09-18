# HUNT Alive Motion & Discovery Skill

## Design principle
HUNT should feel alive because the system responds intelligently, not because everything moves.

## Signature motion grammar
- Drop: 550–800ms, stagger 70–100ms.
- Glass sweep: starts only after the final letter settles.
- Spark: appears after the sweep reaches the T.
- Rest: calm. Rare sparkle is allowed; looping letter drops are not.
- Use cubic-bezier easing with a soft overshoot, never bounce.

## Discovery grammar
- Change one editorial composition at a time.
- Prefer bento/editorial layout on desktop and snap rail on mobile.
- Auto change at 9–12s only while in viewport.
- Hover/focus/touch pauses automatic change.
- User click wins over auto behavior.
- Each mode must explain itself through its label, not animation alone.

## Commerce truth
- FOR YOU requires preferences or first-party behavior, otherwise a balanced fallback is acceptable.
- NEW badge requires a real new-arrival signal.
- VERIFIED requires retail_price_verified=true AND profit_gate_status=PASS.
- Country chip requires HuntCountry.readiness(item)=verified_match.
- Do not write “Trending” until a real popularity metric exists.

## Performance checklist
- transform + opacity for repeated animation;
- no infinite card movement;
- no autoplay video inside discovery unless explicitly creative_approved;
- image loading=lazy;
- IntersectionObserver controls timers;
- prefers-reduced-motion has static equivalents.

## Red-team checklist
Reject an implementation if:
- HUNT shimmer obscures readability;
- star looks like an emoji or childish sticker;
- multiple sections animate simultaneously on loop;
- products move while a user is trying to tap;
- unverified price/shipping claims appear;
- mobile needs precision tapping to stop motion;
- animation causes horizontal overflow or layout shift.
