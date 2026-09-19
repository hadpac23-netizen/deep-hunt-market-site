(() => {
  const H = window.HuntCore;
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
  let zoomReturnFocus = null;

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

  function chooseVariant() {
    let choices = variants;
    if (selectedColor) choices = choices.filter(v=>v.color===selectedColor);
    if (selectedSize) choices = choices.filter(v=>v.size===selectedSize);
    selectedVariant = choices[0] || variantsForColor(selectedColor)[0] || variants[0] || null;
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
    galleryImages=[...new Set([selectedVariant?.image_url, ...(product.gallery || []), product.image_url].filter(x=>typeof x==="string"&&x.startsWith("https://")))].slice(0,24);
    galleryIndex=0;
    const img=$("#hd-product-main-image");
    if(!galleryImages.length){
      img?.removeAttribute("src");
      $("#hd-product-thumbs").innerHTML="";
      $("#hd-product-gallery-meta").hidden=true;
      $("#hd-gallery-count").hidden=true;
      return;
    }
    $("#hd-product-thumbs").innerHTML=galleryImages.map((src,i)=>`<button type="button" class="${i===0?"active":""}" data-gallery-src="${H.esc(src)}" data-gallery-index="${i}" aria-label="View product image ${i+1} of ${galleryImages.length}" aria-current="${i===0?"true":"false"}"><img src="${H.esc(src)}" alt="" loading="lazy"></button>`).join("");
    const meta=$("#hd-product-gallery-meta");
    if(meta)meta.hidden=galleryImages.length<=1;
    const total=$("#hd-product-gallery-total");
    if(total)total.textContent=galleryImages.length+" photo"+(galleryImages.length===1?"":"s");
    const prev=$("#hd-zoom-prev"),next=$("#hd-zoom-next");
    if(prev)prev.hidden=galleryImages.length<=1;
    if(next)next.hidden=galleryImages.length<=1;
    updateGalleryState();
  }

  function renderOptions() {
    const colors = uniqueBy(variants,"color");
    const colorBlock=$("#hd-color-block");
    colorBlock.hidden = colors.length===0;
    $("#hd-color-options").innerHTML = colors.map(v=>`<button type="button" class="hd-color-choice ${v.color===selectedColor?"active":""}" data-color="${H.esc(v.color)}" title="${H.esc(v.color)}"><i style="background:${/^#[0-9a-f]{6}$/i.test(v.color_code||"")?v.color_code:"#8aa1bd"}"></i><span>${H.esc(v.color)}</span></button>`).join("");
    $("#hd-selected-color").textContent = selectedColor || "—";

    const sizes = uniqueBy(variantsForColor(selectedColor),"size");
    const sizeBlock=$("#hd-size-block");
    sizeBlock.hidden = sizes.length===0;
    $("#hd-size-options").innerHTML = sizes.map(v=>`<button type="button" class="${v.size===selectedSize?"active":""}" data-size="${H.esc(v.size)}">${H.esc(v.size)}</button>`).join("");
    $("#hd-selected-size").textContent = selectedSize || "—";
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

  function renderDecisionCheck(retail, quoteVerified) {
    const host=$("#hd-decision-check-grid");
    if(!host)return;
    const availabilityVerified=quoteVerified||product?.availability_verified===true;
    const cells=[
      {label:"Price",value:retail.ready?"Verified":"Needs check",state:retail.ready?"known":"recheck"},
      {label:"Options",value:variants.length?(String(variants.length)+" live"):"Not loaded",state:variants.length?"known":"unknown"},
      {label:"Availability",value:quoteVerified?"Quote verified":availabilityVerified?"Signal verified":"Recheck",state:availabilityVerified?"known":"recheck"},
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
    const quoteAtCheckout = providerName.includes("cj") && variants.length > 0 && retail.ready;
    $("#hd-product-stock").textContent = quoteVerified
      ? "QUOTE VERIFIED"
      : quoteAtCheckout
        ? "QUOTE AT CHECKOUT"
        : "DISCOVERY";
    $("#hd-product-stock").className = `hd-status ${quoteVerified?"green":"blue"}`;
    $("#hd-product-price").textContent = retail.ready ? H.money(retail.amount, retail.currency) : "Price pending";
    renderDecisionCheck(retail, quoteVerified);
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
    const readyForCart = variants.length > 0 && retail.ready && cjCheckoutReady;
    const storeName = product?.store?.name || "partner store";
    const add = $("#hd-product-add");
    if (add) {
      add.disabled = externalVisit ? false : !readyForCart;
      add.textContent = externalVisit
        ? `Visit ${storeName} →`
        : readyForCart
          ? "Add to checkout preview →"
          : !variants.length
            ? "Options pending"
            : !cjCheckoutReady
              ? "Checkout setup pending"
              : "Price verification pending";
    }
    const mobileAdd = $("#hd-mobile-add");
    if (mobileAdd) {
      mobileAdd.disabled = externalVisit ? false : !readyForCart;
      mobileAdd.textContent = externalVisit
        ? "Visit store"
        : readyForCart
          ? "Add to Cart"
          : !variants.length
            ? "Options pending"
            : !cjCheckoutReady
              ? "Setup pending"
              : "Price pending";
    }
    const quantityBlock = document.querySelector(".hd-product-quantity");
    if (quantityBlock) quantityBlock.hidden = externalVisit;
    window.dispatchEvent(new CustomEvent("hunt:product-state",{detail:{product,variants,selectedVariant,retail,provider:product.provider||provider}}));
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

  function addCurrentToCart() {
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
    if (!retail.ready || !cjCheckoutReady) return;
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
    if(color){ selectedColor=color.dataset.color; const available=variantsForColor(selectedColor); selectedSize=available.some(v=>v.size===selectedSize)?selectedSize:(available[0]?.size||null); chooseVariant(); renderBuybox(); return; }
    const size=event.target.closest?.("[data-size]");
    if(size){ selectedSize=size.dataset.size; chooseVariant(); renderBuybox(); return; }
  });
  $("#hd-qty-minus")?.addEventListener("click",()=>{quantity=Math.max(1,quantity-1);$("#hd-qty-value").textContent=String(quantity);});
  $("#hd-qty-plus")?.addEventListener("click",()=>{quantity=Math.min(5,quantity+1);$("#hd-qty-value").textContent=String(quantity);});
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
