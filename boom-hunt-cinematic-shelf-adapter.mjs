import fs from "node:fs";

const visual=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-CURRENT-LOOK-VISUAL-MAP-2026-09-22.json","utf8"));
const training=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-V4-IL-2026-09-22.json","utf8"));
const q4=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-F35-VISUAL-QA-ROUND4-2026-09-22.json","utf8"));
const two=JSON.parse(fs.readFileSync("evidence/HUNT-STYLIST-TWO-THEME-LOOK-BOARD-QA-2026-09-22.json","utf8"));

const byId=new Map(training.products.map(x=>[String(x.product_id),x]));
const sceneMeta={
  "LOOK-01":{world:"women",title:"Neutral Street",eyebrow:"CASUAL STREET",layers:["TREND","IDENTITY","FUNCTION"]},
  "LOOK-02":{world:"women",title:"Relaxed Smart",eyebrow:"SMART CASUAL",layers:["FUNCTION","PREMIUM_CRAFT","IDENTITY"]},
  "LOOK-03":{world:"women",title:"Weekend Contrast",eyebrow:"WEEKEND",layers:["TREND","IDENTITY","FUNCTION"]},
  "LOOK-04":{world:"men",title:"Quiet Smart",eyebrow:"SMART CASUAL",layers:["FUNCTION","PREMIUM_CRAFT","VALUE"]},
  "LOOK-05":{world:"men",title:"Weekend Signal",eyebrow:"WEEKEND",layers:["FUNCTION","TREND","IDENTITY"]}
};
const roleRank={top:1,bottom:2,footwear:3,accessory:4,bag:5,tech:5};

const scenes=visual.looks.map(look=>{
  const meta=sceneMeta[look.id]||{world:look.audience,title:look.id,eyebrow:look.occasion,layers:["FUNCTION","IDENTITY"]};
  const items=look.items.map(item=>{
    const truth=byId.get(String(item.product_id))||{};
    const highShipping=truth.commercial_training_flag==="HIGH_SHIPPING_BURDEN";
    const exactArtwork=item.provider!=="Printful";
    return {
      ...item,
      sort_order:roleRank[item.role]||9,
      product_truth_il:Array.isArray(item.verified_markets)&&item.verified_markets.includes("IL"),
      exact_artwork_ready:exactArtwork,
      commercial_training_flag:truth.commercial_training_flag||"GLOBAL_SOURCE",
      shipping_il_usd:Number.isFinite(Number(truth.shipping_il_usd))?Number(truth.shipping_il_usd):null,
      retail_price_usd:Number.isFinite(Number(truth.retail_price_usd))?Number(truth.retail_price_usd):null,
      high_shipping_burden:highShipping
    };
  }).sort((a,b)=>a.sort_order-b.sort_order);
  const hero=items.find(x=>x.role==="top")||items[0];
  const support=items.filter(x=>x.product_id!==hero.product_id);
  const truthPass=items.every(x=>x.product_truth_il);
  const displayPass=two.gate_state?.silhouette_display_qa==="PASS_BOTH_THEMES";
  const exactArtwork=items.every(x=>x.exact_artwork_ready);
  const highShipping=items.filter(x=>x.high_shipping_burden);
  const styleState=(q4.looks.find(x=>x.id===look.id)||{}).status||"PENDING";
  return {
    scene_id:look.id,
    world:meta.world,
    title:meta.title,
    eyebrow:meta.eyebrow,
    preference_layers:meta.layers,
    hero:{...hero,hero_mode:"SHADOW_VISUAL_HERO"},
    rail:support,
    gates:{
      product_truth:truthPass?"PASS":"BLOCKED",
      style_fit:String(styleState).startsWith("PASS")?"PASS":"REVIEW",
      display_light:displayPass?"PASS":"BLOCKED",
      display_dark:displayPass?"PASS":"BLOCKED",
      exact_artwork:exactArtwork?"PASS":"PENDING_PRINTFUL",
      commercial_fit:highShipping.length?"HOLD_HIGH_SHIPPING":"REVIEW_READY",
      owner_gate:"REQUIRED"
    },
    commercial_holds:highShipping.map(x=>({
      product_id:String(x.product_id),
      role:x.role,
      reason:"HIGH_SHIPPING_BURDEN",
      shipping_il_usd:x.shipping_il_usd,
      retail_price_usd:x.retail_price_usd
    })),
    production_authority:false
  };
});

const out={
  version:"HUNT-CINEMATIC-STYLIST-SHELF-SHADOW-V1",
  date:"2026-09-22",
  mode:"SHADOW_ONLY",
  production_effect:false,
  baseline:"HUNT Cinematic V16: Stage → Hero Product → Cinematic Rail → Infinite Discovery",
  scenes,
  summary:{
    scenes:scenes.length,
    visual_hero_scenes:scenes.filter(x=>x.gates.style_fit==="PASS"&&x.gates.product_truth==="PASS").length,
    commercial_hero_ready:scenes.filter(x=>x.gates.commercial_fit==="REVIEW_READY"&&x.gates.exact_artwork==="PASS").length,
    exact_artwork_pending:scenes.filter(x=>x.gates.exact_artwork!=="PASS").length,
    high_shipping_holds:scenes.reduce((n,x)=>n+x.commercial_holds.length,0),
    production_authority:false
  },
  next:"RENDER_SHADOW_SCENES_IN_ORIGINAL_CINEMATIC_LANGUAGE"
};
fs.writeFileSync("evidence/HUNT-CINEMATIC-STYLIST-SHELF-SHADOW-2026-09-22.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
