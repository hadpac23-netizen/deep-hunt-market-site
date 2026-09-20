# HUNT 4.2.1 — CLEAN CITY QUALITY GATE

## Mission
Refine HUNT 4.2 without redesigning the shopping foundation.

## Brand
- HUNT remains the only public consumer wordmark.
- Remove any secondary transcription, "BOOM · LIVING WORLD" mark, branch copy, or decorative text that visually competes with the HUNT logo in the hero zone.
- Preserve the H-U-N-T letter entrance only if it remains clean and readable.

## Hero
- Hero is cinematic but visually calm.
- No promo/ad card inside the hero.
- No sky-only, mountain, landscape-only, or person-led scenes.
- Only beautiful premium city-at-night scenes.

## Approved city pool
- Dubai
- Hong Kong
- New York
- Paris
- Madrid
- London
- Singapore
- Seoul
- Shanghai
- Tokyo

## Quality Gate
- Use high-resolution city photography only.
- Request optimized 2400px Pexels derivatives.
- Preload current/next scene only.
- Reject any scene whose loaded intrinsic resolution is below 1800px wide or 900px high.
- If an image fails, skip it and continue to the next approved city.
- Never keep a weak image merely to preserve scene count.
- Use dual image buffers with opacity crossfade and restrained cinematic pan.
- No low-resolution background video.
- Scene changes must remain smooth on mobile and desktop.

## Country priority
Country may influence which city appears first, but must never affect catalog access.
- MENA -> Dubai
- HK -> Hong Kong
- US/CA/MX -> New York
- FR/BE/CH -> Paris
- ES/PT -> Madrid
- GB/IE -> London
- SG/MY -> Singapore
- KR -> Seoul
- CN/TW -> Shanghai
- JP -> Tokyo

## Below-fold BOOM Lifestyle Stream
- Remove promo UI from the top hero.
- Place personalized lifestyle discovery below the hero and department bar.
- The stream starts only when the user scrolls it into view.
- Preserve personalized queue, real catalog only, 8–12 moments when inventory permits.
- Keep stack navigation, previous/next, close, session dismiss and language support.
- Strong motion is allowed only inside this below-fold zone.
- Never block navigation, search, product content or mobile bottom navigation.

## Scroll behavior
- Hero keeps a subtle localized "Discover" cue.
- Scrolling into the lifestyle stream triggers the first dynamic recommendation.
- Leaving the stream pauses automatic promo rotation.
- Returning may resume unless dismissed.

## Performance
- No 4K original downloads.
- No SD/low-quality background videos.
- Max background request width 2400px.
- One visual transition at a time.
- Use CSS opacity/transform only.
- Pause/reduce motion for prefers-reduced-motion.
- No layout shift.
- Zero horizontal overflow.

## Truth
No fake discount, scarcity, popularity, review, stock, shipping or sponsored claim.

## QA
Test 390 / 768 / 1280 / 1440:
- no competing text behind HUNT
- no promo inside hero
- only approved city-night scenes
- quality gate present
- current city transitions
- country-priority first city
- promo does not start before below-fold zone is visible
- promo starts when zone enters viewport
- personalization preserved
- EN/HE/AR/ES/FR/JA/ZH preserved
- zero overflow
- no payment/order activation
