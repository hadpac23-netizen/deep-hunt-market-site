import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceDir = path.join(root, "catalog-shards");
const outDir = path.join(root, "catalog-fashion");
fs.mkdirSync(outDir, {recursive:true});

const safeText = v => String(v ?? "").trim();
const lower = v => safeText(v).toLowerCase();
const httpsImage = v => /^https:\/\//i.test(safeText(v));
const positivePrice = v => Number.isFinite(Number(v)) && Number(v) > 0;

const blocked = /\b(gun|firearm|ammunition|ammo|weapon|switchblade|taser|knife|dagger|sword|machete|pepper spray|mace|brass knuckle|firework|explosive|poison|pesticide|cannabis|marijuana|thc|cbd|cocaine|heroin|meth|steroid|vape|cigarette|nicotine|beer|wine|vodka|whiskey|casino|sportsbook|betting|porn|sex toy|adult toy|vibrator|dildo|masturbator|bdsm|diet pill|laxative)\b/i;
const sexualized = /\b(thong|g[- ]?string|erotic|fetish|bulge enhancing|adult lingerie|see[- ]?through lingerie|sexy lingerie|sexy|seductive)\b/i;
const kids = /\b(baby|newborn|toddler|kids?|child|children|boys?|girls?|youth|infant)\b/i;
const obviousNonFashion = /\b(chair|table|desk|rack|storage|basket|trash|garbage|furniture|cabinet|lamp|cable|wire|speaker|machine|trampoline|tool kit|bicycle|bike mirror|garden|pillow|blanket|bath mat|laundry basket|garbage bin|phone case|screen protector|christmas|halloween|cosplay|costume prop|pet|dog|cat|engine|blower|shortblock)\b/i;
const bodyIdeal = /\b(weight loss|lose weight|fat burn|burn fat|body shaper|waist trainer|waist trimmer|slimming|tummy[- ]?tucking|butt[- ]?lifting|hip[- ]?lifting|girdle|shapewear)\b/i;
const supplierNoise = /\b(temu\s*&\s*tk|tmeu|tk\s*only|supports?\s+pickup|self[- ]?pickup|shipment\s+from\s+walmart|logistics\s+only)\b/i;
const brandRisk = /\b(chanel|gucci|prada|louis vuitton|dior|ysl|saint laurent|hermes|hermès|burberry|fendi|versace|balenciaga)\b/i;

function baseUsable(item){
  const title=safeText(item?.title);
  const auth=lower(item?.authenticity_status);
  const brandOkay=!brandRisk.test(title) || ["verified","authorized"].includes(auth);
  return Boolean(item?.item_id && item?.provider && title && httpsImage(item?.image_url) && positivePrice(item?.price_amount)
    && !blocked.test(title) && !sexualized.test(title) && !bodyIdeal.test(title) && !supplierNoise.test(title) && brandOkay);
}
function usable(item){
  return baseUsable(item) && !kids.test(safeText(item?.title));
}
function usableKid(item){
  const title=safeText(item?.title);
  const strongKid=/\b(baby|newborn|toddler|kids?|child|children|boys?|youth|infant)\b/i;
  return baseUsable(item) && strongKid.test(title);
}

function nonFashionNoise(title){ return obviousNonFashion.test(title); }
function womenText(t){ return /\b(women(?:'s|s)?|woman|female|ladies)\b/i.test(t); }
function menText(t){ return /\b(men(?:'s|s)?|man|male|gentlemen)\b/i.test(t); }
const apparel = /\b(dress|shirt|top|blouse|pants|trousers|jeans|shorts|skirt|jacket|coat|sweater|cardigan|hoodie|clothing|apparel|wear|leggings|bra|briefs?|boxers?|suit|blazer|pajamas?|pyjamas?)\b/i;

const tests = {
  dresses: t => !nonFashionNoise(t) && /\b(dress(?:es)?|gown|sundress)\b/i.test(t)
    && !/\b(brooch|pin|necklace|bracelet|earrings?|hair clip|scarf|bag|handbag|shoe|sneaker)\b/i.test(t),
  tops: t => !nonFashionNoise(t) && (
    /\b(blouse|t[- ]?shirt|tee|tank top|polo shirt|button[- ]?down shirt|shirt)\b/i.test(t) ||
    (/\btop\b/i.test(t) && /\b(women|woman|men|man|sleeve|neck|knit|crop|fashion|blouse|shirt)\b/i.test(t))
  ),
  bottoms: t => !nonFashionNoise(t) && /\b(pants|trousers|jeans|shorts|skirt|leggings|joggers)\b/i.test(t),
  hoodies: t => !nonFashionNoise(t) && /\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i.test(t),
  jackets: t => !nonFashionNoise(t) && /\b(jacket|jackets|coat|coats|blazer|windbreaker|outerwear)\b/i.test(t)
    && !/\b(coat rack|hall tree)\b/i.test(t),
  knitwear: t => !nonFashionNoise(t) && /\b(sweater|sweaters|cardigan|cardigans|pullover|knitwear|knit top|knitted top|knit sweater|knitted sweater)\b/i.test(t),
  activewear: t => !nonFashionNoise(t)
    && /\b(sports bra|yoga (wear|set|pants|leggings|top)|gym wear|fitness wear|workout (wear|shirt|top|shorts|leggings|set|clothing)|athletic (wear|shirt|shorts)|running (shirt|shorts|leggings)|compression (shirt|pants|leggings)|training (shirt|shorts|wear)|sportswear|leggings)\b/i.test(t)
    && !/\b(equipment|resistance bands?|exercise bands?|chair|machine|mat|strap|roller|dumbbell|weights?)\b/i.test(t),
  suits: t => !nonFashionNoise(t)
    && /\b(tuxedo|business suit|formal suit|two[- ]?piece suit|2[- ]?piece suit|three[- ]?piece suit|3[- ]?piece suit|pantsuit|pant suit|suit set|blazer.{0,30}pants)\b/i.test(t)
    && !/\b(swim|bathing|yoga|sports?|ski|track|recovery|pet|suit pants only)\b/i.test(t),
  underwear: t => !nonFashionNoise(t)
    && /\b(underwear|underpants|boxer briefs?|boxers?|briefs?|sports bra|bralette|bra)\b/i.test(t)
    && !sexualized.test(t)
    && !/\b(gag|novelty)\b/i.test(t),
  socks: t => !nonFashionNoise(t) && /\bsocks?\b/i.test(t)
    && !/\b(christmas|stocking|sock filler|deodorizing|spray|arch decoration|boots?)\b/i.test(t),
  swimwear: t => !nonFashionNoise(t) && /\b(swimwear|swimsuit|bikini|swim trunks|board shorts)\b/i.test(t)
    && !sexualized.test(t),
  shoes: t => !nonFashionNoise(t)
    && (/\b(shoes?|sneakers?|loafers?|heels?|pumps|boots?|sandals?|slippers?|ballet flats?|flat shoes?)\b/i.test(t)
      || /\b(mule shoes?|shoe mules?|oxford shoes?|oxford dress shoes?)\b/i.test(t))
    && !/\b(shoe cover|shoes cover|shoe rack|shoe storage|shoe repair|repairing|shoe tree|shopping cart|trolley|graphic t[- ]?shirt)\b/i.test(t),
  bags: t => !nonFashionNoise(t)
    && /\b(handbag|purse|tote bag|crossbody bag|shoulder bag|clutch bag|backpack|wallet|satchel|hobo bag|bucket bag|waist bag|fanny pack)\b/i.test(t)
    && !/\b(laundry|trash|garbage|storage bag|tool bag|sleeping bag|punching bag|gift bag|food bag|vacuum bag|pet waste)\b/i.test(t),
  jewelry: t => !nonFashionNoise(t)
    && /\b(necklace|bracelet|earrings?|anklet|brooch|jewel(?:ry|lery) set|pendant necklace|finger ring|fashion ring)\b/i.test(t)
    && !/\b(key ring|ring light|v[- ]?ring|curtain ring|binder ring|phone ring|connector|findings|buckle)\b/i.test(t),
  accessories: t => !nonFashionNoise(t)
    && /\b(belt|scarf|sunglasses|hair clip|hairpin|headband|hairband|fashion wallet|card holder|shawl|gloves)\b/i.test(t)
    && !/\b(belt clip|holster|heating|therapy|pain relief|menstrual|support belt|tool belt)\b/i.test(t),
  hats: t => !nonFashionNoise(t)
    && /\b(bucket hat|baseball cap|trucker cap|snapback cap|sun hat|straw hat|winter hat|fashion hat|beanie|beret|fedora)\b/i.test(t)
    && !/\b(witch hat|party hat|swim cap|bathing cap|bottle cap|hub cap|loop cap|cafe cap|tow hook|bumper)\b/i.test(t),
  womenunderwear: t => !nonFashionNoise(t) && womenText(t)
    && /\b(underwear|underpants|briefs?|sports bra|bralette|bra)\b/i.test(t)
    && !/\b(gag|novelty|fake two[- ]?piece|faux two[- ]?piece)\b/i.test(t),
  menunderwear: t => !nonFashionNoise(t) && menText(t)
    && /\b(underwear|underpants|boxer briefs?|boxers?|briefs?|undershirt|base layer)\b/i.test(t)
    && !/\b(gag|novelty)\b/i.test(t),
  sleepwear: t => !nonFashionNoise(t) && apparel.test(t)
    && /\b(pajamas?|pyjamas?|sleepwear|nightwear|nightgown|sleep set)\b/i.test(t)
    && !/\b(toy|plush|pillow|party)\b/i.test(t),
  loungewear: t => !nonFashionNoise(t) && apparel.test(t)
    && /\b(loungewear|lounge set|lounge pants|lounge top)\b/i.test(t),
  plussize: t => !nonFashionNoise(t) && apparel.test(t)
    && /\b(plus size|big & tall|big and tall)\b/i.test(t),
  petite: t => !nonFashionNoise(t) && apparel.test(t) && /\bpetite\b/i.test(t),
  maternity: t => !nonFashionNoise(t) && apparel.test(t)
    && /\b(maternity|pregnancy|pregnant)\b/i.test(t),
  sets: t => !nonFashionNoise(t) && apparel.test(t)
    && /\b(co-?ord|matching set|2[- ]?piece set|two[- ]?piece set|2pc set|outfit set|suit set|set with)\b/i.test(t)
    && !/\b(fake|faux|mock)\s+two[- ]?piece\b/i.test(t)

};

const all = new Map();
for (const file of fs.readdirSync(sourceDir).filter(x=>x.endsWith(".json"))) {
  const data=JSON.parse(fs.readFileSync(path.join(sourceDir,file),"utf8"));
  for (const item of Array.isArray(data?.products)?data.products:[]) {
    if (!usable(item)) continue;
    const key=safeText(item.provider)+":"+safeText(item.item_id);
    if (!all.has(key)) all.set(key,item);
  }
}

const curated={};
for(const slug of Object.keys(tests)) curated[slug]=[];

for(const item of all.values()){
  const title=safeText(item.title);
  for(const [slug,test] of Object.entries(tests)){
    if(test(title)) curated[slug].push({...item,source_category:item.category||null,category:slug,curation_source:"fashion",catalog_discovery:true,availability_verified:item.availability_verified===true});
  }
}

curated.kids=[];
curated.kidsunderwear=[];
const kidSeen=new Set();
for (const file of fs.readdirSync(sourceDir).filter(x=>x.endsWith(".json"))) {
  const data=JSON.parse(fs.readFileSync(path.join(sourceDir,file),"utf8"));
  for (const item of Array.isArray(data?.products)?data.products:[]) {
    const key=safeText(item?.provider)+":"+safeText(item?.item_id);
    if(!key || kidSeen.has(key) || !usableKid(item)) continue;
    kidSeen.add(key);
    const title=safeText(item.title);
    if(nonFashionNoise(title)) continue;
    const kidsApparel=/\b(dress|shirt|t[- ]?shirt|top|pants|trousers|jeans|shorts|skirt|jacket|coat|sweater|cardigan|hoodie|clothing|apparel|leggings|pajamas?|pyjamas?|underwear|briefs?|boxers?)\b/i;
    if(kidsApparel.test(title) && !/\b(costume|cosplay|men(?:'s|s)? youth|adult)\b/i.test(title)){
      curated.kids.push({...item,source_category:item.category||null,category:"kids",curation_source:"fashion",catalog_discovery:true,availability_verified:item.availability_verified===true});
    }
    if(/\b(underwear|underpants|briefs?|boxers?|undershirt|base layer)\b/i.test(title)){
      curated.kidsunderwear.push({...item,source_category:item.category||null,category:"kidsunderwear",curation_source:"fashion",catalog_discovery:true,availability_verified:item.availability_verified===true});
    }
  }
}

const apparelSlugs=["dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks","swimwear","shoes"];
const accessorySlugs=["bags","jewelry","accessories","hats"];
const union = slugs => {
  const seen=new Set(), out=[];
  for(const slug of slugs){
    for(const item of curated[slug]||[]){
      const key=item.provider+":"+item.item_id;
      if(seen.has(key)) continue;
      seen.add(key); out.push(item);
    }
  }
  return out;
};
curated.women=union(apparelSlugs).filter(x=>womenText(x.title) && !menText(x.title));
curated.men=union(apparelSlugs).filter(x=>menText(x.title) && !womenText(x.title));

function score(item){
  const t=safeText(item.title);
  let s=0;
  if(item.availability_verified===true)s+=20;
  if(item.provider==="Printful")s+=4;
  if(item.provider==="Gooten")s+=2;
  if(t.length>=20&&t.length<=105)s+=5;
  if(/\b(2026|new arrival|fashion|classic|elegant|casual|premium)\b/i.test(t))s+=2;
  return s;
}

for(const slug of Object.keys(curated)){
  const seen=new Set();
  const rows=curated[slug]
    .filter(x=>{
      const key=x.provider+":"+x.item_id;
      if(seen.has(key))return false;
      seen.add(key);return true;
    })
    .map((item,index)=>({item,index,score:score(item)}))
    .sort((a,b)=>(b.score-a.score)||(a.index-b.index))
    .map(x=>x.item)
    .slice(0,600);
  curated[slug]=rows;
  fs.writeFileSync(path.join(outDir,slug+".json"),JSON.stringify({
    slug,
    count:rows.length,
    source:"HUNT authorized catalog snapshots",
    availability_policy:"DISCOVERY_UNTIL_PROVIDER_RECHECK",
    curated_at:new Date().toISOString(),
    products:rows
  },null,2)+"\n");
}

const homeSlugs=["women","dresses","tops","activewear","jackets","knitwear","shoes","bags","jewelry","accessories","hats","men","suits","underwear","womenunderwear","menunderwear","kids","kidsunderwear","sleepwear","loungewear","plussize","petite","maternity","sets","socks"];
const homeShelves={};
for(const slug of homeSlugs) homeShelves[slug]=(curated[slug]||[]).slice(0,80);
const unique=new Set(Object.values(homeShelves).flat().map(x=>x.provider+":"+x.item_id));
fs.writeFileSync(path.join(outDir,"home.json"),JSON.stringify({
  source:"HUNT curated fashion discovery",
  availability_policy:"DISCOVERY_UNTIL_PROVIDER_RECHECK",
  curated_at:new Date().toISOString(),
  visible_product_count:unique.size,
  shelf_entry_count:Object.values(homeShelves).reduce((n,rows)=>n+rows.length,0),
  shelves:homeShelves
},null,2)+"\n");

for(const slug of ["women","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","womenunderwear","menunderwear","kids","kidsunderwear","sleepwear","loungewear","plussize","petite","maternity","sets","socks","shoes","bags","jewelry","accessories","hats","men"]){
  console.log(slug.padEnd(12),String(curated[slug]?.length||0).padStart(4));
}
