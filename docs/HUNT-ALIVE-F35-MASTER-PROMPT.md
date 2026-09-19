# HUNT ALIVE F35 — MASTER IMPLEMENTATION PROMPT

## Role
Principal Commerce Experience Architect + Motion Design Engineer + Frontend Performance Engineer.

## Mission
Make HUNT feel alive, premium, magnetic and current without becoming noisy. Motion must increase recognition, discovery and shopping clarity.

## Global brand signature
Every public `HUNT` brand mark uses one reusable sequence:
1. H → U → N → T drops from above with elegant stagger.
2. After all letters settle, one glass-like highlight sweeps across the full word.
3. Immediately after the glass sweep, a small four-point sparkle appears above the T.
4. The sparkle settles into a restrained idle state with only a rare micro-twinkle.
5. Reduced-motion users receive the static premium mark with no entrance animation.

The sequence must:
- feel like polished glass / luxury tech, not a game animation;
- run once on meaningful entry, not constantly;
- be consistent on Home, Product, Search, Category, Checkout, Profile, Legal and internal HUNT-branded pages;
- not block interaction or layout.

## Living commerce
HUNT must not be a static product wall.
Create a controlled discovery surface that changes modes rather than constantly moving individual products.

Supported modes:
- For You Now: explicit preferences + first-party behavior.
- Fresh Mix: verified new arrivals when available; otherwise clearly labeled rotation.
- Complete the Look: complementary category composition.
- Switch the Vibe: category-world exploration.
- Verified Picks: only visible when retail price is verified and Profit Gate is PASS.
- Ships to your market: only visible when explicit country evidence exists.

Never use:
- fake “trending” labels without popularity evidence;
- fake scarcity or countdowns;
- fake shipping;
- fake discounts;
- unverified retail price as consumer price.

## Motion hierarchy
1. Brand motion gets the strongest signature.
2. Section entry is subtle.
3. Product card hover is restrained.
4. Discovery-mode change uses staggered entry.
5. No multiple looping card animations.
6. Pause auto cycling on hover/focus and when offscreen.
7. Use transform/opacity only for recurring motion.

## Performance
- Respect prefers-reduced-motion.
- Stop timers offscreen.
- Lazy-load images.
- One discovery auto-cycle every ~10 seconds at most.
- Avoid continuous blur/filter animation.
- Avoid layout shift.
- Mobile uses horizontal snap rather than dense animated grids.

## Personalization
Use only:
- explicit Tune your HUNT choices;
- first-party views, likes, saves, searches and cart actions;
- account-synced preferences.
Never infer sensitive identity traits.

## Truth layer
Catalog Quality Gate runs before discovery.
Country Brain can rank or label only from evidence.
Verified commerce claims require their existing truth gates.

## QA acceptance
- HUNT signature sequence: drop → glass sweep → T star.
- Works on all .hd-brand marks.
- HUNT NOW renders real products.
- Mode switching works and pauses correctly.
- Verified/local modes remain hidden when evidence is insufficient.
- Like/Save decoration still works.
- HE/AR/EN/ES/FR/JA/ZH remain functional.
- 390 / 768 / 1280 / 1440: zero horizontal overflow.
- Reduced motion works.
- Payment and supplier live-order gates remain unchanged.
