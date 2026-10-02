# Public Cost / Margin Red Team — 2026-10-02

Status: FAIL in deployed public prelaunch; PARTIAL overall because branch remediation is tested and not deployed.

FOUND: public GET /catalog-shards/women.json returned item 1436015757979947008 with supplier base=5.17, projected profit=4.83 and margin=.5296. Home promotions showed supplier costs labelled Supplier price. PDP recommendations also rendered supplier base amounts. Prior PASS privacy reports covered supplier names and missed internal financial exposure.
IMPACT: launch-blocking disclosure of supplier costs and internal margin.
FIX: shared public serializer strips supplier prices, private source payload and internal profit/margin from both storefront and search Edge responses, preserving only explicit merchant retail or verified customer retail. Sanitized all 53 public catalog files without modifying private DB evidence. Promotions and recommendations reject supplier prices even from stale cached data. Rotated the service-worker cache and made catalog/promotions fetch network-first. Search runtime v33 was newly pinned into Git source; its response boundary is guarded. Branch CORS accepts only the existing HUNT Netlify preview pattern in addition to existing official origins; arbitrary origins are not echoed. Search failures now show customer copy instead of JSON-parser details.
TEST: seven executable privacy tests, including actual search handler output with synthetic supplier fixtures, old-cache promotion/recommendation attacks, nested variant costs, unchanged private input, and all 53 public artifacts. PASS locally.
STATUS: branch remediation PASS; public runtime FAIL until approved preview/runtime deployment and fresh DOM/cache/API checks. No deployment was performed.

Exact next action: review this branch and use a scoped nonproduction deployment gate for the static preview plus the two Edge boundaries, then rerun DOM/URL/cache/public responses/search/recommendations checks. Do not turn financial gates on. Supplier CDN/domain anonymity remains separate post-launch hardening; internal cost disclosure is P0.
