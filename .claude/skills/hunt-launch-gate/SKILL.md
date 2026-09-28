---
name: hunt-launch-gate
description: This skill should be used for HUNT launch readiness, deployment, authentication, checkout, payment, supplier live ordering, security, SEO, or production activation decisions.
---

# HUNT Launch Gate

A polished preview is not launch approval.

Before production:
1. Product Truth gate.
2. Taxonomy/dedupe gate.
3. Visual regression gate.
4. Accessibility/mobile gate.
5. Performance gate.
6. Security gate.
7. Checkout/payment gate.
8. Supplier-order gate.
9. Monitoring/rollback gate.

Security checks when relevant:
- no secrets in source/logs
- validate/sanitize user input
- safe DOM rendering
- auth/authorization enforced server-side
- RLS verified
- rate-limit expensive/sensitive endpoints
- CORS and security headers reviewed
- third-party webhook/API payloads verified
- dependency/security review
- no verbose production errors

SEO/product discovery:
- stable canonical product/category URLs
- Product/ProductGroup structured data where truthful
- variant identity preserved
- no indexable fake/unverified product states
- sitemap/robots match launch intent

Activation requires explicit Owner approval for:
- Production traffic changes
- Payment Live
- Supplier Live Order
- Sellable activation

Rollback must exist before activation.
