"use strict";

const BLOCKED=/\b(weapon|gun|firearm|ammo|ammunition|knife|blade|dagger|sword|machete|taser|pepper spray|mace|firework|explosive|vape|cigarette|nicotine|cbd|thc|cannabis|marijuana|adult|porn|steroid|diet pill|laxative)\b/i;

const MARKETING_TAGS=/\b(gift|gifts|gift for her|gift for him|birthday gift|christmas gift|summer|winter|trending|viral|new arrival|hot sale|best seller|for her|for him)\b/ig;

const RULES=[
  {id:"PET_HOUSE",department:"pets",category:"pet-houses",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,40}\b(bed|house|condo|cave|kennel)\b|\b(bed|house|condo|cave|kennel)\b.{0,40}\b(dog|cat|pet|puppy|kitten)\b/i},
  {id:"PET_CLOTHING",department:"pets",category:"pet-clothing",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,40}\b(hoodie|coat|shirt|dress|clothes|clothing|jacket|sweater)\b/i},
  {id:"PET_ACCESSORY",department:"pets",category:"pet-accessories",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,50}\b(bandana|scarf|collar|leash|harness|bowl|toy|brush|accessory|accessories)\b/i},

  {id:"BABY_CLOTHING",department:"kids",category:"baby-clothing",rx:/\b(baby|newborn|infant)\b.{0,50}\b(romper|onesie|bodysuit|clothes|clothing|outfit|pants|shirt|dress|jumpsuit|set)\b/i},
  {id:"BABY_CARE_REVIEW",department:"kids",category:null,rx:/\b(baby|newborn|infant|nappy|diaper)\b.{0,60}\b(bag|carrier|stroller|care|feeding|bottle|changing)\b/i,review:true},

  {id:"PHONE_CASE",department:"tech",category:"phone-cases",rx:/\b(phone|iphone|galaxy|smartphone|mobile)\b.{0,30}\b(case|cover)\b|\b(case|cover)\b.{0,30}\b(phone|iphone|galaxy|smartphone|mobile)\b/i},
  {id:"GAMING",department:"tech",category:"gaming",rx:/\b(gamepad|game controller|gaming mouse|gaming keyboard|gaming controller)\b/i},
  {id:"WEARABLE_ACCESSORY",department:"tech",category:"wearable-accessories",rx:/\b(smartwatch|smart watch|apple watch|iwatch)\b.{0,35}\b(band|strap|charger|stand|protector|case)\b/i},

  {id:"KITCHEN_TOOL",department:"kitchen",category:"kitchen-tools",rx:/\b(kitchen|cooking|cookware)\b.{0,50}\b(spoon|strainer|colander|utensil|whisk|spatula|peeler|tongs|grater|shovel|filter|tool)\b|\b(spoon|strainer|colander|whisk|spatula|peeler|tongs|grater)\b.{0,50}\b(kitchen|cooking)\b/i},
  {id:"BATH",department:"home",category:"bath",rx:/\b(bathroom|bath|shower|toilet)\b.{0,50}\b(brush|mat|curtain|rack|holder|caddy|towel|accessory|accessories)\b/i},

  {id:"WOMEN_KNITWEAR",department:"women",category:"women-knitwear",rx:/\b(women|woman|female)\b.{0,50}\b(sweater|cardigan|knitwear|knit|pullover)\b|\b(sweater|cardigan|knitwear|pullover)\b.{0,50}\b(women|woman|female)\b/i},
  {id:"WOMEN_DRESS",department:"women",category:"women-dresses",rx:/\b(women|woman|female)\b.{0,50}\b(dress|dresses)\b|\b(dress|dresses)\b.{0,50}\b(women|woman|female)\b/i},
  {id:"MEN_TOP",department:"men",category:"men-tops",rx:/\b(men|mens|men's|male)\b.{0,40}\b(t-shirt|shirt|polo|tank top)\b/i},

  {id:"JEWELRY_NECKLACE",department:"accessories",category:"jewelry-necklaces",rx:/\b(necklace|necklaces|pendant|choker)\b/i},
  {id:"JEWELRY_EARRING",department:"accessories",category:"jewelry-earrings",rx:/\b(earring|earrings)\b/i},
  {id:"JEWELRY_BRACELET",department:"accessories",category:"jewelry-bracelets",rx:/\b(bracelet|bracelets|bangle|bangles)\b/i},
  {id:"HAIR_ACCESSORY",department:"accessories",category:"hair-accessories",rx:/\b(hair clip|hairpin|hair pin|hair claw|hair tie|scrunchie|headband|barrette|hair comb)\b/i},
  {id:"HAT",department:"accessories",category:"hats",rx:/\b(bucket hat|baseball cap|beanie|beret|hat|caps?)\b/i},
  {id:"SOCKS",department:"accessories",category:"socks",rx:/\b(sock|socks|stocking|stockings|hosiery)\b/i},
  {id:"SCARF",department:"accessories",category:"scarves",rx:/\b(scarf|scarves|shawl)\b/i},
  {id:"BELT",department:"accessories",category:"belts",rx:/\b(belt|belts)\b/i},
  {id:"BAG_ACCESSORY",department:"accessories",category:"bag-accessories",rx:/\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap)\b/i},
  {id:"BAG",department:"accessories",category:"bags",rx:/\b(handbag|purse|tote bag|crossbody bag|shoulder bag|backpack|schoolbag)\b/i},

  {id:"PARTY",department:"gifts",category:null,rx:/\b(party decoration|party supplies|balloon|gift wrap|wrapping paper|gift box|greeting card|party favor)\b/i,review:true}
];

const PROPOSED_ROUTE_RULES={
  "accessories/bag-accessories":/\b(bag strap|bag charm|bag chain|bag organizer|purse strap|handbag strap|bag accessory)\b/i,
  "accessories/gloves":/\b(glove|gloves|mitten|mittens)\b/i,
  "accessories/hair-accessories":/\b(hair clip|hair band|hair pin|hair claw|hair tie|scrunchie|headband|barrette)\b/i,
  "accessories/hats":/\b(hat|cap|beanie|beret|bucket hat|baseball cap)\b/i,
  "accessories/jewelry":/\b(jewelry set|jewellery set|necklace.+earring|earring.+necklace|bracelet.+necklace)\b/i,
  "accessories/jewelry-earrings":/\b(earring|earrings)\b/i,
  "accessories/jewelry-necklaces":/\b(necklace|necklaces|pendant necklace)\b/i,
  "accessories/socks":/\b(sock|socks|stocking|stockings)\b/i,
  "accessories/bags":/\b(handbag|shoulder bag|crossbody bag|backpack|tote bag|purse)\b/i,
  "accessories/scarves":/\b(scarf|scarves|shawl|wrap)\b/i,
  "accessories/belts":/\b(belt|belts)\b/i,
  "accessories/jewelry-bracelets":/\b(bracelet|bracelets|bangle|bangles)\b/i,

  "beauty/nails":/\b(nail art|nail polish|nail tips|nail sticker|manicure|press[- ]?on nails|fake nails)\b/i,

  "home/bath":/\b(bath mat|bathroom|shower curtain|soap dish|towel rack|bath caddy|bath towel)\b/i,
  "home/bedding":/\b(bed sheet|duvet|quilt|pillow|bedding|mattress cover|bed cover)\b/i,
  "home/cleaning":/\b(cleaning|mop|duster|scrubber|dustpan|broom|squeegee)\b/i,
  "home/curtains":/\b(curtain|curtains|window blind|drape|drapes)\b/i,
  "home/home-storage":/\b(storage box|storage basket|storage bag|storage rack|organizer|drawer organizer)\b/i,
  "home/laundry":/\b(laundry|hamper|clothes drying|drying rack|ironing|clothes hanger)\b/i,
  "home/lighting":/\b(lamp|lighting|night light|led light|table light|wall light|ceiling light)\b/i,
  "home/mirrors":/\b(mirror|mirrors)\b/i,
  "home/rugs":/\b(rug|rugs|carpet|floor mat|doormat)\b/i,
  "home/wall-decor":/\b(wall art|wall decor|wall clock|wall sticker|wall shelf|poster)\b/i,

  "kids/baby-clothing":/\b(baby|newborn|infant).{0,30}\b(romper|onesie|bodysuit|clothes|clothing|outfit|pants|shirt|dress|jumpsuit)\b/i,

  "men/men-boxers":/\b(boxer|boxers|boxer briefs)\b/i,
  "men/men-clothing":/\b(men's clothing|mens clothing|men clothing|men outfit|men casual set)\b/i,
  "men/men-hoodies":/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
  "men/men-jeans":/\b(jean|jeans|denim pants|denim trousers)\b/i,
  "men/men-knitwear":/\b(sweater|sweaters|knitwear|knitted cardigan|pullover)\b/i,
  "men/men-socks":/\b(sock|socks|stocking|stockings)\b/i,
  "men/men-suits":/\b(suit|suits|blazer|blazers|tuxedo)\b/i,
  "men/men-underwear":/\b(underwear|brief|briefs|underpants)\b/i,
  "men/men-bottoms":/\b(pants|trousers|shorts|cargo pants|joggers)\b/i,
  "men/men-outerwear":/\b(jacket|jackets|coat|coats|parka|windbreaker)\b/i,
  "men/men-tops":/\b(t[- ]?shirt|shirt|shirts|polo|tank top)\b/i,

  "office/crafts":/\b(craft|crafts|diy|embroidery|knitting|crochet|beading|scrapbook|sewing|stamp punch|wooden chips)\b/i,
  "office/stickers":/\b(sticker|stickers|decal|decals)\b/i,
  "office/office-storage":/\b(desk organizer|file organizer|document holder|pen holder|office storage|desktop storage)\b/i,
  "office/stationery":/\b(notebook|pen|pencil|marker|eraser|stationery|sticky note|paper clip|sketch book)\b/i,

  "pets/aquarium":/\b(aquarium|fish tank|aquatic|fish filter|fish feeder)\b/i,
  "pets/pet-clothing":/\b(pet clothes|pet clothing|dog clothes|dog coat|dog shirt|cat clothes|cat clothing|pet hoodie|dog hoodie)\b/i,
  "pets/pet-houses":/\b(pet house|dog house|cat house|pet bed|dog bed|cat bed|pet condo|cat condo)\b/i,
  "pets/pet-grooming":/\b(pet grooming|dog grooming|cat grooming|pet brush|dog brush|cat brush|deshedding|pet nail clipper)\b/i,

  "sports/outdoors":/\b(hiking|trekking|outdoor training|outdoor sport|climbing accessory)\b/i,
  "sports/sports-gear":/\b(basketball|football|soccer|tennis|badminton|volleyball|sports gear|training gear)\b/i,
  "sports/fitness-accessories":/\b(resistance band|yoga mat|fitness band|workout band|gym accessory|fitness accessory|exercise band)\b/i,
  "sports/active-bottoms":/\b(yoga pants|sports shorts|gym shorts|running pants|training pants|workout leggings)\b/i,

  "tech/gaming":/\b(gaming|gamepad|game controller|gaming mouse|gaming keyboard|controller)\b/i,
  "tech/phone-cases":/\b(phone case|iphone case|galaxy case|smartphone case|mobile phone case)\b/i,
  "tech/wearable-accessories":/\b(watch band|watch strap|smartwatch band|smart watch band|wearable strap)\b/i,

  "women/women-bottoms":/\b(women.{0,20}(pants|trousers|shorts)|wide leg pants|women cargo pants)\b/i,
  "women/women-hoodies":/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i,
  "women/women-knitwear":/\b(sweater|sweaters|cardigan|knitwear|knitted top|knitted pullover)\b/i,
  "women/women-sleepwear":/\b(pajama|pajamas|pyjama|pyjamas|nightgown|sleepwear|nightwear|robe)\b/i,
  "women/women-socks":/\b(sock|socks|stocking|stockings|pantyhose)\b/i,
  "women/women-skirts":/\b(skirt|skirts)\b/i,
  "women/women-outerwear":/\b(jacket|jackets|coat|coats|parka|windbreaker)\b/i,
  "women/women-evening":/\b(evening dress|prom dress|party dress|cocktail dress|formal dress|occasion dress)\b/i,

  "camping/camping-cook":/\b(camping (cookware|pot|kettle|utensil|tableware)|picnic cookware|camping kitchen)\b/i,
  "camping/camping-sleep":/\b(sleeping bag|camping pillow|camping mat|camping mattress|air mattress)\b/i,

  "toys/building-toys":/\b(building blocks|construction blocks|brick set|building toy|construction toy)\b/i,
  "garden/garden-lighting":/\b(garden light|solar garden light|outdoor garden light|landscape light)\b/i,
  "garden/garden-tools":/\b(garden tool|gardening tool|planting shovel|garden rake|watering tool|plant tool)\b/i
};

const CROSS_DEPARTMENT_EXCLUSIONS=[
  {department:"gifts",rx:/\b(necklace|pendant|choker|earring|bracelet|bangle|jewelry|jewellery|handbag|purse|tote|crossbody|backpack|wallet|belt|scarf|shawl|hat|cap|beanie|sock|hair clip|hairpin|headband|scrunchie|watch)\b/i,reason:"CORE_PRODUCT_IS_NOT_GIFT"},
  {department:"accessories",rx:/\b(dog|cat|pet|puppy|kitten)\b.{0,50}\b(bandana|scarf|collar|leash|harness|bed|house|coat|shirt|hoodie)\b/i,reason:"PET_PRODUCT_NOT_FASHION_ACCESSORY"},
  {department:"accessories",rx:/\b(baby|newborn|infant|nappy|diaper)\b.{0,50}\b(bag|carrier|romper|onesie|bodysuit|stroller)\b/i,reason:"BABY_PRODUCT_NOT_GENERAL_ACCESSORY"},
  {department:"sports",rx:/\b(watch|wristwatch)\b/i,reason:"WATCH_NOT_SPORTS_BY_KEYWORD_ALONE"}
];

function cleanText(v){return String(v||"").replace(MARKETING_TAGS," ").replace(/\s+/g," ").trim();}
function identityText(p){return cleanText([p.title,p.source_category,p.category,p.description].filter(Boolean).join(" "));}

function classifyProduct(product={}){
  const raw=[product.title,product.source_category,product.category,product.description].filter(Boolean).join(" ");
  if(BLOCKED.test(raw)) return {status:"BLOCK",reason:"POLICY_BLOCKED_TERM",production_exposure:false};

  const text=identityText(product);
  const proposedDepartment=String(product.proposed_department||product.department||"").trim();
  const proposedCategory=String(product.proposed_category||product.category||"").trim();

  const matches=RULES.filter(r=>r.rx.test(text));
  const high=matches[0]||null;

  if(matches.length>1){
    const unique=new Set(matches.map(x=>x.department+"/"+String(x.category)));
    if(unique.size>1){
      return {
        status:"TAXONOMY_REVIEW",
        reason:"MULTIPLE_CORE_IDENTITIES",
        candidates:matches.slice(0,6).map(x=>({rule:x.id,department:x.department,category:x.category})),
        production_exposure:false
      };
    }
  }

  if(!high){
    const routeKey=proposedDepartment+"/"+proposedCategory;
    const proposedRule=PROPOSED_ROUTE_RULES[routeKey];
    if(proposedRule && proposedRule.test(text)){
      return {
        status:"PASS",
        canonical_department:proposedDepartment,
        canonical_category:proposedCategory,
        matched_rule:"PROPOSED_ROUTE_SEMANTIC_PASS",
        production_exposure:false
      };
    }
    return {
      status:"TAXONOMY_REVIEW",
      reason:"NO_HIGH_CONFIDENCE_CORE_IDENTITY",
      proposed_department:proposedDepartment||null,
      proposed_category:proposedCategory||null,
      production_exposure:false
    };
  }

  const cross=CROSS_DEPARTMENT_EXCLUSIONS.find(x=>x.department===proposedDepartment&&x.rx.test(text));
  if(high.review){
    return {
      status:"TAXONOMY_REVIEW",
      reason:"CORE_IDENTITY_NEEDS_CANONICAL_CATEGORY",
      preferred_department:high.department,
      matched_rule:high.id,
      production_exposure:false
    };
  }

  if(cross || proposedDepartment!==high.department || (proposedCategory && proposedCategory!==high.category)){
    return {
      status:"REMAP",
      reason:cross?.reason||"PROPOSED_ROUTE_CONFLICTS_WITH_CORE_IDENTITY",
      canonical_department:high.department,
      canonical_category:high.category,
      matched_rule:high.id,
      source_route:{department:proposedDepartment||null,category:proposedCategory||null},
      production_exposure:false
    };
  }

  return {
    status:"PASS",
    canonical_department:high.department,
    canonical_category:high.category,
    matched_rule:high.id,
    production_exposure:false
  };
}

module.exports={classifyProduct,cleanText,RULES,PROPOSED_ROUTE_RULES,CROSS_DEPARTMENT_EXCLUSIONS};
