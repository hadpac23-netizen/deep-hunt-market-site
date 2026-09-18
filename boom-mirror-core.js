(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const PRODUCT_TYPES=Object.freeze([
    "earrings","necklace","ring","sunglasses","hat",
    "top","jeans","dress","jacket"
  ]);

  const FOCUS_RULES=Object.freeze({
    necklace:{anchor:"neckline_region",frames:["detail","portrait","full_look"]},
    ring:{anchor:"hand_region",frames:["detail","hand_context","full_look"]},
    earrings:{anchor:"ear_region",frames:["detail","portrait","full_look"]},
    sunglasses:{anchor:"eyewear_region",frames:["face","portrait","full_look"]},
    hat:{anchor:"headwear_region",frames:["head","upper_body","full_look"]},
    top:{anchor:"upper_garment_region",frames:["garment","upper_body","full_look"]},
    jeans:{anchor:"lower_garment_region",frames:["garment","full_body"]},
    dress:{anchor:"full_garment_region",frames:["garment","full_look"]},
    jacket:{anchor:"outerwear_region",frames:["garment","upper_body","full_look"]}
  });

  const RETENTION=Object.freeze(["none","session","saved_avatar"]);
  function createConsent(input={}){
    const retention=RETENTION.includes(input.retention)?input.retention:"none";
    return Object.freeze({
      accepted:input.accepted===true,
      photo_preview:input.photo_preview===true,
      retention,
      share_allowed:input.share_allowed===true,
      created_at:new Date().toISOString()
    });
  }

  function validateConsent(consent={}){
    const issues=[];
    if(consent.accepted!==true)issues.push("CONSENT_REQUIRED");
    if(consent.photo_preview!==true)issues.push("PHOTO_PREVIEW_PERMISSION_REQUIRED");
    if(!RETENTION.includes(consent.retention))issues.push("RETENTION_INVALID");
    return Object.freeze({valid:issues.length===0,issues:Object.freeze(issues)});
  }

  function normalizeType(value){
    const key=clean(value).toLowerCase().replace(/[^a-z]+/g,"");
    const aliases={necklaces:"necklace",rings:"ring",earring:"earrings",hats:"hat",
      tops:"top",jackets:"jacket",dresses:"dress"};
    const type=aliases[key]||key;
    return PRODUCT_TYPES.includes(type)?type:null;
  }

  function focusPlan(productType,{reducedMotion=false}={}){
    const type=normalizeType(productType);
    if(!type)return Object.freeze({valid:false,reason:"UNSUPPORTED_PRODUCT_TYPE",frames:[]});
    const rule=FOCUS_RULES[type];
    return Object.freeze({
      valid:true,
      product_type:type,
      anchor:rule.anchor,
      frames:Object.freeze([...rule.frames]),
      transition:reducedMotion?"instant":"smooth",
      autoplay:false
    });
  }
  function previewTruth(product={}){
    const issues=[];
    if(!clean(product.provider))issues.push("PROVIDER_MISSING");
    if(!clean(product.item_id))issues.push("ITEM_ID_MISSING");
    if(!clean(product.sku)&&!clean(product.variant_id))issues.push("SKU_OR_VARIANT_MISSING");
    if(product.image_verified!==true)issues.push("PRODUCT_IMAGE_UNVERIFIED");
    const truth=clean(product.truth_status).toLowerCase();
    if(!["verified","live_verified","live-verified"].includes(truth))issues.push("PRODUCT_TRUTH_NOT_VERIFIED");
    return Object.freeze({valid:issues.length===0,issues:Object.freeze(issues)});
  }

  function createSession({consent,inputMode="upload",product=null}={}){
    const c=createConsent(consent||{});
    const check=validateConsent(c);
    if(!check.valid)return Object.freeze({created:false,issues:check.issues});

    const allowedModes=["upload","camera","neutral_avatar"];
    const mode=allowedModes.includes(inputMode)?inputMode:"upload";
    return Object.freeze({
      created:true,
      session_id:"mirror:"+Date.now()+":"+Math.random().toString(36).slice(2,8),
      input_mode:mode,
      retention:c.retention,
      persistent_source_photo:false,
      generated_avatar_persistence:c.retention==="saved_avatar",
      share_allowed:c.share_allowed,
      product_key:product?clean(product.provider)+":"+clean(product.item_id):"",
      created_at:new Date().toISOString()
    });
  }
  function renderDecision({productType,product={},confidence=null,reducedMotion=false}={}){
    const focus=focusPlan(productType,{reducedMotion});
    const truth=previewTruth(product);
    const score=confidence===null?null:Number(confidence);
    const lowConfidence=Number.isFinite(score)&&score<0.65;
    const canRender=focus.valid&&truth.valid&&!lowConfidence;
    return Object.freeze({
      can_render:canRender,
      focus,
      truth,
      confidence:Number.isFinite(score)?Math.max(0,Math.min(1,score)):null,
      fallback:!focus.valid?"STATIC_PRODUCT":
        (!truth.valid?"PRODUCT_IMAGE_ONLY":
        (lowConfidence?"SIMPLIFIED_PREVIEW":"NONE")),
      exact_fit_claim:false,
      body_scoring:false,
      attractiveness_scoring:false,
      sensitive_attribute_inference:false
    });
  }

  function sessionMemoryRecord({session={},product={},productType="",lookId=""}={}){
    return Object.freeze({
      type:"try_on",
      provider:clean(product.provider),
      item_id:clean(product.item_id),
      variant_id:clean(product.variant_id),
      category:normalizeType(productType)||"",
      look_id:clean(lookId),
      source:"boom-mirror",
      mirror_session_id:clean(session.session_id),
      stores_source_photo:false
    });
  }

  const api=Object.freeze({
    PRODUCT_TYPES,FOCUS_RULES,RETENTION,createConsent,validateConsent,
    normalizeType,focusPlan,previewTruth,createSession,renderDecision,
    sessionMemoryRecord
  });
  if(typeof window!=="undefined")window.BoomMirrorCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
