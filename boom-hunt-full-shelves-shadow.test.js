const fs=require("fs"),assert=require("assert");
const e=JSON.parse(fs.readFileSync("evidence/HUNT-FULL-SHELVES-STYLIST-SHADOW-2026-09-23.json","utf8"));
const routing=JSON.parse(fs.readFileSync("boom-hunt-taxonomy-stylist-routing-contract.json","utf8"));
const html=fs.readFileSync("boom-hunt-full-shelves-shadow-v1.html","utf8");
const integration=JSON.parse(fs.readFileSync("boom-hunt-cinematic-stylist-integration-contract.json","utf8"));

assert.equal(e.version,"HUNT-FULL-SHELVES-STYLIST-SHADOW-V1");
assert.equal(e.mode,"FULL_VISUAL_SHADOW_PREVIEW");
assert.equal(e.production_effect,false);
assert.equal(e.summary.canonical_departments,17);
assert.equal(e.summary.departments_with_products,17);
assert.equal(e.summary.globally_unique_routed_products,5182);
assert.equal(e.summary.category_rails,132);
assert.equal(e.summary.initial_shown_product_cards,1679);
assert.equal(e.summary.total_browsable_product_cards,5182);
assert.equal(e.summary.production_live_products,0);
assert.equal(e.summary.cj_verified_4_market_products,39);
assert.equal(e.summary.verified_truth_products_available,54);
assert.equal(e.departments.length,17);
const cjVerified=e.departments.flatMap(d=>d.categories.flatMap(c=>c.products)).filter(p=>p.truth_state==="CJ_VERIFIED_4_MARKETS");
assert.equal(cjVerified.length,39);
assert(cjVerified.every(p=>Array.isArray(p.markets_verified)&&p.markets_verified.length===4));
assert(cjVerified.every(p=>p.final_profit_verified===false));
const laundry=e.departments.find(d=>d.slug==="home")?.categories.find(c=>c.slug==="laundry");
assert(laundry,"home/laundry rail must exist");
assert.equal(laundry.clean_candidate_count,1);
assert.equal(laundry.products[0].item_id,"2411110427421627400");

const deptSlugs=e.departments.map(x=>x.slug);
assert.equal(new Set(deptSlugs).size,17);
assert.deepEqual(deptSlugs,[
  "women","men","kids","beauty","accessories","tech","home","kitchen","electrical",
  "camping","garden","sports","pets","toys","travel","office","gifts"
]);

const seen=new Map();
let cards=0,rails=0;
for(const d of e.departments){
  assert(d.clean_candidate_count>0, d.slug+" must have candidates");
  assert(d.category_rails>0, d.slug+" must have category rails");
  for(const c of d.categories){
    rails++;
    assert(c.clean_candidate_count>0);
    assert(c.products.length===c.clean_candidate_count);
    for(const p of c.products){
      cards++;
      assert.equal(p.department,d.slug);
      assert.equal(p.category,c.slug);
      assert.equal(p.production_exposure,false);
      assert.equal(p.availability_verified,true);
      assert(p.image_url);
      const key=p.provider+":"+p.item_id;
      assert(!seen.has(key),key+" duplicated across "+seen.get(key)+" and "+d.slug+"/"+c.slug);
      seen.set(key,d.slug+"/"+c.slug);
    }
  }
}
assert.equal(rails,132);
assert.equal(cards,5182);
assert.equal(seen.size,5182);

assert.equal(routing.current_state.canonical_departments,17);
assert.equal(routing.current_state.taxonomy_review_products,0);
assert.equal(integration.current_state.production_authority,false);
assert(html.includes("FULL SHELVES · BOOM STYLIST · SHADOW ONLY"));
assert(html.includes("Cinematic first."));
assert(html.includes("Load 24 more"));
assert(html.includes("no cross-department filler"));
assert(!html.includes('class="grid"'));
console.log("PASS boom-hunt-full-shelves-shadow-v1");
