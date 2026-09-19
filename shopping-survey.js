(() => {
  const H=window.HuntCore, sb=window.supabase, runtime=window.BoomRuntime;
  if(!H)return;
  const client=runtime?.getSupabaseClient?.() || (sb?.createClient?sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey):null);
  const localKey="hunt_shopping_survey_v1";
  const $=q=>document.querySelector(q);

  const categoryMap={
    women:["women","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","swimwear"],
    shoes:["shoes"],
    accessories:["bags","jewelry","accessories","hats"],
    beauty:["beauty","perfume"],
    home:["home","kitchen","storage","bedding","bath","lighting","cleaning"],
    tech:["tech","phoneaccessories","gaming","office"],
    sports:["sports","outdoors","travel"],
    gifts:["gifts","party","crafts","stationery"]
  };

  function readLocal(){try{return JSON.parse(localStorage.getItem(localKey)||"null")}catch{return null}}
  function saveLocal(v){localStorage.setItem(localKey,JSON.stringify(v));}
  function selected(name){return Array.from(document.querySelectorAll('[name="'+name+'"]:checked')).map(x=>x.value);}
  function expandedCategories(keys){
    const out=[];
    for(const key of keys||[])for(const slug of categoryMap[key]||[])if(!out.includes(slug))out.push(slug);
    return out;
  }
  function renderSummary(prefs){
    const form=$("#hd-shopping-survey-form"), done=$("#hd-shopping-survey-done");
    if(form)form.hidden=true;
    if(done){
      done.hidden=false;
      const count=Array.isArray(prefs?.categories)?prefs.categories.length:0;
      const strong=done.querySelector("strong");
      if(strong)strong.textContent=count?"BOOM is tuned to "+count+" shopping interests.":"BOOM is ready to learn as you browse.";
    }
  }
  function fillForm(prefs){
    if(!prefs)return;
    const reverseKeys=[];
    for(const [key,slugs] of Object.entries(categoryMap)){
      if(slugs.some(slug=>prefs.categories?.includes(slug)))reverseKeys.push(key);
    }
    document.querySelectorAll('[name="survey-category"]').forEach(box=>box.checked=reverseKeys.includes(box.value));
    document.querySelectorAll('[name="survey-price"]').forEach(radio=>radio.checked=radio.value===(prefs.price_band||"any"));
    document.querySelectorAll('[name="survey-priority"]').forEach(box=>box.checked=(prefs.priorities||[]).includes(box.value));
    document.querySelectorAll('[name="survey-discovery"]').forEach(box=>box.checked=(prefs.discovery_modes||[]).includes(box.value));
  }
  function mergePrefs(...sources){
    const rows=sources.filter(Boolean);
    const union=key=>Array.from(new Set(rows.flatMap(row=>Array.isArray(row?.[key])?row[key]:[])));
    const server=sources[0]||null;
    const local=sources[1]||null;
    const device=sources[2]||null;
    const serverBand=String(server?.price_band||"any");
    const localBand=String(local?.price_band||device?.price_band||"any");
    return {
      categories:union("categories"),
      price_band:serverBand!=="any"?serverBand:localBand,
      priorities:union("priorities"),
      discovery_modes:union("discovery_modes")
    };
  }

  async function getSession(){
    if(runtime?.sessionReady)return runtime.sessionReady();
    if(!client)return null;
    const {data}=await client.auth.getSession();
    return data.session||null;
  }
  async function loadServer(sess){
    if(!client||!sess?.user)return null;
    const {data}=await client.from("hunt_shopping_preferences")
      .select("categories,price_band,priorities,discovery_modes,updated_at")
      .eq("user_id",sess.user.id).maybeSingle();
    return data||null;
  }
  async function persistServer(sess,prefs){
    if(!client||!sess?.user)return;
    const {error}=await client.from("hunt_shopping_preferences").upsert({
      user_id:sess.user.id,
      categories:prefs.categories,
      price_band:prefs.price_band,
      priorities:prefs.priorities,
      discovery_modes:prefs.discovery_modes,
      completed_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(error)throw error;
  }

  $("#hd-shopping-survey-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const formEl=event.currentTarget;
    const button=formEl.querySelector("button[type='submit']");
    const prefs={
      categories:expandedCategories(selected("survey-category")),
      price_band:document.querySelector('[name="survey-price"]:checked')?.value||"any",
      priorities:selected("survey-priority"),
      discovery_modes:selected("survey-discovery")
    };
    const safe=H.saveShoppingPreferences?.(prefs)||prefs;
    saveLocal(safe);
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});
    try {
      await run("shopping.survey.submit",{
        key:"preferences",element:button,successDetail:{category_count:safe.categories.length,price_band:safe.price_band},
        execute:async()=>{const sess=await getSession();await persistServer(sess,safe);return true;}
      });
      window.dispatchEvent(new CustomEvent("hunt:shopping-survey",{detail:safe}));
      window.HuntAnalytics?.surveyComplete?.({categories:safe.categories,priceBand:safe.price_band});
      renderSummary(safe);
    }catch(error){runtime?.announce?.(error?.message||"Could not save shopping preferences.","error");}
  });

  $("#hd-shopping-survey-skip")?.addEventListener("click",()=>{
    runtime?.emit?.("shopping.survey.skip",{surface:"home"},{broadcast:false});
    $("#hd-shopping-survey")?.setAttribute("hidden","");
  });

  $("#hd-shopping-survey-edit")?.addEventListener("click",()=>{
    runtime?.emit?.("shopping.survey.edit",{surface:"home"},{broadcast:false});
    const form=$("#hd-shopping-survey-form"), done=$("#hd-shopping-survey-done");
    if(form)form.hidden=false;
    if(done)done.hidden=true;
  });

  async function init(){
    const sess=await getSession();
    const server=await loadServer(sess);
    const local=readLocal();
    const device=H.shoppingPreferences?.();
    const prefs=mergePrefs(server,local,device);
    if(sess?.user&&(server||local||device)){
      try{
        await persistServer(sess,prefs);
        runtime?.emit?.("shopping.survey.submit",{merge:true,category_count:prefs.categories.length,price_band:prefs.price_band},{broadcast:false});
      }catch(error){runtime?.announce?.(error?.message||"Could not sync shopping preferences.","error");}
    }
    if(server||local||device){
      H.saveShoppingPreferences?.(prefs,false);
      saveLocal(prefs);
    }
    if(prefs?.categories?.length){
      fillForm(prefs);
      renderSummary(prefs);
    }
  }
  init();
})();
