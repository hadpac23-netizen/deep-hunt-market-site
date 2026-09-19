const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const tower=fs.readFileSync("boom-profit-feed-control-tower.js","utf8");

for(const token of [
  'id="bg-control-state"',
  'id="bg-control-stats"',
  'id="bg-control-states"',
  'id="bg-control-reasons"',
  'boom-profit-feed-control-tower.js?v=m035'
]) assert(html.includes(token),"M03.5 UI missing: "+token);

for(const token of [
  "controlRows",
  "controlSummary",
  "renderControlTower",
  "supplier_cost_per_unit",
  "refund_reserve",
  "payment_reserve",
  "max_safe_cac",
  "EXECUTION OFF"
]) assert(js.includes(token),"M03.5 Growth contract missing: "+token);

for(const token of [
  "PROMOTE_CANDIDATE",
  "TEST_CANDIDATE",
  "SCALE_CANDIDATE",
  "creator_commission",
  "affiliate_commission",
  "chargeback_reserve",
  "support_cost",
  "execute:false",
  "execute_actions:false",
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(tower.includes(token),"M03.5 control guard missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(tower),"Control Tower core must never execute external actions");
console.log("boom_m035_control_tower_contract=PASS");
