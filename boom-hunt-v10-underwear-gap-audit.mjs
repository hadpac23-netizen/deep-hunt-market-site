import fs from "fs";

const SUPPLEMENT="evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json";
const EPROLO="evidence/HUNT-EPROLO-MEN-WOMEN-DEEP-SHIPPING-VERIFY-2026-09-23.json";
const CJSEL="evidence/HUNT-CJ-THIN-RAIL-SELECTION-2026-09-23.json";
const CJVER="evidence/HUNT-CJ-THIN-RAIL-VERIFY-2026-09-23.json";
const rails=["women/women-underwear","men/men-underwear","men/men-boxers"];
const adultOriented=/\b(erotic|fetish|sex toy)\b/i;

const supplement=JSON.parse(fs.readFileSync(SUPPLEMENT,"utf8"));
const ep=JSON.parse(fs.readFileSync(EPROLO,"utf8"));
const cs=JSON.parse(fs.readFileSync(CJSEL,"utf8"));
const cv=JSON.parse(fs.readFileSync(CJVER,"utf8"));

const current=Object.fromEntries(rails.map(rail=>{
  const rows=supplement.shelves?.[rail]||[];
  return [rail,{
    count:rows.length,
    adult_oriented_title_flags:rows.filter(p=>adultOriented.test(String(p.title||""))).map(p=>String(p.item_id)),
    market5_pass:rows.filter(p=>p.market5_all_pass===true).length,
    image_technical_pass:rows.filter(p=>p.image_technical_status==="PASS").length,
    final_profit_verified:rows.filter(p=>p.profit_truth?.final_profit_verified===true).length
  }];
}));

const ep4=(ep.results||[]).filter(p=>rails.includes(p.department+"/"+p.category)&&p.status==="VERIFIED_4_OF_4");
const cjSelected=(cs.products||[]).filter(p=>rails.includes(p.department+"/"+p.category));
const cjVerified=(cv.results||[]).filter(p=>rails.includes(p.department+"/"+p.category));

const out={
  version:"HUNT-V10-UNDERWEAR-REPO-AUDIT-V1",
  date:"2026-09-29",
  mode:"READ_ONLY_SHADOW",
  production_effect:false,
  current,
  stale_supplier_evidence:{
    eprolo_verified_4_of_4:ep4.map(p=>({item_id:p.item_id,rail:p.department+"/"+p.category,variant_id:p.exact_variant?.id||null})),
    cj_selected_count:cjSelected.length,
    cj_statuses:cjVerified.reduce((a,p)=>(a[p.status]=(a[p.status]||0)+1,a),{})
  },
  decision:"FRESH_OFFICIAL_API_REFRESH_REQUIRED_BEFORE_PROMOTION"
};
fs.writeFileSync("evidence/HUNT-V10-UNDERWEAR-REPO-AUDIT-2026-09-29.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));
