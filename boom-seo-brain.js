(() => {
  "use strict";
  function evaluate(audit={}){
    const checks=[
      ["title",audit.title===true,16],["description",audit.description===true,12],
      ["canonical",audit.canonical===true,16],["indexable",audit.indexable!==false,12],
      ["structuredData",audit.structuredData===true,18],["internalLinks",audit.internalLinks===true,10],
      ["sitemap",audit.sitemap===true,16]
    ];
    const score=checks.reduce((s,[,ok,w])=>s+(ok?w:0),0);
    const missing=checks.filter(([,ok])=>!ok).map(([k])=>k);
    const actions=[];
    if(missing.includes("canonical"))actions.push("Add a production canonical URL that matches the deployed HUNT domain.");
    if(missing.includes("structuredData"))actions.push("Add truthful Product/Breadcrumb structured data from real product fields only.");
    if(missing.includes("sitemap"))actions.push("Generate and submit a sitemap covering crawlable category/product URLs.");
    if(missing.includes("description"))actions.push("Generate useful, non-duplicated meta descriptions.");
    if(missing.includes("internalLinks"))actions.push("Strengthen category ↔ product and related-product internal linking.");
    return Object.freeze({score,missing:Object.freeze(missing),actions:Object.freeze(actions)});
  }
  const api=Object.freeze({evaluate});
  if(typeof window!=="undefined")window.BoomSeoBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();