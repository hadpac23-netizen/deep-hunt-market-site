import fs from "fs";

const GATE="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-P0-BELT-GATE-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-BELT-VISUAL-QA-2026-09-23.json";

const approvedIds=[
  "24417191","26768012","26768011","26767971","26768005","26776035","26776036"
];

const gate=JSON.parse(fs.readFileSync(GATE,"utf8"));
const rows=new Map((gate.results||[]).map(x=>[String(x.item_id),x]));
const missing=[];
const failed=[];
for(const id of approvedIds){
  const r=rows.get(id);
  if(!r){missing.push(id);continue;}
  if(r.state!=="SHADOW_ADMISSION_CANDIDATE")failed.push({id,state:r.state,reasons:r.reasons||[]});
}
if(missing.length||failed.length){
  throw new Error("Belt visual checkpoint invalid: "+JSON.stringify({missing,failed}));
}
const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-BELT-VISUAL-QA-V1",
  date:"2026-09-23",
  mode:"SHADOW_MANUAL_VISUAL_QA",
  production_effect:false,
  summary:{visually_approved:approvedIds.length,visual_review:0},
  approved_item_ids:approvedIds,
  rules:[
    "All seven products were visually reviewed in a contact sheet and are belts as the primary product.",
    "This generator revalidates that every visually approved item still passes the Stage8 technical Belt Gate.",
    "Visual PASS does not imply Final Net Profit Verified.",
    "No Production mutation or supplier order."
  ]
};
fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary));
