import fs from "fs";

const GATE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-MEDIA-PROFIT-GATE-2026-09-23.json";
const BASE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-FINAL-PREVIEW-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SELECTION-2026-09-23.json";

const gate=JSON.parse(fs.readFileSync(GATE,"utf8"));
const base=JSON.parse(fs.readFileSync(BASE,"utf8"));
const countByRail=new Map((base.rails||[]).map(x=>[x.rail,x.count||0]));

function tokens(title){
  const stop=new Set(["new","fashion","casual","men","mens","men's","women","womens","women's","bag","bags","pet","for","with","and","the","a","of","large","small"]);
  return new Set(String(title||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").split(/\s+/).filter(x=>x.length>2&&!stop.has(x)));
}
function jaccard(a,b){
  const A=tokens(a),B=tokens(b);
  if(!A.size||!B.size)return 0;
  let inter=0;for(const x of A)if(B.has(x))inter++;
  return inter/(A.size+B.size-inter);
}
function rank(a,b){
  return (b.projected_contribution_min_usd-a.projected_contribution_min_usd) ||
         (b.projected_margin_min-a.projected_margin_min) ||
         (Math.min(b.media_technical.width||0,b.media_technical.height||0)-Math.min(a.media_technical.width||0,a.media_technical.height||0)) ||
         String(a.item_id).localeCompare(String(b.item_id));
}

const byRail={};
for(const r of gate.results||[]){
  if(r.stage8_gate!=="PASS")continue;
  (byRail[r.rail]??=[]).push(r);
}
const selected=[];
const selectionByRail={};
for(const [rail,rows0] of Object.entries(byRail)){
  const existing=countByRail.get(rail)||0;
  const capacity=Math.max(0,24-existing);
  const rows=[...rows0].sort(rank);
  const keep=[];
  const deferred=[];
  for(const r of rows){
    if(keep.length>=capacity)break;
    const maxSim=keep.reduce((m,k)=>Math.max(m,jaccard(k.title,r.title)),0);
    if(maxSim<0.82)keep.push({...r,selection_reason:"STAGE8_PASS_DIVERSITY_GUARD"});
    else deferred.push({...r,deferred_reason:"NEAR_DUPLICATE_TITLE"});
  }
  // Fill remaining capacity only if diversity guard was too strict.
  for(const r of deferred){
    if(keep.length>=capacity)break;
    keep.push({...r,selection_reason:"STAGE8_PASS_CAPACITY_FILL"});
  }
  selected.push(...keep);
  selectionByRail[rail]={
    existing_count:existing,
    pass_candidates:rows.length,
    selected:keep.length,
    deferred:Math.max(0,rows.length-keep.length),
    resulting_count:existing+keep.length,
    resulting_state:existing+keep.length>=24?"FULL":existing+keep.length>=12?"GOOD":existing+keep.length>0?"THIN":"EMPTY"
  };
}

const summary={
  stage8_gate_pass_input:(gate.results||[]).filter(x=>x.stage8_gate==="PASS").length,
  selected_products:selected.length,
  selected_rails:Object.keys(selectionByRail).length,
  final_net_profit_verified_products:0,
  production_effect:false
};
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-P0-SELECTION-V1",
  date:"2026-09-23",mode:"SHADOW_SELECTION_ONLY",production_effect:false,
  summary,selection_by_rail:selectionByRail,selected,
  rules:[
    "Only Stage8 gate PASS products are eligible.",
    "Selection never exceeds the 24-product FULL threshold for a rail.",
    "A title-diversity guard reduces near-duplicate shelf fill where possible.",
    "Projected contribution is not Final Net Profit.",
    "No Production mutation or supplier order."
  ]
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
for(const [rail,s] of Object.entries(selectionByRail))console.log("RAIL",rail,s);
