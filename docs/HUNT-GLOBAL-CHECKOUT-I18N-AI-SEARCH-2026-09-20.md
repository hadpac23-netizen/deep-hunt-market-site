# HUNT Global Checkout + World Locale + AI Search

Date: 2026-09-20
Status: SOURCE FOUNDATION / NO PRODUCTION ACTIVATION

## Global checkout
HUNT owns the checkout UX. Payment methods are selected dynamically from approved routes by country, currency, device/browser capability, order type and processor support.

Method families:
- Cards and debit cards
- Apple Pay, Google Pay, PayPal
- Local wallets and QR wallets
- Bank redirects / open banking / account-to-account
- Direct debit and bank transfer
- BNPL / installments where lawful and approved
- Region-specific payment methods

Never show a method that is not actually available for that transaction. Never store raw card details in HUNT.

## Checkout UX rules
- Guest checkout stays available.
- Signed-in users may explicitly save delivery details.
- Saved delivery details are account-scoped and RLS protected.
- Address Line 2 is optional.
- Country-specific address fields and browser autofill are supported.
- Explain why phone is required.
- Keep order summary and final total visible.
- Surface taxes, duties and fees before final commitment.
- Third-party wallets are explicit choices, not forced redirects.
- Preserve entered data when validation fails.

## World locale engine
Use Unicode/UTF-8, BCP 47 language tags, CLDR/Intl formatting, and explicit direction metadata.

Rules:
- Locale and translation are separate concerns.
- Locale controls numbers, currency, dates, units and direction.
- UI translation availability is tracked separately.
- RTL/LTR is explicit, not guessed only from language.
- Language names appear in their native script.
- Unsupported UI translations fall back safely and are not labeled as fully translated.

Current full UI translations:
English, Arabic, Hebrew, Spanish, French, Japanese, Chinese.

Target:
- searchable language chooser
- automatic locale detection with user override
- translation provider/cache layer for additional languages
- product/user text may carry value + lang + dir metadata

## AI Search Assist
Three tiers:
1. Instant local assist from first character: categories, aliases, recent searches.
2. Catalog matching after a short prefix: real products only.
3. BOOM AI intent for full natural-language queries.

Search requirements:
- Unicode input and RTL/LTR
- typo tolerance and synonyms
- cross-language category aliases
- free-language queries
- recent searches and category suggestions
- product suggestions in the next catalog-assist phase
- price, color, style, device and size intent extraction
- no fabricated products, stock or availability

## Source checkpoint
- Added source migration: 20260920181000_add_hunt_saved_addresses.sql
- Added account-scoped saved delivery details UI and client
- Added Search Assist from the first character
- Added multilingual category aliases for current translated languages
- No live DB migration applied
- No payment method activated
- No production deployment performed

Full all-language UI requires a translation provider/cache layer; the locale foundation must not pretend an untranslated locale is fully translated.
