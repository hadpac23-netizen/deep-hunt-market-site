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
    try {
      const res = await fetch("catalog-home.json?v=platform1", {cache:"force-cache"});
      if (!res.ok) return null;
      const data = await res.json();
      const wantedProvider = String(provider || "").toLowerCase();
      const wantedId = String(id || "");
      for (const rows of Object.values(data?.shelves || {})) {
        for (const item of Array.isArray(rows) ? rows : []) {
          if (String(item?.item_id || "") !== wantedId) continue;
          if (String(item?.provider || "").toLowerCase() !== wantedProvider) continue;
          try { sessionStorage.setItem(`hunt_product_${provider}:${id}`, JSON.stringify(item)); } catch {}
          return item;
        }
      }
    } catch {}
    return null;
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
    $("#hd-product-stock").textContent = product.availability_verified ? "IN STOCK" : "DISCOVERY";
    $("#hd-product-stock").className = `hd-status ${product.availability_verified?"green":"blue"}`;
    $("#hd-product-price").textContent = H.money(selectedVariant?.price_amount ?? product.price_amount, selectedVariant?.currency || product.currency || "USD");
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
    const externalVisit = typeof product.external_visit_url === "string" && product.external_visit_url.startsWith("https://");
    const readyForCart = variants.length > 0;
    const storeName = product?.store?.name || "partner store";
    const add = $("#hd-product-add");
    if (add) {
      add.disabled = externalVisit ? false : !readyForCart;
      add.textContent = externalVisit ? `Visit ${storeName} →` : (readyForCart ? "Add to checkout preview →" : "Options pending");
    }
    const mobileAdd = $("#hd-mobile-add");
    if (mobileAdd) {
      mobileAdd.disabled = externalVisit ? false : !readyForCart;
      mobileAdd.textContent = externalVisit ? "Visit store" : (readyForCart ? "Add to Cart" : "Options pending");
    }
    const quantityBlock = document.querySelector(".hd-product-quantity");
    if (quantityBlock) quantityBlock.hidden = externalVisit;
  }

  function syncMobilePrice() {
    const mobile = $("#hd-mobile-price");
    if (!mobile || !product) return;
    mobile.textContent = H.money(selectedVariant?.price_amount ?? product.price_amount, selectedVariant?.currency || product.currency || "USD");
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
      location.href = destination.toString();
      return;
    }
    if (!selectedVariant) return;
    H.addCart(product, selectedVariant, quantity);
    location.href = "checkout.html";
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
      const data = await H.storefront({provider,product_id:id});
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
  $("#hd-qty-plus")?.addEventListener("click",()=>{quantity=Math.min(20,quantity+1);$("#hd-qty-value").textContent=String(quantity);});
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
