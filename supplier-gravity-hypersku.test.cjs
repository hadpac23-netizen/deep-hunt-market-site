const assert=require("node:assert/strict");

global.localStorage={
  _m:new Map(),
  getItem(k){return this._m.has(k)?this._m.get(k):null},
  setItem(k,v){this._m.set(k,String(v))}
};
global.window={
  addEventListener(){},
  dispatchEvent(){},
  HuntCore:null
};
global.document={
  addEventListener(){}
};

require("./supplier-gravity.js");

const S=global.window.HuntSupplierGravity;
assert.ok(S,"HuntSupplierGravity should be exposed");
assert.equal(S.providerKey("HyperSKU"),"hypersku");
assert.equal(S.providerKey("hyper-sku"),"hypersku");
assert.equal(S.providerKey("CJdropshipping"),"cjdropshipping");
assert.equal(S.providerKey("EPROLO"),"eprolo");

console.log("HyperSKU supplier normalization tests: PASS");
