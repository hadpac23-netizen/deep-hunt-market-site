(() => {
  "use strict";
  const slug=v=>String(v||"hunt").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
  function utm({channel,itemId,campaign="boom-daily"}={}){
    const source=channel==="organic_social"?"social":channel;
    const medium=["seo","pinterest"].includes(channel)?"organic":channel==="onsite"?"owned":"organic";
    return {utm_source:source,utm_medium:medium,utm_campaign:slug(campaign),utm_content:slug(itemId)};
  }
  function buildDrafts(creative=[],day=new Date().toISOString().slice(0,10)){
    return (Array.isArray(creative)?creative:[]).map((c,i)=>Object.freeze({
      day,channel:c.channel,provider:c.provider,itemId:c.itemId,format:c.format,
      status:"draft",ownerApprovalRequired:true,ownerApproved:false,
      destinationPath:"product.html?provider="+encodeURIComponent(c.provider)+"&id="+encodeURIComponent(c.itemId),
      utm:utm({channel:c.channel,itemId:c.itemId,campaign:"boom-"+day}),creativeIndex:i
    }));
  }
  const api=Object.freeze({utm,buildDrafts});
  if(typeof window!=="undefined")window.BoomEverywherePublisher=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();