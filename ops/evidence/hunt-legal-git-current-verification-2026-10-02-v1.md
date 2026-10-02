# Legal / Git / Security — fresh verification 2026-10-02

Status: BLOCKED for real-money launch.

Public terms/privacy/returns/shipping routes all returned HTTP 200 in this run. Existing approved support/privacy contacts and returns workflow remain complete for prelaunch. Fresh business-identity query returned presence of entity/registration/address/support/privacy fields, but status=draft, owner_approved=false, approved_at=null. No private address/name/registration value was retrieved or published.

Real-money markets currently enabled: none, because all live controls and sellable flags remain OFF. TAX8 review stays AE/DE/GB/IL/US only. Country labels also visible in checkout are not legal or commercial activation evidence.

Concrete next action: owner chooses the actual enabled market subset and approves exact public trading/business-address disclosure, total-price/tax/duty/shipping/payment/cancellation/confirmation language and return-destination handling for that subset. No universal returns address is inferred. AE and any additional market-specific VAT/local requirements remain UNVERIFIED; do not copy a generic policy to claim compliance.

Primary sources re-read 2026-10-02:
- UK: https://www.gov.uk/online-and-distance-selling-for-businesses (business identity/contact/address, taxes, delivery/cancellation and durable information).
- EU/DE: https://europa.eu/youreurope/citizens/consumers/shopping/contract-information/index_en.htm (trader/address, tax-inclusive price, shipping, restrictions, trade register/VAT if applicable and confirmation).
- IL government consumer guidance: https://www.gov.il/BlobFolder/generalpage/information-olim-consumerism/he/smart-consumerism-he.pdf (remote-sale disclosure; current exact applicability still requires market review).
- US FTC: https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule (shipment commitments, delay consent/refunds).

Fresh Git API: rulesets=[]; main classic branch protection GET returned 403 Resource not accessible by integration. Governance remains UNVERIFIED_PERMISSION_LIMIT, not protected/unprotected. Owner/repo administrator must supply API or settings evidence for required checks/reviews/merge rules and no force push/deletion. No protection settings were changed.

Supabase Security Advisor: one WARN, leaked-password protection disabled. HUNT customer UI has no password field; code exposes Magic Link/OAuth/Google ID Token. This specific warning remains OPEN_SECURITY_HARDENING, not the cost-exposure P0. RLS off count for exposed public hunt_* tables=0; this count does not prove every RLS policy or cross-account behavior. Authenticated profile/orders/likes and cross-user isolation remain UNVERIFIED in this run.
