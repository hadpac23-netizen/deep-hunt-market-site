const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("payment session rejects absent or malformed supplier shipping prices",()=>{
  const src=read("supabase/functions/hunt-payment-session/index.ts");
  assert.match(src,/typeof body\?\.shipping_usd==="number"/);
  assert.match(src,/typeof shipping\?\.price_usd==="number"/);
  assert.match(src,/SHIPPING_UNAVAILABLE/);
  assert.doesNotMatch(src,/!\(num\(body\?\.shipping_usd\)>=0\)/);
});

test("PayPlus callback identity comes only from the signed POST body",()=>{
  const src=read("supabase/functions/hunt-payplus-callback/index.ts");
  assert.match(src,/if\(req\.method!=="POST"\)/);
  assert.match(src,/const callbackTx=verifiedTransaction\(parsed\.signatureBody\)/);
  assert.match(src,/verifyWithPayPlus\(session,callbackTx\)/);
});

test("EPROLO audits require exact IDs, COO and landed-cost evidence before resolving tax exceptions",()=>{
  const country=read("supabase/functions/hunt-eprolo-country-shadow/index.ts");
  const one=read("supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts");
  const all=read("supabase/functions/hunt-eprolo-product-country-variants-audit-shadow/index.ts");
  assert.doesNotMatch(country,/variantList\.length===1\?variantList\[0\]:null/);
  assert.doesNotMatch(one,/list\.length===1\?list\[0\]:null/);
  assert.match(one,/finalProfitTruth/);
  assert.match(all,/completeCustomsCoverage\(rows,auditComplete,"destination_tax_duty_verified"\)/);
  assert.match(all,/COUNTRY_OF_ORIGIN_NOT_VERIFIED/);
  assert.doesNotMatch(all,/rows\.some\(x=>x\.taxes_verified===true\)/);
});

test("CJ live checks never erase catalog price when supplier price is missing",()=>{
  const src=read("supabase/functions/hunt-cj-live-check/index.ts");
  assert.match(src,/\.\.\.\(Number\.isFinite\(price\) && price > 0 \? \{price_amount:price,price_basis:"SUPPLIER_BASE",currency:"USD"\} : \{\}\)/);
  assert.doesNotMatch(src,/price_amount: Number\.isFinite\(price\) && price > 0 \? price : null/);
});

test("EPROLO catalog refill cannot ratchet established exact-variant inventory",()=>{
  const src=read("supabase/functions/hunt-eprolo-catalog-fill-readonly/index.ts");
  assert.doesNotMatch(src,/verified_inventory=greatest\(/);
  assert.doesNotMatch(src,/warehouse_inventory=greatest\(/);
  assert.match(src,/source_payload->>'variant_id'/);
  assert.match(src,/\{last_refill\}/);
});

test("freshness plan fits the 30 minute stock policy for both providers",()=>{
  const src=read("ops/hunt-freshness-shadow-schedule-plan.sql");
  assert.match(src,/CJ:\s+batch 10 every 2 minutes[\s\S]*<= 14m/);
  assert.match(src,/EPROLO: batch 25 every 2 minutes[\s\S]*<= 22m/);
  assert.match(src,/11 as eprolo_rotation_slots/);
});

// Keep adversarial remediation tests inside the workflow-enforced red-team suite.
require("./red-team-session-hardening.test.js");
require("./red-team-support-permissions.test.js");
require("./red-team-storefront-context.test.js");
require("./legal-readiness-contract.test.js");
require("./security-governance-readiness.test.js");
require("./payplus-prelaunch-url-gate.test.js");

require("./final-profit-truth.test.js");
