const assert=require("node:assert/strict");

global.localStorage={
  _m:new Map(),
  getItem(k){return this._m.has(k)?this._m.get(k):null},
  setItem(k,v){this._m.set(k,String(v))},
  removeItem(k){this._m.delete(k)}
};

const Memory=require("./hunt-experience-memory.js");

Memory.clear();
Memory.record({
  type:"product_view",
  ts:"2026-09-18T08:00:00Z",
  provider:"HyperSKU",
  item_id:"hs-1",
  variant_id:"v1",
  category:"jewelry"
});
Memory.record({
  type:"save",
  ts:"2026-09-18T09:00:00Z",
  provider:"CJdropshipping",
  item_id:"cj-1",
  variant_id:"v2",
  category:"fashion"
});
Memory.record({
  type:"world_enter",
  ts:"2026-09-17T20:00:00Z",
  world:"Tokyo Night"
});

const rows=Memory.events();
assert.equal(rows.length,3);

const ctx=Memory.decisionContext(rows);
assert.equal(ctx.interactions,3);
assert.ok(ctx.recent_product_keys.includes("hypersku:hs-1:v1"));
assert.ok(ctx.recent_categories.includes("jewelry"));
assert.ok(ctx.recent_suppliers.includes("cjdropshipping"));

const groups=Memory.historyGroups(rows,new Date("2026-09-18T12:00:00Z"));
assert.equal(groups.today.length,2);
assert.equal(groups.yesterday.length,1);

assert.throws(()=>Memory.normalize({type:"unknown"}),/UNSUPPORTED_EVENT_TYPE/);

Memory.clear();
assert.equal(Memory.events().length,0);

console.log("HUNT Experience Memory tests: PASS");
