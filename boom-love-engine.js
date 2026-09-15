(() => {
  "use strict";
  const pct=(a,b)=>Number(b)>0?Number(a||0)/Number(b)*100:null;
  function measure(today={}){
    const views=Number(today.product_views||0),likes=Number(today.likes||0),saves=Number(today.saves||0);
    const carts=Number(today.add_to_cart||0),sessions=Number(today.unique_sessions||0);
    const likeRate=pct(likes,views),saveRate=pct(saves,views),cartRate=pct(carts,views);
    let score=0;
    if(views>0){
      score=Math.min(100,Math.min(30,(likeRate||0)*3)+Math.min(35,(saveRate||0)*5)+
        Math.min(25,(cartRate||0)*2)+Math.min(10,sessions/10));
    }
    const confidence=views>=500?"high":views>=100?"medium":views>=20?"low":"insufficient";
    const next=views<20?"Collect more real product-view behavior before personalizing aggressively."
      :(saveRate||0)<2?"Test stronger relevance, trust and save-worthy discovery modules."
      :"Use saved/liked categories to improve recommendations while preserving diversity.";
    return Object.freeze({score:Number(score.toFixed(1)),confidence,likeRate,saveRate,cartRate,next});
  }
  const api=Object.freeze({measure});
  if(typeof window!=="undefined")window.BoomLoveEngine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();