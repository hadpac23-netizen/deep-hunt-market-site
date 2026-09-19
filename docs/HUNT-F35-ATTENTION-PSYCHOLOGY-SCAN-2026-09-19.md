# HUNT F35 — Attention Psychology Scan

## Objective
Improve visual attention, orientation, comprehension and trust without manipulating users.

## Research-backed design principles
1. **Current scope must stay visible.**
   Users should know where they are in the information architecture while scrolling.
   HUNT uses a live current-floor state in the sticky building navigation.

2. **Chunk complexity.**
   Large category sets are divided into meaningful groups instead of appearing as one undifferentiated wall.
   HUNT groups the 13 departments into Style, Living, and Tech & Play.

3. **Price is primary decision information.**
   Product cards use the visual sequence Image -> Title -> Price.
   Price is not hidden, muted excessively, or separated from the product.

4. **One attention job per floor.**
   Department floors sell the department.
   Market Hall handles broad discovery.
   Advertising stays on its own floor.
   AI Discovery and AI Media have separate roles.
   Penthouse is the calm premium ending.

5. **Visual pauses reduce fatigue.**
   Zone boundaries introduce extra breathing room between Departments, Market and Intelligence rather than adding decorative content.

6. **Controls must be easy to acquire visually and physically.**
   Navigation targets have deliberate minimum height and visible focus indicators.

7. **Breadth before dominance.**
   Homepage exposure remains balanced across departments so users can infer the true catalog range.

## F35 attention zones
- Discover
- Departments
- Market
- Intelligence

The zones are not additional content. They are a perceptual hierarchy over the existing building.

## Explicitly prohibited
HUNT must not use:
- fake scarcity or countdowns;
- fake popularity or fabricated review/social proof;
- guilt, shame, fear or pressure copy;
- hidden costs or visually suppressed price information;
- obstructive cancellation/returns flows;
- forced continuity, deceptive defaults, or disguised ads;
- attention traps designed only to prolong sessions.

## Definition of success
The user can:
- understand where they are;
- understand what the current floor is for;
- scan product cards without hunting for price;
- distinguish advertising from shopping content;
- move through the building without accidental taps or visual overload;
- leave, compare, or continue without pressure.

## Runtime implementation
- `hunt-attention-architecture.js`: live floor/zone orientation.
- `hunt-attention-architecture.css`: hierarchy, focus, menu chunks, breathing rhythm.
- `hunt-home-3.js`: grouped mega-menu.
- Existing `HuntVisualOrderGuard` remains the structural safety layer.


## Attention Guard
A second runtime guard now protects the psychology layer itself.

It audits:
- pointer target size for visible navigation controls;
- exactly one current floor/scope;
- title -> price card hierarchy;
- mega-menu chunking into three clusters with no cluster above five departments;
- salience budget so product grids do not accumulate too many competing labels.

The guard reports through `body[data-hunt-attention-guard]` and dispatches `hunt:attention-audit`.
This is separate from the structural Visual Order Guard: one protects building structure, the other protects perceptual clarity.
