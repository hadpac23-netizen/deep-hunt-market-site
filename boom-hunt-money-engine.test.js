const fs=require("fs"),vm=require("vm"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-hunt-money-engine-contract.json","utf8"));
assert.equal(contract.authority,"NONE");
assert.equal(contract.production_effect,false);
assert(contract.audit_reuse_extend.reused.includes("boom-profit-engine-contract.json"));
assert(contract.hard_rules.some(x=>/Projected contribution never becomes realized/i.test(x)));
assert.equal(contract.prompt_refs.length,3);

const src=fs.readFileSync("boom-hunt-money-engine.js","utf8");
const ctx={window:{},Math,Number};vm.createContext(ctx);vm.runInContext(src,ctx);
const M=ctx.window.BoomHuntMoneyEngine;

let r=M.evaluateRoute({});
assert.equal(r.status,"UNKNOWN");
assert(r.blockers.includes("destination"));
assert.equal(r.material_action_authorized,false);

const base={
  route_id:"r1",destination:"DE",supplier:"S1",warehouse:"EU",shipping_method:"tracked",
  sale_price:32,customer_shipping_revenue:0,supplier_cost:10,supplier_shipping_cost:4,
  payment_fees:1,fx_cost:0.2,tax_import_cost:1,discount_cost:0,affiliate_creator_cost:0,
  marketing_cost:2,expected_return_refund_cost:1,other_variable_cost:0.5,
  product_truth_verified:true,stock_verified:true,shipping_quote_verified:true
};
r=M.evaluateRoute(base);
assert.equal(r.status,"PASS");
assert.equal(r.projected_contribution,12.3);
assert.equal(r.verified_profit_value,null);
assert.equal(r.material_action_authorized,false);

const bad=M.evaluateRoute({...base,sale_price:15});
assert.equal(bad.status,"REJECT");

const density=M.contributionDensity({
  projected_contribution:10,
  supplier_shipping_cost:4,
  chargeable_weight_kg:0.5,
  acquisition_cost:2,
  acquisition_cost_verified:true
});
assert.equal(density.contribution_density.per_shipping_dollar,2.5);
assert.equal(density.contribution_density.per_chargeable_kg,20);
assert.equal(density.contribution_density.per_acquisition_dollar,5);

const unknownRole=M.classifyMoneyRole({performance_verified:false});
assert.equal(unknownRole.status,"UNKNOWN");
assert.deepEqual(Array.from(unknownRole.money_roles),["UNKNOWN"]);

const role=M.classifyMoneyRole({
  performance_verified:true,traffic_value:82,basket_value:66,verified_profit_value:12,
  retention_value:30,shipping_sponsor_verified:true
});
assert.equal(role.status,"PASS");
assert(role.money_roles.includes("TRAFFIC_PRODUCT"));
assert(role.money_roles.includes("PROFIT_PRODUCT"));
assert(role.money_roles.includes("BASKET_BUILDER"));
assert(role.money_roles.includes("SHIPPING_SPONSOR"));

const chosen=M.chooseRoute([base,{...base,route_id:"r2",supplier_shipping_cost:6}]);
assert.equal(chosen.selected_route_id,"r1");
assert.equal(chosen.requires_owner_gate,true);
assert.equal(chosen.material_action_authorized,false);

console.log("HUNT Money Engine: PASS — fail-closed route economics, density, evidence-backed roles, shadow route choice and Owner Gate enforced");