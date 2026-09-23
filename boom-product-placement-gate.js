(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.BoomProductPlacementGate=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  const clean=v=>String(v??"").replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
  const rx=(pattern,flags="i")=>new RegExp(pattern,flags);
  const evidence=(code,match)=>({code,match:clean(match||"")});
  const RULES=[
    {type:"phone_case",priority:100,dest:["tech","phone-cases"],re:rx("\\b(phone case|iphone case|galaxy case|mobile phone case|smartphone case|protective case for (iphone|samsung|galaxy)|case for iphone)\\b")},
    {type:"smart_ring",priority:99,dest:["tech","wearables"],re:rx("\\b(smart ring|fitness ring|health ring)\\b")},
    {type:"smart_wearable",priority:99,dest:["tech","wearables"],re:rx("\\b(smart ?watch|smart bracelet|fitness tracker|heart rate.{0,25}bracelet|blood oxygen.{0,25}bracelet)\\b")},
    {type:"wearable_accessory",priority:98,dest:["tech","wearable-accessories"],re:rx("\\b(watch strap|watch band|smartwatch band|smart watch band|iwatch band)\\b")},
    {type:"camera",priority:97,dest:["tech","cameras"],re:rx("\\b(camera|webcam|dash cam|security cam|ccd camera)\\b"),exclude:rx("\\bcamera frame\\b")},
    {type:"charger_cable",priority:96,dest:["tech","chargers-cables"],re:rx("\\b(charger|charging cable|data cable|usb cable|type[- ]?c cable|lightning cable)\\b")},
    {type:"power_bank",priority:96,dest:["tech","power-banks"],re:rx("\\b(power bank|portable charger)\\b")},
    {type:"gaming",priority:95,dest:["tech","gaming"],re:rx("\\b(gaming mouse|gaming keyboard|gamepad|game controller|joystick|xbox controller|playstation controller)\\b")},
    {type:"pet_bed_house",priority:95,dest:["pets","pet-houses"],re:rx("\\b(cat bed|dog bed|pet bed|cat house|dog house|pet house|cat condo|pet condo|cat cave)\\b")},
    {type:"pet_grooming",priority:95,dest:["pets","pet-grooming"],re:rx("\\b(pet grooming|dog grooming|cat grooming|pet brush|dog brush|cat brush|deshedding|pet clipper|pet nail clipper)\\b")},
    {type:"aquarium",priority:95,dest:["pets","aquarium"],re:rx("\\b(aquarium|fish tank|fish filter|fish feeder|aquatic pump)\\b")},
    {type:"building_toy",priority:94,dest:["toys","building-toys"],re:rx("\\b(building blocks?|construction blocks?|brick set|building toy|construction toy)\\b")},
    {type:"office_craft",priority:72,dest:["office","crafts"],re:rx("\\b(embroidery kit|crochet kit|knitting kit|scrapbook supplies|beading (kit|supplies)|sewing kit|craft kit|jewelry making kit|diy craft|craft supplies)\\b")},
    {type:"stationery",priority:72,dest:["office","stationery"],re:rx("\\b(notebook|planner|journal|stationery|sticky notes?|paper clips?|pencil case|marker pens?)\\b"),exclude:rx("\\b(computer|laptop|macbook|briefcase|handbag)\\b")},
    {type:"garden_light",priority:93,dest:["garden","garden-lighting"],re:rx("\\b(garden light|solar garden light|landscape light|outdoor garden light)\\b")},
    {type:"garden_tool",priority:93,dest:["garden","garden-tools"],re:rx("\\b(garden tool|gardening tool|garden rake|planting shovel|watering tool|plant tool)\\b")},
    {type:"cleaning",priority:92,dest:["home","cleaning"],re:rx("\\b(mop|dustpan|broom|squeegee|duster|cleaning brush|window cleaner|household cleaner)\\b")},
    {type:"laundry",priority:92,dest:["home","laundry"],re:rx("\\b(laundry hamper|laundry basket|drying rack|clothes drying|ironing board|laundry bag)\\b")},
    {type:"bedding",priority:92,dest:["home","bedding"],re:rx("\\b(bed sheet|bedsheet|duvet|comforter|quilt|bedding set|mattress cover|pillowcase)\\b")},
    {type:"curtain",priority:92,dest:["home","curtains"],re:rx("\\b(curtain|curtains|drape|drapes|window panel)\\b")},
    {type:"rug",priority:92,dest:["home","rugs"],re:rx("\\b(rug|rugs|carpet|doormat|floor mat)\\b")},
    {type:"entryway",priority:92,dest:["home","entryway"],re:rx("\\b(coat rack|shoe rack|entryway|umbrella stand|hallway storage|console table)\\b")},
    {type:"home_storage",priority:91,dest:["home","home-storage"],re:rx("\\b(storage box|storage basket|storage rack|drawer organizer|closet organizer|home organizer)\\b")},
    {type:"wall_decor",priority:91,dest:["home","wall-decor"],re:rx("\\b(wall art|wall decor|wall hanging|wall clock|wall shelf|wall sticker)\\b")},
    {type:"mirror",priority:90,dest:["home","mirrors"],re:rx("\\b(wall mirror|full length mirror|bathroom mirror|dressing mirror|desktop mirror)\\b"),exclude:rx("\\b(phone case|holder|bracket)\\b")},
    {type:"home_lighting",priority:90,dest:["home","lighting"],re:rx("\\b(table lamp|desk lamp|bedside lamp|night light|ceiling light|wall light|home lamp)\\b")},
    {type:"fitness_accessory",priority:90,dest:["sports","fitness-accessories"],re:rx("\\b(resistance band|exercise band|yoga mat|ab roller|foam roller|jump rope|fitness accessory|gym accessory)\\b")},
    {type:"active_bottoms",priority:89,dest:["sports","active-bottoms"],re:rx("\\b(yoga pants|gym shorts|sports shorts|running pants|training pants|workout leggings)\\b")},
    {type:"sports_gear",priority:88,dest:["sports","sports-gear"],re:rx("\\b(basketball|football|soccer|tennis|badminton|volleyball).{0,20}\\b(ball|racket|gear|equipment|training)\\b")},
    {type:"earrings",priority:84,dest:["accessories","jewelry-earrings"],re:rx("\\bearrings?\\b"),exclude:rx("\\b(camera|craft|diy|beads?|phone case|keychain)\\b")},
    {type:"necklace",priority:84,dest:["accessories","jewelry-necklaces"],re:rx("\\bnecklaces?\\b"),exclude:rx("\\b(camera|craft|diy|beads?|phone case)\\b")},
    {type:"bracelet",priority:84,dest:["accessories","jewelry-bracelets"],re:rx("\\b(bracelets?|bangles?)\\b"),exclude:rx("\\b(smart|fitness|watch|cable|craft|diy|beads?)\\b")},
    {type:"ring",priority:84,dest:["accessories","jewelry-rings"],re:rx("\\b(finger ring|rings? for women|women(?:\'s)? rings?|men(?:\'s)? rings?|jewelry rings?|engagement ring|wedding ring|zircon ring|stainless steel ring)\\b"),exclude:rx("\\b(ring free|smart|fitness|yoga|phone|holder|stand|key ?ring|napkin|binder|curtain|camera|craft|diy)\\b")},
    {type:"watch",priority:86,dest:["accessories","watches"],re:rx("\\b(wristwatch|analog watch|quartz watch|mechanical watch)\\b"),exclude:rx("\\bsmart\\b")},
    {type:"hat",priority:85,dest:["accessories","hats"],re:rx("\\b(beanie|bucket hat|baseball cap|sun hat|beret)\\b")},
    {type:"bag_accessory",priority:80,dest:["accessories","bag-accessories"],re:rx("\\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap)\\b")},
    {type:"bag",priority:80,dest:["accessories","bags"],re:rx("\\b(handbag|shoulder bag|crossbody bag|tote bag|purse)\\b"),exclude:rx("\\b(storage bag|laundry bag|trash bag|sleeping bag)\\b")},
    {type:"hair_accessory",priority:80,dest:["accessories","hair-accessories"],re:rx("\\b(hair clip|hair claw|hair tie|scrunchie|headband|barrette|hair pin)\\b")},
    {type:"boxers",priority:92,dest:["men","men-boxers"],re:rx("\\b(boxer briefs|boxer shorts|boxers)\\b")},
    {type:"women_underwear",priority:92,dest:["women","women-underwear"],re:rx("\\b(panties|women'?s underwear|women'?s briefs|ladies underwear|sports bra|wireless bra)\\b")},
    {type:"women_swim",priority:92,dest:["women","women-swim"],re:rx("\\b(bikini|swimsuit|one[- ]piece swimsuit|beach cover[- ]?up)\\b"),exclude:rx("\\b(girl|kids?|children|baby)\\b")},
    {type:"evening_dress",priority:93,dest:["women","women-evening"],re:rx("\\b(evening dress|prom dress|cocktail dress|formal dress|party dress|banquet dress)\\b")},
    {type:"dress",priority:90,dest:["women","women-dresses"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,50}\\bdress\\b|\\bdress\\b.{0,50}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"skirt",priority:91,dest:["women","women-skirts"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,40}\\bskirt\\b|\\bskirt\\b.{0,40}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"women_jeans",priority:92,dest:["women","women-jeans"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(jeans?|denim pants|denim trousers)\\b|\\b(jeans?|denim pants|denim trousers)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_jeans",priority:92,dest:["men","men-jeans"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(jeans?|denim pants|denim trousers)\\b|\\b(jeans?|denim pants|denim trousers)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_shoes",priority:91,dest:["women","women-shoes"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b|\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b"),exclude:rx("\\bshoe rack|shoe cabinet\\b")},
    {type:"men_shoes",priority:91,dest:["men","men-shoes"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b|\\b(shoes?|sneakers?|boots?|sandals?|slippers?)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b"),exclude:rx("\\bshoe rack|shoe cabinet\\b")},
    {type:"women_outerwear",priority:90,dest:["women","women-outerwear"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(jacket|coat|parka|windbreaker|outerwear)\\b|\\b(jacket|coat|parka|windbreaker|outerwear)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_outerwear",priority:90,dest:["men","men-outerwear"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(jacket|coat|parka|windbreaker|outerwear)\\b|\\b(jacket|coat|parka|windbreaker|outerwear)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_hoodie",priority:90,dest:["women","women-hoodies"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(hoodie|sweatshirt)\\b|\\b(hoodie|sweatshirt)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_hoodie",priority:90,dest:["men","men-hoodies"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(hoodie|sweatshirt)\\b|\\b(hoodie|sweatshirt)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_knitwear",priority:89,dest:["women","women-knitwear"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(sweater|cardigan|knitwear|pullover)\\b|\\b(sweater|cardigan|knitwear|pullover)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_knitwear",priority:89,dest:["men","men-knitwear"],re:rx("\\b(men|men'?s|mens|male|man).{0,45}\\b(sweater|cardigan|knitwear|pullover)\\b|\\b(sweater|cardigan|knitwear|pullover)\\b.{0,45}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"women_suit",priority:91,dest:["women","women-suits"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,45}\\b(suit|blazer|two[- ]piece suit)\\b|\\b(suit|blazer)\\b.{0,45}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_suit",priority:91,dest:["men","men-suits"],re:rx("\\b(men|men'?s|mens|male|man|groom).{0,45}\\b(suit|tuxedo|blazer)\\b|\\b(suit|tuxedo|blazer)\\b.{0,45}\\b(men|men'?s|mens|male|man|groom)\\b")},
    {type:"women_socks",priority:88,dest:["women","women-socks"],re:rx("\\b(women|women'?s|womens|ladies|woman|female).{0,40}\\b(socks?|stockings?|pantyhose)\\b|\\b(socks?|stockings?|pantyhose)\\b.{0,40}\\b(women|women'?s|womens|ladies|woman|female)\\b")},
    {type:"men_socks",priority:88,dest:["men","men-socks"],re:rx("\\b(men|men'?s|mens|male|man).{0,40}\\bsocks?\\b|\\bsocks?\\b.{0,40}\\b(men|men'?s|mens|male|man)\\b")},
    {type:"generic_socks",priority:70,dest:["accessories","socks"],re:rx("\\bsocks?\\b"),exclude:rx("\\b(sock boots?|sock shoes?)\\b")}
  ].sort((a,b)=>b.priority-a.priority);

  function detectGender(title){
    const t=clean(title).toLowerCase();
    const men=/\b(men|men's|mens|male|man|gentlemen|boys?)\b/i.test(t);
    const women=/\b(women|women's|womens|female|woman|ladies|lady|girls?)\b/i.test(t);
    const kids=/\b(kids?|children|child|baby|toddler|infant|newborn)\b/i.test(t);
    if(men&&women)return "UNISEX";
    if(kids&&!men&&!women)return "KIDS";
    if(men&&!women)return "MEN";
    if(women&&!men)return "WOMEN";
    return "UNKNOWN";
  }

  function detectProductType(product={}){
    const title=clean(product.title);
    const hits=[];
    for(const rule of RULES){
      const m=title.match(rule.re);
      if(!m)continue;
      if(rule.exclude&&rule.exclude.test(title))continue;
      hits.push({type:rule.type,priority:rule.priority,dest:rule.dest,match:m[0]});
    }
    if(!hits.length)return {state:"UNKNOWN",hits:[]};
    const top=hits[0];
    const conflicting=hits.filter(x=>x.priority>=top.priority-1 && (x.dest[0]!==top.dest[0]||x.dest[1]!==top.dest[1]));
    if(conflicting.length>1)return {state:"CONFLICTED",hits:conflicting};
    return {state:"VERIFIED",...top,hits};
  }

  function evaluate(product={}){
    const currentDepartment=clean(product.current_department||product.department);
    const currentCategory=clean(product.current_category||product.category);
    const title=clean(product.title);
    const gender=detectGender(title);
    const type=detectProductType(product);
    const positive=[],negative=[],conflicts=[],reasonCodes=[];

    if(type.state==="CONFLICTED"){
      conflicts.push(...type.hits.map(x=>x.type+":"+x.dest.join("/")));
      reasonCodes.push("PLACEMENT_TYPE_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",detected_product_type:null,canonical_department:null,canonical_category:null,confidence:0,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }

    if(type.state==="VERIFIED"){
      const [dep,cat]=type.dest;
      positive.push(evidence("EXPLICIT_PRODUCT_TYPE",type.match),evidence("DETECTED_TYPE",type.type));
      const same=dep===currentDepartment&&cat===currentCategory;
      if(!same){
        negative.push(evidence("CURRENT_PLACEMENT_CONTRADICTS_TYPE",(currentDepartment||"UNKNOWN")+"/"+(currentCategory||"UNKNOWN")));
        reasonCodes.push("CURRENT_PLACEMENT_MISMATCH");
      }else reasonCodes.push("PLACEMENT_SUPPORTED");
      return {decision:same?"PASS":"REJECT",placement_action:same?"KEEP":"MOVE",detected_product_type:type.type,canonical_department:dep,canonical_category:cat,confidence:0.98,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:!same,gender};
    }

    if(currentDepartment==="men"&&gender==="WOMEN"){
      negative.push(evidence("EXPLICIT_GENDER_CONFLICT","WOMEN title in men department"));
      reasonCodes.push("GENDER_DEPARTMENT_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",detected_product_type:null,canonical_department:"women",canonical_category:null,confidence:0.90,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }
    if(currentDepartment==="women"&&gender==="MEN"){
      negative.push(evidence("EXPLICIT_GENDER_CONFLICT","MEN title in women department"));
      reasonCodes.push("GENDER_DEPARTMENT_CONFLICT");
      return {decision:"REVIEW",placement_action:"HOLD_REVIEW",detected_product_type:null,canonical_department:"men",canonical_category:null,confidence:0.90,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
    }

    reasonCodes.push("NO_INDEPENDENT_PLACEMENT_PROOF");
    return {decision:"UNKNOWN",placement_action:"HOLD_UNKNOWN",detected_product_type:null,canonical_department:null,canonical_category:null,confidence:0,positive_evidence:positive,negative_evidence:negative,conflicts,reason_codes:reasonCodes,review_required:true,gender};
  }

  function audit(products=[]){
    const rows=products.map(p=>({...p,placement:evaluate(p)}));
    const summary={total:rows.length,PASS:0,REJECT:0,REVIEW:0,UNKNOWN:0,KEEP:0,MOVE:0,HOLD_REVIEW:0,HOLD_UNKNOWN:0};
    for(const row of rows){
      summary[row.placement.decision]=(summary[row.placement.decision]||0)+1;
      summary[row.placement.placement_action]=(summary[row.placement.placement_action]||0)+1;
    }
    return {version:"HUNT-PRODUCT-PLACEMENT-GATE-V1",mode:"SHADOW_ALWAYS_ON",summary,rows};
  }

  return {version:"HUNT-PRODUCT-PLACEMENT-GATE-V1",detectGender,detectProductType,evaluate,audit};
});
