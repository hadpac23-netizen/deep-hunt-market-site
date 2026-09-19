# BOOM Google + AI Feed Skill

## Mission
Transform verified HUNT Commerce Passports into Google Merchant ProductInput drafts and AI-shopping discovery attributes without publishing anything externally.

## Operating mode
DRAFT + VALIDATE ONLY.

This skill must never:
- call Merchant API;
- authenticate a Google Merchant account;
- insert, update or delete a ProductInput;
- publish a feed;
- create or spend on a campaign;
- infer a target country/feed label;
- invent missing commercial attributes.

## ProductInput contract
Prepare:
- offerId
- contentLanguage
- feedLabel
- productAttributes

Supported product attributes include:
- title / description
- link / canonicalLink
- imageLink / additionalImageLinks
- videoLinks
- availability
- price
- condition
- brand
- gtins
- mpn
- color / size / material / pattern
- gender / ageGroup
- productTypes
- questionsAndAnswers
- documentLinks
- variantOptions
- relatedProducts

## Conversational truth
Only Q&A explicitly marked verified may leave HUNT.
Never export a predicted answer, shipping promise, compatibility promise, review claim or product fact that is not source-backed.

## Variant rule
A Google offer is variant-specific when commercial attributes such as size/color differ.
If one Commerce Passport contains multiple values for an option, do not flatten them into one ProductInput.
Return:
variant_offer_not_expanded

A later enrichment layer must create one truthful offer per provider variant / HUNT offer identity.

## Feed label rule
Feed label / target market must be configured explicitly.
Never default to US, Israel or any other country.

## Readiness
export_ready:
The ProductInput data contract is complete enough to create a draft.

publish_ready:
export_ready plus official Google channel connection/readiness from the Commerce Passport.

These are not the same state.

## Required validation
Fail closed on:
- missing/weak description
- missing HTTPS destination
- missing HTTPS image
- unverified price
- non-feed-safe availability
- incomplete merchant identity/policies
- stale source
- unexpanded variants
- invalid/missing feed label

## Batch output
Return:
- total passports checked
- export_ready
- publish_ready
- blocked
- safe ProductInput drafts
- blocked products with reasons
- top blocker counts
- network_calls = 0
- external_publish = false
- OWNER_GATE = REVIEW_REQUIRED
