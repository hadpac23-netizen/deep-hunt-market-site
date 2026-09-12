(() => {
  const H = window.HuntCore;
  const $ = q => document.querySelector(q);
  const params = new URLSearchParams(location.search);
  const provider = params.get("provider") || "Printful";
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

  async function snapshotProduct() {
    const wantedProvider = String(provider || "").toLowerCase();
    const wantedId = String(id || "");
    for (const source of ["catalog-fashion/home.json?v=fashion1","catalog-home.json?v=platform1"]) {
      try {
        const res = await fetch(source, {cache:"force-cache"});
        if (!res.ok) continue;
        const data = await res.json();
        for (const rows of Object.values(data?.shelves || {})) {
          for (const item of Array.isArray(rows) ? rows : []) {
            if (String(item?.item_id || "") !== wantedId) continue;
            if (String(item?.provider || "").toLowerCase() !== wantedProvider) continue;
            try { sessionStorage.setItem(`hunt_product_${provider}:${id}`, JSON.stringify(item)); } catch {}
            return item;
          }
        }
      } catch {}
    }
    return null;
  }

  function uniqueBy(items,key) {
    const seen = new Set();
    return items.filter(item=>{ const v=String(item[key]||""); if(!v||seen.has(v))return false; seen.add(v); return true; });
  }

  function variantsForColor(color) {
    return variants.filter(v => !color || v.color === color);
  }

  function sizeRank(value) {
    const raw=String(value||"").trim().toUpperCase();
    const alpha={XXXS:10,XXS:20,XS:30,S:40,M:50,L:60,XL:70,XXL:80,XXXL:90,"2XL":80,"3XL":90,"4XL":100,"5XL":110,"6XL":120,"ONE SIZE":130,"FREE SIZE":130};
    if (alpha[raw] != null) return alpha[raw];
    const prefixed=raw.match(/^(EU|US|UK)\s*(\d{1,3}(?:\.5)?)(?:\s*[-\/]\s*(\d{1,3}(?:\.5)?))?$/);
    if (prefixed) return 1000 + Number(prefixed[2]);
    const numericRange=raw.match(/^(\d{1,3}(?:\.5)?)\s*[-\/]\s*(\d{1,3}(?:\.5)?)$/);
    if (numericRange) return 1100 + Number(numericRange[1]);
    const numeric=raw.match(/^(\d{1,3}(?:\.5)?)$/);
    if (numeric) return 1200 + Number(numeric[1]);
    const bra=raw.match(/^(\d{1,2})\s*([A-K])$/);
    if (bra) return 1400 + Number(bra[1]) + (bra[2].charCodeAt(0)-65)/10;
    const waistInseam=raw.match(/^(\d{2})\s*X\s*(\d{2})$/);
    if (waistInseam) return 1600 + Number(waistInseam[1]) + Number(waistInseam[2])/100;
    const cm=raw.match(/^(\d{2,3})\s*CM$/);
    if (cm) return 2000 + Number(cm[1]);
    const age=raw.match(/^(\d{1,2})(?:[-\/]\d{1,2})?\s*(?:M|Y|YR|YRS)$/);
    if (age) return 3000 + Number(age[1]);
    const toddler=raw.match(/^(\d{1,2})T$/);
    if (toddler) return 4000 + Number(toddler[1]);
    return 9000;
  }

  function compareSizes(a,b) {
    const ra=sizeRank(a?.size), rb=sizeRank(b?.size);
    return ra-rb || String(a?.size||"").localeCompare(String(b?.size||""),undefined,{numeric:true,sensitivity:"base"});
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
    const colors = uniqueBy(variants,"color").sort((a,b)=>String(a.color||"").localeCompare(String(b.color||""),undefined,{sensitivity:"base"}));
    const colorBlock=$("#hd-color-block");
    colorBlock.hidden = colors.length===0;
    $("#hd-color-options").innerHTML = colors.map(v=>`<button type="button" class="hd-color-choice ${v.color===selectedColor?"active":""}" data-color="${H.esc(v.color)}" title="${H.esc(v.color)}"><i style="background:${/^#[0-9a-f]{6}$/i.test(v.color_code||"")?v.color_code:"#8aa1bd"}"></i><span>${H.esc(v.color)}</span></button>`).join("");
    $("#hd-selected-color").textContent = selectedColor || "—";

    const sizes = uniqueBy(variantsForColor(selectedColor),"size").sort(compareSizes);
    const sizeBlock=$("#hd-size-block");
    sizeBlock.hidden = sizes.length===0;
    $("#hd-size-options").innerHTML = sizes.map(v=>`<button type="button" class="${v.size===selectedSize?"active":""}" data-size="${H.esc(v.size)}">${H.esc(v.size)}</button>`).join("");
    $("#hd-selected-size").textContent = selectedSize || "—";
    const sizeSource=$("#hd-size-source");
    if(sizeSource) {
      const system=String(selectedVariant?.size_system || sizes.find(v=>v?.size_system)?.size_system || "PROVIDER");
      sizeSource.textContent = sizes.length
        ? `Provider-reported size · ${system} · exact stock is verified for the selected variant.`
        : "No provider size options were supplied for this item.";
    }
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

  function renderBuybox() {
    chooseVariant();
    $("#hd-product-title").textContent = product.title || "Product";
    $("#hd-product-breadcrumb").textContent = product.title || "Product";
    $("#hd-product-provider").textContent = product.provider || provider;
    const cjNeedsVariantCheck = String(product?.provider || provider).toLowerCase().includes("cj") &&
      product?.variant_stock_recheck_required === true && variants.length > 0;
    $("#hd-product-stock").textContent = product.availability_verified ? "IN STOCK" : (cjNeedsVariantCheck ? "CHECK SIZE STOCK" : "DISCOVERY");
    $("#hd-product-stock").className = `hd-status ${product.availability_verified?"green":"blue"}`;
    const retailAmount = selectedVariant?.retail_price_amount ?? product.retail_price_amount;
    const retailCurrency = selectedVariant?.retail_currency || product.retail_currency || selectedVariant?.currency || product.currency || "USD";
    const retailVerified = (selectedVariant?.retail_price_verified ?? product.retail_price_verified) === true &&
      String(selectedVariant?.profit_gate_status || product.profit_gate_status || "") === "PASS";
    const basis = String(product.price_basis || "SUPPLIER_BASE").toUpperCase();
    const verifiedRetail = retailVerified;
    $("#hd-product-price").textContent = verifiedRetail ? H.money(retailAmount, retailCurrency) : "Price pending";
    const basisCopy = $("#hd-product-price-basis");
    if (basisCopy) {
      basisCopy.textContent = verifiedRetail
        ? "Verified HUNT retail price · Profit Gate PASS"
        : basis === "MERCHANT_RETAIL"
          ? "Retail price supplied by merchant · HUNT checkout verification pending"
          : "Customer retail price is not verified yet";
    }
    const shippingCopy = $("#hd-product-shipping");
    if (shippingCopy) shippingCopy.textContent = product.shipping_verified === true && product.shipping_summary
      ? String(product.shipping_summary)
      : "Pending a verified destination quote.";
    const returnsCopy = $("#hd-product-returns");
    if (returnsCopy) returnsCopy.textContent = product.returns_policy_verified === true && product.returns_summary
      ? String(product.returns_summary)
      : "Provider return policy not verified yet.";
    syncMobilePrice();
    $("#hd-product-boom").textContent = H.personalReason(product);
    $("#hd-product-description").textContent = product.description || "The provider has not supplied a full description to HUNT DEAL yet.";
    $("#hd-product-gaps").innerHTML = (product.gaps || ["Provider variant feed is incomplete."]).map(x=>`<li>${H.esc(x)}</li>`).join("");
    const facts = [
      ["Brand",product.brand],["Type",product.type_name],["Model",product.model],["Origin",product.origin_country],
      ["Live variants",product.variant_count],["Fulfillment",product.avg_fulfillment_time]
    ].filter(([,v])=>v!==null&&v!==undefined&&v!=="");
    $("#hd-product-facts").innerHTML = facts.map(([k,v])=>`<div><span>${H.esc(k)}</span><strong>${H.esc(v)}</strong></div>`).join("");
    const cat=H.inferCategory(product); const def=H.categoryDefs[cat] || H.categoryDefs.women;
    $("#hd-product-category-link").href=H.categoryUrl(cat); $("#hd-product-category-link").textContent=def.title;
    document.title=`${product.title || "Product"} — HUNT DEAL`;
    renderOptions(); renderGallery(); renderProductStructuredData();
    const isCJ = String(product?.provider || provider).toLowerCase().includes("cj");
    const onsiteEligible = H.onsiteCheckoutEligible?.(product) === true;
    const readyForCart = onsiteEligible && verifiedRetail && variants.length > 0;
    const checkoutBlocked = !onsiteEligible || !verifiedRetail;
    const blockedReason = !onsiteEligible
      ? "HUNT checkout integration pending for this supplier"
      : !verifiedRetail
        ? "Retail price verification pending"
        : "Options pending";
    const add = $("#hd-product-add");
    if (add) {
      add.disabled = !readyForCart;
      add.textContent = readyForCart ? (isCJ ? "Verify stock & add →" : "Add to HUNT checkout →") : blockedReason;
    }
    const mobileAdd = $("#hd-mobile-add");
    if (mobileAdd) {
      mobileAdd.disabled = !readyForCart;
      mobileAdd.textContent = readyForCart ? (isCJ ? "Verify & add" : "Add to Cart") : blockedReason;
    }
    const quantityBlock = document.querySelector(".hd-product-quantity");
    if (quantityBlock) quantityBlock.hidden = checkoutBlocked;
  }

  function syncMobilePrice() {
    const mobile = $("#hd-mobile-price");
    if (!mobile || !product) return;
    const retailVerified = (selectedVariant?.retail_price_verified ?? product?.retail_price_verified) === true &&
      String(selectedVariant?.profit_gate_status || product?.profit_gate_status || "") === "PASS";
    mobile.textContent = retailVerified
      ? H.money(selectedVariant?.retail_price_amount ?? product?.retail_price_amount, selectedVariant?.retail_currency || product?.retail_currency || "USD")
      : "Price pending";
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

  async function addCurrentToCart() {
    if (!product) return;
    if (H.onsiteCheckoutEligible?.(product) !== true) return;
    const retailVerified = (selectedVariant?.retail_price_verified ?? product?.retail_price_verified) === true &&
      String(selectedVariant?.profit_gate_status || product?.profit_gate_status || "") === "PASS";
    if (!retailVerified || !selectedVariant) return;
    const isCJ = String(product?.provider || provider).toLowerCase().includes("cj");
    if (isCJ) {
      const buttons = [$("#hd-product-add"), $("#hd-mobile-add")].filter(Boolean);
      buttons.forEach(button=>{ button.disabled=true; button.textContent="Verifying stock…"; });
      try {
        const country = window.HuntCountry?.current?.() || "";
        if (!country || country === "ZZ") {
          buttons.forEach(button=>{ button.disabled=false; button.textContent="Choose shipping country first"; });
          return;
        }
        const quote = await H.cjQuote({vid:selectedVariant.variant_id,country_code:country,quantity});
        if (!quote?.stock_verified || !quote?.stock_available) {
          buttons.forEach(button=>{ button.disabled=true; button.textContent="Currently unavailable"; });
          $("#hd-product-stock").textContent="OUT OF STOCK";
          $("#hd-product-stock").className="hd-status";
          return;
        }
        const hasShipping = quote?.shipping_verified === true && Array.isArray(quote?.shipping_options) && quote.shipping_options.length > 0;
        if (!hasShipping) {
          buttons.forEach(button=>{ button.disabled=true; button.textContent="Shipping unavailable to selected country"; });
          return;
        }
        selectedVariant.stock_quantity = Number(quote?.selected_origin?.total_inventory || 0);
        selectedVariant.availability_verified = true;
        product.availability_verified = true;
        product.shipping_verified = true;
        product.shipping_country = country;
      } catch {
        buttons.forEach(button=>{ button.disabled=false; button.textContent="Try stock check again"; });
        return;
      }
    }
    try {
      H.addCart(product, selectedVariant, quantity);
      location.href = window.HuntLightPreview?.rewrite?.("checkout.html") || "checkout.html";
    } catch (error) {
      const buttons = [$("#hd-product-add"), $("#hd-mobile-add")].filter(Boolean);
      buttons.forEach(button=>{ button.disabled=false; button.textContent=String(error?.message || "Shipping verification required"); });
    }
  }

  function renderFallback(cached) {
    product = {...cached, gallery:[cached.image_url].filter(Boolean), variants:[], variant_count:0, description:"Full provider detail and variant feed are not connected yet."};
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
      const data = await Promise.race([
        H.storefront({provider,product_id:id}),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error("Provider detail timeout")),12000))
      ]);
      product=data.product;
      variants=Array.isArray(product?.variants)?product.variants:[];
      selectedVariant=variants[0]||null;
      selectedColor=selectedVariant?.color||null;
      selectedSize=selectedVariant?.size||null;
      H.recordSignal(product,"view");
      renderBuybox();
      window.HuntAnalytics?.viewItem(product, selectedVariant);
      window.dispatchEvent(new CustomEvent("hunt:product-loaded",{detail:{product,variants,selectedVariant}}));
    } catch (err) {
      const fallback = cachedProduct() || await snapshotProduct();
      if (!fallback) throw err;
      H.recordSignal(fallback,"view");
      renderFallback(fallback);
      window.HuntAnalytics?.viewItem(fallback, null);
      window.dispatchEvent(new CustomEvent("hunt:product-loaded",{detail:{product,variants:[],selectedVariant:null,fallback:true}}));
    }
    $("#hd-product-loading").hidden=true;
  }

  document.addEventListener("click",event=>{
    const gallery=event.target.closest?.("[data-gallery-src]");
    if(gallery){ $("#hd-product-main-image").src=gallery.dataset.gallerySrc; document.querySelectorAll("[data-gallery-src]").forEach(x=>x.classList.toggle("active",x===gallery)); return; }
    const color=event.target.closest?.("[data-color]");
    if(color){ selectedColor=color.dataset.color; const available=variantsForColor(selectedColor); selectedSize=available.some(v=>v.size===selectedSize)?selectedSize:(available[0]?.size||null); chooseVariant(); renderBuybox(); return; }
    const size=event.target.closest?.("[data-size]");
    if(size){ selectedSize=size.dataset.size; chooseVariant(); renderBuybox(); return; }
  });
  $("#hd-qty-minus")?.addEventListener("click",()=>{quantity=Math.max(1,quantity-1);$("#hd-qty-value").textContent=String(quantity);});
  $("#hd-qty-plus")?.addEventListener("click",()=>{const maxQty=String(product?.provider||provider).toLowerCase().includes("cj")?5:20;quantity=Math.min(maxQty,quantity+1);$("#hd-qty-value").textContent=String(quantity);});
  $("#hd-product-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-mobile-add")?.addEventListener("click",addCurrentToCart);
  $("#hd-zoom-open")?.addEventListener("click",openZoom);
  $("#hd-product-main-image")?.addEventListener("click",openZoom);
  $("#hd-zoom-close")?.addEventListener("click",closeZoom);
  $("#hd-zoom-in")?.addEventListener("click",()=>setZoom(zoomScale + 0.25));
  $("#hd-zoom-out")?.addEventListener("click",()=>setZoom(zoomScale - 0.25));
  $("#hd-zoom-reset")?.addEventListener("click",()=>setZoom(1));
  $("#hd-image-zoom")?.addEventListener("click",event=>{ if(event.target.id === "hd-image-zoom") closeZoom(); });
  document.addEventListener("keydown",event=>{ if(event.key === "Escape" && !$("#hd-image-zoom")?.hidden) closeZoom(); });

  load().catch(err=>{
    $("#hd-product-loading").hidden=true; $("#hd-product-layout").hidden=true; $("#hd-product-error").hidden=false; $("#hd-product-error-copy").textContent=err.message||"Product unavailable";
  });
})();
