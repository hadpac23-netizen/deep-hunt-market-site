# HUNT F35 — Decision Confidence & Browse Continuity

## Objective
Reduce uncertainty at the exact moments where shoppers decide whether to open a product, compare it mentally, continue browsing, or return to the list.

## Implemented

### 1. Product-list micro-facts
Home product cards expose at most two small verified facts:
- verified HUNT price;
- live/source option count when available;
- stock data loaded when no option count is available.

No ratings, popularity, delivery promises, discounts, or social proof are invented.

### 2. Product Decision Check
A compact Product Truth panel sits next to the buy area and reports:
- Price: Verified / Needs check;
- Options: live options or Not loaded;
- Availability: Quote verified / Signal verified / Recheck;
- Shipping: Destination recheck.

Direct Shipping and Returns links are kept next to the decision area without bloating the add-to-cart controls.

### 3. Browse Continuity
When a shopper opens a product from Home, Category, or Search, HUNT stores:
- scroll position;
- exact product URL;
- product viewport offset;
- current building floor.

On browser Back, HUNT first resolves the same product inside the original floor, then restores its viewport position across late layout reflow. A short, non-animated visual outline marks the returned card so the eye can reacquire it immediately.

### 4. PWA freshness
The shell cache is bumped to pwa3 and includes the F35 decision-confidence and continuity runtimes to prevent returning users from receiving stale behavior.

## Guardrails
- No fake urgency or scarcity.
- No fabricated ratings, popularity, inventory, discounts, or delivery claims.
- Shipping remains a destination recheck until verified.
- Product-specific return eligibility is not claimed from the general returns policy.
- Native browser history behavior is preserved; HUNT does not globally force manual scroll restoration.
- Reduced-motion preferences are respected.

## QA evidence
- Static Decision Confidence contract: PASS.
- Full HUNT regression suite: required before commit.
- Decision Check fallback path: verified price + unknown variants + verified availability signal + shipping recheck rendered correctly.
- Product mobile 390px: no horizontal overflow.
- Browse Continuity: same Tech floor and same product anchor restored; saved viewport offset verified.
