(() => {
  if(!("serviceWorker" in navigator))return;
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js?v=pwa2",{scope:"./",updateViaCache:"none"}).catch(()=>{});
  },{once:true});
})();
