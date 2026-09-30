(() => {
  if (!document.querySelector('script[data-hunt-privacy]')) {
    const privacy = document.createElement("script");
    privacy.src = "storefront-privacy.js?v=source-privacy1";
    privacy.dataset.huntPrivacy = "1";
    document.head.appendChild(privacy);
  }

  if(!("serviceWorker" in navigator))return;
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js?v=pwa1",{scope:"./"}).catch(()=>{});
  },{once:true});
})();
