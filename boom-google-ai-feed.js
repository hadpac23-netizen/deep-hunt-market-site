(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=500)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];
  const upper=v=>clean(v,80).toUpperCase();

  function normalizeFeedLabel(value){
    return upper(value||"").replace(/[^A-Z0-9_-]/g,"").slice(0,20);
  }

  function normalizeLanguage(value){
    const raw=clean(value||"en",12).toLowerCase();
    return /^[a-z]{2,3}(?:-[a-z]{2})?$/.test(raw)?raw:"en";
  }

  function normalizeCondition(value){
    const v=upper(value||"NEW");
    return ["NEW","USED","REFURBISHED"].includes(v)?v:"NEW";
  }

  function normalizeAvailability(value){
    const v=upper(value||"");
    const map={
      "IN STOCK":"IN_STOCK","IN_STOCK":"IN_STOCK",
      "OUT OF STOCK":"OUT_OF_STOCK","OUT_OF_STOCK":"OUT_OF_STOCK",
      "PREORDER":"PREORDER","PREORDERED":"PREORDER",
      "BACKORDER":"BACKORDER"
    };
    return map[v]||"";
  }

  function normalizeGender(value){
    const v=upper(value);
    const map={MEN:"MALE",MAN:"MALE",MALE:"MALE",WOMEN:"FEMALE",WOMAN:"FEMALE",FEMALE:"FEMALE",UNISEX:"UNISEX"};
    return map[v]||"";
  }

  function normalizeAgeGroup(value){
    const v=upper(value).replace(/[ -]+/g,"_");
    return ["NEWBORN","INFANT","TODDLER","KIDS","ADULT"].includes(v)?v:"";
  }

  function relationshipType(value){
    const v=clean(value,60).toLowerCase().replace(/[ -]+/g,"_");
    const map={
      related:"OFTEN_BOUGHT_WITH",
      often_bought_with:"OFTEN_BOUGHT_WITH",
      accessory:"ACCESSORY",
      substitute:"SUBSTITUTE",
      part_of_set:"PART_OF_SET",
      required_part:"REQUIRED_PART",
      different_brand:"DIFFERENT_BRAND"
    };
    return map[v]||"";
  }

  function conversationalAttributes(passport={}){
    const c=passport.conversational||{};
    const questions=[];
    let totalChars=0;
    for(const row of Array.isArray(c.questions_and_answers)?c.questions_and_answers:[]){
      const question=clean(row?.question,1000);
      const answer=clean(row?.answer,1000);
      if(!question||!answer)continue;
      const next=question.length+answer.length;
      if(totalChars+next>10000||questions.length>=30)break;
      totalChars+=next;
      questions.push({question,answer});
    }

    const docs=(Array.isArray(c.document_links)?c.document_links:[])
      .map(row=>typeof row==="string"?row:row?.url)
      .filter(url=>typeof url==="string"&&/^https?:\/\//i.test(url))
      .slice(0,20);

    const variants=[];
    const variantMap=c.variant_options&&typeof c.variant_options==="object"?c.variant_options:{};
    let multiVariant=false;
    for(const [name,valuesRaw] of Object.entries(variantMap)){
      const values=uniq(Array.isArray(valuesRaw)?valuesRaw.map(v=>clean(v,100)):[]).filter(Boolean);
      if(values.length>1)multiVariant=true;
      if(values.length===1)variants.push({name:clean(name,100),value:values[0]});
    }

    const related=(Array.isArray(c.related_products)?c.related_products:[]).map(row=>{
      const type=relationshipType(row?.relationship);
      const id=clean(row?.offer_id||row?.id,120);
      return type&&id?{relationshipType:type,idType:"ID",id}:null;
    }).filter(Boolean).slice(0,50);

    return Object.freeze({
      questionsAndAnswers:Object.freeze(questions),
      documentLinks:Object.freeze(docs),
      variantOptions:Object.freeze(variants),
      relatedProducts:Object.freeze(related),
      multi_variant_requires_expansion:multiVariant
    });
  }

  function validate(passport={},options={}){
    const blockers=[];
    const draft=passport.google_merchant_draft||{};
    const attrs=draft.productAttributes||{};
    const channel=passport.channels?.google_free_listings||{};
    const conv=conversationalAttributes(passport);

    if(channel.data_ready!==true){
      blockers.push(...(channel.blockers||[]).filter(x=>x!=="channel_not_connected"));
    }
    if(!clean(draft.offerId,120))blockers.push("offer_id_missing");
    if(!clean(attrs.title,150))blockers.push("title_missing");
    if(clean(attrs.description,5000).length<20)blockers.push("description_missing_or_too_short");
    if(!/^https:\/\//i.test(clean(attrs.link,1000)))blockers.push("https_product_link_missing");
    if(!/^https:\/\//i.test(clean(attrs.imageLink,1000)))blockers.push("https_image_missing");
    if(!attrs.price?.amountMicros||!attrs.price?.currencyCode)blockers.push("verified_price_missing");
    if(!normalizeAvailability(attrs.availability))blockers.push("feed_safe_availability_missing");
    if(conv.multi_variant_requires_expansion)blockers.push("variant_offer_not_expanded");

    const feedLabel=normalizeFeedLabel(options.feedLabel||draft.feedLabel||"");
    if(!feedLabel)blockers.push("feed_label_invalid");
    const contentLanguage=normalizeLanguage(options.contentLanguage||draft.contentLanguage||"en");

    return Object.freeze({
      valid:uniq(blockers).length===0,
      blockers:Object.freeze(uniq(blockers)),
      feedLabel,
      contentLanguage,
      conversational:conv
    });
  }

  function buildProductInput(passport={},options={}){
    const validation=validate(passport,options);
    const draft=passport.google_merchant_draft||{};
    const src=draft.productAttributes||{};
    const conv=validation.conversational;

    const attrs={
      title:clean(src.title,150),
      description:clean(src.description,5000),
      link:clean(src.link,1000),
      canonicalLink:clean(src.canonicalLink||src.link,1000),
      imageLink:clean(src.imageLink,1000),
      additionalImageLinks:uniq(src.additionalImageLinks||[]).slice(0,10),
      videoLinks:uniq(src.videoLinks||[]).slice(0,10),
      availability:normalizeAvailability(src.availability),
      price:src.price?.amountMicros&&src.price?.currencyCode
        ? {amountMicros:String(src.price.amountMicros),currencyCode:upper(src.price.currencyCode).slice(0,3)}
        : undefined,
      condition:normalizeCondition(src.condition),
      brand:clean(src.brand,70),
      gtins:uniq(src.gtins||[]).map(v=>clean(v,50)).filter(Boolean).slice(0,10),
      mpn:clean(src.mpn,70),
      color:clean(src.color,100),
      size:clean(src.size,100),
      material:clean(src.material,200),
      pattern:clean(src.pattern,100),
      gender:normalizeGender(src.gender),
      ageGroup:normalizeAgeGroup(src.ageGroup),
      productTypes:passport.identity?.category?[clean(passport.identity.category,750)]:[],
      questionsAndAnswers:[...conv.questionsAndAnswers],
      documentLinks:[...conv.documentLinks],
      variantOptions:[...conv.variantOptions],
      relatedProducts:[...conv.relatedProducts]
    };

    const productAttributes=Object.fromEntries(Object.entries(attrs).filter(([,v])=>{
      if(v===undefined||v===null||v==="")return false;
      if(Array.isArray(v))return v.length>0;
      return true;
    }));

    return Object.freeze({
      offerId:clean(draft.offerId||passport.identity?.item_id,120),
      contentLanguage:validation.contentLanguage,
      feedLabel:validation.feedLabel,
      productAttributes:Object.freeze(productAttributes),
      export_ready:validation.valid,
      publish_ready:validation.valid&&passport.channels?.google_free_listings?.discovery_ready===true,
      blockers:validation.blockers,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function buildBatch(passports=[],options={}){
    const rows=(Array.isArray(passports)?passports:[]).map(passport=>({
      passport,
      input:buildProductInput(passport,options)
    }));
    const exportReady=rows.filter(row=>row.input.export_ready);
    const publishReady=rows.filter(row=>row.input.publish_ready);
    const blocked=rows.filter(row=>!row.input.export_ready).map(row=>({
      product_key:row.passport?.product_key||"",
      title:row.passport?.identity?.title||"",
      blockers:[...row.input.blockers]
    }));

    const counts={};
    for(const row of blocked){
      for(const blocker of new Set(row.blockers))counts[blocker]=(counts[blocker]||0)+1;
    }
    const topBlockers=Object.entries(counts)
      .map(([blocker,count])=>({blocker,count}))
      .sort((a,b)=>b.count-a.count||a.blocker.localeCompare(b.blocker));

    return Object.freeze({
      version:VERSION,
      total:rows.length,
      export_ready:exportReady.length,
      publish_ready:publishReady.length,
      blocked:blocked.length,
      inputs:Object.freeze(exportReady.map(row=>row.input)),
      blocked_products:Object.freeze(blocked),
      top_blockers:Object.freeze(topBlockers),
      network_calls:0,
      external_publish:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,validate,buildProductInput,buildBatch,conversationalAttributes});
  if(typeof window!=="undefined")window.BoomGoogleAiFeed=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
