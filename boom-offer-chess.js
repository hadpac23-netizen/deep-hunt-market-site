(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const upper=v=>String(v??"").trim().toUpperCase();
  const clean=(v,max=160)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const round=v=>Number(Number(v||0).toFixed(6));
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function envelope(econ={}){
    const contribution=num(econ.contribution_before_coupon);
    const floor=num(econ.min_required_contribution);
    const safeCoupon=num(econ.max_safe_coupon_amount);
    const safeRate=num(econ.max_safe_coupon_rate);
    const safeCac=num(econ.max_safe_cac);
    const sale=num(econ.sale_price_per_unit);
    const customerShipping=num(econ.customer_shipping_amount)||0;
    const supplierShipping=num(econ.supplier_shipping_cost);
    const verified=econ.inputs_verified===true
      && upper(econ.profit_gate_status)==="PASS"
      && [contribution,floor,safeCoupon,safeRate,safeCac,sale,supplierShipping].every(v=>v!==null);

    const headroom=contribution!==null&&floor!==null?Math.max(0,round(contribution-floor)):null;
    const couponMathOk=verified&&headroom!==null&&safeCoupon!==null?safeCoupon<=headroom+0.02:false;

    return Object.freeze({
      verified,
      currency:clean(econ.currency||"USD",8)||"USD",
      sale_price:sale,
      contribution_before_coupon:contribution,
      minimum_contribution:floor,
      headroom,
      max_safe_coupon_amount:safeCoupon,
      max_safe_coupon_rate:safeRate,
      max_safe_cac:safeCac,
      customer_shipping_amount:customerShipping,
      supplier_shipping_cost:supplierShipping,
      coupon_math_ok:couponMathOk
    });
  }

  function evaluate({econ={},control={},context={}}={}){
    const e=envelope(econ);
    const blockers=[];
    if(control?.onsite_state==="STOP")blockers.push("control_tower_stop");
    if(!e.verified)blockers.push("verified_economics_missing");
    if(e.verified&&!e.coupon_math_ok)blockers.push("coupon_math_mismatch");

    const objective=clean(context.objective||"conversion_test",40);
    const shippingVerified=context.shipping_verified===true;
    const bundlePreviewVerified=context.bundle_preview_verified===true;
    const bundleDiscount=num(context.bundle_discount_amount);
    const minMeaningfulAmount=Math.max(0,num(context.min_meaningful_coupon_amount)??0.5);
    const minMeaningfulRate=Math.max(0,num(context.min_meaningful_coupon_rate)??0.05);

    const options=[];

    if(!blockers.length){
      options.push({
        type:"NO_OFFER",
        eligible:true,
        max_discount_amount:0,
        reason:"Preserve contribution when no stronger verified offer is justified."
      });

      const couponMeaningful=(e.max_safe_coupon_amount||0)>=minMeaningfulAmount
        && (e.max_safe_coupon_rate||0)>=minMeaningfulRate;
      options.push({
        type:"SAFE_COUPON_CANDIDATE",
        eligible:couponMeaningful,
        max_discount_amount:couponMeaningful?round(e.max_safe_coupon_amount):0,
        max_discount_rate:couponMeaningful?round(e.max_safe_coupon_rate):0,
        reason:couponMeaningful
          ?"Verified coupon headroom is large enough for a meaningful test."
          :"Verified coupon headroom is too small for a meaningful customer-facing offer."
      });

      const shippingSupport=e.customer_shipping_amount>0
        && shippingVerified
        && (e.headroom||0)>=e.customer_shipping_amount;
      options.push({
        type:"SHIPPING_SUPPORT_CANDIDATE",
        eligible:shippingSupport,
        max_subsidy_amount:shippingSupport?round(e.customer_shipping_amount):0,
        reason:shippingSupport
          ?"Verified margin headroom can absorb the current customer shipping amount."
          :"Do not claim free/reduced shipping unless shipping is verified and margin headroom covers it."
      });

      const bundleSafe=bundlePreviewVerified
        && bundleDiscount!==null
        && bundleDiscount>0
        && (e.headroom||0)>=bundleDiscount;
      options.push({
        type:"BUNDLE_CANDIDATE",
        eligible:bundleSafe,
        max_discount_amount:bundleSafe?round(bundleDiscount):0,
        reason:bundleSafe
          ?"A verified bundle preview fits inside the current contribution floor."
          :"Bundle discount requires a fresh verified bundle preview and safe combined economics."
      });
    }

    const eligible=options.filter(x=>x.eligible);
    let recommendation="HOLD";
    if(!blockers.length){
      const bundle=eligible.find(x=>x.type==="BUNDLE_CANDIDATE");
      const shipping=eligible.find(x=>x.type==="SHIPPING_SUPPORT_CANDIDATE");
      const coupon=eligible.find(x=>x.type==="SAFE_COUPON_CANDIDATE");
      recommendation=bundle?.type||shipping?.type||coupon?.type||"NO_OFFER";
    }

    const selected=eligible.find(x=>x.type===recommendation)||null;
    const verifiedClaims=[];
    if(selected?.type==="SAFE_COUPON_CANDIDATE"&&selected.max_discount_amount>0){
      verifiedClaims.push("discount");
      verifiedClaims.push("safe coupon up to "+selected.max_discount_amount+" "+e.currency);
    }
    if(selected?.type==="SHIPPING_SUPPORT_CANDIDATE"&&selected.max_subsidy_amount>=e.customer_shipping_amount&&e.customer_shipping_amount>0){
      verifiedClaims.push("free shipping");
    }
    if(selected?.type==="BUNDLE_CANDIDATE")verifiedClaims.push("verified bundle offer");

    return Object.freeze({
      version:VERSION,
      objective,
      state:blockers.length?"HOLD":"READY",
      blockers:Object.freeze(uniq(blockers)),
      recommendation,
      selected:selected?Object.freeze(selected):null,
      options:Object.freeze(options.map(Object.freeze)),
      economics:e,
      verified_claims:Object.freeze(verifiedClaims),
      application_enabled:false,
      checkout_revalidation_required:true,
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(rows=[]){
    const list=Array.isArray(rows)?rows.filter(Boolean):[];
    const counts={};
    for(const row of list)counts[row.recommendation]=(counts[row.recommendation]||0)+1;
    const coupons=list.map(r=>r?.selected?.max_discount_amount).filter(v=>Number.isFinite(v)&&v>0);
    return Object.freeze({
      total:list.length,
      hold:counts.HOLD||0,
      no_offer:counts.NO_OFFER||0,
      coupon_candidate:counts.SAFE_COUPON_CANDIDATE||0,
      shipping_candidate:counts.SHIPPING_SUPPORT_CANDIDATE||0,
      bundle_candidate:counts.BUNDLE_CANDIDATE||0,
      safe_coupon_range:coupons.length?Object.freeze({min:Math.min(...coupons),max:Math.max(...coupons)}):null,
      application_enabled:false,
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,envelope,evaluate,summarize});
  if(typeof window!=="undefined")window.BoomOfferChess=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
