const fs=require("fs");
const vm=require("vm");
const assert=require("assert");

const source=fs.readFileSync("analytics.js","utf8");

function storage(seed={}){
  const map=new Map(Object.entries(seed));
  return {
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key),
    _map:map
  };
}

function runtime(seed={}){
  const appended=[];
  const inserted=[];
  const nodes=new Map();

  function node(tag){
    return {
      tagName:String(tag||"").toUpperCase(),
      dataset:{},
      style:{},
      children:[],
      setAttribute(){},
      addEventListener(){},
      remove(){ if(this.id)nodes.delete(this.id); },
      appendChild(child){ this.children.push(child); if(child.id)nodes.set(child.id,child); return child; },
      parentNode:null,
      textContent:"",
      innerHTML:"",
      id:""
    };
  }

  const scriptAnchor=node("script");
  const head=node("head");
  const body=node("body");
  body.dataset={};
  scriptAnchor.parentNode={
    insertBefore(newNode){
      inserted.push(newNode);
      if(newNode.id)nodes.set(newNode.id,newNode);
      return newNode;
    }
  };
  head.appendChild=function(child){
    appended.push(child);
    if(child.id)nodes.set(child.id,child);
    return child;
  };
  body.appendChild=function(child){
    if(child.id)nodes.set(child.id,child);
    return child;
  };

  const localStorage=storage(seed);
  const location={
    pathname:"/product.html",
    href:"https://hunt.test/product.html",
    assigned:null,
    assign(value){this.assigned=value;}
  };
  const context={
    console,
    localStorage,
    location,
    CustomEvent:function(type,init){this.type=type;this.detail=init?.detail;},
    document:{
      readyState:"complete",
      title:"HUNT test",
      head,
      body,
      createElement:node,
      getElementById:id=>nodes.get(id)||null,
      querySelector:()=>null,
      getElementsByTagName:tag=>String(tag).toLowerCase()==="script"?[scriptAnchor]:[]
    },
    dispatches:[],
    dispatchEvent(event){this.dispatches.push(event);return true;},
    HUNT_ANALYTICS_CONFIG:{
      gtmContainerId:"",
      ga4MeasurementId:"G-TEST1234",
      consentRequired:true,
      consentVersion:"2026-09-20.1",
      privacyChoicesUrl:"privacy-choices.html",
      environment:"test",
      posthogProjectToken:"phc_TESTTOKEN123",
      posthogApiHost:"https://eu.i.posthog.com",
      posthogUiHost:"https://eu.posthog.com",
      posthogDefaults:"2026-05-30",
      posthogSessionReplay:false
    }
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:"analytics.js"});
  return {context,localStorage,appended,inserted,nodes};
}

{
  const {context,localStorage,appended,inserted}=runtime();
  const analytics=context.HuntAnalytics;
  assert.equal(analytics.getConsentStatus(),"unknown");
  assert.equal(analytics.viewItem({id:"p-before",title:"Before"}),false);
  assert.equal(context.dataLayer.length,0,"pre-consent events must not enter dataLayer");
  assert.equal(appended.filter(x=>x.tagName==="SCRIPT").length,0,"GA4 must not load before consent");
  assert.equal(inserted.filter(x=>x.tagName==="SCRIPT").length,0,"PostHog must not load before consent");

  assert.equal(analytics.setConsent(true),true);
  assert.equal(analytics.getConsentStatus(),"granted");
  assert(appended.some(x=>String(x.src||"").includes("googletagmanager.com/gtag/js")),"GA4 load was not attempted after consent");
  assert(inserted.some(x=>String(x.src||"").includes("posthog")),"PostHog load was not attempted after consent");

  const afterGrant=context.dataLayer.length;
  assert.equal(analytics.viewItem({id:"p-after",title:"After"}),true);
  assert(context.dataLayer.length>afterGrant,"consented event did not reach GA dataLayer");

  const record=JSON.parse(localStorage.getItem("hunt_analytics_consent_v2"));
  assert.equal(record.analytics,"granted");
  assert.equal(record.version,"2026-09-20.1");

  analytics.setConsent(false);
  assert.equal(analytics.getConsentStatus(),"denied");
  assert.equal(context["ga-disable-G-TEST1234"],true);
  const afterDecline=context.dataLayer.length;
  assert.equal(analytics.viewItem({id:"p-denied",title:"Denied"}),false);
  assert.equal(context.dataLayer.length,afterDecline,"event leaked after consent revocation");
}

{
  const {context}=runtime({hunt_analytics_consent_v1:"granted"});
  assert.equal(context.HuntAnalytics.getConsentStatus(),"unknown","legacy grant must not expand to new provider scope");
}

{
  const {context}=runtime({hunt_analytics_consent_v1:"denied"});
  assert.equal(context.HuntAnalytics.getConsentStatus(),"denied","legacy decline must remain denied");
}

console.log("BOOM analytics/privacy runtime: PASS — pre-consent blocked, grant explicit, revoke immediate, legacy grant not expanded");
