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

  function aliasProductUrl(product) {
    const provider = String(product?.provider || "");
    const alias = providerAlias(provider);
    const source = alias || provider;
    return `product.html?provider=${encodeURIComponent(source)}&id=${encodeURIComponent(product?.item_id || "")}`;
  }

  function rewriteProductLink(link) {
    const href = link?.getAttribute?.("href") || "";
    if (!href || !href.includes("product.html") || !href.includes("provider=")) return;
    let url;
    try { url = new URL(href, location.href); } catch { return; }
    const provider = url.searchParams.get("provider") || "";
    if (providers.has(provider.toLowerCase())) return;
    const alias = providerAlias(provider);
    if (!alias) return;
    url.searchParams.set("provider", alias);
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
    document.querySelectorAll('a[href*="product.html"][href*="provider="]').forEach(rewriteProductLink);

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
    hunt.productUrl = aliasProductUrl;
    hunt.providerAlias = providerAlias;
    hunt.providerFromAlias = providerFromAlias;
  }

  const pageUrl = new URL(location.href);
  const token = pageUrl.searchParams.get("provider") || "";
  const decodedProvider = providerFromAlias(token);
  if (decodedProvider && /product\.html$/i.test(pageUrl.pathname)) {
    const runtimeUrl = new URL(pageUrl.href);
    runtimeUrl.searchParams.set("provider", decodedProvider);
    history.replaceState(history.state, "", runtimeUrl.href);
    setTimeout(() => {
      const visibleUrl = new URL(location.href);
      if (/product\.html$/i.test(visibleUrl.pathname)) {
        visibleUrl.searchParams.set("provider", token);
        history.replaceState(history.state, "", visibleUrl.href);
      }
    }, 0);
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
