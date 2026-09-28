(() => {
  const H = window.HuntCore;
  const runtime = window.BoomRuntime;
  const $ = q => document.querySelector(q);
  const params = new URLSearchParams(location.search);
  const sourceMap={h1:"CJdropshipping",h2:"EPROLO",h3:"Printful",h4:"Gooten"};
  const provider = params.get("provider") || sourceMap[params.get("src")] || "Printful";
  const id = params.get("id") || "";
  let product = null;
  let variants = [];
  let selectedColor = null;
  let selectedSize = null;
  let selectedVariant = null;
  let quantity = 1;
  let zoomScale = 1;

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

  function renderGallery() {
    const images = [...new Set([selectedVariant?.image_url, ...(product.gallery || []), product.image_url].filter(x=>typeof x==="string"&&x.startsWith("https://")))].slice(0,24);
    const main = images[0] || "";
    const img = $("#hd-product-main-image");
    if (main) { img.src=main; img.alt=product.title || "Product"; }
    else img.removeAttribute("src");
    $("#hd-product-thumbs").innerHTML = images.map((src,i)=>`<button type="button" class="${i===0?"active":""}" data-gallery-src="${H.esc(src)}"><img src="${H.esc(src)}" alt="${H.esc(product.title||"Product")} view ${i+1}" loading="lazy"></button>`).join("");
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

  function humanLabel(key) {
    return String(key||"").replace(/[_-]+/g," ").replace(/\b\w/g,m=>m.toUpperCase());
  }

  function simpleValue(value) {
    return typeof value==="string" || typeof value==="number" || typeof value==="boolean";
  }

  function verifiedMeasurementRows() {
    const rows=[];
    const pushObject=(obj,source="Verified")=>{
      if(!obj||typeof obj!=="object"||Array.isArray(obj))return;
      for(const [key,value] of Object.entries(obj)){
        if(value===null||value===undefined||value===""||typeof value==="object")continue;
        const raw=String(value);
        const cmKey=/_cm$/i.test(key);
        const numeric=Number(value);
        let display=raw;
        if(cmKey&&Number.isFinite(numeric)){
          display=numeric+" cm · "+(numeric/2.54).toFixed(2)+" in";
        }
        rows.push({label:humanLabel(key.replace(/_cm$/i,"")),value:display,source});
      }
    };
    pushObject(selectedVariant?.measurements,"Exact variant");
    pushObject(selectedVariant?.size_measurements,"Exact variant");
    pushObject(product?.measurements,"Product");
    pushObject(product?.size_measurements,"Product");
    pushObject(product?.dimensions,"Product");
    return rows.filter((row,index,array)=>array.findIndex(x=>x.label===row.label&&x.value===row.value)===index).slice(0,40);
  }

  function renderVerifiedSpecs() {
    const section=$("#hd-size-measurement-section");
    const equivalents=$("#hd-size-equivalents");
    const tableWrap=$("#hd-measurement-table-wrap");
    const exact=selectedVariant||{};
    const sizePairs=[
      ["Supplier size",exact.size||product?.size],
      ["US",exact.size_us||exact.us_size||product?.size_us||product?.us_size],
      ["UK",exact.size_uk||exact.uk_size||product?.size_uk||product?.uk_size],
      ["EU",exact.size_eu||exact.eu_size||product?.size_eu||product?.eu_size]
    ].filter(([,v])=>v!==null&&v!==undefined&&v!=="");
    const rows=verifiedMeasurementRows();
    if(section){
      section.hidden=!sizePairs.length&&!rows.length;
      if(equivalents)equivalents.innerHTML=sizePairs.map(([k,v])=>`<div class="hd-size-equivalent"><span>${H.esc(k)}</span><strong>${H.esc(v)}</strong></div>`).join("");
      if(tableWrap){
        tableWrap.innerHTML=rows.length
          ? `<div class="hd-measurement-table">${rows.map(row=>`<div><span>${H.esc(row.label)}</span><strong>${H.esc(row.value)}</strong><small>${H.esc(row.source)}</small></div>`).join("")}</div>`
          : "";
      }
    }

    const attributeSection=$("#hd-attribute-section");
    const grid=$("#hd-product-attribute-grid");
    const attrs=[];
    const add=(label,value)=>{
      if(value===null||value===undefined||value===""||typeof value==="object")return;
      const key=String(label).toLowerCase();
      if(attrs.some(x=>x.key===key))return;
      attrs.push({key,label,value});
    };
    const known=[
      ["Material",exact.material||product?.material],
      ["Fit",exact.fit||product?.fit],
      ["Pattern",exact.pattern||product?.pattern],
      ["Color",exact.color||selectedColor||product?.color],
      ["Capacity",exact.capacity||product?.capacity],
      ["Storage",exact.storage||product?.storage],
      ["Memory",exact.memory||product?.memory],
      ["Voltage",exact.voltage||product?.voltage],
      ["Plug",exact.plug||product?.plug],
      ["Weight",exact.weight||product?.weight],
      ["Length",exact.length||product?.length],
      ["Width",exact.width||product?.width],
      ["Height",exact.height||product?.height],
      ["Model",exact.model||product?.model],
      ["Finish",exact.finish||product?.finish],
      ["Movement",exact.movement||product?.movement],
      ["Compatibility",exact.compatibility||product?.compatibility],
      ["Care",exact.care||product?.care]
    ];
    known.forEach(([k,v])=>add(k,v));
    for(const source of [product?.attributes,product?.specifications,exact?.attributes,exact?.specifications]){
      if(!source||typeof source!=="object"||Array.isArray(source))continue;
      for(const [k,v] of Object.entries(source))if(simpleValue(v))add(humanLabel(k),v);
    }
    if(attributeSection)attributeSection.hidden=!attrs.length;
    if(grid)grid.innerHTML=attrs.slice(0,30).map(x=>`<div><span>${H.esc(x.label)}</span><strong>${H.esc(x.value)}</strong></div>`).join("");
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
    const payload={
      "@context":"https://schema.org",
      "@type":"Product",
      "name":String(product.title||"Product"),
      "url":location.href.split("#")[0]
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
    canonical.href=location.href.split("#")[0];
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

  function renderBuybox() {
    chooseVariant();
    $("#hd-product-title").textContent = product.title || "Product";
    $("#hd-product-breadcrumb").textContent = product.title || "Product";
    $("#hd-product-provider").textContent = "HUNT VERIFIED";
    const providerName = String(product.provider || provider || "").toLowerCase();
    const podCatalog = providerName.includes("printful") || providerName.includes("gooten");
    const quotePassed = String(product?.quote_verification_status || "").toUpperCase() === "PASS";
    const quoteEvidence = H.evidenceState?.("product_truth",product) || {state:"UNKNOWN",recheck_required:true};
    const quoteFresh = quotePassed && quoteEvidence.state === "FRESH";
    const quoteNeedsRecheck = quotePassed && quoteEvidence.state !== "FRESH";
    const retail = currentRetailState();
    const quoteAtCheckout = providerName.includes("cj") && variants.length > 0 && retail.ready;
    $("#hd-product-stock").textContent = quoteFresh
      ? "QUOTE VERIFIED"
      : quoteNeedsRecheck
        ? "QUOTE RECHECK"
        : podCatalog
          ? "POD CATALOG"
          : quoteAtCheckout
            ? "QUOTE AT CHECKOUT"
            : "DISCOVERY";
    $("#hd-product-stock").className = `hd-status ${quoteFresh?"green":"blue"}`;
    $("#hd-product-price").textContent = retail.ready ? H.money(retail.amount, retail.currency) : "Price pending";
    syncMobilePrice();
    $("#hd-product-boom").textContent = H.personalReason(product);
    $("#hd-product-description").textContent = product.description || "Product details are being refreshed by HUNT.";
    $("#hd-product-gaps").innerHTML = (product.gaps || ["Some product options are still being refreshed."]).map(x=>`<li>${H.esc(x)}</li>`).join("");
    const facts = [
      ["Brand",product.brand],["Type",product.type_name],["Model",product.model],["Origin",product.origin_country],
      ["Live variants",product.variant_count],["Fulfillment",product.avg_fulfillment_time]
    ].filter(([,v])=>v!==null&&v!==undefined&&v!=="");
    $("#hd-product-facts").innerHTML = facts.map(([k,v])=>`<div><span>${H.esc(k)}</span><strong>${H.esc(v)}</strong></div>`).join("");
    const cat=H.inferCategory(product); const def=H.categoryDefs[cat] || H.categoryDefs.women;
    $("#hd-product-category-link").href=H.categoryUrl(cat); $("#hd-product-category-link").textContent=def.title;
    document.title=`${product.title || "Product"} — HUNT DEAL`;
    renderOptions(); renderGallery(); renderVerifiedSpecs(); renderProductStructuredData();
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

  function openZoom() {
    const main = $("#hd-product-main-image");
    const modal = $("#hd-image-zoom");
    const image = $("#hd-zoom-image");
    if (!main?.src || !modal || !image) return;
    image.src = main.src;
    image.alt = main.alt || product?.title || "Product image";
    modal.hidden = false;
    document.body.classList.add("hd-modal-open");
    setZoom(1);
    $("#hd-zoom-close")?.focus();
  }

  function closeZoom() {
    const modal = $("#hd-image-zoom");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("hd-modal-open");
    setZoom(1);
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
      runtime?.emit?.("product.external.visit",{provider:String(product.provider||provider||""),item_id:String(product.item_id||id||"")},{broadcast:false});
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
    product = {...cached, gallery:[cached.image_url].filter(Boolean), variants:[], variant_count:0, description:"Full product detail and option availability are still being refreshed."};
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
      selectedVariant=variants[0]||null;
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
    const gallery=event.target.closest?.("[data-gallery-src]");
    if(gallery){
      $("#hd-product-main-image").src=gallery.dataset.gallerySrc;
      document.querySelectorAll("[data-gallery-src]").forEach(x=>x.classList.toggle("active",x===gallery));
      runtime?.emit?.("product.gallery.select",{provider,item_id:id},{broadcast:false});
      return;
    }
    const color=event.target.closest?.("[data-color]");
    if(color){
      selectedColor=color.dataset.color;
      const available=variantsForColor(selectedColor);
      selectedSize=available.some(v=>v.size===selectedSize)?selectedSize:(available[0]?.size||null);
      chooseVariant(); renderBuybox();
      runtime?.emit?.("product.variant.color.select",{provider,item_id:id,value:String(selectedColor||"")},{broadcast:false});
      return;
    }
    const size=event.target.closest?.("[data-size]");
    if(size){
      selectedSize=size.dataset.size; chooseVariant(); renderBuybox();
      runtime?.emit?.("product.variant.size.select",{provider,item_id:id,value:String(selectedSize||"")},{broadcast:false});
      return;
    }
  });
  $("#hd-qty-minus")?.addEventListener("click",()=>{
    quantity=Math.max(1,quantity-1);$("#hd-qty-value").textContent=String(quantity);
    runtime?.emit?.("product.quantity.change",{provider,item_id:id,qty:quantity},{broadcast:false});
  });
  $("#hd-qty-plus")?.addEventListener("click",()=>{
    quantity=Math.min(5,quantity+1);$("#hd-qty-value").textContent=String(quantity);
    runtime?.emit?.("product.quantity.change",{provider,item_id:id,qty:quantity},{broadcast:false});
  });
  $("#hd-product-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-mobile-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-zoom-open")?.addEventListener("click",()=>{openZoom();runtime?.emit?.("product.zoom.change",{state:"open",provider,item_id:id},{broadcast:false});});
  $("#hd-product-main-image")?.addEventListener("click",()=>{openZoom();runtime?.emit?.("product.zoom.change",{state:"open",provider,item_id:id},{broadcast:false});});
  $("#hd-zoom-close")?.addEventListener("click",()=>{closeZoom();runtime?.emit?.("product.zoom.change",{state:"close",provider,item_id:id},{broadcast:false});});
  $("#hd-zoom-in")?.addEventListener("click",()=>{setZoom(zoomScale + 0.25);runtime?.emit?.("product.zoom.change",{state:"zoom_in",level:zoomScale},{broadcast:false});});
  $("#hd-zoom-out")?.addEventListener("click",()=>{setZoom(zoomScale - 0.25);runtime?.emit?.("product.zoom.change",{state:"zoom_out",level:zoomScale},{broadcast:false});});
  $("#hd-zoom-reset")?.addEventListener("click",()=>{setZoom(1);runtime?.emit?.("product.zoom.change",{state:"reset",level:zoomScale},{broadcast:false});});
  $("#hd-image-zoom")?.addEventListener("click",event=>{ if(event.target.id === "hd-image-zoom") closeZoom(); });
  document.addEventListener("keydown",event=>{ if(event.key === "Escape" && !$("#hd-image-zoom")?.hidden) closeZoom(); });

  load().catch(err=>{
    $("#hd-product-loading").hidden=true; $("#hd-product-layout").hidden=true; $("#hd-product-error").hidden=false; $("#hd-product-error-copy").textContent=err.message||"Product unavailable";
  });
})();
