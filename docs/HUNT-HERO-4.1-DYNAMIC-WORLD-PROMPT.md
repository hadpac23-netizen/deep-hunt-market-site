# HUNT HERO 4.1 — DYNAMIC WORLD MASTER PROMPT

## Goal
Evolve the approved Urban Luxe Hero 4.0 into a living, country-aware and user-aware HUNT experience without breaking the stable commerce foundation.

## Non-negotiable principles
- HUNT is a store first. BOOM intelligence stays behind the experience.
- Keep search, categories, Like, Save, cart, checkout, profile and product routing predictable.
- Do not fabricate discounts, popularity, scarcity, stock, reviews, shipping or "new".
- Do not activate live payments or live supplier ordering.
- Production stays untouched until Owner approval.

## 1. Dynamic Cinematic World
The hero background must rotate through online cinematic city scenes.
Initial scene registry:
- Urban Luxe / city night
- Dubai
- Tokyo
- Paris

Architecture:
- two video buffers for seamless crossfade
- only one video plays at a time
- the inactive buffer may load only the next scene
- pause video when Hero leaves viewport
- reduced-motion users receive poster/frozen scenery
- each scene must have a verified source and poster fallback
- scene rotation is slow and calm, not a fast carousel
- provide a subtle manual scene control

Country / region preference:
- use HUNT destination market when available
- otherwise use browser locale only as a soft fallback
- MENA may begin with Dubai
- East Asia may begin with Tokyo
- Europe may begin with Paris
- all other markets begin with Urban Luxe
- this only changes presentation priority, never catalog access

## 2. Dynamic Promo Island
The former large Promo Surface becomes a compact floating island.

Behavior:
IDLE -> PEEK -> OPEN -> COLLAPSE -> HIDE

Rules:
- smaller than Hero 4.0
- positioned lower and near an edge
- never blocks headline, search, navigation or the main cinematic subject
- no blocking modal
- one promo at a time
- pause rotation on hover, focus or touch interaction
- manual previous / next
- close is remembered for the session
- content comes from real catalog + real signals
- future AI video ads plug into this island without redesigning the Hero

## 3. Scroll Discovery Cue
Add a small, animated but restrained cue at the bottom of Hero:
"Discover your HUNT" / "Discover more"
The cue scrolls into the shopping world below.
It must remain usable with reduced motion.

## 4. Personal HUNT Order
HUNT must change according to actual first-party behavior:
- category views
- product views
- Like
- Save
- cart
- searches
- verified purchases when available

Personalization may:
- change For You contents
- move the For You world earlier
- emphasize Beauty, Tech, Men, Women, Home, etc.
- reorder paired editorial worlds
- influence Promo Island content

Personalization must NOT:
- hide the full catalog
- create fake demand
- permanently trap the user in one category

## 5. Country-aware HUNT
Use stored destination market as the primary country signal.
Country awareness may affect:
- cinematic starting scene
- messaging
- product ordering where country readiness exists
- shipping-related information only when verified

Do not claim shipping availability from country alone.

## 6. Product Discovery Cue
Every product page must visibly communicate that discovery continues.
Add a subtle "Discover more for you ↓" cue leading to BOOM Endless Discovery.

## 7. Mobile
- Hero remains cinematic
- Promo Island becomes a compact lower edge island
- never cover bottom navigation
- search remains immediately available
- one dynamic surface at a time
- touch pauses automatic behavior

## 8. Performance
- use lightweight online derivatives, not original 4K downloads
- preload only current/next scene
- one active video at any time
- posters first
- no layout shift
- transform/opacity-only motion where possible
- keep product/catalog JS independent of cinematic scene loading

## 9. QA
Test 390x844, 768x1024, 1280x900, 1440x900.
Verify:
- scene rotation
- manual next scene
- only one video playing
- crossfade
- country scene priority
- Promo Island open/change/dismiss
- Promo Island does not obstruct mobile nav
- Scroll Discovery cue
- personalized section ordering
- Product Discover More cue
- Like/Save
- cart
- dark mode
- reduced motion
- zero horizontal overflow
- zero console errors
- no live payment/order activation

## Final feeling
HUNT should feel different every time for a reason:
different city, different edit, different product priority — while the shopping foundation remains stable and understandable.
