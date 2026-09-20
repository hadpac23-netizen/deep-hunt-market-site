(() => {
  "use strict";
  const VERSION="BOOM-STORAGE-MIGRATIONS-V1";
  const LANGUAGE_KEY="hunt_language_v1";
  const LEGACY_LANGUAGE_KEY="hunt_language";
  const allowed=new Set(["en","ar","he","es","fr"]);

  function normalizeLanguage(value){
    const raw=String(value||"").trim().toLowerCase();
    let base=raw.split("-")[0];
    if(base==="iw")base="he";
    return allowed.has(base)?base:"";
  }

  function migrateLanguage(storage){
    if(!storage)return {state:"NO_STORAGE",changed:false};
    try{
      const current=normalizeLanguage(storage.getItem(LANGUAGE_KEY));
      if(current){
        if(storage.getItem(LANGUAGE_KEY)!==current)storage.setItem(LANGUAGE_KEY,current);
        if(storage.getItem(LANGUAGE_KEY)===current&&storage.getItem(LEGACY_LANGUAGE_KEY)!==null)storage.removeItem(LEGACY_LANGUAGE_KEY);
        return {state:"CURRENT",changed:false,value:current};
      }
      const legacyRaw=storage.getItem(LEGACY_LANGUAGE_KEY);      if(legacyRaw===null)return {state:"EMPTY",changed:false};
      const legacy=normalizeLanguage(legacyRaw);
      if(!legacy)return {state:"INVALID_LEGACY",changed:false};
      storage.setItem(LANGUAGE_KEY,legacy);
      if(storage.getItem(LANGUAGE_KEY)!==legacy)return {state:"WRITE_FAILED",changed:false};
      storage.removeItem(LEGACY_LANGUAGE_KEY);
      return {state:"MIGRATED",changed:true,value:legacy};
    }catch{
      return {state:"STORAGE_ERROR",changed:false};
    }
  }

  function run(storage){
    const target=storage || (typeof localStorage!=="undefined"?localStorage:null);
    return {version:VERSION,language:migrateLanguage(target)};
  }

  const api={version:VERSION,LANGUAGE_KEY,LEGACY_LANGUAGE_KEY,normalizeLanguage,migrateLanguage,run};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else{
    window.BoomStorageMigrations=api;
    window.BoomStorageMigrationResult=run();
  }
})();