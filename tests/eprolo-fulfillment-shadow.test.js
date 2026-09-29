const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");

const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("provider helper classifies CJ and EPROLO without supplier-name leakage into checkout",async()=>{
  const mod=await import(pathToFileURL(path.join(root,"supabase/functions/_shared/hunt-fulfillment-provider.mjs")).href);
  assert.equal(mod.classifyProvider("EPROLO"),"eprolo");
  assert.equal(mod.classifyProvider("CJdropshipping"),"cj");
  assert.equal(mod.classifyProvider("unknown"),"unsupported");
  assert.equal(mod.normalizedSupplierProvider("EPROLO"),"EPROLO");
});

test("EPROLO shadow order contract preserves exact variant and cannot submit",async()=>{
  const mod=await import(pathToFileURL(path.join(root,"supabase/functions/_shared/hunt-fulfillment-provider.mjs")).href);
  const contract=mod.buildEproloShadowOrderContract({
    sessionId:"11111111-2222-3333-4444-555555555555",
    idempotencyKey:"idem-1",
    countryCode:"IL",
    shipping:{
      shippingCustomerName:"Test Customer",
      shippingAddress:"1 Test St",
      shippingCity:"Haifa",
      shippingProvince:"Haifa",
      shippingZip:"31000",
      shippingPhone:"+972500000000"
    },
    group:{
      provider:"EPROLO",
      shipping_method:"YUN Express",
      line_items:[{item_id:"P1",variant_id:"V1",qty:1}]
    }
  });
  assert.equal(contract.contract_version,"HUNT_EPROLO_ORDER_SHADOW_V1");
  assert.equal(contract.provider,"EPROLO");
  assert.equal(contract.destination_country_code,"IL");
  assert.deepEqual(contract.line_items,[{line_reference:"1",item_id:"P1",variant_id:"V1",quantity:1}]);
  assert.equal(contract.endpoint_verified,false);
  assert.equal(contract.supplier_submission_allowed,false);
  assert.equal(contract.supplier_order_side_effect,false);
  const serialized=JSON.stringify(contract);
  assert.doesNotMatch(serialized,/Test Customer|1 Test St|\+972500000000/);
});

test("orchestrator validates EPROLO in dry-run but blocks sandbox and live supplier submission",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/classifyProvider\(x\?\.provider\)==="eprolo"/);
  assert.match(src,/ready_for_eprolo_shadow:pass&&hasEprolo/);
  assert.match(src,/BLOCKED_UNTIL_OFFICIAL_ORDER_ENDPOINT_VERIFIED/);
  assert.match(src,/EPROLO_SUPPLIER_SANDBOX_UNAVAILABLE/);
  assert.match(src,/EPROLO_LIVE_ENDPOINT_NOT_VERIFIED/);
  assert.match(src,/supplier_submission_performed:false/);
  assert.doesNotMatch(src,/openapi\.eprolo\.com/i);
  const sandboxBlock=src.indexOf('error:"EPROLO_SUPPLIER_SANDBOX_UNAVAILABLE"');
  const cjSandboxControl=src.indexOf('const sandbox=await control(ctx,"hunt_supplier_order_sandbox")');
  assert.ok(sandboxBlock>0&&cjSandboxControl>sandboxBlock,"EPROLO must block before CJ sandbox side effects");
});

test("payment session v19 path accepts EPROLO only after fresh country quote gates",()=>{
  const src=read("supabase/functions/hunt-payment-session/index.ts");
  assert.match(src,/getEproloQuote/);
  assert.match(src,/hunt-eprolo-country-shadow/);
  assert.match(src,/EPROLO_MULTI_QTY_RECHECK_REQUIRED/);
  assert.match(src,/readiness_status\)!=="COUNTRY_PASS"/);
  assert.match(src,/economics\?\.gate\)!=="PASS"/);
  assert.match(src,/!providerLower\.includes\("cj"\)&&!providerLower\.includes\("eprolo"\)/);
});


test("order preview accepts EPROLO shadow routing without CJ-only origin requirement",()=>{
  const src=read("supabase/functions/hunt-order-preview/index.ts");
  assert.match(src,/providerKinds\.includes\("unsupported"\)/);
  assert.match(src,/classifyProvider\(x\?\.provider\)==="cj"&&!clean\(x\?\.origin_country_code\)/);
  assert.match(src,/EPROLO_ORDER_ENDPOINT_NOT_VERIFIED/);
  assert.match(src,/eprolo_order_shadow_contract_preview/);
  assert.match(src,/buildEproloShadowOrderContract/);
  assert.doesNotMatch(src,/NON_CJ_FULFILLMENT_NOT_READY/);
});


test("checkout keeps supplier identity private and clamps EPROLO to verified quantity 1",()=>{
  const src=read("checkout.js");
  assert.match(src,/maxQtyFor = item => providerKind\(item\?\.provider\)==="eprolo" \? 1 : 5/);
  assert.match(src,/Math\.min\(maxQtyFor\(item\),Number\(item\.qty\)\|\|1\)/);
  assert.match(src,/Math\.min\(maxQtyFor\(cart\[index\]\)/);
  assert.doesNotMatch(src,/esc\(item\.provider\)/);
  assert.match(src,/Quantity 1 required for verified shipping/);
});
