(() => {
  const H = window.HuntCore;
  const runtime = window.BoomRuntime;
  const PROD_ORIGIN = "https://deep-hunt-market.netlify.app";
  const $ = q => document.querySelector(q);
  const params = new URLSearchParams(location.search);
  const provider = params.get("provider") || "CJdropshipping";
  const id = params.get("id") || "";
  const requestedVariantId = params.get("variant_id") || "";
  let product = null;
  let variants = [];
  let selectedColor = null;
  let selectedSize = null;
  let selectedVariant = null;
  let quantity = 1;
  let zoomScale = 1;
  let galleryImages = [];
  let galleryIndex = 0;
  let renderedVariantId = "";
  let zoomReturnFocus = null;
  const variantQuoteCache = new Map();
  const variantQuoteErrors = new Map();
  let stockCheckInFlight = false;

  function cachedProduct() {
    try { return JSON.parse(sessionStorage.getItem(`hunt_product_${provider}:${id}`) || "null"); }
    catch { return null; }
  }

  function uniqueBy(items,key) {
    const seen = new Set();
    return items.filter(item=>{ const v=String(item[key]||""); if(!v||seen.has(v))return false; seen.add(v); return true; });
  }

  function variantsForColor(color) {
    return variants.filter(v => !color || v.color === color);
  }

  function variantQuoteKey(v,qty=quantity) {
    return String(v?.variant_id||"")+"|"+Math.max(1,Math.min(5,Number(qty)||1));
  }

  function isCjProduct() {
    return String(product?.provider||provider||"").toLowerCase().includes("cj");
  }

  function variantAvailability(v) {
    if(!v)return {state:"unknown",label:"Recheck",selectable:false,verified:false,cartReady:false};
    if(isCjProduct()){
      const key=variantQuoteKey(v);
      const quote=variantQuoteCache.get(key);
      if(quote?.stock_verified===true){
        return quote.stock_available===true
          ? {state:"available",label:"Stock verified for selected quantity",selectable:true,verified:true,cartReady:true}
          : {state:"unavailable",label:"Unavailable for selected quantity",selectable:false,verified:true,cartReady:false};
      }
      return {
        state:"recheck",
        label:variantQuoteErrors.has(key)?"Stock verification unavailable · try again":"Stock recheck required",
        selectable:true,
        verified:false,
        cartReady:false
      };
    }

    const raw=v.stock_quantity;
    const qty=Number(raw);
    const hasQty=raw!==null&&raw!==undefined&&raw!==""&&Number.isFinite(qty);
    if(v.availability_verified===true&&(!hasQty||qty>0)){
      return {state:"available",label:"Available in current supplier feed",selectable:true,verified:true,cartReady:true};
    }
    if(hasQty&&qty<=0){
      return {state:"unavailable",label:"Unavailable in current supplier feed",selectable:false,verified:true,cartReady:false};
    }
    return {state:"recheck",label:"Stock recheck required",selectable:true,verified:false,cartReady:false};
  }

  function chooseVariant() {
    let choices = variants;
    if (selectedColor) choices = choices.filter(v=>v.color===selectedColor);
    if (selectedSize) choices = choices.filter(v=>v.size===selectedSize);
    const colorChoices=variantsForColor(selectedColor);
    selectedVariant =
      choices.find(v=>variantAvailability(v).selectable) ||
      choices[0] ||
      colorChoices.find(v=>variantAvailability(v).selectable) ||
      colorChoices[0] ||
      variants.find(v=>variantAvailability(v).selectable) ||
      variants[0] ||
      null;
    if (selectedVariant) {
      selectedColor = selectedVariant.color || selectedColor;
      selectedSize = selectedVariant.size || selectedSize;
    }
  }

  function updateGalleryState({focusThumb=false,syncZoom=false}={}) {
    if(!galleryImages.length)return;
    galleryIndex=Math.max(0,Math.min(galleryImages.length-1,Number(galleryIndex)||0));
    const src=galleryImages[galleryIndex];
    const main=$("#hd-product-main-image");
    if(main){
      main.src=src;
      main.alt=(product?.title||"Product")+" · image "+(galleryIndex+1)+" of "+galleryImages.length;
    }
    document.querySelectorAll("[data-gallery-index]").forEach(button=>{
      const active=Number(button.dataset.galleryIndex)===galleryIndex;
      button.classList.toggle("active",active);
      button.setAttribute("aria-current",active?"true":"false");
      if(active&&focusThumb)button.focus();
    });
    const count=$("#hd-gallery-count");
    if(count){
      count.textContent=(galleryIndex+1)+" / "+galleryImages.length;
      count.hidden=galleryImages.length<=1;
    }
    const zoomCount=$("#hd-zoom-image-count");
    if(zoomCount)zoomCount.textContent=(galleryIndex+1)+" / "+galleryImages.length;
    if(syncZoom&&!$("#hd-image-zoom")?.hidden){
      const zoomImage=$("#hd-zoom-image");
      if(zoomImage){
        zoomImage.src=src;
        zoomImage.alt=(product?.title||"Product")+" · zoomed image "+(galleryIndex+1)+" of "+galleryImages.length;
      }
      setZoom(1);
    }
  }

  function moveGallery(step,{focusThumb=false,syncZoom=false}={}) {
    if(galleryImages.length<=1)return;
    galleryIndex=(galleryIndex+step+galleryImages.length)%galleryImages.length;
    updateGalleryState({focusThumb,syncZoom});
  }

  function renderGallery() {
    const previousSrc=galleryImages[galleryIndex]||"";
    const variantId=String(selectedVariant?.variant_id||"");
    const variantSrc=typeof selectedVariant?.image_url==="string"&&selectedVariant.image_url.startsWith("https://")
      ?selectedVariant.image_url
      :"";
    const variantChanged=variantId!==renderedVariantId;
    galleryImages=[...new Set([variantSrc, ...(product.gallery || []), product.image_url].filter(x=>typeof x==="string"&&x.startsWith("https://")))].slice(0,24);

    if(variantChanged&&variantSrc){
      const variantIndex=galleryImages.indexOf(variantSrc);
      galleryIndex=variantIndex>=0?variantIndex:0;
    }else{
      const preservedIndex=previousSrc?galleryImages.indexOf(previousSrc):-1;
      galleryIndex=preservedIndex>=0?preservedIndex:0;
    }
    renderedVariantId=variantId;

    const img=$("#hd-product-main-image");
    const thumbs=$("#hd-product-thumbs");
    if(!galleryImages.length){
      img?.removeAttribute("src");
      if(thumbs)thumbs.innerHTML="";
      $("#hd-product-gallery-meta").hidden=true;
      $("#hd-gallery-count").hidden=true;
      return;
    }
    if(thumbs){
      thumbs.innerHTML=galleryImages.map((src,i)=>`<button type="button" class="${i===galleryIndex?"active":""}" data-gallery-src="${H.esc(src)}" data-gallery-index="${i}" aria-label="View product image ${i+1} of ${galleryImages.length}" aria-current="${i===galleryIndex?"true":"false"}"><img src="${H.esc(src)}" alt="" loading="lazy"></button>`).join("");
      thumbs.querySelectorAll("[data-gallery-index]").forEach(button=>{
        button.addEventListener("click",event=>{
          event.preventDefault();
          event.stopPropagation();
          const index=Number(event.currentTarget?.dataset?.galleryIndex);
          if(!Number.isInteger(index)||index<0||index>=galleryImages.length)return;
          galleryIndex=index;
          updateGalleryState({focusThumb:true});
        });
      });
    }
    const meta=$("#hd-product-gallery-meta");
    if(meta)meta.hidden=galleryImages.length<=1;
    const total=$("#hd-product-gallery-total");
    if(total)total.textContent=galleryImages.length+" photo"+(galleryImages.length===1?"":"s");
    const prev=$("#hd-zoom-prev"),next=$("#hd-zoom-next");
    if(prev)prev.hidden=galleryImages.length<=1;
    if(next)next.hidden=galleryImages.length<=1;
    updateGalleryState();
  }

  function isDeviceCompatibilityContext() {
    const text=[product?.category,product?.type_name,product?.title].filter(Boolean).join(" ").toLowerCase();
    return /phone|iphone|samsung|pixel|galaxy|tablet|ipad|case|cover|protector|charger|cable|adapter/.test(text);
  }

  function renderVariantTruth() {
    const host=$("#hd-variant-truth");
    if(!host||!selectedVariant){
      if(host)host.hidden=true;
      return;
    }
    host.hidden=false;
    const state=variantAvailability(selectedVariant);
    const label=[selectedVariant.color,selectedVariant.size].filter(Boolean).join(" / ") || selectedVariant.title || selectedVariant.sku || "Selected option";
    $("#hd-variant-label").textContent=label;
    const availability=$("#hd-variant-availability");
    availability.textContent=state.label;
    availability.dataset.state=state.state;

    const explicitCompatibility=
      (Array.isArray(selectedVariant.compatible_models)&&selectedVariant.compatible_models.length?selectedVariant.compatible_models.join(", "):"") ||
      (Array.isArray(product?.compatible_models)&&product.compatible_models.length?product.compatible_models.join(", "):"") ||
      String(selectedVariant.compatibility||product?.compatibility||"").trim();
    const compatibility=$("#hd-variant-compatibility");
    compatibility.textContent=explicitCompatibility
      ? explicitCompatibility
      : isDeviceCompatibilityContext()&&selectedVariant?.size
        ? "Provider option "+String(selectedVariant.size)+" · compatibility not independently verified"
        : product?.model
          ? "No compatibility matrix · source model/SKU "+String(product.model)
          : "No structured compatibility matrix supplied";
    compatibility.dataset.state=explicitCompatibility?"known":"unknown";
  }

  function renderOptions() {
    const colorValues=[...new Set(variants.map(v=>String(v?.color||"").trim()).filter(Boolean))];
    const colorBlock=$("#hd-color-block");
    colorBlock.hidden=colorValues.length===0;
    $("#hd-color-options").innerHTML=colorValues.map(color=>{
      const group=variants.filter(v=>String(v?.color||"")===color);
      const representative=group[0]||{};
      const selectable=group.some(v=>variantAvailability(v).selectable);
      return `<button type="button" class="hd-color-choice ${color===selectedColor?"active":""}" data-color="${H.esc(color)}" title="${H.esc(color)}" ${selectable?"":'disabled aria-disabled="true" data-stock-state="unavailable"'}><i style="background:${/^#[0-9a-f]{6}$/i.test(representative.color_code||"")?representative.color_code:"#8aa1bd"}"></i><span>${H.esc(color)}</span></button>`;
    }).join("");
    $("#hd-selected-color").textContent = selectedColor || "—";

    const sizeVariants=variantsForColor(selectedColor);
    const sizeValues=[...new Set(sizeVariants.map(v=>String(v?.size||"").trim()).filter(Boolean))];
    const sizeBlock=$("#hd-size-block");
    sizeBlock.hidden=sizeValues.length===0;
    $("#hd-size-options").innerHTML=sizeValues.map(size=>{
      const optionVariants=sizeVariants.filter(v=>String(v?.size||"")===size);
      const states=optionVariants.map(v=>variantAvailability(v));
      const selectable=states.some(s=>s.selectable);
      const state=states.some(s=>s.state==="available")?"available":states.every(s=>s.state==="unavailable")?"unavailable":"recheck";
      return `<button type="button" class="${size===selectedSize?"active":""}" data-size="${H.esc(size)}" data-stock-state="${state}" ${selectable?"":'disabled aria-disabled="true"'}>${H.esc(size)}</button>`;
    }).join("");
    $("#hd-selected-size").textContent = selectedSize || "—";
    const sizeLabel=$("#hd-size-option-label");
    if(sizeLabel)sizeLabel.textContent=isDeviceCompatibilityContext()?"Model / option":"Size";

    const sizeTruth=$("#hd-size-truth");
    if(sizeTruth){
      sizeTruth.hidden=sizeValues.length===0;
      if(!sizeTruth.hidden){
        const system=String(selectedVariant?.size_system||"").trim();
        const source=String(selectedVariant?.size_source||product?.size_data_source||"").trim();
        if(isDeviceCompatibilityContext()){
          $("#hd-size-truth-title").textContent="Model / option truth";
          $("#hd-size-truth-copy").textContent="Provider option label: "+String(selectedVariant?.size||"current option")+". This identifies the supplier variant; compatibility with a specific device is not independently verified.";
        }else{
          $("#hd-size-truth-title").textContent="Size & fit truth";
          const sourceLabel=source&&source!=="NONE"?"Provider size data":"Size label from current variant";
          const systemLabel=system&&system!=="NONE"?" · system "+system:"";
          $("#hd-size-truth-copy").textContent=sourceLabel+systemLabel+". No verified measurement chart has been supplied for this product.";
        }
      }
    }
    renderVariantTruth();
  }

  function renderProductStructuredData() {
    if (!product) return;
    let script=document.querySelector("#hd-product-jsonld");
    if(!script){
      script=document.createElement("script");
      script.type="application/ld+json";
      script.id="hd-product-jsonld";
      document.head.appendChild(script);
    }
    const images=[...new Set([...(product.gallery||[]),product.image_url].filter(x=>typeof x==="string"&&x.startsWith("https://")))].slice(0,8);
    const canonicalUrl = new URL("/product.html", PROD_ORIGIN);
    canonicalUrl.searchParams.set("provider", provider);
    canonicalUrl.searchParams.set("id", id);
    const payload={
      "@context":"https://schema.org",
      "@type":"Product",
      "name":String(product.title||"Product"),
      "url":canonicalUrl.toString()
    };
    if(images.length)payload.image=images;
    if(product.description)payload.description=String(product.description).slice(0,4000);
    if(product.sku)payload.sku=String(product.sku);
    if(product.brand)payload.brand={"@type":"Brand","name":String(product.brand)};
    script.textContent=JSON.stringify(payload);

    let canonical=document.querySelector('link[rel="canonical"]');
    if(!canonical){
      canonical=document.createElement("link");
      canonical.rel="canonical";
      document.head.appendChild(canonical);
    }
    canonical.href=canonicalUrl.toString();
  }

  function currentRetailState() {
    const verified = (selectedVariant?.retail_price_verified ?? product?.retail_price_verified) === true;
    const gate = String(selectedVariant?.profit_gate_status ?? product?.profit_gate_status ?? "").toUpperCase();
    const raw = selectedVariant?.retail_price_amount ?? product?.retail_price_amount;
    const amount = Number(raw);
    const currency = String(selectedVariant?.retail_currency || product?.retail_currency || "USD");
    const ready = verified && gate === "PASS" && Number.isFinite(amount) && amount > 0;
    return {ready, amount:ready ? amount : null, currency, gate};
  }

  function renderDecisionCheck(retail, quoteVerified, selectedAvailability) {
    const host=$("#hd-decision-check-grid");
    if(!host)return;
    const fallbackAvailability=product?.availability_verified===true;
    const selectedKnown=Boolean(selectedVariant);
    const availabilityValue=selectedKnown
      ? selectedAvailability.label
      : quoteVerified
        ? "Quote verified"
        : fallbackAvailability
          ? "Product signal verified"
          : "Recheck";
    const availabilityState=selectedKnown
      ? (selectedAvailability.state==="available"?"known":selectedAvailability.state==="unavailable"?"blocked":"recheck")
      : (quoteVerified||fallbackAvailability?"known":"recheck");
    const cells=[
      {label:"Price",value:retail.ready?"Verified":"Needs check",state:retail.ready?"known":"recheck"},
      {label:"Options",value:variants.length?(String(variants.length)+" live"):"Not loaded",state:variants.length?"known":"unknown"},
      {label:"Availability",value:availabilityValue,state:availabilityState},
      {label:"Shipping",value:"Destination recheck",state:"recheck"}
    ];
    host.innerHTML=cells.map(cell=>'<div class="hd-decision-check-cell" data-state="'+H.esc(cell.state)+'"><span>'+H.esc(cell.label)+'</span><strong>'+H.esc(cell.value)+'</strong></div>').join("");
  }

  function renderBuybox() {
    chooseVariant();
    $("#hd-product-title").textContent = product.title || "Product";
    $("#hd-product-breadcrumb").textContent = product.title || "Product";
    $("#hd-product-provider").textContent = product.provider || provider;
    const providerName = String(product.provider || provider || "").toLowerCase();
    const quoteVerified = String(product?.quote_verification_status || "").toUpperCase() === "PASS";
    const retail = currentRetailState();
    const selectedAvailability=variantAvailability(selectedVariant);
    $("#hd-product-stock").textContent = selectedVariant
      ? selectedAvailability.state==="available"
        ? (quoteVerified?"QUOTE VERIFIED":"STOCK VERIFIED")
        : selectedAvailability.state==="unavailable"
          ? "OPTION UNAVAILABLE"
          : "STOCK RECHECK"
      : quoteVerified
        ? "QUOTE VERIFIED"
        : "DISCOVERY";
    $("#hd-product-stock").className = `hd-status ${selectedAvailability.state==="available"?"green":selectedAvailability.state==="unavailable"?"red":"blue"}`;
    $("#hd-product-price").textContent = retail.ready ? H.money(retail.amount, retail.currency) : "Price pending";
    renderDecisionCheck(retail, quoteVerified, selectedAvailability);
    syncMobilePrice();
    $("#hd-product-boom").textContent = H.personalReason(product);
    $("#hd-product-description").textContent = product.description || "The provider has not supplied a full description to HUNT yet.";
    $("#hd-product-gaps").innerHTML = (product.gaps || ["Provider variant feed is incomplete."]).map(x=>`<li>${H.esc(x)}</li>`).join("");
    const facts = [
      ["Brand",product.brand],["Type",product.type_name],["Model",product.model],["Origin",product.origin_country],
      ["Live variants",product.variant_count],["Fulfillment",product.avg_fulfillment_time]
    ].filter(([,v])=>v!==null&&v!==undefined&&v!=="");
    $("#hd-product-facts").innerHTML = facts.map(([k,v])=>`<div><span>${H.esc(k)}</span><strong>${H.esc(v)}</strong></div>`).join("");
    const cat=H.inferCategory(product); const def=H.categoryDefs[cat] || H.categoryDefs.women;
    $("#hd-product-category-link").href=H.categoryUrl(cat); $("#hd-product-category-link").textContent=def.title;
    document.title=`${product.title || "Product"} — HUNT`;
    renderOptions(); renderGallery(); renderProductStructuredData();
    const externalVisit = typeof product.external_visit_url === "string" && product.external_visit_url.startsWith("https://");
    const cjCheckoutReady = String(product.provider || provider || "").toLowerCase().includes("cj");
    const readyForCart = Boolean(selectedVariant) && cjCheckoutReady && selectedAvailability.cartReady;
    const canVerifyStock = Boolean(selectedVariant) && cjCheckoutReady && selectedAvailability.state==="recheck";
    const storeName = product?.store?.name || "partner store";
    const add = $("#hd-product-add");
    if (add) {
      add.disabled = stockCheckInFlight || (externalVisit ? false : !(readyForCart||canVerifyStock));
      add.setAttribute("aria-busy",String(stockCheckInFlight));
      add.textContent = stockCheckInFlight
        ? "Checking stock…"
        : externalVisit
          ? `Visit ${storeName} →`
          : readyForCart
            ? (retail.ready ? "Add to checkout preview →" : "Add for price check →")
            : canVerifyStock
              ? "Verify stock & add →"
              : !variants.length
                ? "Options pending"
                : selectedAvailability.state==="unavailable"
                  ? "Selected option unavailable"
                  : !cjCheckoutReady
                    ? "Checkout setup pending"
                    : "Check option";
    }
    const mobileAdd = $("#hd-mobile-add");
    if (mobileAdd) {
      mobileAdd.disabled = stockCheckInFlight || (externalVisit ? false : !(readyForCart||canVerifyStock));
      mobileAdd.setAttribute("aria-busy",String(stockCheckInFlight));
      mobileAdd.textContent = stockCheckInFlight
        ? "Checking…"
        : externalVisit
          ? "Visit store"
          : readyForCart
            ? (retail.ready ? "Add to Cart" : "Add for price check")
            : canVerifyStock
              ? "Verify & add"
              : !variants.length
                ? "Options pending"
                : selectedAvailability.state==="unavailable"
                  ? "Option unavailable"
                  : !cjCheckoutReady
                    ? "Setup pending"
                    : "Check option";
    }
    const quantityBlock = document.querySelector(".hd-product-quantity");
    if (quantityBlock) quantityBlock.hidden = externalVisit;
    window.dispatchEvent(new CustomEvent("hunt:product-state",{detail:{product,variants,selectedVariant,selectedAvailability,retail,provider:product.provider||provider}}));
  }

  function syncMobilePrice() {
    const mobile = $("#hd-mobile-price");
    if (!mobile || !product) return;
    const retail = currentRetailState();
    mobile.textContent = retail.ready ? H.money(retail.amount, retail.currency) : "Price pending";
  }

  function setZoom(scale) {
    zoomScale = Math.max(1, Math.min(3, Number(scale) || 1));
    const image = $("#hd-zoom-image");
    if (image) image.style.transform = `scale(${zoomScale})`;
    const level = $("#hd-zoom-level");
    if (level) level.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  function zoomFocusable() {
    const modal=$("#hd-image-zoom");
    if(!modal||modal.hidden)return [];
    return [...modal.querySelectorAll('button:not([hidden]):not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el=>el.offsetParent!==null);
  }

  function openZoom() {
    const main = $("#hd-product-main-image");
    const modal = $("#hd-image-zoom");
    const image = $("#hd-zoom-image");
    if (!main?.src || !modal || !image) return;
    const active=document.activeElement;
    zoomReturnFocus=active instanceof HTMLElement?active:$("#hd-zoom-open");
    image.src = galleryImages[galleryIndex] || main.src;
    image.alt = (product?.title||"Product")+" · zoomed image "+(galleryIndex+1)+" of "+Math.max(1,galleryImages.length);
    modal.hidden = false;
    document.body.classList.add("hd-modal-open");
    setZoom(1);
    updateGalleryState({syncZoom:true});
    $("#hd-zoom-close")?.focus();
  }

  function closeZoom() {
    const modal = $("#hd-image-zoom");
    if (!modal||modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("hd-modal-open");
    setZoom(1);
    const target=zoomReturnFocus;
    zoomReturnFocus=null;
    if(target?.isConnected)target.focus();
    else $("#hd-zoom-open")?.focus();
  }

  function handleZoomKeydown(event) {
    const modal=$("#hd-image-zoom");
    if(!modal||modal.hidden)return;
    if(event.key==="Escape"){
      event.preventDefault();
      closeZoom();
      return;
    }
    if(event.key==="ArrowLeft"){
      event.preventDefault();
      moveGallery(-1,{syncZoom:true});
      return;
    }
    if(event.key==="ArrowRight"){
      event.preventDefault();
      moveGallery(1,{syncZoom:true});
      return;
    }
    if(event.key!=="Tab")return;
    const focusable=zoomFocusable();
    if(!focusable.length){
      event.preventDefault();
      return;
    }
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){
      event.preventDefault();
      last.focus();
    }else if(!event.shiftKey&&document.activeElement===last){
      event.preventDefault();
      first.focus();
    }
  }

  async function verifySelectedVariantStock() {
    if(!selectedVariant)return variantAvailability(null);
    if(!isCjProduct())return variantAvailability(selectedVariant);
    const key=variantQuoteKey(selectedVariant);
    const existing=variantQuoteCache.get(key);
    if(existing?.stock_verified===true)return variantAvailability(selectedVariant);
    if(stockCheckInFlight)return variantAvailability(selectedVariant);

    stockCheckInFlight=true;
    renderBuybox();
    try{
      const url=new URL(H.functionsBase+"/hunt-cj-quote");
      url.searchParams.set("vid",String(selectedVariant.variant_id||""));
      url.searchParams.set("quantity",String(quantity));
      const response=await fetch(url,{
        cache:"no-store",
        headers:{apikey:H.publishableKey}
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.stock_verified!==true)throw new Error("STOCK_VERIFICATION_UNAVAILABLE");
      variantQuoteCache.set(key,{
        stock_verified:true,
        stock_available:data?.stock_available===true,
        checked_at:Date.now()
      });
      variantQuoteErrors.delete(key);
    }catch{
      variantQuoteErrors.set(key,true);
    }finally{
      stockCheckInFlight=false;
      renderBuybox();
    }
    return variantAvailability(selectedVariant);
  }

  async function addCurrentToCart() {
    if (!product) return;
    if (typeof product.external_visit_url === "string" && product.external_visit_url.startsWith("https://")) {
      let sid = localStorage.getItem("hunt_outbound_session_v1");
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem("hunt_outbound_session_v1", sid);
      }
      const destination = new URL(product.external_visit_url);
      destination.searchParams.set("src", location.pathname + location.search);
      destination.searchParams.set("sid", sid);
      location.href = destination.toString();
      return;
    }
    if (!selectedVariant) return;
    const retail = currentRetailState();
    const cjCheckoutReady = String(product.provider || provider || "").toLowerCase().includes("cj");
    if (!cjCheckoutReady) return;
    let selectedAvailability=variantAvailability(selectedVariant);
    if(!selectedAvailability.cartReady){
      selectedAvailability=await verifySelectedVariantStock();
    }
    if(!selectedAvailability.cartReady)return;
    H.addCart(product, selectedVariant, quantity);
    location.href = "checkout.html";
  }

  function renderFallback(cached) {
    const cachedGallery=[...new Set([...(Array.isArray(cached?.gallery)?cached.gallery:[]),cached?.image_url].filter(x=>typeof x==="string"&&x.startsWith("https://")))].slice(0,24);
    product = {...cached, gallery:cachedGallery, variants:[], variant_count:0, description:"Full provider detail and variant feed are not connected yet."};
    variants=[];
    renderBuybox();
    $("#hd-product-add").disabled=true;
    $("#hd-product-add").textContent="Variant feed required before cart";
    if ($("#hd-mobile-add")) {
      $("#hd-mobile-add").disabled = true;
      $("#hd-mobile-add").textContent = "Options pending";
    }
  }

  async function load() {
    if (!id) throw new Error("Missing product id");
    H.updateCartBadges();
    try {
      const cached=cachedProduct();
      const data = await H.storefront({provider,product_id:id});
      product={...(cached || {}),...(data.product || {})};
      variants=Array.isArray(product?.variants)?product.variants:[];
      selectedVariant=(requestedVariantId?variants.find(v=>String(v?.variant_id||"")===requestedVariantId):null)||variants[0]||null;
      selectedColor=selectedVariant?.color||null;
      selectedSize=selectedVariant?.size||null;
      H.recordSignal(product,"view");
      renderBuybox();
      window.HuntAnalytics?.viewItem(product, selectedVariant);
      window.dispatchEvent(new CustomEvent("hunt:product-loaded",{detail:{product,variants,selectedVariant}}));
    } catch (err) {
      const cached=cachedProduct();
      if (!cached) throw err;
      H.recordSignal(cached,"view");
      renderFallback(cached);
      window.HuntAnalytics?.viewItem(cached, null);
      window.dispatchEvent(new CustomEvent("hunt:product-loaded",{detail:{product,variants:[],selectedVariant:null,fallback:true}}));
    }
    $("#hd-product-loading").hidden=true;
  }

  document.addEventListener("click",event=>{
    const gallery=event.target.closest?.("[data-gallery-index]");
    if(gallery){
      galleryIndex=Number(gallery.dataset.galleryIndex)||0;
      updateGalleryState();
      return;
    }
    const color=event.target.closest?.("[data-color]");
    if(color){
      selectedColor=color.dataset.color;
      const available=variantsForColor(selectedColor);
      const current=available.find(v=>v.size===selectedSize&&variantAvailability(v).selectable);
      const preferred=current||available.find(v=>variantAvailability(v).selectable)||available[0]||null;
      selectedSize=preferred?.size||null;
      chooseVariant();
      renderBuybox();
      return;
    }
    const size=event.target.closest?.("[data-size]");
    if(size){ selectedSize=size.dataset.size; chooseVariant(); renderBuybox(); return; }
  });
  $("#hd-qty-minus")?.addEventListener("click",()=>{quantity=Math.max(1,quantity-1);$("#hd-qty-value").textContent=String(quantity);renderBuybox();});
  $("#hd-qty-plus")?.addEventListener("click",()=>{quantity=Math.min(5,quantity+1);$("#hd-qty-value").textContent=String(quantity);renderBuybox();});
  $("#hd-product-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-mobile-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-zoom-open")?.addEventListener("click",openZoom);
  $("#hd-product-main-image")?.addEventListener("click",openZoom);
  $("#hd-zoom-close")?.addEventListener("click",closeZoom);
  $("#hd-zoom-prev")?.addEventListener("click",()=>moveGallery(-1,{syncZoom:true}));
  $("#hd-zoom-next")?.addEventListener("click",()=>moveGallery(1,{syncZoom:true}));
  $("#hd-zoom-in")?.addEventListener("click",()=>setZoom(zoomScale + 0.25));
  $("#hd-zoom-out")?.addEventListener("click",()=>setZoom(zoomScale - 0.25));
  $("#hd-zoom-reset")?.addEventListener("click",()=>setZoom(1));
  $("#hd-image-zoom")?.addEventListener("click",event=>{ if(event.target.id === "hd-image-zoom") closeZoom(); });
  $("#hd-product-thumbs")?.addEventListener("keydown",event=>{
    const button=event.target.closest?.("[data-gallery-index]");
    if(!button||!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
    event.preventDefault();
    if(event.key==="Home")galleryIndex=0;
    else if(event.key==="End")galleryIndex=Math.max(0,galleryImages.length-1);
    else moveGallery(event.key==="ArrowLeft"?-1:1,{focusThumb:true});
    if(event.key==="Home"||event.key==="End")updateGalleryState({focusThumb:true});
  });
  document.addEventListener("keydown",handleZoomKeydown);

  load().catch(err=>{
    $("#hd-product-loading").hidden=true; $("#hd-product-layout").hidden=true; $("#hd-product-error").hidden=false; $("#hd-product-error-copy").textContent=err.message||"Product unavailable";
  });
})();
