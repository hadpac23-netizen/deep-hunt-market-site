(() => {
  if(!("serviceWorker" in navigator))return;
  const local=["127.0.0.1","localhost"].includes(location.hostname);
  if(local){
    window.addEventListener("load",async()=>{
      try{
        const hadController=Boolean(navigator.serviceWorker.controller);
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg=>reg.unregister()));
        if("caches" in window){
          const keys=await caches.keys();
          await Promise.all(keys.filter(key=>key.startsWith("hunt-shell-")).map(key=>caches.delete(key)));
        }
        const resetKey="hunt_local_sw_reset_v2";
        if(hadController&&sessionStorage.getItem(resetKey)!=="done"){
          sessionStorage.setItem(resetKey,"done");
          location.reload();
          return;
        }
      }catch{}
    },{once:true});
    return;
  }
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js?v=pwa9",{scope:"./"}).catch(()=>{});
  },{once:true});
})();
