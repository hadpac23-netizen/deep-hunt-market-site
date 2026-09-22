import fs from "node:fs";

const training=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-2026-09-22.json","utf8"));
const baseline=JSON.parse(fs.readFileSync("evidence/HUNT-F35-SIX-LAYER-PREFERENCE-BASELINE-2026-09-22.json","utf8"));
const catalog=JSON.parse(fs.readFileSync("catalog-home.json","utf8"));

const byId=new Map(training.products.map(p=>[Number(p.product_id),p]));
const shelfDefs=[
  {
    id:"STYLE_STATEMENT",
    title:"Style Statement",
    focus:["TREND","IDENTITY","PREMIUM_CRAFT"],
    ids:[1628,388,1590,458,507,630],
    roles:["hero","anchor","support","accessory","complete_the_look","discovery"]
  },
  {
    id:"PREMIUM_EDIT",
    title:"Premium Edit",
    focus:["PREMIUM_CRAFT","FUNCTION","CONSCIOUS_LONG_LIFE","VALUE"],
    ids:[531,770,655,1586,638,918],
    roles:["hero","anchor","support","premium_step_up","support","discovery"]
  },
  {
    id:"EVERYDAY_TECH_GIFT",
    title:"Everyday Tech + Gift",
    focus:["FUNCTION","IDENTITY","VALUE"],
    ids:[181,605,681,583,946,403],
    roles:["hero","anchor","premium_step_up","support","entry_price","entry_price"]
  },
  {
    id:"HOME_TRAVEL_DISCOVERY",
    title:"Home + Travel Discovery",
    focus:["FUNCTION","IDENTITY","CONSCIOUS_LONG_LIFE","VALUE"],
    ids:[924,83,89,279,262,938],
    roles:["hero","anchor","support","premium_step_up","support","entry_price"]
  }
];

const proposals=shelfDefs.map(def=>({
  ...def,
  products:def.ids.map((id,i)=>{
    const p=byId.get(id);
    if(!p)throw new Error("Missing verified training product "+id);
    return {
      provider:p.provider,
      product_id:p.product_id,
      title:p.title,
      variant_id:p.variant_id,
      verified_markets:p.verified_markets,
      role:def.roles[i],
      production_effect:false
    };
  })
}));

const currentShelves=Object.entries(catalog.shelves||{}).map(([name,items])=>{
  const verified=items.filter(x=>x.availability_verified===true).length;
  const checkoutVerified=items.filter(x=>/CHECKOUT.*VERIFIED|VERIFIED.*CHECKOUT/i.test(String(x.checkout_status||""))).length;
  return {
    shelf:name,
    entries:items.length,
    availability_verified:verified,
    availability_verified_rate:items.length?Number((verified/items.length).toFixed(4)):0,
    checkout_verified:checkoutVerified
  };
});
const weak=currentShelves.filter(x=>x.entries>0&&x.availability_verified_rate<0.25).sort((a,b)=>a.availability_verified_rate-b.availability_verified_rate);
const trainingTitles=training.products.map(p=>p.title.toLowerCase());
const assortment={
  footwear:trainingTitles.filter(x=>/shoe|sneaker|boot|sandal|slipper/.test(x)).length,
  bottoms:trainingTitles.filter(x=>/short|pant|trouser|jean|skirt/.test(x)).length,
  tops:trainingTitles.filter(x=>/shirt|hoodie|sweatshirt|jersey|pullover/.test(x)).length,
  accessories:trainingTitles.filter(x=>/cap|hat|beanie|bandana|bag|tag|case/.test(x)).length
};

const result={
  version:"BOOM-STYLIST-F35-ROUND1-V1",
  mode:"SHADOW_EXAM",
  production_effect:false,
  generated_at:new Date().toISOString(),
  survey_exam:{
    id:"DEPARTMENT-6-LAYER-SURVEY",
    status:baseline.departments.length===17&&baseline.layers.length===6?"OBJECTIVE_COVERAGE_PASS":"BLOCKED",
    department_coverage:baseline.departments.length,
    preference_layers:baseline.layers.length,
    limitation:"External directional baseline only; not yet HUNT first-party preference truth."
  },
  style_exam:{
    id:"STYLE-20-5",
    status:(assortment.footwear>=3&&assortment.bottoms>=5)?"READY_FOR_STYLE_JUDGING":"BLOCKED_ASSORTMENT_GAP",
    assortment,
    reason:"A valid five-look exam needs enough complementary categories; current verified Printful set is top/accessory heavy."
  },
  shelf_exam:{
    id:"SHELF-24",
    status:"SHADOW_COMPOSITION_READY_FOR_VISUAL_QA",
    verified_products_used:proposals.reduce((n,s)=>n+s.products.length,0),
    shelves:proposals,
    pass_claimed:false,
    reason:"Truth and composition constraints pass; visual hierarchy/style quality still require review."
  },
  combined_exam:{
    id:"COMBINED-LOOK-SHELF",
    status:"BLOCKED_UNTIL_STYLE_EXAM",
    pass_claimed:false
  },
  current_hunt_comparison:{
    snapshot_visible_products:catalog.visible_product_count,
    snapshot_shelf_entries:catalog.shelf_entry_count,
    shelves_measured:currentShelves.length,
    shelves_below_25pct_availability_verified:weak.length,
    weakest_shelves:weak.slice(0,20),
    use_as_training_truth:false,
    use_as_qa_counterexample:true
  },
  round_status:"PARTIAL_PASS_SURVEY_SHELF_STYLE_BLOCKED",
  mastery_change:false,
  next:[
    "Expand verified assortment for footwear, bottoms and complete-look categories.",
    "Run visual QA on the 24-product shadow shelf composition.",
    "Collect Owner feedback on shelf hierarchy and preference-layer balance.",
    "Do not change Production shelves."
  ]
};
fs.writeFileSync("evidence/HUNT-STYLIST-F35-ROUND1-2026-09-22.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({
  round_status:result.round_status,
  survey:result.survey_exam.status,
  style:result.style_exam.status,
  shelf:result.shelf_exam.status,
  used:result.shelf_exam.verified_products_used,
  weak_shelves:result.current_hunt_comparison.shelves_below_25pct_availability_verified,
  assortment
},null,2));
