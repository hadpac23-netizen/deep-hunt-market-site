(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=300)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const money=(v,c="USD")=>Number.isFinite(Number(v))?new Intl.NumberFormat("en",{style:"currency",currency:c}).format(Number(v)):"";
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function facts(passport={}){
    const rows=Array.isArray(passport?.creative_inputs?.verified_facts)
      ? passport.creative_inputs.verified_facts.map(v=>clean(v,180)).filter(Boolean)
      : [];
    return Object.freeze(uniq(rows));
  }

  function candidate({passport={},control={}}={}){
    const verifiedFacts=facts(passport);
    const imageReady=passport?.creative_inputs?.image_ready===true;
    const safe=passport?.truth?.safe_category!==false;
    const title=clean(passport?.identity?.title,180);
    const blocked=control?.onsite_state==="STOP"||control?.external_state==="STOP";
    const reasons=[];
    if(!safe)reasons.push("unsafe_or_restricted_category");
    if(!title)reasons.push("title_missing");
    if(!imageReady)reasons.push("primary_image_missing");
    if(!verifiedFacts.length)reasons.push("verified_creative_fact_missing");
    if(blocked)reasons.push("control_tower_stop");
    return Object.freeze({
      ready:reasons.length===0,
      reasons:Object.freeze(uniq(reasons)),
      verified_facts:verifiedFacts,
      title,
      image_ready:imageReady
    });
  }

  function factLine(passport={}){
    const verified=facts(passport);
    const priceFact=verified.find(x=>/^verified retail price$/i.test(x));
    const descriptive=verified.find(x=>/^(brand:|model:|material:|color:|size\/option:)/i.test(x));
    if(descriptive)return descriptive.replace(/^([a-z/ ]+):\s*/i,(m,k)=>k.replace(/\b\w/g,c=>c.toUpperCase())+": ");
    if(priceFact&&passport?.truth?.price?.verified){
      const amount=passport.truth.price.amount;
      const currency=passport.truth.price.currency||"USD";
      return "Verified HUNT price "+money(amount,currency);
    }
    return "Verified product details available on HUNT";
  }

  function baseDrafts({passport={},control={}}={}){
    const c=candidate({passport,control});
    if(!c.ready)return [];
    const title=c.title;
    const line=factLine(passport);
    const base={
      passport_id:clean(passport.passport_id,220),
      product_key:clean(passport.product_key,220),
      verified_product_relation:true,
      source_facts:[...c.verified_facts],
      publish_ready:false,
      owner_gate:"REVIEW_REQUIRED"
    };
    return [
      {...base,channel:"google_asset",format:"responsive_copy",hook:"",headline:title,body:line+". Check exact product details before checkout.",cta:"View product"},
      {...base,channel:"meta_reels",format:"9:16",hook:"A HUNT find worth checking",headline:title,body:line+". See the exact option and current HUNT product truth.",cta:"View on HUNT"},
      {...base,channel:"tiktok",format:"9:16",hook:"Found on HUNT",headline:title,body:line+". Product details stay visible before checkout.",cta:"See details"},
      {...base,channel:"pinterest",format:"2:3",hook:"Save this HUNT find",headline:title,body:line+". Review the exact product details on HUNT.",cta:"View product"},
      {...base,channel:"onsite",format:"onsite_card",hook:"BOOM PICK",headline:title,body:line,cta:"View details"}
    ];
  }

  function videoBrief({passport={},control={}}={}){
    const c=candidate({passport,control});
    if(!c.ready)return null;
    const title=c.title;
    const line=factLine(passport);
    return Object.freeze({
      product_key:clean(passport.product_key,220),
      format:"9:16",
      duration_seconds:Object.freeze({min:6,max:15}),
      shots:Object.freeze([
        "Use only approved product-linked media.",
        "Open with the product clearly visible.",
        "Show one source-backed product detail.",
        "End on the HUNT product page / exact option."
      ]),
      script:"Found on HUNT. "+title+". "+line+". Check the exact product details before checkout.",
      prohibited:Object.freeze([
        "invented demonstrations",
        "unverified durability or waterproof claims",
        "fake urgency or popularity",
        "unverified shipping promises",
        "unverified compatibility promises"
      ]),
      publish_ready:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function build({passport={},control={},firewall=null}={}){
    const gate=candidate({passport,control});
    const fw=firewall||globalThis.BoomClaimFirewall;
    const drafts=baseDrafts({passport,control}).map(d=>fw?.sanitizeDraft?fw.sanitizeDraft(d,{verified_facts:d.source_facts}):d);
    const brief=videoBrief({passport,control});
    const safeBrief=brief&&fw?.sanitizeDraft?fw.sanitizeDraft(brief,{verified_facts:gate.verified_facts}):brief;
    const blocked=drafts.filter(d=>d?.claim_firewall?.pass===false);
    return Object.freeze({
      version:VERSION,
      product_key:clean(passport.product_key,220),
      candidate:gate,
      draft_count:drafts.length,
      safe_draft_count:drafts.length-blocked.length,
      blocked_draft_count:blocked.length,
      drafts:Object.freeze(drafts),
      video_brief:safeBrief,
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function buildBatch(rows=[]){
    const results=(Array.isArray(rows)?rows:[]).map(build);
    return Object.freeze({
      total:results.length,
      candidates:results.filter(r=>r.candidate.ready).length,
      safe_drafts:results.reduce((s,r)=>s+r.safe_draft_count,0),
      blocked_drafts:results.reduce((s,r)=>s+r.blocked_draft_count,0),
      outputs:Object.freeze(results),
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,facts,candidate,baseDrafts,videoBrief,build,buildBatch});
  if(typeof window!=="undefined")window.BoomCreativeFactory=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
