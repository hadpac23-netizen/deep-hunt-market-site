(() => {
  "use strict";

  const BASELINE_COMMIT="78fc0ad";
  const STATUSES=Object.freeze(["PASS","PARTIAL","MISSING","BLOCKED","NEEDS_EVIDENCE"]);

  const departments=Object.freeze([
    {
      id:"X01",group:"ENTRY",name:"Entry, Navigation & Continuity",
      scope:"Home → Category/Search → Product → Back",
      status:"PASS",
      evidence:["Building navigation","Browse Continuity v2","Return anchor"],
      gaps:[],
      tests:["Open product from deep scroll","Back returns same product to same viewport position","Breadcrumb returns to correct category"]
    },
    {
      id:"X02",group:"PDP",name:"Product Loading & Fallback",
      scope:"Provider detail, cached fallback, loading and unavailable states",
      status:"PASS",
      evidence:["product.js live-detail path","cached product fallback","loading/error surfaces"],
      gaps:[],
      tests:["Live detail success","Provider failure fallback","Missing product fail-closed","No cart on fallback without variants"]
    },
    {
      id:"X03",group:"PDP",name:"Gallery, Zoom & Visual Inspection",
      scope:"Main image, thumbnails, zoom, hidden media discovery",
      status:"PASS",
      evidence:["Image count + photo total signposting","Thumbnail Arrow/Home/End navigation","Zoom previous/next + Arrow keys","Modal focus trap + Escape focus return","390px no-overflow browser QA","hunt-product-gallery.test.cjs PASS","HUNT commit 78fc0ad"],
      gaps:[],
      tests:["1 image","6 images","12+ images","Keyboard-only zoom","Mobile thumbnail reachability"]
    },
    {
      id:"X04",group:"PDP",name:"Variants, Size, Fit & Compatibility",
      scope:"Color, size, exact variant identity and compatibility",
      status:"PARTIAL",
      evidence:["Color buttons","Size buttons","Selected variant recomputation","Compatibility Product Truth answer"],
      gaps:["No size guide / fit guide","No per-variant stock state","No structured device compatibility matrix"],
      tests:["Color changes available sizes","Unavailable combination fails closed","Exact model/size preserved into cart","Size guide when category requires it"]
    },
    {
      id:"X05",group:"PDP",name:"Price, Availability & Decision Confidence",
      scope:"Retail truth, Profit Gate, quote state and recheck boundaries",
      status:"PASS",
      evidence:["Decision Check","Verified retail gate","Quote / signal / recheck states"],
      gaps:[],
      tests:["Verified price","Pending price","Quote PASS","Destination shipping recheck","No fake discount/reference price"]
    },
    {
      id:"X06",group:"PDP",name:"Product Details & Specifications",
      scope:"Description, facts, source claims and structured specifications",
      status:"PARTIAL",
      evidence:["Source description","Product facts","Things to know"],
      gaps:["No category-aware structured spec sheet","No downloadable/manual content path","Supplier text is not normalized into a consistent spec schema"],
      tests:["Tech specs","Fashion material/care","Home dimensions/material","Unknown spec remains unknown"]
    },
    {
      id:"X07",group:"PDP",name:"Shipping, Returns & Policy Confidence",
      scope:"Shipping truth, return policy access and order-specific eligibility",
      status:"PARTIAL",
      evidence:["Shipping link near decision area","Returns link near decision area","Destination recheck wording"],
      gaps:["No product-specific return eligibility","No verified delivery-date/ETA on PDP","No live self-service return workflow"],
      tests:["Policy reachable","No unsupported ETA","Destination-specific quote at checkout","Return eligibility never inferred"]
    },
    {
      id:"X08",group:"PDP",name:"Ratings, Reviews & Shopper Evidence",
      scope:"Review reading, writing, photos, moderation and evidence quality",
      status:"PARTIAL",
      evidence:["Rating average","Review count","1–5 star submission","Photo upload","Moderation state"],
      gaps:["No rating distribution histogram","No review filter/sort","No verified-purchase badge","No helpful/not-helpful signal","No negative-review shortcut"],
      tests:["0 reviews","1 review","Many reviews","Negative review discovery","Photo moderation","Signed-out review attempt"]
    },
    {
      id:"X09",group:"PDP",name:"Like, Save, Share & Personal Actions",
      scope:"Preference controls and cross-device/account persistence",
      status:"PARTIAL",
      evidence:["Like","Save","Anonymous local state","Signed-in Supabase sync"],
      gaps:["Share action missing","No copy-link/native-share fallback"],
      tests:["Anonymous like/save","Sign-in merge","Unlike/unsave","Reload persistence","Share fallback"]
    },
    {
      id:"X10",group:"AI",name:"BOOM Product Truth, Q&A & Why",
      scope:"Verified product questions and explainable recommendation reasons",
      status:"PASS",
      evidence:["Deterministic Product Truth Q&A","Compatibility boundary","Shipping/returns boundary","Why-this reason codes"],
      gaps:[],
      tests:["Verified question","Unknown compatibility","Shipping question","Returns question","Raw question not sent to AI/server"]
    },
    {
      id:"X11",group:"AI",name:"Deal Builder & Complementary Shopping",
      scope:"Complementary picks and bundle review without fake discount",
      status:"PARTIAL",
      evidence:["Complementary category candidates","Saved bundle","Checkout review"],
      gaps:["Bundle items require their own variant confirmation","No verified bundle discount until economics recheck"],
      tests:["Relevant complement","Unrelated item rejected","Variant selection before checkout","Profit Gate before any discount claim"]
    },
    {
      id:"X12",group:"MEDIA",name:"Product Video & Rich Media",
      scope:"Verified video, controls, media provenance and richer product inspection",
      status:"PARTIAL",
      evidence:["Verified media table","YouTube click-to-load","MP4 controls"],
      gaps:["No 360-view path","No media count/signposting across image+video","No transcript/caption evidence check"],
      tests:["No media","One MP4","YouTube","Broken media URL","Keyboard controls","Caption/transcript evidence"]
    },
    {
      id:"X13",group:"DISCOVERY",name:"Cross-Sell, Endless Discovery & Recently Viewed",
      scope:"Continue shopping after PDP without losing orientation",
      status:"PARTIAL",
      evidence:["Endless Discovery","Product Pulse","Browse Continuity"],
      gaps:["No dedicated Recently Viewed rail","No explicit hide/show-less feedback on related products"],
      tests:["Related relevance","Gender/category leakage","Back continuity","Repeat exposure","No infinite uncontrolled flood"]
    },
    {
      id:"X14",group:"CART",name:"Quantity, Cart & Checkout Handoff",
      scope:"Quantity limits, exact variant, cart state and checkout preview",
      status:"PARTIAL",
      evidence:["Quantity 1–5","Exact variant add","Mobile add","Checkout preview"],
      gaps:["Quantity cap is not stock-aware","No live max-per-variant enforcement on PDP"],
      tests:["Quantity min/max","Variant identity","Cart persistence","Duplicate item behavior","Price recheck before checkout"]
    },
    {
      id:"X15",group:"ORDER",name:"Payment, Supplier Order, Tracking & Returns",
      scope:"Real-money lifecycle after checkout",
      status:"BLOCKED",
      evidence:["Payment preview exists","Supplier sandbox exists"],
      gaps:["Real payment callback proof incomplete","Live supplier ordering OFF","Tracking E2E incomplete","Return-request workflow not live"],
      tests:["PayPlus sandbox callback","Idempotent paid transition","CJ sandbox order","Tracking update","Cancellation/refund/return case"]
    },
    {
      id:"X16",group:"QUALITY",name:"Mobile, Accessibility, i18n & Input Safety",
      scope:"390px, keyboard, screen-reader semantics, language and safe inputs",
      status:"PARTIAL",
      evidence:["Responsive PDP","ARIA labels","Escape zoom close","Review upload validation","i18n runtime loaded"],
      gaps:["No full zoom focus trap","No gallery arrow-key navigation","Many PDP strings remain hardcoded English","No full RTL PDP evidence"],
      tests:["390px","768px","1440px","Keyboard-only","Focus order","RTL Hebrew/Arabic","Reduced motion","200% zoom"]
    },
    {
      id:"X17",group:"QUALITY",name:"Performance, PWA & Interaction Responsiveness",
      scope:"LCP/CLS/INP, lazy media and stale-cache protection",
      status:"PARTIAL",
      evidence:["Lazy images","Click-to-load YouTube","PWA cache versioning"],
      gaps:["No real-user INP/LCP/CLS guard","No interaction budget per critical control"],
      tests:["Add button response","Variant switch response","Gallery interaction","P75 RUM INP ≤200ms target","PWA upgrade from stale shell"]
    },
    {
      id:"X18",group:"QUALITY",name:"Analytics, Observability, Security & Legal Boundaries",
      scope:"Funnel evidence, error visibility, privacy, uploads and legal truth",
      status:"PARTIAL",
      evidence:["Analytics events","Mission label","Review file type/size validation","Legal policy pages"],
      gaps:["Production funnel not fully verified","Review media security/moderation needs live evidence","Business identity still owner-gated","No product-experience error dashboard"],
      tests:["product_view→add_to_cart","QA topic telemetry","JS error capture","Upload abuse boundary","Legal identity gate"]
    }
  ]);

  function audit(){
    const counts=Object.fromEntries(STATUSES.map(status=>[status,0]));
    departments.forEach(row=>{counts[row.status]=(counts[row.status]||0)+1;});
    const actionable=departments.filter(row=>["PARTIAL","MISSING","BLOCKED"].includes(row.status));
    const missing=actionable.flatMap(row=>row.gaps.map(gap=>({department:row.id,name:row.name,gap,status:row.status})));
    return Object.freeze({
      mode:"HUNT_EXPERIENCE_AZ_SOURCE_BASELINE",
      baseline_commit:BASELINE_COMMIT,
      total:departments.length,
      counts,
      actionable_departments:actionable.length,
      gap_count:missing.length,
      departments:departments.map(row=>({...row})),
      gaps:missing,
      production_changed:false,
      provider_calls:0,
      payment_changed:false,
      supplier_order_changed:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function masterPrompt(){
    return [
      "ROLE: Principal Ecommerce Experience QA Architect + Product Systems Auditor.",
      "MISSION: Audit HUNT from entry to post-purchase. Test every visible feature, hidden state, fallback and cross-system handoff.",
      "BASELINE: "+BASELINE_COMMIT,
      "METHOD: For every department run happy path, empty path, error path, keyboard/mobile path, stale-data path and recovery path.",
      "TRUTH: Never mark PASS from UI presence alone. Require evidence of behavior. Missing commercial data stays unknown.",
      "OUTPUT PER CHECK: feature | route | expected | observed | status PASS/PARTIAL/MISSING/BLOCKED | evidence | gap | repair | regression test.",
      "OWNER GATE: Do not enable Production, payment, supplier ordering, publishing or spend.",
      "PRODUCTION_CHANGED: false | PAYMENT_CHANGED: false | SUPPLIER_ORDER_CHANGED: false | PUBLISHING_CHANGED: false.",
      "PRIORITY: P0 broken purchase/truth/safety; P1 decision blocker; P2 friction; P3 polish.",
      "RETEST: Every repair must rerun the local contract test plus browser path at desktop and 390px."
    ].join("\n");
  }

  window.HuntExperienceAudit=Object.freeze({audit,departments:()=>departments.map(row=>({...row})),masterPrompt,baselineCommit:BASELINE_COMMIT});
})();
