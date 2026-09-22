const token=(process.env.PRINTFUL_API_TOKEN||"").trim();
const execute=process.argv.includes("--create-draft");
const allowed=(process.env.PRINTFUL_ALLOW_DRAFT_CREATE||"")==="YES_DRAFT_ONLY";
const payload={
  recipient:{
    name:"HUNT API Draft Test",
    address1:"19749 Dearborn St",
    city:"Chatsworth",
    state_code:"CA",
    state_name:"California",
    country_code:"US",
    country_name:"United States",
    zip:"91311"
  }
};
const safe={mode:execute?"CREATE_DRAFT":"DRY_RUN",endpoint:"POST /v2/orders",confirm:false,payload,live_fulfillment:"DISABLED"};
if(!execute){console.log(JSON.stringify(safe,null,2));process.exit(0);}
if(!allowed){console.error("Draft creation blocked: set PRINTFUL_ALLOW_DRAFT_CREATE=YES_DRAFT_ONLY");process.exit(3);}
if(!token){console.error("PRINTFUL_API_TOKEN missing");process.exit(2);}
const r=await fetch("https://api.printful.com/v2/orders",{
  method:"POST",
  headers:{Authorization:"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify(payload)
});
const body=await r.json().catch(()=>({}));
const order=body?.data||null;
console.log(JSON.stringify({http:r.status,created:r.ok,status:order?.status||null,order_id:order?.id||null,confirmed:false,charged:false},null,2));
if(!r.ok||order?.status!=="draft")process.exit(4);