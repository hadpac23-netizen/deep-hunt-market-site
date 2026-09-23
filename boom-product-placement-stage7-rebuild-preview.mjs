import fs from "fs";
const BASE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE6-REBUILD-PREVIEW-2026-09-23.json";
const EMPTY="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-EMPTY-RECOVERY-2026-09-23.json";
const WAVEA="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-A-2026-09-23.json";
const WAVEB="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-B-2026-09-23.json";
const WAVEC="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-THIN-RECOVERY-WAVE-C-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE7-REBUILD-PREVIEW-2026-09-23.json";
const base=JSON.parse(fs.readFileSync(BASE,"utf8"));
const empty=JSON.parse(fs.readFileSync(EMPTY,"utf8"));
const wavea=JSON.parse(fs.readFileSync(WAVEA,"utf8"));
const waveb=JSON.parse(fs.readFileSync(WAVEB,"utf8"));
const wavec=JSON.parse(fs.readFileSync(WAVEC,"utf8"));
const add=new Map();
const ids=new Set();
for(const src of [empty,wavea,waveb,wavec]){
  for(const x of src.results||[]){
    if(x.recovery_state!=="KEEP")continue;
    const key=x.provider+":"+x.item_id;
    if(ids.has(key))continue;
    ids.add(key);
    add.set(x.current_rail,(add.get(x.current_rail)||0)+1);
  }
}
const rails=(base.rails||[]).map(r=>{
  const recovered=add.get(r.rail)||0;
  const count=(r.count||0)+recovered;
  const state=count>=24?"FULL":count>=12?"GOOD":count>0?"THIN":"EMPTY";
  return {...r,stage7_recovered_keep:recovered,count,state};
});
const recovered=ids.size;
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE7-REBUILD-PREVIEW-V3-WAVE-C",
  date:"2026-09-23",mode:"SHADOW_PREVIEW_ONLY",production_effect:false,
  summary:{
    source_products:base.summary?.source_products||0,
    canonical_products:(base.summary?.canonical_products||0)+recovered,
    stage7_recovered_keep:recovered,
    rails_full_24:rails.filter(x=>x.state==="FULL").length,
    rails_good_12_to_23:rails.filter(x=>x.state==="GOOD").length,
    rails_thin_1_to_11:rails.filter(x=>x.state==="THIN").length,
    rails_empty:rails.filter(x=>x.state==="EMPTY").length
  },
  rules:[
    "Stage7 adds only high-confidence KEEP recovery from Stage6 quarantine.",
    "No Stage6 safe move is overridden.",
    "REVIEW/UNKNOWN/HOLD remain quarantined.",
    "No new supplier inventory is counted yet.",
    "Profit Gate runs only after placement truth."
  ],
  recovered_rails:rails.filter(x=>x.stage7_recovered_keep>0),
  empty_rails:rails.filter(x=>x.state==="EMPTY"),
  thin_rails:rails.filter(x=>x.state==="THIN"),
  rails
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
console.log("EMPTY",out.empty_rails.map(x=>x.rail).join(", "));
console.log("NEW GOOD",out.recovered_rails.filter(x=>x.state==="GOOD").map(x=>x.rail+"="+x.count).join(", "));
