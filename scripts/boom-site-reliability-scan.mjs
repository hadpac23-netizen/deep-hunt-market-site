import fs from "node:fs/promises";
const BASE=(process.env.HUNT_BASE_URL||"https://deep-hunt-market.netlify.app").replace(/\/$/,"");
const PORT=Number(process.env.CDP_PORT||9222);
const WAIT=ms=>new Promise(r=>setTimeout(r,ms));
const now=()=>new Date().toISOString();
const safeArray=v=>Array.isArray(v)?v:(v==null?[]:[v]);
async function getJson(url){const res=await fetch(url,{cache:"no-store"});if(!res.ok)throw new Error("HTTP "+res.status+" "+url);return res.json();}
async function discoverProduct(){
  try{
    const m=await getJson(BASE+"/catalog-manifest.json?boom_scan="+Date.now());
    for(const slug of ["women-tshirts","women-tops","women","men-tops","men"]){
      const page=m?.categories?.[slug]?.pages?.[0];if(!page)continue;
      const d=await getJson(BASE+"/"+page+"?boom_scan="+Date.now());
      const item=(d?.products||[]).find(x=>x?.item_id&&x?.provider);
      if(item)return {provider:item.provider,item_id:item.item_id};
    }
  }catch{}
  return null;
}
const tabs=await getJson("http://127.0.0.1:"+PORT+"/json/list");
const tab=tabs.find(x=>x.type==="page");
if(!tab?.webSocketDebuggerUrl)throw new Error("No Chrome page available for CDP scan");
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
let seq=0;const pending=new Map();
const events={responses:[],exceptions:[],consoleErrors:[]};
ws.onmessage=event=>{
  const msg=JSON.parse(event.data);
  if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);return;}
  if(msg.method==="Network.responseReceived"){const r=msg.params?.response;if(r&&Number(r.status)>=400)events.responses.push({status:r.status,url:r.url});}
  if(msg.method==="Runtime.exceptionThrown")events.exceptions.push(msg.params?.exceptionDetails?.text||"Runtime exception");
  if(msg.method==="Log.entryAdded"){const e=msg.params?.entry;if(e?.level==="error")events.consoleErrors.push(e.text||"Console error");}
};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const out=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});return out?.result?.value;};
await send("Page.enable");await send("Runtime.enable");await send("Network.enable");await send("Log.enable");
function resetEvents(){events.responses=[];events.exceptions=[];events.consoleErrors=[];}
async function navigate(path,delay=4500){resetEvents();await send("Page.navigate",{url:BASE+path});await WAIT(delay);}
async function snapshot(expr){return evaluate("(()=>{const x=("+expr+");return {title:document.title,ready:document.readyState,overflow:document.documentElement.scrollWidth>innerWidth,width:innerWidth,bodyWidth:document.documentElement.scrollWidth,...x}})()");}
function issuesFor(label,snap){
  const issues=[];
  if(!snap||snap.ready!=="complete")issues.push(label+": document not complete");
  if(snap?.overflow)issues.push(label+": horizontal overflow");
  for(const r of events.responses.slice(0,12))issues.push(label+": HTTP "+r.status+" "+r.url);
  for(const e of events.exceptions.slice(0,8))issues.push(label+": JS exception: "+e);
  for(const e of events.consoleErrors.slice(0,8))issues.push(label+": console error: "+e);
  return issues;
}
const checks=[];const allIssues=[];
async function runCheck(name,path,expr,assertion,delay=4500){
  await navigate(path,delay);
  const snap=await snapshot(expr);
  const issues=issuesFor(name,snap);
  if(assertion)issues.push(...safeArray(assertion(snap)).filter(Boolean));
  checks.push({name,path,ok:issues.length===0,snapshot:snap,issues});
  allIssues.push(...issues);
  return snap;
}
await send("Emulation.setDeviceMetricsOverride",{width:390,height:900,deviceScaleFactor:1,mobile:true});
await runCheck("home","/","({search:!!document.querySelector('#hd-search-input'),cart:!!document.querySelector('[data-cart-count]')})",s=>[!s.search&&"home: search missing",!s.cart&&"home: cart missing"].filter(Boolean));
const women=await runCheck("women_category","/category.html?c=women","({cards:document.querySelectorAll('#hd-category-grid > *').length,sort:!!document.querySelector('#hd-cat-sort'),actions:document.querySelectorAll('[data-shop-action]').length})",s=>[s.cards<1&&"women_category: empty grid",!s.sort&&"women_category: sort missing"].filter(Boolean),6000);
if(women?.actions>0){
  const toggle=await evaluate("(()=>{const b=document.querySelector(\"[data-shop-action=\\\"like\\\"]\");if(!b)return {ok:false,reason:\"like missing\"};const before=b.getAttribute(\"aria-pressed\");b.click();const after=b.getAttribute(\"aria-pressed\");return {ok:before!==after,before,after}})()");
  const issues=toggle?.ok?[]:["Like button did not toggle"];checks.push({name:"like_button",path:"/category.html?c=women",ok:issues.length===0,snapshot:toggle,issues});allIssues.push(...issues);
}
await runCheck("men_category","/category.html?c=men","({cards:document.querySelectorAll('#hd-category-grid > *').length})",s=>s.cards<1?"men_category: empty grid":null,6000);
await runCheck("search","/search.html?q=phone","({input:!!document.querySelector('input'),grid:!!document.querySelector('#hd-ai-results-grid')})",s=>[!s.input&&"search: input missing",!s.grid&&"search: results grid missing"].filter(Boolean));
await runCheck("auth","/auth.html","({google:!!document.querySelector('[data-oauth=\\\"google\\\"]')})",s=>!s.google?"auth: Google button missing":null);
await runCheck("checkout","/checkout.html","({main:!!document.querySelector('main'),cart:!!document.querySelector('[data-cart-count]')})",s=>!s.main?"checkout: main missing":null);
const product=await discoverProduct();
if(product){
  const q="/product.html?provider="+encodeURIComponent(product.provider)+"&id="+encodeURIComponent(product.item_id);
  await runCheck("product",q,"({titleText:document.querySelector('#hd-product-title')?.textContent||'',add:!!document.querySelector('#hd-product-add'),errorHidden:document.querySelector('#hd-product-error')?.hidden})",s=>[(!s.titleText||/loading product/i.test(s.titleText))&&"product: title unresolved",!s.add&&"product: add button missing",s.errorHidden===false&&"product: error panel visible"].filter(Boolean),7500);
}else{allIssues.push("product: no real catalog product discovered");checks.push({name:"product",path:null,ok:false,snapshot:null,issues:["No real catalog product discovered"]});}
const critical=allIssues.filter(x=>/checkout|product|HTTP 5|JS exception|auth/i.test(x));
const status=critical.length?"critical":allIssues.length?"watch":"healthy";
const report={
  manager_id:"site-reliability",timestamp:now(),scope:["home","search","category","product","cart","checkout","auth","buttons","mobile"],status,
  evidence:["base="+BASE,"checks="+checks.length,"passed="+checks.filter(x=>x.ok).length,"failed="+checks.filter(x=>!x.ok).length],
  metrics:{checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,critical_issues:critical.length},
  issues:allIssues,opportunity:allIssues.length?"Repair failing purchase-path checks before growth work.":"No purchase-path failure detected in this scan.",
  recommended_action:critical.length?"BLOCK launch changes and stage repair.":allIssues.length?"Review watch items and stage fixes.":"Continue scheduled monitoring.",
  action_class:critical.length?"BLOCK":allIssues.length?"STAGE_FIX":"OBSERVE",owner_approval_required:false,confidence:0.95,
  expected_impact:critical.length?"critical":allIssues.length?"high":"low",
  risk_if_ignored:critical.length?"Broken shopper or purchase path may damage trust or prevent orders.":allIssues.length?"Minor regressions may accumulate.":"Low.",
  recheck_at:new Date(Date.now()+30*60*1000).toISOString(),fallback:"Keep live money and supplier-order gates unchanged; preserve last known-good production behavior.",checks
};
await fs.writeFile(process.env.BOOM_REPORT_PATH||"boom-site-reliability-report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
ws.close();
if(critical.length)process.exitCode=2;else if(allIssues.length)process.exitCode=1;