const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-fresh-shelf-product-truth-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(c.truth_precedence.some(x=>/controlled product scan/.test(x)));
assert(c.hard_rules.some(x=>/different variant/.test(x)));
const src=fs.readFileSync("boom-fresh-shelf-product-truth.js","utf8");
const ctx={window:{},Date};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomFreshShelfProductTruth;
const product={provider:"CJdropshipping",item_id:"p1",category:"bags",image_url:"https://x",price_amount:7.99,availability_verified:true,market_eligibility_status:"recheck_before_checkout"};
const now=new Date().toISOString();
const scan={provider:"CJdropshipping",item_id:"p1",observation_type:"product",availability_verified:true,payload:{source:"controlled-cj-refresh",scan_id:"s1",destination_country:"IL",refresh_state:"VERIFIED",variant_id:"v1"},observed_at:now};
const obs=[
 scan,
 {provider:"CJdropshipping",item_id:"p1",observation_type:"price",price_amount:7.99,availability_verified:true,payload:{variant_id:"v1",retail_verified:true,profit_gate_status:"PASS"},observed_at:now},
 {provider:"CJdropshipping",item_id:"p1",observation_type:"stock",availability_verified:true,payload:{variant_id:"v1",stock_verified:true,stock_available:true},observed_at:now},
 {provider:"CJdropshipping",item_id:"p1",observation_type:"shipping",shipping_amount:4.2,destination_country:"IL",availability_verified:true,payload:{variant_id:"v1",shipping_verified:true},observed_at:now}
];
let r=P.evaluateProduct(product,obs,"IL",24);
assert.equal(r.fresh_shelf_verified,true);
assert.equal(r.state,"CHECKOUT_RECHECK_REQUIRED");
assert.equal(r.checkout_live_verified,false);
const noScan=P.evaluateProduct(product,obs.filter(x=>x.observation_type!=="product"),"IL",24);
assert.equal(noScan.fresh_shelf_verified,false);assert.equal(noScan.first_blocker,"CONTROLLED_SCAN_VERIFIED");
const wrongVariant=P.evaluateProduct(product,obs.map(x=>x.observation_type==="stock"?{...x,payload:{...x.payload,variant_id:"v2"}}:x),"IL",24);
assert.equal(wrongVariant.fresh_shelf_verified,false);assert.equal(wrongVariant.first_blocker,"FRESH_STOCK_SAME_VARIANT");
const failedScan={...scan,availability_verified:false,payload:{...scan.payload,refresh_state:"PRODUCT_FAILED"},observed_at:new Date(Date.now()+1000).toISOString()};
const failed=P.evaluateProduct(product,[...obs,failedScan],"IL",24);
assert.equal(failed.fresh_shelf_verified,false);assert.equal(failed.scan.state,"PRODUCT_FAILED");
console.log("BOOM Fresh Shelf Product Truth: PASS — controlled scan + exact variant price/stock/shipping required; checkout remains separate");