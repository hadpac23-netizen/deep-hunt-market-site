import fs from "fs";

const MANIFEST="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-MANIFEST-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-PACKET-2026-09-23.json";

const manifest=JSON.parse(fs.readFileSync(MANIFEST,"utf8"));

const specs={
  "accessories/gloves":{
    product_type:"fashion gloves",
    positive_terms:["winter gloves","leather gloves","knitted gloves","thermal gloves","mittens"],
    reject_terms:["work gloves","safety gloves","boxing gloves","cycling gloves","medical gloves","oven gloves","pet gloves","costume gloves"],
    notes:"Human fashion accessory only; no PPE/work/sports/medical/pet use."
  },
  "home/furniture":{
    product_type:"home furniture",
    positive_terms:["coffee table","side table","bedside table","nightstand","bookshelf","bookcase","storage cabinet","shoe cabinet","bed frame","dining chair","accent chair","sofa","couch"],
    reject_terms:["furniture cover","furniture leg","furniture handle","lamp","decor","organizer","pet furniture","miniature furniture","replacement wheels"],
    notes:"Primary product must be furniture itself, not an accessory or replacement part."
  },
  "men/men-clothing":{
    product_type:"men's clothing sets / one-piece apparel",
    positive_terms:["men's two-piece set","men's outfit set","men's jumpsuit","men's overall","men's matching set","men's shirt and shorts set","men's polo and shorts set"],
    reject_terms:["women","girls","kids","baby","sleepwear","pajamas","underwear","costume"],
    notes:"Men's general clothing rail; avoid items already better classified as tops, bottoms, suits, sleepwear or underwear."
  },
  "office/office-furniture":{
    product_type:"office furniture",
    positive_terms:["office chair","office desk","computer desk","desk chair","office cabinet","filing cabinet","file cabinet","standing desk"],
    reject_terms:["chair wheels","chair mat","desk mat","desk organizer","desk hook","desk lamp","cushion","replacement part","holder","stand"],
    notes:"Primary product must be the complete furniture item."
  },
  "tech/smart-home":{
    product_type:"smart home devices",
    positive_terms:["smart plug","smart socket","smart switch","smart doorbell","smart thermostat","smart door lock","zigbee hub","zigbee gateway","zigbee door sensor","zigbee motion sensor","tuya hub","tuya gateway","wifi switch","wifi plug"],
    reject_terms:["smart watch","smart bracelet","trash can","bin","remote control","sterilizer","dispenser","camera remote","tv remote"],
    notes:"Home automation device only; avoid generic electronics and wearables."
  }
};

const rails=(manifest.rails||[]).map(r=>{
  const s=specs[r.rail]||{};
  return {
    rail:r.rail,
    current_canonical_count:r.canonical_count,
    target_good_count:12,
    target_full_count:24,
    requested_initial_candidates:Math.max(12,r.gap_to_good||12),
    requested_preferred_candidates:24,
    product_type:s.product_type,
    positive_terms:s.positive_terms||[],
    reject_terms:s.reject_terms||[],
    notes:s.notes||null,
    markets:["IL","DE","US","SG"],
    commercial_requirements:{
      dropship_no_prepurchase:true,
      no_moq_preferred:true,
      exact_variant_required:true,
      stock_truth_required:true,
      supplier_cost_required:true,
      destination_shipping_quote_required:true,
      destination_eta_required:true,
      tracking_required:true,
      qc_or_sample_path_required:true,
      media_usage_rights_required:true
    },
    quality_requirements:{
      main_image_min_px:800,
      multiple_product_images_preferred:true,
      clean_product_photography:true,
      no_misleading_title_image_mismatch:true,
      no_watermark_preferred:true
    },
    economics_requirements:{
      projected_product_contribution_min_usd:3.99,
      projected_product_margin_min:0.35,
      final_net_profit_verified_required_before_live_sell:true,
      final_net_profit_current_state:"NOT_VERIFIED"
    },
    provider_priority:[
      "HyperSKU manual sourcing",
      "CJ official API/product-detail/quote if a clean candidate becomes available",
      "EPROLO official API only if a new clean candidate appears beyond exhausted scans",
      "other official API/feed supplier after owner approval"
    ],
    production_effect:false
  };
});

const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-PACKET-V1",
  date:"2026-09-23",
  mode:"MANUAL_SOURCING_PACKET_NOT_SENT",
  production_effect:false,
  summary:{
    rails:rails.length,
    requested_initial_candidates:rails.reduce((n,x)=>n+x.requested_initial_candidates,0),
    preferred_candidates:rails.reduce((n,x)=>n+x.requested_preferred_candidates,0),
    markets:["IL","DE","US","SG"],
    hypersku_message_state:"NOT_SENT_WAITING_FOR_REPLY",
    final_net_profit_verified_products:0
  },
  supplier_message_brief:{
    recipient_lane:"HyperSKU manual sourcing/support",
    purpose:"Source clean, high-quality products for five true HUNT shelf gaps after internal catalog recovery was exhausted.",
    include_each_product:[
      "product/SKU link or ID",
      "exact variants",
      "current supplier cost",
      "current stock and warehouse",
      "shipping cost and ETA for IL/DE/US/SG where supported",
      "main and gallery images",
      "media usage rights",
      "QC/sample path",
      "MOQ / branding options if any"
    ],
    do_not_send_until:"HyperSKU replies to the current thread or Owner explicitly requests another follow-up."
  },
  rails
};

fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
for(const x of rails)console.log(x.rail,"initial",x.requested_initial_candidates,"preferred",x.requested_preferred_candidates);
