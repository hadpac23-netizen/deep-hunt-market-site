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
  assert.equal(contract.contract_version,"HUNT_EPROLO_ORDER_SHADOW_V2");
  assert.equal(contract.provider,"EPROLO");
  assert.equal(contract.destination_country_code,"IL");
  assert.deepEqual(contract.line_items,[{line_reference:"1",item_id:"P1",variant_id:"V1",quantity:1,eprolo_order_variant_verified:false}]);
  assert.equal(contract.official_endpoint.path,"add_order.html");
  assert.equal(contract.official_endpoint.method,"POST");
  assert.equal(contract.endpoint_contract_documented,true);
  assert.equal(contract.endpoint_execution_verified,false);
  assert.equal(contract.official_request_ready,false);
  assert.ok(contract.official_required_fields_missing.includes("tax_cost"));
  assert.ok(contract.official_required_fields_missing.includes("shipping_province_code"));
  assert.ok(contract.official_required_fields_missing.includes("orderItemlist[].variantsid"));
  assert.equal(contract.official_request_preview.tax_cost,null);
  assert.equal(contract.official_request_preview.orderItemlist[0].variantsid,null);
  assert.equal(contract.supplier_submission_allowed,false);
  assert.equal(contract.supplier_order_side_effect,false);
  const serialized=JSON.stringify(contract);
  assert.doesNotMatch(serialized,/Test Customer|1 Test St|\+972500000000/);
});

test("EPROLO official request preview becomes shape-ready only with verified tax, province code and Product Detail variant provenance",async()=>{
  const mod=await import(pathToFileURL(path.join(root,"supabase/functions/_shared/hunt-fulfillment-provider.mjs")).href);
  const contract=mod.buildEproloShadowOrderContract({
    sessionId:"11111111-2222-3333-4444-555555555555",
    idempotencyKey:"idem-verified",
    countryCode:"IL",
    shipping:{
      shippingCustomerName:"Test Customer",shippingAddress:"1 Test St",shippingCity:"Haifa",
      shippingProvince:"Haifa",shippingProvinceCode:"HA",shippingZip:"31000",shippingPhone:"+972500000000"
    },
    group:{
      provider:"EPROLO",shipping_method:"YUN Express",
      line_items:[{item_id:"P1",variant_id:"V1",qty:1,eprolo_order_variant_verified:true,eprolo_tax_cost_verified:true,eprolo_tax_cost_usd:2.5}]
    }
  });
  assert.equal(contract.official_request_ready,true);
  assert.deepEqual(contract.official_required_fields_missing,[]);
  assert.equal(contract.official_request_preview.tax_cost,2.5);
  assert.equal(contract.official_request_preview.shipping_country,"Israel");
  assert.equal(contract.official_request_preview.shipping_province_code,"HA");
  assert.deepEqual(contract.official_request_preview.orderItemlist,[{variantsid:"V1",quantity:1}]);
  assert.equal(contract.endpoint_execution_verified,false);
  assert.equal(contract.supplier_submission_allowed,false);
  const serialized=JSON.stringify(contract);
  assert.doesNotMatch(serialized,/Test Customer|1 Test St|\+972500000000/);
});

test("orchestrator validates EPROLO in dry-run but blocks sandbox and live supplier submission",()=>{
  const src=read("supabase/functions/hunt-order-orchestrator/index.ts");
  assert.match(src,/classifyProvider\(x\?\.provider\)==="eprolo"/);
  assert.match(src,/ready_for_eprolo_shadow:pass&&hasEprolo&&eproloContractsReady/);
  assert.match(src,/OFFICIAL_REQUEST_FIELDS_INCOMPLETE/);
  assert.match(src,/REQUEST_SHAPE_READY_EXECUTION_BLOCKED/);
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
  assert.match(src,/EPROLO_ORDER_EXECUTION_NOT_VERIFIED/);
  assert.match(src,/eprolo_order_shadow_contract_preview/);
  assert.match(src,/buildEproloShadowOrderContract/);
  assert.doesNotMatch(src,/NON_CJ_FULFILLMENT_NOT_READY/);
});


test("checkout keeps supplier identity private and clamps EPROLO to verified quantity 1",()=>{
  const src=read("checkout.js");
  assert.match(src,/maxQtyFor = item => providerKind\(item\?\.provider\)==="eprolo" \? 1 : 5/);
  assert.match(src,/Math\.min\(maxQtyFor\(item\),Math\.trunc\(Number\(item\.qty\)\|\|1\)\)/);
  assert.match(src,/Math\.min\(maxQtyFor\(cart\[index\]\)/);
  assert.doesNotMatch(src,/esc\(item\.provider\)/);
  assert.match(src,/Quantity 1 required for verified shipping/);
});


test("checkout does not expose raw fulfillment blocker codes to customers",()=>{
  const src=read("checkout.js");
  assert.match(src,/expectedPrelaunch=new Set/);
  assert.match(src,/materialBlockers=blockers\.filter/);
  assert.doesNotMatch(src,/blockers\.join\(/);
  assert.match(src,/Payment and order submission remain disabled during pre-launch/);
  assert.match(src,/EPROLO_ORDER_EXECUTION_NOT_VERIFIED/);
});
