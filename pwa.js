(() => {
  if(!("serviceWorker" in navigator))return;
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js?v=pwa3",{scope:"./"}).catch(()=>{});
  },{once:true});
})();
