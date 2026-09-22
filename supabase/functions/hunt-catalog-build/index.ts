import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BLOCKED = [
  "gun","firearm","ammunition","ammo","weapon","switchblade","taser","knife","dagger","sword","machete",
  "pepper spray","mace","brass knuckle","firework","explosive","detonator","poison","pesticide",
  "cannabis","marijuana","thc","cbd","cocaine","heroin","meth","steroid","vape","cigarette","nicotine",
  "beer","wine","vodka","whiskey","whisky","rum","tequila","casino","sportsbook","betting","porn","sex toy",
  "spyware","diet pill","laxative"
];
const clean=(v:any)=>typeof v==="string"?v.trim():"";
const env=(name:string)=>clean(Deno.env.get(name)||"");
const has=(name:string)=>Boolean(env(name));
const providerAdapterState=()=>({
  Printful:{
    mode:has("PRINTFUL_API_TOKEN")?"AUTH_TOKEN_PRESENT":"PUBLIC_DISCOVERY",
    token_present:has("PRINTFUL_API_TOKEN"),
    store_id_optional_for_single_store_token:true,
    store_present:has("PRINTFUL_STORE_ID"),
    shipping_proof:"NOT_VERIFIED",
    fulfillment:"DISABLED"
  },
  Gooten:{
    mode:has("GOOTEN_RECIPE_ID")?"RECIPE_CATALOG_READY":"PUBLIC_DISCOVERY",
    recipe_present:has("GOOTEN_RECIPE_ID"),
    partner_billing_key_used_for_catalog:false,
    shipping_proof:"NOT_VERIFIED",
    fulfillment:"DISABLED"
  },
  EPROLO:{
    mode:has("EPROLO_API_KEY")&&has("EPROLO_API_SECRET")?"SIGNED_API_READY":"CREDENTIALS_REQUIRED",
    api_key_present:has("EPROLO_API_KEY"),
    api_secret_present:has("EPROLO_API_SECRET"),
    credential_probe:"SIGNED_READ_ONLY_SMOKE",
    shipping_proof:"PENDING_DESTINATION_QUOTE",
    profit_gate:"PENDING_DESTINATION_QUOTE",
    fulfillment:"DISABLED"
  }
});
function printfulHeaders(){
  const h:Record<string,string>={"Accept":"application/json"};
  const token=env("PRINTFUL_API_TOKEN"),store=env("PRINTFUL_STORE_ID");
  if(token)h["Authorization"]="Bearer "+token;
  if(store)h["X-PF-Store-Id"]=store;
  return h;
}
function gootenReadUrl(path:string,params:Record<string,string>={}){
  const u=new URL("https://api.print.io/api/v/5/source/api/"+path.replace(/^\/+|\/+$/g,""));
  const recipe=env("GOOTEN_RECIPE_ID");
  if(recipe)u.searchParams.set("recipeid",recipe);
  for(const [k,v] of Object.entries(params))if(clean(v))u.searchParams.set(k,v);
  return u;
}
const safe=(s:string)=>!BLOCKED.some(x=>s.toLowerCase().includes(x));

const defs:Record<string,RegExp>={
  women:/\b(women(?:'s|s)?|woman|female|ladies)\b/i,
  men:/\b(men(?:'s|s)?|man|male|gentlemen)\b/i,
  dresses:/\b(dress|dresses|skirt|skirts)\b/i,
  tops:/\b(shirt|shirts|tee|tees|t-shirt|top|tops|tank|polo|blouse)\b/i,
  bottoms:/\b(pants|trousers|shorts|jeans|joggers|leggings|bottoms)\b/i,
  hoodies:/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
  jackets:/\b(jacket|jackets|coat|coats|windbreaker|outerwear|blazer|bomber)\b/i,
  knitwear:/\b(sweater|sweaters|cardigan|cardigans|knitwear|knit)\b/i,
  activewear:/\b(fitness|sport|sports|athletic|legging|leggings|yoga|gym|running|rash guard)\b/i,
  bags:/\b(bag|bags|tote|crossbody|backpack|purse|handbag|luggage|duffle)\b/i,
  shoes:/\b(shoe|shoes|sneaker|sneakers|slipper|slippers|sandal|sandals|boots|slide)\b/i,
  accessories:/\b(accessory|accessories|wallet|belt|scarf|hat|cap|sunglasses|beanie)\b/i,
  jewelry:/\b(jewelry|jewellery|necklace|bracelet|earring|earrings|pendant|ring|rings)\b/i,
  beauty:/\b(beauty|skincare|makeup|cosmetic|serum|cream|hair care|beauty tool|mirror)\b/i,
  perfume:/\b(perfume|fragrance|cologne)\b/i,
  home:/\b(home|decor|living room|household|rug|pillow|blanket)\b/i,
  kitchen:/\b(kitchen|cookware|utensil|bakeware|lunch box|food storage|dining|coaster|placemat|tray)\b/i,
  storage:/\b(storage|organizer|organisation|rack|shelf|closet)\b/i,
  bedding:/\b(bedding|bed sheet|bedsheet|duvet|comforter|blanket|pillowcase)\b/i,
  bath:/\b(bathroom|bath|shower|soap dispenser|bath mat|towel)\b/i,
  lighting:/\b(lamp|lighting|night light|desk light|led light)\b/i,
  cleaning:/\b(cleaning|cleaner|mop|brush|squeegee|dust|laundry)\b/i,
  tech:/\b(phone|tablet|computer|electronic|electronics|charging|charger|audio|earbuds|speaker|iphone|samsung|airpods|magsafe)\b/i,
  phoneaccessories:/\b(phone case|iphone case|mobile case|screen protector|phone stand|charging cable|charger)\b/i,
  gaming:/\b(gaming|gamepad|controller|keyboard|mouse pad|mousepad|headset stand|gamer)\b/i,
  travel:/\b(travel|luggage|organizer|suitcase|passport holder|weekender|duffle)\b/i,
  sports:/\b(sports|fitness|running|cycling|yoga|outdoor sport)\b/i,
  outdoors:/\b(outdoor|camping|picnic|hiking|garden)\b/i,
  toys:/\b(toy|toys|puzzle|plush|building block|craft kit|educational game)\b/i,
  kids:/\b(kid|kids|child|children|baby|toddler|youth|girl|boy)\b/i,
  pets:/\b(pet|pets|dog|dogs|cat|cats)\b/i,
  crafts:/\b(craft|crafts|sewing|knitting|crochet|painting|drawing|scrapbook|beading)\b/i,
  party:/\b(party|birthday|decoration|decorations|gift wrap|balloon)\b/i,
  gifts:/\b(gift|gifts|decor|mug|ornament|card|calendar)\b/i,
  hats:/\b(hat|hats|cap|caps|beanie|bucket hat)\b/i,
  drinkware:/\b(mug|mugs|cup|cups|bottle|bottles|tumbler|tumblers|glass)\b/i,
  wallart:/\b(wall art|poster|posters|canvas|framed art|framed print|metal print|acrylic print)\b/i,
  blankets:/\b(blanket|blankets|throw blanket|towel|towels)\b/i,
  stationery:/\b(notebook|journal|pen|stationery|calendar|planner|postcard|sticker)\b/i,
  socks:/\b(sock|socks)\b/i,
  swimwear:/\b(swimwear|swimsuit|swimsuits|bikini|swim trunks)\b/i,
  office:/\b(office|desk|mouse pad|notebook|planner|file organizer|calendar)\b/i,
  pillows:/\b(pillow|pillows|cushion|cushions)\b/i,
  ornaments:/\b(ornament|ornaments|decoration|decorations)\b/i
};

function gender(t:string){
  const w=/\b(women(?:'s|s)?|woman|female|ladies|girl)\b/i.test(t);
  const m=/\b(men(?:'s|s)?|man|male|gentlemen|boy)\b/i.test(t);
  if(w&&!m)return "women"; if(m&&!w)return "men"; return "general";
}
function add(out:Record<string,any[]>, item:any, hay:string, g:string, cap=320){
  for(const [slug,re] of Object.entries(defs)){
    if(out[slug].length>=cap || !re.test(hay)) continue;
    if(slug==="men" && (g!=="men" || /\bunisex\b/i.test(hay))) continue;
    if(slug==="women" && (g!=="women" || /\bunisex\b/i.test(hay))) continue;
    out[slug].push({...item,category:slug,gender:g});
  }
}
function baseShelves(){ const x:Record<string,any[]>={}; for(const k of Object.keys(defs))x[k]=[]; return x; }

async function cj(out:Record<string,any[]>){
  const direct=Deno.env.get("CJ_ACCESS_TOKEN")||"";
  let token=direct;
  if(!token){
    const apiKey=Deno.env.get("CJ_API_KEY")||"";
    if(!apiKey)return;
    const ar=await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey})});
    const ad=await ar.json(); token=clean(ad?.data?.accessToken); if(!token)return;
  }
  const ingest = (rows:any[]) => {
    for(const raw of rows){
      const id=clean(raw?.pid), title=clean(raw?.productNameEn), image=clean(raw?.productImage), cat=clean(raw?.categoryName);
      const price=Number(raw?.sellPrice); const hay=(title+" "+cat).toLowerCase();
      if(!id||!title||!image.startsWith("https://")||!safe(hay))continue;
      add(out,{provider:"CJdropshipping",item_id:id,title,image_url:image,merchant_product:true,price_amount:Number.isFinite(price)&&price>0?price:null,currency:"USD",price_basis:"SUPPLIER_BASE",availability_verified:false},hay,gender(hay));
    }
  };

  for(let page=1;page<=4;page++){
    const u=new URL("https://developers.cjdropshipping.com/api2.0/v1/product/list");
    u.searchParams.set("pageNum",String(page)); u.searchParams.set("pageSize","200");
    const r=await fetch(u,{headers:{"CJ-Access-Token":token,"Accept":"application/json"}}); if(!r.ok)break;
    const d=await r.json(); const rows=Array.isArray(d?.data?.list)?d.data.list:[];
    ingest(rows);
    if(rows.length<200)break;
    await new Promise(r=>setTimeout(r,1100));
  }

  const keywords = [
    "women dress","women top","men shirt","men jacket","jewelry","beauty",
    "handbag","shoes","home decor","kitchen","phone case","gaming",
    "kids toy","pet","office","travel"
  ];
  for(const keyWord of keywords){
    const u=new URL("https://developers.cjdropshipping.com/api2.0/v1/product/list");
    u.searchParams.set("pageNum","1"); u.searchParams.set("pageSize","200");
    u.searchParams.set("productNameEn",keyWord);
    const r=await fetch(u,{headers:{"CJ-Access-Token":token,"Accept":"application/json"}});
    if(r.ok){ const d=await r.json(); ingest(Array.isArray(d?.data?.list)?d.data.list:[]); }
    await new Promise(r=>setTimeout(r,1100));
  }
}

async function printful(out:Record<string,any[]>){
  const headers=printfulHeaders();
  const r=await fetch("https://api.printful.com/products",{headers}); if(!r.ok)return;
  const d=await r.json(); for(const raw of Array.isArray(d?.result)?d.result:[]){
    const id=String(raw?.id||"").trim(), title=clean(raw?.title), image=clean(raw?.image), hay=title.toLowerCase();
    if(!id||!title||raw?.is_discontinued||!safe(hay))continue;
    const connectorMode=has("PRINTFUL_API_TOKEN")&&has("PRINTFUL_STORE_ID")?"AUTHENTICATED_CATALOG":"PUBLIC_DISCOVERY";
    add(out,{provider:"Printful",item_id:id,title,image_url:image||null,merchant_product:true,price_amount:null,currency:"USD",price_basis:"DETAIL_REQUIRED",availability_verified:false,connector_mode:connectorMode},hay,gender(hay),120);
  }
}

async function gooten(out:Record<string,any[]>){
  const r=await fetch("https://gtnadminassets.blob.core.windows.net/productdatav3/catalog.json",{headers:{"Accept":"application/json","Accept-Encoding":"gzip"}}); if(!r.ok)return;
  const raw=new Uint8Array(await r.arrayBuffer()); let txt="";
  if(raw.length>2&&raw[0]===0x1f&&raw[1]===0x8b){const s=new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"));txt=await new Response(s).text();} else txt=new TextDecoder().decode(raw);
  const d=JSON.parse(txt); const rows:any[]=[];
  const walk=(n:any,p="")=>{if(Array.isArray(n)){for(const x of n)walk(x,p);return;} if(!n||typeof n!=="object")return; const np=n?.name?(p?p+" / "+clean(n.name):clean(n.name)):p; if(n?.type==="product"&&n?.product_id)rows.push({...n,_path:p}); if(n?.items)walk(n.items,np);};
  walk(d?.["product-catalog"]||[]);
  const seen=new Set<string>();
  for(const x of rows){
    const id=String(x?.product_id??"").trim(),title=clean(x?.name),image=clean(x?.url),path=clean(x?._path),hay=(title+" "+path).toLowerCase();
    if(!id||seen.has(id)||!title||!image.startsWith("https://")||x?.deprecated||x?.out_of_stock||!safe(hay))continue;
    seen.add(id); const p=Number(String(x?.cheapest_price||"").replace(/[^0-9.]/g,""));
    add(out,{provider:"Gooten",item_id:id,title,image_url:image,merchant_product:true,price_amount:Number.isFinite(p)&&p>0?p:null,currency:"USD",price_basis:"SUPPLIER_BASE",availability_verified:true,connector_mode:has("GOOTEN_RECIPE_ID")?"RECIPE_CATALOG_READY":"PUBLIC_DISCOVERY"},hay,gender(hay),140);
  }
}

async function printfulCredentialProbe(){
  if(!has("PRINTFUL_API_TOKEN"))return {ok:false,state:"TOKEN_REQUIRED"};
  const store=env("PRINTFUL_STORE_ID");
  const r=await fetch("https://api.printful.com/store/products",{headers:printfulHeaders()});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    const msg=clean(d?.result||d?.error||d?.message);
    if(r.status===400&&/store_id/i.test(msg)&&!store)return {ok:false,state:"STORE_ID_REQUIRED_FOR_TOKEN",http:r.status};
    return {ok:false,state:"STORE_PROBE_FAILED",http:r.status};
  }
  const rows=Array.isArray(d?.result)?d.result:[];
  return {ok:true,state:"READ_ONLY_STORE_ACCESS_VERIFIED",store_id:store||null,sample_count:rows.length};
}

async function gootenVariantProbe(productId:string,countryCode:string){
  if(!has("GOOTEN_RECIPE_ID"))return {ok:false,state:"RECIPE_ID_REQUIRED"};
  const country=clean(countryCode).toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))return {ok:false,state:"COUNTRY_REQUIRED"};
  const u=gootenReadUrl("productvariants",{productId,countryCode:country,currencyCode:"USD",pageSize:"200"});
  const r=await fetch(u,{headers:{"Accept":"application/json"}});
  if(!r.ok)return {ok:false,state:"PROBE_FAILED",http:r.status};
  const d=await r.json();
  const variants=Array.isArray(d?.ProductVariants)?d.ProductVariants:[];
  return {ok:true,state:"READ_ONLY_VARIANTS_VERIFIED",variant_count:variants.length,country_code:country};
}

Deno.serve(async(req)=>{
  const url=new URL(req.url);
  if(url.searchParams.get("build")!=="deep8")return new Response("forbidden",{status:403});
  const adapters=providerAdapterState();
  const probeName=clean(url.searchParams.get("probe")).toLowerCase();
  if(probeName==="printful"){
    const probe=await printfulCredentialProbe();
    return new Response(JSON.stringify({provider:"Printful",probe,provider_adapters:adapters}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }
  if(probeName==="gooten"){
    const productId=clean(url.searchParams.get("product_id"));
    const country=clean(url.searchParams.get("country"));
    if(!productId)return new Response(JSON.stringify({error:"product_id required",provider_adapters:adapters}),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
    const probe=await gootenVariantProbe(productId,country);
    return new Response(JSON.stringify({provider:"Gooten",probe,provider_adapters:adapters}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }
  const shelves=baseShelves();
  await Promise.all([cj(shelves),printful(shelves),gooten(shelves)]);
  const unique=new Set<string>(); let entries=0; const providers:Record<string,number>={};
  for(const rows of Object.values(shelves)){for(const x of rows){entries++;unique.add(String(x.provider)+":"+String(x.item_id));providers[x.provider]=(providers[x.provider]||0)+1;}}
  return new Response(JSON.stringify({generated_at:new Date().toISOString(),visible_product_count:unique.size,shelf_entry_count:entries,provider_entry_counts:providers,provider_adapters:adapters,commerce_gates:{cj_retail_price_gate_v2:{mode:"SHADOW",authority:"NONE",production_price_changes:0}},shelves}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
});