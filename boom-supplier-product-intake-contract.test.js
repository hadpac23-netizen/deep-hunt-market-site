const fs=require("fs"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-supplier-product-intake-contract.json","utf8"));
assert.equal(c.brain,"commerce_truth_brain");
assert.equal(c.source_of_truth.partner_candidate.access,"SERVER_ONLY_RLS");
assert.equal(c.boundaries.supplier_order,false);
assert.equal(c.boundaries.invented_stock,false);
assert(c.stages.includes("unit_economics"));
assert(c.pass_requirements.some(x=>/profit gate/i.test(x)));
console.log("Supplier intake contract: PASS — truth gates, existing stores, no order/publish");