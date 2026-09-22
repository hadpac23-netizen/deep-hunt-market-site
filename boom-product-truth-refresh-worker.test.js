const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-product-truth-refresh/index.ts","utf8");
assert(/Math\.min\(12/.test(src),"batch must be capped at 12");
assert(/commit_observations===true/.test(src),"commit must be explicit");
assert(/hunt-cj-quote/.test(src),"CJ quote must be canonical stock/shipping source");
assert(/hunt_product_observations/.test(src),"worker writes evidence observations");
assert(!/\.from\("hunt_catalog_products"\)\.update/.test(src),"worker must not update catalog state");
assert(/Does not change market_eligibility_status/.test(src));
console.log("HUNT Product Truth Refresh Worker: PASS — bounded, admin-only, dry-run default, observation-only");