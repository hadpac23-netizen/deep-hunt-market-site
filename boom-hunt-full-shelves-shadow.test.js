const fs=require("fs"),assert=require("assert");
const e=JSON.parse(fs.readFileSync("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json","utf8"));
const routing=JSON.parse(fs.readFileSync("boom-hunt-taxonomy-stylist-routing-contract.json","utf8"));
const html=fs.readFileSync("boom-hunt-full-shelves-shadow-v1.html","utf8");
const integration=JSON.parse(fs.readFileSync("boom-hunt-cinematic-stylist-integration-contract.json","utf8"));

assert.equal(e.version,"HUNT-FULL-SHELVES-PROFIT-FILL-SHADOW-V2");
assert.equal(e.mode,"FULL_VISUAL_SHADOW_PREVIEW");
assert.equal(e.production_effect,false);
assert.equal(e.summary.canonical_departments,17);
assert.equal(e.departments.length,17);
assert.equal(e.summary.checkout_live,0);
assert.equal(e.summary.payment_live,0);
assert.equal(e.summary.fulfillment_live,0);
assert.equal(e.summary.final_profit_verified_products,0);
assert(e.summary.globally_unique_products>=5182);
assert.equal(e.summary.projected_product_contribution_checked+e.summary.provisional_catalog_price_projections,e.summary.globally_unique_products);
assert(e.summary.category_rails>=132);

const deptSlugs=e.departments.map(x=>x.slug);
assert.equal(new Set(deptSlugs).size,17);
assert.deepEqual(deptSlugs,[
  "women","men","kids","beauty","accessories","tech","home","kitchen","electrical",
  "camping","garden","sports","pets","toys","travel","office","gifts"
]);

const seen=new Map();
let cards=0,rails=0,empty=0,full=0,good=0,thin=0;
for(const d of e.departments){
  assert(d.category_rails>0,d.slug+" must expose canonical category rails");
  for(const c of d.categories){
    rails++;
    assert.equal(c.products.length,c.clean_candidate_count);
    if(c.clean_candidate_count===0)empty++;
    else if(c.clean_candidate_count>=24)full++;
    else if(c.clean_candidate_count>=12)good++;
    else thin++;
    for(const p of c.products){
      cards++;
      assert.equal(p.department,d.slug);
      assert.equal(p.category,c.slug);
      assert.equal(p.production_exposure,false);
      assert.equal(p.availability_verified,true);
      assert(p.image_url);
      assert(p.profit_truth);
      assert.equal(p.profit_truth.final_profit_verified,false);
      if(p.profit_truth.state==="PROJECTED_PRODUCT_CONTRIBUTION_ONLY"){
        assert(Number(p.profit_truth.projected_product_contribution_usd)>=4.0);
        assert(Number(p.profit_truth.projected_product_margin)>=0.35);
      } else {
        assert.equal(p.profit_truth.state,"PROVISIONAL_CATALOG_PRICE_PROJECTION");
      }
      const key=p.provider+":"+p.item_id;
      assert(!seen.has(key),key+" duplicated across "+seen.get(key)+" and "+d.slug+"/"+c.slug);
      seen.set(key,d.slug+"/"+c.slug);
    }
  }
}
assert.equal(rails,e.summary.category_rails);
assert.equal(cards,e.summary.total_category_occurrences);
assert.equal(seen.size,e.summary.globally_unique_products);
assert.equal(empty,e.summary.rails_empty);
assert.equal(full,e.summary.rails_full_24);
assert.equal(good,e.summary.rails_good_12_to_23);
assert.equal(thin,e.summary.rails_thin_1_to_11);

const cj=[...seen.keys()].filter(k=>k.startsWith("CJdropshipping:"));
assert(cj.length>=39);
assert.equal(e.summary.provisional_catalog_price_projections,cj.length-39);
assert(e.summary.gate_ready_final_profit_recheck_products>=39);

assert.equal(routing.current_state.canonical_departments,17);
assert.equal(integration.current_state.production_authority,false);
assert(html.includes("FULL SHELVES · BOOM STYLIST · SHADOW ONLY"));
assert(html.includes("Load 24 more"));
assert(html.includes("no cross-department filler"));
assert(html.includes('fetch("./evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json")'));
console.log("PASS boom-hunt-full-shelves-profit-fill-shadow-v2");
