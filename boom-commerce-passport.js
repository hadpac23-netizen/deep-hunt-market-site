(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const BLOCKED_CATEGORY=/\b(gun|firearm|ammunition|ammo|weapon|switchblade|taser|casino|sportsbook|betting|vape|cigarette|nicotine|cannabis|marijuana|thc|cocaine|heroin|meth|steroid|porn|sex toy)\b/i;

  const clean=(v,max=500)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];
  const https=v=>typeof v==="string"&&/^https:\/\//i.test(v.trim())?v.trim():"";
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const upper=v=>String(v??"").trim().toUpperCase();
  const bool=v=>v===true;
  const safeCategory=p=>!BLOCKED_CATEGORY.test([p?.title,p?.category,p?.type_name,p?.description].filter(Boolean).join(" "));

  function productKey(p={}){
    return [clean(p.provider,60)||"provider",clean(p.item_id||p.id||p.sku,120)||"item"].join(":");
  }

  function retailTruth(p={}){
    const amount=num(p.retail_price_amount);
    const verified=p.retail_price_verified===true
      && upper(p.profit_gate_status)==="PASS"
      && amount!==null
      && amount>0;
    return Object.freeze({
      verified,
      amount:verified?amount:null,
      currency:clean(p.retail_currency||p.currency||"USD",8)||"USD",
      reason:verified?"retail_price_verified + Profit Gate PASS":"verified retail price unavailable"
    });
  }

  function mediaTruth(p={}){
    const main=https(p.image_url);
    const additional=uniq(Array.isArray(p.gallery)?p.gallery.map(https):[]).filter(x=>x&&x!==main).slice(0,24);
    const videos=uniq([
      ...(Array.isArray(p.video_links)?p.video_links:[]),
      p.video_url,
      p.verified_video_url
    ].map(https)).slice(0,8);
    return Object.freeze({main_image:main,additional_images:Object.freeze(additional),videos:Object.freeze(videos),ready:Boolean(main)});
  }

  function canonicalTruth(p={},ctx={}){
    const direct=https(ctx.canonical_url||ctx.product_url||p.canonical_url||p.product_url);
    return Object.freeze({url:direct,ready:Boolean(direct)});
  }

  function availabilityTruth(p={},ctx={}){
    const variantCount=Math.max(0,Number(p.variant_count||ctx.variant_count||0)||0);
    const feedVariantReady=ctx.variant_availability_feed_ready===true;
    const exactFeedReady=ctx.feed_availability_verified===true;
    const productSignal=p.availability_verified===true;
    const quotePass=upper(p.quote_verification_status)==="PASS";
    const stockCheckRequired=p.stock_check_required===true;

    const exportable=exactFeedReady || feedVariantReady || (
      variantCount===0 && productSignal && !stockCheckRequired
    );

    let state="recheck";
    if(exportable)state="verified";
    else if(quotePass||productSignal)state="signal";

    return Object.freeze({
      state,
      exportable,
      variant_count:variantCount,
      product_signal_verified:productSignal,
      quote_status:quotePass?"PASS":clean(p.quote_verification_status,40)||"UNKNOWN",
      reason:exportable
        ?"feed-safe availability evidence supplied"
        :variantCount>0
          ?"variant availability requires a feed-safe verified source"
          :"availability is not sufficiently verified for external feed export"
    });
  }

  function verifiedQuestions(p={},ctx={}){
    const rows=[
      ...(Array.isArray(ctx.questions_and_answers)?ctx.questions_and_answers:[]),
      ...(Array.isArray(p.questions_and_answers)?p.questions_and_answers:[])
    ];
    return Object.freeze(rows.map(row=>{
      if(!row||row.verified!==true)return null;
      const question=clean(row.question,500),answer=clean(row.answer,1500);
      return question&&answer?{question,answer,source:clean(row.source||"HUNT Product Truth",80)}:null;
    }).filter(Boolean).slice(0,50));
  }

  function relatedProducts(p={},ctx={}){
    const rows=[
      ...(Array.isArray(ctx.related_products)?ctx.related_products:[]),
      ...(Array.isArray(p.related_products)?p.related_products:[])
    ];
    return Object.freeze(rows.map(row=>{
      if(typeof row==="string"){
        const value=clean(row,180);
        return value?{offer_id:value,relationship:"related"}:null;
      }
      if(!row)return null;
      const offerId=clean(row.offer_id||row.item_id||row.id,180);
      if(!offerId)return null;
      return {offer_id:offerId,relationship:clean(row.relationship||"related",40)};
    }).filter(Boolean).slice(0,50));
  }

  function variantOptions(p={},ctx={}){
    const variants=Array.isArray(ctx.variants)?ctx.variants:Array.isArray(p.variants)?p.variants:[];
    const optionKeys=["color","size","model","style","material"];
    const values={};
    for(const key of optionKeys){
      const rows=uniq(variants.map(v=>clean(v?.[key],80)).filter(Boolean)).slice(0,60);
      if(rows.length)values[key]=rows;
    }
    return Object.freeze(values);
  }

  function documents(p={},ctx={}){
    const rows=[
      ...(Array.isArray(ctx.document_links)?ctx.document_links:[]),
      ...(Array.isArray(p.document_links)?p.document_links:[])
    ];
    return Object.freeze(rows.map(row=>{
      if(typeof row==="string"){
        const url=https(row);return url?{url,label:"Product document"}:null;
      }
      const url=https(row?.url||row?.link);
      if(!url)return null;
      return {url,label:clean(row.label||row.title||"Product document",100)};
    }).filter(Boolean).slice(0,20));
  }

  function economicsTruth(ctx={}){
    const e=ctx.unit_economics||{};
    const verified=e.inputs_verified===true
      && upper(e.profit_gate_status)==="PASS"
      && (num(e.contribution_before_coupon)||0)>0;
    return Object.freeze({
      verified,
      contribution_before_coupon:verified?num(e.contribution_before_coupon):null,
      max_safe_cac:verified?Math.max(0,num(e.max_safe_cac)||0):null,
      max_safe_coupon_amount:verified?Math.max(0,num(e.max_safe_coupon_amount)||0):null,
      currency:clean(e.currency||"USD",8)||"USD"
    });
  }

  function truthBundle(p={},ctx={}){
    const price=retailTruth(p),media=mediaTruth(p),canonical=canonicalTruth(p,ctx),availability=availabilityTruth(p,ctx);
    const title=clean(p.title,240),description=clean(p.description||p.source_description,5000);
    const legal=ctx.merchant_identity_ready===true;
    const shipping=ctx.shipping_policy_ready===true;
    const returns=ctx.returns_policy_ready===true;
    return Object.freeze({
      title_ready:Boolean(title),
      description_ready:description.length>=20,
      price,
      media,
      canonical,
      availability,
      merchant_identity_ready:legal,
      shipping_policy_ready:shipping,
      returns_policy_ready:returns,
      safe_category:safeCategory(p),
      source_fresh:ctx.source_fresh===true||p.source_fresh===true
    });
  }

  function blockersFor(p={},ctx={},channel="generic"){
    const t=truthBundle(p,ctx);
    const blockers=[];
    if(!t.safe_category)blockers.push("restricted_or_unsafe_category");
    if(!t.title_ready)blockers.push("title_missing");
    if(!t.description_ready)blockers.push("description_missing_or_too_short");
    if(!t.media.ready)blockers.push("primary_image_missing");
    if(!t.canonical.ready)blockers.push("canonical_product_url_missing");

    const commerceChannels=new Set(["google_free_listings","google_ai","meta_catalog","tiktok_catalog","pinterest_catalog","agentic_ucp"]);
    if(commerceChannels.has(channel)){
      if(!t.price.verified)blockers.push("verified_price_missing");
      if(!t.availability.exportable)blockers.push("feed_safe_availability_missing");
      if(!t.merchant_identity_ready)blockers.push("merchant_identity_not_ready");
      if(!t.shipping_policy_ready)blockers.push("shipping_policy_not_ready");
      if(!t.returns_policy_ready)blockers.push("returns_policy_not_ready");
      if(!t.source_fresh)blockers.push("source_freshness_not_verified");
    }

    if(channel==="paid_media"){
      if(!economicsTruth(ctx).verified)blockers.push("verified_unit_economics_missing");
      if(ctx.attribution_ready!==true)blockers.push("attribution_not_ready");
      if(ctx.owner_paid_approval!==true)blockers.push("owner_paid_approval_required");
    }

    return Object.freeze(uniq(blockers));
  }

  function channelReadiness(p={},ctx={}){
    const qas=verifiedQuestions(p,ctx),related=relatedProducts(p,ctx),options=variantOptions(p,ctx);
    const rows={};
    const channels=["onsite","seo","google_free_listings","google_ai","meta_catalog","tiktok_catalog","pinterest_catalog","agentic_ucp","organic_social","paid_media"];
    for(const channel of channels){
      const dataBlockers=[...blockersFor(p,ctx,channel)];
      const connected=channel==="onsite"||channel==="seo"
        ? true
        : ctx.connected_channels?.[channel]===true;
      const blockers=[...dataBlockers];
      if(!connected)blockers.push("channel_not_connected");

      const dataReady=dataBlockers.length===0;
      const discoveryReady=dataReady&&connected;
      const transactionBlockers=[];
      if(channel==="agentic_ucp"){
        if(ctx.checkout_ready!==true)transactionBlockers.push("checkout_not_ready");
        if(ctx.payment_ready!==true)transactionBlockers.push("payment_not_ready");
        if(ctx.order_ready!==true)transactionBlockers.push("order_creation_not_ready");
        if(ctx.tracking_ready!==true)transactionBlockers.push("tracking_not_ready");
      }
      rows[channel]={
        data_ready:dataReady,
        discovery_ready:discoveryReady,
        transaction_ready:channel==="agentic_ucp"
          ? discoveryReady&&transactionBlockers.length===0
          : null,
        transaction_blockers:channel==="agentic_ucp"?Object.freeze(transactionBlockers):Object.freeze([]),
        connected,
        blockers:Object.freeze(uniq(blockers)),
        conversational_depth:channel==="google_ai"||channel==="agentic_ucp"
          ? qas.length+related.length+Object.keys(options).length
          : null
      };
    }
    return Object.freeze(rows);
  }

  function googleMerchantDraft(p={},ctx={}){
    const t=truthBundle(p,ctx),qas=verifiedQuestions(p,ctx),related=relatedProducts(p,ctx),options=variantOptions(p,ctx),docs=documents(p,ctx);
    const attributes={
      title:clean(p.title,150),
      description:clean(p.description||p.source_description,5000),
      link:t.canonical.url,
      imageLink:t.media.main_image,
      additionalImageLinks:[...t.media.additional_images],
      videoLinks:[...t.media.videos],
      condition:clean(p.condition||"new",20).toLowerCase(),
      brand:clean(p.brand,70),
      gtin:clean(p.gtin,50),
      mpn:clean(p.mpn||p.sku,70),
      color:clean(p.color,100),
      size:clean(p.size,100),
      material:clean(p.material,200),
      pattern:clean(p.pattern,100),
      gender:clean(p.gender,30),
      ageGroup:clean(p.age_group,30)
    };
    if(t.price.verified)attributes.price={amountMicros:String(Math.round(t.price.amount*1e6)),currencyCode:t.price.currency};
    if(t.availability.exportable)attributes.availability=clean(ctx.google_availability||p.google_availability||"in_stock",30);
    const conversational={
      questions_and_answers:qas,
      related_products:related,
      variant_options:options,
      document_links:docs
    };
    return Object.freeze({
      offerId:clean(p.item_id||p.sku,120),
      contentLanguage:clean(ctx.content_language||"en",12),
      feedLabel:clean(ctx.feed_label||ctx.market||"US",12),
      productAttributes:Object.freeze(Object.fromEntries(Object.entries(attributes).filter(([,v])=>{
        if(Array.isArray(v))return v.length>0;
        if(v&&typeof v==="object")return true;
        return Boolean(v);
      }))),
      conversational:Object.freeze(conversational),
      publish_ready:channelReadiness(p,ctx).google_free_listings.discovery_ready
    });
  }

  function build(p={},ctx={}){
    const key=productKey(p),truth=truthBundle(p,ctx),economics=economicsTruth(ctx);
    const conversational=Object.freeze({
      questions_and_answers:verifiedQuestions(p,ctx),
      related_products:relatedProducts(p,ctx),
      variant_options:variantOptions(p,ctx),
      document_links:documents(p,ctx)
    });
    const channels=channelReadiness(p,ctx);
    const verifiedFacts=uniq([
      truth.price.verified?"verified retail price":"",
      truth.availability.exportable?"feed-safe availability":"",
      clean(p.brand,80)?("brand: "+clean(p.brand,80)):"",
      clean(p.model,80)?("model: "+clean(p.model,80)):"",
      clean(p.material,100)?("material: "+clean(p.material,100)):"",
      clean(p.color,80)?("color: "+clean(p.color,80)):"",
      clean(p.size,80)?("size/option: "+clean(p.size,80)):""
    ]).filter(Boolean);

    return Object.freeze({
      version:VERSION,
      passport_id:"hunt:"+key,
      product_key:key,
      identity:Object.freeze({
        provider:clean(p.provider,80),
        item_id:clean(p.item_id||p.id,140),
        sku:clean(p.sku,120),
        title:clean(p.title,240),
        category:clean(p.category,100),
        brand:clean(p.brand,100),
        model:clean(p.model,120)
      }),
      truth,
      conversational,
      economics,
      creative_inputs:Object.freeze({
        verified_facts:Object.freeze(verifiedFacts),
        image_ready:truth.media.ready,
        video_count:truth.media.videos.length,
        no_claim_generation:true
      }),
      measurement:Object.freeze({
        product_key:key,
        provider:clean(p.provider,80),
        item_id:clean(p.item_id||p.id,140),
        experiment_namespace:"hunt-commerce-passport",
        attribution_key:clean(ctx.attribution_key||key,160)
      }),
      channels,
      google_merchant_draft:googleMerchantDraft(p,ctx),
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize(passports=[]){
    const rows=Array.isArray(passports)?passports.filter(Boolean):[];
    const channelNames=["google_free_listings","google_ai","meta_catalog","tiktok_catalog","pinterest_catalog","agentic_ucp","organic_social","paid_media"];
    const channels={};
    for(const name of channelNames){
      channels[name]={
        data_ready:rows.filter(p=>p?.channels?.[name]?.data_ready===true).length,
        ready:rows.filter(p=>p?.channels?.[name]?.discovery_ready===true).length,
        transaction_ready:rows.filter(p=>p?.channels?.[name]?.transaction_ready===true).length,
        connected:rows.filter(p=>p?.channels?.[name]?.connected===true).length,
        blocked:rows.filter(p=>p?.channels?.[name]&&p.channels[name].discovery_ready!==true).length
      };
    }
    return Object.freeze({
      total:rows.length,
      price_verified:rows.filter(p=>p?.truth?.price?.verified===true).length,
      availability_exportable:rows.filter(p=>p?.truth?.availability?.exportable===true).length,
      merchant_identity_ready:rows.filter(p=>p?.truth?.merchant_identity_ready===true).length,
      channels:Object.freeze(channels)
    });
  }

  const api=Object.freeze({VERSION,build,summarize,retailTruth,availabilityTruth,googleMerchantDraft,channelReadiness,blockersFor});
  if(typeof window!=="undefined")window.BoomCommercePassport=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
