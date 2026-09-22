const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-fresh-shelf-product-truth-contract.json","utf8"));
assert.equal(c.authority,"NONE");
assert(c.truth_precedence.some(x=>/hunt-cj-quote is canonical/.test(x)));
assert(c.hard_rules.some(x=>/Never refresh a timestamp/.test(x)));
const src=fs.readFileSync("boom-fresh-shelf-product-truth.js","utf8");
const ctx={window:{},Date};vm.createContext(ctx);vm.runInContext(src,ctx);
const P=ctx.window.BoomFreshShelfProductTruth;
const product={provider:"CJdropshipping",item_id:"p1",category:"bags",image_url:"https://x",price_amount:7.99,availability_verified:true,market_eligibility_status:"recheck_before_checkout"};
const now=new Date().toISOString();
const obs=[
 {provider:"CJdropshipping",item_id:"p1",observation_type:"price",price_amount:7.99,availability_verified:true,payload:{retail_verified:true,profit_gate_status:"PASS"},observed_at:now},
 {provider:"CJdropshipping",item_id:"p1",observation_type:"stock",availability_verified:true,payload:{stock_verified:true,stock_available:true},observed_at:now},
 {provider:"CJdropshipping",item_id:"p1",observation_type:"shipping",shipping_amount:4.2,destination_country:"IL",availability_verified:true,payload:{shipping_verified:true},observed_at:now}
];
let r=P.evaluateProduct(product,obs,"IL",24);
assert.equal(r.fresh_shelf_verified,true);
assert.equal(r.state,"CHECKOUT_RECHECK_REQUIRED");
assert.equal(r.checkout_live_verified,false);
r=P.evaluateProduct({...product,market_eligibility_status:"eligible"},obs,"IL",24);
assert.equal(r.state,"FRESH_SHELF_VERIFIED");
const bad=P.evaluateProduct(product,obs.filter(x=>x.observation_type!=="shipping"),"IL",24);
assert.equal(bad.fresh_shelf_verified,false);assert.equal(bad.first_blocker,"FRESH_SHIPPING");
console.log("BOOM Fresh Shelf Product Truth: PASS — fresh shelf separated from checkout readiness; stock+shipping quote evidence required");