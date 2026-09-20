const fs=require("fs"),assert=require("assert");
const read=f=>fs.readFileSync(f,"utf8");
const index=read("index.html"), product=read("product.html"), category=read("category.html"), search=read("search.html"),
  checkout=read("checkout.html"), profile=read("profile.html"), auth=read("auth.html"),
  manifest=JSON.parse(read("manifest.webmanifest")), core=read("market-core.js"), pers=read("hunt-personalization.js"),
  country=read("hunt-country-brain.js"), quality=read("hunt-catalog-quality.js"), creative=read("hunt-creative-engine.js"), i18n=read("hunt-experience-i18n.js"),
  pulse=read("hunt-product-pulse.js"), analytics=read("analytics.js"), hero=read("hunt-hero4.js"),
  home=read("hunt-home-3.js"), productFlow=read("product-flow.js"), categoryJs=read("category.js");

assert.equal(manifest.name,"HUNT","PWA public brand must be HUNT");
assert.equal(manifest.short_name,"HUNT","PWA short brand must be HUNT");
for(const [name,text] of Object.entries({index,product,category,search,checkout,profile,auth})){
  assert(!text.includes("HUNT DEAL"),name+" still exposes HUNT DEAL");
  assert(text.includes('rel="icon" href="hunt-icon-192.png"'),name+" missing explicit PNG favicon");
}

assert(core.includes("hunt:signal"),"signal change event missing");
assert(core.includes("mergeSignals"),"account signal merge missing");
assert(core.includes("hunt:preferences-changed"),"preference event missing");
for(const band of ["any","under25","25to50","50to100","100plus"])assert(core.includes('"'+band+'"'),"DB price band contract missing "+band);
assert(!core.includes('"value","mid","premium"'),"invalid DB price bands remain");

assert(pers.includes('hunt_shopping_preferences'),"server preference table missing");
assert(pers.includes('hunt_product_actions'),"account action hydration missing");
assert(pers.includes('upsert(payload,{onConflict:"user_id"})'),"preference account upsert missing");
assert(pers.includes('hunt:personalization-ready'),"personalization ready event missing");
assert(profile.includes('id="hd-preference-chips"'),"Tune your HUNT UI missing");
for(const interest of ["women","men","beauty","accessories","tech","home","sports","kids"])assert(profile.includes('data-pref-category="'+interest+'"'),"missing preference "+interest);

assert(country.includes('function readiness'),"country readiness contract missing");
assert(country.includes('return "unknown"'),"country unknown state missing");
assert(country.includes('verified_match')&&country.includes('verified_mismatch'),"country verified states missing");
assert(country.includes('shipping_countries'),"explicit shipping evidence fields missing");
assert(country.includes('if(state==="verified_mismatch")return -100'),"explicit country mismatch must be penalized");
assert(quality.includes("cleanShelves"),"catalog quality cleanShelves missing");
assert(quality.includes("beauty-tools")&&quality.includes("home-storage")&&quality.includes("smart-home"),"catalog quality subcategory gates missing");
assert(productFlow.includes('HuntCountry?.score'),"product discovery not country-aware");
assert(hero.includes('HuntCountry?.rank'),"Lifestyle queue not country-aware");

for(const format of ["spotlight","duo","mosaic","look"])assert(creative.includes('"'+format+'"'),"creative format missing "+format);
assert(creative.includes('creative_approved===true'),"AI/video creative approval gate missing");
assert(hero.includes('HuntCreative?.compose'),"Lifestyle does not use Creative Engine");
assert(hero.includes('data-creative-format')||hero.includes('creativeFormat'),"Creative format runtime marker missing");

for(const lang of ["en","he","ar","es","fr","ja","zh"])assert(i18n.includes(lang+':{')||i18n.includes('"'+lang+'"'),"language missing "+lang);
assert(i18n.includes('RTL=new Set(["he","ar"])'),"RTL languages missing");
assert(i18n.includes("staticNodeKeys=new WeakMap"),"multi-switch static i18n memory missing");
assert(i18n.includes("ensureSelector"),"cross-page language selector injection missing");

assert(pulse.includes("hasRelated"),"Product Pulse related-item gate missing");
assert(pulse.includes('product_pulse_impression'),"Product Pulse analytics missing");
assert(pulse.includes('product_pulse_click'),"Product Pulse click analytics missing");
assert(product.includes('id="hd-product-discover-cue"'),"product discovery cue missing");

assert(analytics.includes("function experience"),"experience analytics API missing");
assert(/function experience[\s\S]*?if\s*\(!consentGranted\(\)\)\s*return false/.test(analytics),"experience analytics must honor consent");
assert(hero.includes("scene_impression")&&hero.includes("lifestyle_story_impression"),"Hero/Lifestyle learning events missing");
assert(home.includes("hunt:personalization-ready"),"Home live personalization refresh missing");
assert(categoryJs.includes("hunt:personalization-ready"),"Category live personalization refresh missing");
assert(productFlow.includes("hunt:personalization-ready"),"Product live personalization refresh missing");
assert(productFlow.includes("hunt:country-changed"),"Product country rerank missing");

function order(text,names,label){
  let previous=-1;
  for(const name of names){
    const pos=text.indexOf(name);
    assert(pos>=0,label+" missing "+name);
    assert(pos>previous,label+" wrong script order at "+name);
    previous=pos;
  }
}
order(index,["hunt-experience-i18n.js","market-core.js","hunt-catalog-quality.js","hunt-country-brain.js","hunt-creative-engine.js","hunt-hero4.js"],"Home");
order(product,["hunt-experience-i18n.js","market-core.js","hunt-country-brain.js","supabase.min.js","hunt-personalization.js"],"Product");
order(category,["hunt-experience-i18n.js","market-core.js","hunt-country-brain.js","supabase.min.js","hunt-personalization.js"],"Category");
order(search,["hunt-experience-i18n.js","market-core.js","hunt-country-brain.js","supabase.min.js","hunt-personalization.js"],"Search");
order(checkout,["hunt-experience-i18n.js","market-core.js","hunt-country-brain.js","supabase.min.js","hunt-personalization.js"],"Checkout");
order(auth,["hunt-experience-i18n.js","market-core.js","hunt-country-brain.js","hunt-personalization.js"],"Auth");

assert(checkout.includes("disabled>Payment activation pending")||checkout.includes("disabled data-hunt-i18n")||checkout.includes('hd-pay-disabled" type="button" disabled'),"payment activation must remain disabled");
const payplusProof=JSON.parse(read("boom-payplus-proof-contract.json"));
assert.equal(payplusProof.state,"HOLD","PayPlus must remain HOLD before exact sandbox proof");
assert.equal(payplusProof.owner_approved,false,"PayPlus proof must remain owner-unapproved before activation");

console.log("hunt_system_completion=PASS");