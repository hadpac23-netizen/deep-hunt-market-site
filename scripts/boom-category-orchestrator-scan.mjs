import fs from "node:fs/promises";
const BASE=(process.env.HUNT_BASE_URL||"https://deep-hunt-market.netlify.app").replace(/\/$/,"");
const now=()=>new Date().toISOString();
async function getText(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status+" "+url);return r.text();}
async function getJson(url){return JSON.parse(await getText(url));}
function departmentFor(slug){
  if(slug==="women"||slug.startsWith("women-"))return "women";
  if(slug==="men"||slug.startsWith("men-"))return "men";
  if(slug==="kids"||slug.startsWith("kids-")||slug==="baby"||slug.startsWith("baby-"))return "kids";
  if(["beauty","skincare","body-care","makeup","nails","hair","hair-tools","fragrance","beauty-tools"].includes(slug))return "beauty";
  if(["accessories","jewelry","jewelry-necklaces","jewelry-rings","jewelry-earrings","jewelry-bracelets","jewelry-ear-cuffs","jewelry-anklets","jewelry-brooches","jewelry-pendants","jewelry-sets","watches","bags","hats","belts","scarves","keychains","gloves","hair-accessories","headbands","hair-clips","bag-accessories","socks","sunglasses"].includes(slug))return "accessories";
  if(["tech","phone-cases","chargers-cables","power-banks","stands-holders","audio","wearables","wearable-accessories","smart-home","projectors","cameras","computer-accessories","electronics","gaming"].includes(slug))return "tech";
  if(["home","home-storage","cable-management","kitchen","kitchen-electric","lighting","sensor-lighting","air-care","portable-vacuums","bedding","bath","home-decor","drinkware","tools-diy","cleaning","small-appliances"].includes(slug))return "home";
  if(slug==="sports"||["fitness","outdoors","active-bottoms","sports-gear","sports-bags","cycling","fitness-accessories"].includes(slug))return "sports";
  if(slug==="pets"||slug.startsWith("pet-")||slug==="aquarium")return "pets";
  if(slug==="toys"||slug.endsWith("-toys"))return "toys";
  if(["travel","luggage","office","crafts","stationery","stickers","gifts","party"].includes(slug))return "travel-office-gifts";
  return "other";
}
function extractVisibleCategories(source){
  const marker="const departmentSubcategories = ";
  const start=source.indexOf(marker);if(start<0)return {};
  const brace=source.indexOf("{",start);if(brace<0)return {};
  let depth=0,end=-1,inString=false,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(inString){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch==='"')inString=false;continue;}
    if(ch==='"'){inString=true;continue;}
    if(ch==="{")depth++; else if(ch==="}"){depth--;if(depth===0){end=i+1;break;}}
  }
  if(end<0)return {};
  try{return JSON.parse(source.slice(brace,end));}catch{return {}}
}
const [manifest,coreSource,eproloMap]=await Promise.all([
  getJson(BASE+"/catalog-manifest.json?boom_category="+Date.now()),
  getText(BASE+"/market-core.js?boom_category="+Date.now()),
  getJson(BASE+"/eprolo-category-map.json?boom_category="+Date.now()).catch(()=>({gap_first_targets:[]}))
]);
const visibleMap=extractVisibleCategories(coreSource);
const visible=[...new Set(Object.values(visibleMap).flat())];
const counts=manifest?.categories||{};
const empty=visible.filter(slug=>Number(counts[slug]?.count||0)<=0);
const thin=visible.filter(slug=>{const n=Number(counts[slug]?.count||0);return n>0&&n<5;});
const shallow=visible.filter(slug=>{const n=Number(counts[slug]?.count||0);return n>=5&&n<15;});
const missingManifest=visible.filter(slug=>!counts[slug]);
const gapPriority=[...new Set(eproloMap?.gap_first_targets||[])];
const supplierGaps=gapPriority.map(slug=>({slug,count:Number(counts[slug]?.count||0),visible:visible.includes(slug)})).filter(x=>x.count<15);
const departments={};
for(const slug of visible){
  const dep=departmentFor(slug);
  const n=Number(counts[slug]?.count||0);
  const row=departments[dep]||(departments[dep]={department:dep,categories:0,clean_inventory_rows:0,empty:[],thin:[],shallow:[]});
  row.categories++;row.clean_inventory_rows+=n;
  if(n<=0)row.empty.push(slug);else if(n<5)row.thin.push(slug);else if(n<15)row.shallow.push(slug);
}
const department_reports=Object.values(departments).map(d=>({
  manager_id:({"kids":"dept-kids-baby","accessories":"dept-jewelry-accessories","travel-office-gifts":"dept-travel-office-gifts"}[d.department]||"dept-"+d.department),
  timestamp:now(),scope:["department",d.department],
  status:d.empty.length?"blocked":d.thin.length?"watch":"healthy",
  evidence:["visible_categories="+d.categories,"category_inventory_rows="+d.clean_inventory_rows],
  metrics:{categories:d.categories,category_inventory_rows:d.clean_inventory_rows,empty:d.empty.length,thin:d.thin.length,shallow:d.shallow.length},
  issues:[...d.empty.map(x=>"empty visible category: "+x),...d.thin.map(x=>"thin category: "+x)],
  opportunity:d.shallow.length?"Strengthen shallow categories: "+d.shallow.slice(0,8).join(", "):"Maintain category depth and rotation.",
  recommended_action:d.empty.length?"Hide empty categories and source verified replacements.":d.thin.length?"Keep thin categories discovery-first and source gaps.":"Continue dynamic merchandising.",
  action_class:d.empty.length?"SAFE_DYNAMIC":d.thin.length?"PROPOSE":"OBSERVE",owner_approval_required:false,confidence:0.96,
  expected_impact:d.empty.length?"high":d.thin.length?"medium":"low",risk_if_ignored:d.empty.length?"Visible empty shelves damage trust.":d.thin.length?"Thin assortment can make HUNT feel incomplete.":"Low.",
  recheck_at:new Date(Date.now()+30*60*1000).toISOString(),fallback:"Keep category discovery-only until verified depth improves."
}));
const issues=[
  ...missingManifest.map(x=>"visible category missing from manifest: "+x),
  ...empty.map(x=>"visible empty category: "+x),
  ...thin.map(x=>"visible thin category (<5): "+x)
];
const status=missingManifest.length||empty.length?"blocked":thin.length?"watch":"healthy";
const report={
  manager_id:"category-orchestrator",timestamp:now(),scope:["taxonomy","category_depth","gap_detection","department_health"],status,
  evidence:["visible_subcategories="+visible.length,"manifest_categories="+Object.keys(counts).length,"supplier_gap_priorities="+gapPriority.length],
  metrics:{visible_subcategories:visible.length,manifest_categories:Object.keys(counts).length,empty_visible:empty.length,thin_visible:thin.length,shallow_visible:shallow.length,supplier_gaps_under_15:supplierGaps.length},
  issues,opportunity:supplierGaps.length?"Supplier gap-fill targets: "+supplierGaps.slice(0,12).map(x=>x.slug+"("+x.count+")").join(", "):"No urgent supplier gap target under current threshold.",
  recommended_action:status==="blocked"?"Hide empty/missing visible categories and source verified depth before promotion.":status==="watch"?"Keep thin categories discovery-first and prioritize gap fill.":"Continue dynamic category rotation.",
  action_class:status==="blocked"?"SAFE_DYNAMIC":status==="watch"?"PROPOSE":"OBSERVE",owner_approval_required:false,confidence:0.97,
  expected_impact:status==="blocked"?"high":status==="watch"?"medium":"low",risk_if_ignored:status==="blocked"?"Empty visible shelves can damage shopper trust.":status==="watch"?"Thin categories can make the store feel incomplete.":"Low.",
  recheck_at:new Date(Date.now()+30*60*1000).toISOString(),fallback:"Keep low-depth categories in Discovery until verified inventory improves.",
  details:{empty,thin,shallow,supplierGaps,department_reports}
};
const out=process.env.BOOM_CATEGORY_REPORT_PATH||"boom-category-report.json";
await fs.writeFile(out,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(status==="blocked")process.exitCode=2;else if(status==="watch")process.exitCode=1;