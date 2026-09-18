(() => {
  const H=window.HuntCore;
  if(!H)return;

  const PROJECT_URL="https://zszlnahjqmwozwubetkm.supabase.co";
  const INTERESTS=["women","men","beauty","accessories","tech","home","sports","kids"];
  const SERVER_PREF_TABLE="hunt_shopping_preferences";
  const ACTIONS_TABLE="hunt_product_actions";
  let client=null,session=null,hydrating=false,syncTimer=null,lastServer=null;

  const unique=rows=>[...new Set((rows||[]).filter(Boolean))];
  const rankedSignals=()=>Object.entries(H.signals?.()||{})
    .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
    .sort((a,b)=>Number(b[1])-Number(a[1]))
    .map(([slug])=>slug);

  function waitForSupabase(timeout=10000){
    return new Promise(resolve=>{
      const start=Date.now();
      const tick=()=>{
        if(window.supabase?.createClient)return resolve(window.supabase);
        if(Date.now()-start>=timeout)return resolve(null);
        setTimeout(tick,120);
      };
      tick();
    });
  }

  function ensureClient(sb){
    if(client)return client;
    client=window.HuntSupabaseClient || sb?.createClient?.(PROJECT_URL,H.publishableKey) || null;
    if(client&&!window.HuntSupabaseClient)window.HuntSupabaseClient=client;
    return client;
  }

  function interestForCategory(slug){
    if(INTERESTS.includes(slug))return slug;
    for(const parent of INTERESTS){
      if((H.departmentSubcategories?.[parent]||[]).includes(slug))return parent;
    }
    return slug;
  }

  function serverSeed(prefRow,actions){
    const seed={};
    for(const raw of prefRow?.categories||[]){
      const slug=interestForCategory(String(raw||""));
      if(H.categoryDefs?.[slug])seed[slug]=Math.max(seed[slug]||0,28);
    }
    for(const row of actions||[]){
      const slug=interestForCategory(String(row?.category||""));
      if(!H.categoryDefs?.[slug])continue;
      const weight=row?.saved?24:row?.liked?18:0;
      if(weight)seed[slug]=Math.max(seed[slug]||0,weight);
    }
    return seed;
  }

  function mergedPreferences(serverRow){
    const local=H.shoppingPreferences?.()||{};
    return {
      categories:unique([...(local.categories||[]),...((serverRow?.categories)||[])]).filter(x=>H.categoryDefs?.[x]).slice(0,12),
      price_band:serverRow?.price_band||local.price_band||"any",
      priorities:unique([...(local.priorities||[]),...((serverRow?.priorities)||[])]).slice(0,12),
      discovery_modes:unique([...(local.discovery_modes||[]),...((serverRow?.discovery_modes)||[])]).slice(0,12)
    };
  }

  async function hydrate(){
    if(!client||!session?.user)return;
    hydrating=true;
    try{
      const [{data:pref},{data:actions}]=await Promise.all([
        client.from(SERVER_PREF_TABLE)
          .select("user_id,categories,price_band,priorities,discovery_modes,updated_at")
          .eq("user_id",session.user.id).maybeSingle(),
        client.from(ACTIONS_TABLE)
          .select("category,liked,saved,updated_at")
          .eq("user_id",session.user.id)
          .or("liked.eq.true,saved.eq.true")
          .order("updated_at",{ascending:false})
          .limit(500)
      ]);
      lastServer=pref||null;
      const merged=mergedPreferences(pref||{});
      H.saveShoppingPreferences?.(merged);
      H.mergeSignals?.(serverSeed(pref||{},actions||[]));
      renderPreferenceUI();
      window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{
        detail:{signedIn:true,userId:session.user.id,preferences:merged}
      }));
      scheduleSync(250);
    }catch{
      window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:true,error:true}}));
    }finally{
      hydrating=false;
    }
  }

  function topCategories(){
    const explicit=H.shoppingPreferences?.().categories||[];
    const behavioral=rankedSignals().map(interestForCategory);
    return unique([...explicit,...behavioral]).filter(x=>H.categoryDefs?.[x]).slice(0,10);
  }

  async function syncServer(){
    syncTimer=null;
    if(hydrating||!client||!session?.user)return;
    const local=H.shoppingPreferences?.()||{};
    const payload={
      user_id:session.user.id,
      categories:topCategories(),
      price_band:local.price_band||lastServer?.price_band||"any",
      priorities:local.priorities||lastServer?.priorities||[],
      discovery_modes:local.discovery_modes||lastServer?.discovery_modes||[],
      updated_at:new Date().toISOString()
    };
    try{
      const {data,error}=await client.from(SERVER_PREF_TABLE)
        .upsert(payload,{onConflict:"user_id"})
        .select("user_id,categories,price_band,priorities,discovery_modes,updated_at")
        .single();
      if(error)throw error;
      lastServer=data||payload;
      window.dispatchEvent(new CustomEvent("hunt:personalization-synced",{detail:{categories:payload.categories}}));
      window.HuntAnalytics?.experience?.("personalization_sync",{
        categories:payload.categories.slice(0,8),signed_in:true
      });
    }catch{}
  }

  function scheduleSync(delay=1400){
    if(syncTimer)clearTimeout(syncTimer);
    syncTimer=setTimeout(syncServer,delay);
  }

  function renderPreferenceUI(){
    const host=document.querySelector("#hd-preference-chips");
    if(!host)return;
    const selected=new Set(H.shoppingPreferences?.().categories||[]);
    host.querySelectorAll("[data-pref-category]").forEach(btn=>{
      const active=selected.has(btn.dataset.prefCategory);
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    const status=document.querySelector("#hd-preference-status");
    if(status)status.textContent=session?.user
      ? "Saved to your HUNT account."
      : "Saved on this device until you sign in.";
  }

  function togglePreference(slug){
    if(!H.categoryDefs?.[slug])return;
    const current=H.shoppingPreferences?.()||{};
    const categories=new Set(current.categories||[]);
    categories.has(slug)?categories.delete(slug):categories.add(slug);
    const next=H.saveShoppingPreferences?.({...current,categories:[...categories]});
    if(categories.has(slug))H.mergeSignals?.({[slug]:32});
    renderPreferenceUI();
    scheduleSync(500);
    window.HuntAnalytics?.experience?.("preference_choice",{
      category:slug,active:categories.has(slug)
    });
    window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:Boolean(session?.user),preferences:next}}));
  }

  async function resetInterests(){
    const current=H.shoppingPreferences?.()||{};
    H.saveShoppingPreferences?.({...current,categories:[]});
    H.clearSignals?.();
    renderPreferenceUI();
    if(client&&session?.user){
      try{
        await client.from(SERVER_PREF_TABLE).upsert({
          user_id:session.user.id,categories:[],
          price_band:current.price_band||"any",
          priorities:current.priorities||[],
          discovery_modes:current.discovery_modes||[],
          updated_at:new Date().toISOString()
        },{onConflict:"user_id"});
      }catch{}
    }
    window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:Boolean(session?.user),reset:true}}));
  }

  document.addEventListener("click",event=>{
    const pref=event.target.closest?.("[data-pref-category]");
    if(pref){togglePreference(pref.dataset.prefCategory);return}
    if(event.target.closest?.("#hd-reset-interests"))resetInterests();
  });

  ["hunt:signal","hunt:preferences-changed","hunt:shopping-action"].forEach(name=>{
    window.addEventListener(name,()=>{if(!hydrating)scheduleSync()});
  });
  window.addEventListener("hunt:experience-language",renderPreferenceUI);

  async function init(){
    renderPreferenceUI();
    const sb=await waitForSupabase();
    if(!ensureClient(sb)){
      window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:false,localOnly:true}}));
      return;
    }
    const {data}=await client.auth.getSession();
    session=data?.session||null;
    if(session?.user)await hydrate();
    else window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:false,localOnly:true}}));

    client.auth.onAuthStateChange(async(_event,next)=>{
      session=next||null;
      if(session?.user)await hydrate();
      else{
        lastServer=null;
        renderPreferenceUI();
        window.dispatchEvent(new CustomEvent("hunt:personalization-ready",{detail:{signedIn:false}}));
      }
    });
  }

  window.HuntPersonalization={
    interests:INTERESTS.slice(),
    session:()=>session,
    topCategories,
    sync:syncServer
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();