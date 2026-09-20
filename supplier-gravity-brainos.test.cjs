const fs=require("fs");
const vm=require("vm");
const assert=require("assert");

const source=fs.readFileSync("supplier-gravity.js","utf8");
assert(!source.includes("hunt_deal_cart_v1"),"Supplier Gravity must not own/read raw cart storage");
assert(!/\b(addCart|saveCart|clearCart|fetch)\s*\(/.test(source),"Supplier Gravity may not execute commerce actions");
assert(source.includes('mode:"SHADOW"'),"Supplier Gravity must remain SHADOW");
assert(source.includes("advisory_only:true"),"Supplier Gravity must remain advisory only");

const store=new Map();
const listeners={};
const context={
  console, URL,
  location:{href:"https://hunt.test/"},
  localStorage:{
    getItem:key=>store.has(key)?store.get(key):null,
    setItem:(key,value)=>store.set(key,String(value))
  },
  document:{addEventListener(){}},
  addEventListener:(type,fn)=>{listeners[type]=fn;},
  HuntCore:{
    cartKey:"hunt_deal_cart_v1",
    cart:()=>[{provider:"CJdropshipping",item_id:"cj-1",qty:1}],
    signals:()=>({women:4})
  }
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:"supplier-gravity.js"});

const gravity=context.HuntSupplierGravity;
assert(gravity,"Supplier Gravity runtime missing");
assert.equal(gravity.mode,"SHADOW");
assert.equal(gravity.advisory_only,true);
const result=gravity.evaluateSecondary({
  candidateProvider:"EPROLO",
  cartRetailAmount:50,
  contributionBeforeExtraShipping:10,
  incrementalShipping:5,
  cartItemCount:3
});
assert.equal(result.advisory_only,true);
assert.equal(result.mode,"SHADOW");
assert.equal(result.customer_shipping_increment,1);
assert.equal(result.auto_open,true);
assert(!store.has("hunt_deal_cart_v1"),"Supplier Gravity wrote raw cart storage");

console.log("supplier_gravity_brainos=PASS");
