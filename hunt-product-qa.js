(() => {
  "use strict";
  const H=window.HuntCore;
  if(!H)return;
  const $=q=>document.querySelector(q);
  let state=null;

  const clean=(v,max=160)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const unique=rows=>[...new Set(rows.map(clean).filter(Boolean))].slice(0,12);

  function topicFrom(text){
    const q=clean(text,180).toLowerCase();
    if(/return|refund|cancel|החזר|החזרה|ביטול|ارجاع|إرجاع|استرجاع/.test(q))return "returns";
    if(/ship|delivery|arrive|משלוח|הגעה|شحن|توصيل/.test(q))return "shipping";
    if(/compat|model|device|work with|fit|מתאים|דגם|תואם|مناسب|متوافق|موديل/.test(q))return "compatibility";
    if(/size|color|colour|variant|option|מידה|צבע|אפשרויות|مقاس|لون|خيارات/.test(q))return "options";
    if(/why|recommend|shown|למה|מומלץ|מדוע|لماذا|اقتراح/.test(q))return "why";
    if(/verify|verified|ready|price|buy|stock|מאומת|מחיר|מלאי|شراء|سعر|مخزون/.test(q))return "verified";
    return "details";
  }

  function reasonText(code){
    return ({
      "interest-match":"It matches a shopping interest detected from this session.",
      "complementary":"It can complement the product or mission you are exploring.",
      "verified-commerce":"Its commerce readiness has stronger verified signals.",
      "fresh-discovery":"It adds some variety beyond the main category."
    })[code]||"";
  }
  function answerVerified(){
    const p=state?.product||{}, retail=state?.retail||{}, variants=state?.variants||[], availability=state?.selectedAvailability||null;
    const parts=[];
    const quotePass=String(p.quote_verification_status||"").toUpperCase()==="PASS";
    if(retail.ready)parts.push("HUNT retail price is verified and the Profit Gate passed for the current selection.");
    else parts.push("The final HUNT retail price is not fully verified for the current selection yet.");
    if(availability?.state==="available")parts.push("Stock is verified for the selected option and quantity.");
    else if(availability?.state==="unavailable")parts.push("The selected option is not available for the selected quantity in the latest stock check.");
    else if(state?.selectedVariant)parts.push("The selected option still needs a live stock verification.");
    else if(quotePass)parts.push("The product quote is marked verified, but no exact option is selected.");
    else parts.push("Stock and shipping still require a fresh checkout recheck.");
    if(variants.length)parts.push(`${variants.length} live variant${variants.length===1?"":"s"} are loaded.`);
    return parts.join(" ");
  }

  function answerOptions(){
    const variants=state?.variants||[], selected=state?.selectedVariant||{};
    if(!variants.length)return "HUNT does not currently have a live variant feed for this product.";
    const colors=unique(variants.map(v=>v?.color));
    const sizes=unique(variants.map(v=>v?.size));
    const parts=[`${variants.length} live variant${variants.length===1?"":"s"} are available in the current feed.`];
    if(colors.length)parts.push(`Colors: ${colors.join(", ")}.`);
    if(sizes.length)parts.push(`Sizes/options: ${sizes.join(", ")}.`);
    if(selected?.color||selected?.size)parts.push(`Current selection: ${[selected.color,selected.size].filter(Boolean).join(" / ")}.`);
    const availability=state?.selectedAvailability;
    if(availability?.state==="available")parts.push("Current selection stock is verified for the selected quantity.");
    else if(availability?.state==="unavailable")parts.push("Current selection is unavailable for the selected quantity.");
    else if(selected?.variant_id)parts.push("Current selection stock still needs live verification.");
    return parts.join(" ");
  }
  function answerCompatibility(){
    const p=state?.product||{}, selected=state?.selectedVariant||{};
    const parts=[];
    const explicit=
      (Array.isArray(selected?.compatible_models)&&selected.compatible_models.length?selected.compatible_models.join(", "):"") ||
      (Array.isArray(p?.compatible_models)&&p.compatible_models.length?p.compatible_models.join(", "):"") ||
      clean(selected?.compatibility||p?.compatibility||"",220);
    if(explicit)parts.push(`Source compatibility: ${clean(explicit,220)}.`);
    if(p.model)parts.push(`Provider model/SKU: ${clean(p.model,120)}.`);
    if(selected?.size)parts.push(`Selected size/option: ${clean(selected.size,60)}.`);
    if(selected?.color)parts.push(`Selected color: ${clean(selected.color,60)}.`);
    if(!explicit)parts.push("No structured compatibility matrix has been supplied for this product.");
    parts.push("These are source details, not an independent compatibility guarantee. Match the exact model or size before checkout.");
    return parts.join(" ");
  }

  function answerShipping(){
    const p=state?.product||{};
    const parts=["Shipping cost, destination availability, and stock are rechecked before checkout; this page does not promise a final shipping result."];
    if(p.avg_fulfillment_time)parts.push(`Supplier-reported fulfillment information: ${clean(p.avg_fulfillment_time,100)}.`);
    if(String(p.quote_verification_status||"").toUpperCase()==="PASS")parts.push("A product quote has a verified status, but destination shipping is still rechecked.");
    return parts.join(" ");
  }

  function answerReturns(){
    return "HUNT has a Returns & Cancellation policy, but this panel does not claim product-specific return eligibility. Review the policy and final checkout terms for this order.";
  }
  function answerWhy(){
    const p=state?.product||{};
    const reasons=window.BoomCommerceBrain?.explainProduct?.(p)||[];
    const text=reasons.map(reasonText).filter(Boolean);
    if(text.length)return text.join(" ");
    const fallback=clean(H.personalReason?.(p)||"",180);
    return fallback||"HUNT is showing this product from the current catalog without claiming a personal or popularity reason.";
  }

  function answerDetails(){
    const p=state?.product||{};
    const facts=[];
    if(p.brand)facts.push(`Brand/source label: ${clean(p.brand,100)}.`);
    if(p.type_name)facts.push(`Type: ${clean(p.type_name,100)}.`);
    if(p.origin_country)facts.push(`Source origin field: ${clean(p.origin_country,80)}.`);
    if(p.description)facts.push("A provider description is available in Product Details.");
    return facts.length?facts.join(" "):"HUNT has limited source detail for this product. Missing information stays unknown rather than being inferred.";
  }

  function answer(topic){
    if(!state)return "Product truth is still loading.";
    if(topic==="verified")return answerVerified();
    if(topic==="options")return answerOptions();
    if(topic==="compatibility")return answerCompatibility();
    if(topic==="shipping")return answerShipping();
    if(topic==="returns")return answerReturns();
    if(topic==="why")return answerWhy();
    return answerDetails();
  }
  function show(topic){
    const box=$("#hd-product-qa-answer");
    if(!box)return;
    box.textContent=answer(topic);
    if(topic==="returns"){
      const link=document.createElement("a");
      link.href="returns.html";
      link.textContent=" Open Returns & Cancellation";
      box.appendChild(link);
    }
    const mission=window.HuntAnalytics?.currentMission?.()||"none";
    window.HuntAnalytics?.experience?.("product_question",{topic,mission_type:mission});
    window.dispatchEvent(new CustomEvent("hunt:product-question",{detail:{topic,mission_type:mission}}));
  }

  window.addEventListener("hunt:product-state",e=>{
    state=e.detail||null;
    const panel=$("#hd-product-qa");
    if(panel)panel.hidden=!state?.product;
  });

  $("#hd-product-qa-quick")?.addEventListener("click",e=>{
    const button=e.target.closest?.("[data-qa-topic]");
    if(button)show(String(button.dataset.qaTopic||"details"));
  });

  $("#hd-product-qa-form")?.addEventListener("submit",e=>{
    e.preventDefault();
    const input=$("#hd-product-qa-input");
    const raw=clean(input?.value,180);
    if(!raw)return;
    show(topicFrom(raw));
    if(input)input.value="";
  });
})();
