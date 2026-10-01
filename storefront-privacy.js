(() => {
  const aliases = new Map([
    ["cjdropshipping", "s1"],
    ["eprolo", "s2"],
    ["printful", "s3"],
    ["gooten", "s4"],
    ["matterhorn wholesale", "s5"],
    ["matterhorn", "s5"]
  ]);
  const providers = new Map([
    ["s1", "CJdropshipping"],
    ["s2", "EPROLO"],
    ["s3", "Printful"],
    ["s4", "Gooten"],
    ["s5", "Matterhorn Wholesale"]
  ]);
  const knownProviderPattern = /\b(?:CJ\s*Dropshipping|CJdropshipping|EPROLO|Printful|Gooten|Matterhorn(?:\s+Wholesale)?)\b/gi;

  function providerAlias(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return aliases.get(normalized) || "";
  }

  function providerFromAlias(value) {
    return providers.get(String(value || "").trim().toLowerCase()) || "";
  }

  function cleanText(value) {
    return String(value || "")
      .replace(knownProviderPattern, "HUNT Network")
      .replace(/(?:HUNT Network\s*\+\s*)+HUNT Network/gi, "HUNT Network")
      .replace(/(?:HUNT Network\s*·\s*)+HUNT Network/gi, "HUNT Network");
  }

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function aliasProductUrl(product, context={}) {
    const provider = String(product?.provider || "");
    const alias = providerAlias(provider) || window.HuntCore?.sourceCodeForProvider?.(provider) || "s0";
    const url=new URL("product.html",location.href);
    url.searchParams.set("src",alias);
    url.searchParams.set("id",String(product?.item_id||""));
    const page=new URL(location.href);
    const parent=String(context?.c||page.searchParams.get("c")||"").toLowerCase();
    const sub=String(context?.sub||page.searchParams.get("sub")||"").toLowerCase();
    if(parent)url.searchParams.set("c",parent);
    if(sub)url.searchParams.set("sub",sub);
    return `${url.pathname.split("/").pop()}?${url.searchParams.toString()}`;
  }

  function rewriteProductLink(link) {
    const href = link?.getAttribute?.("href") || "";
    if (!href || !href.includes("product.html")) return;
    let url;
    try { url = new URL(href, location.href); } catch { return; }
    if (url.searchParams.get("src")) return;
    const provider = url.searchParams.get("provider") || "";
    const alias = providerAlias(provider);
    if (!alias) return;
    url.searchParams.delete("provider");
    url.searchParams.set("src", alias);
    const next = `${url.pathname.split("/").pop()}?${url.searchParams.toString()}${url.hash}`;
    if (href !== next) link.setAttribute("href", next);
  }

  function scrubNodeText(selector) {
    document.querySelectorAll(selector).forEach(node => {
      const cleaned = cleanText(node.textContent);
      if (cleaned !== node.textContent) node.textContent = cleaned;
    });
  }

  function scrub() {
    document.querySelectorAll('a[href*="product.html"]').forEach(rewriteProductLink);

    document.querySelectorAll(".hd-market-source").forEach(node => setTextIfChanged(node, "HUNT"));
    document.querySelectorAll(".hd-market-product-card .hd-market-card-body > small").forEach(node => {
      const cleaned = cleanText(node.textContent);
      const generic = cleaned.startsWith("HUNT Network ·") ? cleaned.slice("HUNT Network ·".length).trim() : cleaned;
      if (generic !== node.textContent) node.textContent = generic;
    });

    document.querySelectorAll(".hd-provider").forEach(node => {
      const cleaned = cleanText(node.textContent);
      if (cleaned !== node.textContent) node.textContent = cleaned;
    });
    scrubNodeText("#hd-cat-provider-state, #hd-best-copy, #hd-provider-badges");

    const productProvider = document.querySelector("#hd-product-provider");
    if (productProvider) setTextIfChanged(productProvider, "HUNT SOURCE");
    const productPriceNote = document.querySelector(".hd-product-price span");
    if (productPriceNote) setTextIfChanged(productPriceNote, "HUNT price · final checkout pricing is not active yet");
    const mobilePriceNote = document.querySelector(".hd-product-mobile-bar small");
    if (mobilePriceNote) setTextIfChanged(mobilePriceNote, "HUNT price");

    scrubNodeText("#hd-product-description, #hd-product-gaps, #hd-product-error-copy");

    const wall = document.querySelector(".hd-provider-wall");
    if (wall) {
      const title = wall.querySelector("strong");
      const copy = wall.querySelector("p");
      if (title) setTextIfChanged(title, "Verified fulfillment network");
      if (copy) setTextIfChanged(copy, "Live catalog and fulfillment connections are monitored by HUNT. Customer-facing supplier identities stay private.");
      const badges = wall.querySelector("#hd-provider-badges");
      if (badges && knownProviderPattern.test(badges.textContent || "")) {
        badges.innerHTML = "<span>HUNT verified network</span><span>Live sources connected</span>";
      }
      knownProviderPattern.lastIndex = 0;
    }
  }

  const hunt = window.HuntCore;
  if (hunt) {
    const originalSearch = typeof hunt.search === "function" ? hunt.search.bind(hunt) : null;
    hunt.productUrl = aliasProductUrl;
    hunt.providerAlias = providerAlias;
    hunt.providerFromAlias = providerFromAlias;
    if (originalSearch) {
      hunt.search = (query, limit) => {
        const page = new URL(location.href);
        const parent = String(page.searchParams.get("c") || "").toLowerCase();
        const sub = String(page.searchParams.get("sub") || "").toLowerCase();
        const exact = hunt.categoryDefs?.[sub]?.query;
        if (/category\.html$/i.test(page.pathname) && (parent === "women" || parent === "men") && sub && exact) {
          return originalSearch(exact, limit);
        }
        return originalSearch(query, limit);
      };
    }
  }

  const pageUrl = new URL(location.href);
  const legacyProvider = pageUrl.searchParams.get("provider") || "";
  if (legacyProvider && /product\.html$/i.test(pageUrl.pathname)) {
    const alias = providerAlias(legacyProvider) || (providers.has(legacyProvider.toLowerCase()) ? legacyProvider.toLowerCase() : "");
    if (alias) {
      pageUrl.searchParams.delete("provider");
      pageUrl.searchParams.set("src", alias);
      history.replaceState(history.state, "", pageUrl.pathname+pageUrl.search+pageUrl.hash);
    }
  }

  let queued = false;
  const scheduleScrub = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      scrub();
    });
  };

  scrub();
  new MutationObserver(scheduleScrub).observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href"]
  });
})();
