(() => {
  const H=window.HuntCore;
  if(!H||typeof H.storefront!=="function")return;
  const original=H.storefront.bind(H);

  H.storefront=async params=>{
    const base=await original(params)||{};
    if(String(params?.shelves||"")!=="1")return base;
    const meta=base?.eprolo_canonical_shelves;
    if(meta&&typeof meta==="object"){
      base.eprolo_canonical_shelves={
        ...meta,
        public_display_enabled:false,
        public_hold_reason:"PDP_RUNTIME_CREDENTIALS_NOT_READY"
      };
    }
    return base;
  };
})();
