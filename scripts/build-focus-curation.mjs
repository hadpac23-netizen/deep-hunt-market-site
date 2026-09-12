import fs from "node:fs";
import path from "node:path";

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const sourceDir=path.join(root,"catalog-shards");
const outDir=path.join(root,"catalog-focus");
fs.mkdirSync(outDir,{recursive:true});

const text=v=>String(v??"").trim();
const low=v=>text(v).toLowerCase();
const imageOk=v=>/^https:\/\//i.test(text(v));
const priceOk=v=>Number.isFinite(Number(v))&&Number(v)>0;

const supplierNoise=/\b(temu\s*&\s*tk|tmeu|tk\s*only|supports?\s+pickup|self[- ]?pickup|shipment\s+from\s+walmart|logistics\s+only|no provide self pick-up|do not sell on amazon|prohibited by walmart|amazon shipping)\b/i;
const blocked=/\b(gun|firearm|ammunition|ammo|weapon|switchblade|taser|knife|dagger|sword|machete|pepper spray|mace|brass knuckle|firework|explosive|poison|pesticide|cannabis|marijuana|thc|cbd|cocaine|heroin|meth|steroid|vape|cigarette|nicotine|beer|wine|vodka|whiskey|casino|sportsbook|betting|porn|sex toy|adult toy|vibrator|dildo|bdsm|diet pill|laxative)\b/i;
const sexualized=/\b(thong|g[- ]?string|erotic|fetish|adult lingerie|see[- ]?through lingerie|sexy lingerie|seductive)\b/i;
const bodyIdeal=/\b(weight loss|lose weight|fat burn|burn fat|body shaper|waist trainer|waist trimmer|slimming|tummy[- ]?tucking|butt[- ]?lifting|hip[- ]?lifting|girdle|shapewear)\b/i;
const brandRisk=/\b(chanel|gucci|prada|louis vuitton|dior|ysl|saint laurent|hermes|hermès|burberry|fendi|versace|balenciaga)\b/i;
const medical=/\b(microneedle|micro needle|dermaroller|derma roller|therapy|treatment|pain relief|medical|healing|psoriasis|eczema|wart|antifungal|antibacterial)\b/i;

function usable(item){
  const title=text(item?.title);
  const auth=low(item?.authenticity_status);
  const brandOkay=!brandRisk.test(title)||["verified","authorized"].includes(auth);
  return Boolean(item?.item_id&&item?.provider&&title&&imageOk(item?.image_url)&&priceOk(item?.price_amount)
    &&!supplierNoise.test(title)&&!blocked.test(title)&&!sexualized.test(title)&&!bodyIdeal.test(title)&&brandOkay);
}

const providerName=item=>low(item?.provider);
const onsiteCatalog=item=>!providerName(item).includes("ebay");
const verifiedBrand=item=>["verified","authorized"].includes(low(item?.authenticity_status));

const tests={
  beauty:t=>!medical.test(t)
    &&(
      /\b(face cleanser|facial cleanser|face wash|moisturizer|moisturiser|face serum|skin serum|skincare|skin care|acne patches?|pimple patches?|nail care|nail polish)\b/i.test(t)
      || /\b(lipstick|lip gloss|mascara|foundation|concealer|eyeshadow|makeup palette|cosmetic shimmer spray)\b/i.test(t)
      || /\b(shampoo|hair care|hair mask|hair serum|hair oil|hair conditioner)\b/i.test(t)
    )
    &&!/\b(shoe|mule|earring|jewelry|air conditioner|coil cleaner|suede|tool|fan|rack|steamer|humidifier|sleep mask|sticker|halloween|cosplay|fake blood|wound|costume|prop|mirror|vanity|table|desk|cabinet|holder|organizer|machine|device|chair|makeup case|cosmetic case|storage case|makeup bag|cosmetic bag|storage bag|tattoo)\b/i.test(t),

  gaming:t=>/\b(gaming controller|game controller|gamepad|gaming headset|gaming headphones|gaming keyboard|mechanical gaming keyboard|gaming mouse|rgb gaming mouse|gaming microphone)\b/i.test(t)
    &&!/\b(desk|chair|table|cabinet|furniture|monitor stand)\b/i.test(t),

  tech:t=>/\b(phone charger|wall charger|usb charger|wireless charger|charging cable|usb cable|power bank|screen protector|earbuds|earphones|headphones|microphone|wireless microphone|lapel microphone|webcam|usb hub|smart watch|smartwatch|bluetooth speaker)\b/i.test(t)
    &&!/\b(table|desk|cabinet|vanity|furniture|organizer|holder only)\b/i.test(t),

  lighting:t=>/\b(under cabinet light|under-cabinet light|desk lamp|table lamp|floor lamp|bedside lamp|led strip light|led strip|wall light|reading lamp|rechargeable lamp|cordless lamp)\b/i.test(t)
    &&!/\b(aquarium|fish tank|rug|carpet|cabinet|armoire|furniture|wind chime|fan|speaker|phone holder)\b/i.test(t),

  travel:t=>/\b(luggage|suitcase|packing cubes?|travel organizer|passport holder|travel adapter|toiletry bag|travel pouch|carry[- ]?on bag|travel backpack|luggage organizer|luggage tag)\b/i.test(t)
    &&!/\b(ride-on|ride on|toddler seat|pet carrier)\b/i.test(t),

  crafts:t=>/\b(embroidery kit|crochet kit|knitting kit|beading kit|bead kit|sewing kit|scrapbook kit|scrapbooking|painting kit|diy craft kit|craft supplies|embroidery thread|crochet hooks?|knitting needles?)\b/i.test(t)
    &&!/\b(hat|beanie|cap|wall art|finished decor)\b/i.test(t),

  sports:(t,item)=>onsiteCatalog(item)
    &&/\b(yoga mat|pilates|resistance bands?|fitness bands?|dumbbells?|jump rope|skipping rope|running belt|gym bag|exercise mat|workout bands?|basketball|football|soccer|volleyball|tennis|badminton|table tennis|swimming|swim cap|sports sunglasses|cycling glasses|sports towel|gym towel|cooling towel)\b/i.test(t)
    &&!/\b(dog|pet|therapy|medical|supplement|pre-workout|protein powder|fat burner)\b/i.test(t),

  fitnessequipment:(t,item)=>onsiteCatalog(item)
    &&/\b(dumbbells?|resistance bands?|fitness bands?|workout bands?|jump rope|skipping rope|exercise mat|training bench|curl bench|weight bench|pull-up|push-up|ab roller|step platform|balance board|foam roller|gym equipment|fitness equipment)\b/i.test(t)
    &&!/\b(therapy|medical|weight loss|fat burn|slimming)\b/i.test(t),

  yoga:(t,item)=>onsiteCatalog(item)
    &&/\b(yoga mat|pilates mat|yoga block|yoga strap|yoga towel|pilates ring|pilates ball|resistance band)\b/i.test(t)
    &&!/\b(therapy|medical|weight loss|fat burn|slimming)\b/i.test(t),

  runningcycling:(t,item)=>onsiteCatalog(item)
    &&/\b(running belt|running vest|running light|cycling glasses|sports sunglasses|cycling bag|bike bag|bicycle bag|cycling gloves|running cap|hydration belt|sports bottle)\b/i.test(t)
    &&!/\b(motorcycle|medical|therapy)\b/i.test(t),

  swimming:(t,item)=>onsiteCatalog(item)
    &&/\b(swim cap|swimming cap|swimming goggles|swim goggles|kickboard|swim training|pool training|swim bag|swimming accessory)\b/i.test(t)
    &&!/\b(inflatable boat|repair kit|adult|lingerie)\b/i.test(t),

  ballsports:(t,item)=>onsiteCatalog(item)
    &&/\b(basketball|football|soccer|volleyball|training ball|ball pump|ball bag|ball storage)\b/i.test(t)
    &&!/\b(medal|hanger|decor|medical|therapy)\b/i.test(t),

  racketsports:(t,item)=>onsiteCatalog(item)
    &&/\b(tennis ball|tennis racket|tennis racquet|badminton|table tennis|ping pong|padel|racket grip|racquet grip)\b/i.test(t)
    &&!/\b(bracelet|shoe|dress|skirt|medal|decor)\b/i.test(t),

  sportstowels:(t,item)=>onsiteCatalog(item)
    &&/\b(sports? towels?|gym towels?|cooling towels?|yoga towels?|golf towels?|quick[- ]?dry towels?)\b/i.test(t)
    &&!/\b(rack|holder|hook|warmer|storage|cabinet)\b/i.test(t),

  towels:(t,item)=>onsiteCatalog(item)
    &&/\b(bath towels?|hand towels?|beach towels?|sports? towels?|gym towels?|cooling towels?|yoga towels?|golf towels?|turkish towels?|peshtemal|towel sets?)\b/i.test(t)
    &&!/\b(rack|holder|hook|warmer|storage|cabinet|paper towel)\b/i.test(t),

  sunglasses:(t,item)=>onsiteCatalog(item)
    &&/\b(sunglasses?|sports? glasses|cycling glasses|polarized eyewear|uv400 eyewear)\b/i.test(t)
    &&(!/\b(ray[- ]?ban|oakley|maui jim|gucci|prada|chanel|dior|versace|balenciaga)\b/i.test(t)||verifiedBrand(item))
    &&!/\b(pet|dog|costume|toy)\b/i.test(t),

  drinkware:t=>/\b(insulated tumbler|travel tumbler|thermos|vacuum bottle|insulated water bottle|water bottle|travel mug|coffee mug|sports bottle)\b/i.test(t)
    &&!/\b(stand|rack|organizer|compost|generator|machine)\b/i.test(t),

  bedding:t=>/\b(bedding set|bed sheet|bedsheet|sheet set|duvet cover|comforter|quilt|pillowcase|pillow case|mattress topper|bed cover)\b/i.test(t)
    &&!/\b(sleep mask|gift box|decorative cushion cover)\b/i.test(t),

  hats:t=>/\b(baseball cap|bucket hat|beanie|beret|fedora|sun hat|straw hat|snapback|trucker cap)\b/i.test(t)
    &&!/\b(washer|cleaner|cage|machine|decoration|costume)\b/i.test(t),

  socks:t=>/\b(socks?|ankle socks|crew socks|no[- ]?show socks)\b/i.test(t)
    &&!/\b(boots?|shoe|deodorizing|spray|stocking|christmas|arch|decoration|toy|lights?)\b/i.test(t),

  swimwear:t=>/\b(one[- ]?piece swimsuit|one[- ]?piece swimwear|swimsuit|swim trunks|board shorts|rash guard)\b/i.test(t)
    &&!/\b(cover up|lingerie|see[- ]?through|sheer)\b/i.test(t)
};

const all=new Map();
for(const file of fs.readdirSync(sourceDir).filter(x=>x.endsWith(".json"))){
  const data=JSON.parse(fs.readFileSync(path.join(sourceDir,file),"utf8"));
  for(const item of Array.isArray(data?.products)?data.products:[]){
    if(!usable(item))continue;
    const key=text(item.provider)+":"+text(item.item_id);
    if(!all.has(key))all.set(key,item);
  }
}

const curated={};
for(const slug of Object.keys(tests))curated[slug]=[];

for(const item of all.values()){
  const title=text(item.title);
  for(const [slug,test] of Object.entries(tests)){
    if(test(title,item)){
      curated[slug].push({...item,source_category:item.category||null,category:slug,curation_source:"focus",catalog_discovery:true,availability_verified:item.availability_verified===true});
    }
  }
}

function score(item){
  const title=text(item.title);
  let s=0;
  if(item.availability_verified===true)s+=20;
  if(item.provider==="eBay")s+=3;
  if(title.length>=16&&title.length<=100)s+=3;
  if(item.variant_count>0)s+=1;
  if(item.source_fresh_at)s+=1;
  return s;
}

for(const slug of Object.keys(curated)){
  const seen=new Set();
  const seenTitle=new Set();
  const rows=curated[slug]
    .filter(item=>{
      const key=item.provider+":"+item.item_id;
      const titleKey=low(item.title).replace(/\s+/g," ");
      if(seen.has(key)||seenTitle.has(titleKey))return false;
      seen.add(key);seenTitle.add(titleKey);return true;
    })
    .map((item,index)=>({item,index,score:score(item)}))
    .sort((a,b)=>(b.score-a.score)||(a.index-b.index))
    .map(x=>x.item)
    .slice(0,400);
  curated[slug]=rows;
  fs.writeFileSync(path.join(outDir,slug+".json"),JSON.stringify({
    slug,count:rows.length,source:"HUNT focused curation from authorized catalog snapshots",
    availability_policy:"DISCOVERY_UNTIL_PROVIDER_RECHECK",
    curated_at:new Date().toISOString(),products:rows
  },null,2)+"\n");
}

const homeShelves={};
for(const [slug,rows] of Object.entries(curated)){
  if(rows.length>=4)homeShelves[slug]=rows.slice(0,80);
}
const unique=new Set(Object.values(homeShelves).flat().map(x=>x.provider+":"+x.item_id));
fs.writeFileSync(path.join(outDir,"home.json"),JSON.stringify({
  source:"HUNT focused weak-shelf curation",
  availability_policy:"DISCOVERY_UNTIL_PROVIDER_RECHECK",
  curated_at:new Date().toISOString(),
  visible_product_count:unique.size,
  shelf_entry_count:Object.values(homeShelves).reduce((n,rows)=>n+rows.length,0),
  shelves:homeShelves
},null,2)+"\n");

for(const slug of Object.keys(curated)){
  console.log(slug.padEnd(12),String(curated[slug].length).padStart(4));
}
