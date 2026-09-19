# BOOM Creative Factory + Claim Firewall Skill

## Mission
Generate channel-specific HUNT creative drafts only from verified Commerce Passport facts and only for SKUs that the Control Tower does not STOP.

## Safe-by-construction principle
Do not ask AI to invent marketing copy and then hope QA catches mistakes.
Build the base draft from verified facts first.

Allowed inputs:
- exact product title
- verified HUNT retail price
- source-backed brand/model/material/color/size
- approved product-linked media
- explicitly verified claims

Unknown facts stay unknown.

## Claim Firewall
Block unsupported claims including:
- waterproof / water resistant
- universal compatibility / fits all
- guarantees
- delivery today/tomorrow/overnight
- free shipping
- scarcity / limited stock / last chance
- bestseller / most popular / #1
- superiority such as best/ultimate/perfect
- authenticity claims without evidence
- medical/clinical claims
- percentage discounts without verified discount evidence

A claim may pass only when matching evidence is explicitly present.

## Channel drafts
The factory may prepare draft templates for:
- Google assets
- Meta Reels
- TikTok
- Pinterest
- HUNT onsite

Drafts are not published.

## Video brief
Use only approved product-linked media.
Do not invent demonstrations or outcomes.
Recommended structure:
1. product visible immediately
2. one verified product detail
3. exact option/product context
4. HUNT detail-page CTA

## Control Tower gate
Never create a draft when:
- category is unsafe/restricted
- title is missing
- approved image is missing
- no verified creative fact exists
- Control Tower state is STOP

HOLD for external distribution does not necessarily block internal draft preparation if onsite is safe and verified facts exist. Publishing remains separately gated.

## Output contract
Each draft contains:
- passport/product identity
- channel
- format
- source_facts
- claim_firewall result
- publish_ready=false
- owner_gate=REVIEW_REQUIRED

## External actions
This skill must not:
- post to social media
- upload to ad platforms
- generate spend
- alter campaigns
- publish feeds
- claim an AI-generated asset is approved

## Owner gate
Every external creative remains review-required until a future explicit publishing workflow is connected.
