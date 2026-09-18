# HUNT Cinematic City Hero — Continuation Handoff

Updated: 2026-09-18

## Continue command

Use: `HUNT-CINEMATIC-CITY-HERO-CONTINUE`

## Owner-approved intent

- Replace the abstract Tokyo mood behind the home-page hero with real night-city photography.
- Tokyo must appear first.
- The white hero copy card must be translucent so the city remains visible behind it.
- After Tokyo, cities rotate like a slow cinematic film.
- Preserve the approved HUNT layout, text hierarchy, catalog, checkout, Supabase, pricing, product logic, and navigation.
- Do not publish to production without owner approval after visual preview.

## Current implementation

Repository: `hadpac23-netizen/deep-hunt-market-site`

Source baseline branch: `feature/boom-brand-factory-v1`

Implementation branch: `feature/hunt-cinematic-city-hero`

Pull request: https://github.com/hadpac23-netizen/deep-hunt-market-site/pull/8

Latest verified implementation commit: `b2de03a14a801b3e542aa10055f0a0fa1b94ee08`

Files added:

- `hunt-city-hero.css`
- `hunt-city-hero.js`

File connected:

- `index.html`

## City sequence

1. Tokyo, Japan — approved Pexels Tokyo Tower night image, opens first.
2. Paris, France.
3. Shenzhen, China.
4. Dubai, UAE.
5. Singapore / Marina Bay.
6. Seoul, South Korea.
7. New York, USA.

## Motion and UX rules

- Full hero background, not only the right side.
- Two-frame crossfade system.
- Change approximately every 7.8 seconds.
- Slow camera push/zoom.
- Preload the next image.
- Pause timer while the browser tab is hidden.
- Show the current city in a small bottom-right badge.
- Mobile-specific transparency and positioning.
- Dark-theme treatment.
- `prefers-reduced-motion` keeps Tokyo static and removes motion.
- Hero copy uses glass/translucent styling while keeping text readable.

## Verification completed

- JavaScript syntax check passed.
- CSS and JS asset links are present in `index.html`.
- Initial Tokyo and Paris remote image requests returned HTTP 200 / image JPEG during connectivity checks.
- A markup newline issue was found and fixed before handoff.
- No catalog, checkout, Supabase, product, or payment files were changed.

## Current blocker

Netlify CLI authentication callback was approved by the owner, but the Work runtime could not complete the callback because access to `api.netlify.com` was blocked by environment network policy. Netlify CLI still reports not logged in.

No production deployment occurred.

## Exact next steps

1. Create a non-production preview from `feature/hunt-cinematic-city-hero`.
2. Open the preview at desktop widths 1440 and 1280, tablet 768, and mobile 390.
3. Watch at least two complete rotations.
4. Confirm:
   - Tokyo loads first.
   - Every image covers the hero without blank flashes.
   - Text stays readable.
   - City badge matches the visible image.
   - No console errors.
   - Mobile crop is acceptable.
   - Reduced-motion leaves a stable background.
5. Replace any weak or incorrect city image before approval.
6. Show preview to owner.
7. Merge/publish only after explicit owner approval.

## Recovery note

If Work mode stops, return to any normal chat and send:

`HUNT-CINEMATIC-CITY-HERO-CONTINUE`

Then read this file and PR #8 before taking action.
