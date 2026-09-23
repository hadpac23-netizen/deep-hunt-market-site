import fs from "fs";

const PACKET="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-EXTERNAL-SOURCE-PACKET-2026-09-23.json";
const MATRIX="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-ALTERNATIVE-SOURCE-MATRIX-2026-09-23.json";
const OUT="evidence/HUNT-PRODUCT-PLACEMENT-STAGE8-SUPPLIER-OUTREACH-PACKETS-2026-09-23.json";

const base=JSON.parse(fs.readFileSync(PACKET,"utf8"));
const matrix=JSON.parse(fs.readFileSync(MATRIX,"utf8"));

const rails=(base.rails||[]).map(x=>({
  rail:x.rail,
  product_type:x.product_type,
  requested_initial_candidates:x.requested_initial_candidates,
  requested_preferred_candidates:x.requested_preferred_candidates,
  positive_terms:x.positive_terms,
  reject_terms:x.reject_terms,
  markets:x.markets,
  quality_requirements:x.quality_requirements,
  economics_requirements:x.economics_requirements,
  commercial_requirements:x.commercial_requirements
}));

const commonResponseSchema=[
  "supplier product ID / SKU",
  "exact variants",
  "current supplier cost per variant",
  "current stock by warehouse if available",
  "shipping cost and ETA to IL / DE / US / SG",
  "main image plus gallery images",
  "media usage rights for storefront display",
  "QC / sample path",
  "MOQ / pre-purchase requirement if any",
  "tracking capability"
];

const suppliers={
  HyperSKU:{
    send_state:"WAITING_REPLY_DO_NOT_SEND_DUPLICATE",
    thread_state:matrix.providers?.HyperSKU?.thread_state||"UNKNOWN",
    account_api_eligibility:matrix.providers?.HyperSKU?.account_api_eligibility||"UNKNOWN",
    mode:"MANUAL_SOURCING_PRE_API",
    packet:{
      subject:"HUNT DEAL — 5 verified catalog gaps for manual sourcing",
      opening:"We completed a strict catalog cleanup and isolated five true sourcing gaps for HUNT DEAL. We would like HyperSKU to source these manually during the pre-API stage.",
      request:"Please provide clean candidates that match the exact product family requirements below. We prefer 12 strong candidates per rail initially and up to 24 if quality and economics are strong.",
      constraints:[
        "No inventory purchase upfront.",
        "Dropship one-by-one to end customers.",
        "Exact SKU/variant, stock, cost and destination shipping must be verifiable before listing.",
        "Please avoid semantically adjacent products that only mention the target keyword.",
        "Images must clearly show the exact product being sold.",
        "Please include media usage rights and QC/sample options."
      ],
      rails,
      response_schema:commonResponseSchema
    }
  },
  SupDropshipping:{
    send_state:"WAITING_REPLY_DO_NOT_SEND_DUPLICATE",
    thread_state:matrix.providers?.SupDropshipping?.thread_state||"UNKNOWN",
    api_state:matrix.providers?.SupDropshipping?.public_api_capability||"UNKNOWN",
    mode:"AGENT_SOURCING_PLUS_API_ELIGIBILITY_DISCUSSION",
    packet:{
      subject:"HUNT DEAL — exact sourcing brief for 5 remaining catalog gaps",
      opening:"Following our Open API / fulfillment inquiry, we have now reduced our catalog gaps to five exact product families.",
      request:"Please source products matching the exact families below and return quote-ready candidates. We need strict product-type matches, not broad category matches.",
      constraints:[
        "Basic/free sourcing lane preferred.",
        "No pre-purchased inventory.",
        "Please confirm whether our account can request Open API access and what approval steps apply.",
        "For furniture, please include dimensional shipping / volumetric weight and country-specific shipping cost.",
        "For gloves and clothing, exclude work/safety/costume products where our brief says fashion/general apparel only."
      ],
      rails,
      response_schema:commonResponseSchema
    }
  },
  SourcinBox:{
    send_state:"OWNER_GATE_REQUIRED_BEFORE_FIRST_OUTREACH",
    thread_state:matrix.providers?.SourcinBox?.thread_state||"UNKNOWN",
    mode:"FIRST_MANUAL_SOURCING_REQUEST",
    packet:{
      subject:"HUNT DEAL — global dropshipping sourcing request for 5 exact product families",
      opening:"We are evaluating SourcinBox as a sourcing and fulfillment partner for HUNT DEAL, a global multi-category storefront.",
      request:"We currently need strong, quote-ready candidates in five exact product families. Please source 12 high-quality candidates per family initially, with up to 24 preferred if the products meet our quality and landed-cost requirements.",
      constraints:[
        "Zero-inventory launch: no inventory pre-purchase.",
        "No MOQ for the dropshipping lane preferred.",
        "One-by-one fulfillment to end customers.",
        "Please include actual product cost plus shipping, not product cost alone.",
        "For furniture, volumetric/dimensional shipping must be included.",
        "Please include QC/sample options and media usage rights.",
        "We need IL / DE / US / SG shipping evidence before listing."
      ],
      rails,
      response_schema:commonResponseSchema
    }
  }
};

const out={
  version:"HUNT-PRODUCT-PLACEMENT-STAGE8-SUPPLIER-OUTREACH-PACKETS-V1",
  date:"2026-09-23",
  mode:"DRAFT_ONLY_NOT_SENT",
  production_effect:false,
  summary:{
    suppliers:Object.keys(suppliers).length,
    rails:rails.length,
    requested_initial_candidates_per_supplier:rails.reduce((n,x)=>n+x.requested_initial_candidates,0),
    requested_preferred_candidates_per_supplier:rails.reduce((n,x)=>n+x.requested_preferred_candidates,0),
    outbound:{
      HyperSKU:suppliers.HyperSKU.send_state,
      SupDropshipping:suppliers.SupDropshipping.send_state,
      SourcinBox:suppliers.SourcinBox.send_state
    },
    final_net_profit_verified_products:0
  },
  rules:[
    "Drafts only; no external message is sent by this artifact.",
    "HyperSKU and SupDropshipping must not receive duplicate follow-ups while their current threads are unanswered.",
    "First SourcinBox outreach requires Owner Gate.",
    "Supplier replies do not create shelf admission; all candidates must pass Placement, Visual QA, Variant/Stock, Shipping, Media Rights and Profit gates.",
    "Furniture requires dimensional shipping review.",
    "No Production mutation or supplier order."
  ],
  suppliers
};

fs.writeFileSync(OUT,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out.summary,null,2));
for(const [name,s] of Object.entries(suppliers))console.log(name,s.send_state);
