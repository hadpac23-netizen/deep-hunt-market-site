(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H)return;
  const client=sb?.createClient?sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey):null;
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
  async function getSession(){
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
    await client.from("hunt_shopping_preferences").upsert({
      user_id:sess.user.id,
      categories:prefs.categories,
      price_band:prefs.price_band,
      priorities:prefs.priorities,
      discovery_modes:prefs.discovery_modes,
      completed_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
  }

  $("#hd-shopping-survey-form")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const prefs={
      categories:expandedCategories(selected("survey-category")),
      price_band:document.querySelector('[name="survey-price"]:checked')?.value||"any",
      priorities:selected("survey-priority"),
      discovery_modes:selected("survey-discovery")
    };
    const safe=H.saveShoppingPreferences?.(prefs)||prefs;
    saveLocal(safe);
    const sess=await getSession();
    await persistServer(sess,safe);
    window.dispatchEvent(new CustomEvent("hunt:shopping-survey",{detail:safe}));
    window.HuntAnalytics?.surveyComplete?.({categories:safe.categories,priceBand:safe.price_band});
    renderSummary(safe);
  });

  $("#hd-shopping-survey-skip")?.addEventListener("click",()=>{
    $("#hd-shopping-survey")?.setAttribute("hidden","");
  });

  $("#hd-shopping-survey-edit")?.addEventListener("click",()=>{
    const form=$("#hd-shopping-survey-form"), done=$("#hd-shopping-survey-done");
    if(form)form.hidden=false;
    if(done)done.hidden=true;
  });

  async function init(){
    const sess=await getSession();
    const server=await loadServer(sess);
    const local=readLocal();
    const prefs=server||local||H.shoppingPreferences?.();
    if(server){
      H.saveShoppingPreferences?.(server,false);
      saveLocal(server);
    }
    if(prefs?.categories?.length){
      fillForm(prefs);
      renderSummary(prefs);
    }
  }
  init();
})();
