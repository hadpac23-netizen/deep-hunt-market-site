import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { publicStorefrontPayload } from "../supabase/functions/_shared/public-price-privacy.mjs";

test("public payload removes supplier costs, internal margin and nested variant costs",()=>{
  const source={provider:"CJdropshipping",price_basis:"SUPPLIER_BASE",price_amount:5.17,projected_product_profit:4.83,projected_product_margin:.5296,supplier_cost_usd:5.17,source_payload:{secret:"private"},variants:[{variant_id:"v1",price_amount:5.17,cost_price:5.17,stock_quantity:35}],retail_price_amount:10,retail_price_verified:false};
  assert.deepEqual(publicStorefrontPayload(source),{provider:"CJdropshipping",price_basis:"DETAIL_REQUIRED",variants:[{variant_id:"v1",stock_quantity:35}],retail_price_verified:false});
  assert.equal(source.price_amount,5.17,"private evidence must not be mutated");
});
test("unknown basis fails closed, merchant retail and approved customer retail survive",()=>{
  assert.deepEqual(publicStorefrontPayload({price_amount:5,variants:[{price_amount:6}],retail_price_amount:10}),{variants:[{}]});
  assert.equal(publicStorefrontPayload({price_basis:"MERCHANT_RETAIL",price_amount:20,variants:[{price_amount:21}]}).variants[0].price_amount,21);
  const out=publicStorefrontPayload({price_basis:"SUPPLIER_BASE",price_amount:5,retail_price_amount:20,retail_price_verified:true,profit_gate_status:"PASS",projected_product_profit:15});
  assert.equal(out.retail_price_amount,20); assert.equal(out.price_amount,undefined); assert.equal(out.projected_product_profit,undefined);
});
test("all public catalog artifacts contain no supplier amounts or internal profit",()=>{
  for(const file of ["catalog-home.json","catalog-snapshot.json",...fs.readdirSync("catalog-shards").filter(x=>x.endsWith(".json")).map(x=>"catalog-shards/"+x)]){
    const payload=JSON.parse(fs.readFileSync(file,"utf8"));
    assert.deepEqual(payload,publicStorefrontPayload(payload),file);
  }
});
test("promotions do not render a supplier cost from stale cached shelf data",async()=>{
  let onShelves; const host={isConnected:true,innerHTML:""};
  const context={window:{HuntCore:{esc:String,money:n=>"$"+n,productUrl:()=>"product.html?src=s1&id=1",signals:()=>({}),categoryDefs:{}},addEventListener:(name,fn)=>{if(name==="hunt:shelves")onShelves=fn;}},document:{querySelector:selector=>selector==="#hd-boom-promotions"?host:null}};
  vm.runInNewContext(fs.readFileSync("boom-promotions.js","utf8"),context);
  const rows=Array.from({length:4},(_,i)=>({provider:"CJdropshipping",item_id:String(i),title:"Product "+i,price_amount:123.45,price_basis:"SUPPLIER_BASE"}));
  await onShelves({detail:{shelves:{women:rows,beauty:rows}}});
  await Promise.resolve();
  assert.match(host.innerHTML,/Price pending/); assert.doesNotMatch(host.innerHTML,/123\.45|Supplier price/);
});
test("every public Edge serialization uses the privacy boundary",()=>{
  for(const path of ["supabase/functions/hunt-storefront/runtime.ts","supabase/functions/hunt-deals-hunt/index.ts"]){
    const handler=fs.readFileSync(path,"utf8").split("Deno.serve(")[1];
    assert.ok(handler.includes("publicJson(")); assert.doesNotMatch(handler,/JSON\.stringify\(/);
  }
});

test("actual search handler cannot serialize a synthetic supplier base cost",async()=>{
  const {stripTypeScriptTypes}=await import("node:module"); let handler;
  const context=vm.createContext({publicStorefrontPayload,Request,Response,URL,URLSearchParams,TextEncoder,AbortSignal,console,
    Deno:{env:{get:()=>""},serve:fn=>handler=fn}});
  const code=fs.readFileSync("supabase/functions/hunt-deals-hunt/index.ts","utf8").replace(/^import .*;$/m,"");
  vm.runInContext(stripTypeScriptTypes(code,{mode:"transform"}),context);
  for(const name of ["ebaySearch","amazonSearch","impactSearch","etsySearch","rakutenSearch","printfulSearch","wooCommerceSearch","adobeCommerceSearch"]){context[name]=async()=>[];}
  context.printfulSearch=async()=>[{provider:"Printful",item_id:"fixture",price_basis:"SUPPLIER_BASE",price_amount:123.45,variants:[{price_amount:123.45}],projected_product_margin:.6}];
  const response=await handler(new Request("https://fixture.invalid",{method:"POST",headers:{apikey:"sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X","content-type":"application/json"},body:JSON.stringify({query:"shirt",limit:1})}));
  assert.equal(response.status,200); const payload=await response.json();
  assert.equal(payload.results[0].price_amount,undefined); assert.equal(payload.results[0].variants[0].price_amount,undefined);
  assert.equal(payload.results[0].projected_product_margin,undefined);
  const preflight=await handler(new Request("https://fixture.invalid",{method:"OPTIONS",headers:{origin:"https://hunt-pr26-prelaunch--deep-hunt-market.netlify.app"}}));
  assert.equal(preflight.headers.get("access-control-allow-origin"),"https://hunt-pr26-prelaunch--deep-hunt-market.netlify.app");
  const external=await handler(new Request("https://fixture.invalid",{method:"OPTIONS",headers:{origin:"https://attacker.example"}}));
  assert.notEqual(external.headers.get("access-control-allow-origin"),"https://attacker.example");
});

test("recommendations refuse supplier costs even from an old cached shard",async()=>{
  let onProduct; const host={innerHTML:"",insertAdjacentHTML:(_position,text)=>host.innerHTML+=text};
  const sentinel={classList:{add:()=>{}},querySelector:()=>({textContent:""})};
  const context={URL,URLSearchParams,location:{search:""},fetch:async()=>({ok:true,json:async()=>({products:[{provider:"CJdropshipping",item_id:"2",title:"Related shirt",category:"tops",price_basis:"SUPPLIER_BASE",price_amount:123.45}]})}),
    window:{HuntCore:{esc:String,money:n=>"$"+n,sourceCodeForProvider:()=>"s1",productUrl:()=>"product.html?src=s1&id=2",categoryDefs:{tops:{title:"Tops"}},inferCategory:()=>"tops",categoryGroups:{},shoppingPreferences:()=>({}),signals:()=>({})},addEventListener:(_name,fn)=>onProduct=fn},
    document:{addEventListener:()=>{},querySelector:s=>s==="#hd-endless-grid"?host:s==="#hd-endless-sentinel"?sentinel:null},IntersectionObserver:class{observe(){}disconnect(){}}};
  vm.runInNewContext(fs.readFileSync("product-flow.js","utf8"),context);
  await onProduct({detail:{product:{provider:"CJdropshipping",item_id:"1",title:"Current shirt",category:"tops"}}});
  assert.match(host.innerHTML,/Related shirt/); assert.match(host.innerHTML,/View product/); assert.doesNotMatch(host.innerHTML,/123\.45/);
});
