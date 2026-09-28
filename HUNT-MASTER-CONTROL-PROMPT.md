# HUNT MASTER CONTROL PROMPT
## Anti-Mistake / No-Drift / Owner-Control

### Highest rule
When an HUNT view, flow, taxonomy, or behavior is approved, mark it BASELINE LOCKED.
Never edit an approved baseline directly for an experiment.
Create a new version/file/branch and preserve a rollback path.

### Storefront default: SIMPLE FIRST

#### LIVING CINEMATIC TAXONOMY MOTION
Taxonomy may feel alive like a cinematic control surface:
- Main Category rail can use slow film-light sweeps, breathing sapphire/gold ambience, restrained sparkle, and an active pulse.
- Department/Shelf rail can use slower teal/blue shimmer, secondary breathing light, and softer active glow.
- Motion must feel premium and film-like, never arcade-like.
- Main Categories remain visually stronger than Departments.
- Effects must not change layout dimensions, introduce horizontal motion/scroll, or reduce legibility.
- Honor prefers-reduced-motion and provide a static equivalent.

#### CATEGORY DISCOVERY BEFORE EXACT DEPARTMENT
When a shopper selects a Main Category and has not yet selected a Department/Shelf:
- never leave the product area empty;
- immediately render a randomized discovery mix drawn only from Departments/Shelves that belong to the selected Main Category;
- balance the mix across multiple child Departments where possible;
- every product card must preserve its exact source Department/Shelf route;
- never mix products from another Main Category;
- when the shopper selects a Department/Shelf, replace the discovery mix immediately with that exact Department/Shelf view only;
- changing back to a Main Category may generate a fresh in-category discovery mix;
- discovery mode is browsing convenience, not taxonomy reassignment.

#### ROW-LEVEL TAXONOMY HIERARCHY
The navigation must read instantly as two separate levels:
- top row = Main Categories, stronger sapphire/gold cinematic rail;
- second row = Departments/Shelves, slightly different luminous hue;
- both rails may have subtle ambient gleam;
- category rail remains visually stronger;
- user should know where to click before reading every label.

#### CINEMATIC TAXONOMY COLOR HIERARCHY
Keep taxonomy structurally simple but visually alive:
- Main Categories use the stronger HUNT cinematic sapphire/gold treatment.
- Departments/Shelves use a related but distinguishable secondary hue.
- Both layers may use subtle moving gleam/highlight on hover/active.
- Category emphasis must remain stronger than department emphasis.
- Decorative light must never reduce label contrast or readability.
- Do not turn taxonomy back into heavy cards or immersive scenes.

#### ZERO HORIZONTAL TAXONOMY
For normal HUNT browsing, Main Categories and the active category's Departments/Shelves MUST NOT require horizontal dragging, swipe-only discovery, arrows, carousels, scroll-snap, or hidden overflow.
Use a responsive reflowing matrix/grid:
- desktop: auto-fit as many compact text choices per row as fit;
- tablet: 3+ columns when readable;
- mobile: 2 columns minimum, vertical document flow;
- render every taxonomy choice visibly;
- prefer extra vertical height over hiding, clipping, or horizontal scrolling;
- selecting an item changes scope only; never force-scroll the document;
- Living Campaign remains cinematic below the taxonomy, not inside it.
WCAG reflow is the baseline: taxonomy must remain usable without two-dimensional scrolling.
For normal HUNT shopping navigation, **Simple First is the default and wins over decorative navigation ideas**.

Default sequence:
Main Categories -> Departments -> Living Campaign -> Exact Products -> Sort / Filters.

Required behavior:
- Main Categories stay immediately visible.
- Selecting Women / Men / Home / Tech / Beauty / Sports / Travel / Jewelry swaps only that category's Departments directly underneath.
- Departments are compact, text-first, fast-scanning controls.
- The Living Campaign remains the dominant visual surface.
- Selecting a Department never causes a forced scroll jump.
- Product browsing stays vertical and exact-route only.
- Sort / Filter controls belong with the product list, not inside category navigation.
- Desktop and mobile use the same mental model; narrow screens may horizontally scroll the two compact navigation rows.
- No full-screen navigator, modal navigator, popup maze, large department cards, thumbnail department grid, counts, or explanatory chrome by default.
- An immersive/overlay navigation experiment is allowed only when the Owner explicitly asks for that specific pattern.
- SHEIN or any external reference may inform information architecture, but HUNT must keep its own brand, visual language and taxonomy.

Decision rule: if normal shopping navigation needs explanation, simplify it.

### Required HUNT hierarchy
Main Category -> Department -> Exact Shelf -> Product -> Variant.

Examples:
- Women -> Dresses
- Men -> Jackets
- Jewelry -> Earrings / Necklaces / Bracelets / Rings / Anklets / Brooches / Jewelry Sets
- Home, Tech, Lighting, Kitchen and other non-fashion areas remain first-class categories.

### Navigation contract
Opening Women/Men/etc reveals their departments directly underneath the main category navigation.
Selecting a department keeps the Cinematic promotion/advertising floor intact.
The selected department's products appear below and browse vertically.
Do not introduce an accordion, side navigation, page jump, or horizontal-first product rail unless explicitly requested.

### No-mixing contract
Canonical product identity = provider + item_id.
Canonical variant identity = provider + item_id + variant_id.
A product gets one canonical visible route.
Examples:
- Socks only in Socks.
- Earrings only in Earrings.
- Necklaces only in Necklaces.
- Bags only in Bags.
- Watches only in Watches.
- Lighting only in Lighting.
- Tech/Home/Kitchen products never act as fashion filler.
Legacy category labels are evidence, not truth. Validate product identity before render.

### Product Truth
Every product follows:
Safety -> Exact Variant -> Image QA -> Stock -> Shipping -> Final Cost -> Profit Reserve -> Route Lock.

Do not promote readiness without evidence.
Do not invent variants, sizes, conversions, attributes, stock, shipping, price, profit or taxonomy.
If ambiguous: HOLD.

### Product page contract
Vertical order:
Breadcrumb -> Gallery -> Purchase block -> variants -> verified size/measurements -> product-specific attributes -> details -> shipping/returns -> reviews/video -> Similar -> Pairs Well With -> Discover -> Recently Viewed.

Supplier size is primary.
US/UK/EU equivalents appear only when verified.
Verified cm may be converted mathematically to inches.
No guessed size mapping.

### Recommendations
Similar = same exact intent/shelf.
Pairs Well With = controlled complementary products.
Discover = intentionally diverse but still truth-gated.
Current product cannot reappear.
A product cannot appear in multiple recommendation sections in one render.

### Visual baseline
Preserve:
- Original HUNT Cinematic
- Sapphire / Gold
- Light / Dark
- depth, motion and premium discovery
- Living Campaign / Advertising floor
- category drawer underneath main categories
Aesthetic experiments are allowed only in new versions.

### Production safety
Preview approval is not deployment approval.
Production OFF.
Payment Live OFF.
Supplier Live Order OFF.
Sellable OFF unless separately approved.

### Before editing
State internally:
- Approved baseline
- exact requested change
- protected behavior
- experiment target
- rollback target

### After editing
Verify:
- baseline unchanged
- exact category/department relationship
- no product mixing
- no duplicate identities
- no forced scroll jump
- vertical browsing
- correct product route/breadcrumb
- variants/options
- dark/light
- mobile/reflow
- accessibility
- recommendation separation
- Production/Payment/Supplier Live unchanged

### Misunderstanding protocol
If Owner says “not what I meant”:
1. Stop extending the interpretation.
2. Return to last approved baseline.
3. Re-read the literal requested behavior.
4. Build a separate experiment.
5. Do not alter the baseline.

If Owner says “this is it”, that version becomes the new protected baseline.


### Experiment navigation integrity
Every experimental storefront family must be route-closed:
- HUNT brand/home link -> current experiment home.
- Women/Men/Jewelry links -> current experiment category state.
- Product breadcrumb/back link -> current experiment category/department.
- Recommendation product links -> current experiment product page.
- Mobile Home/Categories links -> current experiment family.
Never point an experiment to the generic old index or legacy category page unless explicitly requested.

### Public storefront brand
In the current Cinematic storefront family, the visible brand is **HUNT**.
Do not render **HUNT DEAL** in the primary brand lockup unless Owner explicitly asks to restore it.


### Navigation visual hierarchy
- Main Categories are primary and must be visually stronger than Departments.
- Departments are secondary and compact; they must never consume more visual weight or vertical space than Main Categories.
- Department navigation should prefer concise text controls over large image cards/count metadata.
- Preserve all department choices; do not hide them behind a default "More" control.
- The Cinematic campaign remains the dominant visual surface after navigation.


### Smart disclosure / progressive reveal
HUNT may hide **tertiary or optional** UI to protect clarity and Cinematic screen space.

Rule: **Hide visually, never lose functionally.**

Simple First exception:
- Main Categories stay visible.
- The selected Main Category's Departments stay immediately available in the compact second row.
- Do not collapse normal Departments behind a generic menu, "Explore", modal, drawer, fullscreen layer or "More" control by default.

Disclosure is appropriate for filters, specs and other secondary layers when needed:
- keep a clear open/change control;
- preserve current selection visibly;
- keep every option reachable;
- use semantic disclosure state (`aria-expanded` / `aria-controls`);
- Enter/Space opens or closes; Escape closes where appropriate;
- closing never clears the user's selection;
- opening/closing never causes forced page scroll;
- the Cinematic campaign remains visually dominant.

Critical commerce information and safety/error states must not be hidden behind optional disclosure.


### Cinematic navigation grammar
The cinematic grammar belongs in the **Living Campaign and product world**, not in a complicated primary menu.

Default:
- Main Category = visible primary text navigation.
- Department = compact secondary text navigation.
- Product shelf = exact vertical product world.
- Living Campaign = the cinematic hero and storytelling surface.

Do not use an **Explore HUNT** fullscreen/overlay navigator as the normal storefront path.

Immersive, spatial or overlay navigation is an opt-in experiment only when the Owner explicitly requests it. Any such experiment must live in a separate version and may not replace the Simple First default or the protected rollback baseline.
